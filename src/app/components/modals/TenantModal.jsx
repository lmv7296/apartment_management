"use client";

import React, { useState } from "react";
import BasicModal from "@/app/components/basic-modal";
import userPreferences from "@/config/user-preferences.json";
import { getInitials, getAvatarColor } from "@/utils/propertyUtils";

/**
 * TenantModal
 * Single configurable modal for Tenant actions (Create, Edit, View Details).
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - modalMode: "create" | "edit" | "view" | ""
 * - activeTenant: object | null
 * - formData: object { name, email, phone, preferred_currency, preferred_language }
 * - onChangeForm: function
 * - onSubmitForm: function
 * - onDeactivate: function (tenantId)
 * - saving: boolean
 */
export default function TenantModal({
  isOpen,
  onClose,
  modalMode,
  activeTenant ,
  formData = {},
  onChangeForm,
  onSubmitForm,
  onDeactivate,
  onActivate,
  saving = false,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "lease" | "notes"
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [activating, setActivating] = useState(false);

  if (!isOpen) return null;

  const isView = modalMode === "view";
  const isEdit = modalMode === "edit";

  // Dynamic Modal Header Title & Description
  const title = isView
    ? `Tenant Details: ${activeTenant?.name || ""}`
    : isEdit
    ? `Edit Tenant: ${activeTenant?.name || ""}`
    : "Create New Tenant";

  const description = isView
    ? "Overview of tenant contact information, payment status, and lease history."
    : "Enter tenant personal details and preferred settings.";

  async function handleDeactivateClick() {
    if (!confirmDeactivate) {
      setConfirmDeactivate(true);
      return;
    }
    if (!activeTenant?.id || !onDeactivate) return;
    setDeactivating(true);
    try {
      await onDeactivate(activeTenant.id);
      setConfirmDeactivate(false);
      onClose();
    } finally {
      setDeactivating(false);
    }
  }

  async function handleActivateClick() {
    if (!activeTenant?.id || !onActivate) return;
    setActivating(true);
    try {
      await onActivate(activeTenant.id);
      onClose();
    } finally {
      setActivating(false);
    }
  }

  // Dynamic Modal Footer
  const footer = isView ? (
    <div className="flex w-full items-center justify-between">
      {activeTenant?.active === false && onActivate ? (
        <button
          type="button"
          onClick={handleActivateClick}
          disabled={activating}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer disabled:opacity-50"
        >
          {activating ? "Activating..." : "Activate Tenant"}
        </button>
      ) : onDeactivate && activeTenant ? (
        <div>
          {Boolean(activeTenant.unit_code || activeTenant.assigned_unit || activeTenant.unit_id) ? (
            <div className="group relative inline-block">
              <button
                type="button"
                disabled
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400 cursor-not-allowed opacity-75"
              >
                Deactivate Tenant
              </button>
              <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden w-64 rounded-lg bg-slate-900 p-2 text-center text-[11px] font-semibold text-white shadow-lg group-hover:block z-50">
                Tenant must be unassigned from unit before you can deactivate / archive.
              </div>
            </div>
          ) : confirmDeactivate ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600">Deactivate this tenant?</span>
              <button
                type="button"
                onClick={handleDeactivateClick}
                disabled={deactivating}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deactivating ? "Deactivating..." : "Yes, Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeactivate(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDeactivate(true)}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 cursor-pointer"
            >
              Deactivate Tenant
            </button>
          )}
        </div>
      ) : <div />}

      <button
        type="button"
        onClick={onClose}
        className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 cursor-pointer"
      >
        Close
      </button>
    </div>
  ) : (
    <>
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="tenant-action-form"
        disabled={saving}
        className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
      >
        {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Tenant"}
      </button>
    </>
  );

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
    >
      {isView && activeTenant ? (
        /* Read-Only View Mode with Tabs & Activity History */
        <div className="space-y-5">
          {/* Header Profile Summary */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-xs"
              style={{ backgroundColor: getAvatarColor(activeTenant.name) }}
            >
              {getInitials(activeTenant.name)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{activeTenant.name}</h3>
              <p className="text-xs text-slate-400">Registered Tenant ID: {activeTenant.id}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 px-4 py-2 cursor-pointer transition ${
                activeTab === "overview"
                  ? "border-slate-900 font-bold text-slate-900"
                  : "border-transparent hover:text-slate-700"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lease")}
              className={`border-b-2 px-4 py-2 cursor-pointer transition ${
                activeTab === "lease"
                  ? "border-slate-900 font-bold text-slate-900"
                  : "border-transparent hover:text-slate-700"
              }`}
            >
              Lease & Payments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`border-b-2 px-4 py-2 cursor-pointer transition ${
                activeTab === "notes"
                  ? "border-slate-900 font-bold text-slate-900"
                  : "border-transparent hover:text-slate-700"
              }`}
            >
              Notes & History
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase text-slate-400">Email Address</p>
                <p className="mt-1 font-medium text-slate-800">{activeTenant.email || "Not registered"}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase text-slate-400">Phone Number</p>
                <p className="mt-1 font-medium text-slate-800">{activeTenant.phone || "Not registered"}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase text-slate-400">Assigned Unit</p>
                <p className="mt-1 font-bold text-slate-800">
                  {activeTenant.unit_code ? `Unit ${activeTenant.unit_code}` : "Unassigned"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase text-slate-400">Property</p>
                <p className="mt-1 font-medium text-slate-800">{activeTenant.property_name || "Unassigned"}</p>
              </div>
            </div>
          )}

          {/* Tab 2: Lease & Payments */}
          {activeTab === "lease" && (() => {
            const hasLease = Boolean(
              activeTenant.unit_code ||
              activeTenant.start_date ||
              activeTenant.monthly_rent ||
              activeTenant.monthlyRent ||
              (Array.isArray(activeTenant.leases) && activeTenant.leases.length > 0)
            );

            return (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="text-xs font-semibold uppercase text-slate-400">Payment Status</p>
                    <p className="mt-1 font-bold">
                      {!hasLease ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                          NO ACTIVE LEASE
                        </span>
                      ) : activeTenant.payment_status === "overdue" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                          OVERDUE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          PAID IN FULL
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="text-xs font-semibold uppercase text-slate-400">Monthly Rent</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {hasLease && (activeTenant.monthlyRent || activeTenant.monthly_rent)
                        ? `${activeTenant.preferred_currency || "USD"} ${Number(activeTenant.monthlyRent || activeTenant.monthly_rent).toLocaleString()}/mo`
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="text-xs font-semibold uppercase text-slate-400">Lease Start Date</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {activeTenant?.start_date ? String(activeTenant.start_date).split('T')[0] : activeTenant?.leaseStartDate || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <p className="text-xs font-semibold uppercase text-slate-400">Lease End Date</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {activeTenant?.end_date ? String(activeTenant.end_date).split('T')[0] : activeTenant?.leaseEndDate || "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tab 3: Notes & History */}
          {activeTab === "notes" && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase text-slate-400">Move-Out / Leave Date</p>
                <p className="mt-1 font-medium text-slate-800">{activeTenant.leaveDate || activeTenant.leave_date || "No move-out scheduled"}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xs font-semibold uppercase text-slate-400">Forwarding Address</p>
                <p className="mt-1 font-medium text-slate-800">{activeTenant.forwarding_address || "None specified"}</p>
              </div>

              {/* Lease History List */}
              {Array.isArray(activeTenant.leases) && activeTenant.leases.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Lease History</p>
                  <div className="space-y-2">
                    {activeTenant.leases.map((l, i) => (
                      <div key={l.id || i} className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-800">
                            Unit {l.unit_code || "—"} {l.property_name ? `(${l.property_name})` : ""}
                          </p>
                          <p className="text-slate-400">
                            {l.start_date || "N/A"} → {l.end_date || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block rounded-md px-2 py-0.5 font-bold ${l.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                            {String(l.status || "past").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Create / Edit Form Mode */
        <form id="tenant-action-form" onSubmit={onSubmitForm} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={onChangeForm}
              placeholder="e.g. Jane Doe"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={onChangeForm}
              placeholder="e.g. jane@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ""}
              onChange={onChangeForm}
              placeholder="e.g. +1 (555) 234-5678"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Preferred Currency & Language Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Preferred Currency
              </label>
              <select
                name="preferred_currency"
                value={formData.preferred_currency || "USD"}
                onChange={onChangeForm}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              >
                {userPreferences.currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Preferred Language
              </label>
              <select
                name="preferred_language"
                value={formData.preferred_language || "en"}
                onChange={onChangeForm}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              >
                {userPreferences.languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      )}
    </BasicModal>
  );
}
