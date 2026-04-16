import pymysql
import os
from dbutils.pooled_db import PooledDB

_pool: PooledDB | None = None
IS_VERCEL = os.environ.get("VERCEL") == "1"


def get_pool() -> PooledDB:
    global _pool
    if _pool is not None:
        return _pool

    from config import get_config

    mysql_cfg = get_config().get("mysql", {})

    if IS_VERCEL:
        # Serverless: minimal pool, no pre-cached connections
        _pool = PooledDB(
            creator=pymysql,
            maxconnections=5,
            mincached=0,
            maxcached=2,
            host=mysql_cfg.get("host", "localhost"),
            port=mysql_cfg.get("port", 3306),
            user=mysql_cfg.get("user", "root"),
            password=mysql_cfg.get("password", ""),
            database=mysql_cfg.get("database", "accrue"),
            charset=mysql_cfg.get("charset", "utf8mb4"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False,
            connect_timeout=10,
            read_timeout=30,
            write_timeout=30,
        )
    else:
        # Local development: larger pool with pre-cached connections
        _pool = PooledDB(
            creator=pymysql,
            maxconnections=10,
            mincached=2,
            maxcached=5,
            host=mysql_cfg.get("host", "localhost"),
            port=mysql_cfg.get("port", 3306),
            user=mysql_cfg.get("user", "root"),
            password=mysql_cfg.get("password", ""),
            database=mysql_cfg.get("database", "accrue"),
            charset=mysql_cfg.get("charset", "utf8mb4"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False,
            connect_timeout=5,
            read_timeout=10,
            write_timeout=10,
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
