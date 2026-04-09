import pymysql


def get_summary(
    conn: pymysql.Connection, date_from: str, date_to: str
) -> list[dict]:
    """Return total amounts grouped by type (income/expense) for a date range."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT type, SUM(amount) AS total
            FROM transactions
            WHERE date >= %s AND date <= %s
            GROUP BY type
            """,
            (date_from, date_to),
        )
        rows = cursor.fetchall()
    for row in rows:
        if "total" in row and row["total"] is not None:
            row["total"] = float(row["total"])
    return rows


def get_by_category(
    conn: pymysql.Connection, type_: str, date_from: str, date_to: str
) -> list[dict]:
    """Return totals grouped by category for a given type and date range."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                c.id AS category_id,
                c.name,
                c.type,
                SUM(t.amount) AS total,
                COUNT(*) AS count
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.type = %s AND t.date >= %s AND t.date <= %s
            GROUP BY c.id
            ORDER BY total DESC
            """,
            (type_, date_from, date_to),
        )
        rows = cursor.fetchall()
    for row in rows:
        if "total" in row and row["total"] is not None:
            row["total"] = float(row["total"])
    return rows


def get_trend_daily(
    conn: pymysql.Connection, date_from: str, date_to: str
) -> list[dict]:
    """Return daily totals grouped by type for a date range."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT date, type, SUM(amount) AS total
            FROM transactions
            WHERE date >= %s AND date <= %s
            GROUP BY date, type
            ORDER BY date
            """,
            (date_from, date_to),
        )
        rows = cursor.fetchall()
    for row in rows:
        if "total" in row and row["total"] is not None:
            row["total"] = float(row["total"])
    return rows


def get_trend_monthly(
    conn: pymysql.Connection, date_from: str, date_to: str
) -> list[dict]:
    """Return monthly totals grouped by type for a date range."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT DATE_FORMAT(date, '%%Y-%%m') AS month, type, SUM(amount) AS total
            FROM transactions
            WHERE date >= %s AND date <= %s
            GROUP BY month, type
            ORDER BY month
            """,
            (date_from, date_to),
        )
        rows = cursor.fetchall()
    for row in rows:
        if "total" in row and row["total"] is not None:
            row["total"] = float(row["total"])
    return rows


def get_balance_overview(conn: pymysql.Connection) -> list[dict]:
    """Return current balance for all accounts."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id AS account_id, name, type, balance
            FROM accounts
            ORDER BY id
            """
        )
        rows = cursor.fetchall()
    for row in rows:
        if "balance" in row and row["balance"] is not None:
            row["balance"] = float(row["balance"])
    return rows
