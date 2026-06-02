"""Environmental risk scoring engine.

Score ranges:
  0-30  = Healthy
  31-60 = Moderate Risk
  61-100 = High Risk
"""


def _clamp(value: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, value))


def _aqi_score(aqi: int) -> float:
    if aqi <= 50:
        return aqi * 0.3
    elif aqi <= 100:
        return 15 + (aqi - 50) * 0.5
    elif aqi <= 150:
        return 40 + (aqi - 100) * 0.6
    else:
        return _clamp(70 + (aqi - 150) * 0.4)


def _temperature_score(temp: float) -> float:
    optimal = 22
    deviation = abs(temp - optimal)
    if deviation <= 5:
        return deviation * 2
    elif deviation <= 15:
        return 10 + (deviation - 5) * 3
    return _clamp(40 + (deviation - 15) * 2)


def _ndvi_score(ndvi: float) -> float:
    if ndvi >= 0.6:
        return 5
    elif ndvi >= 0.4:
        return 15 + (0.6 - ndvi) * 50
    elif ndvi >= 0.2:
        return 25 + (0.4 - ndvi) * 75
    return _clamp(40 + (0.2 - ndvi) * 200)


def _heat_score(heat_index: float) -> float:
    if heat_index <= 1.0:
        return heat_index * 10
    elif heat_index <= 1.5:
        return 10 + (heat_index - 1.0) * 40
    return _clamp(30 + (heat_index - 1.5) * 60)


def _humidity_score(humidity: int) -> float:
    if 30 <= humidity <= 60:
        return 0
    deviation = min(abs(humidity - 45), 55)
    return deviation * 0.4


def _green_coverage_score(coverage: float) -> float:
    if coverage >= 40:
        return 5
    elif coverage >= 20:
        return 10 + (40 - coverage) * 0.75
    return _clamp(25 + (20 - coverage) * 1.5)


def compute_risk_score(
    aqi: int,
    temperature: float,
    ndvi: float,
    urban_heat_index: float,
    humidity: int,
    green_coverage_pct: float,
) -> dict:
    factors = {
        "air_quality": round(_aqi_score(aqi), 1),
        "temperature": round(_temperature_score(temperature), 1),
        "vegetation": round(_ndvi_score(ndvi), 1),
        "urban_heat": round(_heat_score(urban_heat_index), 1),
        "humidity": round(_humidity_score(humidity), 1),
        "green_coverage": round(_green_coverage_score(green_coverage_pct), 1),
    }

    weights = {
        "air_quality": 0.30,
        "temperature": 0.15,
        "vegetation": 0.20,
        "urban_heat": 0.15,
        "humidity": 0.05,
        "green_coverage": 0.15,
    }

    score = int(round(sum(factors[k] * weights[k] for k in factors)))

    if score <= 30:
        level = "Healthy"
    elif score <= 60:
        level = "Moderate Risk"
    else:
        level = "High Risk"

    return {"score": score, "level": level, "factors": factors}
