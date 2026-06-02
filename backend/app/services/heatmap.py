import asyncio
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from app.schemas.heatmap import HeatmapPoint, HeatmapResponse
from app.services.cache import cache_service
from app.services.satellite import satellite_service
from app.services.weather import pollution_service, weather_service
from app.utils.heatmap_normalize import (
    compute_environmental_risk,
    normalize_aqi,
    normalize_ndvi,
    normalize_temperature,
)
from app.utils.heatmap_spread import (
    expand_spatial_points,
    focal_cluster,
    spread_step_degrees,
)

_SAMPLE_SEMAPHORE = asyncio.Semaphore(4)


def _grid_size(zoom: int) -> int:
    return int(min(24, max(12, zoom - 1)))


def _sample_locations(
    north: float, south: float, east: float, west: float
) -> list[tuple[float, float]]:
    mid_lat = (north + south) / 2.0
    mid_lon = (east + west) / 2.0
    return [
        (mid_lat, mid_lon),
        (north, west),
        (north, east),
        (south, west),
        (south, east),
        (north, mid_lon),
        (south, mid_lon),
        (mid_lat, west),
        (mid_lat, east),
    ]


def _bilinear_grid(
    sample_lats: np.ndarray,
    sample_lons: np.ndarray,
    sample_values: np.ndarray,
    grid_lats: np.ndarray,
    grid_lons: np.ndarray,
) -> np.ndarray:
    """Interpolate sample intensities onto a lat/lon grid (numpy only)."""
    out = np.zeros((len(grid_lats), len(grid_lons)), dtype=np.float64)
    if sample_values.size == 0:
        return out

    for i, lat in enumerate(grid_lats):
        for j, lon in enumerate(grid_lons):
            w_sum = 0.0
            v_sum = 0.0
            for slat, slon, val in zip(sample_lats, sample_lons, sample_values):
                dlat = lat - slat
                dlon = lon - slon
                dist_sq = dlat * dlat + dlon * dlon + 1e-8
                w = 1.0 / dist_sq
                w_sum += w
                v_sum += w * val
            out[i, j] = v_sum / w_sum if w_sum > 0 else float(np.mean(sample_values))
    return out


def _synthetic_intensity(heatmap_type: str, lat: float, lon: float) -> tuple[float, float]:
    """Deterministic fallback when APIs fail."""
    rng = np.random.default_rng(int(abs(lat * 1000) + abs(lon * 1000)) % (2**32))
    base = float(rng.uniform(0.25, 0.75))
    if heatmap_type == "aqi":
        raw = base * 500.0
        return normalize_aqi(raw)
    if heatmap_type == "temperature":
        raw = 5.0 + base * 40.0
        return normalize_temperature(raw)
    if heatmap_type == "vegetation":
        raw = base * 2.0 - 1.0
        return normalize_ndvi(raw)
    raw = base * 100.0
    return base, raw


class HeatmapService:
    async def generate(
        self,
        heatmap_type: str,
        north: float,
        south: float,
        east: float,
        west: float,
        zoom: int = 10,
        center_lat: Optional[float] = None,
        center_lon: Optional[float] = None,
    ) -> HeatmapResponse:
        cache_key = (
            heatmap_type,
            round(north, 3),
            round(south, 3),
            round(east, 3),
            round(west, 3),
            zoom,
            round(center_lat or 0, 3),
            round(center_lon or 0, 3),
        )
        cached = await cache_service.get("heatmap", *cache_key)
        if cached:
            return HeatmapResponse(**cached)

        grid = _grid_size(zoom)
        lats = np.linspace(south, north, grid)
        lons = np.linspace(west, east, grid)

        samples = _sample_locations(north, south, east, west)
        sample_results = await asyncio.gather(
            *[self._sample_at(heatmap_type, lat, lon) for lat, lon in samples],
            return_exceptions=True,
        )

        valid_lats: list[float] = []
        valid_lons: list[float] = []
        valid_intensity: list[float] = []
        valid_value: list[float] = []

        for (lat, lon), result in zip(samples, sample_results):
            if isinstance(result, Exception):
                intensity, value = _synthetic_intensity(heatmap_type, lat, lon)
            else:
                intensity, value = result
            valid_lats.append(lat)
            valid_lons.append(lon)
            valid_intensity.append(intensity)
            valid_value.append(value)

        s_lats = np.array(valid_lats)
        s_lons = np.array(valid_lons)
        s_vals = np.array(valid_intensity)
        intensity_grid = _bilinear_grid(s_lats, s_lons, s_vals, lats, lons)

        grid_points: list[HeatmapPoint] = []
        for i, lat in enumerate(lats):
            for j, lon in enumerate(lons):
                intensity = float(np.clip(intensity_grid[i, j], 0.0, 1.0))
                value = self._intensity_to_display_value(heatmap_type, intensity)
                grid_points.append(
                    HeatmapPoint(
                        lat=float(lat),
                        lng=float(lon),
                        intensity=intensity,
                        value=value,
                    )
                )

        step = spread_step_degrees(north, south, east, west, grid, zoom)
        focal_points: list[HeatmapPoint] = []
        if center_lat is not None and center_lon is not None:
            if south <= center_lat <= north and west <= center_lon <= east:
                try:
                    intensity, _raw = await self._sample_at(
                        heatmap_type, center_lat, center_lon
                    )
                    display = self._intensity_to_display_value(heatmap_type, intensity)
                    focal_points = focal_cluster(
                        center_lat,
                        center_lon,
                        intensity,
                        display,
                        step,
                        rings=3,
                    )
                except Exception:
                    pass

        points = expand_spatial_points(
            grid_points, north, south, east, west, zoom, grid
        )
        if focal_points:
            points = focal_points + points
            points = points[:1500]

        response = HeatmapResponse(
            type=heatmap_type,
            points=points,
            bounds={"north": north, "south": south, "east": east, "west": west},
            updated_at=datetime.now(timezone.utc),
        )
        await cache_service.set("heatmap", response.model_dump(mode="json"), *cache_key)
        return response

    @staticmethod
    def _intensity_to_display_value(heatmap_type: str, intensity: float) -> float:
        if heatmap_type == "aqi":
            return round(intensity * 500.0, 1)
        if heatmap_type == "temperature":
            return round(5.0 + intensity * 40.0, 1)
        if heatmap_type == "vegetation":
            return round(intensity * 2.0 - 1.0, 3)
        if heatmap_type == "environmental-risk":
            return round(intensity * 100.0, 1)
        return round(intensity, 3)

    async def _sample_at(
        self, heatmap_type: str, lat: float, lon: float
    ) -> tuple[float, float]:
        async with _SAMPLE_SEMAPHORE:
            if heatmap_type == "aqi":
                data = await pollution_service.get_pollution(lat, lon)
                return normalize_aqi(float(data["aqi"]))

            if heatmap_type == "temperature":
                data = await weather_service.get_weather(lat, lon)
                return normalize_temperature(float(data["temperature"]))

            if heatmap_type == "vegetation":
                sat = await satellite_service.analyze_area(lat, lon)
                return normalize_ndvi(float(sat["ndvi"]))

            if heatmap_type == "environmental-risk":
                pollution = await pollution_service.get_pollution(lat, lon)
                weather = await weather_service.get_weather(lat, lon)
                sat = await satellite_service.analyze_area(lat, lon)
                return compute_environmental_risk(
                    float(pollution["aqi"]),
                    float(weather["temperature"]),
                    float(sat["ndvi"]),
                    float(weather["humidity"]),
                )

        return _synthetic_intensity(heatmap_type, lat, lon)


heatmap_service = HeatmapService()
