import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Building2,
  Check, CheckCircle2, ChevronDown, CircleHelp, CloudSun, Download, FileSpreadsheet,
  Gauge, Leaf, Lightbulb, Menu, MoreHorizontal, PlugZap, Search, Settings2, ShieldAlert,
  SlidersHorizontal, Sparkles, Upload, X, Zap,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { anomalies, energySeries, sampleCsv, savingsEstimate } from "@/lib/energy-data";

type PageKey = "Overview" | "Energy Forecast" | "Anomaly Detection" | "Model Insights" | "Savings Simulator" | "Data Management";
const pages: { title: PageKey; icon: typeof Gauge }[] = [
  { title: "Overview", icon: Gauge }, { title: "Energy Forecast", icon: Activity },
  { title: "Anomaly Detection", icon: ShieldAlert }, { title: "Model Insights", icon: BarChart3 },
  { title: "Savings Simulator", icon: SlidersHorizontal }, { title: "Data Management", icon: Building2 },
];
const headerCopy: Record<PageKey, { kicker: string; title: string; subtitle: string }> = {
  Overview: { kicker: "MONDAY, OCTOBER 20, 2026", title: "Energy at a glance", subtitle: "A live look at the buildings and systems that power your business." },
  "Energy Forecast": { kicker: "PREDICTIVE ANALYTICS", title: "Energy forecast", subtitle: "Plan ahead with illustrative usage forecasts and demand estimates." },
  "Anomaly Detection": { kicker: "BUILDING WATCH", title: "Anomaly detection", subtitle: "Review unusual meter readings across your building portfolio." },
  "Model Insights": { kicker: "MODEL PERFORMANCE", title: "Model insights", subtitle: "Explore illustrative benchmarks behind the forecast." },
  "Savings Simulator": { kicker: "WHAT-IF ANALYSIS", title: "Savings simulator", subtitle: "Estimate how operating changes could affect monthly energy costs." },
  "Data Management": { kicker: "YOUR ENERGY DATA", title: "Data management", subtitle: "Preview a local meter export and check the shape of your data." },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EnergyIQ Overview | Building Energy Intelligence" },
      { name: "description", content: "Explore building energy use, illustrative forecasts, savings opportunities, and meter data in the EnergyIQ demo dashboard." },
      { property: "og:title", content: "EnergyIQ Overview | Building Energy Intelligence" },
      { property: "og:description", content: "A building energy intelligence dashboard with illustrative usage, forecasts, and savings." },
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
  const selectPage = (page: PageKey) => { setActivePage(page); setMobileNavOpen(false); };
  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <aside className="sidebar hidden lg:flex">
        <div className="brand-lockup"><div className="brand-symbol"><Zap size={19} fill="currentColor" /></div><div><span className="brand-name">energy<span>IQ</span></span><span className="brand-caption">BUILDING INTELLIGENCE</span></div></div>
        <div className="portfolio-switch"><div className="portfolio-glyph"><Building2 size={16} /></div><div className="min-w-0"><span className="portfolio-label">WORKSPACE</span><span className="portfolio-name">Aster Properties</span></div><ChevronDown size={15} className="portfolio-chevron" /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation" className="nav-list">
          {pages.map(({ title, icon: Icon }) => <Button key={title} variant="ghost" onClick={() => selectPage(title)} aria-current={activePage === title ? "page" : undefined} className={`nav-item ${activePage === title ? "nav-item-active" : ""}`}><Icon size={18} strokeWidth={1.8} /><span>{title}</span>{title === "Anomaly Detection" && <span className="nav-count">4</span>}</Button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note"><div className="note-icon"><CloudSun size={18} /></div><div><div className="note-title">A clearer energy picture</div><div className="note-copy">Four buildings · 128 meters</div></div><MoreHorizontal size={17} className="note-more" /></div>
        <Button variant="ghost" className="settings-link"><Settings2 size={17} />Settings</Button>
        <div className="sidebar-profile"><div className="avatar avatar-sidebar">AM</div><div className="profile-info"><span className="profile-name">Aarav Mehta</span><span className="profile-role">Portfolio manager</span></div><MoreHorizontal size={18} className="profile-more" /></div>
      </aside>
      <main className="main-pane min-w-0">
        <header className="topbar">
          <Button aria-label="Open navigation" variant="ghost" size="icon" className="mobile-menu lg:hidden" onClick={() => setMobileNavOpen(!mobileNavOpen)}>{mobileNavOpen ? <X size={20} /> : <Menu size={20} />}</Button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><span className="crumb-current">{activePage}</span></div>
          <div className="topbar-right"><div className="demo-pill"><span className="demo-dot" />DEMO DATA</div><Button aria-label="Search" variant="ghost" size="icon" className="topbar-icon"><Search size={18} /></Button><Button aria-label="Help" variant="ghost" size="icon" className="topbar-icon help-button"><CircleHelp size={18} /></Button><div className="avatar topbar-avatar">AM</div></div>
        </header>
        {mobileNavOpen && <div className="mobile-nav-panel lg:hidden">{pages.map(({ title, icon: Icon }) => <Button variant="ghost" key={title} onClick={() => selectPage(title)} className={`nav-item ${activePage === title ? "nav-item-active" : ""}`}><Icon size={18} /><span>{title}</span></Button>)}</div>}
        <div className="page-content">
          <div className="page-heading"><div><div className="eyebrow">{current.kicker}</div><h1>{current.title}</h1><p>{current.subtitle}</p></div><div className="heading-actions"><span className="updated-label"><span className="live-dot" />Updated just now</span><Button variant="outline" className="period-button"><span>Last 24 hours</span><ChevronDown size={15} /></Button></div></div>
          <div className="demo-banner"><div className="demo-banner-icon"><Sparkles size={16} /></div><span><strong>Illustrative demo</strong><span className="banner-separator">·</span>All readings, alerts, and forecasts are sample data.</span><Button variant="ghost" size="icon" aria-label="Dismiss demo data notice" className="banner-close" onClick={(event) => event.currentTarget.closest(".demo-banner")?.remove()}><X size={15} /></Button></div>
          {activePage === "Overview" && <Overview onNavigate={selectPage} />}
          {activePage === "Energy Forecast" && <Forecast />}
          {activePage === "Anomaly Detection" && <AnomalyDetection />}
          {activePage === "Model Insights" && <ModelInsights />}
          {activePage === "Savings Simulator" && <SavingsSimulator />}
          {activePage === "Data Management" && <DataManagement />}
          <footer className="page-footer"><span>EnergyIQ <span className="footer-dot">·</span> Illustrative demo values</span><span>Energy intelligence, made clearer.</span></footer>
        </div>
      </main>
    </div>
  );
}

function Panel({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function Metric({ icon: Icon, label, value, unit, change, trend, detail, accent = "green" }: { icon: typeof Zap; label: string; value: string; unit?: string; change?: string; trend?: "up" | "down" | "neutral"; detail: string; accent?: "green" | "amber" | "blue" | "rose" }) {
  const TrendIcon = trend === "down" ? ArrowDownRight : trend === "up" ? ArrowUpRight : CheckCircle2;
  return <article className="metric-card"><div className={`metric-icon metric-${accent}`}><Icon size={17} strokeWidth={1.9} /></div><span className="metric-label">{label}</span><div className="metric-value-row"><span className="metric-value">{value}</span>{unit && <span className="metric-unit">{unit}</span>}</div><div className="metric-foot"><span className={`metric-change trend-${trend ?? "neutral"}`}><TrendIcon size={14} />{change}</span><span className="metric-detail">{detail}</span></div></article>;
}

function UsageChart({ data = energySeries, forecastOnly = false, confidence = false, compact = false }: { data?: typeof energySeries; forecastOnly?: boolean; confidence?: boolean; compact?: boolean }) {
  return <div className={`chart-wrap ${compact ? "chart-compact" : ""}`}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{ top: 14, right: 12, left: -15, bottom: 0 }}>
    <defs><linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.16} /><stop offset="94%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient><linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.16} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.03} /></linearGradient></defs>
    <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 5" />
    <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-label)", fontSize: 11 }} tickMargin={11} interval="preserveStartEnd" />
    <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-label)", fontSize: 11 }} tickMargin={9} domain={[0, 120]} tickFormatter={(value: number) => `${value}`} />
    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)", fontSize: 12 }} labelStyle={{ color: "var(--muted-foreground)", marginBottom: 5 }} formatter={(value: number, name: string) => [`${value} kWh`, name === "actual" ? "Actual usage" : name === "forecast" ? "Predicted usage" : name === "upper" ? "Upper confidence" : "Lower confidence"]} />
    {confidence && <Area dataKey="upper" type="monotone" stroke="none" fill="url(#confidenceFill)" connectNulls />}{confidence && <Area dataKey="lower" type="monotone" stroke="none" fill="var(--background)" connectNulls />}
    {!forecastOnly && <Area dataKey="actual" type="monotone" stroke="var(--chart-1)" strokeWidth={2.4} fill="url(#usageFill)" activeDot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--background)", strokeWidth: 2 }} />}
    <Line dataKey="forecast" type="monotone" stroke="var(--chart-2)" strokeWidth={2.4} strokeDasharray={forecastOnly ? undefined : "5 5"} dot={false} activeDot={{ r: 4, fill: "var(--chart-2)", stroke: "var(--background)", strokeWidth: 2 }} />
  </ComposedChart></ResponsiveContainer></div>;
}

