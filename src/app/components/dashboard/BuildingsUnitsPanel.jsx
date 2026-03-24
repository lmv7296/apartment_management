import Link from "next/link";

function occupancyPillStyle(isOccupied) {
  return isOccupied
    ? {
        borderColor: "var(--tone-medium-border)",
        backgroundColor: "var(--tone-medium-bg)",
        color: "var(--tone-medium-text)",
      }
    : {
        borderColor: "var(--tone-low-border)",
        backgroundColor: "var(--tone-low-bg)",
        color: "var(--tone-low-text)",
      };
}

export default function BuildingsUnitsPanel({ items, isManager }) {
  return (
    <article
      className='rounded-xl border p-5'
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow)",
      }}>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h2 className='text-lg font-semibold [color:var(--text)]'>
          {isManager ? "Buildings & Units" : "My Building & Unit"}
        </h2>
        <span className='text-xs app-text-muted'>
          {items.length} building{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className='text-sm app-text-muted'>
          No units are linked yet. Once assignments are added, they will appear
          here.
        </p>
      ) : (
        <div className='space-y-4'>
          {items.map((building) => (
            <section
              key={building.id}
              className='rounded-lg border p-4'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}>
              <div className='mb-3'>
                <h3 className='font-semibold [color:var(--text)]'>
                  {building.name}
                </h3>
                <p className='text-xs app-text-muted'>
                  {building.address}
                  {building.city || building.state
                    ? `, ${building.city || ""}${building.city && building.state ? ", " : ""}${building.state || ""}`
                    : ""}
                </p>
              </div>

              {building.units.length === 0 ? (
                <p className='text-sm app-text-muted'>
                  No units in this building.
                </p>
              ) : (
                <ul className='space-y-2'>
                  {building.units.map((unit) => (
                    <li
                      key={unit.id}
                      className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-3'
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--surface)",
                      }}>
                      <div>
                        <p className='text-sm font-medium [color:var(--text)]'>
                          Unit {unit.code}
                        </p>
                        <p className='text-xs app-text-muted'>
                          {unit.tenantName
                            ? `Tenant: ${unit.tenantName}`
                            : "No tenant assigned"}
                        </p>
                      </div>

                      <div className='flex items-center gap-2'>
                        {unit.leaseStatus ? (
                          <span className='rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide [color:var(--text)]'>
                            {unit.leaseStatus}
                          </span>
                        ) : null}
                        <span
                          className='rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide'
                          style={occupancyPillStyle(unit.occupied)}>
                          {unit.occupied ? "occupied" : "vacant"}
                        </span>
                      </div>

                      {!isManager ? (
                        <div className='mt-2 flex w-full gap-2'>
                          <Link
                            href={`/Maintenance?unit=${unit.id}`}
                            className='flex-1 rounded-lg border px-3 py-1.5 text-center text-xs font-semibold transition-opacity hover:opacity-80'
                            style={{
                              borderColor: "var(--primary)",
                              color: "var(--primary)",
                              backgroundColor: "var(--surface)",
                            }}>
                            Request Maintenance
                          </Link>
                          <Link
                            href={`/Maintenance/history?unit=${unit.id}`}
                            className='flex-1 rounded-lg border px-3 py-1.5 text-center text-xs font-semibold transition-opacity hover:opacity-80'
                            style={{
                              borderColor: "var(--border)",
                              color: "var(--text)",
                              backgroundColor: "var(--surface-2)",
                            }}>
                            See Requests
                          </Link>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
