from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from models.category import CreateCategoryRequest, UpdateCategoryRequest
from models.common import ApiResponse
from service import category_service

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
async def list_categories(type: Optional[str] = Query(None, alias="type")):
    result = category_service.list_categories(type_=type)
    return ApiResponse(data=result)


@router.get("/{category_id}")
async def get_category(category_id: int):
    result = category_service.get_category(category_id)
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    return ApiResponse(data=result)


@router.post("")
async def create_category(data: CreateCategoryRequest):
    try:
        result = category_service.create_category(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ApiResponse(data=result)


@router.put("/{category_id}")
async def update_category(category_id: int, data: UpdateCategoryRequest):
    result = category_service.update_category(category_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    return ApiResponse(data=result)


@router.delete("/{category_id}")
async def delete_category(category_id: int):
    success = category_service.delete_category(category_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete category")
    return ApiResponse(data={"deleted": True})
