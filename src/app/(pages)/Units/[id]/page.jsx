"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/app/providers";
import { APP_ROUTES } from "@/config/routes";
import { formatMoney } from "@/utils/formatters/formatMoney";
import ExtendLeaseModal from "@/app/components/modals/ExtendLeaseModal";
import AssignTenantModal from "@/app/components/modals/AssignTenantModal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getLeaseTerm(startDate, endDate) {
  if (!startDate || !endDate) return "N/A";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return "N/A";
  }

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    (end.getDate() >= start.getDate() ? 0 : -1);

  return `${Math.max(months, 1)} Months`;
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "NA";
  return parts.map((part) => part[0].toUpperCase()).join("");
}

function labelLeaseStatus(status) {
  const value = String(status || "vacant").toLowerCase();
  if (value === "active") return "Active";
  if (value === "scheduled") return "Scheduled";
  if (value === "expired") return "Expired";
  return "Vacant";
}

function labelMaintenanceStatus(status) {
  const value = String(status || "open").toLowerCase();
  if (value === "in_progress") return "In Progress";
  if (value === "closed") return "Resolved";
  return "Open";
}

function maintenanceTone(status) {
  const value = String(status || "open").toLowerCase();
  if (value === "closed") return "success";
  if (value === "in_progress") return "info";
  return "warning";
}

function normalizeUnit(rawInput) {
  let unitData = rawInput;
  if (Array.isArray(unitData)) {
    unitData = unitData[0];
  } else if (unitData && typeof unitData === "object") {
    if (Array.isArray(unitData.data)) unitData = unitData.data[0];
    else if (Array.isArray(unitData.units)) unitData = unitData.units[0];
    else if (unitData.unit && typeof unitData.unit === "object") unitData = unitData.unit;
  }
  if (!unitData || typeof unitData !== "object") return null;

  const tenantName = unitData.tenantName || unitData.name || unitData.tenant_name || null;
  const tenantEmail = unitData.tenantEmail || unitData.email || unitData.tenant_email || null;
  const tenantPhone = unitData.tenantPhone || unitData.phone || unitData.tenant_phone || null;
  const leaseStartDate = unitData.leaseStartDate || unitData.start_date || null;
  const leaseEndDate = unitData.leaseEndDate || unitData.end_date || null;
  const monthlyRent = unitData.monthlyRent ?? (unitData.monthly_rent != null ? Number(unitData.monthly_rent) : null);
  const squareFeet = unitData.squareFeet ?? unitData.square_feet ?? null;
  const unitCode = unitData.unitCode || unitData.unit_code || "N/A";
  const propertyId = unitData.propertyId || unitData.property_id || null;
  const propertyName = unitData.propertyName || unitData.property_name || "Residence";
  const rawStatus = unitData.leaseStatus || unitData.lease_status || unitData.status;
  const leaseStatus = rawStatus || (tenantName || leaseStartDate ? "active" : "vacant");

  const leaseHistory = Array.isArray(unitData.leaseHistory) && unitData.leaseHistory.length > 0
    ? unitData.leaseHistory.map((item) => ({
        id: item.id,
        startDate: item.startDate || item.start_date,
        endDate: item.endDate || item.end_date,
        tenantName: item.tenantName || item.name || item.tenant_name,
        monthlyRent: item.monthlyRent ?? (item.monthly_rent != null ? Number(item.monthly_rent) : null),
        status: item.status || item.lease_status || "active",
      }))
    : (leaseStartDate || tenantName)
      ? [
          {
            id: unitData.id || "1",
            startDate: leaseStartDate,
            endDate: leaseEndDate,
            tenantName: tenantName || "Tenant",
            monthlyRent: monthlyRent,
            status: leaseStatus,
          },
        ]
      : [];

  return {
    ...unitData,
    id: unitData.id,
    unitCode,
    unit_code: unitCode,
    propertyId,
    property_id: propertyId,
    propertyName,
    property_name: propertyName,
    monthlyRent,
    monthly_rent: monthlyRent,
    squareFeet,
    square_feet: squareFeet,
    bedrooms: unitData.bedrooms ?? unitData.bedroom_count ?? 0,
    bathrooms: unitData.bathrooms ?? unitData.bathroom_count ?? 0,
    tenantName,
    tenantEmail,
    tenantPhone,
    leaseStartDate,
    leaseEndDate,
    leaseStatus,
    leaseHistory,
  };
}

