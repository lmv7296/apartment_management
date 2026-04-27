"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { APP_ROUTES } from "@/config/routes";

const FILTER_OPTIONS = [
  { value: "unit_info", label: "Unit Info" },
  { value: "tenant_details", label: "Tenant Details" },
  { value: "space_lease", label: "Space & Lease" },
  { value: "status", label: "Status" },
];

function matchesFilter(apartment, filterBy, search) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  switch (filterBy) {
    case "unit_info":
      return (apartment.unit_code || "").toLowerCase().includes(q);
    case "tenant_details":
      return (
        (apartment.tenant_name || "").toLowerCase().includes(q) ||
        (apartment.tenant_email || "").toLowerCase().includes(q)
      );
    case "space_lease": {
      const beds = String(apartment.bedrooms ?? "");
      const baths = String(apartment.bathrooms ?? "");
      const sqft = String(apartment.square_feet ?? apartment.squareFeet ?? "");
      const rent = String(apartment.monthly_rent ?? "");
      return (
        beds.includes(q) ||
        baths.includes(q) ||
        sqft.includes(q) ||
        rent.includes(q)
      );
    }
    case "status": {
      const isRented =
        typeof apartment.is_rented === "boolean"
          ? apartment.is_rented
          : String(apartment.lease_status || "").toLowerCase() === "active";
      const label = isRented ? "rented" : "vacant";
      return label.includes(q);
    }
    default:
      return true;
  }
}

export default function UnitsPage() {
  const [apartments, setApartments] = React.useState([]);
  const [filterBy, setFilterBy] = React.useState("unit_info");
  const [search, setSearch] = React.useState("");
  const { status } = useSession();
  const router = useRouter();
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
    }
  }, [status, router]);

  // Fetch apartments data from the API when the component mounts
  React.useEffect(() => {
    async function fetchApartments() {
      try {
        setError("");
        const response = await fetch("/api/v1/units");
        if (!response.ok) {
          throw new Error("Failed to fetch units");
        }
        const data = await response.json();
        setApartments(data);
      } catch (fetchError) {
        console.error("Error fetching units:", fetchError);
        setError(fetchError.message || "Failed to fetch units");
      }
    }
    if (status === "authenticated") {
      fetchApartments();
    }
  }, [status]);

  const filtered = React.useMemo(
    () => apartments.filter((a) => matchesFilter(a, filterBy, search)),
    [apartments, filterBy, search],
  );

  //   return (
  //     <>
  //       <ul>
  //         {apartments.map((apartment) => (
  //           <li key={apartment.id}>{apartment.unit_code}</li>
  //         ))}
  //       </ul>
  //     </>
  //   );
  // }
  return (
    <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <section
        className='relative mb-8 overflow-hidden rounded-3xl border p-6 sm:p-8'
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--primary) 15%, transparent), color-mix(in oklab, var(--accent) 14%, transparent), color-mix(in oklab, var(--surface) 84%, transparent))",
        }}>
        <div className='relative'>
          <h1 className='text-3xl font-black sm:text-4xl'>Units</h1>
          <p className='mt-2 max-w-2xl app-text-muted'>
            Browse every apartment unit and jump directly to the details page.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div
          className='flex overflow-hidden rounded-xl border'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type='button'
              onClick={() => {
                setFilterBy(opt.value);
                setSearch("");
              }}
              className='px-4 py-2 text-xs font-bold uppercase tracking-widest transition'
              style={{
                background:
                  filterBy === opt.value
                    ? "linear-gradient(90deg, var(--accent), var(--primary))"
                    : "transparent",
                color:
                  filterBy === opt.value
                    ? "#fff"
                    : "var(--text-muted, var(--text))",
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {filterBy === "status" ? (
          <select
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='flex-1 rounded-xl border px-4 py-2 text-sm'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
            }}>
            <option value=''>All</option>
            <option value='rented'>Rented</option>
            <option value='vacant'>Vacant</option>
          </select>
        ) : (
          <input
            type='search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              filterBy === "unit_info"
                ? "Search by unit name…"
                : filterBy === "tenant_details"
                  ? "Search by tenant name or email…"
                  : filterBy === "space_lease"
                    ? "Search by beds, baths, sqft, or rent…"
                    : "Search…"
            }
            className='flex-1 rounded-xl border px-4 py-2 text-sm'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
            }}
          />
        )}

        {search ? (
          <span className='text-xs app-text-muted whitespace-nowrap'>
            {filtered.length} of {apartments.length} units
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          className='mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold'
          style={{
            borderColor: "var(--danger, #dc2626)",
            color: "var(--danger, #dc2626)",
            backgroundColor:
              "color-mix(in oklab, var(--danger, #dc2626) 10%, white)",
          }}>
          {error}
        </div>
      ) : null}

      {apartments.length === 0 ? (
        <div
          className='rounded-2xl border border-dashed p-10 text-center'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          <h2 className='text-xl font-bold'>No units found</h2>
          <p className='mt-2 app-text-muted'>
            Add units in the database to see them here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className='rounded-2xl border border-dashed p-10 text-center'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          <h2 className='text-xl font-bold'>No matching units</h2>
          <p className='mt-2 app-text-muted'>
            Try a different search term or filter.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {filtered.map((apartment) => {
            const propertyId = apartment.property_id;
            const targetHref = `/Units/${apartment.id}`;
            const leaseStatus = String(
              apartment.lease_status || apartment.leaseStatus || "",
            ).toLowerCase();
            const isRented =
              typeof apartment.is_rented === "boolean"
                ? apartment.is_rented
                : leaseStatus === "active";
            const accentGradient = isRented
              ? "linear-gradient(90deg, var(--accent), var(--primary))"
              : "linear-gradient(90deg, #f97316, #dc2626)";
            const statusLabel = isRented ? "Rented" : "Vacant";

            return (
              <Link
                key={apartment.id}
                href={targetHref}
                className='group block overflow-hidden rounded-2xl border transition-transform duration-200 hover:-translate-y-1'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  boxShadow: "var(--shadow)",
                }}>
                <div
                  className='h-2'
                  style={{
                    background: accentGradient,
                  }}
                />
                <div className='p-5'>
                  <h2 className='text-xl font-black leading-tight'>
                    Unit {apartment.unit_code || apartment.unitCode || "N/A"}
                  </h2>

                  <p
                    className='mt-1 text-xs font-bold uppercase tracking-[0.12em]'
                    style={{
                      color: isRented
                        ? "var(--primary)"
                        : "var(--danger, #dc2626)",
                    }}>
                    {statusLabel}
                  </p>

                  <p className='mt-2 text-sm app-text-muted'>
                    Property ID: {propertyId || "N/A"}
                  </p>

                  <div className='mt-4 flex flex-wrap gap-2'>
                    <span
                      className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                      style={{ borderColor: "var(--border)" }}>
                      {apartment.bedrooms ?? 0} Beds
                    </span>
                    <span
                      className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                      style={{ borderColor: "var(--border)" }}>
                      {apartment.bathrooms ?? 0} Baths
                    </span>
                    <span
                      className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                      style={{ borderColor: "var(--border)" }}>
                      {apartment.square_feet ?? apartment.squareFeet ?? "N/A"}{" "}
                      Sqft
                    </span>
                  </div>

                  <p className='mt-4 text-xs app-text-muted'>
                    Created:{" "}
                    {apartment.created_at
                      ? new Date(apartment.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <span
                    className='mt-4 inline-flex rounded-full px-4 py-2 text-sm font-bold text-white transition group-hover:brightness-110'
                    style={{
                      background: accentGradient,
                    }}>
                    Open Unit
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
