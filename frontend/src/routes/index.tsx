import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
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
  Leaf,
  Lightbulb,
  Menu,
  MoreHorizontal,
  PlugZap,
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
  CartesianGrid,
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
    subtitle: "Plan ahead with illustrative usage forecasts and demand estimates.",
  },
  "Anomaly Detection": {
    kicker: "BUILDING WATCH · CONTINUOUS MONITORING",
    title: "Anomaly detection",
    subtitle: "Review unusual meter readings across your building portfolio.",
  },
  "Model Insights": {
    kicker: "MODEL PERFORMANCE · DEMO VALIDATION",
    title: "Model insights",
    subtitle: "Explore illustrative benchmarks behind the forecast algorithms.",
  },
  "Savings Simulator": {
    kicker: "WHAT-IF ANALYSIS · SCENARIO PLANNING",
    title: "Savings simulator",
    subtitle: "Estimate how operating changes could affect monthly energy costs.",
  },
  "Data Management": {
    kicker: "YOUR ENERGY DATA · IN-BROWSER SECURE",
    title: "Data management",
    subtitle: "Preview a local meter export and check the shape and quality of your data.",
  },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EnergyIQ — AI-Powered Building Energy Intelligence" },
      {
        name: "description",
        content:
          "EnergyIQ provides building energy analytics, predictive forecasting, anomaly detection, and energy savings simulation.",
      },
      { property: "og:title", content: "EnergyIQ — AI-Powered Building Energy Intelligence" },
      {
        property: "og:description",
        content:
          "A modern energy analytics dashboard with predictive forecasting and savings simulation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EnergyDashboard,
});

const formatNumber = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const rupees = (n: number) => `₹${formatNumber(n)}`;

