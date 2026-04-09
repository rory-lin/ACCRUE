import pymysql


def find_by_month(conn: pymysql.Connection, month: str) -> list[dict]:
    """Return all budgets for a given month (YYYY-MM)."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT b.*, c.name AS category_name
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.month = %s
            ORDER BY c.name
            """,
            (month,),
        )
        rows = cursor.fetchall()
    for row in rows:
        if "amount" in row and row["amount"] is not None:
            row["amount"] = float(row["amount"])
    return rows


def upsert(
    conn: pymysql.Connection, category_id: int, month: str, amount: float
) -> int:
    """
    Insert or update a budget for a category/month combination.
    Returns the budget id.
    """
    with conn.cursor() as cursor:
        # Check if a budget already exists for this category and month
        cursor.execute(
            "SELECT id FROM budgets WHERE category_id = %s AND month = %s",
            (category_id, month),
        )
        row = cursor.fetchone()

        if row:
            budget_id = row["id"]
            cursor.execute(
                "UPDATE budgets SET amount = %s WHERE id = %s",
                (amount, budget_id),
            )
            return budget_id
        else:
            cursor.execute(
                """
                INSERT INTO budgets (category_id, month, amount)
                VALUES (%s, %s, %s)
                """,
                (category_id, month, amount),
            )
            return cursor.lastrowid


def delete(conn: pymysql.Connection, budget_id: int) -> bool:
    """Delete a budget by id. Returns True if a row was deleted."""
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM budgets WHERE id = %s", (budget_id,))
        return cursor.rowcount > 0


def get_actual_spent(
    conn: pymysql.Connection, category_id: int, month: str
) -> float:
    """
    Return the total amount spent for a category in a given month.
    Matches transactions where category_id or sub_category_id equals the given category_id,
    and the transaction date falls within the month.
    """
    month_start = month + "-01"
    # Calculate the first day of the next month
    year, mon = month.split("-")
    next_month_year = int(year) + (int(mon) // 12)
    next_month_mon = (int(mon) % 12) + 1
    month_end = f"{next_month_year:04d}-{next_month_mon:02d}-01"

    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM transactions
            WHERE type = 'expense'
              AND (category_id = %s OR sub_category_id = %s)
              AND date >= %s AND date < %s
            """,
            (category_id, category_id, month_start, month_end),
        )
        row = cursor.fetchone()
    if row and row["total"] is not None:
        return float(row["total"])
    return 0.0
