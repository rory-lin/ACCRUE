import json
from llm.client import chat
from dao import category_dao, account_dao
from db.database import get_connection


def _build_category_tree_text(conn) -> str:
    """Build category tree text for the LLM prompt."""
    lines = []
    for type_ in ("expense", "income"):
        cats = category_dao.find_all(conn, type_)
        type_label = "支出" if type_ == "expense" else "收入"
        lines.append(f"{type_label}分类：")
        for cat in cats:
            sub_text = ""
            subs = category_dao.find_all(conn, type_)
            # Find children by parent_id
            children = [c for c in subs if c.get("parent_id") == cat["id"]]
            if children:
                sub_names = "、".join(c["name"] for c in children)
                sub_text = f"（含子分类：{sub_names}）"
            lines.append(f"  - {cat['name']}{sub_text}")
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
        # Dynamically build prompt with current categories and accounts
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
6. 无法确定的信息设为null。

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
  "note": "补充备注或null"
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

        category_id = None
        sub_category_id = None
        account_id = None

        if cat_name:
            cat = category_dao.find_by_name(conn, cat_name, cat_type)
            if cat:
                category_id = cat["id"]

        if sub_cat_name and category_id:
            # Try exact match first, then fuzzy
            sub_cat = category_dao.find_sub_by_name(conn, sub_cat_name, category_id)
            if not sub_cat:
                sub_cat = category_dao.find_sub_by_name_fuzzy(conn, sub_cat_name, category_id)
            if sub_cat:
                sub_category_id = sub_cat["id"]

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
        }
    finally:
        conn.close()
