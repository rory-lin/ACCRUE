from dao import stats_dao
from db.database import get_connection


def get_summary(date_from: str, date_to: str) -> list:
    conn = get_connection()
    try:
        return stats_dao.get_summary(conn, date_from, date_to)
    finally:
        conn.close()


def get_by_category(type_: str, date_from: str, date_to: str) -> list:
    conn = get_connection()
    try:
        return stats_dao.get_by_category(conn, type_, date_from, date_to)
    finally:
        conn.close()


def get_trend(granularity: str, date_from: str, date_to: str) -> list:
    conn = get_connection()
    try:
        if granularity == "monthly":
            return stats_dao.get_trend_monthly(conn, date_from, date_to)
        return stats_dao.get_trend_daily(conn, date_from, date_to)
    finally:
        conn.close()


def get_balance_overview() -> list:
    conn = get_connection()
    try:
        return stats_dao.get_balance_overview(conn)
    finally:
        conn.close()
