from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "EcoWatch AI"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://ecowatch:ecowatch@localhost:5432/ecowatch"
    redis_url: str = "redis://localhost:6379/0"
    openweather_api_key: str = ""
    waqi_api_key: str = ""
    openai_api_key: str = ""
    cache_ttl_seconds: int = 300
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
