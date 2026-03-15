import Link from "next/link";

export default function QuickActions({ actions }) {
  return (
    <section
      className='rounded-xl border p-5'
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow)",
      }}>
      <h2 className='mb-4 text-lg font-semibold [color:var(--text)]'>
        Quick Actions
      </h2>
      <div className='flex flex-wrap gap-3'>
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            style={action.style}
            className={`rounded-full px-4 py-2 text-sm font-bold text-white transition ${action.className}`}>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
