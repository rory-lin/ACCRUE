from pydantic import BaseModel
from typing import Optional


class Account(BaseModel):
    id: int
    name: str
    type: str
    balance: float
    initial_balance: float
    icon: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class CreateAccountRequest(BaseModel):
    name: str
    type: str
    initial_balance: float = 0
    icon: str = ""


class UpdateAccountRequest(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    icon: Optional[str] = None