function getUnitFromLocalStorage(unitId) {
  if (typeof window === "undefined" || !window.localStorage) return null;

  const searchId = String(unitId || "").toLowerCase();

  const findInArray = (arr) => {
    if (!Array.isArray(arr)) return null;
    return arr.find((u) => {
      if (!u || typeof u !== "object") return false;
      return (
        String(u.id || "").toLowerCase() === searchId ||
        String(u.unit_code || u.unitCode || u.code || "").toLowerCase() === searchId
      );
    });
  };

  const keysToTry = [
    `unit_${unitId}`,
    "unit",
    "selectedUnit",
    "currentUnit",
    "units",
    "properties",
    "apartments",
  ];

  for (const key of keysToTry) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const found = findInArray(parsed);
        if (found) return found;
      } else if (parsed && typeof parsed === "object") {
        if (
          String(parsed.id || "").toLowerCase() === searchId ||
          String(parsed.unit_code || parsed.unitCode || parsed.code || "").toLowerCase() === searchId
        ) {
          return parsed;
        }

        const subList = parsed.units || parsed.data || parsed.apartments || parsed.properties;
        if (Array.isArray(subList)) {
          const found = findInArray(subList);
          if (found) return found;

          for (const item of subList) {
            const nestedUnits = item?.units || item?.apartments;
            const nestedFound = findInArray(nestedUnits);
            if (nestedFound) {
              return {
                ...nestedFound,
                property_name: nestedFound.property_name || item.name || item.title || item.propertyName,
                property_id: nestedFound.property_id || item.id || item.propertyId,
              };
            }
          }
        }
      }
    } catch (e) {}
  }

  return null;
}

