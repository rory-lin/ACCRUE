from fastapi import APIRouter, HTTPException

from models.account import CreateAccountRequest, UpdateAccountRequest
from models.common import ApiResponse
from service import account_service

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("")
async def list_accounts():
    result = account_service.list_accounts()
    return ApiResponse(data=result)


@router.get("/{account_id}")
async def get_account(account_id: int):
    result = account_service.get_account(account_id)
    if not result:
        raise HTTPException(status_code=404, detail="Account not found")
    return ApiResponse(data=result)


@router.post("")
async def create_account(data: CreateAccountRequest):
    result = account_service.create_account(data)
    return ApiResponse(data=result)


@router.put("/{account_id}")
async def update_account(account_id: int, data: UpdateAccountRequest):
    result = account_service.update_account(account_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Account not found")
    return ApiResponse(data=result)


@router.delete("/{account_id}")
async def delete_account(account_id: int):
    success = account_service.delete_account(account_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete account")
    return ApiResponse(data={"deleted": True})
