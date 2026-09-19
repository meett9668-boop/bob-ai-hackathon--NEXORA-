import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";
import { Cloud, Thermometer, Wind, Droplets, AlertTriangle, Zap, RefreshCw } from "lucide-react";

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  cardShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: string;
  condition: string;
  conditionIcon: string;
  visibility: number;
  precipitation: number;
  stormProbability: number;
  heatRisk: number;
  city: string;
  country: string;
  updatedAt: string;
  isLive: boolean;
}

interface ForecastHour {
  hour: string;
  temp: number;
  wind: number;
  rain: number;
  storm: number;
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  conditionIcon: string;
  stormProb: number;
  windMax: number;
}

interface WeatherRiskAsset {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "Healthy" | "Warning" | "Critical";
  baseRisk: number;
  weatherDelta: number;
  finalRisk: number;
  weatherReason: string;
}

// ─── Demo weather data (deterministic) ───────────────────────────────────────
// Used when OpenWeatherMap API is unavailable or not configured.
// Clearly labelled as DEMO data.
const DEMO_WEATHER: WeatherCurrent = {
  temp: 34,
  feelsLike: 38,
  humidity: 72,
  windSpeed: 28,
  windDir: "SW",
  condition: "Thunderstorm",
  conditionIcon: "⛈️",
  visibility: 6,
  precipitation: 12,
  stormProbability: 78,
  heatRisk: 7.2,
  city: "Mumbai",
  country: "IN",
  updatedAt: new Date().toISOString(),
  isLive: false,
};

function generateDemoForecastHours(): ForecastHour[] {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    temp: 30 + Math.round(Math.sin((i / 24) * Math.PI * 2) * 5),
    wind: 20 + (i > 10 && i < 18 ? 15 : 5),
    rain: i > 8 && i < 20 ? 8 + (i > 12 ? 4 : 0) : 1,
    storm: i > 10 && i < 20 ? 40 + (i > 14 ? 30 : 0) : 15,
  }));
}

function generateDemoForecastDays(): ForecastDay[] {
  const days = ["Today", "Tomorrow", "Wed", "Thu", "Fri"];
  const conditions = [
    { c: "Thunderstorm", icon: "⛈️" },
    { c: "Heavy Rain", icon: "🌧️" },
    { c: "Cloudy", icon: "☁️" },
    { c: "Partly Cloudy", icon: "⛅" },
    { c: "Sunny", icon: "☀️" },
  ];
  return days.map((day, i) => ({
    day,
    high: 34 - i,
    low: 24 - i,
    condition: conditions[i].c,
    conditionIcon: conditions[i].icon,
    stormProb: [78, 65, 30, 15, 5][i],
    windMax: [48, 35, 22, 18, 12][i],
  }));
}

