"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import userPreferences from "@/config/user-preferences.json";
import { APP_ROUTES } from "@/config/routes";

const defaults = userPreferences.defaultSettings;

export default function SettingsPage() {
  const [isDark, setIsDark] = React.useState(false);
  const router = useRouter();
  const { status } = useSession();

  const [currency, setCurrency] = React.useState(defaults.currency);
  const [language, setLanguage] = React.useState(defaults.language);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
    }
  }, [status, router]);

  React.useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/v1/user-settings", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load settings.");
        }

        const payload = await response.json();

        if (!cancelled) {
          setCurrency(payload.currency || defaults.currency);
          setLanguage(payload.language || defaults.language);
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
  }, [status]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/v1/user-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency, language }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Could not save settings.");
      }

      setSuccess("Settings updated.");
    } catch (submitError) {
      setError(submitError.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <main className='min-h-screen p-8' style={{ color: "var(--text)" }}>
        Checking session...
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className='min-h-screen p-8' style={{ color: "var(--text)" }}>
        Redirecting to login...
      </main>
    );
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <main
      className='min-h-screen'
      style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className='mx-auto max-w-3xl space-y-6 p-6 sm:p-8'>
        <section>
          <h1 className='text-3xl font-black'>User Settings</h1>
          <p className='mt-1 app-text-muted'>
            Set your preferred currency now. Language will be used by translated
            UI copy in future pages.
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
          <div>
            <label
              htmlFor='currency'
              className='mb-1 block text-sm font-semibold'>
              Currency
            </label>
            <select
              id='currency'
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              disabled={loading || saving}
              className='w-full rounded-lg border px-3 py-2 text-sm'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
              }}>
              {userPreferences.currencies.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* <div>
            <label htmlFor='language' className='mb-1 block text-sm font-semibold'>
              Language
            </label>
            <select
              id='language'
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={loading || saving}
              className='w-full rounded-lg border px-3 py-2 text-sm'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
              }}>
              {userPreferences.languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div> */}

          {error ? (
            <p className='text-sm [color:var(--danger)]'>{error}</p>
          ) : null}
          {success ? (
            <p className='text-sm' style={{ color: "var(--success)" }}>
              {success}
            </p>
          ) : null}
          <div className='flex items-end gap-2'>
            <button
              type='submit'
              disabled={loading || saving}
              className='rounded-full px-5 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60'
              style={{
                background:
                  "linear-gradient(90deg, var(--accent), var(--primary))",
              }}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {/* <button
              type='button'
              onClick={toggleTheme}
              className='rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110'
              style={{
                background:
                  "linear-gradient(90deg, var(--accent), var(--primary))",
              }}>
              {isDark ? "Switch to Light" : "Switch to Dark"}
            </button> */}
          </div>
        </form>
      </div>
    </main>
  );
}
