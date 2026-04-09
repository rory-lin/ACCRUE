from db.database import get_connection
from dao import settings_dao


def get_setting(key: str):
    conn = get_connection()
    try:
        return settings_dao.get_value(conn, key)
    finally:
        conn.close()


def set_setting(key: str, value: str):
    conn = get_connection()
    try:
        settings_dao.set_value(conn, key, value)
    finally:
        conn.close()
