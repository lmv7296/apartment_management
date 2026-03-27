"use client";

import React from "react";
import { useSession } from "next-auth/react";
import KpiRow from "@/app/components/dashboard/KpiRow";
import AlertsPanel from "@/app/components/dashboard/AlertsPanel";
import RecentActivityFeed from "@/app/components/dashboard/RecentActivityFeed";
import QuickActions from "@/app/components/dashboard/QuickActions";
import BuildingsUnitsPanel from "@/app/components/dashboard/BuildingsUnitsPanel";
import { useRouter } from "next/navigation";
import roleSettings from "@/config/role-settings.json";
import { formatMoney } from "@/utils/formatters/formatMoney";

const EMPTY_METRICS = {
  totalProperties: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  rentCollectedMonth: 0,
  overduePayments: 0,
};

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = React.useState({
    metrics: EMPTY_METRICS,
    alerts: [],
    activity: [],
    portfolio: [],
  });
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");

  const router = useRouter();

  React.useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/Login");
      return;
    }

    loadDashboard();

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

  const occupancyRate = Math.round(
    (data.metrics.occupiedUnits /
      Math.max(1, data.metrics.occupiedUnits + data.metrics.vacantUnits)) *
      100,
  );

  const kpiItems = [
    {
      id: "properties",
      label: "Total Properties",
      value: data.metrics.totalProperties,
      Link: "/Properties",
    },
    {
      id: "occupied",
      label: "Occupied Units",
      value: data.metrics.occupiedUnits,
      subValue: `${occupancyRate}% occupancy`,
      subTone: "low",
      Link: "/Units?filter=occupied",
    },
    {
      id: "vacant",
      label: "Vacant Units",
      value: data.metrics.vacantUnits,
      Link: "/Units?filter=vacant",
    },
    {
      id: "collected",
      label: "Rent Collected (Current Month)",
      value: formatMoney(data.metrics.rentCollectedMonth, currency),
      Link: "/Payments?filter=current_month",
    },
    {
      id: "overdue",
      label: "Overdue Payments",
      value: data.metrics.overduePayments,
      subValue: "Needs follow-up",
      subTone: "high",
      valueClassName: "[color:var(--danger)]",
      Link: "/Payments/overdue",
    },
  ];

  const role = String(session?.user?.role || "tenant").toLowerCase();
  const isManager = role === "manager";
  const dashboardRoleSettings = roleSettings.dashboard || {};
  const currentRoleSettings =
    dashboardRoleSettings[role] ||
    dashboardRoleSettings.tenant ||
    dashboardRoleSettings.manager;

  if (status === "loading") {
    return (
      <main
        className='min-h-screen p-8'
        style={{ background: "var(--bg)", color: "var(--text)" }}>
        Checking session...
      </main>
    );
  }
  if (status === "unauthenticated") {
    return (
      <main
        className='min-h-screen p-8'
        style={{ background: "var(--bg)", color: "var(--text)" }}>
        Redirecting to login...
      </main>
    );
  }
  return (
    <main
      className='min-h-screen'
      style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className='mx-auto max-w-7xl space-y-8 p-6 sm:p-8'>
        <section>
          <h1
            className='bg-clip-text text-3xl font-black text-transparent'
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--text), var(--accent))",
            }}>
            Portfolio Dashboard
          </h1>
          <p className='mt-1 app-text-muted'>
            Welcome back, {session?.user?.name}. You are signed in as {role}.
          </p>
        </section>

        <KpiRow items={kpiItems} />

        {isLoadingData ? (
          <section
            className='rounded-xl border p-4 text-sm'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}>
            Loading latest portfolio metrics...
          </section>
        ) : null}

        {loadError ? (
          <section
            className='rounded-xl border p-4 text-sm [color:var(--danger)]'
            style={{
              borderColor: "var(--tone-high-border)",
              backgroundColor: "var(--tone-high-bg)",
            }}>
            {loadError}
          </section>
        ) : null}

        <section className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <AlertsPanel />
          <div className='lg:col-span-2'>
            <RecentActivityFeed items={data.activity} />
          </div>
        </section>

        <BuildingsUnitsPanel items={data.portfolio} isManager />

        <QuickActions actions={currentRoleSettings.quickActions || []} />
      </div>
    </main>
  );
}
