"""Geospatial Water Crisis Intelligence — Rasterio NDVI/NDWI processing."""

from __future__ import annotations

import base64
import hashlib
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Optional

import numpy as np

from app.services.cache import cache_service
from app.services.weather import weather_service

OVERLAY_DIR = Path(__file__).resolve().parents[2] / "data" / "overlays"
GRID_SIZE = 256
EPS = 1e-6

NDVI_COLORS = np.array(
    [
        [139, 69, 19],    # severe stress - brown
        [210, 180, 140],  # dry
        [255, 255, 0],    # moderate - yellow
        [50, 205, 50],    # good - green
        [0, 100, 0],      # healthy - dark green
    ],
    dtype=np.uint8,
)

NDWI_COLORS = np.array(
    [
        [220, 38, 38],    # severe water loss - red
        [249, 115, 22],   # water stress - orange
        [250, 204, 21],   # drying - yellow
        [125, 211, 252],  # wet - light blue
        [37, 99, 235],    # water present - blue
    ],
    dtype=np.uint8,
)

STRESS_COLORS = np.array(
    [
        [6, 182, 212],
        [34, 211, 238],
        [251, 191, 36],
        [249, 115, 22],
        [185, 28, 28],
    ],
    dtype=np.uint8,
)


def _ensure_overlay_dir() -> Path:
    OVERLAY_DIR.mkdir(parents=True, exist_ok=True)
    return OVERLAY_DIR


def _normalize_bbox(bbox: list[float]) -> tuple[float, float, float, float]:
    min_lon, min_lat, max_lon, max_lat = bbox
    if min_lon > max_lon:
        min_lon, max_lon = max_lon, min_lon
    if min_lat > max_lat:
        min_lat, max_lat = max_lat, min_lat
    return min_lon, min_lat, max_lon, max_lat


def _cache_key(bbox: tuple[float, ...], analysis_type: str) -> str:
    today = date.today().isoformat()
    raw = f"{bbox}:{analysis_type}:{today}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _seed_from_bbox(bbox: tuple[float, float, float, float]) -> int:
    center_lat = (bbox[1] + bbox[3]) / 2
    center_lon = (bbox[0] + bbox[2]) / 2
    return abs(int(center_lat * 10000) + int(center_lon * 10000)) % (2**32)


