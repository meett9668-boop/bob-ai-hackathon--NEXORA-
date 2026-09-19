import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import type { Equipment } from "../../store/appStore";
// Global Google types are declared in global.d.ts

/* ─── Deterministic geographic coordinates for NEXORA demo assets ───────────
   These are synthetic/simulated coordinates.
   Each coordinate maps to a real Indian city/region for demonstration purposes.
   ──────────────────────────────────────────────────────────────────────────── */
const ASSET_COORDS: Record<string, { lat: number; lng: number }> = {
  "T-104":  { lat: 23.0225, lng: 72.5714 },  // Ahmedabad, Gujarat
  "CB-23":  { lat: 28.6139, lng: 77.2090 },  // Delhi
  "T-87":   { lat: 22.5726, lng: 88.3639 },  // Kolkata, West Bengal
  "G-12":   { lat: 27.0238, lng: 74.2179 },  // Ajmer, Rajasthan
  "CB-56":  { lat: 13.0827, lng: 80.2707 },  // Chennai, Tamil Nadu
  "T-91":   { lat: 23.2599, lng: 77.4126 },  // Bhopal, Madhya Pradesh
  "F-14":   { lat: 19.0760, lng: 72.8777 },  // Mumbai, Maharashtra
  "S-07":   { lat: 12.9716, lng: 77.5946 },  // Bengaluru, Karnataka
  "G-05":   { lat: 26.8467, lng: 80.9462 },  // Lucknow, Uttar Pradesh
  "CB-44":  { lat: 21.1702, lng: 72.8311 },  // Surat, Gujarat
};

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const INDIA_ZOOM = 5;

const STATUS_COLORS: Record<string, string> = {
  Critical: "#EF4444",
  Warning: "#F59E0B",
  Healthy: "#22C55E",
};

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  cardShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
};

const FILTER_TABS = ["All", "Healthy", "Warning", "Critical"];

/* ─── SVG fallback map (India outline) ─────────────────────────────────────── */
const INDIA_REGIONS = [
  { name: "Jammu & Kashmir", x: 280, y: 60 }, { name: "Punjab", x: 255, y: 115 },
  { name: "Rajasthan", x: 200, y: 185 }, { name: "Gujarat", x: 150, y: 240 },
  { name: "Maharashtra", x: 220, y: 295 }, { name: "Karnataka", x: 245, y: 360 },
  { name: "Tamil Nadu", x: 290, y: 415 }, { name: "Delhi", x: 300, y: 140 },
  { name: "Uttar Pradesh", x: 360, y: 165 }, { name: "West Bengal", x: 480, y: 215 },
  { name: "Madhya Pradesh", x: 310, y: 240 }, { name: "Andhra Pradesh", x: 320, y: 345 },
];
const INDIA_PATH = `M 280,45 L 340,48 L 380,65 L 420,60 L 450,80 L 480,85 L 500,100
  L 510,130 L 520,155 L 530,180 L 510,210 L 500,230 L 520,250 L 515,280
  L 490,295 L 480,320 L 470,345 L 450,365 L 430,385 L 400,405 L 380,420
  L 350,430 L 330,425 L 310,415 L 290,400 L 270,380 L 250,360 L 235,335
  L 220,305 L 200,285 L 180,260 L 165,235 L 155,205 L 145,175 L 155,145
  L 165,120 L 175,100 L 195,80 L 215,68 L 245,58 L 265,50 Z`;
const SR_LINES = [
  [300,140,360,165],[360,165,480,215],[300,140,310,240],
  [310,240,220,295],[220,295,245,360],[245,360,290,415],
  [310,240,320,345],[200,185,150,240],[150,240,220,295],
];

