from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse, Response
from service import export_service

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/csv")
async def export_csv(
    date_from: str = Query(None),
    date_to: str = Query(None),
):
    content = export_service.export_csv(date_from, date_to)
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.get("/excel")
async def export_excel(
    date_from: str = Query(None),
    date_to: str = Query(None),
):
    content = export_service.export_excel(date_from, date_to)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=transactions.xlsx"},
    )
