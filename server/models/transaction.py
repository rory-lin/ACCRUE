from pydantic import BaseModel
from typing import Optional
from enum import Enum


class TransactionType(str, Enum):
    expense = "expense"
    income = "income"


class CreateTransactionRequest(BaseModel):
    type: TransactionType
    amount: float
    category_id: int
    sub_category_id: Optional[int] = None
    account_id: int
    date: str
    note: str = ""
    tags: list[str] = []
    expense_nature: Optional[str] = None


class UpdateTransactionRequest(BaseModel):
    type: Optional[TransactionType] = None
    amount: Optional[float] = None
    category_id: Optional[int] = None
    sub_category_id: Optional[int] = None
    account_id: Optional[int] = None
    date: Optional[str] = None
    note: Optional[str] = None
    tags: Optional[list[str]] = None
    expense_nature: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    type: str
    amount: float
    category_id: int
    sub_category_id: Optional[int] = None
    account_id: int
    date: str
    note: str
    tags: str  # JSON string
    expense_nature: Optional[str] = None
    created_at: str
    updated_at: str
    category_name: Optional[str] = None
    sub_category_name: Optional[str] = None
    account_name: Optional[str] = None


class TransactionQuery(BaseModel):
    type: Optional[TransactionType] = None
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    page: int = 1
    page_size: int = 20


class TransferRequest(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    date: str
    note: str = ""
