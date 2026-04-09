from fastapi import APIRouter
from pydantic import BaseModel
from models.common import ApiResponse
from service import settings_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SetSettingRequest(BaseModel):
    value: str


@router.get("/{key}")
async def get_setting(key: str):
    value = settings_service.get_setting(key)
    return ApiResponse(data={"key": key, "value": value})


@router.put("/{key}")
async def set_setting(key: str, req: SetSettingRequest):
    settings_service.set_setting(key, req.value)
    return ApiResponse(data={"key": key, "value": req.value})