function getMarkerShape(type: string, x: number, y: number, color: string, selected: boolean) {
  const sz = selected ? 14 : 10;
  const glow = color + "55";
  if (type === "Power Transformer") {
    return (
      <g>
        {selected && <circle cx={x} cy={y} r={sz + 7} fill={glow} opacity={0.5} />}
        <rect x={x - sz/2} y={y - sz/2} width={sz} height={sz} fill={color} rx="2" stroke="#fff" strokeWidth={selected ? 2 : 1.5} />
        <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="5" fontWeight="700" fill="#fff">T</text>
      </g>
    );
  }
  if (type === "Generator") {
    const pts = `${x},${y - sz*0.9} ${x + sz*0.8},${y + sz*0.45} ${x - sz*0.8},${y + sz*0.45}`;
    return (
      <g>
        {selected && <circle cx={x} cy={y} r={sz + 7} fill={glow} opacity={0.5} />}
        <polygon points={pts} fill={color} stroke="#fff" strokeWidth={selected ? 2 : 1.5} />
        <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="middle" fontSize="5" fontWeight="700" fill="#fff">G</text>
      </g>
    );
  }
  return (
    <g>
      {selected && <circle cx={x} cy={y} r={sz + 7} fill={glow} opacity={0.5} />}
      <circle cx={x} cy={y} r={sz/2 + 3} fill={color} stroke="#fff" strokeWidth={selected ? 2 : 1.5} />
      <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="5" fontWeight="700" fill="#fff">
        {type === "Circuit Breaker" ? "CB" : type === "Substation" ? "S" : type === "Feeder" ? "F" : type[0]}
      </text>
    </g>
  );
}

