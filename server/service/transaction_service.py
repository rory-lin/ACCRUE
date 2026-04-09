import json

from dao import account_dao
from dao import category_dao
from dao import transaction_dao
from db.database import get_connection
from models.transaction import CreateTransactionRequest, UpdateTransactionRequest, TransactionQuery


def list_transactions(query: TransactionQuery) -> tuple[list, int]:
    conn = get_connection()
    try:
        return transaction_dao.find_all(conn, query)
    finally:
        conn.close()


def get_transaction(transaction_id: int) -> dict | None:
    conn = get_connection()
    try:
        return transaction_dao.find_by_id(conn, transaction_id)
    finally:
        conn.close()


def create_transaction(data: CreateTransactionRequest) -> dict:
    conn = get_connection()
    try:
        tags_str = json.dumps(data.tags) if data.tags else "[]"

        # Determine expense_nature: use provided value, or inherit from category
        expense_nature = data.expense_nature
        if expense_nature is None and data.type.value == "expense":
            category = category_dao.find_by_id(conn, data.category_id)
            if category and category.get("expense_nature"):
                expense_nature = category["expense_nature"]

        new_id = transaction_dao.insert(
            conn,
            type_=data.type.value,
            amount=data.amount,
            category_id=data.category_id,
            sub_category_id=data.sub_category_id,
            account_id=data.account_id,
            date=data.date,
            note=data.note,
            tags=tags_str,
            expense_nature=expense_nature,
        )

        # Update account balance: positive for income, negative for expense
        delta = data.amount if data.type.value == "income" else -data.amount
        account_dao.update_balance(conn, data.account_id, delta)

        conn.commit()
        return transaction_dao.find_by_id(conn, new_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_transaction(transaction_id: int, data: UpdateTransactionRequest) -> dict:
    conn = get_connection()
    try:
        # Get old transaction for balance adjustment
        old = transaction_dao.find_by_id(conn, transaction_id)
        if old is None:
            return None

        # Build update fields
        fields = {}
        if data.type is not None:
            fields["type"] = data.type.value
        if data.amount is not None:
            fields["amount"] = data.amount
        if data.category_id is not None:
            fields["category_id"] = data.category_id
        if data.sub_category_id is not None:
            fields["sub_category_id"] = data.sub_category_id
        if data.account_id is not None:
            fields["account_id"] = data.account_id
        if data.date is not None:
            fields["date"] = data.date
        if data.note is not None:
            fields["note"] = data.note
        if data.tags is not None:
            fields["tags"] = json.dumps(data.tags)
        if data.expense_nature is not None:
            fields["expense_nature"] = data.expense_nature

        if not fields:
            return old

        # Reverse old balance change
        old_delta = old["amount"] if old["type"] == "income" else -old["amount"]
        account_dao.update_balance(conn, old["account_id"], -old_delta)

        # Apply new values (use updated fields, fall back to old values)
        new_type = fields.get("type", old["type"])
        new_amount = fields.get("amount", old["amount"])
        new_account_id = fields.get("account_id", old["account_id"])

        new_delta = new_amount if new_type == "income" else -new_amount
        account_dao.update_balance(conn, new_account_id, new_delta)

        transaction_dao.update(conn, transaction_id, **fields)

        conn.commit()
        return transaction_dao.find_by_id(conn, transaction_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def delete_transaction(transaction_id: int) -> bool:
    conn = get_connection()
    try:
        # Get old transaction for balance reversal
        old = transaction_dao.find_by_id(conn, transaction_id)
        if old is None:
            return False

        # Reverse balance change
        old_delta = old["amount"] if old["type"] == "income" else -old["amount"]
        account_dao.update_balance(conn, old["account_id"], -old_delta)

        transaction_dao.delete(conn, transaction_id)

        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def create_transfer(data):
    conn = get_connection()
    try:
        from dao import transaction_dao, account_dao
        # Create expense record (from account)
        note = f"[转账] {data.note}" if data.note else "[转账]"
        transaction_dao.insert(
            conn, 'expense', data.amount, None, None,
            data.from_account_id, data.date, note, json.dumps([])
        )
        account_dao.update_balance(conn, data.from_account_id, -data.amount)
        # Create income record (to account)
        transaction_dao.insert(
            conn, 'income', data.amount, None, None,
            data.to_account_id, data.date, note, json.dumps([])
        )
        account_dao.update_balance(conn, data.to_account_id, data.amount)
        conn.commit()
        return {"success": True}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