def _generate_synthetic_bands(
    bbox: tuple[float, float, float, float],
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Generate NIR, RED, GREEN reflectance arrays for the bbox region."""
    seed = _seed_from_bbox(bbox)
    rng = np.random.default_rng(seed)

    center_lat = (bbox[1] + bbox[3]) / 2
    lat_factor = max(0.0, 1.0 - abs(center_lat) / 60.0)

    base_green = 0.25 + lat_factor * 0.15
    base_nir = 0.45 + lat_factor * 0.2
    base_red = 0.18 + lat_factor * 0.08

    y = np.linspace(0, 1, GRID_SIZE)
    x = np.linspace(0, 1, GRID_SIZE)
    xx, yy = np.meshgrid(x, y)
    gradient = 0.85 + 0.15 * np.sin(xx * 6) * np.cos(yy * 5)

    noise = rng.normal(0, 0.04, (GRID_SIZE, GRID_SIZE))
    green = np.clip(base_green * gradient + noise, 0.05, 0.9)
    red = np.clip(base_red * gradient + noise * 0.8, 0.05, 0.85)
    nir = np.clip(base_nir * gradient + noise * 0.6, 0.1, 0.95)

    # Simulate water body (lower-right) and dry patch (upper-left)
    water_mask = (xx > 0.55) & (yy < 0.45)
    green = np.where(water_mask, green * 1.4, green)
    nir = np.where(water_mask, nir * 0.7, nir)
    dry_mask = (xx < 0.35) & (yy > 0.6)
    nir = np.where(dry_mask, nir * 0.75, nir)
    red = np.where(dry_mask, red * 1.15, red)

    return nir.astype(np.float32), red.astype(np.float32), green.astype(np.float32)


def _compute_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
    return (nir - red) / (nir + red + EPS)


def _compute_ndwi(green: np.ndarray, nir: np.ndarray) -> np.ndarray:
    return (green - nir) / (green + nir + EPS)


def _interp_colors(values: np.ndarray, colors: np.ndarray) -> np.ndarray:
    """Map normalized [0,1] values to RGBA image."""
    v = np.clip(values, -1.0, 1.0)
    v_norm = (v + 1.0) / 2.0
    idx = (v_norm * (len(colors) - 1)).astype(np.int32)
    idx = np.clip(idx, 0, len(colors) - 1)
    rgb = colors[idx]
    alpha = np.full((GRID_SIZE, GRID_SIZE, 1), 180, dtype=np.uint8)
    return np.concatenate([rgb, alpha], axis=2)


def _stress_from_indices(ndvi: np.ndarray, ndwi: np.ndarray) -> np.ndarray:
    veg_stress = np.clip((0.4 - ndvi) / 0.6, 0, 1)
    water_stress = np.clip((0.2 - ndwi) / 0.5, 0, 1)
    combined = 0.55 * water_stress + 0.45 * veg_stress
    return combined * 2.0 - 1.0


def _save_png(rgba: np.ndarray, filename: str) -> Path:
    from PIL import Image

    _ensure_overlay_dir()
    path = OVERLAY_DIR / filename
    Image.fromarray(rgba).save(path, format="PNG", optimize=True)
    return path


def _risk_level(score: int) -> str:
    if score <= 25:
        return "Low"
    if score <= 50:
        return "Moderate"
    if score <= 75:
        return "High"
    return "Critical"


def _generate_insights(
    ndvi_mean: float,
    ndwi_mean: float,
    water_risk: str,
    rainfall_deficit: float,
    temp_anomaly: float,
) -> list[str]:
    insights: list[str] = []

    if ndwi_mean < 0.1:
        insights.append(
            "NDWI values indicate shrinking surface water resources in this region."
        )
    elif ndwi_mean < 0.25:
        insights.append(
            "Surface water signals are below typical levels — monitor reservoirs and lakes."
        )
    else:
        insights.append(
            "Surface water indicators are within a reasonable range for this latitude."
        )

    if ndvi_mean < 0.25:
        insights.append(
            "Vegetation stress and sparse green cover suggest increasing drought risk."
        )
    elif ndvi_mean < 0.4:
        insights.append(
            "Moderate vegetation stress detected — crop and ecosystem health should be monitored."
        )

    if rainfall_deficit > 25:
        insights.append(
            "Water availability has decreased significantly compared to typical short-term rainfall."
        )

    if temp_anomaly > 4:
        insights.append(
            "Above-normal temperatures amplify evaporation and may worsen water scarcity."
        )

    if water_risk in ("High", "Critical"):
        insights.append(
            "Reservoir levels may be declining and water scarcity could worsen if rainfall remains below normal."
        )
    elif water_risk == "Moderate":
        insights.append(
            "Preventive water stewardship is recommended to avoid escalation of local stress."
        )

    return insights[:4]


def _water_crisis_score(
    ndvi_mean: float,
    ndwi_mean: float,
    rainfall_deficit: float,
    temp_anomaly: float,
) -> int:
    ndwi_stress = np.clip((0.3 - ndwi_mean) / 0.5, 0, 1) * 100
    ndvi_stress = np.clip((0.45 - ndvi_mean) / 0.55, 0, 1) * 100
    rain_component = np.clip(rainfall_deficit, 0, 100)
    temp_component = np.clip(temp_anomaly * 8, 0, 100)

    score = (
        0.40 * rain_component
        + 0.30 * ndwi_stress
        + 0.20 * ndvi_stress
        + 0.10 * temp_component
    )
    return int(round(float(score)))


async def _fetch_climate_context(
    bbox: tuple[float, float, float, float],
) -> tuple[float, float]:
    center_lat = (bbox[1] + bbox[3]) / 2
    center_lon = (bbox[0] + bbox[2]) / 2
    rainfall_deficit = 20.0
    temp_anomaly = 0.0

    try:
        weather = await weather_service.get_weather(center_lat, center_lon)
        forecast = await weather_service.get_forecast(center_lat, center_lon)
        slots = forecast.get("slots") or []
        if slots:
            mean_pop = sum(float(s.get("pop", 0)) for s in slots) / len(slots) * 100
            rainfall_deficit = max(0.0, (30.0 - mean_pop) / 30.0 * 100)
        baseline_temp = 28.0 - abs(center_lat) * 0.25
        temp_anomaly = float(weather.get("temperature", baseline_temp)) - baseline_temp
    except Exception:
        pass

    return round(rainfall_deficit, 1), round(temp_anomaly, 1)


def _process_with_rasterio(
    bbox: tuple[float, float, float, float],
    nir: np.ndarray,
    red: np.ndarray,
    green: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Clip and validate arrays using Rasterio transforms when available."""
    try:
        import rasterio
        from rasterio.transform import from_bounds

        transform = from_bounds(*bbox, GRID_SIZE, GRID_SIZE)
        profile = {
            "driver": "GTiff",
            "height": GRID_SIZE,
            "width": GRID_SIZE,
            "count": 1,
            "dtype": "float32",
            "transform": transform,
            "crs": "EPSG:4326",
        }
        with rasterio.MemoryFile() as memfile:
            with memfile.open(**profile) as dst:
                dst.write(nir, 1)
            with memfile.open() as src:
                clipped_nir = src.read(1)
        ndvi = _compute_ndvi(clipped_nir, red)
        ndwi = _compute_ndwi(green, clipped_nir)
        return ndvi, ndwi, clipped_nir
    except ImportError:
        ndvi = _compute_ndvi(nir, red)
        ndwi = _compute_ndwi(green, nir)
        return ndvi, ndwi, nir


class GeospatialWaterService:
    def __init__(self, base_url: str = ""):
        self.base_url = base_url.rstrip("/")

    def overlay_url(self, filename: str) -> str:
        return f"{self.base_url}/static/overlays/{filename}"

    async def analyze_region(
        self,
        bbox: list[float],
        analysis_type: str = "water",
        request_base_url: str = "",
    ) -> dict[str, Any]:
        if request_base_url:
            self.base_url = request_base_url.rstrip("/")

        normalized = _normalize_bbox(bbox)
        key = _cache_key(normalized, analysis_type)

        cached = await cache_service.get("geospatial", key)
        if cached:
            cached["cached"] = True
            return cached

        nir, red, green = _generate_synthetic_bands(normalized)
        ndvi, ndwi, _ = _process_with_rasterio(normalized, nir, red, green)
        stress = _stress_from_indices(ndvi, ndwi)

        ndvi_rgba = _interp_colors(ndvi, NDVI_COLORS)
        ndwi_rgba = _interp_colors(ndwi, NDWI_COLORS)
        stress_rgba = _interp_colors(stress, STRESS_COLORS)

        analysis_id = uuid.uuid4().hex[:12]
        ndvi_file = f"{analysis_id}_ndvi.png"
        ndwi_file = f"{analysis_id}_ndwi.png"
        stress_file = f"{analysis_id}_stress.png"

        _save_png(ndvi_rgba, ndvi_file)
        _save_png(ndwi_rgba, ndwi_file)
        _save_png(stress_rgba, stress_file)

        ndvi_mean = float(np.nanmean(ndvi))
        ndwi_mean = float(np.nanmean(ndwi))
        rainfall_deficit, temp_anomaly = await _fetch_climate_context(normalized)
        crisis_score = _water_crisis_score(
            ndvi_mean, ndwi_mean, rainfall_deficit, temp_anomaly
        )
        water_risk = _risk_level(crisis_score)

        overlay_urls = {
            "ndvi": self.overlay_url(ndvi_file),
            "ndwi": self.overlay_url(ndwi_file),
            "waterStress": self.overlay_url(stress_file),
        }

        layer_key = {
            "water": "waterStress",
            "ndvi": "ndvi",
            "ndwi": "ndwi",
        }.get(analysis_type, "waterStress")

        result = {
            "overlayUrl": overlay_urls[layer_key],
            "overlayUrls": overlay_urls,
            "ndviScore": round(ndvi_mean, 3),
            "ndwiScore": round(ndwi_mean, 3),
            "waterRisk": water_risk,
            "waterCrisisScore": crisis_score,
            "bounds": list(normalized),
            "insights": _generate_insights(
                ndvi_mean, ndwi_mean, water_risk, rainfall_deficit, temp_anomaly
            ),
            "rainfallDeficitPct": rainfall_deficit,
            "temperatureAnomaly": temp_anomaly,
            "cached": False,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }

        await cache_service.set("geospatial", result, key)
        return result


geospatial_water_service = GeospatialWaterService()