// ─── Weather Risk Engine ──────────────────────────────────────────────────────
// Calculates weather-adjusted risk for grid assets based on weather conditions.
// All asset data is NEXORA DEMO DATA (simulated).
function calcWeatherRisk(weather: WeatherCurrent): WeatherRiskAsset[] {
  const assets: WeatherRiskAsset[] = [
    { id: "T-104", name: "Transformer T-104", type: "Power Transformer", location: "Substation A, Gujarat", status: "Critical", baseRisk: 78, weatherDelta: 0, finalRisk: 0, weatherReason: "" },
    { id: "CB-44", name: "Circuit Breaker CB-44", type: "Circuit Breaker", location: "West Grid, Gujarat", status: "Critical", baseRisk: 82, weatherDelta: 0, finalRisk: 0, weatherReason: "" },
    { id: "CB-23", name: "Circuit Breaker CB-23", type: "Circuit Breaker", location: "North Grid, Delhi", status: "Warning", baseRisk: 45, weatherDelta: 0, finalRisk: 0, weatherReason: "" },
    { id: "T-87", name: "Transformer T-87", type: "Power Transformer", location: "East Zone, West Bengal", status: "Warning", baseRisk: 38, weatherDelta: 0, finalRisk: 0, weatherReason: "" },
    { id: "F-14", name: "Feeder F-14", type: "Feeder", location: "Industrial Sector, Maharashtra", status: "Warning", baseRisk: 42, weatherDelta: 0, finalRisk: 0, weatherReason: "" },
    { id: "G-12", name: "Generator G-12", type: "Generator", location: "West Plant, Rajasthan", status: "Healthy", baseRisk: 12, weatherDelta: 0, finalRisk: 0, weatherReason: "" },
  ];

  const reasons: string[] = [];
  let totalDelta = 0;

  // Heat risk contribution
  if (weather.temp > 35) {
    const delta = Math.round((weather.temp - 35) * 2);
    reasons.push(`High temperature (${weather.temp}°C)`);
    totalDelta += delta;
  }

  // Storm probability contribution
  if (weather.stormProbability > 50) {
    const delta = Math.round((weather.stormProbability - 50) / 5);
    reasons.push(`High storm probability (${weather.stormProbability}%)`);
    totalDelta += delta;
  }

  // Wind speed contribution
  if (weather.windSpeed > 40) {
    const delta = Math.round((weather.windSpeed - 40) / 4);
    reasons.push(`High wind speed (${weather.windSpeed} km/h)`);
    totalDelta += delta;
  }

  // Precipitation contribution
  if (weather.precipitation > 10) {
    const delta = Math.round(weather.precipitation / 5);
    reasons.push(`Heavy rainfall (${weather.precipitation} mm/h)`);
    totalDelta += delta;
  }

  const reasonStr = reasons.length > 0 ? reasons.join(", ") : "Normal conditions";

  return assets.map(a => {
    // Outdoor/exposed assets get higher weather impact
    const exposureFactor = (a.type === "Feeder" || a.type === "Circuit Breaker") ? 1.4 : 1.0;
    const delta = Math.min(Math.round(totalDelta * exposureFactor), 25);
    const final = Math.min(a.baseRisk + delta, 99);
    return { ...a, weatherDelta: delta, finalRisk: final, weatherReason: reasonStr };
  });
}

// ─── OpenWeatherMap integration ───────────────────────────────────────────────
async function fetchLiveWeather(city = "Mumbai"): Promise<WeatherCurrent> {
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string | undefined;
  if (!API_KEY) throw new Error("VITE_WEATHER_API_KEY not configured");

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const d = await res.json();

  return {
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    windSpeed: Math.round((d.wind?.speed ?? 0) * 3.6), // m/s → km/h
    windDir: degToCardinal(d.wind?.deg ?? 0),
    condition: d.weather?.[0]?.main ?? "Unknown",
    conditionIcon: mapConditionIcon(d.weather?.[0]?.main ?? ""),
    visibility: Math.round((d.visibility ?? 10000) / 1000),
    precipitation: Math.round((d.rain?.["1h"] ?? d.snow?.["1h"] ?? 0) * 10) / 10,
    stormProbability: calcStormProb(d.weather?.[0]?.id ?? 800),
    heatRisk: calcHeatRisk(d.main.temp),
    city: d.name ?? city,
    country: d.sys?.country ?? "IN",
    updatedAt: new Date().toISOString(),
    isLive: true,
  };
}

