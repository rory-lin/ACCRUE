from fastapi import APIRouter, Query

from models.common import ApiResponse
from service import stats_service

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/summary")
async def get_summary(
    date_from: str = Query(...),
    date_to: str = Query(...),
):
    result = stats_service.get_summary(date_from, date_to)
    return ApiResponse(data=result)


@router.get("/by-category")
async def get_by_category(
    type: str = Query(...),
    date_from: str = Query(...),
    date_to: str = Query(...),
):
    result = stats_service.get_by_category(type, date_from, date_to)
    return ApiResponse(data=result)


@router.get("/trend")
async def get_trend(
    granularity: str = Query("daily"),
    date_from: str = Query(...),
    date_to: str = Query(...),
):
    result = stats_service.get_trend(granularity, date_from, date_to)
    return ApiResponse(data=result)


@router.get("/balance-overview")
async def get_balance_overview():
    result = stats_service.get_balance_overview()
    return ApiResponse(data=result)
