"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/providers";
import { APP_ROUTES } from "@/config/routes";
import NewProperty from "./NewPropertie";
import TableWithSearch from "@/app/components/Table-with-search";
import { exportToCSV } from "@/app/components/exportToCSV";
import KpiCard from "@/app/components/KpiCard";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

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
    if (status === "authenticated") {
      loadProperties();
    }

    async function loadProperties() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${BACKEND_URL}/api/v1/properties`, {
          cache: "no-store",
          headers: {
            "x-user-id": session?.user?.id || "",
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || data?.error || "Failed to load properties",
          );
        }
        const sortedProperties = Array.isArray(data) ? data : [];
        setProperties(sortedProperties);
        sessionStorage.setItem("properties", JSON.stringify(sortedProperties));
      } catch (loadError) {
        setProperties([]);
        setError(loadError.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
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
        sessionStorage.setItem("userSettings", JSON.stringify(payload));
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
console.log(properties, "properties")
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
          "x-user-id": session?.user?.id || "",
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

  function handleExportCSV() {
    if (!properties || properties.length === 0) return;

    const exportData = properties.map((p) => {
      const pUnits = Array.isArray(p.units) ? p.units : [];
      const activeLeases = pUnits.filter((u) => Boolean(u?.assigned_tenant || u?.name)).length;
      return {
        "Property Name": p.name,
        "Address": p.address,
        "City": p.city,
        "State": p.state,
        "Total Units": pUnits.length,
        "Active Leases": activeLeases,
        "Date Added": p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
      };
    });

    exportToCSV(exportData, "properties_export.csv");
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
            onClick={handleExportCSV}
            disabled={!properties || properties.length === 0}
            className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer'>
            <svg className='h-4 w-4 text-emerald-600' viewBox='0 0 20 20' fill='currentColor'>
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

 
      <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <KpiCard
          title="Total Properties"
          value={headerStats.propertyCount}
          subtitle="In portfolio"
        />
        <KpiCard
          title="Listed Units"
          value={headerStats.unitCount}
          subtitle="Across all properties"
          accentColor="#10b981"
        />
        <KpiCard
          title="Active Tenants"
          value={headerStats.tenantCount}
          subtitle="Currently leasing"
        />
        <KpiCard
          title="Avg. Units / Property"
          value={
            headerStats.propertyCount > 0
              ? (headerStats.unitCount / headerStats.propertyCount).toFixed(1)
              : "—"
          }
          subtitle="Portfolio average"
        />
      </div>

      {error ? (
        <div className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600'>
          {error}
        </div>
      ) : null}


      <TableWithSearch
        type="properties"
        data={properties}
        loading={loading}
        searchPlaceholder="Search by name, address, city, or state..."
        emptyMessage="Add properties to the database to see them here."
      />

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
