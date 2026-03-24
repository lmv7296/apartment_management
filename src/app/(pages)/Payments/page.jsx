import Link from "next/link";

export default function Payments() {
  return (
    <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
      <section
        className='rounded-3xl border p-6 sm:p-8'
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          boxShadow: "var(--shadow)",
        }}>
        <p
          className='inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider'
          style={{
            borderColor: "var(--border)",
            color: "var(--accent-2)",
            backgroundColor: "var(--surface-2)",
          }}>
          Payments
        </p>
        <h1 className='mt-4 text-3xl font-black sm:text-4xl'>
          Payment Operations
        </h1>
        <p className='mt-3 max-w-2xl app-text-muted'>
          Send payment reminders and keep tenants informed before due dates.
        </p>

        <div className='mt-6'>
          <Link
            href='/Payments/notify'
            className='inline-flex rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110'
            style={{
              background:
                "linear-gradient(90deg, var(--accent), var(--primary))",
            }}>
            Go To Payment Notify Page
          </Link>
        </div>
      </section>
    </main>
  );
}
