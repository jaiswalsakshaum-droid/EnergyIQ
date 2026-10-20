import {
  useMemo,
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CloudSun,
  Download,
  FileSpreadsheet,
  Gauge,
  HelpCircle,
  Leaf,
  Lightbulb,
  Loader2,
  Menu,
  MoreHorizontal,
  PlugZap,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Anomaly,
  anomalies as initialAnomalies,
  energySeries,
  sampleCsv,
  savingsEstimate,
  sevenDaySeries,
  thirtyDaySeries,
} from "@/lib/energy-data";
import {
  useBackendHealth,
  useKpis,
  useLiveSeries,
  useBuildings,
  useRecommendations,
  useForecast,
  useForecastExplain,
  useAnomalies,
  useUpdateAnomalyStatus,
  useAnomalyExplain,
  useBenchmarks,
  useFeatureImportance,
  useActualVsPredicted,
  useErrorBreakdown,
  useDrift,
  useAnomalyMetrics,
  useSimulatorMutation,
  useTriggerRetrain,
  useRetrainJobStatus,
} from "@/lib/queries";
import { uploadCsv, fetchSampleCsv, API_BASE_URL } from "@/lib/api";
import type { CsvQualityReport } from "@/lib/types";

type PageKey =
  | "Overview"
  | "Energy Forecast"
  | "Anomaly Detection"
  | "Model Insights"
  | "Savings Simulator"
  | "Data Management";

const pages: { title: PageKey; icon: typeof Gauge }[] = [
  { title: "Overview", icon: Gauge },
  { title: "Energy Forecast", icon: Activity },
  { title: "Anomaly Detection", icon: ShieldAlert },
  { title: "Model Insights", icon: BarChart3 },
  { title: "Savings Simulator", icon: SlidersHorizontal },
  { title: "Data Management", icon: Building2 },
];

const headerCopy: Record<PageKey, { kicker: string; title: string; subtitle: string }> = {
  Overview: {
    kicker: "PORTFOLIO OVERVIEW · LIVE",
    title: "Energy at a glance",
    subtitle: "A live look at the buildings and systems that power your business.",
  },
  "Energy Forecast": {
    kicker: "PREDICTIVE ANALYTICS · 95% CONFIDENCE",
    title: "Energy forecast",
    subtitle: "Plan ahead with multi-horizon load forecasts and peak demand estimates.",
  },
  "Anomaly Detection": {
    kicker: "BUILDING WATCH · CONTINUOUS MONITORING",
    title: "Anomaly detection",
    subtitle: "Ensemble-detected meter faults, overnight waste, and demand surges.",
  },
  "Model Insights": {
    kicker: "MODEL PERFORMANCE · REAL-TIME BENCHMARKS",
    title: "Model insights",
    subtitle: "Explore walk-forward validation benchmarks, SHAP explanations, and drift tracking.",
  },
  "Savings Simulator": {
    kicker: "WHAT-IF ANALYSIS · SCENARIO PLANNING",
    title: "Savings simulator",
    subtitle:
      "Estimate data-driven energy and demand charge savings from BMS schedule adjustments.",
  },
  "Data Management": {
    kicker: "YOUR ENERGY DATA · SERVER INGESTION & PIPELINE",
    title: "Data management",
    subtitle:
      "Upload smart meter CSV exports, inspect server quality audits, and trigger model retraining.",
  },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EnergyIQ — AI-Powered Building Energy Intelligence" },
      {
        name: "description",
        content:
          "EnergyIQ provides building energy analytics, predictive forecasting, ensemble anomaly detection, and energy savings simulation.",
      },
      { property: "og:title", content: "EnergyIQ — AI-Powered Building Energy Intelligence" },
      {
        property: "og:description",
        content:
          "A modern energy analytics dashboard with predictive forecasting and savings simulation.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: EnergyDashboard,
});

const formatNumber = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const rupees = (n: number) => `₹${formatNumber(n)}`;

const BUILDINGS_LIST = [
  "All Buildings",
  "North Tower",
  "Innovation Hub",
  "West Annex",
  "South Studio",
  "Central Library",
];

function EnergyDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState("All Buildings");

  // Backend health status
  const { data: isBackendOnline = false } = useBackendHealth();

  const current = headerCopy[activePage];
  const selectPage = (page: PageKey) => {
    setActivePage(page);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="sidebar hidden lg:flex">
        <div className="brand-lockup">
          <div className="brand-symbol">
            <Zap size={19} fill="currentColor" />
          </div>
          <div>
            <span className="brand-name">
              energy<span>IQ</span>
            </span>
            <span className="brand-caption">BUILDING INTELLIGENCE</span>
          </div>
        </div>

        <div className="portfolio-switch">
          <div className="portfolio-glyph">
            <Building2 size={16} />
          </div>
          <div className="min-w-0">
            <span className="portfolio-label">WORKSPACE</span>
            <span className="portfolio-name">Aster Commercial Campus</span>
          </div>
          <ChevronDown size={15} className="portfolio-chevron" />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation" className="nav-list">
          {pages.map(({ title, icon: Icon }) => (
            <Button
              key={title}
              variant="ghost"
              onClick={() => selectPage(title)}
              aria-current={activePage === title ? "page" : undefined}
              className={`nav-item ${activePage === title ? "nav-item-active" : ""}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{title}</span>
              {title === "Anomaly Detection" && <span className="nav-count">4</span>}
            </Button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-note">
          <div className="note-icon">
            <CloudSun size={18} />
          </div>
          <div>
            <div className="note-title">Portfolio Scope</div>
            <div className="note-copy">5 buildings · 128 meters</div>
          </div>
          <MoreHorizontal size={17} className="note-more" />
        </div>

        <Button variant="ghost" className="settings-link">
          <Settings2 size={17} />
          Settings
        </Button>

        <div className="sidebar-profile">
          <div className="avatar avatar-sidebar">AM</div>
          <div className="profile-info">
            <span className="profile-name">Aarav Mehta</span>
            <span className="profile-role">Portfolio Energy Lead</span>
          </div>
          <MoreHorizontal size={18} className="profile-more" />
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-pane min-w-0">
        <header className="topbar">
          <Button
            aria-label="Open navigation"
            variant="ghost"
            size="icon"
            className="mobile-menu lg:hidden"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          <div className="breadcrumbs">
            <span>Aster Properties</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-current">{activePage}</span>
          </div>

          {/* Global Building Selector */}
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="h-8 text-xs w-[170px] bg-background border-input font-medium">
                <Building2 size={13} className="mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUILDINGS_LIST.map((b) => (
                  <SelectItem key={b} value={b} className="text-xs">
                    {b === "All Buildings" ? "Campus Portfolio" : b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="topbar-right">
            {/* Live API vs Offline Fallback Pill */}
            {isBackendOnline ? (
              <div className="demo-pill !bg-emerald-50 !text-emerald-700 !border-emerald-200">
                <span className="demo-dot !bg-emerald-500 animate-pulse" />
                LIVE API (CONNECTED)
              </div>
            ) : (
              <div className="demo-pill">
                <span className="demo-dot !bg-amber-400" />
                DEMO DATA (BACKEND OFFLINE)
              </div>
            )}

            <Button aria-label="Search" variant="ghost" size="icon" className="topbar-icon">
              <Search size={18} />
            </Button>
            <Button
              aria-label="Help"
              variant="ghost"
              size="icon"
              className="topbar-icon help-button"
            >
              <CircleHelp size={18} />
            </Button>
            <div className="avatar topbar-avatar">AM</div>
          </div>
        </header>

        {mobileNavOpen && (
          <div className="mobile-nav-panel lg:hidden">
            {pages.map(({ title, icon: Icon }) => (
              <Button
                variant="ghost"
                key={title}
                onClick={() => selectPage(title)}
                className={`nav-item ${activePage === title ? "nav-item-active" : ""}`}
              >
                <Icon size={18} />
                <span>{title}</span>
                {title === "Anomaly Detection" && <span className="nav-count">4</span>}
              </Button>
            ))}
          </div>
        )}

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{current.kicker}</div>
              <h1>{current.title}</h1>
              <p>{current.subtitle}</p>
            </div>
            <div className="heading-actions">
              <span className="updated-label">
                <span className={`live-dot ${isBackendOnline ? "!bg-emerald-500" : ""}`} />
                {isBackendOnline ? "Live telemetry synced" : "Updated just now"}
              </span>
              <Button variant="outline" className="period-button">
                <span>Oct 20, 2026</span>
                <ChevronDown size={15} />
              </Button>
            </div>
          </div>

          {/* Banner */}
          {isBackendOnline ? (
            <div className="demo-banner !bg-emerald-50/70 !border-emerald-200/80 !text-emerald-950">
              <div className="demo-banner-icon !bg-emerald-100 !text-emerald-700">
                <Zap size={16} />
              </div>
              <span>
                <strong>Live Machine Learning Active</strong>
                <span className="banner-separator">·</span>
                Connected to FastAPI backend with walk-forward XGBoost/Random Forest models,
                TreeSHAP explainability, and SQLite smart meter telemetry.
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Dismiss notice"
                className="banner-close"
                onClick={(event) => event.currentTarget.closest(".demo-banner")?.remove()}
              >
                <X size={15} />
              </Button>
            </div>
          ) : (
            <div className="demo-banner">
              <div className="demo-banner-icon">
                <Sparkles size={16} />
              </div>
              <span>
                <strong>Demo data (backend offline)</strong>
                <span className="banner-separator">·</span>
                Showing verified campus reference dataset. Start the backend with{" "}
                <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">
                  python -m uvicorn app.main:app
                </code>{" "}
                to stream real live models.
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Dismiss notice"
                className="banner-close"
                onClick={(event) => event.currentTarget.closest(".demo-banner")?.remove()}
              >
                <X size={15} />
              </Button>
            </div>
          )}

          {activePage === "Overview" && (
            <Overview onNavigate={selectPage} selectedBuilding={selectedBuilding} />
          )}
          {activePage === "Energy Forecast" && <Forecast selectedBuilding={selectedBuilding} />}
          {activePage === "Anomaly Detection" && (
            <AnomalyDetection selectedBuilding={selectedBuilding} />
          )}
          {activePage === "Model Insights" && <ModelInsights />}
          {activePage === "Savings Simulator" && (
            <SavingsSimulator selectedBuilding={selectedBuilding} />
          )}
          {activePage === "Data Management" && <DataManagement />}

          <footer className="page-footer">
            <span>
              EnergyIQ <span className="footer-dot">·</span> AI-Powered Building Energy Intelligence
            </span>
            <span>
              {isBackendOnline ? "Production Connected API" : "Illustrative offline demo fallback"}
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  change,
  trend,
  detail,
  accent = "green",
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  unit?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  detail: string;
  accent?: "green" | "amber" | "blue" | "rose";
}) {
  const TrendIcon =
    trend === "down" ? ArrowDownRight : trend === "up" ? ArrowUpRight : CheckCircle2;
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${accent}`}>
        <Icon size={17} strokeWidth={1.9} />
      </div>
      <span className="metric-label">{label}</span>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      <div className="metric-foot">
        <span className={`metric-change trend-${trend ?? "neutral"}`}>
          <TrendIcon size={14} />
          {change}
        </span>
        <span className="metric-detail">{detail}</span>
      </div>
    </article>
  );
}

function UsageChart({
  data = energySeries,
  forecastOnly = false,
  confidence = false,
  compact = false,
  peakHour,
}: {
  data?: (
    | EnergyPoint
    | {
        time: string;
        forecast: number;
        upper: number;
        lower: number;
        actual?: number | null;
      }
  )[];
  forecastOnly?: boolean;
  confidence?: boolean;
  compact?: boolean;
  peakHour?: string;
}) {
  return (
    <div className={`chart-wrap ${compact ? "chart-compact" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 14, right: 12, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="94%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#0d9488" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 5" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickMargin={11}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickMargin={9}
            tickFormatter={(value: number) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
              fontSize: "12px",
            }}
          />
          {confidence && (
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#confidenceFill)"
              fillOpacity={0.3}
            />
          )}
          {confidence && (
            <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" fillOpacity={1} />
          )}
          {!forecastOnly && (
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2.2}
              fill="url(#usageFill)"
              activeDot={{ r: 4, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#0d9488"
            strokeWidth={2}
            strokeDasharray={forecastOnly ? "0" : "4 4"}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function Legend({
  items,
}: {
  items: { label: string; tone: "green" | "teal" | "dashed" | "lavender" }[];
}) {
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <span key={item.label} className="legend-item">
          <i className={`legend-mark legend-${item.tone}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/* ==========================================================================
   PAGE 1 — OVERVIEW
   ========================================================================== */
function Overview({
  onNavigate,
  selectedBuilding,
}: {
  onNavigate: (page: PageKey) => void;
  selectedBuilding: string;
}) {
  const [range, setRange] = useState<"24 hours" | "7 days">("24 hours");

  // API hooks
  const { data: kpisData } = useKpis();
  const { data: liveData } = useLiveSeries(range === "24 hours" ? 24 : 168);
  const { data: buildingsData } = useBuildings();
  const { data: recommendationsData } = useRecommendations();

  // Fallback data
  const chartData = liveData || (range === "24 hours" ? energySeries : sevenDaySeries);

  const kpis = {
    current: kpisData ? formatNumber(kpisData.currentConsumptionKwh) : "1,284",
    forecast24: kpisData ? formatNumber(kpisData.forecast24hKwh) : "1,106",
    cost: kpisData ? `₹${kpisData.estMonthlyCostLakh.toFixed(2)}` : "₹5.14",
    anomalies: kpisData ? kpisData.activeAnomalies.toString() : "4",
    co2: kpisData ? kpisData.co2EmissionsTonnes.toFixed(2) : "0.92",
  };

  const buildings = buildingsData || [
    {
      name: "North Tower",
      area: "Headquarters · 18 floors",
      currentKwh: 438,
      share: 76,
      peakKw: 94,
    },
    {
      name: "Innovation Hub",
      area: "R&D Wing · Labs A & B",
      currentKwh: 362,
      share: 63,
      peakKw: 88,
    },
    { name: "West Annex", area: "Operations & Logistics", currentKwh: 281, share: 49, peakKw: 65 },
    {
      name: "South Studio",
      area: "Design Center & Cafeteria",
      currentKwh: 203,
      share: 35,
      peakKw: 52,
    },
    {
      name: "Central Library",
      area: "Academic Archives & Commons",
      currentKwh: 145,
      share: 25,
      peakKw: 42,
    },
  ];

  const recommendations = recommendationsData || [
    {
      id: "1",
      copy: "Overnight consumption exceeds Aster campus target by 3.6%.",
      impact: "Save ~₹12,100/mo",
      severity: "Medium" as const,
      building: "North Tower",
    },
    {
      id: "2",
      copy: "Innovation Hub morning peak spikes baseline demand charge.",
      impact: "Save ~₹8,600/mo",
      severity: "High" as const,
      building: "Innovation Hub",
    },
    {
      id: "3",
      copy: "Enforce economizer lockout logic when ambient temperature is below 22°C.",
      impact: "Save ~₹5,400/mo",
      severity: "Low" as const,
      building: "South Studio",
    },
  ];

  return (
    <>
      <div className="metrics-grid">
        <Metric
          icon={Zap}
          label="Current consumption"
          value={kpis.current}
          unit="kWh"
          change="8.2%"
          trend="up"
          detail="vs. yesterday"
          accent="green"
        />
        <Metric
          icon={Activity}
          label="Next 24h forecast"
          value={kpis.forecast24}
          unit="kWh"
          change="4.1%"
          trend="down"
          detail="vs. current day"
          accent="blue"
        />
        <Metric
          icon={PlugZap}
          label="Est. monthly cost"
          value={kpis.cost}
          unit="L"
          change="6.4%"
          trend="down"
          detail="vs. last month"
          accent="amber"
        />
        <Metric
          icon={AlertTriangle}
          label="Active anomalies"
          value={kpis.anomalies}
          change="2 new today"
          trend="up"
          detail="across buildings"
          accent="rose"
        />
        <Metric
          icon={Leaf}
          label="CO₂ emissions"
          value={kpis.co2}
          unit="t"
          change="3.8%"
          trend="down"
          detail="vs. last week"
          accent="green"
        />
      </div>

      <div className="overview-grid">
        <Panel
          className="usage-panel"
          title="Electricity consumption"
          subtitle={`Real-time and forecasted demand across ${selectedBuilding === "All Buildings" ? "all Aster campus meters" : selectedBuilding}`}
          action={
            <div className="segmented-control">
              {(["24 hours", "7 days"] as const).map((label) => (
                <button
                  key={label}
                  type="button"
                  className={range === label ? "segment-active" : ""}
                  onClick={() => setRange(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          <div className="usage-chart-summary">
            <div>
              <span className="chart-big-value">
                {range === "24 hours" ? kpis.current : "7,260"} <small>kWh</small>
              </span>
              <span className="chart-summary-sub">
                <span className="chart-summary-trend">
                  <ArrowUpRight size={13} />
                  8.2%
                </span>{" "}
                vs. previous period
              </span>
            </div>
            <Legend
              items={[
                { label: "Actual", tone: "green" },
                { label: "Forecast", tone: "dashed" },
              ]}
            />
          </div>
          <UsageChart data={chartData} />
        </Panel>

        <Panel
          title="Building breakdown"
          subtitle="Current load distribution by facility"
          action={
            <Button
              aria-label="Building usage options"
              variant="ghost"
              size="icon"
              className="panel-more"
            >
              <MoreHorizontal size={19} />
            </Button>
          }
        >
          <div className="building-list">
            {buildings.map((building, index) => (
              <div className="building-row" key={building.name}>
                <div className={`building-avatar building-avatar-${index % 4}`}>
                  <Building2 size={16} />
                </div>
                <div className="building-info">
                  <span className="building-name">{building.name}</span>
                  <span className="building-area">{building.area}</span>
                </div>
                <div className="building-meter">
                  <span className="building-value">
                    {building.currentKwh} <small>kWh</small>
                  </span>
                  <div className="building-bar">
                    <div className="building-bar-fill" style={{ width: `${building.share}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="overview-subgrid">
        <Panel
          title="Recommended actions"
          subtitle="Data-driven opportunities to optimize load & tariff"
          action={
            <Button
              variant="ghost"
              className="panel-action-link"
              onClick={() => onNavigate("Savings Simulator")}
            >
              Run simulator <ArrowRight size={14} />
            </Button>
          }
        >
          <div className="recommendation-list">
            {recommendations.map((reco, idx) => (
              <Recommendation
                key={reco.id}
                icon={idx === 0 ? CloudSun : idx === 1 ? Activity : Leaf}
                title={`Optimize ${reco.building}`}
                copy={reco.copy}
                impact={reco.impact}
                tone={reco.severity === "High" ? "amber" : "blue"}
                onClick={() => onNavigate("Savings Simulator")}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Active alerts & anomalies"
          subtitle="Signals requiring operational attention"
          action={<span className="attention-count">{kpis.anomalies} open</span>}
        >
          <div className="alert-list">
            <AlertRow
              severity="high"
              title="Unusual overnight usage"
              location="North Tower · 2:14 AM"
              badge="High"
              onClick={() => onNavigate("Anomaly Detection")}
            />
            <AlertRow
              severity="medium"
              title="Morning start-up spike"
              location="Innovation Hub · 9:42 AM"
              badge="Medium"
              onClick={() => onNavigate("Anomaly Detection")}
            />
            <AlertRow
              severity="low"
              title="Sub-meter reading drop"
              location="West Annex · Yesterday"
              badge="Low"
              onClick={() => onNavigate("Anomaly Detection")}
            />
          </div>
          <Button
            variant="ghost"
            className="text-link"
            onClick={() => onNavigate("Anomaly Detection")}
          >
            Review all detected anomalies <ArrowRight size={15} />
          </Button>
        </Panel>
      </div>

      <div className="quick-stats">
        <div className="quick-stat">
          <div className="quick-stat-icon">
            <Activity size={16} />
          </div>
          <div>
            <span className="quick-stat-label">Peak demand today</span>
            <span className="quick-stat-value">
              94.2 <small>kW</small>
            </span>
          </div>
          <span className="quick-stat-time">Recorded at 2:00 PM</span>
        </div>
        <div className="quick-stat-divider" />
        <div className="quick-stat">
          <div className="quick-stat-icon quiet-icon">
            <CloudSun size={16} />
          </div>
          <div>
            <span className="quick-stat-label">After-hours consumption</span>
            <span className="quick-stat-value">
              18.6 <small>%</small>
            </span>
          </div>
          <span className="quick-stat-time">vs. 15.0% target baseline</span>
        </div>
        <Button
          variant="outline"
          className="quick-stat-action"
          onClick={() => onNavigate("Savings Simulator")}
        >
          Simulate after-hours savings <ArrowRight size={14} />
        </Button>
      </div>
    </>
  );
}

function Recommendation({
  icon: Icon,
  title,
  copy,
  impact,
  tone,
  onClick,
}: {
  icon: typeof Zap;
  title: string;
  copy: string;
  impact: string;
  tone: string;
  onClick?: () => void;
}) {
  return (
    <div className="recommendation-row" onClick={onClick}>
      <div className={`recommendation-icon reco-${tone}`}>
        <Icon size={17} />
      </div>
      <div className="recommendation-copy">
        <span className="recommendation-title">{title}</span>
        <span>{copy}</span>
      </div>
      <div className="recommendation-impact">
        {impact}
        <ArrowRight size={14} />
      </div>
    </div>
  );
}

function AlertRow({
  severity,
  title,
  location,
  badge,
  onClick,
}: {
  severity: "high" | "medium" | "low";
  title: string;
  location: string;
  badge: string;
  onClick?: () => void;
}) {
  return (
    <div className="alert-row" style={{ cursor: "pointer" }} onClick={onClick}>
      <span className={`severity-dot severity-${severity}`} />
      <div className="alert-copy">
        <span className="alert-title">{title}</span>
        <span>{location}</span>
      </div>
      <Badge className={`severity-badge badge-${severity}`}>{badge}</Badge>
    </div>
  );
}

/* ==========================================================================
   PAGE 2 — ENERGY FORECAST
   ========================================================================== */
function Forecast({ selectedBuilding }: { selectedBuilding: string }) {
  const [horizon, setHorizon] = useState<"24 hours" | "7 days" | "30 days">("24 hours");
  const [model, setModel] = useState("XGBoost (Tuned)");
  const [explainOpen, setExplainOpen] = useState(false);

  // Live forecast query
  const { data: forecastData, isLoading } = useForecast({
    horizon,
    model,
    building: selectedBuilding,
  });

  // Local explanation query for SHAP drawer
  const targetBuilding = selectedBuilding === "All Buildings" ? "North Tower" : selectedBuilding;
  const { data: explainData, isLoading: explainLoading } = useForecastExplain(
    targetBuilding,
    "14:00",
    explainOpen,
  );

  // Fallback points
  const chartData = useMemo(() => {
    if (forecastData && forecastData.points.length > 0) {
      return forecastData.points;
    }
    const raw =
      horizon === "24 hours"
        ? energySeries
        : horizon === "7 days"
          ? sevenDaySeries
          : thirtyDaySeries;
    return raw;
  }, [forecastData, horizon]);

  const total = forecastData
    ? forecastData.totalKwh
    : horizon === "24 hours"
      ? 1106
      : horizon === "7 days"
        ? 7720
        : 32460;
  const estCost = forecastData ? forecastData.estCostInr : Math.round(total * 8.5);
  const peakDemand = forecastData ? forecastData.peakDemandKw.toFixed(1) : "94.2";
  const peakTime = forecastData ? forecastData.peakDemandTime : "2:00 PM";

  return (
    <div className="page-stack">
      <div className="filter-toolbar">
        <div className="filter-group">
          <span className="filter-label">FORECAST HORIZON</span>
          <div className="segmented-control">
            {(["24 hours", "7 days", "30 days"] as const).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setHorizon(item)}
                className={horizon === item ? "segment-active" : ""}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="model-picker">
          <span className="filter-label">FORECAST MODEL</span>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="model-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="XGBoost (Tuned)">XGBoost (Tuned · Best Walk-Forward)</SelectItem>
              <SelectItem value="Random Forest">Random Forest Regressor</SelectItem>
              <SelectItem value="Ridge Regression">Ridge Regularized Linear</SelectItem>
              <SelectItem value="Seasonal Naive (t-168h)">Seasonal Naive Baseline</SelectItem>
              <SelectItem value="Moving Average (24h)">Moving Average (24h)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8 border-primary/20 hover:bg-primary/5 text-primary"
            onClick={() => setExplainOpen(true)}
          >
            <Sparkles size={14} className="text-primary" />
            Explain this prediction
          </Button>
        </div>
      </div>

      <div className="metrics-grid metrics-grid-three">
        <Metric
          icon={Activity}
          label={`Predicted usage · ${horizon}`}
          value={formatNumber(total)}
          unit="kWh"
          change="6.2%"
          trend="down"
          detail="vs. prior period"
          accent="green"
        />
        <Metric
          icon={PlugZap}
          label="Estimated electricity cost"
          value={rupees(estCost)}
          change="₹8.5 / kWh"
          trend="neutral"
          detail="campus blended grid tariff"
          accent="amber"
        />
        <Metric
          icon={Zap}
          label="Expected peak demand"
          value={peakDemand}
          unit="kW"
          change={peakTime}
          trend="neutral"
          detail="predicted coincident maximum peak"
          accent="blue"
        />
      </div>

      <Panel
        title="Usage forecast & 90% confidence interval"
        subtitle={`${model} · ${horizon} horizon with quantile uncertainty bounds`}
      >
        <div className="usage-chart-summary">
          <div>
            <span className="chart-big-value">
              {formatNumber(total)} <small>kWh</small>
            </span>
            <span className="chart-summary-sub">
              Estimated consumption for {selectedBuilding} over selected {horizon} window
            </span>
          </div>
          <Legend
            items={[
              { label: "Historical / Current", tone: "green" },
              { label: "Forecasted", tone: "teal" },
              { label: "90% Confidence Band", tone: "lavender" },
            ]}
          />
        </div>
        <UsageChart data={chartData} forecastOnly confidence peakHour={peakTime} />
        <div className="forecast-footnote">
          <span className="footnote-mark">
            <CircleHelp size={14} />
          </span>
          Quantile prediction bounds calibrated across multi-building test horizons. Empirical
          coverage: 98.2%.
        </div>
      </Panel>

      <div className="forecast-bottom-grid">
        <Panel title="Daily demand pattern" subtitle="Operational profile distribution">
          <div className="daily-pattern">
            <div className="pattern-stat">
              <span>Peak demand window</span>
              <strong>{peakTime} (Coincident Peak)</strong>
            </div>
            <div className="pattern-stat">
              <span>Minimum overnight baseload</span>
              <strong>3:00 AM – 4:45 AM</strong>
            </div>
            <div className="pattern-stat">
              <span>Working hours consumption share</span>
              <strong>
                71.4% <small>of total daily energy</small>
              </strong>
            </div>
          </div>
        </Panel>

        <Panel title="Model specification" subtitle={`Selected algorithm: ${model}`}>
          <div className="context-model-row">
            <div className="context-model-icon">
              <Activity size={17} />
            </div>
            <div>
              <strong>{model}</strong>
              <span>
                {model.includes("XGBoost")
                  ? "Gradient boosted decision trees with Optuna hyperparameter optimization, cyclic temporal encoding, and weather interaction features."
                  : model.includes("Random Forest")
                    ? "Ensemble of 100 deep regression trees trained on lagged telemetry and rolling averages."
                    : "Linear regularization model with strictly shifted feature vectors."}
              </span>
            </div>
            <Badge
              variant="outline"
              className="demo-tag text-emerald-700 bg-emerald-50 border-emerald-200"
            >
              TRAINED
            </Badge>
          </div>
          <p className="context-copy">
            Evaluated on walk-forward chronological splits with zero lookahead leakage.
          </p>
        </Panel>
      </div>

      {/* SHAP Explanation Sheet / Drawer */}
      <Sheet open={explainOpen} onOpenChange={setExplainOpen}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Prediction Explanation (SHAP)
            </SheetTitle>
            <SheetDescription>
              TreeSHAP local feature attribution for {targetBuilding} at peak hour 14:00.
            </SheetDescription>
          </SheetHeader>

          {explainLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span>Computing SHAP Shapley values...</span>
            </div>
          ) : explainData ? (
            <div className="mt-6 space-y-6">
              {/* Natural Language Sentence */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800">
                <strong>Plain Language Summary:</strong>
                <p className="mt-1 text-slate-600">{explainData.summarySentence}</p>
              </div>

              {/* Prediction Summary */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Predicted Load
                  </span>
                  <div className="text-xl font-bold text-foreground mt-0.5">
                    {explainData.predictedKwh} <small className="text-xs">kWh</small>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Expected Baseline
                  </span>
                  <div className="text-xl font-bold text-slate-700 mt-0.5">
                    {explainData.baseValueKwh} <small className="text-xs">kWh</small>
                  </div>
                </div>
              </div>

              {/* Waterfall Contributions Chart */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                  Top Positive Load Drivers (+kWh)
                </h4>
                <div className="space-y-2">
                  {explainData.topPositive.map((c) => (
                    <div key={c.feature} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{c.displayName}</span>
                        <span className="font-semibold text-rose-600">+{c.impactKwh} kWh</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, (c.impactKwh / 25) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {explainData.topNegative.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                    Top Negative Offsets (-kWh)
                  </h4>
                  <div className="space-y-2">
                    {explainData.topNegative.map((c) => (
                      <div key={c.feature} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{c.displayName}</span>
                          <span className="font-semibold text-emerald-600">{c.impactKwh} kWh</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (Math.abs(c.impactKwh) / 25) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-6">SHAP explanations unavailable.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ==========================================================================
   PAGE 3 — ANOMALY DETECTION
   ========================================================================== */
function AnomalyDetection({ selectedBuilding }: { selectedBuilding: string }) {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<number>(1);
  const [reviewerNote, setReviewerNote] = useState("");

  // Live queries & mutations
  const { data: apiAnomalies } = useAnomalies({
    severity: severityFilter === "all" ? undefined : severityFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    dateRange: dateRangeFilter === "all" ? undefined : dateRangeFilter,
    building: selectedBuilding === "All Buildings" ? undefined : selectedBuilding,
  });

  const { mutate: updateStatusMutation, isPending: isUpdatingStatus } = useUpdateAnomalyStatus();
  const { data: explainAnomalyData } = useAnomalyExplain(selectedAnomalyId, true);

  const anomalyList = apiAnomalies || initialAnomalies;

  const selectedAnomaly = useMemo(() => {
    return (
      anomalyList.find((a) => a.id === selectedAnomalyId) || anomalyList[0] || initialAnomalies[0]
    );
  }, [anomalyList, selectedAnomalyId]);

  const updateStatus = (status: "Reviewed" | "Confirmed" | "False alarm") => {
    if (!selectedAnomaly) return;
    updateStatusMutation({
      id: selectedAnomaly.id,
      status,
      reviewerNote: reviewerNote.trim() || undefined,
    });
  };

  const handleExportCsv = () => {
    window.open(`${API_BASE_URL}/api/anomalies/export.csv`, "_blank");
  };

  return (
    <div className="page-stack">
      <div className="filter-toolbar">
        <div className="filter-group">
          <span className="filter-label">SEVERITY</span>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="filter-group">
          <span className="filter-label">ANOMALY TYPE</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="overnight usage">Overnight Usage</SelectItem>
              <SelectItem value="usage spike">Usage Spike</SelectItem>
              <SelectItem value="sudden drop">Sudden Drop</SelectItem>
              <SelectItem value="sensor fault">Sensor Fault</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="filter-group">
          <span className="filter-label">DATE RANGE</span>
          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className="filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ranges</SelectItem>
              <SelectItem value="24 hours">Past 24 Hours</SelectItem>
              <SelectItem value="7 days">Past 7 Days</SelectItem>
              <SelectItem value="30 days">Past 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs h-8 gap-1.5"
          >
            <Download size={13} />
            Export CSV
          </Button>
        </div>
      </div>

      <Panel
        title="Detected anomalies"
        subtitle="Ensemble algorithm results (Residual MAD 3-sigma + Isolation Forest + Rule checks)"
        action={<span className="attention-count">{anomalyList.length} incidents found</span>}
      >
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>BUILDING</th>
                <th>ANOMALY TYPE</th>
                <th>ACTUAL</th>
                <th>EXPECTED</th>
                <th>DEVIATION</th>
                <th>SEVERITY</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {anomalyList.map((item) => {
                const deviation = item.actual - item.expected;
                const isSelected = item.id === selectedAnomaly?.id;
                return (
                  <tr
                    key={item.id}
                    className={isSelected ? "table-row-selected" : ""}
                    onClick={() => setSelectedAnomalyId(item.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="cell-time">{item.time}</td>
                    <td className="cell-building">{item.building}</td>
                    <td>
                      <span className="anomaly-type-tag">{item.type}</span>
                    </td>
                    <td className="cell-number font-medium">
                      {item.actual} <small>kWh</small>
                    </td>
                    <td className="cell-number cell-muted">
                      {item.expected} <small>kWh</small>
                    </td>
                    <td className="cell-number font-medium">
                      <span className={deviation > 0 ? "text-rose-600" : "text-amber-600"}>
                        {deviation > 0 ? `+${deviation}` : deviation} kWh
                      </span>
                    </td>
                    <td>
                      <Badge className={`severity-badge badge-${item.severity.toLowerCase()}`}>
                        {item.severity}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="outline" className="text-xs">
                        {item.status || "Pending"}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAnomalyId(item.id);
                        }}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Detail / Explain Card */}
      {selectedAnomaly && (
        <Panel
          title={`Incident #${selectedAnomaly.id}: ${selectedAnomaly.type}`}
          subtitle={`${selectedAnomaly.building} · ${selectedAnomaly.time}`}
          action={
            <div className="flex items-center gap-2">
              <Badge className={`severity-badge badge-${selectedAnomaly.severity.toLowerCase()}`}>
                {selectedAnomaly.severity} Severity
              </Badge>
              <Badge variant="outline">{selectedAnomaly.status || "Pending"}</Badge>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs uppercase font-semibold text-muted-foreground">
                  Meter Deviation
                </span>
                <div className="text-xl font-bold mt-1 text-slate-800">
                  {selectedAnomaly.actual} vs {selectedAnomaly.expected}{" "}
                  <small className="text-xs">kWh</small>
                </div>
                <span className="text-xs text-rose-600 font-medium">
                  {selectedAnomaly.actual > selectedAnomaly.expected
                    ? `+${selectedAnomaly.actual - selectedAnomaly.expected} kWh wasted`
                    : `${selectedAnomaly.actual - selectedAnomaly.expected} kWh drop`}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs uppercase font-semibold text-muted-foreground">
                  Est. Cost Impact
                </span>
                <div className="text-xl font-bold mt-1 text-slate-800">
                  {rupees(
                    selectedAnomaly.cost ||
                      Math.round(Math.abs(selectedAnomaly.actual - selectedAnomaly.expected) * 8.5),
                  )}
                </div>
                <span className="text-xs text-muted-foreground">At campus tariff ₹8.5/kWh</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs uppercase font-semibold text-muted-foreground">
                  Ensemble Detection
                </span>
                <div className="text-xl font-bold mt-1 text-slate-800">MAD Residual 3σ</div>
                <span className="text-xs text-emerald-600 font-medium">
                  Confirmed by Isolation Forest
                </span>
              </div>
            </div>

            {/* Explanation & Recommendation */}
            <div className="p-4 bg-primary/5 border border-primary/15 rounded-lg space-y-2">
              <div className="text-xs font-semibold uppercase text-primary tracking-wide">
                Why was this flagged? (Root Cause Explanation)
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {explainAnomalyData?.plainTextExplanation || selectedAnomaly.detail}
              </p>
              <div className="mt-2 text-xs font-medium text-slate-700">
                <strong>Recommended Operational Action:</strong>{" "}
                {explainAnomalyData?.recommendedAction || selectedAnomaly.recommendation}
              </div>
            </div>

            {/* Persistence & Feedback Loop Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Add reviewer notes for BMS technician..."
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={selectedAnomaly.status === "Reviewed" ? "default" : "outline"}
                  onClick={() => updateStatus("Reviewed")}
                  disabled={isUpdatingStatus}
                  className="text-xs h-8 gap-1"
                >
                  <Check size={13} /> Mark Reviewed
                </Button>
                <Button
                  size="sm"
                  variant={selectedAnomaly.status === "Confirmed" ? "default" : "outline"}
                  onClick={() => updateStatus("Confirmed")}
                  disabled={isUpdatingStatus}
                  className="text-xs h-8 gap-1"
                >
                  <CheckCircle2 size={13} /> Confirm Issue
                </Button>
                <Button
                  size="sm"
                  variant={selectedAnomaly.status === "False alarm" ? "secondary" : "outline"}
                  onClick={() => updateStatus("False alarm")}
                  disabled={isUpdatingStatus}
                  className="text-xs h-8 gap-1 text-slate-600"
                >
                  <X size={13} /> False Alarm (Feedback)
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ==========================================================================
   PAGE 4 — MODEL INSIGHTS
   ========================================================================== */
function ModelInsights() {
  const { data: benchmarksData, isLoading: benchLoading } = useBenchmarks();
  const { data: featureData } = useFeatureImportance();
  const { data: driftData } = useDrift();
  const { data: anomalyMetricsData } = useAnomalyMetrics();
  const { data: errorBreakdownData } = useErrorBreakdown();

  const [retrainJobId, setRetrainJobId] = useState<string | null>(null);
  const { mutate: triggerRetrainMutation, isPending: isRetraining } = useTriggerRetrain();
  const { data: jobStatus } = useRetrainJobStatus(retrainJobId);

  const handleRetrain = () => {
    triggerRetrainMutation(undefined, {
      onSuccess: (data) => {
        setRetrainJobId(data.jobId);
      },
    });
  };

  const models = benchmarksData || [
    {
      name: "XGBoost (Tuned)",
      mae: "3.42",
      rmse: "4.81",
      mape: "4.1%",
      r2: "0.942",
      time: "1.8s",
      tone: "best",
      isBest: true,
      mase: "0.459",
    },
    {
      name: "Random Forest",
      mae: "3.91",
      rmse: "5.24",
      mape: "4.7%",
      r2: "0.928",
      time: "3.2s",
      tone: "",
      isBest: false,
      mase: "0.525",
    },
    {
      name: "Ridge Regression",
      mae: "5.18",
      rmse: "6.70",
      mape: "6.2%",
      r2: "0.884",
      time: "0.2s",
      tone: "",
      isBest: false,
      mase: "0.695",
    },
    {
      name: "Seasonal Naive (t-168h)",
      mae: "7.45",
      rmse: "9.82",
      mape: "9.1%",
      r2: "0.774",
      time: "<0.1s",
      tone: "",
      isBest: false,
      mase: "1.000",
    },
  ];

  const features = featureData || [
    { name: "Ambient temperature (CDH)", value: 42 },
    { name: "Building badge-in occupancy", value: 38 },
    { name: "Lagged previous-day load (t-24)", value: 27 },
    { name: "Weekly cyclic baseline (t-168)", value: 21 },
    { name: "Diurnal hour schedule", value: 18 },
  ];

  return (
    <div className="page-stack">
      {/* Retrain Notification / Status */}
      {jobStatus && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <RefreshCw
              size={14}
              className={
                jobStatus.status === "running" ? "animate-spin text-primary" : "text-primary"
              }
            />
            <span>
              Retraining Job <strong>{jobStatus.id}</strong>: Status{" "}
              <Badge variant="outline" className="capitalize text-xs ml-1">
                {jobStatus.status}
              </Badge>
            </span>
          </div>
          {jobStatus.status === "completed" && (
            <span className="text-emerald-600 font-semibold">
              ✓ Models successfully retrained & persisted
            </span>
          )}
        </div>
      )}

      {/* Model Benchmark Leaderboard */}
      <Panel
        title="Model benchmark leaderboard"
        subtitle="Chronological walk-forward TimeSeriesSplit validation on 14-day holdout data"
        action={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50">
              WALK-FORWARD VALIDATED
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetrain}
              disabled={isRetraining || jobStatus?.status === "running"}
              className="text-xs h-7 gap-1"
            >
              <RefreshCw size={12} className={isRetraining ? "animate-spin" : ""} />
              Retrain All Models
            </Button>
          </div>
        }
      >
        <div className="table-scroll">
          <table className="data-table model-table">
            <thead>
              <tr>
                <th>MODEL</th>
                <th>
                  MAE <small>kWh</small>
                </th>
                <th>
                  RMSE <small>kWh</small>
                </th>
                <th>MAPE</th>
                <th>R² SCORE</th>
                <th>MASE (vs Naive)</th>
                <th>DURATION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name}>
                  <td className="model-name-cell">
                    {m.isBest && (
                      <span className="best-mark">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <strong>{m.name}</strong>
                  </td>
                  <td className="cell-number font-medium">{m.mae}</td>
                  <td className="cell-number">{m.rmse}</td>
                  <td className="cell-number">{m.mape}</td>
                  <td className="cell-number font-medium">{m.r2}</td>
                  <td className="cell-number font-semibold text-emerald-700">{m.mase || "1.00"}</td>
                  <td className="cell-time">{m.time}</td>
                  <td>
                    {m.isBest ? (
                      <Badge className="best-badge">BEST MODEL</Badge>
                    ) : (
                      <Badge variant="outline" className="model-tag">
                        CANDIDATE
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Middle Row: Drift & Anomaly Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Covariate Drift Card */}
        <Panel
          title="Covariate drift monitor (KS-test & PSI)"
          subtitle={driftData?.lastReview || "Evaluated across rolling 14-day operational window"}
          action={
            <Badge
              className={
                driftData?.status === "Retrain recommended"
                  ? "bg-rose-500 text-white"
                  : driftData?.status === "Watch"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-500 text-white"
              }
            >
              {driftData?.badge || "Healthy"}
            </Badge>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-700 leading-relaxed">
              {driftData?.summary ||
                "Covariate distributions remain well-calibrated (PSI < 0.10). No statistically significant drift detected."}
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                Population Stability Index (PSI)
              </span>
              {driftData?.psiScores &&
                Object.entries(driftData.psiScores).map(([feat, score]) => (
                  <div key={feat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-slate-700">{feat}</span>
                      <span className="font-semibold text-slate-900">{score.toFixed(3)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 0.25 ? "bg-rose-500" : score >= 0.1 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, (score / 0.3) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Two-sample KS p-value: <strong>{driftData?.pValue ?? 0.28}</strong>
              </span>
              <span>
                Rolling MAE shift: <strong>{driftData?.rollingMaeChangePct ?? -2.1}%</strong>
              </span>
            </div>
          </div>
        </Panel>

        {/* Anomaly Detection Precision / Recall */}
        <Panel
          title="Anomaly detector metrics"
          subtitle="Evaluated against injected ground truth faults (overnight HVAC, spikes, flatlines)"
          action={
            <Badge variant="outline" className="text-xs">
              GROUND TRUTH TESTED
            </Badge>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Precision
                </span>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {anomalyMetricsData
                    ? `${(anomalyMetricsData.precision * 100).toFixed(1)}%`
                    : "92.4%"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Recall
                </span>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {anomalyMetricsData
                    ? `${(anomalyMetricsData.recall * 100).toFixed(1)}%`
                    : "88.6%"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                  F1 Score
                </span>
                <div className="text-xl font-bold text-primary mt-1">
                  {anomalyMetricsData ? anomalyMetricsData.f1Score.toFixed(3) : "0.905"}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mean Detection Delay:</span>
                <strong>
                  {anomalyMetricsData
                    ? `${anomalyMetricsData.meanDetectionDelayMinutes.toFixed(1)} mins`
                    : "14.2 mins"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Injected Incidents Evaluated:</span>
                <strong>{anomalyMetricsData?.totalEvaluated ?? 38}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">True Positives / False Alarms:</span>
                <strong>
                  {anomalyMetricsData?.truePositives ?? 34} /{" "}
                  {anomalyMetricsData?.falsePositives ?? 3}
                </strong>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Global SHAP Feature Importance */}
      <Panel
        title="Global feature importance (SHAP)"
        subtitle="Mean absolute SHAP value E[|SHAP|] across operational telemetry features"
      >
        <div className="space-y-3">
          {features.map((feat) => (
            <div key={feat.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">{feat.name}</span>
                <span className="font-semibold text-primary">{feat.value}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${feat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ==========================================================================
   PAGE 5 — SAVINGS SIMULATOR
   ========================================================================== */
function SavingsSimulator({ selectedBuilding }: { selectedBuilding: string }) {
  const [afterHours, setAfterHours] = useState([18]);
  const [occupancy, setOccupancy] = useState([10]);
  const [usage, setUsage] = useState([12]);
  const [tariff, setTariff] = useState("8.5");

  const tariffRate = parseFloat(tariff) || 8.5;

  // Instant optimistic pure-function calculation
  const instantSavings = useMemo(() => {
    return savingsEstimate(afterHours[0] / 100, occupancy[0] / 100, usage[0] / 100, tariffRate);
  }, [afterHours, occupancy, usage, tariffRate]);

  // Live data-driven simulator mutation
  const { mutate: runSimulation, data: simResponse } = useSimulatorMutation();

  // Debounced API call (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      runSimulation({
        afterHoursReduction: afterHours[0] / 100,
        occupancyChange: occupancy[0] / 100,
        usageAdjustment: usage[0] / 100,
        tariff: tariffRate,
        building: selectedBuilding === "All Buildings" ? undefined : selectedBuilding,
      });
    }, 250);

    return () => clearTimeout(handler);
  }, [afterHours, occupancy, usage, tariffRate, selectedBuilding, runSimulation]);

  const savings = simResponse
    ? {
        reduction: simResponse.reduction,
        savings: simResponse.savings,
        co2: simResponse.co2,
        baseline: simResponse.monthlyBaselineKwh,
        projected: simResponse.projectedMonthlyKwh,
        peakReduction: simResponse.peakDemandReductionKw,
        note: simResponse.confidenceNote,
      }
    : {
        reduction: instantSavings.reduction,
        savings: instantSavings.savings,
        co2: instantSavings.co2,
        baseline: 42800,
        projected: 42800 - instantSavings.reduction,
        peakReduction: 4.8,
        note: "Calculated using building thermal baseline and tariff rate.",
      };

  const resetDefaults = () => {
    setAfterHours([18]);
    setOccupancy([10]);
    setUsage([12]);
    setTariff("8.5");
  };

  return (
    <div className="page-stack">
      <div className="illustrative-strip">
        <Sparkles size={16} />
        <span>
          Data-driven savings scenario calibrated on trailing 30-day smart meter readings and
          empirical after-hours load shares.
        </span>
      </div>

      <div className="simulator-layout">
        {/* Controls Panel */}
        <Panel
          title="Operational levers"
          subtitle="Adjust simulation sliders to see real-time impact"
          action={
            <Button variant="ghost" size="sm" onClick={resetDefaults} className="gap-1 text-xs">
              <RotateCcw size={13} /> Reset
            </Button>
          }
          className="sim-controls-panel"
        >
          <div className="assumption-control">
            <div className="assumption-title">
              <div className="assumption-icon assumption-green">
                <CloudSun size={17} />
              </div>
              <div>
                <strong>Reduce after-hours baseload</strong>
                <span>Curtail overnight standby power & unneeded chiller circuits</span>
              </div>
              <span className="assumption-value">{afterHours[0]}%</span>
            </div>
            <Slider
              aria-label="After-hours reduction"
              value={afterHours}
              onValueChange={setAfterHours}
              min={0}
              max={50}
              step={1}
            />
            <div className="slider-scale">
              <span>0% (Status quo)</span>
              <span>50% (Aggressive curtailment)</span>
            </div>
          </div>

          <div className="assumption-control">
            <div className="assumption-title">
              <div className="assumption-icon assumption-blue">
                <Building2 size={17} />
              </div>
              <div>
                <strong>Occupancy-based conditioning</strong>
                <span>Consolidate floor utilization & optimize zone setpoints</span>
              </div>
              <span className="assumption-value">{occupancy[0]}%</span>
            </div>
            <Slider
              aria-label="Occupancy optimization"
              value={occupancy}
              onValueChange={setOccupancy}
              min={0}
              max={30}
              step={1}
            />
            <div className="slider-scale">
              <span>0%</span>
              <span>30%</span>
            </div>
          </div>

          <div className="assumption-control">
            <div className="assumption-title">
              <div className="assumption-icon assumption-amber">
                <PlugZap size={17} />
              </div>
              <div>
                <strong>Equipment efficiency tuning</strong>
                <span>Variable speed pump staging & chiller delta-T setpoint tuning</span>
              </div>
              <span className="assumption-value">{usage[0]}%</span>
            </div>
            <Slider
              aria-label="Equipment efficiency"
              value={usage}
              onValueChange={setUsage}
              min={0}
              max={40}
              step={1}
            />
            <div className="slider-scale">
              <span>0%</span>
              <span>40%</span>
            </div>
          </div>

          <div className="tariff-field">
            <label htmlFor="tariff">Electricity tariff rate</label>
            <span className="tariff-help">
              Blended grid rate in Indian Rupees per kilowatt-hour
            </span>
            <div className="tariff-input-wrap">
              <span>₹</span>
              <Input
                id="tariff"
                inputMode="decimal"
                type="number"
                min="0"
                step="0.5"
                value={tariff}
                onChange={(e) => setTariff(e.target.value)}
                aria-label="Electricity tariff in rupees per kWh"
              />
              <span>/ kWh</span>
            </div>
          </div>

          <div className="baseline-note">
            <CircleHelp size={15} />
            <span>{savings.note}</span>
          </div>
        </Panel>

        {/* Results Panel */}
        <div className="sim-results">
          <section className="savings-feature">
            <div className="savings-feature-top">
              <span className="savings-feature-label">
                <Leaf size={15} /> ESTIMATED MONTHLY SAVINGS
              </span>
              <span className="savings-demo-chip">DATA-DRIVEN</span>
            </div>
            <div className="savings-amount">{rupees(savings.savings)}</div>
            <div className="savings-caption">
              projected reduction in monthly electricity expenditures
            </div>

            <div className="savings-stats">
              <div>
                <span>Energy reduction</span>
                <strong>
                  {formatNumber(savings.reduction)} <small>kWh / mo</small>
                </strong>
              </div>
              <div>
                <span>Avoided greenhouse gas</span>
                <strong>
                  {savings.co2.toFixed(2)} <small>tCO₂ / mo</small>
                </strong>
              </div>
            </div>

            <div className="savings-stats !mt-2 pt-2 border-t border-emerald-500/20">
              <div>
                <span>Avoided Peak Demand</span>
                <strong>
                  {savings.peakReduction} <small>kW peak</small>
                </strong>
              </div>
              <div>
                <span>Projected Monthly Load</span>
                <strong>
                  {formatNumber(savings.projected)} <small>kWh</small>
                </strong>
              </div>
            </div>

            <div className="savings-footnote">
              <Sparkles size={14} />
              <span>
                Based on measured baseline {formatNumber(savings.baseline)} kWh at ₹{tariffRate}
                /kWh.
              </span>
            </div>
          </section>

          <Panel title="Before & after comparison" subtitle="Projected monthly consumption drop">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Current Baseline", usage: savings.baseline },
                    { name: "With Simulations", usage: savings.projected },
                  ]}
                  margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: number) => [`${formatNumber(val)} kWh`, "Load"]} />
                  <Bar dataKey="usage" radius={[6, 6, 0, 0]}>
                    <Cell fill="#94a3b8" />
                    <Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE 6 — DATA MANAGEMENT
   ========================================================================== */
function DataManagement() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [qualityReport, setQualityReport] = useState<CsvQualityReport | null>(null);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);

  const [retrainJobId, setRetrainJobId] = useState<string | null>(null);
  const { data: retrainJob } = useRetrainJobStatus(retrainJobId);

  const processFile = async (file?: File) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);
    setCommitMessage(null);

    try {
      // Call server validation endpoint (commit=false)
      const report = await uploadCsv(file, false);
      setQualityReport(report);
    } catch (err: unknown) {
      setQualityReport({
        rows: 0,
        missingCells: 0,
        duplicateTimestamps: 0,
        coveragePct: 0,
        gaps: [],
        issues: [(err as Error).message || "Failed to parse CSV file"],
        isValid: false,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCommitAndRetrain = async () => {
    if (!selectedFile) return;
    setCommitting(true);
    setCommitMessage(null);

    try {
      const res = await uploadCsv(selectedFile, true);
      setQualityReport(res);
      setCommitMessage(res.message || "Data successfully committed to SQLite database.");

      // Check for triggered retrain job
      const triggered = await fetch(`${API_BASE_URL}/api/models/retrain`, { method: "POST" });
      if (triggered.ok) {
        const body = await triggered.json();
        setRetrainJobId(body.jobId);
      }
    } catch (err: unknown) {
      setCommitMessage(`Commit failed: ${(err as Error).message}`);
    } finally {
      setCommitting(false);
    }
  };

  const downloadSample = async () => {
    try {
      const csv = await fetchSampleCsv();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "energyiq-sample.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const url = URL.createObjectURL(new Blob([sampleCsv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "energyiq-sample.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="page-stack">
      <div className="data-overview-strip">
        <div className="data-overview-icon">
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <strong>Meter data pipeline & server ingestion</strong>
          <span>
            Aster Portfolio dataset · 5 buildings · Hourly sampling frequency with weather telemetry
          </span>
        </div>
        <div className="data-overview-stats">
          <span>
            <strong>128</strong> sub-meters
          </span>
          <span>
            <strong>12 months</strong> historical depth
          </span>
          <span>
            <strong>SQLite 2.0</strong> persisted layer
          </span>
        </div>
      </div>

      <Panel
        title="Upload or inspect CSV"
        subtitle="Upload a smart meter export to run automated schema checks, anomaly sanitization, and server quality audits"
        action={
          <Button variant="outline" className="sample-button text-xs h-8" onClick={downloadSample}>
            <Download size={14} />
            Download sample CSV
          </Button>
        }
      >
        <div className="dropzone" onClick={() => inputRef.current?.click()}>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => void processFile(e.target.files?.[0])}
            aria-label="Choose CSV file"
          />
          <div className="upload-icon">
            <Upload size={22} />
          </div>
          <div className="dropzone-copy">
            <strong>Drop your meter CSV here</strong>
            <span>
              or click to browse from your device · (timestamp, building, kwh, peak_kw,
              temperature_c)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            <FileSpreadsheet size={15} className="mr-1" />
            Choose file
          </Button>
        </div>

        {uploading && (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span>Server analyzing CSV quality report...</span>
          </div>
        )}

        {/* Server Quality Report Card */}
        {qualityReport && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-primary" />
                <span className="font-semibold text-sm text-slate-900">
                  {selectedFile?.name || "Uploaded CSV"}
                </span>
              </div>
              <Badge
                className={
                  qualityReport.isValid ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                }
              >
                {qualityReport.isValid ? "AUDIT PASSED" : "ISSUES FOUND"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-muted-foreground">Total Rows</span>
                <div className="font-bold text-sm text-slate-800">
                  {formatNumber(qualityReport.rows)}
                </div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-muted-foreground">Missing Cells</span>
                <div className="font-bold text-sm text-slate-800">{qualityReport.missingCells}</div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-muted-foreground">Duplicates</span>
                <div className="font-bold text-sm text-slate-800">
                  {qualityReport.duplicateTimestamps}
                </div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-muted-foreground">Coverage</span>
                <div className="font-bold text-sm text-emerald-600">
                  {qualityReport.coveragePct}%
                </div>
              </div>
            </div>

            {qualityReport.issues.length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
                <strong>Quality Notices:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {qualityReport.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {commitMessage && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">
                {commitMessage}
              </div>
            )}

            {retrainJob && (
              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded text-xs flex items-center justify-between">
                <span>
                  Retraining Background Job: <strong>{retrainJob.status}</strong>
                </span>
                {retrainJob.status === "running" && (
                  <Loader2 size={13} className="animate-spin text-primary" />
                )}
              </div>
            )}

            {qualityReport.isValid && (
              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleCommitAndRetrain}
                  disabled={committing || retrainJob?.status === "running"}
                  className="gap-1.5 text-xs h-8"
                >
                  {committing ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Commit data and retrain models
                </Button>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
