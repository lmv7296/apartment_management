"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { APP_ROUTES } from "@/config/routes";
import userPreferences from "@/config/user-preferences.json";
import AddTenantModal from "@/app/components/modals/AddTenantModal";
import RemoveTenantModal from "@/app/components/modals/RemoveTenantModal";
import AddUnitModal from "@/app/components/modals/AddUnitModal";

export default function PropertyDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();

  const [property, setProperty] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [modalMode, setModalMode] = React.useState("");
  const [activeUnit, setActiveUnit] = React.useState(null);
  const [actionMessage, setActionMessage] = React.useState("");
  const [userCurrency, setUserCurrency] = React.useState(
    userPreferences.defaultSettings.currency,
  );
  const [formData, setFormData] = React.useState({
    add: {
      fullName: "",
      email: "",
      phone: "",
      startDate: "",
      monthlyRent: "",
      currency: userPreferences.defaultSettings.currency,
      notes: "",
    },
    remove: {
      leaveDate: "",
      forwardingAddress: "",
      reason: "",
      depositReturnAmount: "",
      notes: "",
    },
    addUnit: {
      unitCode: "",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      areaUnit: "sqft",
    },
  });

  function openModal(mode, unit) {
    setModalMode(mode);
    setActiveUnit(unit);
    setActionMessage("");
  }

  function closeModal() {
    setModalMode("");
    setActiveUnit(null);
  }

  function onChangeForm(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [modalMode]: {
        ...prev[modalMode],
        [name]: value,
      },
    }));
  }

  async function submitForm(event) {
    event.preventDefault();

    try {
      if (modalMode === "add") {
        const propertyId = String(params?.id || "");
        const response = await fetch(
          `/api/v1/Properties/${propertyId}/add-tenant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              unitId: activeUnit?.id,
              fullName: formData.add.fullName,
              email: formData.add.email,
              phone: formData.add.phone,
              startDate: formData.add.startDate,
              monthlyRent: formData.add.monthlyRent,
              notes: formData.add.notes,
              currency: formData.add.currency,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to add tenant");
        }

        setActionMessage(
          `${data?.createdUser ? "New user created" : "Existing user matched"} and assigned to ${activeUnit?.unitCode || "unit"}.`,
        );
        setFormData((prev) => ({
          ...prev,
          add: {
            fullName: "",
            email: "",
            phone: "",
            startDate: "",
            monthlyRent: "",
            currency: userCurrency,
            notes: "",
          },
        }));
        closeModal();

        // Reload property data
        const propertyResponse = await fetch(
          `/api/v1/Properties/${propertyId}`,
          {
            cache: "no-store",
          },
        );
        const propertyData = await propertyResponse.json();
        setProperty(propertyData);
      } else if (modalMode === "remove") {
        // Remove tenant
        const propertyId = String(params?.id || "");
        const response = await fetch(
          `/api/v1/Properties/${propertyId}/remove-tenant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              unitId: activeUnit?.id,
              leaveDate: formData.remove.leaveDate,
              forwardingAddress: formData.remove.forwardingAddress,
              reason: formData.remove.reason,
              depositReturnAmount: formData.remove.depositReturnAmount,
              notes: formData.remove.notes,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to remove tenant");
        }

        setActionMessage(
          `Tenant successfully removed from ${activeUnit?.unitCode || "unit"}.`,
        );
        setFormData((prev) => ({
          ...prev,
          remove: {
            leaveDate: "",
            forwardingAddress: "",
            reason: "",
            depositReturnAmount: "",
            notes: "",
          },
        }));
        closeModal();
        // Reload property data
        const propertyResponse = await fetch(
          `/api/v1/Properties/${propertyId}`,
          {
            cache: "no-store",
          },
        );
        const propertyData = await propertyResponse.json();
        setProperty(propertyData);
      } else if (modalMode === "addUnit") {
        // Add unit
        const propertyId = String(params?.id || "");
        const parsedArea = formData.addUnit.squareFeet
          ? Number(formData.addUnit.squareFeet)
          : null;
        const normalizedSquareFeet =
          parsedArea == null
            ? null
            : formData.addUnit.areaUnit === "sqm"
              ? Math.round(parsedArea * 10.7639)
              : Math.round(parsedArea);

        const response = await fetch(`/api/v1/Properties/${propertyId}/units`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            unitCode: formData.addUnit.unitCode,
            bedrooms: parseInt(formData.addUnit.bedrooms) || 0,
            bathrooms: parseInt(formData.addUnit.bathrooms) || 1,
            squareFeet: normalizedSquareFeet,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to add unit");
        }

        setActionMessage(
          `Unit ${formData.addUnit.unitCode} successfully created.`,
        );
        setFormData((prev) => ({
          ...prev,
          addUnit: {
            unitCode: "",
            bedrooms: "",
            bathrooms: "",
            squareFeet: "",
            areaUnit: "sqft",
          },
        }));
        closeModal();
        // Reload property data
        const propertyResponse = await fetch(
          `/api/v1/Properties/${propertyId}`,
          {
            cache: "no-store",
          },
        );
        const propertyData = await propertyResponse.json();
        setProperty(propertyData);
      }
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  }

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    async function loadUserSettings() {
      try {
        const response = await fetch("/api/v1/user-settings", {
          cache: "no-store",
        });
        const data = await response.json();

        if (response.ok && data.currency) {
          setUserCurrency(data.currency);
          setFormData((prev) => ({
            ...prev,
            add: {
              ...prev.add,
              currency: data.currency,
            },
          }));
        }
      } catch (err) {
        console.error("Failed to load user settings:", err);
      }
    }

    async function loadProperty() {
      try {
        setLoading(true);
        setError("");

        const propertyId = String(params?.id || "");
        const response = await fetch(`/api/v1/Properties/${propertyId}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || data?.error || "Failed to load property",
          );
        }

        setProperty(data);
      } catch (loadError) {
        setProperty(null);
        setError(loadError.message || "Failed to load property");
      } finally {
        setLoading(false);
      }
    }

    loadUserSettings();
    loadProperty();
  }, [params, router, status]);

  React.useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setActionMessage("");
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, [actionMessage]);

  // ── View state ─────────────────────────────────────────────────────
  const [unitFilter, setUnitFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [unitFilter, searchQuery]);

  // ── Helpers ────────────────────────────────────────────────────────
  const ITEMS_PER_PAGE = 10;

  function getUnitStatus(unit) {
    if (!unit.tenantName) return "vacant";
    if (unit.leaveDate) return "maintenance";
    return "occupied";
  }

  const AVATAR_COLORS = ["#1d4ed8", "#7c3aed", "#059669", "#b45309", "#dc2626"];
  function getAvatarColor(name) {
    if (!name) return "#94a3b8";
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = (hash << 5) - hash + name.charCodeAt(i);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }
  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  // ── Computed ───────────────────────────────────────────────────────
  const allUnits = property?.units || [];
  const occupiedCount = allUnits.filter(
    (u) => getUnitStatus(u) === "occupied",
  ).length;
  const vacantCount = allUnits.filter(
    (u) => getUnitStatus(u) === "vacant",
  ).length;
  const maintenanceCount = allUnits.filter(
    (u) => getUnitStatus(u) === "maintenance",
  ).length;
  const occupancyPct =
    allUnits.length > 0
      ? ((occupiedCount / allUnits.length) * 100).toFixed(1)
      : "—";

  const filteredUnits = allUnits.filter((unit) => {
    const status = getUnitStatus(unit);
    const matchesFilter = unitFilter === "all" || unitFilter === status;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (unit.unitCode || "").toLowerCase().includes(q) ||
      (unit.tenantName || "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUnits.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUnits = filteredUnits.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <main className='min-h-screen bg-slate-50 px-6 py-6'>
      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading ? (
        <div className='rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500'>
          Loading property…
        </div>
      ) : null}

      {/* ── Error ────────────────────────────────────────────────── */}
      {!loading && error ? (
        <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600'>
          {error}
        </div>
      ) : null}

      {/* ── Main content ─────────────────────────────────────────── */}
      {!loading && !error && property ? (
        <>
          {/* Breadcrumb */}
          <nav className='mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-400'>
            <Link
              href='/Properties'
              className='transition-colors hover:text-slate-700'>
              Portfolio
            </Link>
            <span>/</span>
            <span className='font-semibold text-slate-700'>
              {property.name}
            </span>
          </nav>

          {/* Page header */}
          <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-black text-slate-900'>
                {property.name}
              </h1>
              <p className='mt-1 flex items-center gap-1.5 text-sm text-slate-500'>
                <svg
                  className='h-4 w-4 shrink-0'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                    clipRule='evenodd'
                  />
                </svg>
                {property.address}, {property.city}, {property.state}
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'>
                <svg
                  className='h-4 w-4'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
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
                onClick={() => openModal("addUnit", null)}
                className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white'
                style={{ backgroundColor: "#0f172a" }}>
                <svg
                  className='h-4 w-4'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
                    clipRule='evenodd'
                  />
                </svg>
                Add Unit
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <div className='rounded-xl border border-slate-200 bg-white p-5'>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                Occupancy Rate
              </p>
              <p className='mt-2 text-2xl font-black text-slate-900'>
                {occupancyPct}%
              </p>
              <p className='mt-1 text-[11px] text-slate-400'>
                {occupiedCount} of {allUnits.length} units
              </p>
            </div>

            <div
              className='rounded-xl border border-slate-200 bg-white p-5'
              style={{ borderLeftWidth: 4, borderLeftColor: "#10b981" }}>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                Annual Revenue
              </p>
              <p className='mt-2 text-2xl font-black text-slate-900'>—</p>
              <p className='mt-1 text-[11px] text-slate-400'>No revenue data</p>
            </div>

            <div className='rounded-xl border border-slate-200 bg-white p-5'>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                Total Units
              </p>
              <p className='mt-2 text-2xl font-black text-slate-900'>
                {allUnits.length}
              </p>
              <p className='mt-1 text-[11px] text-slate-400'>
                {vacantCount} vacant
              </p>
            </div>

            <div className='rounded-xl border border-slate-200 bg-white p-5'>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                Avg. Lease Term
              </p>
              <p className='mt-2 text-2xl font-black text-slate-900'>—</p>
              <p className='mt-1 text-[11px] text-slate-400'>No lease data</p>
            </div>
          </div>

          {/* Units panel */}
          <div className='rounded-xl border border-slate-200 bg-white'>
            {/* Search + filter bar */}
            <div className='flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3'>
              <div className='relative min-w-[200px] flex-1'>
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
                  placeholder='Search by unit, tenant or status...'
                  className='w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>
              <div className='flex flex-wrap gap-2'>
                {[
                  { key: "all", label: `All Units (${allUnits.length})` },
                  { key: "occupied", label: `Occupied (${occupiedCount})` },
                  { key: "vacant", label: `Vacant (${vacantCount})` },
                  {
                    key: "maintenance",
                    label: `Maintenance (${maintenanceCount})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type='button'
                    onClick={() => setUnitFilter(tab.key)}
                    className='rounded-full px-4 py-1.5 text-sm font-semibold transition'
                    style={
                      unitFilter === tab.key
                        ? { backgroundColor: "#0f172a", color: "#fff" }
                        : { backgroundColor: "#f1f5f9", color: "#475569" }
                    }>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {paginatedUnits.length === 0 ? (
              <div className='py-12 text-center text-sm text-slate-400'>
                No units match your search or filter.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-slate-100'>
                      {[
                        "Unit Info",
                        "Tenant Details",
                        "Space & Lease",
                        "Status",
                        "Actions",
                      ].map((col) => (
                        <th
                          key={col}
                          className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUnits.map((unit) => {
                      const status = getUnitStatus(unit);
                      const initials = getInitials(unit.tenantName);
                      const avatarColor = getAvatarColor(unit.tenantName);
                      return (
                        <tr
                          key={unit.id}
                          className='border-b border-slate-100 last:border-0 hover:bg-slate-50'>
                          {/* Unit Info */}
                          <td className='px-4 py-4'>
                            <div className='flex items-center gap-3'>
                              <div
                                className='h-12 w-12 shrink-0 rounded-lg'
                                style={{
                                  background:
                                    "linear-gradient(135deg, #2dd4bf, #3b82f6)",
                                }}
                              />
                              <div>
                                <p className='font-bold text-slate-900'>
                                  {unit.unitCode || "Unit"}
                                </p>
                                <p className='text-xs text-slate-400'>
                                  {unit.bedrooms} bed • {unit.bathrooms} bath
                                  {unit.squareFeet
                                    ? ` • ${unit.squareFeet} sqft`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Tenant Details */}
                          <td className='px-4 py-4'>
                            {unit.tenantName ? (
                              <div className='flex items-center gap-2.5'>
                                <div
                                  className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white'
                                  style={{ backgroundColor: avatarColor }}>
                                  {initials}
                                </div>
                                <div>
                                  <p className='font-semibold text-slate-800'>
                                    {unit.tenantName}
                                  </p>
                                  <p className='text-xs text-slate-400'>
                                    Primary Tenant
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className='flex items-center gap-2.5'>
                                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500'>
                                  —
                                </div>
                                <div>
                                  <p className='text-sm font-medium text-slate-400'>
                                    Not Assigned
                                  </p>
                                  <p className='text-xs text-slate-400'>
                                    Ready for Lease
                                  </p>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Space & Lease */}
                          <td className='px-4 py-4'>
                            <p className='font-medium text-slate-700'>
                              {unit.squareFeet
                                ? `${Number(unit.squareFeet).toLocaleString()} sq ft`
                                : "—"}
                            </p>
                            <p className='text-xs text-slate-400'>
                              {unit.leaveDate
                                ? `Ends ${new Date(unit.leaveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                                : status === "occupied"
                                  ? "Active lease"
                                  : "Available Now"}
                            </p>
                          </td>

                          {/* Status */}
                          <td className='px-4 py-4'>
                            {status === "occupied" && (
                              <span className='inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700'>
                                <span className='h-1.5 w-1.5 rounded-full bg-green-500' />
                                OCCUPIED
                              </span>
                            )}
                            {status === "vacant" && (
                              <span className='inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600'>
                                <span className='h-1.5 w-1.5 rounded-full bg-red-500' />
                                VACANT
                              </span>
                            )}
                            {status === "maintenance" && (
                              <span className='inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700'>
                                <span className='h-1.5 w-1.5 rounded-full bg-purple-500' />
                                MAINTENANCE
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className='px-4 py-4'>
                            <div className='flex flex-wrap items-center gap-2'>
                              {unit.tenantName ? (
                                unit.leaveDate ? (
                                  <button
                                    type='button'
                                    disabled
                                    className='cursor-not-allowed rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 opacity-70'>
                                    Leaving
                                  </button>
                                ) : (
                                  <button
                                    type='button'
                                    onClick={() => openModal("remove", unit)}
                                    className='rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100'>
                                    Remove Tenant
                                  </button>
                                )
                              ) : (
                                <button
                                  type='button'
                                  onClick={() => openModal("add", unit)}
                                  className='rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100'>
                                  Add Tenant
                                </button>
                              )}
                              <Link
                                href={`/Units/${unit.id}`}
                                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50'>
                                View Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredUnits.length > 0 ? (
              <div className='flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500'>
                <p>
                  Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(safePage * ITEMS_PER_PAGE, filteredUnits.length)} of{" "}
                  {filteredUnits.length} units
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
                        n === 1 ||
                        n === totalPages ||
                        Math.abs(n - safePage) <= 1,
                    )
                    .reduce((acc, n, i, arr) => {
                      if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "..." ? (
                        <span
                          key={`ellipsis-${i}`}
                          className='px-1 text-slate-400'>
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

          {/* Toast */}
          {actionMessage ? (
            <div
              className='fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg'
              style={
                actionMessage.startsWith("Error:")
                  ? {
                      borderColor: "#fca5a5",
                      color: "#dc2626",
                      backgroundColor: "#fef2f2",
                    }
                  : {
                      borderColor: "#86efac",
                      color: "#16a34a",
                      backgroundColor: "#f0fdf4",
                    }
              }>
              {actionMessage}
            </div>
          ) : null}

          <AddTenantModal
            isOpen={modalMode === "add"}
            onClose={closeModal}
            activeUnit={activeUnit}
            formData={formData.add}
            onChangeForm={onChangeForm}
            onSubmit={submitForm}
            userCurrency={userCurrency}
          />

          <RemoveTenantModal
            isOpen={modalMode === "remove"}
            onClose={closeModal}
            activeUnit={activeUnit}
            formData={formData.remove}
            onChangeForm={onChangeForm}
            onSubmit={submitForm}
          />

          <AddUnitModal
            isOpen={modalMode === "addUnit"}
            onClose={closeModal}
            formData={formData.addUnit}
            onChangeForm={onChangeForm}
            onSubmit={submitForm}
          />
        </>
      ) : null}
    </main>
  );
}
