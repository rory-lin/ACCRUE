from dao import stats_dao
from db.database import get_connection
from utils.cache import ttl_cache, invalidate_cache


@ttl_cache("stats_summary", ttl=60)
def get_summary(date_from: str, date_to: str) -> list:
    conn = get_connection()
    try:
        return stats_dao.get_summary(conn, date_from, date_to)
    finally:
        conn.close()


@ttl_cache("stats_by_category", ttl=60)
def get_by_category(type_: str, date_from: str, date_to: str) -> list:
    conn = get_connection()
    try:
        return stats_dao.get_by_category(conn, type_, date_from, date_to)
    finally:
        conn.close()


@ttl_cache("stats_trend", ttl=60)
def get_trend(granularity: str, date_from: str, date_to: str) -> list:
    conn = get_connection()
    try:
        if granularity == "monthly":
            return stats_dao.get_trend_monthly(conn, date_from, date_to)
        return stats_dao.get_trend_daily(conn, date_from, date_to)
    finally:
        conn.close()


@ttl_cache("stats_balance", ttl=60)
def get_balance_overview() -> list:
    conn = get_connection()
    try:
        return stats_dao.get_balance_overview(conn)
    finally:
        conn.close()


def invalidate_stats_cache():
    """Invalidate all stats caches. Call when transactions change."""
    invalidate_cache("stats_summary", "stats_by_category", "stats_trend", "stats_balance")
