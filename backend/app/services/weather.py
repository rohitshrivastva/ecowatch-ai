import math
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx

from app.config import get_settings
from app.utils.aqi import us_epa_aqi_from_components


AQI_LABELS = {
    (0, 50): "Good",
    (51, 100): "Moderate",
    (101, 150): "Unhealthy for Sensitive Groups",
    (151, 200): "Unhealthy",
    (201, 300): "Very Unhealthy",
    (301, 500): "Hazardous",
}


def aqi_label(aqi: int) -> str:
    for (low, high), label in AQI_LABELS.items():
        if low <= aqi <= high:
            return label
    return "Hazardous"


_WAQI_POLLUTANT_KEYS = {
    "pm25": "pm2_5",
    "pm10": "pm10",
    "no2": "no2",
    "o3": "o3",
    "so2": "so2",
    "co": "co",
}


def _waqi_components(iaqi: dict) -> dict:
    """Extract OpenWeather-style component µg/m³ values from WAQI iaqi."""
    components: dict = {}
    for waqi_key, component_key in _WAQI_POLLUTANT_KEYS.items():
        value = iaqi.get(waqi_key, {}).get("v")
        if value is not None:
            components[component_key] = float(value)
    return components


# WAQI iaqi concentrations sometimes disagree with the station's overall AQI (e.g. Letterkenny).
WAQI_IAQI_TOLERANCE = 20


def _pollution_dict(
    aqi: int,
    pm25: float,
    pm10: float,
    no2: float,
    co: float,
    ozone: float,
) -> dict:
    return {
        "aqi": aqi,
        "aqi_label": aqi_label(aqi),
        "pm25": pm25,
        "pm10": pm10,
        "no2": no2,
        "co": co,
        "ozone": ozone,
    }


def merge_waqi_and_openweather(waqi_data: dict, openweather: dict) -> dict:
    """
    Prefer WAQI station AQI when iaqi concentrations disagree with the station index.
    Use OpenWeather pollutant readings when WAQI iaqi is inconsistent (closer to model truth).
    """
    iaqi = waqi_data.get("iaqi", {})
    components = _waqi_components(iaqi)
    native_aqi = int(waqi_data.get("aqi", 50))

    if components:
        computed = us_epa_aqi_from_components(components)
        if abs(computed - native_aqi) <= WAQI_IAQI_TOLERANCE:
            return _pollution_dict(
                computed,
                components.get("pm2_5", iaqi.get("pm25", {}).get("v", 0)),
                components.get("pm10", iaqi.get("pm10", {}).get("v", 0)),
                components.get("no2", iaqi.get("no2", {}).get("v", 0)),
                components.get("co", iaqi.get("co", {}).get("v", 0)),
                components.get("o3", iaqi.get("o3", {}).get("v", 0)),
            )

    if openweather:
        return _pollution_dict(
            native_aqi,
            openweather["pm25"],
            openweather["pm10"],
            openweather["no2"],
            openweather["co"],
            openweather["ozone"],
        )

    return _pollution_dict(
        native_aqi,
        components.get("pm2_5", iaqi.get("pm25", {}).get("v", 0)),
        components.get("pm10", iaqi.get("pm10", {}).get("v", 0)),
        components.get("no2", iaqi.get("no2", {}).get("v", 0)),
        components.get("co", iaqi.get("co", {}).get("v", 0)),
        components.get("o3", iaqi.get("o3", {}).get("v", 0)),
    )


