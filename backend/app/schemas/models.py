from typing import List, Optional, Dict, Any
from app.schemas.base import CamelModel

class ModelBenchmarkItem(CamelModel):
    name: str
    mae: str
    rmse: str
    mape: str
    r2: str
    time: str
    tone: str  # "best" or ""
    mase: Optional[str] = None
    is_best: bool = False

class FeatureImportanceItem(CamelModel):
    name: str
    value: int
    raw_score: Optional[float] = None

class PeriodPerformanceItem(CamelModel):
    period: str
    mae: float
    unit: str = "kWh MAE"
    bar_pct: int
    indicator_class: str

class ModelDriftReport(CamelModel):
    status: str  # "Stable", "Watch", "Retrain recommended"
    summary: str
    p_value: float
    psi_scores: Dict[str, float]
    rolling_mae_change_pct: float
    last_review: str
    badge: str

class AnomalyMetricsReport(CamelModel):
    precision: float
    recall: float
    f1_score: float
    mean_detection_delay_minutes: float
    total_evaluated: int
    true_positives: int
    false_positives: int
    false_negatives: int

class ActualVsPredictedPoint(CamelModel):
    time: str
    actual: float
    predicted: float
    residual: float

class ErrorBreakdown(CamelModel):
    by_hour: List[Dict[str, Any]]
    by_day_of_week: List[Dict[str, Any]]
    by_building: List[Dict[str, Any]]
    by_horizon: List[Dict[str, Any]]