export default function UnitDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const unitId = params?.id;

  const [unit, setUnit] = React.useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [extendLeaseModalOpen, setExtendLeaseModalOpen] = React.useState(false);
  const [assignTenantModalOpen, setAssignTenantModalOpen] = React.useState(false);
  const [isExtendingLease, setIsExtendingLease] = React.useState(false);

  const handleCloseExtendLeaseModal = React.useCallback(() => {
    setExtendLeaseModalOpen(false);
  }, []);

  const handleCloseAssignTenantModal = React.useCallback(() => {
    setAssignTenantModalOpen(false);
  }, []);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
    }
  }, [status, router]);

  React.useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id || !unitId) {
      return;
    }

    let cancelled = false;

    async function loadUnit() {
      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        // Try localStorage initial data if available
        const cachedUnit = getUnitFromLocalStorage(unitId);
        if (cachedUnit && !cancelled) {
          setUnit(normalizeUnit(cachedUnit));
        }

        const unitResponse = await fetch(`${BACKEND_URL}/api/v1/units/${unitId}`, {
          cache: "no-store",
          headers: {
            "x-user-id": session.user.id,
          },
        });

        const maintenanceResponse = await fetch(`${BACKEND_URL}/api/v1/maintenance?unit=${unitId}`, {
          cache: "no-store",
          headers: {
            "x-user-id": session.user.id,
          },
        }).catch(() => null);

        if (unitResponse.ok) {
          const dataUnits = await unitResponse.json();
          if (!cancelled) {
            setUnit(normalizeUnit(dataUnits));
          }
        } else if (!cachedUnit) {
          const dataUnits = await unitResponse.json().catch(() => ({}));
          throw new Error(dataUnits?.detail || dataUnits?.error || "Failed to load unit");
        }

        if (maintenanceResponse && maintenanceResponse.ok) {
          const maintenanceData = await maintenanceResponse.json();
          if (!cancelled) {
            setMaintenanceHistory(
              Array.isArray(maintenanceData?.items) ? maintenanceData.items : [],
            );
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load unit");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUnit();

    return () => {
      cancelled = true;
    };
  }, [unitId, status, session?.user?.id]);

  // Don't render details if params are not available yet
  if (!unitId) {
    return (
      <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div
          className='rounded-2xl border p-8 text-center'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          Loading...
        </div>
      </main>
    );
  }

  const handleExtendLease = async (newEndDate) => {
    try {
      setIsExtendingLease(true);
      setError("");
      const response = await fetch(`${BACKEND_URL}/api/v1/units/${unitId}/extend-lease`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || ""
        },
        body: JSON.stringify({ endDate: newEndDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data && data.error ? String(data.error) : "Failed to extend lease";
        throw new Error(errorMessage);
      }

      // Reload unit data from backend and pass through normalizeUnit
      const unitResponse = await fetch(`${BACKEND_URL}/api/v1/units/${unitId}`, {
        cache: "no-store",
        headers: {
          "x-user-id": session?.user?.id || "",
        },
      });

      if (unitResponse.ok) {
        const updatedUnit = await unitResponse.json();
        setUnit(normalizeUnit(updatedUnit));
      } else {
        setUnit((prev) =>
          prev
            ? normalizeUnit({
                ...prev,
                leaseEndDate: newEndDate,
                end_date: newEndDate,
              })
            : prev,
        );
      }

      setExtendLeaseModalOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to extend lease",
      );
    } finally {
      setIsExtendingLease(false);
    }
  };

  const leaseStatus = labelLeaseStatus(unit?.leaseStatus);
  const leaseTerm = getLeaseTerm(unit?.leaseStartDate, unit?.leaseEndDate);
  const hasTenant = Boolean(unit?.tenantName);
  const leaseHistory = Array.isArray(unit?.leaseHistory)
    ? unit.leaseHistory
    : [];
console.log(unit)
  return (
    <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      {loading ? (
        <div
          className='rounded-2xl border p-8 text-center'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          Loading unit...
        </div>
      ) : null}

      {!loading && error ? (
        <div
          className='rounded-2xl border p-4 text-sm font-semibold'
          style={{
            borderColor: "var(--danger, #dc2626)",
            color: "var(--danger, #dc2626)",
            backgroundColor:
              "color-mix(in oklab, var(--danger, #dc2626) 10%, white)",
          }}>
          {error}
        </div>
      ) : null}

      {!loading && !error && unit ? (
        <>
          <section className='mb-5 rounded-3xl border p-4 sm:p-6 app-surface'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-3 text-xs'>
              <p className='app-text-muted'>
                <Link
                  href='/Properties'
                  className='font-semibold hover:underline'>
                  Properties
                </Link>{" "}
                <span className='mx-2'>›</span>
                <span className='font-semibold'>
                  {unit.unit_code || "Unit"}
                </span>{" "}
                <span className='mx-2'>›</span>
                <span className='font-bold'>{unit.unit_code || "N/A"}</span>
              </p>
              <div className='flex flex-wrap gap-2'>
                <Link
                  href='/Units'
                  className='inline-flex rounded-full border px-4 py-2 text-xs font-semibold'
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}>
                  Back to Units
                </Link>
                {unit.propertyId ? (
                  <Link
                    href={`/Properties/${unit.propertyId}`}
                    className='inline-flex rounded-full border px-4 py-2 text-xs font-semibold'
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}>
                    Open Property
                  </Link>
                ) : null}
              </div>
            </div>

            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <h1 className='text-3xl font-black leading-tight sm:text-5xl'>
                 Apartment {unit.unit_code || "N/A"}
                </h1>
              </div>

              <div className='flex flex-wrap gap-2'>
                {unit.leaseHistory.active ? (
                  <button
                    type='button'
                    onClick={() => setAssignTenantModalOpen(true)}
                    className='rounded-xl px-4 py-2 text-sm font-bold text-white'
                    style={{
                      background: "linear-gradient(90deg, #16a34a, #059669)",
                  }}>
                  Assign Tenant
                </button>) : null}
                <button
                  type='button'
                  onClick={() => setExtendLeaseModalOpen(true)}
                  className='rounded-xl px-4 py-2 text-sm font-bold text-white'
                  style={{
                    background: "linear-gradient(90deg, #0f3b75, #05224e)",
                  }}>
                  Extend Lease
                </button>
              </div>
            </div>
          </section>

          <section className='grid grid-cols-1 gap-5 xl:grid-cols-12'>
            <div className='space-y-5 xl:col-span-8'>
              <article className='overflow-hidden rounded-3xl border app-surface'>
                <div className='relative'>
                  <img
                    src='https://images.unsplash.com/photo-1616594039964-5f6f3f9f4f93?auto=format&fit=crop&w=1400&q=80'
                    alt='Unit interior'
                    className='h-72 w-full object-cover sm:h-[420px]'
                  />
                  <div className='absolute bottom-4 left-4 flex flex-wrap gap-2'>
                    <button
                      type='button'
                      className='rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-slate-900'>
                      View All Photos
                    </button>
                    <button
                      type='button'
                      className='rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-slate-900'>
                      Virtual Tour
                    </button>
                  </div>
                </div>
              </article>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                <article className='rounded-2xl border p-4 app-surface'>
                  <p className='text-[11px] font-bold uppercase tracking-[0.16em] app-text-muted'>
                    Monthly Rent
                  </p>
                  <p className='mt-2 text-3xl font-black'>
                    {unit.monthlyRent != null
                      ? formatMoney(unit.monthlyRent)
                      : "N/A"}
                  </p>
                </article>
                <article className='rounded-2xl border p-4 app-surface'>
                  <p className='text-[11px] font-bold uppercase tracking-[0.16em] app-text-muted'>
                    Configuration
                  </p>
                  <p className='mt-2 text-3xl font-black'>
                    {unit.bedrooms ?? 0} Bed / {unit.bathrooms ?? 0} Bath
                  </p>
                </article>
                <article className='rounded-2xl border p-4 app-surface'>
                  <p className='text-[11px] font-bold uppercase tracking-[0.16em] app-text-muted'>
                    Total Area
                  </p>
                  <p className='mt-2 text-3xl font-black'>
                    {unit.squareFeet
                      ? `${unit.squareFeet.toLocaleString()} sq.ft`
                      : "N/A"}
                  </p>
                </article>
              </div>

              <article className='rounded-3xl border p-5 app-surface'>
                <div className='mb-4 flex items-center justify-between gap-3'>
                  <h2 className='text-2xl font-black'>Maintenance History</h2>
                  <button
                    type='button'
                    className='rounded-full bg-emerald-900 px-4 py-2 text-xs font-bold text-white'>
                    Log Maintenance
                  </button>
                </div>

                <div className='space-y-3'>
                  {maintenanceHistory.length ? (
                    maintenanceHistory.map((item) => {
                      const tone = maintenanceTone(item.status);
                      return (
                        <div
                          key={item.id}
                          className='flex items-center justify-between rounded-2xl border px-4 py-3'
                          style={{
                            borderColor: "var(--border)",
                            backgroundColor: "var(--surface-2)",
                          }}>
                          <div>
                            <p className='font-bold'>
                              {item.title || "Maintenance request"}
                            </p>
                            <p className='text-xs app-text-muted'>
                              {item.detail || "No details"}
                              {item.createdAt
                                ? ` • ${formatDate(item.createdAt)}`
                                : ""}
                            </p>
                          </div>
                          <span
                            className='rounded-full px-3 py-1 text-xs font-bold uppercase'
                            style={{
                              backgroundColor:
                                tone === "success"
                                  ? "color-mix(in oklab, var(--success) 24%, white)"
                                  : tone === "info"
                                    ? "color-mix(in oklab, var(--info) 20%, white)"
                                    : "color-mix(in oklab, var(--warning) 20%, white)",
                              color:
                                tone === "success"
                                  ? "color-mix(in oklab, var(--success) 65%, black)"
                                  : tone === "info"
                                    ? "color-mix(in oklab, var(--info) 65%, black)"
                                    : "color-mix(in oklab, var(--warning) 70%, black)",
                            }}>
                            {labelMaintenanceStatus(item.status)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      className='rounded-2xl border border-dashed px-4 py-6 text-center text-sm app-text-muted'
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--surface-2)",
                      }}>
                      No maintenance records for this unit.
                    </div>
                  )}
                </div>
              </article>
            </div>

            <aside className='space-y-5 xl:col-span-4'>
              <article className='rounded-3xl border p-5 app-surface'>
                <h3 className='text-2xl font-black'>Current Occupancy</h3>

                <div className='mt-4 flex items-center gap-3'>
                  <div
                    className='flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black'
                    style={{
                      backgroundColor: "var(--surface-2)",
                      border: "1px solid var(--border)",
                    }}>
                    {getInitials(unit.tenantName)}
                  </div>
                  <div>
                    <p className='font-black leading-tight'>
                      {unit.tenantName || "No Active Tenant"}
                    </p>
                    <p className='text-xs app-text-muted'>
                      {unit.tenantEmail || "No tenant email"}
                    </p>
                  </div>
                </div>

                <dl className='mt-4 space-y-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <dt className='app-text-muted'>Status</dt>
                    <dd
                      className='rounded-full px-3 py-1 text-xs font-bold uppercase'
                      style={{
                        backgroundColor:
                          leaseStatus === "Active"
                            ? "color-mix(in oklab, var(--success) 22%, white)"
                            : "color-mix(in oklab, var(--warning) 22%, white)",
                      }}>
                      {leaseStatus}
                    </dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt className='app-text-muted'>Lease Term</dt>
                    <dd className='font-semibold'>{leaseTerm}</dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt className='app-text-muted'>Expiry</dt>
                    <dd className='font-semibold'>
                      {formatDate(unit.leaseEndDate)}
                    </dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt className='app-text-muted'>Phone</dt>
                    <dd className='font-semibold'>
                      {unit.tenantPhone || "N/A"}
                    </dd>
                  </div>
                </dl>

                <button
                  type='button'
                  className='mt-5 w-full rounded-xl border px-4 py-2 text-sm font-bold'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}>
                  View Full Profile
                </button>
              </article>

              <article className='rounded-3xl border p-5 app-surface'>
                <h3 className='text-2xl font-black'>Lease History</h3>
                <ol className='mt-4 space-y-3'>
                  {leaseHistory.length ? (
                    leaseHistory.map((lease, index) => {
                      const isCurrent =
                        index === 0 &&
                        String(lease.status || "").toLowerCase() === "active";
                      return (
                        <li
                          key={lease.id}
                          className={`flex gap-3 ${index > 0 ? "opacity-80" : ""}`}>
                          <div
                            className='mt-1 h-3 w-3 rounded-full'
                            style={{
                              backgroundColor: isCurrent
                                ? "#0f172a"
                                : "#94a3b8",
                            }}
                          />
                          <div>
                            <p className='font-bold'>
                              {formatDate(lease.startDate)} -{" "}
                              {lease.endDate
                                ? formatDate(lease.endDate)
                                : "Present"}
                            </p>
                            <p className='text-xs app-text-muted'>
                              {lease.tenantName || "Vacant"} •{" "}
                              {lease.monthlyRent != null
                                ? formatMoney(lease.monthlyRent)
                                : "N/A"}{" "}
                              • {labelLeaseStatus(lease.status)}
                            </p>
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className='text-sm app-text-muted'>
                      No lease history available.
                    </li>
                  )}
                </ol>
              </article>

              <article
                className='rounded-3xl border p-5 text-white'
                style={{
                  borderColor: "#0d3569",
                  background: "linear-gradient(135deg, #0d3a74, #05224b)",
                }}>
                <h3 className='text-lg font-black'>Property Snapshot</h3>
                <p className='mt-2 text-sm text-blue-50/90'>
                  {unit.propertyName || "Property"} • Unit{" "}
                  {unit.unitCode || "N/A"} •{" "}
                  {unit.squareFeet
                    ? `${unit.squareFeet.toLocaleString()} sq.ft`
                    : "Area N/A"}
                </p>
                <p className='mt-1 text-sm text-blue-50/90'>
                  Current lease status: {leaseStatus}. Unit created:{" "}
                  {formatDate(unit.createdAt)}.
                </p>
              </article>
            </aside>
          </section>
        </>
      ) : null}

      {unit && (
        <>
          <ExtendLeaseModal
            isSubmitting={isExtendingLease}
            isOpen={extendLeaseModalOpen}
            onClose={handleCloseExtendLeaseModal}
            currentEndDate={
              unit?.leaseEndDate
                ? new Date(unit.leaseEndDate).toISOString().split("T")[0]
                : ""
            }
            onSubmit={handleExtendLease}
          />
          <AssignTenantModal
            isOpen={assignTenantModalOpen}
            onClose={handleCloseAssignTenantModal}
            unitId={unitId}
            unitCode={unit.unitCode}
            session={session}
            onSuccess={() => {
              // Refresh unit data after successful tenant assignment
              if (session?.user?.id && unitId) {
                fetch(`${BACKEND_URL}/api/v1/units/${unitId}`, {
                  cache: "no-store",
                  headers: {
                    "x-user-id": session.user.id,
                  },
                })
                  .then((res) => res.json())
                  .then((data) => setUnit(normalizeUnit(data)))
                  .catch(console.error);
              }
            }}
          />
        </>
      )}
    </main>
  );
}
