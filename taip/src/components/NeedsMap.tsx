import { getRegion, REGIONS } from "@config/regions";

/**
 * Lihtne, võrguühenduseta töötav "kaart": piirkondade keskpunktid projitseeritakse SVG-le,
 * mullipind ~ päringute arv (üks järjestikune toon). Kõrval alati ka tabelivaade.
 */
type RegionRow = { regionId: string; total: number | null; critical: number | null; urgent: number | null };

const EE_BOUNDS = { minLng: 21.7, maxLng: 28.3, minLat: 57.45, maxLat: 59.75 };
const W = 640, H = 380;

type Bounds = typeof EE_BOUNDS;

/** Maakonna vaates suumitakse maakonna omavalitsustele, et mullid ei kattuks. */
function boundsFor(scope: string): Bounds {
  const inScope = REGIONS.filter((r) => r.id === scope || r.parentId === scope);
  if (scope === "EE" || inScope.length < 2) return EE_BOUNDS;
  const lats = inScope.map((r) => r.lat), lngs = inScope.map((r) => r.lng);
  const padLat = Math.max(0.12, (Math.max(...lats) - Math.min(...lats)) * 0.35);
  const padLng = Math.max(0.25, (Math.max(...lngs) - Math.min(...lngs)) * 0.35);
  return { minLat: Math.min(...lats) - padLat, maxLat: Math.max(...lats) + padLat, minLng: Math.min(...lngs) - padLng, maxLng: Math.max(...lngs) + padLng };
}

function project(b: Bounds, lat: number, lng: number) {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * W;
  const y = H - ((lat - b.minLat) / (b.maxLat - b.minLat)) * H;
  return { x, y };
}

export default function NeedsMap({ rows, minCell, scope }: { rows: RegionRow[]; minCell: number; scope: string }) {
  const b = boundsFor(getRegion(scope)?.kind === "municipality" ? getRegion(scope)!.parentId! : scope);
  const project_ = (lat: number, lng: number) => project(b, lat, lng);
  const max = Math.max(1, ...rows.map((r) => r.total ?? 0));
  const counties = b === EE_BOUNDS ? REGIONS.filter((r) => r.kind === "county") : [];
  return (
    <figure className="viz card" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Vajaduste kaart piirkondade kaupa">
        <rect x="0" y="0" width={W} height={H} fill="var(--surface)" />
        {counties.map((c) => {
          const p = project_(c.lat, c.lng);
          return <text key={c.id} x={p.x} y={p.y + 4} textAnchor="middle" className="tick">{c.name}</text>;
        })}
        {rows.map((r) => {
          const reg = getRegion(r.regionId);
          if (!reg) return null;
          const p = project_(reg.lat, reg.lng);
          const hidden = r.total === null;
          const rad = hidden ? 6 : 8 + 22 * Math.sqrt((r.total ?? 0) / max);
          const fill = hidden ? "var(--muted)" : (r.urgent ?? 0) + (r.critical ?? 0) > (r.total ?? 0) / 2 ? "var(--seq-3)" : "var(--seq-2)";
          return (
            <g key={r.regionId}>
              <circle cx={p.x} cy={p.y} r={rad + 8} fill="transparent">
                <title>{`${reg.name}: ${hidden ? `< ${minCell}` : r.total} päringut${hidden ? "" : ` (kiireid ${r.urgent}, kriitilisi ${r.critical})`}`}</title>
              </circle>
              <circle cx={p.x} cy={p.y} r={rad} fill={fill} fillOpacity={0.85} stroke="var(--surface)" strokeWidth={2} pointerEvents="none" />
              <text x={p.x} y={p.y - rad - 4} textAnchor="middle" className="label" pointerEvents="none">
                {reg.name} {hidden ? `<${minCell}` : r.total}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="muted" style={{ fontSize: "0.85rem" }}>
        Mulli pind ~ päringute arv. Tumedam = üle poole kiired/kriitilised. Hall = alla {minCell} päringu (peidetud). Hõljuta mullil detailide nägemiseks.
      </figcaption>
    </figure>
  );
}

export function DailyBars({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return <p className="muted">Andmed puuduvad.</p>;
  const w = 640, h = 160, pad = 24;
  const max = Math.max(...data.map((d) => d.count));
  const bw = (w - pad * 2) / data.length;
  return (
    <figure className="viz card" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${w} ${h + 24}`} role="img" aria-label="Päringud päevade kaupa">
        <line x1={pad} x2={w - pad} y1={h} y2={h} stroke="var(--line)" />
        {data.map((d, i) => {
          const bh = (d.count / max) * (h - 20);
          const x = pad + i * bw;
          return (
            <g key={d.date}>
              <rect x={x} y={0} width={bw} height={h} fill="transparent"><title>{`${d.date}: ${d.count}`}</title></rect>
              <path d={`M${x + 2},${h} v${-bh + 4} q0,-4 4,-4 h${bw - 12} q4,0 4,4 v${bh - 4} z`} fill="var(--seq-2)" pointerEvents="none" />
              <text x={x + bw / 2} y={h + 16} textAnchor="middle" className="tick">{d.date.slice(5)}</text>
              {(i === data.length - 1 || d.count === max) && <text x={x + bw / 2} y={h - bh - 6} textAnchor="middle" className="label">{d.count}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
