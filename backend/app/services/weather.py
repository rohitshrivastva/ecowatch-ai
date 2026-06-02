import httpx
from typing import Optional

from app.config import get_settings


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
        import math
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


class PollutionService:
    def __init__(self):
        self.settings = get_settings()

    async def get_pollution(self, lat: float, lon: float) -> dict:
        if self.settings.openweather_api_key:
            result = await self._fetch_openweather(lat, lon)
            if result:
                return result

        if self.settings.waqi_api_key:
            result = await self._fetch_waqi(lat, lon)
            if result:
                return result

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
                aqi_map = {1: 25, 2: 75, 3: 125, 4: 175, 5: 250}
                aqi = aqi_map.get(components["main"]["aqi"], 100)
                c = components["components"]
                return {
                    "aqi": aqi,
                    "aqi_label": aqi_label(aqi),
                    "pm25": c.get("pm2_5", 0),
                    "pm10": c.get("pm10", 0),
                    "no2": c.get("no2", 0),
                    "co": c.get("co", 0),
                    "ozone": c.get("o3", 0),
                }
        except Exception:
            return None

    async def _fetch_waqi(self, lat: float, lon: float) -> Optional[dict]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"https://api.waqi.info/feed/geo:{lat};{lon}/",
                    params={"token": self.settings.waqi_api_key},
                )
                if resp.status_code != 200:
                    return None
                data = resp.json().get("data", {})
                if not data:
                    return None
                aqi = data.get("aqi", 50)
                iaqi = data.get("iaqi", {})
                return {
                    "aqi": aqi,
                    "aqi_label": aqi_label(aqi),
                    "pm25": iaqi.get("pm25", {}).get("v", 0),
                    "pm10": iaqi.get("pm10", {}).get("v", 0),
                    "no2": iaqi.get("no2", {}).get("v", 0),
                    "co": iaqi.get("co", {}).get("v", 0),
                    "ozone": iaqi.get("o3", {}).get("v", 0),
                }
        except Exception:
            return None

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
