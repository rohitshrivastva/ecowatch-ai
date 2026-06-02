"""Generate actionable environmental recommendations based on area analysis."""

import json
from typing import Optional


RULE_TEMPLATES = [
    {
        "condition": lambda d: d["pollution"]["aqi"] > 150 and d["environmental"]["ndvi"] < 0.3,
        "category": "plantation",
        "priority": "critical",
        "title": "Critical Air Quality & Low Vegetation",
        "description": (
            "Vegetation density is critically low and AQI is unhealthy. "
            "Recommended actions include increasing roadside plantation using "
            "neem and ashoka trees and adding rooftop gardens."
        ),
        "actions": [
            "Plant native trees (neem, ashoka, peepal) along major roads",
            "Establish rooftop gardens on commercial buildings",
            "Create green buffers between industrial and residential zones",
            "Install vertical gardens on building facades",
        ],
    },
    {
        "condition": lambda d: d["environmental"]["urban_heat_index"] > 1.3,
        "category": "urban_cooling",
        "priority": "high",
        "title": "Urban Heat Island Detected",
        "description": (
            "This area shows significant urban heat island effect. "
            "Cooling strategies are urgently needed to reduce heat stress."
        ),
        "actions": [
            "Increase tree canopy cover to 30%+ in urban areas",
            "Install cool/roof reflective coatings on buildings",
            "Create shaded pedestrian corridors",
            "Add water features and misting stations in public spaces",
        ],
    },
    {
        "condition": lambda d: d["pollution"]["aqi"] > 100,
        "category": "pollution_reduction",
        "priority": "high",
        "title": "Elevated Air Pollution Levels",
        "description": (
            "Air quality index exceeds healthy thresholds. "
            "Immediate pollution reduction measures are recommended."
        ),
        "actions": [
            "Restrict heavy vehicle traffic during peak hours",
            "Promote public transit and cycling infrastructure",
            "Install air quality monitoring stations",
            "Enforce industrial emission standards",
        ],
    },
    {
        "condition": lambda d: d["environmental"]["green_coverage_pct"] < 20,
        "category": "green_corridor",
        "priority": "medium",
        "title": "Insufficient Green Coverage",
        "description": (
            "Green coverage is below the recommended 20% threshold. "
            "Green corridor planning can significantly improve environmental health."
        ),
        "actions": [
            "Design connected green corridors linking parks",
            "Convert vacant lots to community gardens",
            "Plant drought-resistant native species",
            "Protect existing green spaces from development",
        ],
    },
    {
        "condition": lambda d: d["weather"]["humidity"] < 30,
        "category": "water_conservation",
        "priority": "medium",
        "title": "Low Humidity — Water Conservation Needed",
        "description": (
            "Low humidity levels indicate potential water stress. "
            "Water conservation measures will benefit the ecosystem."
        ),
        "actions": [
            "Implement rainwater harvesting systems",
            "Use drip irrigation for green spaces",
            "Restore natural water bodies and wetlands",
            "Install greywater recycling in public facilities",
        ],
    },
    {
        "condition": lambda d: d["environmental"]["ndvi"] < 0.4,
        "category": "vegetation",
        "priority": "medium",
        "title": "Vegetation Restoration Required",
        "description": (
            "NDVI analysis indicates sparse vegetation. "
            "Targeted reforestation can improve air quality and biodiversity."
        ),
        "actions": [
            "Launch community tree-planting drives",
            "Establish urban forests on degraded land",
            "Use Miyawaki method for dense mini-forests",
            "Protect and expand existing forest patches",
        ],
    },
]


class RecommendationEngine:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    async def generate(
        self,
        pollution: dict,
        weather: dict,
        environmental: dict,
        risk: dict,
    ) -> list[dict]:
        context = {
            "pollution": pollution,
            "weather": weather,
            "environmental": environmental,
            "risk": risk,
        }

        rule_based = self._apply_rules(context)

        if self.api_key and len(rule_based) < 3:
            ai_recs = await self._generate_with_llm(context)
            if ai_recs:
                existing_titles = {r["title"] for r in rule_based}
                for rec in ai_recs:
                    if rec["title"] not in existing_titles:
                        rule_based.append(rec)

        if not rule_based:
            rule_based.append(self._default_recommendation(context))

        return rule_based[:5]

    def _apply_rules(self, context: dict) -> list[dict]:
        recommendations = []
        for template in RULE_TEMPLATES:
            if template["condition"](context):
                recommendations.append({
                    "category": template["category"],
                    "priority": template["priority"],
                    "title": template["title"],
                    "description": template["description"],
                    "actions": template["actions"],
                })
        return recommendations

    def _default_recommendation(self, context: dict) -> dict:
        score = context["risk"]["score"]
        if score <= 30:
            return {
                "category": "maintenance",
                "priority": "low",
                "title": "Maintain Current Environmental Health",
                "description": (
                    "This area shows healthy environmental indicators. "
                    "Continue monitoring and maintain existing green infrastructure."
                ),
                "actions": [
                    "Regular environmental monitoring",
                    "Protect existing vegetation",
                    "Community awareness programs",
                ],
            }
        return {
            "category": "general",
            "priority": "medium",
            "title": "General Environmental Improvement",
            "description": (
                "Environmental conditions show room for improvement. "
                "A combination of green infrastructure and pollution control is recommended."
            ),
            "actions": [
                "Increase urban tree cover",
                "Improve waste management practices",
                "Promote sustainable transportation",
            ],
        }

    async def _generate_with_llm(self, context: dict) -> list[dict]:
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=self.api_key)
            prompt = f"""Based on this environmental data, generate 2 actionable recommendations as JSON array.
Each item: {{"category": str, "priority": "low"|"medium"|"high"|"critical", "title": str, "description": str, "actions": [str]}}

Data: {json.dumps(context, default=str)}

Return ONLY valid JSON array."""

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=800,
            )

            content = response.choices[0].message.content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[1].rsplit("```", 1)[0]

            return json.loads(content)
        except Exception:
            return []
