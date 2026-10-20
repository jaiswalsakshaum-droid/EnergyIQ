from typing import List, Optional
from app.schemas.base import CamelModel

class ForecastRequest(CamelModel):
    horizon: str = "24 hours"  # "24 hours" | "7 days" | "30 days" or "24h" | "7d" | "30d"
    model: str = "Random Forest"
    building: Optional[str] = None  # None means entire portfolio

class ForecastPoint(CamelModel):
    time: str
    actual: Optional[float] = None
    forecast: float
    upper: float
    lower: float

class DailyPattern(CamelModel):
    peak_window: str
    lowest_demand_window: str
    working_hours_share_pct: float

class ShapContribution(CamelModel):
    feature: str
    impact_kwh: float
    display_name: str
    is_positive: bool

class ForecastExplanation(CamelModel):
    building: str
    timestamp: str
    predicted_kwh: float
    base_value_kwh: float
    top_positive: List[ShapContribution]
    top_negative: List[ShapContribution]
    summary_sentence: str

class ForecastResponse(CamelModel):
    horizon: str
    model: str
    building: str
    total_kwh: float
    est_cost_inr: float
    peak_demand_kw: float
    peak_demand_time: str
    points: List[ForecastPoint]
    daily_pattern: DailyPattern
    model_description: str
