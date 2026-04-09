import pymysql


def get_value(conn, key: str):
    with conn.cursor() as cursor:
        cursor.execute("SELECT value FROM settings WHERE `key` = %s", (key,))
        row = cursor.fetchone()
        return row["value"] if row else None


def set_value(conn, key: str, value: str):
    with conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO settings (`key`, `value`) VALUES (%s, %s) ON DUPLICATE KEY UPDATE `value` = %s",
            (key, value, value),
        )
    conn.commit()
