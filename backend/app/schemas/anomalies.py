from typing import List, Optional, Literal
from app.schemas.base import CamelModel
from app.schemas.forecast import ShapContribution

class AnomalyItem(CamelModel):
    id: int
    time: str
    timestamp: Optional[str] = None
    building: str
    actual: float
    expected: float
    type: Literal["Overnight usage", "Usage spike", "Sudden drop", "Sensor fault"]
    severity: Literal["High", "Medium", "Low"]
    cost: float
    wasted_kwh: Optional[float] = None
    date_range: Literal["24 hours", "7 days", "30 days"] = "24 hours"
    status: Literal["Pending", "Reviewed", "Confirmed", "False alarm"] = "Pending"
    detail: str
    recommendation: str
    reviewer_note: Optional[str] = None

class AnomalyStatusUpdate(CamelModel):
    status: Literal["Reviewed", "Confirmed", "False alarm", "Pending"]
    reviewer_note: Optional[str] = None

class AnomalyExplanation(CamelModel):
    anomaly_id: int
    building: str
    time: str
    actual: float
    expected: float
    deviation_kwh: float
    deviation_pct: float
    anomaly_type: str
    severity: str
    primary_causes: List[ShapContribution]
    plain_text_explanation: str
    recommended_action: str
