from typing import Dict, Any, Optional
from app.config import settings

def calculate_energy_cost(
    kwh: float,
    tariff_inr: Optional[float] = None,
) -> float:
    """Calculates total energy cost in INR."""
    rate = tariff_inr if tariff_inr is not None else settings.TARIFF_INR_PER_KWH
    return round(float(kwh * rate), 2)

def calculate_cost_in_lakh(
    kwh: float,
    tariff_inr: Optional[float] = None,
) -> float:
    """Calculates total energy cost in INR Lakhs (1 Lakh = 100,000 INR)."""
    cost_inr = calculate_energy_cost(kwh, tariff_inr)
    return round(cost_inr / 100000.0, 2)

def calculate_co2_tonnes(
    kwh: float,
    factor: Optional[float] = None,
) -> float:
    """
    Calculates grid carbon emissions in metric tonnes CO2.
    Default factor: 0.00071 tCO2/kWh (matching CEA India baseline grid factor of ~710 gCO2/kWh).
    """
    emission_factor = factor if factor is not None else settings.GRID_EMISSION_TCO2_PER_KWH
    return round(float(kwh * emission_factor), 2)

def calculate_demand_charge(
    peak_kw: float,
    demand_rate_inr_per_kw: float = 350.0,
) -> float:
    """Calculates contracted/measured maximum demand charge in INR."""
    return round(float(peak_kw * demand_rate_inr_per_kw), 2)
