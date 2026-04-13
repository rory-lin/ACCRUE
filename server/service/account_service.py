from dao import account_dao
from dao import transaction_dao
from db.database import get_connection
from models.account import CreateAccountRequest, UpdateAccountRequest
from utils.cache import ttl_cache, invalidate_cache


@ttl_cache("accounts_list", ttl=120)
def list_accounts() -> list:
    conn = get_connection()
    try:
        return account_dao.find_all(conn)
    finally:
        conn.close()


def get_account(account_id: int) -> dict | None:
    conn = get_connection()
    try:
        return account_dao.find_by_id(conn, account_id)
    finally:
        conn.close()


def create_account(data: CreateAccountRequest) -> dict:
    conn = get_connection()
    try:
        new_id = account_dao.insert(
            conn,
            name=data.name,
            type_=data.type,
            initial_balance=data.initial_balance,
            icon=data.icon,
        )
        conn.commit()
        invalidate_cache("accounts_list")
        return account_dao.find_by_id(conn, new_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_account(account_id: int, data: UpdateAccountRequest) -> dict:
    fields = {}
    if data.name is not None:
        fields["name"] = data.name
    if data.type is not None:
        fields["type"] = data.type
    if data.icon is not None:
        fields["icon"] = data.icon

    if not fields:
        conn = get_connection()
        try:
            return account_dao.find_by_id(conn, account_id)
        finally:
            conn.close()

    conn = get_connection()
    try:
        account_dao.update(conn, account_id, **fields)
        conn.commit()
        invalidate_cache("accounts_list")
        return account_dao.find_by_id(conn, account_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def delete_account(account_id: int) -> bool:
    conn = get_connection()
    try:
        # Check if any transactions reference this account
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM transactions WHERE account_id = %s LIMIT 1",
                (account_id,),
            )
            if cursor.fetchone() is not None:
                return False

        success = account_dao.delete(conn, account_id)
        if success:
            conn.commit()
            invalidate_cache("accounts_list")
        return success
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
