"use client";

import React from "react";
import { useSession } from "@/app/providers";
import { useRouter } from "next/navigation";
import KpiRow from "@/app/components/dashboard/KpiRow";
import QuickActions from "@/app/components/dashboard/QuickActions";
import BuildingsUnitsPanel from "@/app/components/dashboard/BuildingsUnitsPanel";
import roleSettings from "@/config/role-settings.json";
import { APP_ROUTES } from "@/config/routes";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function TenantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = React.useState({
    portfolio: [],
    tenantPayment: null,
  });
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

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
        const response = await fetch(`${BACKEND_URL}/api/v1/dashboard`, {
          cache: "no-store",
          headers: {
            "x-user-id": session?.user?.id || ""
          }
        });

        if (!response.ok) {
          throw new Error("Could not load tenant dashboard data.");
        }

        const payload = await response.json();

        if (!cancelled) {
          setDashboardData({
            portfolio: Array.isArray(payload.portfolio)
              ? payload.portfolio
              : [],
            tenantPayment: payload.tenantPayment || null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error.message || "Could not load tenant dashboard data.",
          );
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

  const dashboardRoleSettings = roleSettings.dashboard || {};
  const tenantSettings = dashboardRoleSettings.tenant || {};
  const role = String(session?.user?.role || "tenant").toLowerCase();
  const firstAssignment = (() => {
    for (const building of dashboardData.portfolio) {
      const firstUnit = Array.isArray(building.units)
        ? building.units[0]
        : null;

      if (firstUnit) {
        return { building, unit: firstUnit };
      }
    }

    return null;
  })();
  const assignedBuilding = firstAssignment?.building || null;
  const assignedUnit = firstAssignment?.unit || null;
  const paymentSummary = dashboardData.tenantPayment || {};
  const paymentStatus = paymentSummary.status
    ? String(paymentSummary.status).toLowerCase()
    : null;
  const paymentStatusLabel = paymentStatus
    ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)
    : "No lease assigned";
  const nextPaymentAmountLabel =
    paymentSummary.nextAmount != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(Number(paymentSummary.nextAmount))
      : null;
  const nextPaymentDate = paymentSummary.nextDueDate
    ? new Date(paymentSummary.nextDueDate)
    : null;
  const nextPaymentDateLabel =
    nextPaymentDate && !Number.isNaN(nextPaymentDate.getTime())
      ? nextPaymentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "No due date";
  const unitOnlyPortfolio =
    assignedBuilding && assignedUnit
      ? [{ ...assignedBuilding, units: [assignedUnit] }]
      : [];

  const tenantKpiItems = [
    {
      id: "my-unit",
      label: "Assigned Unit",
      value: assignedUnit ? `Unit ${assignedUnit.code}` : "Not assigned",
      subValue: assignedBuilding?.name || "Awaiting assignment",
      subTone: assignedUnit ? "low" : "medium",
    },
    {
      id: "lease-status",
      label: "Lease Status",
      value: assignedUnit?.leaseStatus
        ? assignedUnit.leaseStatus.charAt(0).toUpperCase() +
          assignedUnit.leaseStatus.slice(1)
        : assignedUnit
          ? "Assigned"
          : "Unknown",
      subValue: assignedUnit?.leaseStatus
        ? "Current lease snapshot"
        : assignedUnit
          ? "Unit assigned directly"
          : "No unit linked",
      subTone:
        assignedUnit?.leaseStatus === "active"
          ? "low"
          : assignedUnit
            ? "low"
            : "medium",
    },
    {
      id: "payment-status",
      label: "Payment Status",
      value: paymentStatusLabel,
      subValue:
        paymentStatus === null
          ? "Waiting for assignment"
          : paymentStatus === "overdue"
            ? "Action required"
            : paymentStatus === "paid"
              ? "Up to date"
              : "Check current invoice",
      subTone:
        paymentStatus === null
          ? "low"
          : paymentStatus === "overdue"
            ? "high"
            : paymentStatus === "paid"
              ? "low"
              : "medium",
    },
    {
      id: "next-payment",
      label: "Next Payment Date",
      value: nextPaymentDateLabel,
      subValue: nextPaymentAmountLabel
        ? `Amount due: ${nextPaymentAmountLabel}`
        : "No unpaid invoice found",
      subTone: paymentSummary.nextDueDate ? "medium" : "low",
    },
  ];

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
            Tenant Dashboard
          </h1>
          <p className='mt-1 app-text-muted'>
            Welcome back, {session?.user?.name}. You are signed in as {role}.
          </p>
        </section>

        <KpiRow items={tenantKpiItems} />

        {isLoadingData ? (
          <section
            className='rounded-xl border p-4 text-sm'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}>
            Loading your latest dashboard data...
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

        <QuickActions actions={tenantSettings.quickActions || []} />

        <BuildingsUnitsPanel items={unitOnlyPortfolio} isManager={false} />
      </div>
    </main>
  );
}
