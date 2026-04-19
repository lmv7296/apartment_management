"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { APP_ROUTES } from "@/config/routes";

export default function UnitDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();

  const [unit, setUnit] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

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

        const unitId = String(params?.id || "").trim();
        if (!unitId) {
          throw new Error("Unit id is required");
        }

        const response = await fetch(`/api/v1/units/${unitId}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.detail || data?.error || "Failed to load unit");
        }

        setUnit(data);
      } catch (loadError) {
        setUnit(null);
        setError(loadError.message || "Failed to load unit");
      } finally {
        setLoading(false);
      }
    }

    loadUnit();
  }, [params, router, status]);

  return (
    <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mb-6 flex flex-wrap gap-3'>
        <Link
          href='/Units'
          className='inline-flex rounded-full border px-4 py-2 text-sm font-semibold'
          style={{ borderColor: "var(--border)", color: "var(--text)" }}>
          Back to Units
        </Link>

        {unit?.propertyId ? (
          <Link
            href={`/Properties/${unit.propertyId}`}
            className='inline-flex rounded-full border px-4 py-2 text-sm font-semibold'
            style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Open Property
          </Link>
        ) : null}
      </div>

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
          <section
            className='mb-6 rounded-3xl border p-6 sm:p-8'
            style={{
              borderColor: "var(--border)",
              background:
                "linear-gradient(120deg, color-mix(in oklab, var(--primary) 14%, transparent), color-mix(in oklab, var(--accent) 11%, transparent))",
            }}>
            <p className='text-xs font-bold tracking-[0.2em] uppercase app-text-muted'>
              Unit Details
            </p>
            <h1 className='mt-2 text-3xl font-black sm:text-4xl'>
              Unit {unit.unitCode || "N/A"}
            </h1>
            <p className='mt-2 app-text-muted'>
              {unit.propertyName || "Unknown Property"}
            </p>
            <p className='app-text-muted'>
              {unit.propertyAddress || ""}
              {unit.propertyCity ? `, ${unit.propertyCity}` : ""}
              {unit.propertyState ? `, ${unit.propertyState}` : ""}
            </p>

            <div className='mt-4 flex flex-wrap gap-2'>
              <span
                className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                style={{ borderColor: "var(--border)" }}>
                {unit.bedrooms ?? 0} Beds
              </span>
              <span
                className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                style={{ borderColor: "var(--border)" }}>
                {unit.bathrooms ?? 0} Baths
              </span>
              <span
                className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                style={{ borderColor: "var(--border)" }}>
                {unit.squareFeet ?? "N/A"} Sqft
              </span>
              <span
                className='rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide'
                style={{ borderColor: "var(--border)" }}>
                Lease: {unit.leaseStatus || "vacant"}
              </span>
            </div>
          </section>

          <section className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <article
              className='rounded-2xl border p-5'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
                boxShadow: "var(--shadow)",
              }}>
              <h2 className='text-lg font-black'>Tenant</h2>
              <p className='mt-2 text-sm'>
                Name:{" "}
                <span className='font-semibold'>
                  {unit.tenantName || "No tenant"}
                </span>
              </p>
              <p className='text-sm'>
                Email:{" "}
                <span className='font-semibold'>
                  {unit.tenantEmail || "N/A"}
                </span>
              </p>
              <p className='text-sm'>
                Phone:{" "}
                <span className='font-semibold'>
                  {unit.tenantPhone || "N/A"}
                </span>
              </p>
            </article>

            <article
              className='rounded-2xl border p-5'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
                boxShadow: "var(--shadow)",
              }}>
              <h2 className='text-lg font-black'>Lease</h2>
              <p className='mt-2 text-sm'>
                Monthly Rent:{" "}
                <span className='font-semibold'>
                  {unit.monthlyRent ?? "N/A"}
                </span>
              </p>
              <p className='text-sm'>
                Start Date:{" "}
                <span className='font-semibold'>
                  {unit.leaseStartDate
                    ? new Date(unit.leaseStartDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </p>
              <p className='text-sm'>
                End Date:{" "}
                <span className='font-semibold'>
                  {unit.leaseEndDate
                    ? new Date(unit.leaseEndDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </p>
              <p className='text-sm'>
                Move-out:{" "}
                <span className='font-semibold'>
                  {unit.leaveDate
                    ? new Date(unit.leaveDate).toLocaleDateString()
                    : "Not scheduled"}
                </span>
              </p>
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}
