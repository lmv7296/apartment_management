"use client";

import React from "react";
import { useSession } from "@/app/providers";
import { useSearchParams } from "next/navigation";

export default function MaintenanceHistoryPage() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const unitId = params.get("unit") || "";
  const [items, setItems] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [savingId, setSavingId] = React.useState("");

  const role = String(session?.user?.role || "tenant").toLowerCase();
  const isManager = role === "manager";

  React.useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      setIsLoading(true);
      setError("");

      try {
        const url = unitId
          ? `/api/v1/maintenance?unit=${encodeURIComponent(unitId)}`
          : "/api/v1/maintenance";
        const response = await fetch(url, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Could not load maintenance requests.");
        }

        if (!cancelled) {
          setItems(Array.isArray(payload.items) ? payload.items : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError?.message || "Could not load maintenance requests.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, [unitId]);

  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleStatusUpdate(id, nextStatus) {
    setError("");
    setSavingId(id);

    try {
      const response = await fetch("/api/v1/maintenance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not update request status.");
      }

      const updated = payload?.item;

      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      );
    } catch (updateError) {
      setError(updateError?.message || "Could not update request status.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <main
      className='min-h-screen p-6 sm:p-8'
      style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className='mx-auto max-w-3xl space-y-6'>
        <section>
          <h1 className='text-3xl font-black [color:var(--text)]'>
            Maintenance Requests
          </h1>
          <p className='mt-1 text-sm app-text-muted'>
            {unitId
              ? `Viewing requests for unit: ${unitId}`
              : "Viewing your maintenance request history."}
          </p>
        </section>

        <article
          className='rounded-xl border p-5'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            boxShadow: "var(--shadow)",
          }}>
          {isLoading ? (
            <p className='text-sm app-text-muted'>Loading requests...</p>
          ) : null}

          {error ? (
            <p className='text-sm [color:var(--danger)]'>{error}</p>
          ) : null}

          {!isLoading && !error && items.length === 0 ? (
            <p className='text-sm app-text-muted'>No maintenance requests found.</p>
          ) : null}

          {!isLoading && !error && items.length > 0 ? (
            <ul className='space-y-3'>
              {items.map((request) => (
                <li
                  key={request.id}
                  className='rounded-lg border p-3'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}>
                  <p className='text-sm font-semibold [color:var(--text)]'>
                    {request.title}
                  </p>
                  <p className='text-xs app-text-muted'>
                    Unit: {request.unitCode || request.unitId || "Unknown"}
                  </p>
                  <p className='text-xs app-text-muted'>
                    Status: {request.status} • Priority: {request.priority}
                  </p>
                  <p className='text-xs app-text-muted'>
                    Created: {formatDate(request.createdAt)}
                  </p>
                  {request.detail ? (
                    <p className='mt-2 text-xs app-text-muted'>{request.detail}</p>
                  ) : null}
                  {isManager ? (
                    <div className='mt-3 flex flex-wrap gap-2'>
                      <button
                        type='button'
                        onClick={() => handleStatusUpdate(request.id, "open")}
                        disabled={savingId === request.id || request.status === "open"}
                        className='rounded-md border px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60'
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface)",
                          color: "var(--text)",
                        }}>
                        Mark Open
                      </button>
                      <button
                        type='button'
                        onClick={() => handleStatusUpdate(request.id, "in_progress")}
                        disabled={
                          savingId === request.id || request.status === "in_progress"
                        }
                        className='rounded-md border px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60'
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface)",
                          color: "var(--text)",
                        }}>
                        Mark In Progress
                      </button>
                      <button
                        type='button'
                        onClick={() => handleStatusUpdate(request.id, "closed")}
                        disabled={savingId === request.id || request.status === "closed"}
                        className='rounded-md border px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60'
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface)",
                          color: "var(--text)",
                        }}>
                        Mark Closed
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>
    </main>
  );
}
