"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/providers";
import { APP_ROUTES } from "@/config/routes";
import NewProperty from "./NewPropertie";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function PropertiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = React.useState(false);
  const [isCreatingProperty, setIsCreatingProperty] = React.useState(false);
  const [createError, setCreateError] = React.useState("");
  const [preferredUnitPrefix, setPreferredUnitPrefix] = React.useState("Unit");
  const [preferredUnitCount, setPreferredUnitCount] = React.useState(0);

  const ITEMS_PER_PAGE = 10;


  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
      return;
    }

    async function loadProperties() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${BACKEND_URL}/api/v1/properties`, {
          cache: "no-store",
          headers: {
            "x-user-id": session?.user?.id || ""
          }
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

    if (status === "authenticated" && session?.user?.id) {
      loadProperties();
    }
  }, [status, router, session?.user?.id]);

  React.useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function loadUserSettings() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/user-settings`, {
          cache: "no-store",
          headers: {
            "x-user-id": session?.user?.id || "",
          },
        });
        if (!response.ok) return;

        const payload = await response.json();
        if (!cancelled) {
          setPreferredUnitPrefix(String(payload?.unitPrefix ?? "Unit"));
          setPreferredUnitCount(Number(payload?.unitCount ?? 0) || 0);
        }
      } catch {
        if (!cancelled) {
          setPreferredUnitPrefix("Unit");
          setPreferredUnitCount(0);
        }
      }
    }

    loadUserSettings();

    return () => {
      cancelled = true;
    };
  }, [status]);

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

  const headerStats = React.useMemo(() => {
    const propertyCount = properties.length;
    const unitCount = properties.reduce((sum, property) => {
      const units = Array.isArray(property.units) ? property.units : [];
      return sum + units.length;
    }, 0);
    const tenantCount = properties.reduce((sum, property) => {
      const units = Array.isArray(property.units) ? property.units : [];
      return (
        sum + units.filter((unit) => Boolean(unit?.assigned_tenant)).length
      );
    }, 0);
    return { propertyCount, unitCount, tenantCount };
  }, [properties]);
  async function handleCreateProperty(payload) {
    try {
      setIsCreatingProperty(true);
      setCreateError("");

      const response = await fetch(`${BACKEND_URL}/api/v1/properties`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || ""
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || data?.error || "Failed to add property",
        );
      }

      setProperties((current) =>
        [...current, data].sort((a, b) =>
          String(a?.name || "").localeCompare(String(b?.name || "")),
        ),
      );
      setIsAddPropertyOpen(false);
    } catch (createPropertyError) {
      setCreateError(createPropertyError.message || "Failed to add property");
    } finally {
      setIsCreatingProperty(false);
    }
  }

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
          <button
            type='button'
            onClick={() => {
              setCreateError("");
              setIsAddPropertyOpen(true);
            }}
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
          </button>
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
                {paginatedProps.map((property) => {
                  const propertyUnits = Array.isArray(property.units)
                    ? property.units
                    : [];
                  const unitCount = propertyUnits.length;
                  const tenantCount = propertyUnits.filter((unit) =>
                    Boolean(unit?.assigned_tenant),
                  ).length;

                  return (
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
                        {unitCount}
                      </p>
                      <p className='text-xs text-slate-400'>total units</p>
                    </td>

                    {/* Tenants */}
                    <td className='px-4 py-4'>
                      <p className='font-semibold text-slate-900'>
                        {tenantCount}
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
                  );
                })}
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

      <NewProperty
        isOpen={isAddPropertyOpen}
        onClose={() => {
          if (!isCreatingProperty) {
            setCreateError("");
            setIsAddPropertyOpen(false);
          }
        }}
        onSubmit={handleCreateProperty}
        isSubmitting={isCreatingProperty}
        error={createError}
        defaultUnitPrefix={preferredUnitPrefix}
        defaultUnitCount={preferredUnitCount}
      />
    </main>
  );
}
