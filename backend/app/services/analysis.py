from datetime import datetime, timezone
from typing import Optional

from app.models.schemas import (
    EnvironmentalAnalysis,
    LocationRequest,
    Coordinates,
    AirPollutionMetrics,
    WeatherMetrics,
    EnvironmentalIndicators,
    RiskScore,
    Recommendation,
    BestTimeOutside,
)
from app.services.weather import weather_service, pollution_service
from app.services.best_time_outside import compute_best_time_outside, refresh_local_time_fields
from app.services.satellite import satellite_service
from app.services.ai import ai_service
from app.services.risk_scoring import compute_risk_score
from app.services.cache import cache_service
from app.db import async_session
from app.services.history import history_service


class AnalysisService:
    async def analyze_location(self, request: LocationRequest) -> EnvironmentalAnalysis:
        lat, lon = request.latitude, request.longitude
        cache_key = (round(lat, 4), round(lon, 4))

        cached = await cache_service.get("analysis", *cache_key)
        if cached:
            analysis = EnvironmentalAnalysis(**cached)
            if analysis.best_time_outside is None:
                forecast = await weather_service.get_forecast(lat, lon)
                analysis.best_time_outside = BestTimeOutside(
                    **compute_best_time_outside(
                        forecast,
                        analysis.air_pollution.model_dump(),
                        analysis.weather.model_dump(),
                    )
                )
            elif analysis.best_time_outside.timezone_offset_seconds is not None:
                analysis.best_time_outside = BestTimeOutside(
                    **refresh_local_time_fields(
                        analysis.best_time_outside.model_dump()
                    )
                )
            location_id = await self._persist_history(
                lat,
                lon,
                analysis.location_name or request.name,
                analysis.air_pollution.model_dump(),
                analysis.weather.model_dump(),
                {
                    "ndvi": analysis.environmental.ndvi,
                    "ndvi_label": analysis.environmental.ndvi_label,
                    "urban_heat_index": analysis.environmental.urban_heat_index,
                    "green_coverage_pct": analysis.environmental.green_coverage_pct,
                    "water_proximity_km": analysis.environmental.water_proximity_km,
                },
                analysis.risk.model_dump(),
            )
            analysis.location_id = location_id
            return analysis

        boundary_dict = request.boundary.model_dump() if request.boundary else None

        pollution, weather, satellite, forecast = await self._fetch_all(
            lat, lon, boundary_dict
        )

        best_time_data = compute_best_time_outside(forecast, pollution, weather)

        risk_data = compute_risk_score(
            aqi=pollution["aqi"],
            temperature=weather["temperature"],
            ndvi=satellite["ndvi"],
            urban_heat_index=satellite["urban_heat_index"],
            humidity=weather["humidity"],
            green_coverage_pct=satellite["green_coverage_pct"],
        )

        recommendations = await ai_service.generate_recommendations(
            pollution=pollution,
            weather=weather,
            environmental=satellite,
            risk=risk_data,
        )

        location_id = await self._persist_history(
            lat, lon, request.name, pollution, weather, satellite, risk_data
        )

        analysis = EnvironmentalAnalysis(
            location_id=location_id,
            location=Coordinates(latitude=lat, longitude=lon),
            location_name=request.name,
            air_pollution=AirPollutionMetrics(**pollution),
            weather=WeatherMetrics(**weather),
            environmental=EnvironmentalIndicators(
                ndvi=satellite["ndvi"],
                ndvi_label=satellite["ndvi_label"],
                urban_heat_index=satellite["urban_heat_index"],
                green_coverage_pct=satellite["green_coverage_pct"],
                water_proximity_km=satellite["water_proximity_km"],
            ),
            risk=RiskScore(**risk_data),
            recommendations=[Recommendation(**r) for r in recommendations],
            best_time_outside=BestTimeOutside(**best_time_data),
            timestamp=datetime.now(timezone.utc),
        )

        await cache_service.set("analysis", analysis.model_dump(), *cache_key)
        return analysis

    async def _persist_history(
        self,
        lat: float,
        lon: float,
        name: Optional[str],
        pollution: dict,
        weather: dict,
        satellite: dict,
        risk_data: dict,
    ) -> Optional[int]:
        try:
            async with async_session() as session:
                location = await history_service.get_or_create_location(
                    session, lat, lon, name
                )
                await history_service.record_snapshot(
                    session,
                    location.id,
                    aqi=int(pollution["aqi"]),
                    temperature=float(weather["temperature"]),
                    humidity=int(weather["humidity"]),
                    ndvi_score=float(satellite["ndvi"]),
                    risk_score=int(risk_data["score"]),
                )
                await session.commit()
                return location.id
        except Exception:
            return None

    async def _fetch_all(self, lat: float, lon: float, boundary: Optional[dict]):
        import asyncio

        pollution_task = pollution_service.get_pollution(lat, lon)
        weather_task = weather_service.get_weather(lat, lon)
        forecast_task = weather_service.get_forecast(lat, lon)
        satellite_task = satellite_service.analyze_area(lat, lon, boundary)

        pollution, weather, satellite, forecast = await asyncio.gather(
            pollution_task, weather_task, satellite_task, forecast_task
        )
        return pollution, weather, satellite, forecast


analysis_service = AnalysisService()
