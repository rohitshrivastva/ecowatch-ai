from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.location import EnvironmentalHistory, Location
from app.schemas.history import ComparisonResponse, HistoryRecord, TrendMetric, TrendsResponse

PERIOD_HOURS = {
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
    "1y": 24 * 365,
}


def _utc(dt: datetime) -> datetime:
    """Normalize DB timestamps for comparison (SQLite may return naive UTC)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class HistoryService:
    async def get_or_create_location(
        self,
        session: AsyncSession,
        lat: float,
        lon: float,
        name: Optional[str] = None,
    ) -> Location:
        lat_r, lon_r = round(lat, 4), round(lon, 4)
        epsilon = 0.00015
        result = await session.execute(
            select(Location).where(
                Location.latitude.between(lat_r - epsilon, lat_r + epsilon),
                Location.longitude.between(lon_r - epsilon, lon_r + epsilon),
            )
        )
        location = result.scalar_one_or_none()
        if location:
            if name and not location.name:
                location.name = name
            return location

        location = Location(name=name, latitude=lat, longitude=lon)
        session.add(location)
        await session.flush()
        return location

    async def record_snapshot(
        self,
        session: AsyncSession,
        location_id: int,
        aqi: int,
        temperature: float,
        humidity: int,
        ndvi_score: float,
        risk_score: int,
    ) -> EnvironmentalHistory:
        row = EnvironmentalHistory(
            location_id=location_id,
            aqi=aqi,
            temperature=temperature,
            humidity=humidity,
            ndvi_score=ndvi_score,
            risk_score=risk_score,
            timestamp=datetime.now(timezone.utc),
        )
        session.add(row)
        await session.flush()
        return row

    async def ensure_seed_history(
        self,
        session: AsyncSession,
        location_id: int,
        base_aqi: int,
        base_temp: float,
        base_humidity: int,
        base_ndvi: float,
        base_risk: int,
        days: int = 30,
    ) -> None:
        count = await session.scalar(
            select(func.count())
            .select_from(EnvironmentalHistory)
            .where(EnvironmentalHistory.location_id == location_id)
        )
        if count and count >= 10:
            return

        now = datetime.now(timezone.utc)
        rng = np.random.default_rng(location_id)
        for i in range(days):
            ts = now - timedelta(days=days - i)
            session.add(
                EnvironmentalHistory(
                    location_id=location_id,
                    aqi=int(max(20, min(300, base_aqi + rng.normal(0, 15)))),
                    temperature=round(float(base_temp + rng.normal(0, 2)), 1),
                    humidity=int(max(10, min(100, base_humidity + rng.integers(-10, 10)))),
                    ndvi_score=round(float(np.clip(base_ndvi + rng.normal(0, 0.05), -0.2, 0.9)), 3),
                    risk_score=int(max(0, min(100, base_risk + rng.integers(-8, 8)))),
                    timestamp=ts,
                )
            )
        await session.flush()

    async def list_history(
        self,
        session: AsyncSession,
        location_id: int,
        page: int = 1,
        page_size: int = 50,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> tuple[list[HistoryRecord], int]:
        query = select(EnvironmentalHistory).where(
            EnvironmentalHistory.location_id == location_id
        )
        if start:
            query = query.where(EnvironmentalHistory.timestamp >= start)
        if end:
            query = query.where(EnvironmentalHistory.timestamp <= end)

        count_q = select(func.count()).select_from(EnvironmentalHistory).where(
            EnvironmentalHistory.location_id == location_id
        )
        if start:
            count_q = count_q.where(EnvironmentalHistory.timestamp >= start)
        if end:
            count_q = count_q.where(EnvironmentalHistory.timestamp <= end)
        total = await session.scalar(count_q)
        query = (
            query.order_by(EnvironmentalHistory.timestamp.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = (await session.execute(query)).scalars().all()
        return [HistoryRecord.model_validate(r) for r in rows], int(total or 0)

    def _build_series(self, rows: list[EnvironmentalHistory]) -> dict[str, list[dict]]:
        ordered = sorted(rows, key=lambda r: r.timestamp)
        return {
            "aqi": [{"t": r.timestamp.isoformat(), "v": r.aqi} for r in ordered],
            "temperature": [{"t": r.timestamp.isoformat(), "v": r.temperature} for r in ordered],
            "humidity": [{"t": r.timestamp.isoformat(), "v": r.humidity} for r in ordered],
            "ndvi": [{"t": r.timestamp.isoformat(), "v": r.ndvi_score} for r in ordered],
            "risk_score": [{"t": r.timestamp.isoformat(), "v": r.risk_score} for r in ordered],
        }

    def _metric_change(
        self, metric: str, current: float, previous: float, unit: str = ""
    ) -> TrendMetric:
        if previous == 0:
            change_pct = 0.0 if current == 0 else 100.0
        else:
            change_pct = round(((current - previous) / previous) * 100, 1)

        anomaly = None
        if metric == "temperature" and abs(current - previous) >= 2:
            anomaly = f"{current - previous:+.1f}{unit} vs prior period"
        if metric == "aqi" and abs(change_pct) >= 15:
            anomaly = f"{'Elevated' if change_pct > 0 else 'Improved'} air quality shift"

        return TrendMetric(
            metric=metric,
            current=round(current, 2),
            previous=round(previous, 2),
            change_pct=change_pct,
            anomaly=anomaly,
        )

    async def get_trends(
        self,
        session: AsyncSession,
        location_id: int,
        period: str = "7d",
    ) -> TrendsResponse:
        hours = PERIOD_HOURS.get(period, PERIOD_HOURS["7d"])
        now = datetime.now(timezone.utc)
        start = now - timedelta(hours=hours)
        mid = now - timedelta(hours=hours / 2)

        rows = (
            await session.execute(
                select(EnvironmentalHistory)
                .where(
                    EnvironmentalHistory.location_id == location_id,
                    EnvironmentalHistory.timestamp >= start,
                )
                .order_by(EnvironmentalHistory.timestamp.asc())
            )
        ).scalars().all()

        if len(rows) < 4:
            loc = await session.get(Location, location_id)
            if loc:
                latest = (
                    await session.execute(
                        select(EnvironmentalHistory)
                        .where(EnvironmentalHistory.location_id == location_id)
                        .order_by(EnvironmentalHistory.timestamp.desc())
                        .limit(1)
                    )
                ).scalar_one_or_none()
                if latest:
                    await self.ensure_seed_history(
                        session,
                        location_id,
                        latest.aqi,
                        latest.temperature,
                        latest.humidity,
                        latest.ndvi_score,
                        latest.risk_score,
                        days=30 if period != "24h" else 2,
                    )
                    await session.commit()
                    return await self.get_trends(session, location_id, period)

        recent = [r for r in rows if _utc(r.timestamp) >= mid]
        older = [r for r in rows if _utc(r.timestamp) < mid]
        if not recent:
            recent = rows[-max(1, len(rows) // 2) :]
        if not older:
            older = rows[: max(1, len(rows) // 2)]

        def avg_attr(group, attr):
            if not group:
                return 0.0
            return float(np.mean([getattr(g, attr) for g in group]))

        metrics = [
            self._metric_change("aqi", avg_attr(recent, "aqi"), avg_attr(older, "aqi")),
            self._metric_change(
                "temperature",
                avg_attr(recent, "temperature"),
                avg_attr(older, "temperature"),
                "°C",
            ),
            self._metric_change(
                "humidity", avg_attr(recent, "humidity"), avg_attr(older, "humidity"), "%"
            ),
            self._metric_change(
                "ndvi", avg_attr(recent, "ndvi_score"), avg_attr(older, "ndvi_score")
            ),
            self._metric_change(
                "risk_score", avg_attr(recent, "risk_score"), avg_attr(older, "risk_score")
            ),
        ]

        return TrendsResponse(
            location_id=location_id,
            period=period,
            metrics=metrics,
            series=self._build_series(rows),
        )

    async def get_comparison(
        self,
        session: AsyncSession,
        location_id: int,
        period: str = "7d",
    ) -> ComparisonResponse:
        trends = await self.get_trends(session, location_id, period)
        return ComparisonResponse(
            location_id=location_id,
            period=period,
            comparisons=trends.metrics,
        )


history_service = HistoryService()