function degToCardinal(deg: number): string {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function mapConditionIcon(condition: string): string {
  const map: Record<string, string> = {
    Thunderstorm: "⛈️", Drizzle: "🌦️", Rain: "🌧️", Snow: "❄️",
    Mist: "🌫️", Fog: "🌫️", Clear: "☀️", Clouds: "☁️",
  };
  return map[condition] ?? "🌤️";
}

function calcStormProb(weatherId: number): number {
  if (weatherId >= 200 && weatherId < 300) return 85;
  if (weatherId >= 300 && weatherId < 400) return 60;
  if (weatherId >= 500 && weatherId < 600) return 50;
  if (weatherId >= 600 && weatherId < 700) return 30;
  if (weatherId === 741) return 15;
  return 5;
}

function calcHeatRisk(temp: number): number {
  if (temp < 25) return 1;
  if (temp < 30) return 3;
  if (temp < 35) return 5;
  if (temp < 40) return 7.5;
  return 9.5;
}

// ─── Gauge component ─────────────────────────────────────────────────────────
function RiskGauge({ value, label }: { value: number; label: string }) {
  const pct = Math.min(value, 100);
  const color = pct >= 70 ? C.danger : pct >= 40 ? C.warning : C.success;
  const r = 36, cx = 48, cy = 48;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="96" height="64" viewBox="0 0 96 96" style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth="8" strokeDasharray={`${circ / 2} ${circ / 2}`} strokeDashoffset={-circ / 4} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${Math.min(dash, circ / 2)} ${circ}`}
          strokeDashoffset={-circ / 4} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill={color}>{pct}%</text>
      </svg>
      <div style={{ fontSize: 11, color: C.muted, marginTop: -8 }}>{label}</div>
    </div>
  );
}

// ─── WeatherPage ──────────────────────────────────────────────────────────────
export default function WeatherPage() {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [forecastHours, setForecastHours] = useState<ForecastHour[]>([]);
  const [forecastDays, setForecastDays] = useState<ForecastDay[]>([]);
  const [riskAssets, setRiskAssets] = useState<WeatherRiskAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [city] = useState("Mumbai");

  const loadWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const liveData = await fetchLiveWeather(city);
      setWeather(liveData);
      setForecastHours(generateDemoForecastHours()); // OWM free tier requires paid for hourly
      setForecastDays(generateDemoForecastDays());
      setRiskAssets(calcWeatherRisk(liveData));
    } catch {
      // Gracefully fall back to demo data — never crash
      const demo = { ...DEMO_WEATHER, updatedAt: new Date().toISOString() };
      setWeather(demo);
      setForecastHours(generateDemoForecastHours());
      setForecastDays(generateDemoForecastDays());
      setRiskAssets(calcWeatherRisk(demo));
      if (retryCount > 0) {
        setError("Live weather unavailable. Showing NEXORA demo weather data.");
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, retryCount]);

  useEffect(() => {
    loadWeather();
    // Auto-refresh every 10 minutes max — no infinite loop
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadWeather]);

  function handleRetry() {
    if (retryCount >= 2) {
      setError("Max retries reached. Showing demo data.");
      return;
    }
    setRetryCount(r => r + 1);
  }

  const riskLevel = weather
    ? weather.stormProbability >= 70 ? "HIGH"
    : weather.stormProbability >= 40 ? "MEDIUM"
    : "LOW"
    : "—";

  const riskColor = riskLevel === "HIGH" ? C.danger : riskLevel === "MEDIUM" ? C.warning : C.success;

  if (loading) {
    return (
      <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <div style={{ fontSize: 14, color: C.muted }}>Loading weather intelligence…</div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Weather Intelligence</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>
            Weather risk analysis connected to grid asset health
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {weather && (
            <span style={{
              background: weather.isLive ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
              color: weather.isLive ? C.success : C.warning,
              border: `1px solid ${weather.isLive ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
              borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600,
            }}>
              {weather.isLive ? "🟢 LIVE" : "🟡 DEMO DATA"}
            </span>
          )}
          <button
            onClick={handleRetry}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "8px 14px", fontSize: 13, color: C.text, cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 8, padding: "12px 16px", marginBottom: 20,
          fontSize: 13, color: C.warning, display: "flex", alignItems: "center", gap: 8,
        }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {weather && (
        <>
          {/* Current Conditions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Main weather card */}
            <div style={{
              background: `linear-gradient(135deg, ${riskColor}15, ${C.surface})`,
              border: `1px solid ${C.border}`, borderRadius: 16, padding: 24,
              boxShadow: C.cardShadow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                    {weather.city}, {weather.country}
                  </div>
                  <div style={{ fontSize: 64, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                    {weather.temp}°
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginTop: 4 }}>
                    {weather.conditionIcon} {weather.condition}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    Feels like {weather.feelsLike}°C
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    background: riskColor + "22", border: `1px solid ${riskColor}44`,
                    color: riskColor, borderRadius: 8, padding: "8px 16px",
                    fontSize: 14, fontWeight: 700,
                  }}>
                    ⚡ {riskLevel} RISK
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                    Updated {new Date(weather.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: <Droplets size={16} color="#60a5fa" />, label: "Humidity", value: `${weather.humidity}%`, color: weather.humidity > 85 ? C.warning : C.success },
                { icon: <Wind size={16} color="#94a3b8" />, label: "Wind Speed", value: `${weather.windSpeed} km/h ${weather.windDir}`, color: weather.windSpeed > 40 ? C.danger : weather.windSpeed > 25 ? C.warning : C.success },
                { icon: <Cloud size={16} color="#93c5fd" />, label: "Precipitation", value: `${weather.precipitation} mm/h`, color: weather.precipitation > 10 ? C.danger : weather.precipitation > 5 ? C.warning : C.success },
                { icon: <Thermometer size={16} color="#f87171" />, label: "Heat Risk", value: `${weather.heatRisk.toFixed(1)}/10`, color: weather.heatRisk > 7 ? C.danger : weather.heatRisk > 5 ? C.warning : C.success },
                { icon: <Zap size={16} color="#fbbf24" />, label: "Storm Probability", value: `${weather.stormProbability}%`, color: weather.stormProbability > 60 ? C.danger : weather.stormProbability > 35 ? C.warning : C.success },
                { icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>, label: "Visibility", value: `${weather.visibility} km`, color: weather.visibility < 5 ? C.danger : weather.visibility < 8 ? C.warning : C.success },
              ].map(m => (
                <div key={m.label} style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: "12px 14px", boxShadow: C.cardShadow,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    {m.icon}
                    <span style={{ fontSize: 11, color: C.muted }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            boxShadow: C.cardShadow, padding: 24, marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>5-Day Forecast</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {forecastDays.map(d => (
                <div key={d.day} style={{
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: "14px 12px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{d.day}</div>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{d.conditionIcon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{d.high}° / {d.low}°</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{d.condition}</div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{
                      fontSize: 10, padding: "2px 6px", borderRadius: 8, fontWeight: 600,
                      background: d.stormProb > 50 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                      color: d.stormProb > 50 ? C.danger : C.warning,
                    }}>⛈ {d.stormProb}%</div>
                    <div style={{ fontSize: 10, color: C.muted }}>💨 {d.windMax} km/h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 24h Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>⛈️ Storm Probability (24h)</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={forecastHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: C.muted }} interval={5} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: C.muted }} />
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, fontSize: 12 }} />
                  <Line type="monotone" dataKey="storm" name="Storm %" stroke={C.danger} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>💨 Wind Speed (24h)</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={forecastHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: C.muted }} interval={5} />
                  <YAxis tick={{ fontSize: 10, fill: C.muted }} />
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, fontSize: 12 }} />
                  <Bar dataKey="wind" name="Wind km/h" fill={C.primary} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weather → Asset Risk */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>⚡ Weather → Grid Asset Risk</h2>
              <span style={{ fontSize: 11, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px" }}>
                NEXORA DEMO ASSETS
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              How current weather conditions affect the failure risk of monitored grid assets.
              Base risk comes from equipment health data; weather adds incremental risk.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {riskAssets.sort((a, b) => b.finalRisk - a.finalRisk).map(asset => {
                const finalColor = asset.finalRisk >= 70 ? C.danger : asset.finalRisk >= 40 ? C.warning : C.success;
                return (
                  <div key={asset.id} style={{
                    background: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                  }}>
                    <div style={{ minWidth: 120 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{asset.id}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{asset.type}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{asset.location}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>{asset.weatherReason}</div>
                    </div>
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Base Risk</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.muted }}>{asset.baseRisk}%</div>
                      </div>
                      <div style={{ fontSize: 20, color: C.warning, fontWeight: 700 }}>+{asset.weatherDelta}%</div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Final Risk</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: finalColor }}>{asset.finalRisk}%</div>
                      </div>
                      <RiskGauge value={asset.finalRisk} label={asset.status} />
                      <button
                        onClick={() => navigate(`/equipment/${asset.id}`)}
                        style={{
                          background: C.primary, color: "#fff", border: "none",
                          borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 600,
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
