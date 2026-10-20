from typing import List, Optional
from app.schemas.base import CamelModel

class SimulatorRequest(CamelModel):
    after_hours_reduction: float = 0.20
    occupancy_change: float = 0.10
    usage_adjustment: float = 0.10
    tariff: float = 12.0
    building: Optional[str] = None

class ComparisonPoint(CamelModel):
    name: str
    usage: int

class SimulatorResponse(CamelModel):
    reduction: int
    savings: int
    co2: float
    monthly_baseline_kwh: int
    projected_monthly_kwh: int
    peak_demand_reduction_kw: Optional[float] = None
    comparison: List[ComparisonPoint]
    confidence_note: str
