export default function KpiCard({
  label,
  value,
  subValue,
  subTone = "low",
  valueClassName = "",
}) {
  const toneStyle = {
    high: {
      borderColor: "var(--tone-high-border)",
      backgroundColor: "var(--tone-high-bg)",
      color: "var(--tone-high-text)",
    },
    medium: {
      borderColor: "var(--tone-medium-border)",
      backgroundColor: "var(--tone-medium-bg)",
      color: "var(--tone-medium-text)",
    },
    low: {
      borderColor: "var(--tone-low-border)",
      backgroundColor: "var(--tone-low-bg)",
      color: "var(--tone-low-text)",
    },
  };

  return (
    <article
      className='rounded-xl border p-4'
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow)",
      }}>
      <p className='text-sm app-text-muted'>{label}</p>
      <p
        className={`mt-1 text-2xl font-black [color:var(--text)] ${valueClassName}`}>
        {value}
      </p>
      {subValue ? (
        <span
          className='mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide'
          style={toneStyle[subTone] || toneStyle.low}>
          {subValue}
        </span>
      ) : null}
    </article>
  );
}
