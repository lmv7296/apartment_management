"use client";

import React from "react";
import { useSession } from "next-auth/react";
import KpiRow from "@/app/components/dashboard/KpiRow";
import AlertsPanel from "@/app/components/dashboard/AlertsPanel";
import RecentActivityFeed from "@/app/components/dashboard/RecentActivityFeed";
import QuickActions from "@/app/components/dashboard/QuickActions";
import { useRouter } from "next/navigation";

const EMPTY_METRICS = {
  totalProperties: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  rentCollectedMonth: 0,
  overduePayments: 0,
};

const quickActions = [
  {
    id: "add-property",
    label: "+ Add Property",
    href: "/properties/new",
    className: "hover:brightness-110",
    style: {
      background: "linear-gradient(90deg, var(--accent), var(--primary))",
    },
  },
  {
    id: "add-tenant",
    label: "+ Add Tenant",
    href: "/tenants/new",
    className: "hover:brightness-110",
    style: {
      background: "linear-gradient(90deg, var(--success), var(--accent))",
    },
  },
  {
    id: "record-payment",
    label: "+ Record Payment",
    href: "/payments/new",
    className: "hover:brightness-110",
    style: {
      background: "linear-gradient(90deg, var(--accent-2), var(--primary))",
    },
  },
];

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = React.useState({
    metrics: EMPTY_METRICS,
    alerts: [],
    activity: [],
  });
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  const router = useRouter();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/Login");
    }
  }, [status, router]);

  React.useEffect(() => {
    if (status !== "authenticated") {
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
    },
    {
      id: "occupied",
      label: "Occupied Units",
      value: data.metrics.occupiedUnits,
      subValue: `${occupancyRate}% occupancy`,
      subTone: "low",
    },
    {
      id: "vacant",
      label: "Vacant Units",
      value: data.metrics.vacantUnits,
    },
    {
      id: "collected",
      label: "Rent Collected (Current Month)",
      value: formatMoney(data.metrics.rentCollectedMonth),
    },
    {
      id: "overdue",
      label: "Overdue Payments",
      value: data.metrics.overduePayments,
      subValue: "Needs follow-up",
      subTone: "high",
      valueClassName: "[color:var(--danger)]",
    },
  ];

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
            Welcome back, {session?.user?.name}. Here is your current operations
            snapshot.
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
          <AlertsPanel alerts={data.alerts} />
          <div className='lg:col-span-2'>
            <RecentActivityFeed items={data.activity} />
          </div>
        </section>

        <QuickActions actions={quickActions} />
      </div>
    </main>
  );
}
