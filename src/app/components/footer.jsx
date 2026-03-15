"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoMark from "./logo-mark";

export default function Footer() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <footer
      className='mt-12 border-t'
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className='mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3'>
          <LogoMark size='sm' />
          <div>
            <p
              className='text-sm font-semibold'
              style={{ color: "var(--text)" }}>
              Apartment Manager
            </p>
            <p className='text-xs app-text-muted'>
              © {new Date().getFullYear()} Apartment Management
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={toggleTheme}
            className='rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110'
            style={{
              background:
                "linear-gradient(90deg, var(--accent), var(--primary))",
            }}>
            {isDark ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
      </div>
    </footer>
  );
}
