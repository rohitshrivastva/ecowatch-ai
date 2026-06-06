import sys
from pathlib import Path
from typing import Optional

AI_ROOT = Path(__file__).resolve().parents[3] / "ai-recommendations"
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from engine import RecommendationEngine
from app.config import get_settings


class AIService:
    def __init__(self):
        self.engine = RecommendationEngine(api_key=get_settings().openai_api_key)

    async def generate_recommendations(
        self,
        pollution: dict,
        weather: dict,
        environmental: dict,
        risk: dict,
        water_crisis: Optional[dict] = None,
    ) -> list[dict]:
        return await self.engine.generate(
            pollution=pollution,
            weather=weather,
            environmental=environmental,
            risk=risk,
            water_crisis=water_crisis,
        )

    async def enhance_environmental_summary(
        self, template_summary: str, water_crisis: dict
    ) -> str:
        return await self.engine.enhance_environmental_summary(
            template_summary, water_crisis
        )


ai_service = AIService()
