from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.history import ComparisonResponse, HistoryListResponse, TrendsResponse
from app.services.history import history_service

router = APIRouter(prefix="/api/v1/history", tags=["history"])


@router.get("/trends", response_model=TrendsResponse)
async def get_trends(
    location_id: int = Query(..., description="Location ID"),
    period: str = Query("7d", pattern="^(24h|7d|30d|1y)$"),
    session: AsyncSession = Depends(get_db),
):
    return await history_service.get_trends(session, location_id, period)


@router.get("/comparison", response_model=ComparisonResponse)
async def get_comparison(
    location_id: int = Query(..., description="Location ID"),
    period: str = Query("7d", pattern="^(24h|7d|30d|1y)$"),
    session: AsyncSession = Depends(get_db),
):
    return await history_service.get_comparison(session, location_id, period)


@router.get("/{location_id}", response_model=HistoryListResponse)
async def get_location_history(
    location_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: AsyncSession = Depends(get_db),
):
    items, total = await history_service.list_history(
        session, location_id, page, page_size, start_date, end_date
    )
    return HistoryListResponse(items=items, total=total, page=page, page_size=page_size)
