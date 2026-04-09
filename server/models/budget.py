from pydantic import BaseModel
from typing import Optional


class Budget(BaseModel):
    id: int
    category_id: int
    month: str  # YYYY-MM
    amount: float
    created_at: str


class CreateBudgetRequest(BaseModel):
    category_id: int
    month: str
    amount: float


class BudgetStatus(BaseModel):
    category_id: int
    category_name: str
    budget_amount: float
    actual_spent: float
    percentage: float
    is_over: bool
