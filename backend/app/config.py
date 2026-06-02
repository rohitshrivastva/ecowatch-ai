from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "EcoWatch AI"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://ecowatch:ecowatch@localhost:5432/ecowatch"
    auth_database_url: str = "sqlite+aiosqlite:///./data/ecowatch_auth.db"
    redis_url: str = "redis://localhost:6379/0"
    openweather_api_key: str = ""
    waqi_api_key: str = ""
    openai_api_key: str = ""
    jwt_secret_key: str = "change-me-in-production-use-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    require_auth: bool = False  # set True (REQUIRE_AUTH=true) to require login for analysis
    cache_ttl_seconds: int = 300
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ecowatch.ai.vercel.app",
        "https://ecowatch-ai-rohitshivastva.vercel.app",
        "https://ecowatch-ai-ten.vercel.app",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
