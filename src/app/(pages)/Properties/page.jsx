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

  //logic for checking if logged in and redirecting to login if not
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
      return;
    }

    async function loadProperties() {
      try {
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
      }
    }

    loadProperties();
  }, [status, router]);

  return (
    <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <section
        className='relative mb-8 overflow-hidden rounded-3xl border p-6 sm:p-8'
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--primary) 17%, transparent), color-mix(in oklab, var(--accent) 15%, transparent), color-mix(in oklab, var(--surface) 82%, transparent))",
        }}>
        <div
          className='pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl'
          style={{
            background: "color-mix(in oklab, var(--primary) 40%, transparent)",
          }}
        />
        <div
          className='pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full blur-2xl'
          style={{
            background: "color-mix(in oklab, var(--accent) 36%, transparent)",
          }}
        />

        <div className='relative grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end'>
          <div>
            <h1 className='mt-2 text-3xl font-black sm:text-4xl'>Properties</h1>
            <p className='mt-2 max-w-2xl app-text-muted'>
              Browse all buildings in your portfolio, view key stats at a
              glance, and click into each property for more details on units and
              tenants.
            </p>
          </div>

          <div className='flex flex-wrap gap-2 lg:justify-end'>
            <div
              className='rounded-2xl border px-4 py-3 text-sm font-semibold'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
              }}>
              <p className='text-xs uppercase app-text-muted'>Properties</p>
              <p className='text-xl font-black'>{headerStats.propertyCount}</p>
            </div>
            <div
              className='rounded-2xl border px-4 py-3 text-sm font-semibold'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
              }}>
              <p className='text-xs uppercase app-text-muted'>Listed Units</p>
              <p className='text-xl font-black'>{headerStats.unitCount}</p>
            </div>
            <div
              className='rounded-2xl border px-4 py-3 text-sm font-semibold'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
              }}>
              <p className='text-xs uppercase app-text-muted'>Active Tenants</p>
              <p className='text-xl font-black'>{headerStats.tenantCount}</p>
            </div>
          </div>
        </div>
      </section>

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

      {properties.length === 0 ? (
        <div
          className='rounded-2xl border border-dashed p-10 text-center'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          <h2 className='text-xl font-bold'>No properties found</h2>
          <p className='mt-2 app-text-muted'>
            Add properties in the database to see them displayed here as cards.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {properties.map((property) => (
            <article
              key={property.id}
              className='group overflow-hidden rounded-2xl border transition-transform duration-200 hover:-translate-y-1'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
                boxShadow: "var(--shadow)",
              }}>
              <div
                className='h-2'
                style={{
                  background:
                    "linear-gradient(90deg, var(--accent), var(--primary))",
                }}
              />
              <div className='p-5'>
                <h2 className='text-xl font-black leading-tight'>
                  {property.name}
                </h2>
                <p className='mt-2 text-sm app-text-muted'>
                  {property.address}, {property.city}, {property.state}
                </p>

                <div className='mt-5 flex flex-wrap gap-2'>
                  <span
                    className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                    style={{ borderColor: "var(--border)" }}>
                    {property.unitCount ?? property.unitCount ?? 0} Total Units
                  </span>
                  <span
                    className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                    style={{ borderColor: "var(--border)" }}>
                    {property.unitCount ?? 0} Listed Units
                  </span>
                  <span
                    className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                    style={{ borderColor: "var(--border)" }}>
                    {property.tenantCount ?? 0} Active Tenants
                  </span>
                </div>

                <Link
                  href={`/Properties/${property.id}`}
                  className='mt-5 inline-flex rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110'
                  style={{
                    background:
                      "linear-gradient(90deg, var(--accent), var(--primary))",
                  }}>
                  View Property
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
