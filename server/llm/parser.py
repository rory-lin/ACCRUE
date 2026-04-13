import json
from llm.client import chat
from dao import category_dao, account_dao
from db.database import get_connection


def _build_category_tree_text(conn) -> str:
    """Build category tree text for the LLM prompt."""
    lines = []
    for type_ in ("expense", "income"):
        all_cats = category_dao.find_all(conn, type_)
        type_label = "支出" if type_ == "expense" else "收入"
        lines.append(f"{type_label}分类：")
        # Build children map once
        children_map = {}
        for c in all_cats:
            pid = c.get("parent_id")
            if pid is not None:
                children_map.setdefault(pid, []).append(c)
        # Only list root categories (parent_id is None)
        for cat in all_cats:
            if cat.get("parent_id") is not None:
                continue
            sub_text = ""
            children = children_map.get(cat["id"], [])
            if children:
                sub_names = "、".join(c["name"] for c in children)
                sub_text = f"（含子分类：{sub_names}）"
            # Include expense_nature for expense categories
            nature_text = ""
            if cat.get("expense_nature"):
                nature_map = {"fixed": "固定支出", "variable": "可变支出", "discretionary": "非必要支出"}
                nature_text = f"[默认属性：{nature_map.get(cat['expense_nature'], cat['expense_nature'])}]"
            lines.append(f"  - {cat['name']}{sub_text}{nature_text}")
    return "\n".join(lines)


def _build_account_text(conn) -> str:
    """Build account list text for the LLM prompt."""
    with conn.cursor() as cursor:
        cursor.execute("SELECT name FROM accounts")
        rows = cursor.fetchall()
    return "、".join(r["name"] for r in rows)


def parse_transaction(user_input: str, today_str: str) -> dict:
    """Parse natural language input into a transaction structure."""
    conn = get_connection()
    try:
        category_text = _build_category_tree_text(conn)
        account_text = _build_account_text(conn)
    finally:
        conn.close()

    prompt = f"""你是一个记账助手。用户会输入一句话描述一笔收入或支出，你需要提取以下信息并返回JSON。

规则：
1. 如果没有明确说"收入"或类似词，默认为支出（expense）。
2. 金额从文本中提取数字。
3. 根据描述推断分类，必须从下面的分类列表中选择最匹配的，子分类也必须从列表中选择，不要自创分类名。
4. 日期：如果用户说了"今天"/"昨天"/具体日期，提取日期；否则默认今天（用{today_str}）。
5. 账户：如果提到具体支付方式，从下面的账户列表中匹配；否则为null。
6. 支出属性：如果是支出，根据描述判断属性。固定支出(fixed)如房租、保险；可变支出(variable)如水电、餐饮；非必要支出(discretionary)如旅游、娱乐。如果分类标注了默认属性则使用默认属性。
7. 无法确定的信息设为null。

{category_text}

账户：{account_text}

返回格式（严格JSON，不要其他文字）：
{{
  "type": "expense" 或 "income",
  "amount": 数字,
  "category": "一级分类名称",
  "subCategory": "二级分类名称或null",
  "account": "账户名称或null",
  "date": "YYYY-MM-DD",
  "note": "补充备注或null",
  "expenseNature": "fixed" 或 "variable" 或 "discretionary" 或 null
}}"""

    response = chat(prompt, user_input)

    # Extract JSON from response
    text = response.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    parsed = json.loads(text)

    # Match category to database IDs
    conn = get_connection()
    try:
        cat_type = parsed.get("type", "expense")
        cat_name = parsed.get("category")
        sub_cat_name = parsed.get("subCategory")
        account_name = parsed.get("account")
        expense_nature = parsed.get("expenseNature")

        category_id = None
        sub_category_id = None
        account_id = None

        if cat_name:
            cat = category_dao.find_by_name(conn, cat_name, cat_type)
            if cat:
                category_id = cat["id"]

        if sub_cat_name and category_id:
            sub_cat = category_dao.find_sub_by_name(conn, sub_cat_name, category_id)
            if not sub_cat:
                sub_cat = category_dao.find_sub_by_name_fuzzy(conn, sub_cat_name, category_id)
            if sub_cat:
                sub_category_id = sub_cat["id"]
                # Sub-category may have its own expense_nature
                if not expense_nature and sub_cat.get("expense_nature"):
                    expense_nature = sub_cat["expense_nature"]

        # If no expense_nature from AI, inherit from category
        if not expense_nature and category_id:
            cat = category_dao.find_by_id(conn, category_id)
            if cat and cat.get("expense_nature"):
                expense_nature = cat["expense_nature"]

        if account_name:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM accounts WHERE name LIKE %s", (f"%{account_name}%",))
                acc = cursor.fetchone()
                if acc:
                    account_id = acc["id"]

        return {
            "type": parsed.get("type", "expense"),
            "amount": float(parsed.get("amount", 0)),
            "category_id": category_id,
            "sub_category_id": sub_category_id,
            "account_id": account_id,
            "date": parsed.get("date") or today_str,
            "note": parsed.get("note"),
            "expense_nature": expense_nature if cat_type == "expense" else None,
        }
    finally:
        conn.close()
