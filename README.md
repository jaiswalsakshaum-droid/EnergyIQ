# EnergyIQ — AI-Powered Building Energy Intelligence

EnergyIQ is an enterprise building energy analytics platform providing real-time consumption tracking, predictive load forecasting, automated anomaly detection, and interactive savings simulation.

## Repository Structure

```
EnergyIQ/
├── frontend/               # Complete React + TypeScript + Tailwind CSS application
│   ├── src/
│   │   ├── components/     # UI primitives (Radix UI + Tailwind)
│   │   ├── hooks/          # Custom hooks (e.g., use-mobile)
│   │   ├── lib/            # Centralized energy data & savings calculations
│   │   ├── routes/         # 6 dashboard views (Overview, Forecast, Anomalies, Models, Simulator, Data)
│   │   ├── test/           # Vitest unit test suite
│   │   └── styles.css      # SaaS design system (navy sidebar, light canvas, cards)
│   ├── public/             # Static assets (favicons, robots.txt)
│   ├── package.json        # Frontend scripts and dependencies
│   ├── vite.config.ts      # Vite build configuration
│   └── README.md           # Frontend documentation
│
├── backend/                # Backend API service & architecture
│   ├── main.py             # FastAPI reference service
│   ├── schemas.py          # Pydantic v2 data models matching frontend types
│   ├── requirements.txt    # Python dependencies (FastAPI, Uvicorn, Pandas, Scikit-learn)
│   └── README.md           # API specification & architecture guide
│
└── package.json            # Root workspace scripts delegating to frontend/backend
```

## Quick Start

### Frontend (Dashboard UI)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build
```

Or run directly from root:
```bash
npm run dev
npm test
npm run build
```

### Backend (Reference Service)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
