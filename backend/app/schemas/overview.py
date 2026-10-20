from typing import List, Optional
from app.schemas.base import CamelModel

class OverviewKpis(CamelModel):
    current_consumption_kwh: float
    current_consumption_change: str
    current_consumption_trend: str
    forecast_24h_kwh: float
    forecast_24h_change: str
    forecast_24h_trend: str
    est_monthly_cost_lakh: float
    est_monthly_cost_change: str
    est_monthly_cost_trend: str
    active_anomalies: int
    active_anomalies_change: str
    active_anomalies_trend: str
    co2_emissions_tonnes: float
    co2_emissions_change: str
    co2_emissions_trend: str
    peak_demand_kw: float
    peak_demand_time: str
    after_hours_pct: float
    after_hours_target_pct: float

class BuildingSummary(CamelModel):
    name: str
    area: str
    value: float
    share: int
    building_type: Optional[str] = None
    peak_kw: Optional[float] = None

class LiveSeriesPoint(CamelModel):
    time: str
    actual: Optional[float] = None
    forecast: Optional[float] = None
    upper: Optional[float] = None
    lower: Optional[float] = None

from pydantic import Field

class RecommendationItem(CamelModel):
    id: str
    title: str
    copy_text: str = Field(..., alias="copy")
    impact: str
    tone: str  # green, amber, blue
    category: str
