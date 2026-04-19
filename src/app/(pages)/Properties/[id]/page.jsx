"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { APP_ROUTES } from "@/config/routes";
import userPreferences from "@/config/user-preferences.json";
import AddTenantModal from "@/app/components/modals/AddTenantModal";
import RemoveTenantModal from "@/app/components/modals/RemoveTenantModal";
import AddUnitModal from "@/app/components/modals/AddUnitModal";

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
  const [userCurrency, setUserCurrency] = React.useState(
    userPreferences.defaultSettings.currency,
  );
  const [formData, setFormData] = React.useState({
    add: {
      fullName: "",
      email: "",
      phone: "",
      startDate: "",
      monthlyRent: "",
      currency: userPreferences.defaultSettings.currency,
      notes: "",
    },
    remove: {
      leaveDate: "",
      forwardingAddress: "",
      reason: "",
      depositReturnAmount: "",
      notes: "",
    },
    addUnit: {
      unitCode: "",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      areaUnit: "sqft",
    },
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

  function onChangeForm(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [modalMode]: {
        ...prev[modalMode],
        [name]: value,
      },
    }));
  }

  async function submitForm(event) {
    event.preventDefault();

    try {
      if (modalMode === "add") {
        // Add tenant
        setActionMessage(
          `Tenant details prepared for ${activeUnit?.unitCode || "unit"}.`,
        );
        closeModal();
      } else if (modalMode === "remove") {
        // Remove tenant
        const propertyId = String(params?.id || "");
        const response = await fetch(
          `/api/v1/Properties/${propertyId}/remove-tenant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              unitId: activeUnit?.id,
              leaveDate: formData.remove.leaveDate,
              forwardingAddress: formData.remove.forwardingAddress,
              reason: formData.remove.reason,
              depositReturnAmount: formData.remove.depositReturnAmount,
              notes: formData.remove.notes,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to remove tenant");
        }

        setActionMessage(
          `Tenant successfully removed from ${activeUnit?.unitCode || "unit"}.`,
        );
        setFormData((prev) => ({
          ...prev,
          remove: {
            leaveDate: "",
            forwardingAddress: "",
            reason: "",
            depositReturnAmount: "",
            notes: "",
          },
        }));
        closeModal();
        // Reload property data
        const propertyResponse = await fetch(
          `/api/v1/Properties/${propertyId}`,
          {
            cache: "no-store",
          },
        );
        const propertyData = await propertyResponse.json();
        setProperty(propertyData);
      } else if (modalMode === "addUnit") {
        // Add unit
        const propertyId = String(params?.id || "");
        const parsedArea = formData.addUnit.squareFeet
          ? Number(formData.addUnit.squareFeet)
          : null;
        const normalizedSquareFeet =
          parsedArea == null
            ? null
            : formData.addUnit.areaUnit === "sqm"
              ? Math.round(parsedArea * 10.7639)
              : Math.round(parsedArea);

        const response = await fetch(`/api/v1/Properties/${propertyId}/units`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            unitCode: formData.addUnit.unitCode,
            bedrooms: parseInt(formData.addUnit.bedrooms) || 0,
            bathrooms: parseInt(formData.addUnit.bathrooms) || 1,
            squareFeet: normalizedSquareFeet,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to add unit");
        }

        setActionMessage(
          `Unit ${formData.addUnit.unitCode} successfully created.`,
        );
        setFormData((prev) => ({
          ...prev,
          addUnit: {
            unitCode: "",
            bedrooms: "",
            bathrooms: "",
            squareFeet: "",
            areaUnit: "sqft",
          },
        }));
        closeModal();
        // Reload property data
        const propertyResponse = await fetch(
          `/api/v1/Properties/${propertyId}`,
          {
            cache: "no-store",
          },
        );
        const propertyData = await propertyResponse.json();
        setProperty(propertyData);
      }
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  }

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    async function loadUserSettings() {
      try {
        const response = await fetch("/api/v1/user-settings", {
          cache: "no-store",
        });
        const data = await response.json();

        if (response.ok && data.currency) {
          setUserCurrency(data.currency);
          setFormData((prev) => ({
            ...prev,
            add: {
              ...prev.add,
              currency: data.currency,
            },
          }));
        }
      } catch (err) {
        console.error("Failed to load user settings:", err);
      }
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

    loadUserSettings();
    loadProperty();
  }, [params, router, status]);

  React.useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setActionMessage("");
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, [actionMessage]);

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
                {property.unitCount ?? 0} Total Units
              </span>
              <span
                className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                style={{ borderColor: "var(--border)" }}>
                {property.tenantCount ?? 0} Active Tenants
              </span>
              <button
                type='button'
                onClick={() => openModal("addUnit", null)}
                className='rounded-full px-4 py-2 text-xs font-bold text-white transition hover:brightness-110'
                style={{
                  background:
                    "linear-gradient(90deg, var(--accent), var(--primary))",
                }}>
                Add Unit
              </button>
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
                {unit.leaveDate ? (
                  <p
                    className='mt-2 text-sm font-semibold'
                    style={{ color: "var(--warning, #f59e0b)" }}>
                    Move-out: {new Date(unit.leaveDate).toLocaleDateString()}
                  </p>
                ) : null}
                <div className='mt-4 flex flex-wrap gap-2'>
                  {unit.tenantName ? (
                    <>
                      {unit.leaveDate ? (
                        <button
                          type='button'
                          disabled
                          className='rounded-full border px-4 py-2 text-xs font-bold cursor-not-allowed opacity-60'
                          style={{
                            borderColor: "var(--warning, #f59e0b)",
                            color: "var(--warning, #f59e0b)",
                          }}>
                          Tenant Leaving
                        </button>
                      ) : (
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
                      )}
                    </>
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
              className='fixed right-4 bottom-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg'
              style={
                actionMessage.startsWith("Error:")
                  ? {
                      borderColor: "var(--danger, #dc2626)",
                      color: "var(--danger, #dc2626)",
                      backgroundColor:
                        "color-mix(in oklab, var(--danger, #dc2626) 10%, white)",
                    }
                  : {
                      borderColor: "var(--success, #16a34a)",
                      color: "var(--success, #16a34a)",
                      backgroundColor:
                        "color-mix(in oklab, var(--success, #16a34a) 12%, white)",
                    }
              }>
              {actionMessage}
            </div>
          ) : null}

          <AddTenantModal
            isOpen={modalMode === "add"}
            onClose={closeModal}
            activeUnit={activeUnit}
            formData={formData.add}
            onChangeForm={onChangeForm}
            onSubmit={submitForm}
            userCurrency={userCurrency}
          />

          <RemoveTenantModal
            isOpen={modalMode === "remove"}
            onClose={closeModal}
            activeUnit={activeUnit}
            formData={formData.remove}
            onChangeForm={onChangeForm}
            onSubmit={submitForm}
          />

          <AddUnitModal
            isOpen={modalMode === "addUnit"}
            onClose={closeModal}
            formData={formData.addUnit}
            onChangeForm={onChangeForm}
            onSubmit={submitForm}
          />
        </>
      ) : null}
    </main>
  );
}
