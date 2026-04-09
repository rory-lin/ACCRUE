from pydantic import BaseModel
from typing import Optional


class Category(BaseModel):
    id: int
    name: str
    type: str
    parent_id: Optional[int] = None
    icon: str
    sort_order: int
    is_system: int
    expense_nature: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class CategoryTreeNode(BaseModel):
    id: int
    name: str
    type: str
    icon: str
    sort_order: int
    is_system: int
    expense_nature: Optional[str] = None
    children: list["CategoryTreeNode"] = []


class CreateCategoryRequest(BaseModel):
    name: str
    type: str
    parent_id: Optional[int] = None
    icon: str = ""
    expense_nature: Optional[str] = None


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    expense_nature: Optional[str] = None
