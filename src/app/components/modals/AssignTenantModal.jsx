import React, { useState, useEffect } from "react";
import BasicModal from "@/app/components/basic-modal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function AssignTenantModal({
  isOpen,
  onClose,
  unitId,
  unitCode,
  session,
  onSuccess,
}) {
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    id: "", // tenant id expected by backend req.body.id
    start_date: "",
    end_date: "",
    monthly_rent: "",
    leave_date: "",
    forwarding_address: "",
    leave_reason: "",
    deposit_return_amount: "",
    move_out_notes: "",
  });

  // Fetch list of tenants when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function fetchTenants() {
      setLoadingTenants(true);
      setError("");
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/tenants`, {
          headers: {
            "x-user-id": session?.user?.id || "",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTenants(Array.isArray(data) ? data : data.tenants || []);
        }
      } catch (err) {
        console.error("Error loading tenants list:", err);
      } finally {
        setLoadingTenants(false);
      }
    }

    fetchTenants();
  }, [isOpen, session?.user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.id) {
      setError("Please select or provide a tenant.");
      return;
    }

    if (!formData.start_date || !formData.end_date || formData.monthly_rent === "") {
      setError("Lease Start Date, End Date, and Monthly Rent are required.");
      return;
    }

    setSubmitting(true);

    try {
      // Body payload structure required by backend:
      // const { id: tenant_id, start_date, end_date, monthly_rent, leave_date, forwarding_address, leave_reason, deposit_return_amount, move_out_notes } = req.body;
      const payload = {
        id: formData.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        monthly_rent: Number(formData.monthly_rent),
        leave_date: formData.leave_date || null,
        forwarding_address: formData.forwarding_address || null,
        leave_reason: formData.leave_reason || null,
        deposit_return_amount: formData.deposit_return_amount !== "" ? Number(formData.deposit_return_amount) : null,
        move_out_notes: formData.move_out_notes || null,
      };

      const response = await fetch(
        `${BACKEND_URL}/api/v1/units/${unitId}/assign-tenant`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": session?.user?.id || "",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to assign tenant.");
      }

      if (typeof onSuccess === "function") {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Tenant ${unitCode ? `- ${unitCode}` : ""}`}
      description="Assign a tenant to this unit and establish a lease record."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
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
            form="assign-tenant-form"
            disabled={submitting}
            className="rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            style={{
              background:
                "linear-gradient(90deg, var(--accent), var(--primary))",
            }}
          >
            {submitting ? "Assigning..." : "Assign Tenant"}
          </button>
        </>
      }
    >
      <form
        id="assign-tenant-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {error && (
          <div className="col-span-1 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-600 sm:col-span-2">
            {error}
          </div>
        )}

        {/* Tenant Selection / ID */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Tenant <span className="text-red-500">*</span>
          </span>
          {tenants.length > 0 ? (
            <select
              required
              name="id"
              value={formData.id}
              onChange={handleChange}
              className="rounded-xl border px-3 py-2 outline-none"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}
            >
              <option value="">-- Select a Tenant --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName || t.name || t.email} ({t.id})
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder={loadingTenants ? "Loading tenants..." : "Enter Tenant User ID"}
              className="rounded-xl border px-3 py-2 outline-none"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}
            />
          )}
        </label>

        {/* Lease Start Date */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Lease Start Date <span className="text-red-500">*</span>
          </span>
          <input
            required
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        {/* Lease End Date */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Lease End Date <span className="text-red-500">*</span>
          </span>
          <input
            required
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        {/* Monthly Rent */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Monthly Rent <span className="text-red-500">*</span>
          </span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            name="monthly_rent"
            value={formData.monthly_rent}
            onChange={handleChange}
            placeholder="0.00"
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        {/* Optional: Leave Date */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Leave Date (Optional)
          </span>
          <input
            type="date"
            name="leave_date"
            value={formData.leave_date}
            onChange={handleChange}
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        {/* Optional: Deposit Return Amount */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Deposit Return (Optional)
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            name="deposit_return_amount"
            value={formData.deposit_return_amount}
            onChange={handleChange}
            placeholder="0.00"
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        {/* Optional: Forwarding Address */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Forwarding Address (Optional)
          </span>
          <input
            type="text"
            name="forwarding_address"
            value={formData.forwarding_address}
            onChange={handleChange}
            placeholder="Address for post-lease communication"
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        {/* Optional: Leave Reason */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Leave Reason (Optional)
          </span>
          <input
            type="text"
            name="leave_reason"
            value={formData.leave_reason}
            onChange={handleChange}
            placeholder="Reason for leaving"
            className="rounded-xl border px-3 py-2 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>

        {/* Optional: Move Out Notes */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase app-text-muted">
            Move Out Notes (Optional)
          </span>
          <textarea
            name="move_out_notes"
            rows={2}
            value={formData.move_out_notes}
            onChange={handleChange}
            placeholder="Any additional move out details"
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
