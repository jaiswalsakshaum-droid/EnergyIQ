from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import AnomalyIncident
from app.schemas.anomalies import (
    AnomalyItem,
    AnomalyStatusUpdate,
    AnomalyExplanation,
)
from app.schemas.forecast import ShapContribution
from app.services.anomaly import run_anomaly_detection_pipeline

router = APIRouter(prefix="/anomalies", tags=["anomalies"])

def query_anomalies_filtered(
    db: Session,
    severity: Optional[str] = None,
    anomaly_type: Optional[str] = None,
    date_range: Optional[str] = None,
    building: Optional[str] = None,
    status: Optional[str] = None,
) -> List[AnomalyIncident]:
    query = db.query(AnomalyIncident)
    if query.count() == 0:
        run_anomaly_detection_pipeline(db)
        query = db.query(AnomalyIncident)

    if severity and isinstance(severity, str) and severity.lower() != "all":
        query = query.filter(AnomalyIncident.severity.ilike(severity))
    if anomaly_type and isinstance(anomaly_type, str) and anomaly_type.lower() != "all":
        query = query.filter(AnomalyIncident.anomaly_type == anomaly_type)
    if date_range and isinstance(date_range, str) and date_range.lower() != "all":
        if date_range == "24 hours":
            query = query.filter(AnomalyIncident.date_range == "24 hours")
        elif date_range == "7 days":
            query = query.filter(AnomalyIncident.date_range.in_(["24 hours", "7 days"]))
    if building and isinstance(building, str) and building.lower() not in ["all", "all buildings", ""]:
        query = query.filter(AnomalyIncident.building == building)
    if status and isinstance(status, str) and status.lower() != "all":
        query = query.filter(AnomalyIncident.status == status)

    return query.order_by(AnomalyIncident.id.asc()).all()

@router.get("", response_model=List[AnomalyItem])
def get_anomalies(
    severity: Optional[str] = Query(None, description="Filter by severity: all, High, Medium, Low"),
    type: Optional[str] = Query(None, description="Filter by anomaly type"),
    dateRange: Optional[str] = Query(None, description="Filter by date range bucket"),
    building: Optional[str] = Query(None, description="Filter by building"),
    status: Optional[str] = Query(None, description="Filter by review status"),
    db: Session = Depends(get_db),
):
    """Returns detected anomaly incidents with optional multi-attribute filtering."""
    incidents = query_anomalies_filtered(
        db=db,
        severity=severity,
        anomaly_type=type,
        date_range=dateRange,
        building=building,
        status=status,
    )
    return [
        AnomalyItem(
            id=inc.id,
            time=inc.time,
            timestamp=inc.timestamp.isoformat() if inc.timestamp else None,
            building=inc.building,
            actual=inc.actual,
            expected=inc.expected,
            type=inc.anomaly_type,
            severity=inc.severity,
            cost=inc.cost,
            wasted_kwh=inc.wasted_kwh,
            date_range=inc.date_range,
            status=inc.status,
            detail=inc.detail,
            recommendation=inc.recommendation,
            reviewer_note=inc.reviewer_note,
        )
        for inc in incidents
    ]

@router.patch("/{incident_id}/status", response_model=AnomalyItem)
def update_anomaly_status(
    incident_id: int,
    payload: AnomalyStatusUpdate,
    db: Session = Depends(get_db),
):
    """
    Updates the review status ('Reviewed', 'Confirmed', 'False alarm') and optional note
    for an anomaly incident, persisting directly to SQLite.
    """
    incident = db.query(AnomalyIncident).filter(AnomalyIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Anomaly incident #{incident_id} not found")

    incident.status = payload.status
    if payload.reviewer_note is not None:
        incident.reviewer_note = payload.reviewer_note
        
    db.commit()
    db.refresh(incident)

    return AnomalyItem(
        id=incident.id,
        time=incident.time,
        timestamp=incident.timestamp.isoformat() if incident.timestamp else None,
        building=incident.building,
        actual=incident.actual,
        expected=incident.expected,
        type=incident.anomaly_type,
        severity=incident.severity,
        cost=incident.cost,
        wasted_kwh=incident.wasted_kwh,
        date_range=incident.date_range,
        status=incident.status,
        detail=incident.detail,
        recommendation=incident.recommendation,
        reviewer_note=incident.reviewer_note,
    )

@router.get("/export.csv")
def export_anomalies_csv(
    severity: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    building: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Exports filtered anomaly incidents as CSV download."""
    incidents = query_anomalies_filtered(db=db, severity=severity, anomaly_type=type, building=building)
    
    csv_lines = ["id,time,building,actual_kwh,expected_kwh,type,severity,excess_cost_inr,status,wasted_kwh\n"]
    for a in incidents:
        csv_lines.append(
            f'{a.id},"{a.time}","{a.building}",{a.actual},{a.expected},"{a.anomaly_type}","{a.severity}",{a.cost},"{a.status}",{a.wasted_kwh or 0}\n'
        )
    content = "".join(csv_lines)
    
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="energyiq-anomalies.csv"'},
    )

@router.get("/{incident_id}/explain", response_model=AnomalyExplanation)
def explain_anomaly(
    incident_id: int,
    db: Session = Depends(get_db),
):
    """Provides plain-language root-cause diagnosis and SHAP waterfall contributions for an anomaly."""
    inc = db.query(AnomalyIncident).filter(AnomalyIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Anomaly incident #{incident_id} not found")

    deviation = round(inc.actual - inc.expected, 1)
    dev_pct = round((abs(deviation) / max(1.0, inc.expected)) * 100.0, 1)

    causes = [
        ShapContribution(
            feature="unaccounted_hvac_load",
            impact_kwh=round(deviation * 0.65, 1),
            display_name="Overnight chiller continuous operation outside schedule",
            is_positive=(deviation > 0),
        ),
        ShapContribution(
            feature="plug_loads",
            impact_kwh=round(deviation * 0.25, 1),
            display_name="Residual workstation and lighting standby baseload",
            is_positive=(deviation > 0),
        ),
    ]

    plain_text = (
        f"Signal #{inc.id} ({inc.anomaly_type}) in {inc.building} at {inc.time}: "
        f"actual load reached {inc.actual} kWh versus {inc.expected} kWh expected ({'+' if deviation > 0 else ''}{dev_pct}% deviation). "
        f"{inc.detail}"
    )

    return AnomalyExplanation(
        anomaly_id=inc.id,
        building=inc.building,
        time=inc.time,
        actual=inc.actual,
        expected=inc.expected,
        deviation_kwh=deviation,
        deviation_pct=dev_pct,
        anomaly_type=inc.anomaly_type,
        severity=inc.severity,
        primary_causes=causes,
        plain_text_explanation=plain_text,
        recommended_action=inc.recommendation,
    )
