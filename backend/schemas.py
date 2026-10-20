from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class EnergyPoint(BaseModel):
    time: str
    actual: float
    forecast: float
    upper: float
    lower: float

class BuildingLoad(BaseModel):
    name: str
    area: str
    value: float
    share: int

class OverviewKpis(BaseModel):
    current_consumption_kwh: float
    forecast_24h_kwh: float
    est_monthly_cost_lakh: float
    active_anomalies: int
    co2_emissions_tonnes: float

class Anomaly(BaseModel):
    id: int
    time: str
    building: str
    actual: float
    expected: float
    type: Literal["Overnight usage", "Usage spike", "Sudden drop", "Sensor fault"]
    severity: Literal["High", "Medium", "Low"]
    cost: float
    date_range: Literal["24 hours", "7 days", "30 days"]
    status: Optional[Literal["Pending", "Reviewed", "Confirmed", "False alarm"]] = "Pending"
    detail: str
    recommendation: str

class AnomalyStatusUpdate(BaseModel):
    status: Literal["Reviewed", "Confirmed", "False alarm"]

class ModelBenchmark(BaseModel):
    name: str
    mae: float
    rmse: float
    mape: str
    r2: float
    train_time: str
    is_best: bool = False

class FeatureImportance(BaseModel):
    name: str
    value: int

class SimulatorRequest(BaseModel):
    after_hours_reduction: float = Field(ge=0.0, le=0.5, description="Fraction 0.0 to 0.5")
    occupancy_change: float = Field(ge=0.0, le=0.3, description="Fraction 0.0 to 0.3")
    usage_adjustment: float = Field(ge=0.0, le=0.4, description="Fraction 0.0 to 0.4")
    tariff: float = Field(ge=0.0, description="Tariff in INR/kWh")

class SimulatorResponse(BaseModel):
    reduction_kwh: int
    savings_inr: int
    co2_tonnes: float
    projected_monthly_kwh: int

class CsvQualityReport(BaseModel):
    filename: str
    size_kb: float
    total_rows: int
    missing_cells: int
    duplicate_timestamps: int
    timestamp_coverage_rows: int
    is_valid: bool
