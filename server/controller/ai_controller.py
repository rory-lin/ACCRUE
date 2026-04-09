from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.common import ApiResponse
from llm.parser import parse_transaction
from datetime import date


router = APIRouter(prefix="/api/ai", tags=["ai"])


class ParseRequest(BaseModel):
    input: str


@router.post("/parse")
async def parse(req: ParseRequest):
    try:
        today = date.today().isoformat()
        result = parse_transaction(req.input, today)
        return ApiResponse(data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 解析失败: {str(e)}")
