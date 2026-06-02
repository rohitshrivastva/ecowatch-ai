import sys
from pathlib import Path

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
    ) -> list[dict]:
        return await self.engine.generate(
            pollution=pollution,
            weather=weather,
            environmental=environmental,
            risk=risk,
        )


ai_service = AIService()
