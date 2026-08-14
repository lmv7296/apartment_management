import React from "react";

/**
 * Reusable single KPI Stat Card component.
 * 
 * Props:
 * - title: Heading label (e.g. "Occupancy Rate")
 * - value: Primary stat display (e.g. "95%", "12", "$4,500")
 * - subtitle: Secondary description text (e.g. "10 of 12 units occupied")
 * - accentColor: Left border highlight color (e.g. "#10b981" for green)
 * - icon: Optional SVG or React element
 * - className: Optional additional CSS classes
 * - style: Optional inline styles
 */
export default function KpiCard({
  title,
  value,
  subtitle,
  accentColor,
  icon,
  className = "",
  style = {},
}) {
  const cardStyle = {
    ...style,
    ...(accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : {}),
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md ${className}`}
      style={cardStyle}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <p className="mt-2 text-2xl font-black text-slate-900">
        {value ?? "—"}
      </p>

      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
