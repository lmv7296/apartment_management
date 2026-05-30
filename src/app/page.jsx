"use client";

import Link from "next/link";
import React from "react";
import { useSession } from "next-auth/react";
import { APP_ROUTES } from "@/config/routes";
import { useRouter } from "next/navigation";

const featurePillars = [
  {
    id: 1,
    title: "Leasing Control Center",
    desc: "Track leases, renewals, and expiring agreements in one timeline.",
    metric: "98% on-time renewals",
  },
  {
    id: 2,
    title: "Maintenance Command",
    desc: "Prioritize tickets by urgency, assign vendors, and watch SLA health.",
    metric: "2.1 day avg resolution",
  },
  {
    id: 3,
    title: "Tenant Relationship Hub",
    desc: "Unify communication, payment history, and documents per resident.",
    metric: "All tenant history searchable",
  },
  {
    id: 4,
    title: "Revenue Visibility",
    desc: "See collected rent, delinquency risk, and cash movement in real-time.",
    metric: "Live payment tracking",
  },
];

const highlights = [
  { id: 1, label: "Units Managed", value: "1,240+" },
  { id: 2, label: "Monthly Collections", value: "$2.8M" },
  { id: 3, label: "Avg Occupancy", value: "94.6%" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace(APP_ROUTES.dashboard);
      return;
    }
  }, [status, router]);
  return (
    <main className='mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8'>
      <section
        className='relative overflow-hidden rounded-3xl border p-8 sm:p-12'
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(140deg, color-mix(in oklab, var(--surface) 92%, var(--accent) 8%), var(--surface))",
          boxShadow: "var(--shadow)",
        }}>
        <div className='max-w-3xl'>
          <p
            className='mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider'
            style={{
              borderColor: "var(--border)",
              color: "var(--accent-2)",
              backgroundColor: "var(--surface-2)",
            }}>
            Built for Multi-Property Teams
          </p>

          <h1 className='text-4xl font-black leading-tight sm:text-5xl'>
            Run Every Building Like One Cohesive Operation
          </h1>

          <p className='mt-4 max-w-2xl text-base sm:text-lg app-text-muted'>
            Apartment Manager gives owners and operators one command layer for
            leasing, maintenance, tenant communication, and rent performance.
          </p>

          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              href='/Dashboard'
              className='rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110'
              style={{
                background:
                  "linear-gradient(90deg, var(--accent), var(--primary))",
              }}>
              Open Dashboard
            </Link>
            <Link
              href='/Login'
              className='rounded-full border px-5 py-2.5 text-sm font-bold'
              style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              Sign In
            </Link>
          </div>

          <div className='mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {highlights.map((item) => (
              <div
                key={item.id}
                className='rounded-2xl border p-4'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                }}>
                <p className='text-xs uppercase tracking-wide app-text-muted'>
                  {item.label}
                </p>
                <p className='mt-1 text-2xl font-black'>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {featurePillars.map((pillar) => (
          <article
            key={pillar.id}
            className='rounded-2xl border p-5'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              boxShadow: "var(--shadow)",
            }}>
            <h2 className='text-xl font-bold'>{pillar.title}</h2>
            <p className='mt-2 text-sm app-text-muted'>{pillar.desc}</p>
            <p
              className='mt-4 text-sm font-semibold'
              style={{ color: "var(--accent)" }}>
              {pillar.metric}
            </p>
          </article>
        ))}
      </section>

      <section
        className='rounded-3xl border px-6 py-8 text-center sm:px-10'
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          boxShadow: "var(--shadow)",
        }}>
        <h2 className='text-2xl font-black sm:text-3xl'>
          Ready to simplify operations this month?
        </h2>
        <p className='mx-auto mt-3 max-w-2xl app-text-muted'>
          Start with one building or your full portfolio. Keep your team aligned
          on what matters most: occupancy, resident satisfaction, and cash flow.
        </p>
        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Link
            href='/Dashboard'
            className='rounded-full px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110'
            style={{
              background:
                "linear-gradient(90deg, var(--accent-2), var(--primary))",
            }}>
            View Product
          </Link>
          <Link
            href='/Login'
            className='rounded-full border px-6 py-2.5 text-sm font-bold'
            style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Access Portal
          </Link>
        </div>
      </section>
    </main>
  );
}
