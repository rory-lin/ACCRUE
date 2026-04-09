import pymysql
from typing import Optional


def find_all(conn: pymysql.Connection, type_: Optional[str] = None) -> list[dict]:
    """Return all categories, optionally filtered by type."""
    with conn.cursor() as cursor:
        if type_ is not None:
            cursor.execute(
                "SELECT * FROM categories WHERE type = %s ORDER BY sort_order, id",
                (type_,),
            )
        else:
            cursor.execute("SELECT * FROM categories ORDER BY sort_order, id")
        return cursor.fetchall()


def find_by_id(conn: pymysql.Connection, category_id: int) -> dict | None:
    """Return a single category by id, or None."""
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT * FROM categories WHERE id = %s", (category_id,)
        )
        return cursor.fetchone()


def find_by_name(
    conn: pymysql.Connection, name: str, type_: Optional[str] = None
) -> dict | None:
    """Find a top-level category by name, optionally filtered by type."""
    with conn.cursor() as cursor:
        if type_ is not None:
            cursor.execute(
                "SELECT * FROM categories WHERE name = %s AND type = %s AND parent_id IS NULL",
                (name, type_),
            )
        else:
            cursor.execute(
                "SELECT * FROM categories WHERE name = %s AND parent_id IS NULL",
                (name,),
            )
        return cursor.fetchone()


def find_sub_by_name(
    conn: pymysql.Connection, name: str, parent_id: int
) -> dict | None:
    """Find a sub-category by name under a given parent."""
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT * FROM categories WHERE name = %s AND parent_id = %s",
            (name, parent_id),
        )
        return cursor.fetchone()


def insert(
    conn: pymysql.Connection,
    name: str,
    type_: str,
    parent_id: Optional[int],
    icon: str,
    sort_order: int,
    is_system: int,
) -> int:
    """Insert a new category and return the new row id."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO categories (name, type, parent_id, icon, sort_order, is_system)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (name, type_, parent_id, icon, sort_order, is_system),
        )
        return cursor.lastrowid


def update(conn: pymysql.Connection, category_id: int, **fields) -> bool:
    """Update a category with the given fields. Returns True if a row was updated."""
    if not fields:
        return False

    set_clauses = []
    values = []
    for key, value in fields.items():
        set_clauses.append(f"{key} = %s")
        values.append(value)

    values.append(category_id)
    sql = f"UPDATE categories SET {', '.join(set_clauses)} WHERE id = %s"
    with conn.cursor() as cursor:
        cursor.execute(sql, values)
        return cursor.rowcount > 0


def delete(conn: pymysql.Connection, category_id: int) -> bool:
    """Delete a category by id. Returns True if a row was deleted."""
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM categories WHERE id = %s", (category_id,))
        return cursor.rowcount > 0


def has_transactions(conn: pymysql.Connection, category_id: int) -> bool:
    """Check if any transactions reference this category (as category or sub-category)."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT 1 FROM transactions
            WHERE category_id = %s OR sub_category_id = %s
            LIMIT 1
            """,
            (category_id, category_id),
        )
        return cursor.fetchone() is not None


def get_max_sort_order(conn: pymysql.Connection, type_: str) -> int:
    """Get the maximum sort_order for categories of a given type. Returns 0 if none exist."""
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM categories WHERE type = %s",
            (type_,),
        )
        row = cursor.fetchone()
        return row["max_sort"] if row else 0
