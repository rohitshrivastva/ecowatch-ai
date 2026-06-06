"""Generate actionable environmental recommendations based on area analysis."""

import json
from typing import Optional


RULE_TEMPLATES = [
    {
        "condition": lambda d: d["pollution"]["aqi"] > 150 and d["environmental"]["ndvi"] < 0.3,
        "category": "plantation",
        "priority": "critical",
        "title": "Poor air quality and low greenery",
        "description": (
            "This area has unhealthy air and very little vegetation. "
            "Roadside trees and rooftop greenery can cut pollution and heat."
        ),
        "actions": [
            "Plant native trees (neem, ashoka, peepal) along major roads",
            "Add rooftop gardens on commercial buildings",
            "Create green buffers between industrial and residential zones",
        ],
    },
    {
        "condition": lambda d: d["environmental"]["urban_heat_index"] > 1.3,
        "category": "urban_cooling",
        "priority": "high",
        "title": "Urban heat island",
        "description": (
            "Built-up surfaces are trapping heat. Shade and reflective roofs "
            "will lower temperatures for people nearby."
        ),
        "actions": [
            "Increase tree canopy cover toward 30% in dense blocks",
            "Use cool or reflective roof coatings on large buildings",
            "Add shaded walkways and water features in public spaces",
        ],
    },
    {
        "condition": lambda d: d["pollution"]["aqi"] > 100,
        "category": "pollution_reduction",
        "priority": "high",
        "title": "Elevated air pollution",
        "description": (
            "Air quality is above healthy limits. Traffic and emissions "
            "controls during busy hours will help fastest."
        ),
        "actions": [
            "Restrict heavy vehicles during peak traffic hours",
            "Expand public transit and safe cycling routes",
            "Monitor air quality at busy intersections",
        ],
    },
    {
        "condition": lambda d: d["environmental"]["green_coverage_pct"] < 20,
        "category": "green_corridor",
        "priority": "medium",
        "title": "Low green coverage",
        "description": (
            "Less than 20% of the area is green space. Connected parks and "
            "street trees improve air and neighborhood comfort."
        ),
        "actions": [
            "Link parks with green street corridors",
            "Convert vacant lots to community gardens",
            "Plant drought-tolerant native species",
        ],
    },
    {
        "condition": lambda d: d.get("water_crisis", {}).get("stress_level") in ("High", "Critical"),
        "category": "water_conservation",
        "priority": "critical",
        "title": "High water stress detected",
        "description": (
            "Multiple signals point to elevated water stress in this area. "
            "Conserving water and reducing outdoor use will help until conditions improve."
        ),
        "actions": [
            "Avoid non-essential outdoor irrigation and car washing",
            "Fix leaks and use water-efficient fixtures where possible",
            "Follow local drought or water restriction advisories",
        ],
    },
    {
        "condition": lambda d: d.get("water_crisis", {}).get("drought_risk") == "High",
        "category": "water_conservation",
        "priority": "high",
        "title": "Drought risk elevated",
        "description": (
            "Dry weather, vegetation stress, or low forecast rain suggest "
            "increasing strain on local water availability."
        ),
        "actions": [
            "Collect rainwater where regulations allow",
            "Mulch gardens to reduce evaporation",
            "Prefer drought-tolerant landscaping",
        ],
    },
    {
        "condition": lambda d: d["weather"]["humidity"] < 30,
        "category": "water_conservation",
        "priority": "medium",
        "title": "Dry conditions",
        "description": (
            "Low humidity suggests water stress. Harvesting rain and efficient "
            "irrigation protect plants and local water supplies."
        ),
        "actions": [
            "Install rainwater harvesting on public buildings",
            "Use drip irrigation in parks and medians",
            "Restore small wetlands where feasible",
        ],
    },
    {
        "condition": lambda d: d["environmental"]["ndvi"] < 0.4,
        "category": "vegetation",
        "priority": "medium",
        "title": "Sparse vegetation",
        "description": (
            "Vegetation cover is thin for this area. Targeted planting "
            "improves air quality, shade, and local biodiversity."
        ),
        "actions": [
            "Run community tree-planting along key corridors",
            "Establish small urban forests on unused land",
            "Protect existing tree patches from removal",
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
        water_crisis: Optional[dict] = None,
    ) -> list[dict]:
        context = {
            "pollution": pollution,
            "weather": weather,
            "environmental": environmental,
            "risk": risk,
            "water_crisis": water_crisis or {},
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
                    "actions": template["actions"][:3],
                })
        return recommendations

    def _default_recommendation(self, context: dict) -> dict:
        score = context["risk"]["score"]
        if score <= 30:
            return {
                "category": "maintenance",
                "priority": "low",
                "title": "Healthy conditions",
                "description": (
                    "Indicators look good for this area. Keep monitoring and "
                    "protect existing trees and green spaces."
                ),
                "actions": [
                    "Continue periodic air and vegetation checks",
                    "Protect existing trees from removal",
                    "Share simple environmental tips with neighbors",
                ],
            }
        return {
            "category": "general",
            "priority": "medium",
            "title": "Room to improve",
            "description": (
                "Several indicators can be improved with more greenery and "
                "cleaner transport choices in this area."
            ),
            "actions": [
                "Add street trees on exposed corridors",
                "Improve local waste collection points",
                "Promote walking and transit for short trips",
            ],
        }

    async def _generate_with_llm(self, context: dict) -> list[dict]:
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=self.api_key)
            prompt = f"""You are a local environmental advisor. Using this data, write exactly 2 recommendations as a JSON array.

Rules:
- Plain language for residents and city planners (no jargon like NDVI)
- description: max 2 short sentences (why it matters locally)
- actions: exactly 3 specific, actionable bullets each
- Avoid generic phrases like "environmental conditions show room for improvement"
- title: under 8 words

Schema per item: {{"category": str, "priority": "low"|"medium"|"high"|"critical", "title": str, "description": str, "actions": [str, str, str]}}

Data: {json.dumps(context, default=str)}

Return ONLY a valid JSON array."""

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=700,
            )

            content = response.choices[0].message.content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[1].rsplit("```", 1)[0]

            parsed = json.loads(content)
            for rec in parsed:
                if isinstance(rec.get("actions"), list):
                    rec["actions"] = rec["actions"][:3]
            return parsed
        except Exception:
            return []

    async def enhance_environmental_summary(
        self, template_summary: str, water_crisis: dict
    ) -> str:
        if not self.api_key:
            return template_summary
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=self.api_key)
            prompt = f"""Rewrite this environmental intelligence summary in 2-3 clear sentences for residents and planners.
Keep all factual claims. Plain language only. No bullet points.

Template: {template_summary}

Context: {json.dumps(water_crisis, default=str)}

Return ONLY the rewritten summary text."""

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=200,
            )
            content = (response.choices[0].message.content or "").strip()
            return content or template_summary
        except Exception:
            return template_summary
