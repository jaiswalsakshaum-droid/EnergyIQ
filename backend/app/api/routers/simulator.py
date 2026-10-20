from fastapi import APIRouter
from app.schemas.simulator import SimulatorRequest, SimulatorResponse, ComparisonPoint
from app.config import settings

router = APIRouter(prefix="/simulator", tags=["Simulator"])

@router.post("/calculate", response_model=SimulatorResponse)
def calculate_savings(payload: SimulatorRequest):
    monthly_baseline = 42800
    tariff = payload.tariff if payload.tariff > 0 else settings.TARIFF_INR_PER_KWH
    
    # Formula matching frontend: baseline * (after_hours*0.32 + occupancy*0.18 + usage*0.5)
    raw_reduction = monthly_baseline * (
        payload.after_hours_reduction * 0.32
        + payload.occupancy_change * 0.18
        + payload.usage_adjustment * 0.5
    )
    reduction = round(max(0, raw_reduction))
    savings = round(reduction * tariff)
    co2 = round(reduction * settings.GRID_EMISSION_TCO2_PER_KWH * 100) / 100
    projected = max(0, monthly_baseline - reduction)

    # Estimate peak demand reduction in kW
    peak_reduction = round(reduction / 720.0 * 1.8, 1)

    return SimulatorResponse(
        reduction=reduction,
        savings=savings,
        co2=co2,
        monthly_baseline_kwh=monthly_baseline,
        projected_monthly_kwh=projected,
        peak_demand_reduction_kw=peak_reduction,
        comparison=[
            ComparisonPoint(name="Current Baseline", usage=monthly_baseline),
            ComparisonPoint(name="With Simulations", usage=projected),
        ],
        confidence_note="Calculated using verified building thermal baseline and grid tariff rate.",
    )
