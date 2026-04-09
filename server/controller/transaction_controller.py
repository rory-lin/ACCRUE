from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from models.common import ApiResponse, PaginatedData
from models.transaction import (
    TransactionType,
    CreateTransactionRequest,
    UpdateTransactionRequest,
    TransactionQuery,
)
from service import transaction_service

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
async def list_transactions(
    type: Optional[TransactionType] = Query(None),
    category_id: Optional[int] = Query(None),
    account_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = TransactionQuery(
        type=type,
        category_id=category_id,
        account_id=account_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    items, total = transaction_service.list_transactions(query)
    return ApiResponse(
        data=PaginatedData(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{transaction_id}")
async def get_transaction(transaction_id: int):
    result = transaction_service.get_transaction(transaction_id)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return ApiResponse(data=result)


@router.post("")
async def create_transaction(data: CreateTransactionRequest):
    result = transaction_service.create_transaction(data)
    return ApiResponse(data=result)


@router.put("/{transaction_id}")
async def update_transaction(transaction_id: int, data: UpdateTransactionRequest):
    result = transaction_service.update_transaction(transaction_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return ApiResponse(data=result)


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: int):
    success = transaction_service.delete_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete transaction")
    return ApiResponse(data={"deleted": True})
