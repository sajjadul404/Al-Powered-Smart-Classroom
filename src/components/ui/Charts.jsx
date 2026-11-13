import { useState } from 'react';

export function SimpleLineChart({
  labels,
  series,
  height = 220,
  thresholds,
}) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const w = 640;
  const h = height;
  const padL = 42;
  const padR = 16;
  const padT = 18;
  const padB = 28;

  const allVals = [
    ...series.flatMap((s) => s.values),
    ...(thresholds?.map((t) => t.value) ?? []),
  ];
  const minVal = Math.floor(Math.min(...allVals, 0) - 2);
  const maxVal = Math.ceil(Math.max(...allVals, 10) + 2);
  const span = Math.max(1, maxVal - minVal);

  const xFor = (i) =>
    labels.length <= 1 ? padL : padL + (i / (labels.length - 1)) * (w - padL - padR);
  const yFor = (v) => padT + ((maxVal - v) / span) * (h - padT - padB);

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => minVal + (span * i) / ticks);

  return (
    <div className="relative w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
        {hoverIdx !== null && labels[hoverIdx] && (
          <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200">
            {labels[hoverIdx]} ·{' '}
            {series.map((s) => `${s.name}: ${s.values[hoverIdx]}${s.unit ?? ''}`).join(' / ')}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto overflow-visible">
        {yTicks.map((t, idx) => {
          const y = yFor(t);
          return (
            <g key={idx}>
              <line
                x1={padL}
                y1={y}
                x2={w - padR}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="3 3"
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        {thresholds?.map((th) => {
          const y = yFor(th.value);
          return (
            <g key={th.label}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke={th.color} strokeWidth="1.2" strokeDasharray="5 4" />
              <text x={w - padR - 4} y={y - 4} textAnchor="end" fill={th.color} className="text-[10px] font-semibold">
                {th.label} ({th.value}°)
              </text>
            </g>
          );
        })}

        {series.map((s) => {
          const points = s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
          return (
            <g key={s.name}>
              <polyline fill="none" stroke={s.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" points={points} />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r={hoverIdx === i ? 5 : 3.2}
                  fill={s.color}
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              ))}
            </g>
          );
        })}

        {labels.map((lbl, i) => (
          <text
            key={i}
            x={xFor(i)}
            y={h - 6}
            textAnchor="middle"
            className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono tabular-nums"
          >
            {lbl}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function SimpleBarChart({ data, height = 180 }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 w-full pt-4" style={{ height }}>
      {data.map((item) => {
        const pct = Math.max(6, Math.round((item.value / maxVal) * 100));
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
            <span className="text-xs font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              {item.value}
            </span>
            <div className="w-full max-w-[44px] flex-1 flex items-end bg-slate-100 dark:bg-slate-800/60 rounded-t-md overflow-hidden">
              <div
                className="w-full rounded-t-md transition-all duration-300"
                style={{
                  height: `${pct}%`,
                  backgroundColor: item.color ?? '#2563EB',
                }}
              />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
