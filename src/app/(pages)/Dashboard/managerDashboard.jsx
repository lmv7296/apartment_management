"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/config/routes";
import { formatMoney } from "@/utils/formatters/formatMoney";

// ─── Activity level dot colour ────────────────────────────────────────────────
const LEVEL_DOT = {
  high: "#22c55e",
  medium: "#6366f1",
  low: "#94a3b8",
};
const ACTIVITY_LABEL = {
  high: "Rent Payment Received",
  medium: "Tenant Communication",
  low: "Lease Renewed",
};

const EMPTY_METRICS = {
  totalProperties: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  rentCollectedMonth: 0,
  overduePayments: 0,
};

function numberFromText(text) {
  const value = String(text || "").match(/\d+/);
  return value ? Number(value[0]) : 0;
}

function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currency, setCurrency] = React.useState("USD");
  const [assetFilter, setAssetFilter] = React.useState("all");
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [data, setData] = React.useState({
    metrics: EMPTY_METRICS,
    alerts: [],
    activity: [],
    portfolio: [],
  });

  React.useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      setIsLoadingData(true);
      setLoadError("");

      try {
        const response = await fetch("/api/v1/dashboard", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load dashboard data.");
        }

        const payload = await response.json();

        if (!cancelled) {
          setData({
            metrics: payload.metrics || EMPTY_METRICS,
            alerts: Array.isArray(payload.alerts) ? payload.alerts : [],
            activity: Array.isArray(payload.activity) ? payload.activity : [],
            portfolio: Array.isArray(payload.portfolio)
              ? payload.portfolio
              : [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || "Could not load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  React.useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function loadUserCurrency() {
      try {
        const response = await fetch("/api/v1/user-settings", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();

        if (!cancelled && payload?.currency) {
          setCurrency(payload.currency);
        }
      } catch {
        // Keep default currency when settings are unavailable.
      }
    }

    loadUserCurrency();

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const role = String(session?.user?.role || "tenant").toLowerCase();
  if (role !== "manager") {
    return null;
  }

  const firstName = String(session?.user?.name || "Manager").split(" ")[0];
  const greeting = useGreeting();
  const occupancyRate = Math.round(
    (data.metrics.occupiedUnits /
      Math.max(1, data.metrics.occupiedUnits + data.metrics.vacantUnits)) *
      100,
  );
  const maintenanceAlert = data.alerts.find((a) => a.id === "maintenance-open");
  const maintenanceCount = numberFromText(maintenanceAlert?.detail);
  const overdueAlert = data.alerts.find((a) => a.id === "overdue-rent");
  const urgentItems = [
    ...(maintenanceCount > 0
      ? [
          {
            id: "maint",
            category: "MAINTENANCE",
            description: "Open maintenance requests require assignment.",
            detail: maintenanceAlert?.detail || "",
          },
        ]
      : []),
    ...(data.metrics.overduePayments > 0
      ? [
          {
            id: "overdue",
            category: "PAYMENT OVERDUE",
            description:
              overdueAlert?.detail ||
              `${data.metrics.overduePayments} overdue payment(s) outstanding.`,
            detail: "",
          },
        ]
      : []),
  ].slice(0, 3);

  function isConstructionProperty(property) {
    const statusHints = [
      property?.status,
      property?.constructionStatus,
      property?.phase,
      property?.buildingStatus,
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    const textHints = [property?.name, property?.address]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    const hasConstructionStatus =
      statusHints.includes("construction") ||
      statusHints.includes("under_construction");
    const hasConstructionText = textHints.includes("construction");
    const hasConstructionUnit = Array.isArray(property?.units)
      ? property.units.some((unit) =>
          String(unit?.leaseStatus || "")
            .toLowerCase()
            .includes("construction"),
        )
      : false;

    return hasConstructionStatus || hasConstructionText || hasConstructionUnit;
  }

  const visibleProperties =
    assetFilter === "construction"
      ? data.portfolio.filter(isConstructionProperty)
      : data.portfolio;
  const featuredProperties = visibleProperties.slice(0, 2);
  // const CARD_THEMES = [
  //   {
  //     bg: "linear-gradient(135deg, #a8c5e2 0%, #4a86cc 100%)",
  //     badgeBg: "#fff",
  //     badgeColor: "#1e293b",
  //   },
  //   {
  //     bg: "linear-gradient(135deg, #78716c 0%, #1c1917 100%)",
  //     badge: "MIXED USE",
  //     badgeBg: "#1e293b",
  //     badgeColor: "#fff",
  //   },
  // ];

  return (
    <div
      className='flex flex-1 flex-col overflow-hidden'
      style={{
        backgroundColor: "#eef2f7",
        color: "#0f172a",
        fontFamily: "inherit",
      }}>
      {/* Scrollable content */}
      <main className='flex-1 overflow-y-auto px-6 py-6'>
        {loadError ? (
          <div
            className='mb-6 rounded-xl border px-4 py-3 text-sm font-semibold'
            style={{
              borderColor: "#fecaca",
              color: "#991b1b",
              backgroundColor: "#fee2e2",
            }}>
            {loadError}
          </div>
        ) : null}

        {/* Greeting */}
        <section className='mb-6'>
          <h1 className='text-3xl font-black tracking-tight text-slate-900'>
            {greeting}, {firstName}
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Here is the pulse of your architectural portfolio today.
          </p>
        </section>

        {/* KPI row */}
        <section className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
          {/* Occupancy */}
          <article
            className='relative overflow-hidden rounded-2xl border bg-white p-5'
            style={{
              borderColor: "#dde5f0",
              boxShadow: "0 4px 0 0 #1d4ed8",
            }}>
            <div className='flex items-start justify-between'>
              <p className='text-[11px] font-black uppercase tracking-[0.16em] text-slate-400'>
                Portfolio Occupancy
              </p>
              <span className='text-slate-400'>
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path d='M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z' />
                </svg>
              </span>
            </div>
            <p className='mt-4 text-[2.4rem] font-black leading-none text-slate-900'>
              {occupancyRate}%
            </p>
            <p className='mt-1.5 text-sm font-semibold text-slate-500'>
              +2.1% from last mo.
            </p>
            <div className='mt-5 h-1.5 rounded-full bg-slate-100'>
              <div
                className='h-1.5 rounded-full'
                style={{
                  width: `${occupancyRate}%`,
                  background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
                }}
              />
            </div>
          </article>

          {/* Monthly Revenue */}
          <article
            className='relative overflow-hidden rounded-2xl border bg-white p-5'
            style={{
              borderColor: "#dde5f0",
              boxShadow: "0 4px 0 0 #1d4ed8",
            }}>
            <div className='flex items-start justify-between'>
              <p className='text-[11px] font-black uppercase tracking-[0.16em] text-slate-400'>
                Monthly Revenue
              </p>
              <span className='text-slate-400'>
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'
                    clipRule='evenodd'
                  />
                </svg>
              </span>
            </div>
            <p className='mt-4 text-[2.4rem] font-black leading-none text-slate-900'>
              {formatMoney(data.metrics.rentCollectedMonth, currency)}
            </p>
            <span className='mt-2 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-600'>
              HEALTHY
            </span>
            <p className='mt-3 text-sm text-slate-500'>
              Next payout scheduled for Oct 1st
            </p>
          </article>

          {/* Maintenance */}
          <article
            className='relative overflow-hidden rounded-2xl border bg-white p-5'
            style={{
              borderColor: "#fecaca",
              boxShadow: "0 4px 0 0 #dc2626",
            }}>
            <div className='flex items-start justify-between'>
              <p className='text-[11px] font-black uppercase tracking-[0.16em] text-slate-400'>
                Maintenance
              </p>
              <svg
                className='h-5 w-5 text-red-400'
                viewBox='0 0 20 20'
                fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <p className='mt-4 text-[2.4rem] font-black leading-none text-slate-900'>
              {maintenanceCount}
            </p>
            <p className='mt-1.5 text-sm font-bold text-red-500'>
              {maintenanceCount > 0
                ? `${Math.min(maintenanceCount, 3)} High Priority`
                : "All clear"}
            </p>
            <p className='mt-3 text-sm text-slate-500'>
              Average resolution time: 4.2h
            </p>
          </article>
        </section>

        {/* Asset Overview + Right column */}
        <section className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]'>
          {/* Left – asset cards + strategy block */}
          <div className='space-y-5'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-black text-slate-900'>
                Asset Overview
              </h2>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setAssetFilter("all")}
                  className='rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors'
                  style={
                    assetFilter === "all"
                      ? {
                          borderColor: "#0f172a",
                          color: "#0f172a",
                          backgroundColor: "#e2e8f0",
                        }
                      : {
                          borderColor: "#dde5f0",
                          color: "#475569",
                          backgroundColor: "#f8fafc",
                        }
                  }>
                  All Properties
                </button>
                <button
                  type='button'
                  onClick={() => setAssetFilter("construction")}
                  className='rounded-lg px-3 py-1.5 text-xs font-bold transition-colors'
                  style={
                    assetFilter === "construction"
                      ? { backgroundColor: "#0f172a", color: "#fff" }
                      : {
                          backgroundColor: "#cbd5e1",
                          color: "#334155",
                        }
                  }>
                  In Construction
                </button>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {featuredProperties.length > 0
                ? featuredProperties.map((property, index) => {
                    // const theme = CARD_THEMES[index % CARD_THEMES.length];
                    const unitCount = Array.isArray(property.units)
                      ? property.units.length
                      : 0;
                    const vacantCount = Array.isArray(property.units)
                      ? property.units.filter((u) => !u.occupied).length
                      : 0;
                    const yieldEstimate =
                      data.metrics.rentCollectedMonth /
                      Math.max(1, visibleProperties.length);

                    return (
                      <Link
                        key={property.id}
                        href={`/Properties/${property.id}`}
                        className='overflow-hidden rounded-2xl border bg-white transition hover:shadow-lg'
                        style={{ borderColor: "#dde5f0" }}>
                        <div className='p-4'>
                          <p className='text-base font-black text-slate-900'>
                            {property.name}
                          </p>
                          <p className='mt-0.5 text-xs text-slate-500'>
                            {unitCount} units • {property.city},{" "}
                            {property.state}
                          </p>
                          <div className='mt-4 flex items-end justify-between'>
                            <div>
                              <p className='text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400'>
                                Rent Yield
                              </p>
                              <p className='text-xl font-black text-slate-900'>
                                {formatMoney(yieldEstimate, currency)}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400'>
                                Status
                              </p>
                              <p
                                className='text-sm font-bold'
                                style={{
                                  color:
                                    vacantCount > 0 ? "#ef4444" : "#16a34a",
                                }}>
                                {vacantCount > 0
                                  ? `● ${vacantCount} Vacant`
                                  : "● Full"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                : null}

              {featuredProperties.length === 0 && !isLoadingData ? (
                <div
                  className='col-span-2 rounded-2xl border border-dashed bg-white p-10 text-center'
                  style={{ borderColor: "#dde5f0" }}>
                  <p className='font-semibold text-slate-500'>
                    {assetFilter === "construction"
                      ? "No properties are marked as in construction."
                      : "No properties yet. Add one to get started."}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Strategy banner */}
            <article
              className='relative overflow-hidden rounded-2xl p-8 text-white'
              style={{
                background:
                  "linear-gradient(120deg, #0a1628 0%, #0f2250 50%, #0d1e42 100%)",
                minHeight: "160px",
              }}>
              <div
                className='pointer-events-none absolute inset-0 opacity-30'
                style={{
                  background:
                    "radial-gradient(ellipse at 80% 130%, #1d4ed8 0%, transparent 55%)",
                }}
              />
              <div className='relative'>
                <h3 className='text-2xl font-black'>Portfolio Strategy: Q4</h3>
                <p className='mt-3 max-w-xl text-sm leading-relaxed text-blue-100'>
                  Consider refinancing the Seattle assets while interest rates
                  are dipping. We&apos;ve detected a 12% rise in demand for
                  sustainable luxury in that zip code.
                </p>
                <button
                  type='button'
                  className='mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-black text-slate-900 transition hover:bg-slate-100'>
                  View Deep Insights
                </button>
              </div>
            </article>
          </div>

          {/* Right column – urgent + activity */}
          <div className='space-y-5'>
            {/* Urgent Action Items */}
            <article
              className='rounded-2xl border p-4'
              style={{ borderColor: "#fecaca", backgroundColor: "#fff8f8" }}>
              <div className='mb-3 flex items-center gap-2'>
                <svg
                  className='h-4 w-4 text-red-500'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                <h3 className='text-sm font-black text-red-700'>
                  Urgent Action Items
                </h3>
              </div>

              <div className='space-y-3'>
                {urgentItems.length > 0 ? (
                  urgentItems.map((item) => (
                    <div
                      key={item.id}
                      className='rounded-xl border bg-white p-3'
                      style={{ borderColor: "#f5c6cb" }}>
                      <p className='text-[10px] font-black uppercase tracking-[0.14em] text-slate-400'>
                        {item.category}
                      </p>
                      <p className='mt-1 text-sm font-semibold text-slate-800'>
                        {item.description}
                      </p>
                      <div className='mt-3 flex gap-2'>
                        <Link
                          href='/Maintenance'
                          className='rounded-md px-3 py-1.5 text-[11px] font-black text-white'
                          style={{ backgroundColor: "#dc2626" }}>
                          Dispatch
                        </Link>
                        <Link
                          href='/Payments/notify'
                          className='rounded-md border px-3 py-1.5 text-[11px] font-black text-slate-700'
                          style={{
                            borderColor: "#dde5f0",
                            backgroundColor: "#f8fafc",
                          }}>
                          Call Tenant
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className='rounded-xl border bg-white p-3 text-sm text-slate-500'
                    style={{ borderColor: "#f5c6cb" }}>
                    No urgent items right now.
                  </div>
                )}
              </div>
            </article>

            {/* Recent Activity */}
            <article>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='text-lg font-black text-slate-900'>
                  Recent Activity
                </h3>
                <Link
                  href='/Maintenance/history'
                  className='text-xs font-bold text-blue-500 hover:underline'>
                  See All
                </Link>
              </div>

              <div className='space-y-3'>
                {data.activity.slice(0, 4).map((entry) => {
                  const dotColor = LEVEL_DOT[entry.level] || LEVEL_DOT.low;
                  const defaultLabel =
                    ACTIVITY_LABEL[entry.level] || "Activity";
                  return (
                    <div
                      key={entry.id}
                      className='rounded-xl border bg-white p-3'
                      style={{ borderColor: "#dde5f0" }}>
                      <div className='flex items-start gap-3'>
                        <span
                          className='mt-1 h-2.5 w-2.5 shrink-0 rounded-full'
                          style={{ backgroundColor: dotColor }}
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='text-[10px] font-semibold text-slate-400'>
                            {entry.time || "Just now"}
                          </p>
                          <p className='mt-0.5 text-sm font-bold text-slate-900 truncate'>
                            {defaultLabel}
                          </p>
                          <p className='mt-0.5 text-xs text-slate-500 line-clamp-2'>
                            {entry.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {data.activity.length === 0 && !isLoadingData ? (
                  <div
                    className='rounded-xl border bg-white p-3 text-sm text-slate-500'
                    style={{ borderColor: "#dde5f0" }}>
                    No activity yet.
                  </div>
                ) : null}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
