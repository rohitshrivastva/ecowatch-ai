from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class HistoryRecord(BaseModel):
    id: int
    location_id: int
    aqi: int
    temperature: float
    humidity: int
    ndvi_score: float
    risk_score: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class HistoryListResponse(BaseModel):
    items: list[HistoryRecord]
    total: int
    page: int
    page_size: int


class TrendMetric(BaseModel):
    metric: str
    current: float
    previous: float
    change_pct: float
    anomaly: Optional[str] = None


class TrendsResponse(BaseModel):
    location_id: int
    period: str
    metrics: list[TrendMetric]
    series: dict[str, list[dict]]


class ComparisonResponse(BaseModel):
    location_id: int
    period: str
    comparisons: list[TrendMetric]
