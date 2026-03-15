function severityBadgeStyle(level) {
  if (level === "high") {
    return {
      borderColor: "var(--tone-high-border)",
      backgroundColor: "var(--tone-high-bg)",
      color: "var(--tone-high-text)",
    };
  }

  if (level === "medium") {
    return {
      borderColor: "var(--tone-medium-border)",
      backgroundColor: "var(--tone-medium-bg)",
      color: "var(--tone-medium-text)",
    };
  }

  return {
    borderColor: "var(--tone-low-border)",
    backgroundColor: "var(--tone-low-bg)",
    color: "var(--tone-low-text)",
  };
}

export default function AlertsPanel({ alerts }) {
  return (
    <article
      className='rounded-xl border p-5'
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow)",
      }}>
      <h2 className='mb-4 text-lg font-semibold [color:var(--text)]'>Alerts</h2>
      <ul className='space-y-3'>
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className='rounded-lg border p-3'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}>
            <div className='flex items-start justify-between gap-3'>
              <p className='font-medium [color:var(--text)]'>{alert.title}</p>
              <span
                className='rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide shadow-sm'
                style={severityBadgeStyle(alert.severity)}>
                {alert.severity}
              </span>
            </div>
            <p className='mt-1 text-sm app-text-muted'>{alert.detail}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
