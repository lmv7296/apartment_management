"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { APP_ROUTES } from "@/config/routes";
import BasicModal from "@/app/components/basic-modal";

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
  const [addTenantForm, setAddTenantForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    startDate: "",
    monthlyRent: "",
    notes: "",
  });
  const [removeTenantForm, setRemoveTenantForm] = React.useState({
    leaveDate: "",
    forwardingAddress: "",
    reason: "",
    depositReturnAmount: "",
    notes: "",
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

  function onChangeAddTenant(event) {
    const { name, value } = event.target;
    setAddTenantForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function onChangeRemoveTenant(event) {
    const { name, value } = event.target;
    setRemoveTenantForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function submitAddTenant(event) {
    event.preventDefault();

    // Placeholder submission for future API wiring.
    setActionMessage(
      `Tenant details prepared for ${activeUnit?.unitCode || "unit"}.`,
    );
    closeModal();
  }

  function submitRemoveTenant(event) {
    event.preventDefault();

    // Placeholder submission for future API wiring.
    setActionMessage(
      `Move-out details prepared for ${activeUnit?.unitCode || "unit"}.`,
    );
    closeModal();
  }

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
      return;
    }

    if (status !== "authenticated") {
      return;
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

    loadProperty();
  }, [params, router, status]);

  return (
    <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mb-6'>
        <Link
          href='/Properties'
          className='inline-flex rounded-full border px-4 py-2 text-sm font-semibold'
          style={{ borderColor: "var(--border)", color: "var(--text)" }}>
          Back to Properties
        </Link>
      </div>

      {loading ? (
        <div
          className='rounded-2xl border p-8 text-center'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          Loading property...
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

      {!loading && !error && property ? (
        <>
          <section
            className='mb-6 rounded-3xl border p-6 sm:p-8'
            style={{
              borderColor: "var(--border)",
              background:
                "linear-gradient(120deg, color-mix(in oklab, var(--primary) 14%, transparent), color-mix(in oklab, var(--accent) 11%, transparent))",
            }}>
            <p className='text-xs font-bold tracking-[0.2em] uppercase app-text-muted'>
              Property Details
            </p>
            <h1 className='mt-2 text-3xl font-black sm:text-4xl'>
              {property.name}
            </h1>
            <p className='mt-2 app-text-muted'>
              {property.address}, {property.city}, {property.state}
            </p>
            <div className='mt-4 flex flex-wrap gap-2'>
              <span
                className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                style={{ borderColor: "var(--border)" }}>
                {property.totalUnits ?? 0} Total Units
              </span>
              <span
                className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                style={{ borderColor: "var(--border)" }}>
                {property.unitCount ?? 0} Listed Units
              </span>
              <span
                className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                style={{ borderColor: "var(--border)" }}>
                {property.tenantCount ?? 0} Active Tenants
              </span>
            </div>
          </section>

          <section className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {(property.units || []).map((unit) => (
              <article
                key={unit.id}
                className='rounded-2xl border p-4'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  boxShadow: "var(--shadow)",
                }}>
                <h2 className='text-lg font-black'>
                  {unit.unitCode || "Unit"}
                </h2>
                <p className='mt-2 text-sm app-text-muted'>
                  {unit.bedrooms} bed | {unit.bathrooms} bath |{" "}
                  {unit.squareFeet || "-"} sqft
                </p>
                <p className='mt-2 text-sm'>
                  Lease:{" "}
                  <span className='font-semibold'>
                    {unit.leaseStatus || "vacant"}
                  </span>
                </p>
                <p className='text-sm'>
                  Tenant:{" "}
                  <span className='font-semibold'>
                    {unit.tenantName || "No tenant"}
                  </span>
                </p>
                <div className='mt-4 flex flex-wrap gap-2'>
                  {unit.tenantName ? (
                    <button
                      type='button'
                      onClick={() => openModal("remove", unit)}
                      className='rounded-full border px-4 py-2 text-xs font-bold transition hover:bg-red-50'
                      style={{
                        borderColor: "var(--danger, #dc2626)",
                        color: "var(--danger, #dc2626)",
                      }}>
                      Remove Tenant
                    </button>
                  ) : (
                    <button
                      type='button'
                      onClick={() => openModal("add", unit)}
                      className='rounded-full px-4 py-2 text-xs font-bold text-white transition hover:brightness-110'
                      style={{
                        background:
                          "linear-gradient(90deg, var(--accent), var(--primary))",
                      }}>
                      Add Tenant
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>

          {actionMessage ? (
            <div
              className='mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold'
              style={{
                borderColor: "var(--success, #16a34a)",
                color: "var(--success, #16a34a)",
                backgroundColor:
                  "color-mix(in oklab, var(--success, #16a34a) 12%, white)",
              }}>
              {actionMessage}
            </div>
          ) : null}

          <BasicModal
            isOpen={modalMode === "add"}
            onClose={closeModal}
            title={`Add Tenant ${activeUnit?.unitCode ? `- ${activeUnit.unitCode}` : ""}`}
            description='Capture basic tenant details before creating a lease.'
            footer={
              <>
                <button
                  type='button'
                  onClick={closeModal}
                  className='rounded-full border px-4 py-2 text-sm font-semibold'
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}>
                  Cancel
                </button>
                <button
                  type='submit'
                  form='add-tenant-form'
                  className='rounded-full px-4 py-2 text-sm font-bold text-white'
                  style={{
                    background:
                      "linear-gradient(90deg, var(--accent), var(--primary))",
                  }}>
                  Save Tenant
                </button>
              </>
            }>
            <form
              id='add-tenant-form'
              onSubmit={submitAddTenant}
              className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <label className='flex flex-col gap-1 sm:col-span-2'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Full Name
                </span>
                <input
                  required
                  name='fullName'
                  value={addTenantForm.fullName}
                  onChange={onChangeAddTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Email
                </span>
                <input
                  required
                  type='email'
                  name='email'
                  value={addTenantForm.email}
                  onChange={onChangeAddTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Phone
                </span>
                <input
                  required
                  name='phone'
                  value={addTenantForm.phone}
                  onChange={onChangeAddTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Lease Start
                </span>
                <input
                  required
                  type='date'
                  name='startDate'
                  value={addTenantForm.startDate}
                  onChange={onChangeAddTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Monthly Rent
                </span>
                <input
                  required
                  type='number'
                  min='0'
                  step='0.01'
                  name='monthlyRent'
                  value={addTenantForm.monthlyRent}
                  onChange={onChangeAddTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1 sm:col-span-2'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Notes
                </span>
                <textarea
                  name='notes'
                  rows={3}
                  value={addTenantForm.notes}
                  onChange={onChangeAddTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
            </form>
          </BasicModal>

          <BasicModal
            isOpen={modalMode === "remove"}
            onClose={closeModal}
            title={`Remove Tenant ${activeUnit?.unitCode ? `- ${activeUnit.unitCode}` : ""}`}
            description='Record move-out details before ending the lease.'
            footer={
              <>
                <button
                  type='button'
                  onClick={closeModal}
                  className='rounded-full border px-4 py-2 text-sm font-semibold'
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}>
                  Cancel
                </button>
                <button
                  type='submit'
                  form='remove-tenant-form'
                  className='rounded-full px-4 py-2 text-sm font-bold text-white'
                  style={{ backgroundColor: "var(--danger, #dc2626)" }}>
                  Confirm Removal
                </button>
              </>
            }>
            <form
              id='remove-tenant-form'
              onSubmit={submitRemoveTenant}
              className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <label className='flex flex-col gap-1'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Leave Date
                </span>
                <input
                  required
                  type='date'
                  name='leaveDate'
                  value={removeTenantForm.leaveDate}
                  onChange={onChangeRemoveTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Deposit Return
                </span>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  name='depositReturnAmount'
                  value={removeTenantForm.depositReturnAmount}
                  onChange={onChangeRemoveTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1 sm:col-span-2'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Forwarding Address
                </span>
                <input
                  name='forwardingAddress'
                  value={removeTenantForm.forwardingAddress}
                  onChange={onChangeRemoveTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1 sm:col-span-2'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Reason
                </span>
                <input
                  name='reason'
                  value={removeTenantForm.reason}
                  onChange={onChangeRemoveTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
              <label className='flex flex-col gap-1 sm:col-span-2'>
                <span className='text-xs font-semibold uppercase app-text-muted'>
                  Notes
                </span>
                <textarea
                  name='notes'
                  rows={3}
                  value={removeTenantForm.notes}
                  onChange={onChangeRemoveTenant}
                  className='rounded-xl border px-3 py-2 outline-none'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}
                />
              </label>
            </form>
          </BasicModal>
        </>
      ) : null}
    </main>
  );
}
