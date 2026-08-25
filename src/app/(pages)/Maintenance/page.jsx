"use client";

export const runtime = "edge";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/app/providers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

function MaintenanceContent() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const unitId = params.get("unit") || "";
  const [title, setTitle] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [priority, setPriority] = React.useState("medium");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
        },
        body: JSON.stringify({
          unitId: unitId || null,
          title,
          detail,
          priority,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not submit maintenance request.");
      }

      setMessage("Maintenance request submitted. Management will review it shortly.");
      setTitle("");
      setDetail("");
      setPriority("medium");
    } catch (submitError) {
      setError(
        submitError?.message || "Could not submit maintenance request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className='min-h-screen p-6 sm:p-8'
      style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className='mx-auto max-w-2xl space-y-6'>
        <section>
          <h1 className='text-3xl font-black [color:var(--text)]'>
            Request Maintenance
          </h1>
          <p className='mt-1 text-sm app-text-muted'>
            {unitId
              ? `Submitting for unit: ${unitId}`
              : "Submit a new maintenance request."}
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className='space-y-4 rounded-xl border p-5'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            boxShadow: "var(--shadow)",
          }}>
          <label className='block space-y-1'>
            <span className='text-sm font-semibold'>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              className='w-full rounded-lg border px-3 py-2 text-sm'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}
            />
          </label>

          <label className='block space-y-1'>
            <span className='text-sm font-semibold'>Details</span>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              required
              disabled={isSubmitting}
              rows={4}
              className='w-full rounded-lg border px-3 py-2 text-sm'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}
            />
          </label>

          <label className='block space-y-1'>
            <span className='text-sm font-semibold'>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isSubmitting}
              className='w-full rounded-lg border px-3 py-2 text-sm'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}>
              <option value='low'>Low</option>
              <option value='medium'>Medium</option>
              <option value='high'>High</option>
            </select>
          </label>

          <div className='flex flex-wrap items-center gap-3'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='rounded-lg px-4 py-2 text-sm font-semibold [color:var(--primary-contrast)] disabled:cursor-not-allowed disabled:opacity-70'
              style={{ backgroundColor: "var(--primary)" }}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>

            <Link
              href={unitId ? `/Maintenance/history?unit=${unitId}` : "/Maintenance/history"}
              className='rounded-lg border px-4 py-2 text-sm font-semibold'
              style={{
                borderColor: "var(--border)",
                color: "var(--text)",
                backgroundColor: "var(--surface-2)",
              }}>
              See Requests
            </Link>
          </div>

          {error ? (
            <p className='text-sm [color:var(--danger)]'>{error}</p>
          ) : null}

          {message ? (
            <p className='text-sm' style={{ color: "var(--accent)" }}>
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}

export default function MaintenancePage() {
  return (
    <React.Suspense fallback={<p className='text-sm app-text-muted'>Loading...</p>}>
      <MaintenanceContent />
    </React.Suspense>
  );
}

export const dynamic = "force-dynamic";