function EnergyDashboard() {
  const [activePage, setActivePage] = useState<PageKey>("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
            <div className="note-copy">4 buildings · 128 meters</div>
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

          <div className="topbar-right">
            <div className="demo-pill">
              <span className="demo-dot" />
              DEMO DATA
            </div>
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
                <span className="live-dot" />
                Updated just now
              </span>
              <Button variant="outline" className="period-button">
                <span>Oct 20, 2026</span>
                <ChevronDown size={15} />
              </Button>
            </div>
          </div>

          <div className="demo-banner">
            <div className="demo-banner-icon">
              <Sparkles size={16} />
            </div>
            <span>
              <strong>Illustrative Demo</strong>
              <span className="banner-separator">·</span>
              All meter readings, anomaly signals, forecasts, and savings simulations use local mock
              data.
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Dismiss demo data notice"
              className="banner-close"
              onClick={(event) => event.currentTarget.closest(".demo-banner")?.remove()}
            >
              <X size={15} />
            </Button>
          </div>

          {activePage === "Overview" && <Overview onNavigate={selectPage} />}
          {activePage === "Energy Forecast" && <Forecast />}
          {activePage === "Anomaly Detection" && <AnomalyDetection />}
          {activePage === "Model Insights" && <ModelInsights />}
          {activePage === "Savings Simulator" && <SavingsSimulator />}
          {activePage === "Data Management" && <DataManagement />}

          <footer className="page-footer">
            <span>
              EnergyIQ <span className="footer-dot">·</span> AI-Powered Building Energy Intelligence
            </span>
            <span>Illustrative client-side demo</span>
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
}: {
  data?: typeof energySeries;
  forecastOnly?: boolean;
  confidence?: boolean;
  compact?: boolean;
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
              borderRadius: 8,
              color: "#0f172a",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "#64748b", marginBottom: 5 }}
            formatter={(value: number, name: string) => [
              `${value} kWh`,
              name === "actual"
                ? "Actual usage"
                : name === "forecast"
                  ? "Predicted usage"
                  : name === "upper"
                    ? "Upper bound (95%)"
                    : "Lower bound (95%)",
            ]}
          />
          {confidence && (
            <Area
              dataKey="upper"
              type="monotone"
              stroke="none"
              fill="url(#confidenceFill)"
              connectNulls
            />
          )}
          {confidence && (
            <Area dataKey="lower" type="monotone" stroke="none" fill="#ffffff" connectNulls />
          )}
          {!forecastOnly && (
            <Area
              dataKey="actual"
              type="monotone"
              stroke="#10b981"
              strokeWidth={2.4}
              fill="url(#usageFill)"
              activeDot={{ r: 4, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
            />
          )}
          <Line
            dataKey="forecast"
            type="monotone"
            stroke="#0d9488"
            strokeWidth={2.4}
            strokeDasharray={forecastOnly ? undefined : "5 5"}
            dot={false}
            activeDot={{ r: 4, fill: "#0d9488", stroke: "#ffffff", strokeWidth: 2 }}
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
function Overview({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const [range, setRange] = useState<"24 hours" | "7 days">("24 hours");
  const chartData = range === "24 hours" ? energySeries : sevenDaySeries;

  return (
    <>
      <div className="metrics-grid">
        <Metric
          icon={Zap}
          label="Current consumption"
          value="1,284"
          unit="kWh"
          change="8.2%"
          trend="up"
          detail="vs. yesterday"
          accent="green"
        />
        <Metric
          icon={Activity}
          label="Next 24h forecast"
          value="1,106"
          unit="kWh"
          change="4.1%"
          trend="down"
          detail="vs. current day"
          accent="blue"
        />
        <Metric
          icon={PlugZap}
          label="Est. monthly cost"
          value="₹5.14"
          unit="L"
          change="6.4%"
          trend="down"
          detail="vs. last month"
          accent="amber"
        />
        <Metric
          icon={AlertTriangle}
          label="Active anomalies"
          value="4"
          change="2 new today"
          trend="up"
          detail="across 3 buildings"
          accent="rose"
        />
        <Metric
          icon={Leaf}
          label="CO₂ emissions"
          value="0.92"
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
          subtitle="Real-time and forecasted demand across all Aster campus meters"
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
                {range === "24 hours" ? "1,284" : "7,260"} <small>kWh</small>
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
            {[
              { name: "North Tower", area: "Headquarters · 18 floors", value: 438, share: 76 },
              { name: "Innovation Hub", area: "R&D Wing · Labs A & B", value: 362, share: 63 },
              { name: "West Annex", area: "Operations & Logistics", value: 281, share: 49 },
              { name: "South Studio", area: "Design Center & Cafeteria", value: 203, share: 35 },
            ].map((building, index) => (
              <div className="building-row" key={building.name}>
                <div className={`building-avatar building-avatar-${index}`}>
                  <Building2 size={16} />
                </div>
                <div className="building-details">
                  <div className="building-name-row">
                    <span>{building.name}</span>
                    <span className="building-reading">
                      {building.value} <small>kWh</small>
                    </span>
                  </div>
                  <span className="building-area">{building.area}</span>
                  <div className="building-progress">
                    <span style={{ width: `${building.share}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="text-link"
            onClick={() => onNavigate("Energy Forecast")}
          >
            Explore detailed building forecasts <ArrowRight size={15} />
          </Button>
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel
          title="Energy-saving recommendations"
          subtitle="AI-suggested efficiency opportunities"
          action={
            <Button
              variant="ghost"
              className="text-link panel-link"
              onClick={() => onNavigate("Savings Simulator")}
            >
              Simulator <ArrowRight size={15} />
            </Button>
          }
        >
          <div className="recommendation-list">
            <Recommendation
              icon={Lightbulb}
              title="Shift cooling schedule"
              copy="North Tower HVAC initiates 45 min prior to primary occupancy."
              impact="Save ~₹18,400/mo"
              tone="green"
              onClick={() => onNavigate("Savings Simulator")}
            />
            <Recommendation
              icon={CloudSun}
              title="Audit after-hours baseload"
              copy="Overnight consumption exceeds Aster campus target by 3.6%."
              impact="Save ~₹12,100/mo"
              tone="amber"
              onClick={() => onNavigate("Savings Simulator")}
            />
            <Recommendation
              icon={Activity}
              title="Stagger chiller staging"
              copy="Innovation Hub morning peak spikes baseline demand charge."
              impact="Save ~₹8,600/mo"
              tone="blue"
              onClick={() => onNavigate("Savings Simulator")}
            />
          </div>
        </Panel>

        <Panel
          title="Active alerts & anomalies"
          subtitle="Signals requiring operational attention"
          action={<span className="attention-count">4 open</span>}
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
function Forecast() {
  const [horizon, setHorizon] = useState<"24 hours" | "7 days" | "30 days">("24 hours");
  const [model, setModel] = useState("Random Forest");

  const modelMultiplier = model === "Random Forest" ? 1.0 : model === "XGBoost" ? 1.03 : 1.08;

  const chartData = useMemo(() => {
    const raw =
      horizon === "24 hours"
        ? energySeries
        : horizon === "7 days"
          ? sevenDaySeries
          : thirtyDaySeries;
    return raw.map((point) => ({
      ...point,
      forecast: Math.round(point.forecast * modelMultiplier),
      upper: Math.round(point.upper * modelMultiplier),
      lower: Math.round(point.lower * modelMultiplier),
    }));
  }, [horizon, modelMultiplier]);

  const total =
    horizon === "24 hours"
      ? Math.round(1106 * modelMultiplier)
      : horizon === "7 days"
        ? Math.round(7720 * modelMultiplier)
        : Math.round(32460 * modelMultiplier);

  const peakDemand =
    horizon === "24 hours"
      ? (94.2 * modelMultiplier).toFixed(1)
      : horizon === "7 days"
        ? (102.5 * modelMultiplier).toFixed(1)
        : (114.8 * modelMultiplier).toFixed(1);

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
              <SelectItem value="Random Forest">Random Forest (Recommended)</SelectItem>
              <SelectItem value="XGBoost">XGBoost Regressor</SelectItem>
              <SelectItem value="Seasonal Baseline">Seasonal Baseline</SelectItem>
            </SelectContent>
          </Select>
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
          value={rupees(Math.round(total * 12))}
          change="₹12 / kWh"
          trend="neutral"
          detail="standard illustrative tariff"
          accent="amber"
        />
        <Metric
          icon={Zap}
          label="Expected peak demand"
          value={peakDemand}
          unit="kW"
          change="2:00 PM"
          trend="neutral"
          detail="predicted maximum coincident peak"
          accent="blue"
        />
      </div>

      <Panel
        title="Usage forecast & confidence interval"
        subtitle={`${model} · ${horizon} outlook with 95% illustrative uncertainty bounds`}
      >
        <div className="usage-chart-summary">
          <div>
            <span className="chart-big-value">
              {formatNumber(total)} <small>kWh</small>
            </span>
            <span className="chart-summary-sub">
              Estimated consumption over selected {horizon} window
            </span>
          </div>
          <Legend
            items={[
              { label: "Historical / Current", tone: "green" },
              { label: "Forecasted", tone: "teal" },
              { label: "95% Confidence Band", tone: "lavender" },
            ]}
          />
        </div>
        <UsageChart data={chartData} forecastOnly confidence />
        <div className="forecast-footnote">
          <span className="footnote-mark">
            <CircleHelp size={14} />
          </span>
          Confidence bounds and forecasts are illustrative demo values calculated locally for UI
          preview.
        </div>
      </Panel>

      <div className="forecast-bottom-grid">
        <Panel title="Daily demand pattern" subtitle="Illustrative hourly profile distribution">
          <div className="daily-pattern">
            <div className="pattern-stat">
              <span>Peak demand window</span>
              <strong>1:00 PM – 3:30 PM</strong>
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
                {model === "Random Forest"
                  ? "Ensemble of 120 regression trees with lagged meteorological features."
                  : model === "XGBoost"
                    ? "Gradient-boosted decision trees tuned on hourly weather & occupancy signals."
                    : "Fourier seasonal decomposition based on 4-week historical average."}
              </span>
            </div>
            <Badge variant="outline" className="demo-tag">
              DEMO
            </Badge>
          </div>
          <p className="context-copy">
            The forecast reflects simulated weather forecasts, building occupancy profiles, and
            historical consumption curves to illustrate horizon adjustments.
          </p>
        </Panel>
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE 3 — ANOMALY DETECTION
   ========================================================================== */
function AnomalyDetection() {
  const [anomalyList, setAnomalyList] = useState<Anomaly[]>(initialAnomalies);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<number>(1);

  const filtered = useMemo(() => {
    return anomalyList.filter((a) => {
      const matchSeverity = severityFilter === "all" || a.severity.toLowerCase() === severityFilter;
      const matchType = typeFilter === "all" || a.type.toLowerCase() === typeFilter.toLowerCase();
      const matchDate =
        dateRangeFilter === "all" ||
        (dateRangeFilter === "24 hours" && a.dateRange === "24 hours") ||
        (dateRangeFilter === "7 days" &&
          (a.dateRange === "24 hours" || a.dateRange === "7 days")) ||
        dateRangeFilter === "30 days";
      return matchSeverity && matchType && matchDate;
    });
  }, [anomalyList, severityFilter, typeFilter, dateRangeFilter]);

  const selectedAnomaly =
    anomalyList.find((a) => a.id === selectedAnomalyId) || anomalyList[0] || initialAnomalies[0];

  const updateStatus = (id: number, newStatus: Anomaly["status"]) => {
    setAnomalyList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
    );
  };

  const exportCsv = () => {
    const headers =
      "id,time,building,actual_kwh,expected_kwh,type,severity,excess_cost_inr,status\n";
    const rows = filtered
      .map(
        (a) =>
          `${a.id},"${a.time}","${a.building}",${a.actual},${a.expected},"${a.type}","${a.severity}",${a.cost},"${a.status || "Pending"}"`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `energyiq-anomalies-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-stack">
      {/* Filters Toolbar */}
      <div className="filter-toolbar anomaly-filters">
        <div className="filter-control">
          <span className="filter-label">SEVERITY</span>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="filter-control">
          <span className="filter-label">ANOMALY TYPE</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Overnight usage">Overnight usage</SelectItem>
              <SelectItem value="Usage spike">Usage spike</SelectItem>
              <SelectItem value="Sudden drop">Sudden drop</SelectItem>
              <SelectItem value="Sensor fault">Sensor fault</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="filter-control">
          <span className="filter-label">DATE RANGE</span>
          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="24 hours">Last 24 hours</SelectItem>
              <SelectItem value="7 days">Last 7 days</SelectItem>
              <SelectItem value="30 days">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="filter-summary">
          <SlidersHorizontal size={15} />
          {filtered.length} signals detected
        </div>
      </div>

      {/* Anomalies Table */}
      <Panel
        title="Detected anomalies"
        subtitle="Click any row to inspect signal details, root cause, and recommendations"
        action={
          <Button variant="outline" className="export-button" onClick={exportCsv}>
            <Download size={15} />
            Export CSV
          </Button>
        }
      >
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>DETECTED</th>
                <th>BUILDING</th>
                <th>ACTUAL</th>
                <th>EXPECTED</th>
                <th>TYPE</th>
                <th>SEVERITY</th>
                <th>EXCESS COST</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((anomaly) => {
                const isSelected = selectedAnomaly.id === anomaly.id;
                return (
                  <tr
                    key={anomaly.id}
                    className={isSelected ? "selected-row" : ""}
                    onClick={() => setSelectedAnomalyId(anomaly.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="table-date">{anomaly.time}</td>
                    <td className="table-building">{anomaly.building}</td>
                    <td className="table-reading">
                      {anomaly.actual} <small>kWh</small>
                    </td>
                    <td>
                      {anomaly.expected} <small>kWh</small>
                    </td>
                    <td>
                      <span className="type-indicator">
                        <span
                          className={`type-dot type-${anomaly.type.toLowerCase().replaceAll(" ", "-")}`}
                        />
                        {anomaly.type}
                      </span>
                    </td>
                    <td>
                      <Badge className={`severity-badge badge-${anomaly.severity.toLowerCase()}`}>
                        {anomaly.severity}
                      </Badge>
                    </td>
                    <td className="table-cost">{anomaly.cost > 0 ? rupees(anomaly.cost) : "—"}</td>
                    <td>
                      {anomaly.status === "Reviewed" && (
                        <span className="status-reviewed">
                          <Check size={12} /> Reviewed
                        </span>
                      )}
                      {anomaly.status === "Confirmed" && (
                        <span className="status-confirmed">
                          <CheckCircle2 size={12} /> Confirmed
                        </span>
                      )}
                      {anomaly.status === "False alarm" && (
                        <span className="status-false-alarm">
                          <X size={12} /> False alarm
                        </span>
                      )}
                      {(!anomaly.status || anomaly.status === "Pending") && (
                        <span className="sample-label">Pending</span>
                      )}
                    </td>
                    <td>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className="review-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAnomalyId(anomaly.id);
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

          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={22} />
              <span>No anomaly signals match the selected filters.</span>
              <Button
                variant="ghost"
                onClick={() => {
                  setSeverityFilter("all");
                  setTypeFilter("all");
                  setDateRangeFilter("all");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </Panel>

      {/* Anomaly Details Panel */}
      <Panel
        title="Signal details & mitigation"
        subtitle={`Inspecting signal #${selectedAnomaly.id} · ${selectedAnomaly.building}`}
      >
        <div className="anomaly-detail">
          <div className="detail-severity-icon">
            <AlertTriangle size={20} />
          </div>

          <div className="detail-main">
            <div className="detail-heading">
              <strong>{selectedAnomaly.type}</strong>
              <Badge className={`severity-badge badge-${selectedAnomaly.severity.toLowerCase()}`}>
                {selectedAnomaly.severity}
              </Badge>
              {selectedAnomaly.status && (
                <Badge variant="outline" className="ml-2">
                  Status: {selectedAnomaly.status}
                </Badge>
              )}
            </div>

            <span className="detail-location">
              {selectedAnomaly.building} · {selectedAnomaly.time} · Deviation: +
              {Math.max(0, selectedAnomaly.actual - selectedAnomaly.expected)} kWh
            </span>

            <p>{selectedAnomaly.detail}</p>

            <div className="detail-recommendation">
              <Lightbulb size={16} className="shrink-0" />
              <span>
                <strong>Mitigation Recommendation: </strong>
                {selectedAnomaly.recommendation}
              </span>
            </div>
          </div>

          <div className="detail-actions">
            <Button
              variant={selectedAnomaly.status === "Reviewed" ? "default" : "outline"}
              onClick={() => updateStatus(selectedAnomaly.id, "Reviewed")}
            >
              <Check size={14} className="mr-1" /> Mark Reviewed
            </Button>
            <Button
              variant={selectedAnomaly.status === "Confirmed" ? "default" : "outline"}
              onClick={() => updateStatus(selectedAnomaly.id, "Confirmed")}
            >
              <CheckCircle2 size={14} className="mr-1" /> Confirm Issue
            </Button>
            <Button
              variant={selectedAnomaly.status === "False alarm" ? "secondary" : "outline"}
              onClick={() => updateStatus(selectedAnomaly.id, "False alarm")}
            >
              <X size={14} className="mr-1" /> False Alarm
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ==========================================================================
   PAGE 4 — MODEL INSIGHTS
   ========================================================================== */
function ModelInsights() {
  const models = [
    {
      name: "Random Forest",
      mae: "8.4",
      rmse: "11.2",
      mape: "9.6%",
      r2: "0.91",
      time: "2m 14s",
      tone: "best",
    },
    {
      name: "XGBoost",
      mae: "9.1",
      rmse: "12.8",
      mape: "10.4%",
      r2: "0.89",
      time: "1m 48s",
      tone: "",
    },
    {
      name: "Seasonal Baseline",
      mae: "14.8",
      rmse: "18.9",
      mape: "17.2%",
      r2: "0.76",
      time: "0m 06s",
      tone: "",
    },
  ];

  const featureData = [
    { name: "Hour of day (diurnal cycle)", value: 84 },
    { name: "Outside ambient temperature", value: 69 },
    { name: "Day of week (weekday vs weekend)", value: 54 },
    { name: "Building badge-in occupancy", value: 38 },
    { name: "Lagged previous-day load (t-24)", value: 27 },
  ];

  return (
    <div className="page-stack">
      <div className="illustrative-strip">
        <Sparkles size={16} />
        <span>
          All metrics, feature weights, and validation benchmarks on this page are illustrative demo
          values.
        </span>
      </div>

      <Panel
        title="Model benchmark leaderboard"
        subtitle="Illustrative hold-out validation metrics across three algorithmic approaches"
        action={<span className="validation-label">ILLUSTRATIVE BENCHMARK</span>}
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
                <th>TRAINING DURATION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name}>
                  <td className="model-name-cell">
                    {m.tone === "best" && (
                      <span className="leader-mark">
                        <Check size={14} />
                      </span>
                    )}
                    {m.name}
                  </td>
                  <td>{m.mae}</td>
                  <td>{m.rmse}</td>
                  <td>{m.mape}</td>
                  <td>{m.r2}</td>
                  <td>{m.time}</td>
                  <td>
                    {m.tone ? (
                      <Badge className="best-badge">Top Performer</Badge>
                    ) : (
                      <span className="sample-label">Evaluated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="insights-grid">
        <Panel
          title="Actual vs. predicted tracking"
          subtitle="Ground truth metered kWh compared with model inferences over test interval"
        >
          <div className="usage-chart-summary">
            <span className="chart-summary-sub">Hourly electricity · kWh</span>
            <Legend
              items={[
                { label: "Actual Metered", tone: "green" },
                { label: "Predicted Inferences", tone: "teal" },
              ]}
            />
          </div>
          <UsageChart data={energySeries} />
        </Panel>

        <Panel
          title="Feature importance"
          subtitle="Relative contribution of predictive signals in Random Forest model"
        >
          <div className="feature-list">
            {featureData.map((feature, index) => (
              <div className="feature-row" key={feature.name}>
                <div className="feature-heading">
                  <span>{feature.name}</span>
                  <span>{feature.value}%</span>
                </div>
                <div className="feature-track">
                  <span className={`feature-fill feature-fill-${index}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="feature-note">
            Relative Gini importance normalized across 120 regression trees.
          </div>
        </Panel>
      </div>

      <div className="insights-bottom-grid">
        <Panel
          title="Performance by temporal period"
          subtitle="Illustrative Mean Absolute Error across days and diurnal hours"
        >
          <div className="period-performance">
            <div className="period-row">
              <div>
                <span className="period-indicator weekday-indicator" />
                <span>Weekdays (Mon–Fri)</span>
              </div>
              <strong>
                7.9 <small>kWh MAE</small>
              </strong>
              <span className="period-track">
                <i style={{ width: "72%" }} />
              </span>
            </div>
            <div className="period-row">
              <div>
                <span className="period-indicator weekend-indicator" />
                <span>Weekends (Sat–Sun)</span>
              </div>
              <strong>
                10.6 <small>kWh MAE</small>
              </strong>
              <span className="period-track">
                <i style={{ width: "48%" }} />
              </span>
            </div>
            <div className="period-row">
              <div>
                <span className="period-indicator morning-indicator" />
                <span>Morning Peak (06:00–12:00)</span>
              </div>
              <strong>
                6.8 <small>kWh MAE</small>
              </strong>
              <span className="period-track">
                <i style={{ width: "80%" }} />
              </span>
            </div>
            <div className="period-row">
              <div>
                <span className="period-indicator afternoon-indicator" />
                <span>Afternoon Cooling (12:00–18:00)</span>
              </div>
              <strong>
                8.4 <small>kWh MAE</small>
              </strong>
              <span className="period-track">
                <i style={{ width: "65%" }} />
              </span>
            </div>
            <div className="period-row">
              <div>
                <span className="period-indicator night-indicator" />
                <span>Overnight Baseload (18:00–06:00)</span>
              </div>
              <strong>
                5.2 <small>kWh MAE</small>
              </strong>
              <span className="period-track">
                <i style={{ width: "88%" }} />
              </span>
            </div>
            <div className="period-caption">
              Higher accuracy during steady overnight and morning ramp periods.
            </div>
          </div>
        </Panel>

        <Panel title="Model drift & health status" subtitle="Concept and data drift monitoring">
          <div className="drift-content">
            <div className="drift-status-icon">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <strong>Model Drift: Stable</strong>
              <span>Kolmogorov-Smirnov test p-value: 0.84 (Threshold &gt; 0.05).</span>
            </div>
            <Badge className="drift-badge">HEALTHY</Badge>
          </div>
          <div className="drift-footer">
            <span>Last automated validation</span>
            <span>Today, 09:00 AM IST</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE 5 — SAVINGS SIMULATOR
   ========================================================================== */
function SavingsSimulator() {
  const [afterHours, setAfterHours] = useState([20]);
  const [occupancy, setOccupancy] = useState([10]);
  const [usage, setUsage] = useState([10]);
  const [tariff, setTariff] = useState("12");

  const savings = useMemo(
    () =>
      savingsEstimate(
        afterHours[0] / 100,
        occupancy[0] / 100,
        usage[0] / 100,
        Math.max(0, Number(tariff) || 0),
      ),
    [afterHours, occupancy, usage, tariff],
  );

  const baseline = 42800;
  const projected = Math.max(0, baseline - savings.reduction);
  const comparison = [
    { name: "Current Baseline", usage: baseline },
    { name: "With Simulations", usage: projected },
  ];

  const resetDefaults = () => {
    setAfterHours([20]);
    setOccupancy([10]);
    setUsage([10]);
    setTariff("12");
  };

  return (
    <div className="page-stack">
      <div className="illustrative-strip">
        <Sparkles size={16} />
        <span>
          Adjust operational levers to explore estimated monthly financial and carbon savings.
          Calculations run entirely in your browser using illustrative energy models.
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
                <span>Curtail overnight standby power & unneeded lighting</span>
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
                <span>Variable speed pump staging & chiller delta-T tuning</span>
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
            <span>
              Aster Campus monthly reference baseline: <strong>42,800 kWh</strong> at{" "}
              <strong>₹{tariff || "12"} / kWh</strong>.
            </span>
          </div>
        </Panel>

        {/* Results Panel */}
        <div className="sim-results">
          <section className="savings-feature">
            <div className="savings-feature-top">
              <span className="savings-feature-label">
                <Leaf size={15} /> ESTIMATED MONTHLY SAVINGS
              </span>
              <span className="savings-demo-chip">SIMULATED VALUE</span>
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

            <div className="savings-footnote">
              <Sparkles size={14} />
              Calculated locally in browser based on 42,800 kWh baseline.
            </div>
          </section>

          <Panel
            title="Monthly usage comparison"
            subtitle="Before vs. after simulated operational efficiency adjustments"
          >
            <div className="comparison-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={comparison} margin={{ top: 18, right: 8, left: -10, bottom: 4 }}>
                  <defs>
                    <linearGradient id="comparisonFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 5" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${formatNumber(v)} kWh`, "Monthly Consumption"]}
                  />
                  <Area
                    dataKey="usage"
                    type="monotone"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#comparisonFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="comparison-legend">
              <span>
                <i className="legend-mark legend-green" /> Baseline: 42,800 kWh
              </span>
              <span>
                <i className="legend-mark legend-teal" /> Projected: {formatNumber(projected)} kWh
              </span>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="High-impact conservation ideas"
        subtitle="Actions to maximize your savings score"
      >
        <div className="ideas-grid">
          <Idea
            icon={Lightbulb}
            number="01"
            title="Smart Pre-Cooling Ramp"
            copy="Cool high-thermal-mass building structures 1 hour prior to peak tariff windows."
          />
          <Idea
            icon={CloudSun}
            number="02"
            title="Automate Night Setbacks"
            copy="Allow conditioned space temperatures to float 2.5°C higher during unpopulated hours."
          />
          <Idea
            icon={Activity}
            number="03"
            title="Static Pressure Reset"
            copy="Dynamically modulate duct static pressure based on zone VAV damper positions."
          />
        </div>
      </Panel>
    </div>
  );
}

function Idea({
  icon: Icon,
  number,
  title,
  copy,
}: {
  icon: typeof Zap;
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="idea-item">
      <div className="idea-icon">
        <Icon size={17} />
      </div>
      <div className="idea-content">
        <div className="idea-number">{number} · BEST PRACTICE</div>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
      <ArrowRight size={16} className="idea-arrow" />
    </div>
  );
}

/* ==========================================================================
   PAGE 6 — DATA MANAGEMENT
   ========================================================================== */
type CsvPreview = {
  name: string;
  size: string;
  headers: string[];
  rows: string[][];
  count: number;
  missing: number;
  duplicates: number;
  dates: number;
  error?: string;
};

function DataManagement() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<CsvPreview | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = async (selected?: File) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv") && selected.type !== "text/csv") {
      setFile({
        name: selected.name,
        size: `${(selected.size / 1024).toFixed(1)} KB`,
        headers: [],
        rows: [],
        count: 0,
        missing: 0,
        duplicates: 0,
        dates: 0,
        error: "Please select a valid CSV file (.csv format only).",
      });
      return;
    }

    try {
      const text = await selected.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parseLine = (line: string) =>
        line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
      const headers = lines.length > 0 ? parseLine(lines[0]) : [];
      const allRows = lines.slice(1).map(parseLine);
      const missing = allRows.reduce(
        (sum, row) => sum + headers.reduce((empty, _, i) => empty + (row[i] ? 0 : 1), 0),
        0,
      );
      const timestampIndex = headers.findIndex((h) => /time|date/i.test(h));
      const timestamps =
        timestampIndex < 0 ? [] : allRows.map((r) => r[timestampIndex]).filter(Boolean);

      setFile({
        name: selected.name,
        size: `${(selected.size / 1024).toFixed(1)} KB`,
        headers,
        rows: allRows.slice(0, 8),
        count: allRows.length,
        missing,
        duplicates: timestamps.length - new Set(timestamps).size,
        dates: timestamps.length,
      });
    } catch {
      setFile({
        name: selected.name,
        size: `${(selected.size / 1024).toFixed(1)} KB`,
        headers: [],
        rows: [],
        count: 0,
        missing: 0,
        duplicates: 0,
        dates: 0,
        error: "Failed to read CSV contents.",
      });
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void processFile(e.target.files?.[0]);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    void processFile(e.dataTransfer.files[0]);
  };

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([sampleCsv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "energyiq-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-stack">
      <div className="data-overview-strip">
        <div className="data-overview-icon">
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <strong>Meter data pipeline</strong>
          <span>Aster Portfolio dataset · 4 buildings · 15-minute sampling frequency</span>
        </div>
        <div className="data-overview-stats">
          <span>
            <strong>128</strong> sub-meters
          </span>
          <span>
            <strong>30 days</strong> rolling window
          </span>
          <span>
            <strong>100%</strong> browser-side
          </span>
        </div>
      </div>

      <Panel
        title="Upload or inspect CSV"
        subtitle="Select a local smart meter export to inspect columns, parse timestamps, and check data quality"
        action={
          <Button variant="outline" className="sample-button" onClick={downloadSample}>
            <Download size={15} />
            Download sample CSV
          </Button>
        }
      >
        <div
          className={`dropzone ${dragging ? "dropzone-active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={onFileChange}
            aria-label="Choose CSV file"
          />
          <div className="upload-icon">
            <Upload size={22} />
          </div>
          <div className="dropzone-copy">
            <strong>Drop your meter CSV here</strong>
            <span>or click to browse from your device · Comma-separated values only</span>
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

        {file && (
          <div className="file-result">
            <div className="file-result-icon">
              <FileSpreadsheet size={20} />
            </div>
            <div className="file-result-copy">
              <strong>{file.name}</strong>
              <span>
                {file.size} · {file.error ?? `${file.count} data records parsed`}
              </span>
            </div>
            {file.error ? (
              <Badge className="file-error-badge">INVALID FORMAT</Badge>
            ) : (
              <Badge className="file-ready-badge">
                <CheckCircle2 size={12} />
                PREVIEW READY
              </Badge>
            )}
            <Button
              aria-label="Remove selected file"
              variant="ghost"
              size="icon"
              className="remove-file"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X size={16} />
            </Button>
          </div>
        )}
      </Panel>

      {file && !file.error ? (
        <>
          <div className="quality-grid">
            <QualityCard
              title="Missing values"
              value={file.missing === 0 ? "None detected" : `${file.missing} cells`}
              detail={
                file.missing === 0
                  ? "All preview cells are properly populated"
                  : "Found incomplete records requiring imputation"
              }
              good={file.missing === 0}
            />
            <QualityCard
              title="Duplicate timestamps"
              value={file.duplicates === 0 ? "None detected" : `${file.duplicates} duplicate rows`}
              detail={
                file.dates
                  ? `${file.dates} timestamp instances validated`
                  : "No timestamp column detected in headers"
              }
              good={file.duplicates === 0}
            />
            <QualityCard
              title="Timestamp coverage"
              value={file.dates ? `${file.dates} records` : "Missing column"}
              detail={
                file.dates > 0
                  ? "Valid ISO/DateTime timestamps detected"
                  : "Ensure CSV has a 'timestamp' or 'date' header"
              }
              good={file.dates > 0}
            />
          </div>

          <Panel
            title="Data preview"
            subtitle={`Displaying first ${Math.min(8, file.count)} records of ${file.count} parsed lines`}
          >
            <div className="table-scroll">
              <table className="data-table csv-table">
                <thead>
                  <tr>
                    {file.headers.map((header, index) => (
                      <th key={`${header}-${index}`}>{header || `COL_${index + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {file.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {file.headers.map((_, colIndex) => (
                        <td key={colIndex}>
                          {row[colIndex] || <span className="empty-cell">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {file.count === 0 && (
                <div className="empty-state">No data records found in this CSV file.</div>
              )}
            </div>
          </Panel>
        </>
      ) : !file ? (
        <div className="data-empty-state">
          <div className="empty-icon">
            <FileSpreadsheet size={22} />
          </div>
          <strong>Secure client-side processing</strong>
          <span>
            Select or drag a CSV above to inspect data fields. Files never leave your local browser
            sandbox.
          </span>
        </div>
      ) : null}

      <div className="privacy-note">
        <ShieldAlert size={16} className="text-emerald-600 shrink-0" />
        <span>
          <strong>Data privacy guarantee:</strong> Meter readings are parsed entirely in your
          browser. No data is uploaded, saved to a database, or transmitted to any external server.
        </span>
      </div>
    </div>
  );
}

function QualityCard({
  title,
  value,
  detail,
  good,
}: {
  title: string;
  value: string;
  detail: string;
  good: boolean;
}) {
  return (
    <div className="quality-card">
      <div className="quality-heading">
        <span>{title}</span>
        <span className={`quality-status ${good ? "quality-good" : "quality-review"}`}>
          <span /> {good ? "Healthy" : "Review"}
        </span>
      </div>
      <strong>{value}</strong>
      <span className="quality-detail">{detail}</span>
    </div>
  );
}
