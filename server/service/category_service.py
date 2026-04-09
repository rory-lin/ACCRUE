from collections import defaultdict
from typing import Optional

from dao import category_dao
from db.database import get_connection
from models.category import CategoryTreeNode, CreateCategoryRequest, UpdateCategoryRequest


def _build_tree(flat_list: list[dict]) -> list[CategoryTreeNode]:
    """Build a tree structure from a flat list of categories."""
    children_map: dict[int | None, list[dict]] = defaultdict(list)
    for cat in flat_list:
        parent = cat.get("parent_id")
        children_map[parent].append(cat)

    def _make_node(cat: dict) -> CategoryTreeNode:
        cat_id = cat["id"]
        child_dicts = children_map.get(cat_id, [])
        children = [_make_node(child) for child in child_dicts]
        return CategoryTreeNode(
            id=cat["id"],
            name=cat["name"],
            type=cat["type"],
            icon=cat["icon"],
            sort_order=cat["sort_order"],
            is_system=cat["is_system"],
            expense_nature=cat.get("expense_nature"),
            children=children,
        )

    # Root nodes have parent_id = None
    roots = children_map.get(None, [])
    return [_make_node(root) for root in roots]


def list_categories(type_: str | None = None) -> list[CategoryTreeNode]:
    conn = get_connection()
    try:
        flat = category_dao.find_all(conn, type_=type_)
        return _build_tree(flat)
    finally:
        conn.close()


def get_category(category_id: int) -> dict | None:
    conn = get_connection()
    try:
        return category_dao.find_by_id(conn, category_id)
    finally:
        conn.close()


def create_category(data: CreateCategoryRequest) -> dict:
    conn = get_connection()
    try:
        # Validate parent exists if parent_id is given
        if data.parent_id is not None:
            parent = category_dao.find_by_id(conn, data.parent_id)
            if parent is None:
                raise ValueError("Parent category not found")

        # Get max sort_order for this type and increment
        max_order = category_dao.get_max_sort_order(conn, data.type)

        new_id = category_dao.insert(
            conn,
            name=data.name,
            type_=data.type,
            parent_id=data.parent_id,
            icon=data.icon,
            sort_order=max_order + 1,
            is_system=0,
        )
        conn.commit()
        return category_dao.find_by_id(conn, new_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_category(category_id: int, data: UpdateCategoryRequest) -> dict:
    fields = {}
    if data.name is not None:
        fields["name"] = data.name
    if data.icon is not None:
        fields["icon"] = data.icon
    if data.sort_order is not None:
        fields["sort_order"] = data.sort_order

    # Support expense_nature update
    if hasattr(data, 'expense_nature') and data.expense_nature is not None:
        fields["expense_nature"] = data.expense_nature

    if not fields:
        conn = get_connection()
        try:
            return category_dao.find_by_id(conn, category_id)
        finally:
            conn.close()

    conn = get_connection()
    try:
        category_dao.update(conn, category_id, **fields)
        conn.commit()
        return category_dao.find_by_id(conn, category_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def delete_category(category_id: int) -> bool:
    conn = get_connection()
    try:
        # Check category exists and is not system
        cat = category_dao.find_by_id(conn, category_id)
        if cat is None:
            return False
        if cat["is_system"] == 1:
            return False

        # Check no transactions reference this category
        if category_dao.has_transactions(conn, category_id):
            return False

        success = category_dao.delete(conn, category_id)
        if success:
            conn.commit()
        return success
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
