"use client";

import { useState } from "react";
import Link from "next/link";

export default function NotifyPaymentPage() {
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function handleReceiptChange(event) {
    const file = event.target.files?.[0] || null;
    setReceiptFile(file);
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!receiptFile) {
      setMessage("Please upload a receipt before sending the notification.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      // Keep multipart payload ready for future API wiring.
      await new Promise((resolve) => setTimeout(resolve, 900));
      setMessage("Payment notification sent with receipt attached.");
      form.reset();
      setReceiptFile(null);
      formData.delete("receipt");
    } catch {
      setMessage("Unable to send notification right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
      <section
        className='rounded-3xl border p-6 sm:p-8'
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          boxShadow: "var(--shadow)",
        }}>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p
              className='inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider'
              style={{
                borderColor: "var(--border)",
                color: "var(--accent-2)",
                backgroundColor: "var(--surface-2)",
              }}>
              Payment Notify
            </p>
            <h1 className='mt-4 text-3xl font-black sm:text-4xl'>
              Notify Tenant Of Payment
            </h1>
            <p className='mt-2 max-w-2xl app-text-muted'>
              Send a payment update with an attached receipt so tenants can keep
              a full record.
            </p>
          </div>

          <Link
            href='/Payments'
            className='rounded-full border px-4 py-2 text-sm font-semibold'
            style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Back To Payments
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2'
          encType='multipart/form-data'>
          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-semibold'>Tenant Name</span>
            <input
              required
              name='tenantName'
              type='text'
              placeholder='Jane Smith'
              className='rounded-xl border px-3 py-2 outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
              }}
            />
          </label>

          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-semibold'>Apartment / Unit</span>
            <input
              required
              name='unit'
              type='text'
              placeholder='Building A - Unit 204'
              className='rounded-xl border px-3 py-2 outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
              }}
            />
          </label>

          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-semibold'>Amount Paid</span>
            <input
              required
              min='0'
              step='0.01'
              name='amount'
              type='number'
              placeholder='1200.00'
              className='rounded-xl border px-3 py-2 outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
              }}
            />
          </label>

          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-semibold'>Payment Date</span>
            <input
              required
              name='paymentDate'
              type='date'
              className='rounded-xl border px-3 py-2 outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
              }}
            />
          </label>

          <label className='md:col-span-2 flex flex-col gap-1.5'>
            <span className='text-sm font-semibold'>Receipt Upload</span>
            <input
              required
              name='receipt'
              type='file'
              accept='.pdf,.png,.jpg,.jpeg,.webp'
              onChange={handleReceiptChange}
              className='rounded-xl border px-3 py-2 file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:font-semibold'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
              }}
            />
            <span className='text-xs app-text-muted'>
              Accepted formats: PDF, PNG, JPG, JPEG, WEBP.
            </span>
            {receiptFile ? (
              <span className='text-xs font-semibold' style={{ color: "var(--success)" }}>
                Selected receipt: {receiptFile.name}
              </span>
            ) : null}
          </label>

          <label className='md:col-span-2 flex flex-col gap-1.5'>
            <span className='text-sm font-semibold'>Message (Optional)</span>
            <textarea
              name='notes'
              rows={4}
              placeholder='Payment received. Thank you.'
              className='rounded-xl border px-3 py-2 outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
              }}
            />
          </label>

          <div className='md:col-span-2 flex flex-wrap items-center gap-3'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
              style={{
                background:
                  "linear-gradient(90deg, var(--accent), var(--primary))",
              }}>
              {isSubmitting ? "Sending..." : "Send Payment Notification"}
            </button>

            {message ? (
              <p className='text-sm app-text-muted'>
                {message}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
