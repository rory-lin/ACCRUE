import pymysql


def find_all(conn: pymysql.Connection) -> list[dict]:
    """Return all accounts."""
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM accounts ORDER BY id")
        rows = cursor.fetchall()
    for row in rows:
        if "balance" in row and row["balance"] is not None:
            row["balance"] = float(row["balance"])
        if "initial_balance" in row and row["initial_balance"] is not None:
            row["initial_balance"] = float(row["initial_balance"])
    return rows


def find_by_id(conn: pymysql.Connection, account_id: int) -> dict | None:
    """Return a single account by id, or None."""
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM accounts WHERE id = %s", (account_id,))
        row = cursor.fetchone()
    if row is None:
        return None
    if "balance" in row and row["balance"] is not None:
        row["balance"] = float(row["balance"])
    if "initial_balance" in row and row["initial_balance"] is not None:
        row["initial_balance"] = float(row["initial_balance"])
    return row


def insert(
    conn: pymysql.Connection,
    name: str,
    type_: str,
    initial_balance: float,
    icon: str,
) -> int:
    """Insert a new account and return the new row id."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO accounts (name, type, balance, initial_balance, icon)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (name, type_, initial_balance, initial_balance, icon),
        )
        return cursor.lastrowid


def update(conn: pymysql.Connection, account_id: int, **fields) -> bool:
    """Update an account with the given fields. Returns True if a row was updated."""
    if not fields:
        return False

    set_clauses = []
    values = []
    for key, value in fields.items():
        set_clauses.append(f"{key} = %s")
        values.append(value)

    values.append(account_id)
    sql = f"UPDATE accounts SET {', '.join(set_clauses)} WHERE id = %s"
    with conn.cursor() as cursor:
        cursor.execute(sql, values)
        return cursor.rowcount > 0


def delete(conn: pymysql.Connection, account_id: int) -> bool:
    """Delete an account by id. Returns True if a row was deleted."""
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM accounts WHERE id = %s", (account_id,))
        return cursor.rowcount > 0


def update_balance(conn: pymysql.Connection, account_id: int, delta: float) -> None:
    """Adjust an account balance by delta (positive or negative)."""
    with conn.cursor() as cursor:
        cursor.execute(
            "UPDATE accounts SET balance = balance + %s WHERE id = %s",
            (delta, account_id),
        )
