import pymysql
from dbutils.pooled_db import PooledDB

_pool: PooledDB | None = None


def get_pool() -> PooledDB:
    global _pool
    if _pool is not None:
        return _pool

    from config import get_config

    mysql_cfg = get_config().get("mysql", {})
    _pool = PooledDB(
        creator=pymysql,
        maxconnections=10,
        mincached=0,
        host=mysql_cfg.get("host", "localhost"),
        port=mysql_cfg.get("port", 3306),
        user=mysql_cfg.get("user", "root"),
        password=mysql_cfg.get("password", ""),
        database=mysql_cfg.get("database", "accrue"),
        charset=mysql_cfg.get("charset", "utf8mb4"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )
    return _pool


def get_connection():
    """Get a MySQL connection from the pool."""
    return get_pool().connection()


def init_db():
    """Initialize database: run migrations and seed data."""
    try:
        conn = get_connection()
        try:
            from db.migrations import run_migrations
            from db.seed import run_seed

            run_migrations(conn)
            run_seed(conn)
        finally:
            conn.close()
    except Exception as e:
        print(f"Warning: Database init failed: {e}")
        print("The app will start, but database features may not work until the connection is fixed.")
