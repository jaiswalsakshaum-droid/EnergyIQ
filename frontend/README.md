# EnergyIQ — Frontend

**AI-Powered Building Energy Intelligence**

This directory contains the complete React + TypeScript + Tailwind CSS frontend application for EnergyIQ.

## Tech Stack
- **Framework**: React 19 + TypeScript + Vite / TanStack Start
- **Styling**: Tailwind CSS v4 + bespoke SaaS design system
- **Icons**: Lucide React
- **Data Visualization**: Recharts (ComposedChart, AreaChart, LineChart, ResponsiveContainer)
- **UI Components**: Radix UI primitives with Tailwind styling

## Application Structure
- `src/routes/index.tsx`: Main dashboard application housing the 6 views:
  1. **Overview**: Portfolio KPIs, live electricity demand chart, building breakdowns, actionable savings recommendations, active alerts.
  2. **Energy Forecast**: 24-hour, 7-day, and 30-day forecast horizons, multi-model selection (Random Forest, XGBoost, Seasonal Baseline), 95% confidence intervals, diurnal pattern breakdowns.
  3. **Anomaly Detection**: Multidimensional filterable anomaly table (severity, type, date range), interactive inspection details panel, status tracking (Reviewed, Confirmed, False Alarm), CSV export.
  4. **Model Insights**: Model validation leaderboard (MAE, RMSE, MAPE, R², training time), actual vs. predicted tracking, feature importance rankings, temporal performance breakdowns, model drift health card.
  5. **Savings Simulator**: Dynamic operational sliders (after-hours reduction, occupancy consolidation, equipment tuning), editable tariff in ₹/kWh, browser-side financial & carbon savings estimation, before-vs-after comparison chart.
  6. **Data Management**: Drag-and-drop CSV upload, client-side CSV parsing, quality validation cards (missing values, duplicate timestamps, coverage), sample CSV download.
- `src/lib/energy-data.ts`: Centralized mock dataset, anomaly records, and savings estimation formulas.
- `src/styles.css`: Dark navy sidebar theme, light neutral canvas, white elevated cards, status tags, responsive grid rules.
- `src/test/`: Vitest unit tests for routing and savings estimation.

## Running Locally
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build
```