/* ─── SVG fallback map ───────────────────────────────────────────────────────── */
function SvgMap({ equipment, filter, selected, onSelect }: {
  equipment: Equipment[]; filter: string; selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const mappable = equipment.filter(e => e.mapX !== undefined && e.mapY !== undefined);
  const visible = mappable.filter(m => filter === "All" || m.status === filter);
  const selectedItem = mappable.find(m => m.id === selected);
  const navigate = useNavigate();

  return (
    <svg viewBox="0 0 680 460" style={{ width: "100%", cursor: "crosshair" }} onClick={() => onSelect(null)}>
      <rect width="680" height="460" fill="#EEF5FF" />
      {[80,160,240,320,400,480,560,640].map(x => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="460" stroke="#dde8f5" strokeWidth="0.8" />
      ))}
      {[60,120,180,240,300,360,420].map(y => (
        <line key={`h${y}`} x1="0" y1={y} x2="680" y2={y} stroke="#dde8f5" strokeWidth="0.8" />
      ))}
      <path d={INDIA_PATH} fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" fillOpacity="0.7" />
      {INDIA_REGIONS.map(r => (
        <text key={r.name} x={r.x} y={r.y} fontSize="8" fill="#94a3b8" fontStyle="italic" textAnchor="middle">{r.name}</text>
      ))}
      {SR_LINES.map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="6 4" opacity="0.6" />
      ))}
      {visible.map(m => (
        <g key={m.id} onClick={e => { e.stopPropagation(); onSelect(m.id === selected ? null : m.id); }} style={{ cursor: "pointer" }}>
          {getMarkerShape(m.type, m.mapX!, m.mapY!, STATUS_COLORS[m.status], selected === m.id)}
        </g>
      ))}
      {selectedItem && (() => {
        const m = selectedItem;
        const px = Math.min(m.mapX! + 16, 500);
        const py = Math.max(m.mapY! - 50, 10);
        return (
          <g>
            <rect x={px} y={py} width={175} height={90} rx="8"
              fill="white" stroke={C.border} strokeWidth="1"
              filter="drop-shadow(0 2px 8px rgba(0,0,0,0.12))" />
            <text x={px + 10} y={py + 18} fontSize="11" fontWeight="700" fill={C.text}>{m.id} — {m.name}</text>
            <text x={px + 10} y={py + 32} fontSize="9.5" fill={C.muted}>{m.type}</text>
            <text x={px + 10} y={py + 46} fontSize="9.5" fill={C.muted}>{m.location}</text>
            <text x={px + 10} y={py + 60} fontSize="9.5" fill={C.muted}>Risk Score: {m.risk}%</text>
            <rect x={px + 10} y={py + 68} width={8} height={8} rx="4" fill={STATUS_COLORS[m.status]} />
            <text x={px + 22} y={py + 76} fontSize="9.5" fontWeight="600" fill={STATUS_COLORS[m.status]}>{m.status}</text>
            <foreignObject x={px + 10} y={py + 74} width={155} height={20}>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/equipment/${m.id}`); }}
                style={{ fontSize: 9, background: C.primary, color: "#fff", border: "none", borderRadius: 3, padding: "2px 6px", cursor: "pointer" }}
              >
                View Details →
              </button>
            </foreignObject>
          </g>
        );
      })()}
      <g transform="translate(640,36)">
        <circle cx="0" cy="0" r="18" fill="white" stroke={C.border} strokeWidth="1" />
        <text x="0" y="-7" textAnchor="middle" fontSize="8" fontWeight="700" fill={C.primary}>N</text>
        <text x="0" y="12" textAnchor="middle" fontSize="7" fill={C.muted}>S</text>
        <text x="-9" y="3" textAnchor="middle" fontSize="7" fill={C.muted}>W</text>
        <text x="9" y="3" textAnchor="middle" fontSize="7" fill={C.muted}>E</text>
        <polygon points="0,-14 3,-4 -3,-4" fill={C.primary} />
        <polygon points="0,14 3,4 -3,4" fill={C.muted} />
      </g>
    </svg>
  );
}

/* ─── Google Maps component ──────────────────────────────────────────────────── */
function GoogleMapView({ equipment, filter, selected, onSelect }: {
  equipment: Equipment[]; filter: string; selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<GoogleMarkerInstance[]>([]);
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);

  const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const initMap = useCallback(() => {
    const gmaps = window.google?.maps;
    if (!gmaps || !mapRef.current) return;
    const map = new gmaps.Map(mapRef.current, {
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      mapTypeId: "roadmap",
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "simplified" }] },
      ],
    });
    mapInstanceRef.current = map;
    infoWindowRef.current = new gmaps.InfoWindow({ content: "" });
    return map;
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!MAPS_API_KEY) return;
    const scriptId = "google-maps-script";
    if (document.getElementById(scriptId)) {
      if (window.google?.maps) initMap();
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=marker`;
    script.async = true;
    script.onload = () => initMap();
    document.head.appendChild(script);
  }, [MAPS_API_KEY, initMap]);

  // Place/update markers whenever equipment or filter changes
  useEffect(() => {
    const gmaps = window.google?.maps;
    if (!mapInstanceRef.current || !gmaps) return;
    const map = mapInstanceRef.current;
    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const filtered = equipment.filter(e =>
      ASSET_COORDS[e.id] && (filter === "All" || e.status === filter)
    );

    filtered.forEach(eq => {
      const coords = ASSET_COORDS[eq.id];
      if (!coords) return;
      const color = STATUS_COLORS[eq.status] ?? "#3B82F6";
      const marker = new gmaps.Marker({
        position: coords,
        map,
        title: eq.name,
        animation: gmaps.Animation.DROP,
        icon: {
          path: "M 0,-10 A 10,10 0 1,1 0.001,-10 Z",
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: selected === eq.id ? 1.4 : 1,
        },
        label: {
          text: eq.type === "Power Transformer" ? "T"
              : eq.type === "Generator" ? "G"
              : eq.type === "Circuit Breaker" ? "CB"
              : eq.type === "Substation" ? "S"
              : eq.type === "Feeder" ? "F" : eq.type[0],
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: "700",
        },
      });

      marker.addListener("click", () => {
        onSelect(eq.id);
        if (infoWindowRef.current) {
          (infoWindowRef.current as unknown as { setContent: (html: string) => void }).setContent(`
            <div style="font-family:Inter,system-ui,sans-serif;padding:4px;min-width:200px">
              <div style="font-size:14px;font-weight:700;color:#1E293B;margin-bottom:4px">${eq.id} — ${eq.name}</div>
              <div style="font-size:12px;color:#64748B;margin-bottom:2px">${eq.type}</div>
              <div style="font-size:12px;color:#64748B;margin-bottom:2px">${eq.location}</div>
              <div style="font-size:12px;color:#64748B;margin-bottom:6px">Risk: <strong>${eq.risk}%</strong></div>
              <div style="display:inline-block;background:${color};color:#fff;border-radius:12px;padding:2px 10px;font-size:11px;font-weight:700;margin-bottom:8px">${eq.status}</div>
              <br/>
              <a href="/equipment/${eq.id}" style="color:#3B82F6;font-size:12px;font-weight:600;text-decoration:none">
                View Details →
              </a>
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });
      markersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipment, filter, selected]);

  // Pan to selected
  useEffect(() => {
    const gmaps = window.google?.maps;
    if (!selected || !mapInstanceRef.current || !gmaps) return;
    const coords = ASSET_COORDS[selected];
    if (coords) {
      mapInstanceRef.current.setCenter(new gmaps.LatLng(coords.lat, coords.lng));
      mapInstanceRef.current.setZoom(9);
    }
  }, [selected]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 460 }} />;
}

/* ─── Main Maps Page ──────────────────────────────────────────────────────────── */
export default function MapsPage() {
  const navigate = useNavigate();
  const { equipment } = useAppStore();
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);

  const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const useGoogleMaps = !!MAPS_API_KEY;

  const mappableEquipment = equipment.filter(e => e.mapX !== undefined && e.mapY !== undefined);
  const visible = mappableEquipment.filter(m => filter === "All" || m.status === filter);
  const selectedItem = mappableEquipment.find(m => m.id === selected);

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Maps</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>
            India power grid equipment distribution
            {useGoogleMaps
              ? " — Google Maps"
              : <span style={{ color: "#F59E0B", fontSize: 12 }}> — SVG preview (set VITE_GOOGLE_MAPS_API_KEY for real map)</span>
            }
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4 }}>
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: filter === tab ? 600 : 400,
              background: filter === tab ? C.primary : "transparent",
              color: filter === tab ? "#fff" : C.muted,
              border: "none", cursor: "pointer", transition: "all 0.15s",
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total", val: mappableEquipment.length, color: C.primary },
          { label: "Healthy", val: mappableEquipment.filter(m => m.status === "Healthy").length, color: C.success },
          { label: "Warning", val: mappableEquipment.filter(m => m.status === "Warning").length, color: C.warning },
          { label: "Critical", val: mappableEquipment.filter(m => m.status === "Critical").length, color: C.danger },
        ].map(s => (
          <div key={s.label} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, boxShadow: C.cardShadow,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: C.muted }}>{s.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{s.val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 20, alignItems: "start" }}>
        {/* Map panel */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, boxShadow: C.cardShadow, overflow: "hidden",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {useGoogleMaps ? "Google Maps — India Power Grid" : "India Power Grid Map (SVG)"}
            </span>
            <span style={{ fontSize: 11, color: C.muted }}>
              {useGoogleMaps ? "Click a marker for details" : "Click a marker for details · Add VITE_GOOGLE_MAPS_API_KEY for real map"}
            </span>
          </div>
          {useGoogleMaps ? (
            <GoogleMapView
              equipment={mappableEquipment}
              filter={filter}
              selected={selected}
              onSelect={setSelected}
            />
          ) : (
            <SvgMap
              equipment={mappableEquipment}
              filter={filter}
              selected={selected}
              onSelect={setSelected}
            />
          )}
        </div>

        {/* Equipment list panel */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, boxShadow: C.cardShadow, overflow: "hidden",
          maxHeight: 520, display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, color: C.text }}>
            Equipment ({visible.length})
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {visible.map(m => (
              <button key={m.id} onClick={() => setSelected(m.id === selected ? null : m.id)} style={{
                width: "100%", background: selected === m.id ? "rgba(59,130,246,0.06)" : "transparent",
                border: "none", cursor: "pointer", padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10,
                borderBottom: `1px solid ${C.border}`, transition: "background 0.12s", textAlign: "left",
              }}
                onMouseEnter={e => { if (selected !== m.id) (e.currentTarget as HTMLButtonElement).style.background = C.bg; }}
                onMouseLeave={e => { if (selected !== m.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[m.status], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.id}</div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.region ?? m.location}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: C.muted }}>{m.type.split(" ")[0]}</span>
              </button>
            ))}
            {visible.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>
                No {filter !== "All" ? filter.toLowerCase() : ""} equipment found.
              </div>
            )}
          </div>
          {selectedItem && (
            <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`, background: C.bg }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{selectedItem.id} — {selectedItem.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{selectedItem.location}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>Type: {selectedItem.type}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Risk: {selectedItem.risk}%</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: STATUS_COLORS[selectedItem.status] + "22",
                  color: STATUS_COLORS[selectedItem.status],
                  borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                }}>
                  {selectedItem.status}
                </span>
              </div>
              <button
                onClick={() => navigate(`/equipment/${selectedItem.id}`)}
                style={{
                  width: "100%", height: 34, background: C.primary, color: "#fff", border: "none",
                  borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                View Equipment Details →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "12px 20px", marginTop: 16, display: "flex", gap: 24, flexWrap: "wrap",
        boxShadow: C.cardShadow, alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginRight: 4 }}>Legend:</span>
        {[
          { shape: "square" as const, label: "Transformer" },
          { shape: "triangle" as const, label: "Generator" },
          { shape: "circle" as const, label: "CB / Substation / Other" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
            <span style={{
              display: "inline-block", width: 10, height: 10,
              background: C.muted, borderRadius: l.shape === "circle" ? "50%" : l.shape === "square" ? "2px" : 0,
              clipPath: l.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
            }} />
            {l.label}
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          {[{ color: C.success, label: "Healthy" }, { color: C.warning, label: "Warning" }, { color: C.danger, label: "Critical" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.muted }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block" }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
