"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/providers";
import userPreferences from "@/config/user-preferences.json";
import { APP_ROUTES } from "@/config/routes";

const defaults = userPreferences.defaultSettings;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [currency, setCurrency] = useState(defaults.currency);
  const [language, setLanguage] = useState(defaults.language);
  const [unitPrefix, setUnitPrefix] = useState(defaults.unitPrefix || "Unit");
  const [unitCount, setUnitCount] = useState(String(defaults.unitCount ?? 0));
  const [areaUnit, setAreaUnit] = useState("sq ft");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/user-settings`, {
          cache: "no-store",
          headers: {
            "x-user-id": session.user.id,
          },
        });

        if (!response.ok) {
          throw new Error("Could not load settings.");
        }

        const payload = await response.json();

        if (!cancelled) {
          setCurrency(payload.currency || defaults.currency);
          setLanguage(payload.language || defaults.language);
          setUnitPrefix(payload.unitPrefix ?? defaults.unitPrefix ?? "Unit");
          setUnitCount(String(payload.unitCount ?? defaults.unitCount ?? 0));
          setAreaUnit(payload.areaUnit || payload.area_unit || "sq ft");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Could not load settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const parsedUnitCount = Number.parseInt(unitCount || "0", 10);

    if (Number.isNaN(parsedUnitCount) || parsedUnitCount < 0) {
      setSaving(false);
      setError("Unit count must be a non-negative number.");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/user-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
        },
        body: JSON.stringify({
          currency,
          language,
          unitPrefix,
          unitCount: parsedUnitCount,
          areaUnit,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Could not save settings.");
      }

      setSuccess("Settings updated successfully.");
    } catch (submitError) {
      setError(submitError.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Loading settings…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Account Preferences
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">
            User Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure currency, measurement units, and default property preferences.
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            <svg className="h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Settings Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Preferred Currency */}
            <div>
              <label htmlFor="currency" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:opacity-50"
              >
                {userPreferences.currencies.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Area Unit */}
            <div>
              <label htmlFor="areaUnit" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Area Unit
              </label>
              <select
                id="areaUnit"
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:opacity-50"
              >
                <option value="sq ft">Square Feet (sq ft)</option>
                <option value="m²">Square Meters (m²)</option>
                <option value="sq m">Square Meters (sq m)</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-400">
                Used to display unit measurements across properties.
              </p>
            </div>

            {/* Preferred Unit Prefix */}
            <div>
              <label htmlFor="unitPrefix" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Preferred Unit Prefix
              </label>
              <select
                id="unitPrefix"
                value={unitPrefix}
                onChange={(e) => setUnitPrefix(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:opacity-50"
              >
                {userPreferences.unitPrefixes.map((item) => (
                  <option key={item.code || "none"} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Default Unit Count */}
            <div>
              <label htmlFor="unitCount" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Preferred Default Unit Count
              </label>
              <input
                id="unitCount"
                type="number"
                min="0"
                step="1"
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:opacity-50"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Pre-fills total units when creating a new property.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
