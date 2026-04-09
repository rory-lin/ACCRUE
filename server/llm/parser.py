import json
from llm.client import chat
from llm.prompts import TRANSACTION_PARSE_PROMPT
from dao import category_dao, account_dao
from db.database import get_connection


def parse_transaction(user_input: str, today_str: str) -> dict:
    """Parse natural language input into a transaction structure."""
    prompt = TRANSACTION_PARSE_PROMPT.replace("用今天的日期", f"用{today_str}")
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
            sub_cat = category_dao.find_sub_by_name(conn, sub_cat_name, category_id)
            if sub_cat:
                sub_category_id = sub_cat["id"]

        if account_name:
            # Find account by name (fuzzy match)
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
