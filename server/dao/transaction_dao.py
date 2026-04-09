import json

import pymysql
from models.transaction import TransactionQuery


def find_all(
    conn: pymysql.Connection, query: TransactionQuery
) -> tuple[list[dict], int]:
    """
    Return (items, total) for transactions matching the query.
    Supports filtering by type, category_id, account_id, date range, and pagination.
    JOINs with categories and accounts to include names.
    """
    conditions = []
    params = []

    if query.type is not None:
        conditions.append("t.type = %s")
        params.append(query.type.value)

    if query.category_id is not None:
        # Match both main category and sub-category
        conditions.append("(t.category_id = %s OR t.sub_category_id = %s)")
        params.extend([query.category_id, query.category_id])

    if query.account_id is not None:
        conditions.append("t.account_id = %s")
        params.append(query.account_id)

    if query.date_from is not None:
        conditions.append("t.date >= %s")
        params.append(query.date_from)

    if query.date_to is not None:
        conditions.append("t.date <= %s")
        params.append(query.date_to)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    # Count total matching rows
    count_sql = f"SELECT COUNT(*) AS cnt FROM transactions t {where_clause}"
    with conn.cursor() as cursor:
        cursor.execute(count_sql, params)
        total = cursor.fetchone()["cnt"]

    # Fetch paginated results with JOINs
    data_sql = f"""
        SELECT
            t.*,
            c.name AS category_name,
            sc.name AS sub_category_name,
            a.name AS account_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN categories sc ON t.sub_category_id = sc.id
        LEFT JOIN accounts a ON t.account_id = a.id
        {where_clause}
        ORDER BY t.date DESC, t.id DESC
        LIMIT %s OFFSET %s
    """

    offset = (query.page - 1) * query.page_size
    data_params = params + [query.page_size, offset]

    with conn.cursor() as cursor:
        cursor.execute(data_sql, data_params)
        items = cursor.fetchall()

    # Convert DECIMAL amounts and parse JSON tags
    for item in items:
        if "amount" in item and item["amount"] is not None:
            item["amount"] = float(item["amount"])
        if "tags" in item and item["tags"] is not None:
            if isinstance(item["tags"], str):
                item["tags"] = json.loads(item["tags"])

    return items, total


def find_by_id(conn: pymysql.Connection, transaction_id: int) -> dict | None:
    """Return a single transaction by id with joined names, or None."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                t.*,
                c.name AS category_name,
                sc.name AS sub_category_name,
                a.name AS account_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN categories sc ON t.sub_category_id = sc.id
            LEFT JOIN accounts a ON t.account_id = a.id
            WHERE t.id = %s
            """,
            (transaction_id,),
        )
        row = cursor.fetchone()
    if row is None:
        return None
    if "amount" in row and row["amount"] is not None:
        row["amount"] = float(row["amount"])
    if "tags" in row and row["tags"] is not None:
        if isinstance(row["tags"], str):
            row["tags"] = json.loads(row["tags"])
    return row


def insert(
    conn: pymysql.Connection,
    type_: str,
    amount: float,
    category_id: int,
    sub_category_id: int | None,
    account_id: int,
    date: str,
    note: str,
    tags: str,
    expense_nature: str | None = None,
) -> int:
    """Insert a new transaction and return the new row id. tags should be a JSON string."""
    # If tags is already a string, ensure it's valid JSON for MySQL JSON column
    if isinstance(tags, str):
        tags_json = tags
    else:
        tags_json = json.dumps(tags)

    with conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO transactions (type, amount, category_id, sub_category_id, account_id, date, note, tags, expense_nature)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (type_, amount, category_id, sub_category_id, account_id, date, note, tags_json, expense_nature),
        )
        return cursor.lastrowid


def update(conn: pymysql.Connection, transaction_id: int, **fields) -> bool:
    """Update a transaction with the given fields. Returns True if a row was updated."""
    if not fields:
        return False

    set_clauses = []
    values = []
    for key, value in fields.items():
        # Convert tags to JSON string for MySQL JSON column
        if key == "tags" and not isinstance(value, str):
            value = json.dumps(value)
        set_clauses.append(f"{key} = %s")
        values.append(value)

    values.append(transaction_id)
    sql = f"UPDATE transactions SET {', '.join(set_clauses)} WHERE id = %s"
    with conn.cursor() as cursor:
        cursor.execute(sql, values)
        return cursor.rowcount > 0


def delete(conn: pymysql.Connection, transaction_id: int) -> bool:
    """Delete a transaction by id. Returns True if a row was deleted."""
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM transactions WHERE id = %s", (transaction_id,))
        return cursor.rowcount > 0
