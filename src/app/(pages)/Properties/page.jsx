"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { APP_ROUTES } from "@/config/routes";

export default function PropertiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const ITEMS_PER_PAGE = 10;

  const headerStats = React.useMemo(() => {
    const propertyCount = properties.length;
    const unitCount = properties.reduce(
      (sum, property) => sum + Number(property.unitCount || 0),
      0,
    );
    const tenantCount = properties.reduce(
      (sum, property) => sum + Number(property.tenantCount || 0),
      0,
    );
    return { propertyCount, unitCount, tenantCount };
  }, [properties]);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
      return;
    }

    async function loadProperties() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/v1/Properties", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || data?.error || "Failed to load properties",
          );
        }

        setProperties(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setProperties([]);
        setError(loadError.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, [status, router]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredProperties = properties.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.address || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      (p.state || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProps = filteredProperties.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <main className='min-h-screen bg-slate-50 px-6 py-6'>
      {/* Page header */}
      <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
            Portfolio
          </p>
          <h1 className='mt-1 text-3xl font-black text-slate-900'>
            Properties
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Browse all buildings, view key stats, and click into each property
            for unit details.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'>
            <svg className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
            Export Data
          </button>
          <Link
            href='/Properties/new'
            className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white'
            style={{ backgroundColor: "#0f172a" }}>
            <svg className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
                clipRule='evenodd'
              />
            </svg>
            Add Property
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <div className='rounded-xl border border-slate-200 bg-white p-5'>
          <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
            Total Properties
          </p>
          <p className='mt-2 text-2xl font-black text-slate-900'>
            {headerStats.propertyCount}
          </p>
          <p className='mt-1 text-[11px] text-slate-400'>In portfolio</p>
        </div>
        <div
          className='rounded-xl border border-slate-200 bg-white p-5'
          style={{ borderLeftWidth: 4, borderLeftColor: "#10b981" }}>
          <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
            Listed Units
          </p>
          <p className='mt-2 text-2xl font-black text-slate-900'>
            {headerStats.unitCount}
          </p>
          <p className='mt-1 text-[11px] text-slate-400'>
            Across all properties
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-5'>
          <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
            Active Tenants
          </p>
          <p className='mt-2 text-2xl font-black text-slate-900'>
            {headerStats.tenantCount}
          </p>
          <p className='mt-1 text-[11px] text-slate-400'>Currently leasing</p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-5'>
          <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
            Avg. Units / Property
          </p>
          <p className='mt-2 text-2xl font-black text-slate-900'>
            {headerStats.propertyCount > 0
              ? (headerStats.unitCount / headerStats.propertyCount).toFixed(1)
              : "—"}
          </p>
          <p className='mt-1 text-[11px] text-slate-400'>Portfolio average</p>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600'>
          {error}
        </div>
      ) : null}

      {/* Properties panel */}
      <div className='rounded-xl border border-slate-200 bg-white'>
        {/* Search bar */}
        <div className='flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3'>
          <div className='relative min-w-[220px] flex-1'>
            <svg
              className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400'
              viewBox='0 0 20 20'
              fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                clipRule='evenodd'
              />
            </svg>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by name, address or city...'
              className='w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <p className='shrink-0 text-xs text-slate-400'>
            {filteredProperties.length} propert
            {filteredProperties.length === 1 ? "y" : "ies"}
          </p>
        </div>

        {/* Table / states */}
        {loading ? (
          <div className='py-12 text-center text-sm text-slate-400'>
            Loading properties…
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className='py-12 text-center'>
            <p className='text-sm font-semibold text-slate-500'>
              No properties found
            </p>
            <p className='mt-1 text-xs text-slate-400'>
              {searchQuery
                ? "Try a different search term."
                : "Add properties to the database to see them here."}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-slate-100'>
                  {["Property", "Location", "Units", "Tenants", "Actions"].map(
                    (col) => (
                      <th
                        key={col}
                        className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedProps.map((property) => (
                  <tr
                    key={property.id}
                    className='border-b border-slate-100 last:border-0 hover:bg-slate-50'>
                    {/* Property */}
                    <td className='px-4 py-4'>
                      <div className='flex items-center gap-3'>
                        <div
                          className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white'
                          style={{
                            background:
                              "linear-gradient(135deg, #2dd4bf, #3b82f6)",
                          }}>
                          <svg
                            className='h-6 w-6'
                            viewBox='0 0 20 20'
                            fill='currentColor'>
                            <path
                              fillRule='evenodd'
                              d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 010-2V4zm3 1h2v2H7V5zm4 0h2v2h-2V5zM7 9h2v2H7V9zm4 0h2v2h-2V9z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                        <div>
                          <p className='font-bold text-slate-900'>
                            {property.name}
                          </p>
                          <p className='text-xs text-slate-400'>
                            Added{" "}
                            {property.createdAt
                              ? new Date(property.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className='px-4 py-4'>
                      <p className='text-slate-700'>{property.address}</p>
                      <p className='text-xs text-slate-400'>
                        {property.city}, {property.state}
                      </p>
                    </td>

                    {/* Units */}
                    <td className='px-4 py-4'>
                      <p className='font-semibold text-slate-900'>
                        {property.unitCount ?? 0}
                      </p>
                      <p className='text-xs text-slate-400'>total units</p>
                    </td>

                    {/* Tenants */}
                    <td className='px-4 py-4'>
                      <p className='font-semibold text-slate-900'>
                        {property.tenantCount ?? 0}
                      </p>
                      <p className='text-xs text-slate-400'>active leases</p>
                    </td>

                    {/* Actions */}
                    <td className='px-4 py-4'>
                      <Link
                        href={`/Properties/${property.id}`}
                        className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50'>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredProperties.length > ITEMS_PER_PAGE ? (
          <div className='flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500'>
            <p>
              Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(safePage * ITEMS_PER_PAGE, filteredProperties.length)}{" "}
              of {filteredProperties.length} properties
            </p>
            <div className='flex items-center gap-1'>
              <button
                type='button'
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className='rounded-md border border-slate-200 px-2 py-1 font-bold disabled:opacity-40 hover:bg-slate-50'>
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (n) =>
                    n === 1 || n === totalPages || Math.abs(n - safePage) <= 1,
                )
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "..." ? (
                    <span key={`ellipsis-${i}`} className='px-1 text-slate-400'>
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type='button'
                      onClick={() => setCurrentPage(item)}
                      className='min-w-[28px] rounded-md border px-2 py-1 text-xs font-semibold'
                      style={
                        safePage === item
                          ? {
                              backgroundColor: "#0f172a",
                              color: "#fff",
                              borderColor: "#0f172a",
                            }
                          : { borderColor: "#e2e8f0", color: "#475569" }
                      }>
                      {item}
                    </button>
                  ),
                )}
              <button
                type='button'
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
                className='rounded-md border border-slate-200 px-2 py-1 font-bold disabled:opacity-40 hover:bg-slate-50'>
                ›
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

// export default function PropertiesPage() {
//   const { data: session, status } = useSession();
//   const router = useRouter();
//   const [properties, setProperties] = React.useState([]);
//   const [error, setError] = React.useState("");

//   const headerStats = React.useMemo(() => {
//     const propertyCount = properties.length;
//     const unitCount = properties.reduce(
//       (sum, property) => sum + Number(property.unitCount || 0),
//       0,
//     );
//     const tenantCount = properties.reduce(
//       (sum, property) => sum + Number(property.tenantCount || 0),
//       0,
//     );

//     return { propertyCount, unitCount, tenantCount };
//   }, [properties]);

//   //logic for checking if logged in and redirecting to login if not
//   React.useEffect(() => {
//     if (status === "unauthenticated") {
//       router.replace(APP_ROUTES.login);
//       return;
//     }

//     async function loadProperties() {
//       try {
//         setError("");
//         const response = await fetch("/api/v1/Properties", {
//           cache: "no-store",
//         });
//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             data?.detail || data?.error || "Failed to load properties",
//           );
//         }

//         setProperties(Array.isArray(data) ? data : []);
//       } catch (loadError) {
//         setProperties([]);
//         setError(loadError.message || "Failed to load properties");
//       }
//     }

//     loadProperties();
//   }, [status, router]);

//   return (
//     <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
//       <section
//         className='relative mb-8 overflow-hidden rounded-3xl border p-6 sm:p-8'
//         style={{
//           borderColor: "var(--border)",
//           background:
//             "linear-gradient(135deg, color-mix(in oklab, var(--primary) 17%, transparent), color-mix(in oklab, var(--accent) 15%, transparent), color-mix(in oklab, var(--surface) 82%, transparent))",
//         }}>
//         <div
//           className='pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl'
//           style={{
//             background: "color-mix(in oklab, var(--primary) 40%, transparent)",
//           }}
//         />
//         <div
//           className='pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full blur-2xl'
//           style={{
//             background: "color-mix(in oklab, var(--accent) 36%, transparent)",
//           }}
//         />

//         <div className='relative grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end'>
//           <div>
//             <h1 className='mt-2 text-3xl font-black sm:text-4xl'>Properties</h1>
//             <p className='mt-2 max-w-2xl app-text-muted'>
//               Browse all buildings in your portfolio, view key stats at a
//               glance, and click into each property for more details on units and
//               tenants.
//             </p>
//           </div>

//           <div className='flex flex-wrap gap-2 lg:justify-end'>
//             <div
//               className='rounded-2xl border px-4 py-3 text-sm font-semibold'
//               style={{
//                 borderColor: "var(--border)",
//                 backgroundColor: "var(--surface)",
//               }}>
//               <p className='text-xs uppercase app-text-muted'>Properties</p>
//               <p className='text-xl font-black'>{headerStats.propertyCount}</p>
//             </div>
//             <div
//               className='rounded-2xl border px-4 py-3 text-sm font-semibold'
//               style={{
//                 borderColor: "var(--border)",
//                 backgroundColor: "var(--surface)",
//               }}>
//               <p className='text-xs uppercase app-text-muted'>Listed Units</p>
//               <p className='text-xl font-black'>{headerStats.unitCount}</p>
//             </div>
//             <div
//               className='rounded-2xl border px-4 py-3 text-sm font-semibold'
//               style={{
//                 borderColor: "var(--border)",
//                 backgroundColor: "var(--surface)",
//               }}>
//               <p className='text-xs uppercase app-text-muted'>Active Tenants</p>
//               <p className='text-xl font-black'>{headerStats.tenantCount}</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {error ? (
//         <div
//           className='mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold'
//           style={{
//             borderColor: "var(--danger, #dc2626)",
//             color: "var(--danger, #dc2626)",
//             backgroundColor:
//               "color-mix(in oklab, var(--danger, #dc2626) 10%, white)",
//           }}>
//           {error}
//         </div>
//       ) : null}

//       {properties.length === 0 ? (
//         <div
//           className='rounded-2xl border border-dashed p-10 text-center'
//           style={{
//             borderColor: "var(--border)",
//             backgroundColor: "var(--surface)",
//           }}>
//           <h2 className='text-xl font-bold'>No properties found</h2>
//           <p className='mt-2 app-text-muted'>
//             Add properties in the database to see them displayed here as cards.
//           </p>
//         </div>
//       ) : (
//         <div className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
//           {properties.map((property) => (
//             <article
//               key={property.id}
//               className='group overflow-hidden rounded-2xl border transition-transform duration-200 hover:-translate-y-1'
//               style={{
//                 borderColor: "var(--border)",
//                 backgroundColor: "var(--surface)",
//                 boxShadow: "var(--shadow)",
//               }}>
//               <div
//                 className='h-2'
//                 style={{
//                   background:
//                     "linear-gradient(90deg, var(--accent), var(--primary))",
//                 }}
//               />
//               <div className='p-5'>
//                 <h2 className='text-xl font-black leading-tight'>
//                   {property.name}
//                 </h2>
//                 <p className='mt-2 text-sm app-text-muted'>
//                   {property.address}, {property.city}, {property.state}
//                 </p>

//                 <div className='mt-5 flex flex-wrap gap-2'>
//                   <span
//                     className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
//                     style={{ borderColor: "var(--border)" }}>
//                     {property.unitCount ?? property.unitCount ?? 0} Total Units
//                   </span>
//                   <span
//                     className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
//                     style={{ borderColor: "var(--border)" }}>
//                     {property.unitCount ?? 0} Listed Units
//                   </span>
//                   <span
//                     className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
//                     style={{ borderColor: "var(--border)" }}>
//                     {property.tenantCount ?? 0} Active Tenants
//                   </span>
//                 </div>

//                 <Link
//                   href={`/Properties/${property.id}`}
//                   className='mt-5 inline-flex rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110'
//                   style={{
//                     background:
//                       "linear-gradient(90deg, var(--accent), var(--primary))",
//                   }}>
//                   View Property
//                 </Link>
//               </div>
//             </article>
//           ))}
//         </div>
//       )}
//     </main>
//   );
// }
