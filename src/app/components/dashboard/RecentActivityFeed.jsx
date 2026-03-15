export default function RecentActivityFeed({ items }) {
  const levelStyle = {
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
      className='rounded-xl border p-5'
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow)",
      }}>
      <h2 className='mb-4 text-lg font-semibold [color:var(--text)]'>
        Recent Activity
      </h2>
      <ul className='space-y-3'>
        {items.map((item) => (
          <li
            key={item.id}
            className='rounded-lg border p-3'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}>
            <div className='flex items-start justify-between gap-3'>
              <p className='text-sm [color:var(--text)]'>{item.message}</p>
              {item.level ? (
                <span
                  className='rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide'
                  style={levelStyle[item.level] || levelStyle.low}>
                  {item.level}
                </span>
              ) : null}
            </div>
            <p className='mt-1 text-xs app-text-muted'>{item.time}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
