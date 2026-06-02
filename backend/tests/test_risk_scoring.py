"""Risk scoring tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.risk_scoring import compute_risk_score


def test_healthy_score():
    result = compute_risk_score(
        aqi=30, temperature=22, ndvi=0.7,
        urban_heat_index=0.9, humidity=45, green_coverage_pct=50,
    )
    assert result["level"] == "Healthy"
    assert result["score"] <= 30


def test_high_risk_score():
    result = compute_risk_score(
        aqi=200, temperature=40, ndvi=0.1,
        urban_heat_index=1.8, humidity=15, green_coverage_pct=5,
    )
    assert result["level"] == "High Risk"
    assert result["score"] > 60


def test_score_bounds():
    result = compute_risk_score(
        aqi=500, temperature=50, ndvi=0.0,
        urban_heat_index=2.5, humidity=5, green_coverage_pct=0,
    )
    assert 0 <= result["score"] <= 100
