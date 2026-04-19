import Link from "next/link";

export default function AlertsPanel() {
  const actions = [
    {
      id: "notify-payment",
      label: "Notify Payments",
      href: "/Payments/notify",
      icon: "🔔",
      description: "Send payment notifications to tenants",
    },
    {
      id: "view-tenants",
      label: "View Tenants",
      href: "/Tenents",
      icon: "👥",
      description: "Manage tenant information",
    },
    {
      id: "view-apartments",
      label: "View Units",
      href: "/Units",
      icon: "🏢",
      description: "View all units",
    },
    {
      id: "payment-settings",
      label: "Payment Settings",
      href: "/Settings",
      icon: "⚙️",
      description: "Configure payment collection",
    },
  ];

  return (
    <article
      className='rounded-xl border p-5'
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow)",
      }}>
      <h2 className='mb-4 text-lg font-semibold [color:var(--text)]'>
        Management Tasks
      </h2>
      <div className='grid gap-3 sm:grid-cols-2'>
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className='group rounded-lg border p-3 transition hover:border-opacity-75'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}>
            <div className='flex items-start gap-3'>
              <span className='text-2xl'>{action.icon}</span>
              <div>
                <p className='font-semibold [color:var(--text)]'>
                  {action.label}
                </p>
                <p className='mt-0.5 text-xs app-text-muted'>
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}
