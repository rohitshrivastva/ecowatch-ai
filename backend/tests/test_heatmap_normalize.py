"""Unit tests for heatmap normalization utilities."""

from app.utils.heatmap_normalize import (
    compute_environmental_risk,
    normalize_aqi,
    normalize_ndvi,
    normalize_temperature,
)


def test_normalize_aqi_bounds():
    intensity, value = normalize_aqi(250)
    assert value == 250
    assert 0 <= intensity <= 1
    assert abs(intensity - 0.5) < 0.01


def test_normalize_temperature():
    intensity, value = normalize_temperature(25)
    assert value == 25
    assert 0 <= intensity <= 1


def test_normalize_ndvi():
    intensity, value = normalize_ndvi(0.5)
    assert value == 0.5
    assert 0 <= intensity <= 1


def test_environmental_risk_weights():
    intensity, score = compute_environmental_risk(200, 35, 0.2, 80)
    assert 0 <= intensity <= 1
    assert 0 <= score <= 100
