"use client";

export const runtime = "edge";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/providers";
import KpiCard from "@/app/components/KpiCard";
import TableWithSearch from "@/app/components/Table-with-search";
import { exportToCSV } from "@/app/components/exportToCSV";
import TenantModal from "@/app/components/modals/TenantModal";
import { getInitials, getAvatarColor } from "@/utils/propertyUtils";
import userPreferences from "@/config/user-preferences.json";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function TenantProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Filter & Search State
  const [tenantFilter, setTenantFilter] = useState("all");

  // Modal States
  const [modalMode, setModalMode] = useState(""); // "create" | "edit" | "view" | ""
  const [activeTenant, setActiveTenant] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_currency: "USD",
    preferred_language: "en",
  });

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/Login");
    }
  }, [status, router]);

  // Fetch tenants data
  const fetchTenants = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError("");

    try {
      // 1. Fetch tenants list
      const response = await fetch(`${BACKEND_URL}/api/v1/tenants`, {
        headers: {
          "x-user-id": session.user.id,
        },
      });

      let rawTenants = [];
      if (response.ok) {
        const data = await response.json();
        rawTenants = Array.isArray(data) ? data : data.tenants || [];
      }

      // 2. Cross-reference with properties in sessionStorage to populate assigned unit info
      const rawProps = typeof window !== "undefined" ? sessionStorage.getItem("properties") : null;
      const properties = rawProps ? JSON.parse(rawProps) : [];

      const enrichedTenants = rawTenants.map((t) => {
        let assignedUnitCode = t.unit_code || t.unitCode || null;
        let assignedPropertyName = t.property_name || t.propertyName || null;

        if (Array.isArray(properties)) {
          for (const prop of properties) {
            if (Array.isArray(prop.units)) {
              for (const u of prop.units) {
                const uEmail = u.email || u.tenant_email;
                const uName = u.name || u.tenant_name;
                const isMatch =
                  (t.id && (u.assigned_tenant === t.id || u.tenant_id === t.id)) ||
                  (t.email && uEmail && String(uEmail).toLowerCase() === String(t.email).toLowerCase()) ||
                  (t.name && uName && String(uName).toLowerCase() === String(t.name).toLowerCase());

                if (isMatch) {
                  assignedUnitCode = u.unit_code || u.unitCode;
                  assignedPropertyName = prop.name;
                  break;
                }
              }
            }
          }
        }

        return {
          ...t,
          unit_code: assignedUnitCode,
          property_name: assignedPropertyName,
        };
      });

      setTenants(enrichedTenants);
    } catch (err) {
      console.error("Failed to load tenants:", err);
      setError("Could not load tenants list.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTenants();
    }
  }, [status, fetchTenants]);

  // Modal Open Handlers
  function openCreateModal() {
    setActiveTenant(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      preferred_currency: userPreferences.defaultSettings.currency || "USD",
      preferred_language: userPreferences.defaultSettings.language || "en",
    });
    setModalMode("create");
    setActionMessage("");
  }

  function openEditModal(tenant) {
    setActiveTenant(tenant);
    setFormData({
      name: tenant.name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      preferred_currency: tenant.preferred_currency || "USD",
      preferred_language: tenant.preferred_language || "en",
    });
    setModalMode("edit");
    setActionMessage("");
  }

  function openViewModal(tenant) {
    setActiveTenant(tenant);
    setModalMode("view");
  }

  function closeModal() {
    setModalMode("");
    setActiveTenant(null);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Submit Create or Edit Tenant
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const isEdit = modalMode === "edit";
      const url = isEdit
        ? `${BACKEND_URL}/api/v1/tenants/${activeTenant.id}`
        : `${BACKEND_URL}/api/v1/tenants`;

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || resData.message || `Failed to ${isEdit ? "update" : "create"} tenant`);
      }

      setActionMessage(`Tenant "${formData.name}" successfully ${isEdit ? "updated" : "created"}.`);
      closeModal();
      fetchTenants();
    } catch (err) {
      console.error("Error saving tenant:", err);
      setError(err.message || "Failed to save tenant details.");
    } finally {
      setSaving(false);
    }
  }

  // Deactivate Tenant Handler (calls DELETE /api/v1/tenants/:id)
  async function handleDeactivateTenant(tenantId) {
    if (!tenantId) return;
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/tenants/${tenantId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": session?.user?.id || "",
        },
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Could not deactivate tenant");
      }

      setActionMessage("Tenant successfully deactivated.");
      fetchTenants();
    } catch (err) {
      console.error("Deactivate tenant error:", err);
      setError(err.message || "Failed to deactivate tenant.");
    }
  }

  // Activate / Reactivate Tenant Handler (calls PUT /api/v1/tenants/:id with active: true)
  async function handleActivateTenant(tenantId) {
    if (!tenantId) return;
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/tenants/${tenantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
        },
        body: JSON.stringify({ active: true }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Could not activate tenant");
      }

      setActionMessage("Tenant successfully reactivated.");
      fetchTenants();
    } catch (err) {
      console.error("Activate tenant error:", err);
      setError(err.message || "Failed to activate tenant.");
    }
  }

  // Export CSV Handler
  function handleExportCSV() {
    if (!tenants || tenants.length === 0) return;

    const exportData = tenants.map((t) => ({
      "Full Name": t.name || "—",
      "Email Address": t.email || "—",
      "Phone Number": t.phone || "—",
      "Assigned Property": t.property_name || "Unassigned",
      "Assigned Unit": t.unit_code || "Unassigned",
      "Preferred Currency": t.preferred_currency || "USD",
      "Preferred Language": t.preferred_language || "en",
    }));

    exportToCSV(exportData, "tenants_export.csv");
  }

  // KPI Calculations (excluding archived tenants)
  const activeTenants = tenants.filter((t) => t.active !== false);
  const totalTenants = activeTenants.length;
  const assignedTenants = activeTenants.filter((t) => Boolean(t.unit_code || t.assigned_unit)).length;
  const unassignedTenants = totalTenants - assignedTenants;
  const archivedTenants = tenants.filter((t) => t.active === false).length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tenant Management
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Tenants
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View registered tenant profiles, update contact details, and assign units.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={tenants.length === 0}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Export Data
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Tenant
            </button>
          </div>
        </div>

        {/* Action / Toast Notification */}
        {actionMessage && (
          <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700 shadow-sm">
            <span>{actionMessage}</span>
            <button
              type="button"
              onClick={() => setActionMessage("")}
              className="text-xs font-bold uppercase text-green-600 hover:text-green-900"
            >
              Dismiss
            </button>
          </div>
        )}

   
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

  
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="Total Tenants"
            value={totalTenants}
            subtitle="Registered in system"
          />
          <KpiCard
            title="Assigned Tenants"
            value={assignedTenants}
            subtitle="Currently in property units"
            accentColor="#10b981"
          />
          <KpiCard
            title="Unassigned Tenants"
            value={unassignedTenants}
            subtitle="Awaiting unit assignment"
            accentColor="#f59e0b"
          />
          <KpiCard
            title="Active Leases"
            value={assignedTenants}
            subtitle="Active lease contracts"
          />
        </div>

  
        <TableWithSearch
          type="tenants"
          data={tenants}
          loading={loading}
          filterTabs={[
            { key: "all", label: `All Tenants (${totalTenants})` },
            { key: "assigned", label: `Assigned (${assignedTenants})` },
            { key: "unassigned", label: `Unassigned (${unassignedTenants})` },
            // { key: "overdue", label: `Overdue Rent (${activeTenants.filter(t => t.payment_status === "overdue").length})` },
            { key: "archived", label: `Archived (${archivedTenants})` },
          ]}
          activeFilter={tenantFilter}
          onFilterChange={setTenantFilter}
          searchPlaceholder="Search by name, email, phone, unit..."
          emptyMessage="No tenants found."
          renderRow={(tenant, idx) => {
            const initials = getInitials(tenant.name);
            const avatarColor = getAvatarColor(tenant.name);
            const isAssigned = Boolean(tenant.unit_code || tenant.assigned_unit);
            // const isOverdue = tenant.payment_status === "overdue";

            return (
              <tr
                key={tenant.id || idx}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                {/* Tenant Info */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{tenant.name}</p>
                    </div>
                  </div>
                </td>

                {/* Contact Info */}
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-800">{tenant.email || "—"}</p>
                  <p className="text-xs text-slate-400">{tenant.phone || "No phone registered"}</p>
                </td>

                {/* Assigned Property & Unit */}
                <td className="px-4 py-4">
                  {isAssigned ? (
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                        Unit {tenant.unit_code}
                      </span>
                      {tenant.property_name && (
                        <p className="mt-0.5 text-xs text-slate-400">{tenant.property_name}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">— Not Assigned —</span>
                  )}
                </td>

                
                {/* <td className="px-4 py-4">
                  {!isAssigned && !tenant.monthly_rent && !tenant.monthlyRent && (!Array.isArray(tenant.leases) || tenant.leases.length === 0) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      NO LEASE
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      OVERDUE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      PAID IN FULL
                    </span>
                  )}
                </td> */}

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {tenant.active === false ? (
                      <button
                        type="button"
                        onClick={() => handleActivateTenant(tenant.id)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                      >
                        Activate
                      </button>
                    ) : (
                      <>
                        {!isAssigned && (
                          <button
                            type="button"
                            onClick={() => router.push("/Properties")}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 cursor-pointer"
                          >
                            Assign Unit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(tenant)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          Edit Profile
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => openViewModal(tenant)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />

        {/* Single Configurable Tenant Modal */}
        <TenantModal
          isOpen={Boolean(modalMode)}
          onClose={closeModal}
          modalMode={modalMode}
          activeTenant={activeTenant}
          formData={formData}
          onChangeForm={handleFormChange}
          onSubmitForm={handleSubmit}
          onDeactivate={handleDeactivateTenant}
          onActivate={handleActivateTenant}
          saving={saving}
        />
      </div>
    </main>
  );
}