class WeatherService:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = "https://api.openweathermap.org/data/2.5"

    async def get_weather(self, lat: float, lon: float) -> dict:
        if not self.settings.openweather_api_key:
            return self._mock_weather(lat, lon)

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{self.base_url}/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": self.settings.openweather_api_key,
                    "units": "metric",
                },
            )
            resp.raise_for_status()
            data = resp.json()

            uv_resp = await client.get(
                "https://api.openweathermap.org/data/2.5/uvi",
                params={"lat": lat, "lon": lon, "appid": self.settings.openweather_api_key},
            )
            uv_index = uv_resp.json().get("value", 0) if uv_resp.status_code == 200 else 0

            return {
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "wind_speed": data["wind"]["speed"],
                "uv_index": uv_index,
                "description": data["weather"][0]["description"].title(),
            }

    def _mock_weather(self, lat: float, lon: float) -> dict:
        seed = abs(int(lat * 100) + int(lon * 100))
        temp = 20 + (seed % 20) - 5
        return {
            "temperature": round(temp, 1),
            "feels_like": round(temp + (seed % 5) - 2, 1),
            "humidity": 40 + (seed % 40),
            "wind_speed": round(2 + (seed % 15) / 2, 1),
            "uv_index": round(1 + (seed % 10), 1),
            "description": "Partly Cloudy" if seed % 2 else "Clear Sky",
        }

    async def get_forecast(self, lat: float, lon: float) -> dict:
        """Hourly-style slots for best-time-outside (3h steps from OpenWeather forecast)."""
        if not self.settings.openweather_api_key:
            return self._mock_forecast(lat, lon)

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{self.base_url}/forecast",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": self.settings.openweather_api_key,
                    "units": "metric",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        tz_offset = data.get("city", {}).get("timezone", 0)
        slots = []
        for entry in data.get("list", [])[:8]:
            weather = entry.get("weather", [{}])[0]
            rain = entry.get("rain", {})
            rain_mm = float(rain.get("3h", 0) or 0)
            slots.append(
                {
                    "timestamp": datetime.fromtimestamp(
                        entry["dt"], tz=timezone.utc
                    ).isoformat(),
                    "temp": float(entry["main"]["temp"]),
                    "feels_like": float(entry["main"]["feels_like"]),
                    "pop": float(entry.get("pop", 0)),
                    "weather_main": weather.get("main", "Clear"),
                    "description": weather.get("description", ""),
                    "wind_speed": float(entry.get("wind", {}).get("speed", 0)),
                    "rain_mm": rain_mm,
                }
            )
        return {"timezone_offset": tz_offset, "slots": slots}

    def _mock_forecast(self, lat: float, lon: float) -> dict:
        seed = abs(int(lat * 1000) + int(lon * 1000))
        now = datetime.now(timezone.utc)
        slots = []
        for i in range(8):
            hour = now + timedelta(hours=3 * i)
            hour_seed = (seed + i * 17) % 100
            pop = max(0.0, min(1.0, (hour_seed - 40) / 60))
            if 10 <= hour.hour <= 14:
                pop = min(1.0, pop + 0.35)
            if 17 <= hour.hour <= 20:
                pop = max(0.0, pop - 0.25)
            main = "Clear"
            desc = "clear sky"
            if pop > 0.75:
                main, desc = "Thunderstorm", "thunderstorm with rain"
            elif pop > 0.5:
                main, desc = "Rain", "heavy intensity rain"
            elif pop > 0.25:
                main, desc = "Drizzle", "light intensity drizzle"
            temp = 22 + math.sin((hour.hour - 6) / 12 * math.pi) * 6 + (seed % 5) - 2
            slots.append(
                {
                    "timestamp": hour.isoformat(),
                    "temp": round(temp, 1),
                    "feels_like": round(temp + 1, 1),
                    "pop": round(pop, 2),
                    "weather_main": main,
                    "description": desc,
                    "wind_speed": round(2 + (hour_seed % 10) / 3, 1),
                    "rain_mm": round(pop * 8, 1),
                }
            )
        return {"timezone_offset": 19800, "slots": slots}


class PollutionService:
    def __init__(self):
        self.settings = get_settings()

    async def get_pollution(self, lat: float, lon: float) -> dict:
        openweather = None
        if self.settings.openweather_api_key:
            openweather = await self._fetch_openweather(lat, lon)

        if self.settings.waqi_api_key:
            waqi_data = await self._fetch_waqi_raw(lat, lon)
            if waqi_data:
                return merge_waqi_and_openweather(waqi_data, openweather)

        if openweather:
            return openweather

        return self._mock_pollution(lat, lon)

    async def _fetch_openweather(self, lat: float, lon: float) -> Optional[dict]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "http://api.openweathermap.org/data/2.5/air_pollution",
                    params={"lat": lat, "lon": lon, "appid": self.settings.openweather_api_key},
                )
                if resp.status_code != 200:
                    return None
                components = resp.json()["list"][0]
                c = components["components"]
                aqi = us_epa_aqi_from_components(c)
                return _pollution_dict(
                    aqi,
                    c.get("pm2_5", 0),
                    c.get("pm10", 0),
                    c.get("no2", 0),
                    c.get("co", 0),
                    c.get("o3", 0),
                )
        except Exception:
            return None

    async def _fetch_waqi_raw(self, lat: float, lon: float) -> Optional[dict]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"https://api.waqi.info/feed/geo:{lat};{lon}/",
                    params={"token": self.settings.waqi_api_key},
                )
                if resp.status_code != 200:
                    return None
                data = resp.json().get("data", {})
                return data or None
        except Exception:
            return None

    async def _fetch_waqi(self, lat: float, lon: float) -> Optional[dict]:
        waqi_data = await self._fetch_waqi_raw(lat, lon)
        if not waqi_data:
            return None
        openweather = await self._fetch_openweather(lat, lon)
        return merge_waqi_and_openweather(waqi_data, openweather)

    def _mock_pollution(self, lat: float, lon: float) -> dict:
        seed = abs(int(lat * 1000) + int(lon * 1000))
        aqi = 30 + (seed % 170)
        return {
            "aqi": aqi,
            "aqi_label": aqi_label(aqi),
            "pm25": round(5 + (seed % 80), 1),
            "pm10": round(10 + (seed % 120), 1),
            "no2": round(5 + (seed % 60), 1),
            "co": round(200 + (seed % 800), 1),
            "ozone": round(20 + (seed % 80), 1),
        }


weather_service = WeatherService()
pollution_service = PollutionService()
