"use client";

import React, { useState, useEffect } from "react";
import BasicModal from "@/app/components/basic-modal";
import userPreferences from "@/config/user-preferences.json";
import { useSession } from "@/app/providers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function AddTenantModal({
  isOpen,
  onClose,
  activeUnit,
  formData,
  onChangeForm,
  onSubmit,
  userCurrency,
}) {
  const { data: session } = useSession();
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  const effectiveCurrency = formData.currency || userCurrency || "USD";

  // Fetch registered active tenants when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function fetchActiveTenants() {
      setLoadingTenants(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/tenants`, {
          headers: {
            "x-user-id": session?.user?.id || "",
          },
        });
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : data.tenants || [];
          if (!cancelled) {
            setTenants(list);
          }
        }
      } catch (err) {
        console.error("Failed to load active tenants list:", err);
      } finally {
        if (!cancelled) {
          setLoadingTenants(false);
        }
      }
    }

    fetchActiveTenants();

    return () => {
      cancelled = true;
    };
  }, [isOpen, session?.user?.id]);

  // When a tenant is selected from the select list, auto-fill form fields
  function handleSelectTenantChange(e) {
    const tenantId = e.target.value;
    setSelectedTenantId(tenantId);

    if (!tenantId) return;

    const found = tenants.find((t) => String(t.id) === String(tenantId));
    if (found) {
      // Simulate synthetic events or bulk populate form fields
      const fields = [
        { name: "id", value: found.id },
        { name: "fullName", value: found.name || "" },
        { name: "email", value: found.email || "" },
        { name: "phone", value: found.phone || "" },
      ];

      fields.forEach((field) => {
        onChangeForm({
          target: {
            name: field.name,
            value: field.value,
          },
        });
      });
    }
  }

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Tenant ${activeUnit?.unitCode ? `- ${activeUnit.unitCode}` : ""}`}
      description="Select an existing registered tenant or enter details to assign to this unit."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-4 py-2 text-sm font-semibold"
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-tenant-form"
            className="rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110"
            style={{
              background: "linear-gradient(90deg, var(--accent), var(--primary))",
            }}
          >
            Save Tenant
          </button>
        </>
      }
    >
      <form
        id="add-tenant-form"
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {/* Select Tenant Dropdown */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Select Active Tenant
          </span>
          <select
            value={selectedTenantId}
            onChange={handleSelectTenantChange}
            className="rounded-xl border px-3 py-2 text-sm font-medium outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          >
            <option value="" style={{ color: "var(--text)" }}>
              {loadingTenants
                ? "Loading active tenants..."
                : tenants.length === 0
                ? "No registered active tenants found (enter manually below)"
                : "-- Select from active registered tenants --"}
            </option>
            {[...tenants]
              .sort((a, b) => {
                const aAssigned = Boolean(a.unit_code || a.assigned_unit);
                const bAssigned = Boolean(b.unit_code || b.assigned_unit);
                if (!aAssigned && bAssigned) return -1;
                if (aAssigned && !bAssigned) return 1;
                return (a.name || "").localeCompare(b.name || "");
              })
              .map((t) => {
                const isAssigned = Boolean(t.unit_code || t.assigned_unit);
                return (
                  <option
                    key={t.id}
                    value={t.id}
                    style={{
                      color: isAssigned ? "#dc2626" : "#16a34a",
                      fontWeight: "600",
                    }}
                  >
                    {isAssigned ? "🔴 " : "🟢 "}
                    {t.name} ({t.email || "No email"}) — {isAssigned ? `Assigned to Unit ${t.unit_code}` : "Unassigned (Available)"}
                  </option>
                );
              })}
          </select>
        </label> 
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Full Name
          </span>
          <input
            disabled
            name="fullName"
            value={formData.fullName || ""}
            onChange={onChangeForm}
            placeholder="Auto-filled from tenant selection"
            className="rounded-xl border px-3 py-2 text-sm outline-none cursor-not-allowed font-m um"
            style={{
              borderColor: "#cbd5e1",
              backgroundColor: "#f1f5f9",
              color: "#64748b",
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Email
          </span>
          <input
            disabled
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={onChangeForm}
            placeholder="Auto-filled from tenant selection"
            className="rounded-xl border px-3 py-2 text-sm outline-none cursor-not-allowed font-medium"
            style={{
              borderColor: "#cbd5e1",
              backgroundColor: "#f1f5f9",
              color: "#64748b",
            }}
          />
        </label>

        {/* Phone */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Phone
          </span>
          <input
            disabled
            name="phone"
            value={formData.phone || ""}
            onChange={onChangeForm}
            placeholder="Auto-filled from tenant selection"
            className="rounded-xl border px-3 py-2 text-sm outline-none cursor-not-allowed font-medium"
            style={{
              borderColor: "#cbd5e1",
              backgroundColor: "#f1f5f9",
              color: "#64748b",
            }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Lease Start
          </span>
          <input
            required
            type="date"
            name="startDate"
            value={formData.startDate || ""}
            onChange={onChangeForm}
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Lease End
          </span>
          <input
            required
            type="date"
            name="endDate"
            value={formData.endDate || ""}
            onChange={onChangeForm}
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Monthly Rent
          </span>
          <div className="grid grid-cols-[1fr_auto]">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              name="monthlyRent"
              value={formData.monthlyRent || ""}
              onChange={onChangeForm}
              placeholder="0.00"
              className="rounded-l-xl border border-r-0 px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}
            />
            <select
              required
              name="currency"
              value={effectiveCurrency}
              onChange={onChangeForm}
              className="rounded-r-xl border px-3 py-2 outline-none"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}
            >
              {userPreferences.currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Notes
          </span>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes || ""}
            onChange={onChangeForm}
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>
      </form>
    </BasicModal>
  );
}
