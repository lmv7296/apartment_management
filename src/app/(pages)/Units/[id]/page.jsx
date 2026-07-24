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

export default function UnitDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const unitId = params?.id;

  // Don't render anything if params are not available yet
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
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    async function loadUnit() {
      try {
        setLoading(true);
        setError("");

        if (!unitId) {
          throw new Error("Unit id is required");
        }

        const [unitResponse, maintenanceResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/api/v1/units/${unitId}`, {
            cache: "no-store",
            headers: {
              "x-user-id": session?.user?.id || ""
            }
          }),
          fetch(`${BACKEND_URL}/api/v1/maintenance?unit=${unitId}`, {
            cache: "no-store",
            headers: {
              "x-user-id": session?.user?.id || ""
            }
          }),
        ]);

        const data = await unitResponse.json();

        if (!unitResponse.ok) {
          throw new Error(data?.detail || data?.error || "Failed to load unit");
        }

        setUnit(data);

        if (maintenanceResponse.ok) {
          const maintenanceData = await maintenanceResponse.json();
          setMaintenanceHistory(
            Array.isArray(maintenanceData?.items) ? maintenanceData.items : [],
          );
        } else {
          setMaintenanceHistory([]);
        }
      } catch (loadError) {
        setUnit(null);
        setMaintenanceHistory([]);
        setError(loadError.message || "Failed to load unit");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated" && session?.user?.id) {
      loadUnit();
    }
  }, [unitId, router, status, session?.user?.id]);

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

      // Reload the unit data
      const unitResponse = await fetch(`${BACKEND_URL}/api/v1/units/${unitId}`, {
        cache: "no-store",
        headers: {
          "x-user-id": session?.user?.id || ""
        }
      });
      if (unitResponse.ok) {
        const updatedUnit = await unitResponse.json();
        setUnit(updatedUnit);
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
                  {unit.propertyName || "Property"}
                </span>{" "}
                <span className='mx-2'>›</span>
                <span className='font-bold'>{unit.unitCode || "N/A"}</span>
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
                  {unit.unitCode || "N/A"} - {unit.propertyName || "Residence"}
                </h1>
                <p className='mt-2 text-sm sm:text-base app-text-muted'>
                  {unit.propertyAddress || "Address unavailable"}
                  {unit.propertyCity ? `, ${unit.propertyCity}` : ""}
                  {unit.propertyState ? `, ${unit.propertyState}` : ""}
                </p>
              </div>

              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={() => setAssignTenantModalOpen(true)}
                  className='rounded-xl px-4 py-2 text-sm font-bold text-white'
                  style={{
                    background: "linear-gradient(90deg, #16a34a, #059669)",
                  }}>
                  Assign Tenant
                </button>
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
                  .then((data) => setUnit(data))
                  .catch(console.error);
              }
            }}
          />
        </>
      )}
    </main>
  );
}