function Legend({ items }: { items: { label: string; tone: "green" | "teal" | "dashed" | "lavender" }[] }) {
  return <div className="chart-legend">{items.map((item) => <span key={item.label} className="legend-item"><i className={`legend-mark legend-${item.tone}`} />{item.label}</span>)}</div>;
}

function Overview({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const [range, setRange] = useState<"24 hours" | "7 days">("24 hours");
  const chartData = range === "24 hours" ? energySeries : energySeries.slice(0, 7).map((point, index) => ({ ...point, time: ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"][index], actual: 54 + index * 4 + (index % 2) * 8, forecast: 56 + index * 3 + (index % 3) * 5, upper: 67 + index * 3, lower: 43 + index * 2 }));
  return <>
    <div className="metrics-grid"><Metric icon={Zap} label="Energy consumed" value="1,284" unit="kWh" change="8.2%" trend="up" detail="vs. yesterday" accent="green" /><Metric icon={Activity} label="Next 24h forecast" value="1,106" unit="kWh" change="4.1%" trend="down" detail="vs. current day" accent="blue" /><Metric icon={PlugZap} label="Est. monthly cost" value="₹5.14" unit="L" change="6.4%" trend="down" detail="vs. last month" accent="amber" /><Metric icon={AlertTriangle} label="Active anomalies" value="4" change="2 new today" trend="up" detail="across 3 buildings" accent="rose" /><Metric icon={Leaf} label="CO₂ emissions" value="0.92" unit="t" change="3.8%" trend="down" detail="vs. last week" accent="green" /></div>
    <div className="overview-grid"><Panel className="usage-panel" title="Energy consumption" subtitle="Portfolio electricity usage across all buildings" action={<div className="segmented-control">{(["24 hours", "7 days"] as const).map((label) => <Button key={label} variant="ghost" className={range === label ? "segment-active" : ""} onClick={() => setRange(label)}>{label}</Button>)}</div>}>
      <div className="usage-chart-summary"><div><span className="chart-big-value">1,284 <small>kWh</small></span><span className="chart-summary-sub"><span className="chart-summary-trend"><ArrowUpRight size={13} />8.2%</span> vs. previous period</span></div><Legend items={[{ label: "Actual", tone: "green" }, { label: "Forecast", tone: "dashed" }]} /></div><UsageChart data={chartData} />
    </Panel><Panel title="Building usage" subtitle="Energy use by location" action={<Button aria-label="Building usage options" variant="ghost" size="icon" className="panel-more"><MoreHorizontal size={19} /></Button>}>
      <div className="building-list">{[{ name: "North Tower", area: "Central business district", value: 438, share: 76 }, { name: "Innovation Hub", area: "Tech park · Block A", value: 362, share: 63 }, { name: "West Annex", area: "Riverside campus", value: 281, share: 49 }, { name: "South Studio", area: "Design quarter", value: 203, share: 35 }].map((building, index) => <div className="building-row" key={building.name}><div className={`building-avatar building-avatar-${index}`}><Building2 size={16} /></div><div className="building-details"><div className="building-name-row"><span>{building.name}</span><span className="building-reading">{building.value} <small>kWh</small></span></div><span className="building-area">{building.area}</span><div className="building-progress"><span style={{ width: `${building.share}%` }} /></div></div></div>)}</div>
      <Button variant="ghost" className="text-link" onClick={() => onNavigate("Energy Forecast")}>View building breakdown <ArrowRight size={15} /></Button>
    </Panel></div>
    <div className="lower-grid"><Panel title="Energy-saving opportunities" subtitle="Actions to consider this week" action={<Button variant="ghost" className="text-link panel-link" onClick={() => onNavigate("Savings Simulator")}>View all <ArrowRight size={15} /></Button>}>
      <div className="recommendation-list"><Recommendation icon={Lightbulb} title="Shift cooling schedule" copy="North Tower’s HVAC starts 45 min before occupancy." impact="Save ~₹18,400/mo" tone="green"/><Recommendation icon={CloudSun} title="Review overnight load" copy="After-hours demand is above your portfolio baseline." impact="Save ~₹12,100/mo" tone="amber"/><Recommendation icon={Activity} title="Tune peak demand" copy="Stagger equipment start-up at Innovation Hub." impact="Save ~₹8,600/mo" tone="blue"/></div>
    </Panel><Panel title="Needs your attention" subtitle="Recent signals across your portfolio" action={<span className="attention-count">4 open</span>}>
      <div className="alert-list"><AlertRow severity="high" title="Unusual overnight usage" location="North Tower · 2:14 AM" badge="High"/><AlertRow severity="medium" title="Unexpected demand spike" location="Innovation Hub · 9:42 AM" badge="Medium"/><AlertRow severity="low" title="Meter reading dropped" location="West Annex · Yesterday" badge="Low"/></div>
      <Button variant="ghost" className="text-link" onClick={() => onNavigate("Anomaly Detection")}>Review all anomalies <ArrowRight size={15} /></Button>
    </Panel></div>
    <div className="quick-stats"><div className="quick-stat"><div className="quick-stat-icon"><Activity size={16} /></div><div><span className="quick-stat-label">Peak demand today</span><span className="quick-stat-value">94.2 <small>kW</small></span></div><span className="quick-stat-time">2:00 PM</span></div><div className="quick-stat-divider" /><div className="quick-stat"><div className="quick-stat-icon quiet-icon"><CloudSun size={16} /></div><div><span className="quick-stat-label">After-hours consumption</span><span className="quick-stat-value">18.6 <small>%</small></span></div><span className="quick-stat-time">vs. 15% target</span></div><Button variant="outline" className="quick-stat-action" onClick={() => onNavigate("Savings Simulator")}>Explore savings <ArrowRight size={14} /></Button></div>
  </>;
}

function Recommendation({ icon: Icon, title, copy, impact, tone }: { icon: typeof Zap; title: string; copy: string; impact: string; tone: string }) {
  return <div className="recommendation-row"><div className={`recommendation-icon reco-${tone}`}><Icon size={17} /></div><div className="recommendation-copy"><span className="recommendation-title">{title}</span><span>{copy}</span></div><div className="recommendation-impact">{impact}<ArrowRight size={14} /></div></div>;
}
function AlertRow({ severity, title, location, badge }: { severity: "high" | "medium" | "low"; title: string; location: string; badge: string }) {
  return <div className="alert-row"><span className={`severity-dot severity-${severity}`} /><div className="alert-copy"><span className="alert-title">{title}</span><span>{location}</span></div><Badge className={`severity-badge badge-${severity}`}>{badge}</Badge></div>;
}

function Forecast() {
  const [horizon, setHorizon] = useState("24 hours");
  const [model, setModel] = useState("Random Forest");
  const days = horizon === "24 hours" ? 1 : horizon === "7 days" ? 7 : 30;
  const hourlyScale = horizon === "24 hours" ? 1 : horizon === "7 days" ? 6.8 : 28.6;
  const horizonData = energySeries.map((point) => ({ ...point, actual: horizon === "24 hours" ? point.actual : Math.round(point.actual * hourlyScale), forecast: Math.round(point.forecast * hourlyScale), upper: Math.round(point.upper * hourlyScale), lower: Math.round(point.lower * hourlyScale) }));
  const total = horizon === "24 hours" ? 1106 : horizon === "7 days" ? 7720 : 32460;
  return <div className="page-stack"><div className="filter-toolbar"><div className="filter-group"><span className="filter-label">FORECAST HORIZON</span><div className="segmented-control">{["24 hours", "7 days", "30 days"].map((item) => <Button variant="ghost" key={item} onClick={() => setHorizon(item)} className={horizon === item ? "segment-active" : ""}>{item}</Button>)}</div></div><div className="model-picker"><span className="filter-label">FORECAST MODEL</span><Select value={model} onValueChange={setModel}><SelectTrigger className="model-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Random Forest">Random Forest</SelectItem><SelectItem value="XGBoost">XGBoost</SelectItem><SelectItem value="Seasonal Baseline">Seasonal Baseline</SelectItem></SelectContent></Select></div></div>
    <div className="metrics-grid metrics-grid-three"><Metric icon={Activity} label={`Predicted usage · ${horizon}`} value={formatNumber(total)} unit="kWh" change="6.2%" trend="down" detail="vs. prior period" accent="green"/><Metric icon={PlugZap} label="Estimated electricity cost" value={rupees(Math.round(total * 12))} change="₹12 / kWh" trend="neutral" detail="illustrative tariff" accent="amber"/><Metric icon={Zap} label="Expected peak demand" value="94.2" unit="kW" change="2:00 PM" trend="neutral" detail="predicted peak" accent="blue"/></div>
    <Panel title="Usage forecast" subtitle={`${model} · ${horizon} outlook with illustrative confidence bounds`}><div className="usage-chart-summary"><div><span className="chart-big-value">{formatNumber(total)} <small>kWh</small></span><span className="chart-summary-sub">Estimated consumption over the selected horizon</span></div><Legend items={[{ label: "Historical", tone: "green" }, { label: "Predicted", tone: "teal" }, { label: "Confidence range", tone: "lavender" }]} /></div><UsageChart data={horizonData} forecastOnly confidence /><div className="forecast-footnote"><span className="footnote-mark"><CircleHelp size={14} /></span>Confidence bounds and forecasts are illustrative demo values, not an operational prediction.</div></Panel>
    <div className="forecast-bottom-grid"><Panel title="Daily pattern" subtitle="Illustrative average demand by time"><div className="daily-pattern"><div className="pattern-stat"><span>Peak window</span><strong>1:00–3:00 PM</strong></div><div className="pattern-stat"><span>Lowest demand</span><strong>3:00–5:00 AM</strong></div><div className="pattern-stat"><span>Working hours share</span><strong>71% <small>of daily use</small></strong></div></div></Panel><Panel title="Forecast context" subtitle="Selected model: illustrative"><div className="context-model-row"><div className="context-model-icon"><Activity size={17} /></div><div><strong>{model}</strong><span>Demonstration values only</span></div><Badge variant="outline" className="demo-tag">DEMO</Badge></div><p className="context-copy">The chart uses a fixed sample profile to demonstrate how your forecast view can respond to time horizons and model selection.</p></Panel></div>
  </div>;
}

function AnomalyDetection() {
  const [severity, setSeverity] = useState("all");
  const [type, setType] = useState("all");
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const filtered = anomalies.filter((anomaly) => (severity === "all" || anomaly.severity.toLowerCase() === severity) && (type === "all" || anomaly.type.toLowerCase() === type));
  const changeStatus = (id: number, status: string) => setStatuses((previous) => ({ ...previous, [id]: status }));
  return <div className="page-stack"><div className="filter-toolbar anomaly-filters"><div className="filter-control"><span className="filter-label">SEVERITY</span><Select value={severity} onValueChange={setSeverity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All severities</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div><div className="filter-control"><span className="filter-label">ANOMALY TYPE</span><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="usage spike">Usage spike</SelectItem><SelectItem value="overnight usage">Overnight usage</SelectItem><SelectItem value="sudden drop">Sudden drop</SelectItem><SelectItem value="sensor fault">Sensor fault</SelectItem></SelectContent></Select></div><div className="filter-control"><span className="filter-label">DATE RANGE</span><Select defaultValue="7 days"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="24 hours">Last 24 hours</SelectItem><SelectItem value="7 days">Last 7 days</SelectItem><SelectItem value="30 days">Last 30 days</SelectItem></SelectContent></Select></div><div className="filter-summary"><SlidersHorizontal size={15} />{filtered.length} signals</div></div>
    <Panel title="Detected signals" subtitle="Compare unusual readings against each building’s sample baseline" action={<Button variant="outline" className="export-button"><Download size={15} />Export</Button>}>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>DETECTED</th><th>BUILDING</th><th>ACTUAL</th><th>EXPECTED</th><th>TYPE</th><th>SEVERITY</th><th>EXCESS COST</th><th>STATUS</th></tr></thead><tbody>{filtered.map((anomaly) => <tr key={anomaly.id}><td className="table-date">{anomaly.time}</td><td className="table-building">{anomaly.building}</td><td className="table-reading">{anomaly.actual} <small>kWh</small></td><td>{anomaly.expected} <small>kWh</small></td><td><span className="type-indicator"><span className={`type-dot type-${anomaly.type.toLowerCase().replaceAll(" ", "-")}`} />{anomaly.type}</span></td><td><Badge className={`severity-badge badge-${anomaly.severity.toLowerCase()}`}>{anomaly.severity}</Badge></td><td className="table-cost">{rupees(anomaly.cost)}</td><td>{statuses[anomaly.id] ? <span className="status-reviewed"><Check size={13} />{statuses[anomaly.id]}</span> : <Button variant="outline" className="review-button" onClick={() => changeStatus(anomaly.id, "Reviewed")}>Review</Button>}</td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state"><Search size={20} /><span>No signals match these filters.</span><Button variant="ghost" onClick={() => { setSeverity("all"); setType("all"); }}>Clear filters</Button></div>}</div>
    </Panel><Panel title="Signal details" subtitle="Review an illustrative event and choose the next step"><div className="anomaly-detail"><div className="detail-severity-icon"><AlertTriangle size={18} /></div><div className="detail-main"><div className="detail-heading"><strong>Unusual overnight usage</strong><Badge className="severity-badge badge-high">High</Badge></div><span className="detail-location">North Tower · Today at 2:14 AM</span><p>{anomalies[0].detail}</p><div className="detail-recommendation"><Lightbulb size={15} /><span>Recommended: Check the overnight HVAC schedule and confirm the meter reading.</span></div></div><div className="detail-actions">{["Confirmed", "False alarm"].map((status) => <Button variant={status === "Confirmed" ? "default" : "outline"} key={status} onClick={() => changeStatus(1, status)}>{status === "Confirmed" && <Check size={15} />}{status}</Button>)}</div></div></Panel>
  </div>;
}

function ModelInsights() {
  const models = [{ name: "Random Forest", mae: "8.4", rmse: "11.2", mape: "9.6%", r2: "0.91", time: "2m 14s", tone: "best" }, { name: "XGBoost", mae: "9.1", rmse: "12.8", mape: "10.4%", r2: "0.89", time: "1m 48s", tone: "" }, { name: "Seasonal Baseline", mae: "14.8", rmse: "18.9", mape: "17.2%", r2: "0.76", time: "0m 06s", tone: "" }];
  const featureData = [{ name: "Hour of day", value: 84 }, { name: "Outside temperature", value: 69 }, { name: "Day of week", value: 54 }, { name: "Building occupancy", value: 38 }, { name: "Previous-day usage", value: 27 }];
  return <div className="page-stack"><div className="illustrative-strip"><Sparkles size={15} /><span>All metrics on this page are illustrative demo values and are not based on a trained model.</span></div><Panel title="Model leaderboard" subtitle="Illustrative validation results across three example models" action={<span className="validation-label">SAMPLE VALIDATION</span>}><div className="table-scroll"><table className="data-table model-table"><thead><tr><th>MODEL</th><th>MAE <small>kWh</small></th><th>RMSE <small>kWh</small></th><th>MAPE</th><th>R²</th><th>TRAIN TIME</th><th>STATUS</th></tr></thead><tbody>{models.map((model) => <tr key={model.name}><td className="model-name-cell">{model.tone === "best" && <span className="leader-mark"><Check size={12} /></span>}{model.name}</td><td>{model.mae}</td><td>{model.rmse}</td><td>{model.mape}</td><td>{model.r2}</td><td>{model.time}</td><td>{model.tone ? <Badge className="best-badge">Top sample</Badge> : <span className="sample-label">Illustrative</span>}</td></tr>)}</tbody></table></div></Panel>
    <div className="insights-grid"><Panel title="Actual vs. predicted" subtitle="Illustrative sample validation window"><div className="usage-chart-summary"><span className="chart-summary-sub">Hourly electricity · kWh</span><Legend items={[{ label: "Actual", tone: "green" }, { label: "Predicted", tone: "teal" }]} /></div><UsageChart data={energySeries} /></Panel><Panel title="Feature importance" subtitle="Example signal contribution"><div className="feature-list">{featureData.map((feature, index) => <div className="feature-row" key={feature.name}><div className="feature-heading"><span>{feature.name}</span><span>{feature.value}%</span></div><div className="feature-track"><span className={`feature-fill feature-fill-${index}`} style={{ width: `${feature.value}%` }} /></div></div>)}</div><div className="feature-note">Illustrative relative contribution, not trained model output.</div></Panel></div>
    <div className="insights-bottom-grid"><Panel title="Performance by period" subtitle="Illustrative mean absolute error"><div className="period-performance"><div className="period-row"><div><span className="period-indicator weekday-indicator"/><span>Weekdays</span></div><strong>7.9 <small>kWh MAE</small></strong><span className="period-track"><i style={{ width: "72%" }} /></span></div><div className="period-row"><div><span className="period-indicator weekend-indicator"/><span>Weekends</span></div><strong>10.6 <small>kWh MAE</small></strong><span className="period-track"><i style={{ width: "48%" }} /></span></div><div className="period-caption">Illustrative performance by time of week</div></div></Panel><Panel title="Model drift" subtitle="Sample monitoring status"><div className="drift-content"><div className="drift-status-icon"><CheckCircle2 size={20} /></div><div><strong>Within sample range</strong><span>No simulated drift signals detected.</span></div><Badge className="drift-badge">STABLE</Badge></div><div className="drift-footer"><span>Last sample review</span><span>Today, 9:00 AM</span></div></Panel></div>
  </div>;
}

function SavingsSimulator() {
  const [afterHours, setAfterHours] = useState([20]);
  const [occupancy, setOccupancy] = useState([10]);
  const [usage, setUsage] = useState([10]);
  const [tariff, setTariff] = useState("12");
  const savings = useMemo(() => savingsEstimate(afterHours[0] / 100, occupancy[0] / 100, usage[0] / 100, Math.max(0, Number(tariff) || 0)), [afterHours, occupancy, usage, tariff]);
  const comparison = [{ name: "Current", usage: 42800 }, { name: "With your changes", usage: Math.max(0, 42800 - savings.reduction) }];
  return <div className="page-stack"><div className="illustrative-strip"><Sparkles size={15} /><span>Adjust the assumptions to explore estimated outcomes. Figures are illustrative, not a bill or guarantee.</span></div><div className="simulator-layout"><Panel title="Adjust assumptions" subtitle="Choose the changes you want to explore" className="sim-controls-panel"><div className="assumption-control"><div className="assumption-title"><div className="assumption-icon assumption-green"><CloudSun size={17} /></div><div><strong>Reduce after-hours use</strong><span>Lower overnight and weekend demand</span></div><span className="assumption-value">{afterHours[0]}%</span></div><Slider aria-label="After-hours use reduction" value={afterHours} onValueChange={setAfterHours} min={0} max={50} step={1} /><div className="slider-scale"><span>0%</span><span>50%</span></div></div><div className="assumption-control"><div className="assumption-title"><div className="assumption-icon assumption-blue"><Building2 size={17} /></div><div><strong>Optimize occupancy</strong><span>Adjust scheduled space usage</span></div><span className="assumption-value">{occupancy[0]}%</span></div><Slider aria-label="Occupancy optimization" value={occupancy} onValueChange={setOccupancy} min={0} max={30} step={1} /><div className="slider-scale"><span>0%</span><span>30%</span></div></div><div className="assumption-control"><div className="assumption-title"><div className="assumption-icon assumption-amber"><PlugZap size={17} /></div><div><strong>Improve equipment efficiency</strong><span>Reduce average equipment load</span></div><span className="assumption-value">{usage[0]}%</span></div><Slider aria-label="Equipment efficiency improvement" value={usage} onValueChange={setUsage} min={0} max={40} step={1} /><div className="slider-scale"><span>0%</span><span>40%</span></div></div><div className="tariff-field"><label htmlFor="tariff">Electricity tariff</label><span className="tariff-help">Your estimated cost per kWh</span><div className="tariff-input-wrap"><span>₹</span><Input id="tariff" inputMode="decimal" type="number" min="0" step="0.5" value={tariff} onChange={(event) => setTariff(event.target.value)} aria-label="Electricity tariff in rupees per kilowatt hour"/><span>/ kWh</span></div></div><div className="baseline-note"><CircleHelp size={15} /><span>Illustrative baseline: <strong>42,800 kWh</strong> and <strong>₹12 / kWh</strong> per month.</span></div></Panel>
      <div className="sim-results"><section className="savings-feature"><div className="savings-feature-top"><span className="savings-feature-label"><Leaf size={15} />ESTIMATED MONTHLY SAVINGS</span><span className="savings-demo-chip">DEMO ESTIMATE</span></div><div className="savings-amount">{rupees(savings.savings)}</div><div className="savings-caption">potential reduction in monthly energy costs</div><div className="savings-stats"><div><span>Energy reduction</span><strong>{formatNumber(savings.reduction)} <small>kWh / mo</small></strong></div><div><span>Avoided emissions</span><strong>{savings.co2.toFixed(2)} <small>tCO₂ / mo</small></strong></div></div><div className="savings-footnote"><Sparkles size={14} />Calculated locally using simple illustrative assumptions.</div></section><Panel title="Monthly usage comparison" subtitle="Estimated electricity use before and after changes"><div className="comparison-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={comparison} margin={{ top: 18, right: 8, left: -10, bottom: 4 }}><defs><linearGradient id="comparisonFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.14}/><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 5"/><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-label)", fontSize: 11 }}/><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--chart-label)", fontSize: 11 }} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}/><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)", fontSize: 12 }} formatter={(value: number) => [`${formatNumber(value)} kWh`, "Monthly use"]}/><Area dataKey="usage" type="monotone" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#comparisonFill)"/></AreaChart></ResponsiveContainer></div><div className="comparison-legend"><span><i className="legend-mark legend-green"/>Current: 42,800 kWh</span><span><i className="legend-mark legend-teal"/>Adjusted: {formatNumber(Math.max(0, 42800 - savings.reduction))} kWh</span></div></Panel></div></div>
      <Panel title="Ideas to explore" subtitle="Small operational changes can add up"><div className="ideas-grid"><Idea icon={Lightbulb} number="01" title="Review start-up schedules" copy="Stagger HVAC and equipment start times to smooth morning demand."/><Idea icon={CloudSun} number="02" title="Check overnight setpoints" copy="Match cooling schedules to actual after-hours occupancy."/><Idea icon={Activity} number="03" title="Find always-on loads" copy="Review equipment that continues drawing power when spaces are empty."/></div></Panel>
    </div>
  );
}
function Idea({ icon: Icon, number, title, copy }: { icon: typeof Zap; number: string; title: string; copy: string }) { return <div className="idea-item"><div className="idea-icon"><Icon size={17}/></div><div className="idea-content"><div className="idea-number">{number} <span>·</span> SUGGESTION</div><strong>{title}</strong><p>{copy}</p></div><ArrowRight size={16} className="idea-arrow"/></div>; }

