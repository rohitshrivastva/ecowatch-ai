"""Tests for spatial heatmap point expansion."""

from app.schemas.heatmap import HeatmapPoint
from app.utils.heatmap_spread import expand_spatial_points, focal_cluster


def test_expand_spatial_points_multiplies_density():
    base = [
        HeatmapPoint(lat=28.6, lng=77.2, intensity=0.8, value=120.0),
        HeatmapPoint(lat=28.7, lng=77.3, intensity=0.5, value=80.0),
    ]
    expanded = expand_spatial_points(
        base, north=28.8, south=28.5, east=77.4, west=77.1, zoom=12, grid=12
    )
    assert len(expanded) > len(base)
    assert all(0 <= p.intensity <= 1 for p in expanded)


def test_focal_cluster_creates_ring():
    cluster = focal_cluster(28.61, 77.21, 0.85, 150.0, step=0.02, rings=2)
    assert len(cluster) >= 9
    assert max(p.intensity for p in cluster) >= 0.65
