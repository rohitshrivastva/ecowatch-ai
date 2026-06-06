"""US EPA AQI calculation and pollution source merge tests."""

from app.services.weather import merge_waqi_and_openweather
from app.utils.aqi import us_epa_aqi_from_components


def test_letterkenny_like_air_is_good_not_moderate():
    """Low PM2.5/PM10 should not map to AQI 75 (old OpenWeather 1–5 bucket bug)."""
    components = {
        "pm2_5": 0.9,
        "pm10": 1.91,
        "no2": 0.7,
        "co": 101.27,
        "o3": 73.33,
        "so2": 0.2,
    }
    aqi = us_epa_aqi_from_components(components)
    assert aqi <= 50, f"Expected Good AQI, got {aqi}"


def test_high_pm25_maps_to_unhealthy_range():
    components = {"pm2_5": 55.5}
    assert us_epa_aqi_from_components(components) >= 151


def test_pm25_moderate_band():
    components = {"pm2_5": 25.0}
    aqi = us_epa_aqi_from_components(components)
    assert 51 <= aqi <= 100


def test_letterkenny_waqi_merge_uses_station_aqi_not_iaqi_recompute():
    """WAQI station AQI 16 with mismatched iaqi pm25 should not become AQI 59."""
    waqi_data = {
        "aqi": 16,
        "iaqi": {
            "pm25": {"v": 16},
            "pm10": {"v": 5},
            "so2": {"v": 6.8},
        },
    }
    openweather = {
        "aqi": 35,
        "aqi_label": "Good",
        "pm25": 0.9,
        "pm10": 1.91,
        "no2": 0.7,
        "co": 101.27,
        "ozone": 73.33,
    }
    result = merge_waqi_and_openweather(waqi_data, openweather)
    assert result["aqi"] == 16
    assert result["aqi_label"] == "Good"
    assert result["pm25"] == 0.9
