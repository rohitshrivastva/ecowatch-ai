"""Expand heatmap points for smooth leaflet.heat blending."""

from __future__ import annotations

from app.schemas.heatmap import HeatmapPoint

# (lat multiplier, lng multiplier, intensity factor)
_SPREAD_PATTERN: list[tuple[float, float, float]] = [
    (0.0, 0.0, 1.0),
    (1.0, 0.0, 0.92),
    (-1.0, 0.0, 0.88),
    (0.0, 1.0, 0.85),
    (0.0, -1.0, 0.8),
    (1.0, 1.0, 0.78),
    (1.0, -1.0, 0.76),
    (-1.0, 1.0, 0.74),
    (-1.0, -1.0, 0.72),
    (2.0, 0.0, 0.65),
    (-2.0, 0.0, 0.62),
    (0.0, 2.0, 0.6),
    (0.0, -2.0, 0.58),
    (1.5, 1.5, 0.55),
    (-1.5, 1.5, 0.53),
    (1.5, -1.5, 0.51),
    (-1.5, -1.5, 0.49),
]


def spread_step_degrees(
    north: float, south: float, east: float, west: float, grid: int, zoom: int
) -> float:
    lat_span = max(0.01, north - south)
    lon_span = max(0.01, east - west)
    base = max(lat_span, lon_span) / max(grid * 1.25, 8)
    zoom_factor = 1.0 + max(0, 14 - zoom) * 0.08
    return base * zoom_factor


def expand_spatial_points(
    points: list[HeatmapPoint],
    north: float,
    south: float,
    east: float,
    west: float,
    zoom: int,
    grid: int,
    max_total: int = 1500,
) -> list[HeatmapPoint]:
    """Duplicate each sample with neighbors so leaflet.heat blends smoothly."""
    if not points:
        return []

    step = spread_step_degrees(north, south, east, west, grid, zoom)
    expanded: list[HeatmapPoint] = []

    for p in points:
        for dlat_m, dlon_m, factor in _SPREAD_PATTERN:
            if len(expanded) >= max_total:
                return expanded
            intensity = min(1.0, max(0.0, p.intensity * factor))
            expanded.append(
                HeatmapPoint(
                    lat=p.lat + dlat_m * step,
                    lng=p.lng + dlon_m * step,
                    intensity=intensity,
                    value=p.value,
                )
            )
    return expanded


def focal_cluster(
    lat: float,
    lng: float,
    intensity: float,
    value: float | None,
    step: float,
    rings: int = 2,
) -> list[HeatmapPoint]:
    """Dense cluster around a selected location."""
    cluster: list[HeatmapPoint] = []
    for ring in range(1, rings + 2):
        ring_step = step * ring
        ring_factor = max(0.35, 1.0 - ring * 0.22)
        for dlat_m, dlon_m, factor in _SPREAD_PATTERN:
            if dlat_m == 0 and dlon_m == 0 and ring > 1:
                continue
            cluster.append(
                HeatmapPoint(
                    lat=lat + dlat_m * ring_step,
                    lng=lng + dlon_m * ring_step,
                    intensity=min(1.0, intensity * factor * ring_factor),
                    value=value,
                )
            )
    return cluster