type CsvPreview = { name: string; size: string; headers: string[]; rows: string[][]; count: number; missing: number; duplicates: number; dates: number; error?: string };
function DataManagement() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<CsvPreview | null>(null);
  const [dragging, setDragging] = useState(false);
  const processFile = async (selected?: File) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv") && selected.type !== "text/csv") { setFile({ name: selected.name, size: `${(selected.size / 1024).toFixed(1)} KB`, headers: [], rows: [], count: 0, missing: 0, duplicates: 0, dates: 0, error: "Choose a CSV file to preview." }); return; }
    const text = await selected.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const parseLine = (line: string) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const headers = lines.length > 0 ? parseLine(lines[0]) : [];
    const allRows = lines.slice(1).map(parseLine);
    const missing = allRows.reduce((sum, row) => sum + headers.reduce((empty, _, index) => empty + (row[index] ? 0 : 1), 0), 0);
    const timestampIndex = headers.findIndex((header) => /time|date/i.test(header));
    const timestamps = timestampIndex < 0 ? [] : allRows.map((row) => row[timestampIndex]).filter(Boolean);
    setFile({ name: selected.name, size: `${(selected.size / 1024).toFixed(1)} KB`, headers, rows: allRows.slice(0, 6), count: allRows.length, missing, duplicates: timestamps.length - new Set(timestamps).size, dates: timestamps.length });
  };
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => { void processFile(event.target.files?.[0]); };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); void processFile(event.dataTransfer.files[0]); };
  const downloadSample = () => { const url = URL.createObjectURL(new Blob([sampleCsv], { type: "text/csv" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "energyiq-sample.csv"; anchor.click(); URL.revokeObjectURL(url); };
  return <div className="page-stack"><div className="data-overview-strip"><div className="data-overview-icon"><FileSpreadsheet size={20}/></div><div><strong>Energy meter data</strong><span>Sample dataset · 4 buildings · hourly intervals</span></div><div className="data-overview-stats"><span><strong>128</strong> meters</span><span><strong>30 days</strong> coverage</span><span><strong>15 min</strong> interval</span></div></div>
    <Panel title="Upload a CSV file" subtitle="Select a local meter export to inspect its columns and quality" action={<Button variant="outline" className="sample-button" onClick={downloadSample}><Download size={15}/>Download sample CSV</Button>}>
      <div className={`dropzone ${dragging ? "dropzone-active" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={onFileChange} aria-label="Choose CSV file"/><div className="upload-icon"><Upload size={20}/></div><div className="dropzone-copy"><strong>Drop your CSV file here</strong><span>or choose a file from your device · CSV only</span></div><Button variant="outline" onClick={() => inputRef.current?.click()}><FileSpreadsheet size={15}/>Choose file</Button></div>
      {file && <div className="file-result"><div className="file-result-icon"><FileSpreadsheet size={18}/></div><div className="file-result-copy"><strong>{file.name}</strong><span>{file.size} · {file.error ?? `${file.count} data rows`}</span></div>{file.error ? <Badge className="file-error-badge">CHECK FILE</Badge> : <Badge className="file-ready-badge"><CheckCircle2 size={12}/>PREVIEW READY</Badge>}<Button aria-label="Remove selected file" variant="ghost" size="icon" className="remove-file" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}><X size={16}/></Button></div>}
    </Panel>
    {file && !file.error ? <><div className="quality-grid"><QualityCard title="Missing values" value={file.missing === 0 ? "None found" : `${file.missing} cells`} detail={file.missing === 0 ? "All preview cells populated" : "Across the uploaded file"} good={file.missing === 0}/><QualityCard title="Duplicate timestamps" value={file.duplicates === 0 ? "None found" : `${file.duplicates} duplicates`} detail={file.dates ? `${file.dates} timestamps checked` : "No timestamp column found"} good={file.duplicates === 0}/><QualityCard title="Timestamp coverage" value={file.dates ? `${file.dates} rows` : "Not available"} detail={file.dates ? "Timestamp values detected" : "Add a timestamp column to check"} good={file.dates > 0}/></div><Panel title="File preview" subtitle={`Showing ${Math.min(6, file.count)} of ${file.count} rows`}><div className="table-scroll"><table className="data-table csv-table"><thead><tr>{file.headers.map((header, index) => <th key={`${header}-${index}`}>{header || `COLUMN ${index + 1}`}</th>)}</tr></thead><tbody>{file.rows.map((row, rowIndex) => <tr key={rowIndex}>{file.headers.map((_, colIndex) => <td key={colIndex}>{row[colIndex] || <span className="empty-cell">—</span>}</td>)}</tr>)}</tbody></table>{file.count === 0 && <div className="empty-state">No data rows were found in this file.</div>}</div></Panel></> : !file && <div className="data-empty-state"><div className="empty-icon"><FileSpreadsheet size={20}/></div><strong>Your file stays on this device</strong><span>Nothing is sent anywhere. Select a CSV to see a private, local preview.</span></div>}
    <div className="privacy-note"><ShieldAlert size={15}/><span>CSV files are read in your browser for this preview only and are never uploaded.</span></div>
  </div>;
}
function QualityCard({ title, value, detail, good }: { title: string; value: string; detail: string; good: boolean }) { return <div className="quality-card"><div className="quality-heading"><span>{title}</span><span className={`quality-status ${good ? "quality-good" : "quality-review"}`}><span/> {good ? "Looks good" : "Review"}</span></div><strong>{value}</strong><span className="quality-detail">{detail}</span></div>; }