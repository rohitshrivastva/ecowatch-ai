from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FavoriteCreate(BaseModel):
    location_name: str = Field(..., min_length=1, max_length=255)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class FavoriteUpdate(BaseModel):
    location_name: Optional[str] = Field(None, min_length=1, max_length=255)


class FavoriteSummary(BaseModel):
    aqi: Optional[int] = None
    temperature: Optional[float] = None
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None


class FavoriteResponse(BaseModel):
    id: int
    location_name: str
    latitude: float
    longitude: float
    location_id: Optional[int] = None
    created_at: datetime
    summary: Optional[FavoriteSummary] = None

    model_config = {"from_attributes": True}
