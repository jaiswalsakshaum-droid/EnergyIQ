from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.db.models import MeterReading, AnomalyIncident
from app.schemas.overview import (
    OverviewKpis,
    BuildingSummary,
    LiveSeriesPoint,
    RecommendationItem,
)
from app.api.routers.buildings import DEFAULT_BUILDINGS

router = APIRouter(prefix="/overview", tags=["Overview"])

@router.get("/kpis", response_model=OverviewKpis)
def get_overview_kpis(db: Session = Depends(get_db)):
    active_anomalies_count = (
        db.query(AnomalyIncident).filter(AnomalyIncident.status.in_(["Pending", "Confirmed"])).count()
    )
    if active_anomalies_count == 0:
        active_anomalies_count = 4

    return OverviewKpis(
        current_consumption_kwh=1284.0,
        current_consumption_change="8.2%",
        current_consumption_trend="up",
        forecast_24h_kwh=1106.0,
        forecast_24h_change="4.1%",
        forecast_24h_trend="down",
        est_monthly_cost_lakh=5.14,
        est_monthly_cost_change="6.4%",
        est_monthly_cost_trend="down",
        active_anomalies=active_anomalies_count,
        active_anomalies_change="2 new today",
        active_anomalies_trend="up",
        co2_emissions_tonnes=0.92,
        co2_emissions_change="3.8%",
        co2_emissions_trend="down",
        peak_demand_kw=94.2,
        peak_demand_time="2:00 PM",
        after_hours_pct=18.6,
        after_hours_target_pct=15.0,
    )

@router.get("/buildings", response_model=List[BuildingSummary])
def get_overview_buildings(db: Session = Depends(get_db)):
    return [BuildingSummary(**b) for b in DEFAULT_BUILDINGS[:4]]

@router.get("/live-series", response_model=List[LiveSeriesPoint])
def get_live_series(hours: int = Query(24, ge=12, le=168)):
    if hours == 24:
        # Standard 24h diurnal curve
        return [
            LiveSeriesPoint(time="00:00", actual=42, forecast=43, upper=49, lower=37),
            LiveSeriesPoint(time="02:00", actual=35, forecast=36, upper=42, lower=30),
            LiveSeriesPoint(time="04:00", actual=31, forecast=32, upper=38, lower=26),
            LiveSeriesPoint(time="06:00", actual=38, forecast=39, upper=46, lower=32),
            LiveSeriesPoint(time="08:00", actual=68, forecast=66, upper=75, lower=57),
            LiveSeriesPoint(time="10:00", actual=82, forecast=80, upper=90, lower=70),
            LiveSeriesPoint(time="12:00", actual=77, forecast=78, upper=88, lower=68),
            LiveSeriesPoint(time="14:00", actual=91, forecast=88, upper=99, lower=77),
            LiveSeriesPoint(time="16:00", actual=86, forecast=84, upper=95, lower=73),
            LiveSeriesPoint(time="18:00", actual=70, forecast=72, upper=82, lower=62),
            LiveSeriesPoint(time="20:00", actual=59, forecast=57, upper=66, lower=48),
            LiveSeriesPoint(time="22:00", actual=47, forecast=46, upper=54, lower=38),
        ]
    # 7-day daily view
    return [
        LiveSeriesPoint(time="Mon", actual=1140, forecast=1120, upper=1210, lower=1030),
        LiveSeriesPoint(time="Tue", actual=1180, forecast=1160, upper=1250, lower=1070),
        LiveSeriesPoint(time="Wed", actual=1220, forecast=1205, upper=1290, lower=1120),
        LiveSeriesPoint(time="Thu", actual=1190, forecast=1175, upper=1260, lower=1090),
        LiveSeriesPoint(time="Fri", actual=1110, forecast=1090, upper=1180, lower=1000),
        LiveSeriesPoint(time="Sat", actual=740, forecast=750, upper=820, lower=680),
        LiveSeriesPoint(time="Sun", actual=680, forecast=690, upper=760, lower=620),
    ]

@router.get("/recommendations", response_model=List[RecommendationItem])
def get_recommendations():
    return [
        RecommendationItem(
            id="rec-1",
            title="Shift cooling schedule",
            copy="North Tower HVAC initiates 45 min prior to primary occupancy.",
            impact="Save ~₹18,400/mo",
            tone="green",
            category="HVAC",
        ),
        RecommendationItem(
            id="rec-2",
            title="Audit after-hours baseload",
            copy="Overnight consumption exceeds Aster campus target by 3.6%.",
            impact="Save ~₹12,100/mo",
            tone="amber",
            category="Baseload",
        ),
        RecommendationItem(
            id="rec-3",
            title="Stagger chiller staging",
            copy="Innovation Hub morning peak spikes baseline demand charge.",
            impact="Save ~₹8,600/mo",
            tone="blue",
            category="Peak Demand",
        ),
    ]
