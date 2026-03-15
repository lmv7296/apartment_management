"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import LogoMark from "./logo-mark";

export default function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header
      className='sticky top-0 z-50 border-b backdrop-blur'
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-4'>
          <div className='md:hidden'>
            <LogoMark size='md' variant='monogram' />
          </div>
          <div className='hidden items-center gap-2 md:flex'>
            <LogoMark size='md' variant='monogram' />
          </div>
          <div>
            <h1 className='text-lg font-black tracking-tight sm:text-2xl'>
              Apartment Manager
            </h1>
            <p className='app-text-muted hidden text-[11px] uppercase tracking-[0.18em] sm:block'>
              Portfolio Management Platform
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 md:hidden'>
          {isAuthenticated ? (
            <button
              type='button'
              onClick={() => signOut({ callbackUrl: "/" })}
              className='rounded-full px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110'
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in oklab, var(--danger) 85%, #ffffff 0%), color-mix(in oklab, var(--warning) 75%, #ffffff 0%))",
              }}>
              Sign out
            </button>
          ) : (
            <Link
              href='/Login'
              onClick={closeMobileMenu}
              className='rounded-full px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110'
              style={{
                background:
                  "linear-gradient(90deg, var(--accent), var(--primary))",
              }}>
              Sign in
            </Link>
          )}

          {isAuthenticated ? (
            <button
              type='button'
              aria-label='Toggle navigation menu'
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className='rounded-lg border px-2.5 py-1.5 text-sm font-bold'
              style={{
                borderColor: "var(--border)",
                color: "var(--text)",
                backgroundColor: "var(--surface)",
              }}>
              {isMobileMenuOpen ? "Close" : "Menu"}
            </button>
          ) : null}
        </div>

        <nav
          className='hidden items-center gap-2 rounded-full border p-1.5 md:flex'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            boxShadow: "var(--shadow)",
          }}>
          {isAuthenticated ? (
            <Link
              href='/Dashboard'
              className='rounded-full px-4 py-2 text-sm font-semibold transition'
              style={{ color: "var(--text)" }}>
              Dashboard
            </Link>
          ) : (
            <Link
              href='/'
              className='rounded-full px-4 py-2 text-sm font-semibold transition'
              style={{ color: "var(--text)" }}>
              Home
            </Link>
          )}

          <div
            className='mx-1 h-6 w-px'
            style={{ backgroundColor: "var(--border)" }}
          />

          {isAuthenticated ? (
            <>
              <span
                className='hidden rounded-full px-3 py-2 text-sm sm:block'
                style={{
                  backgroundColor: "var(--surface-2)",
                  color: "var(--text)",
                }}>
                {session?.user?.name}
              </span>
              <button
                type='button'
                onClick={() => signOut({ callbackUrl: "/" })}
                className='rounded-full px-5 py-2 text-sm font-bold text-white transition hover:brightness-110'
                style={{
                  background:
                    "linear-gradient(90deg, color-mix(in oklab, var(--danger) 85%, #ffffff 0%), color-mix(in oklab, var(--warning) 75%, #ffffff 0%))",
                }}>
                Sign out
              </button>
            </>
          ) : (
            <Link
              href='/Login'
              className='rounded-full px-5 py-2 text-sm font-bold text-white transition hover:brightness-110'
              style={{
                background:
                  "linear-gradient(90deg, var(--accent), var(--primary))",
              }}>
              Sign in
            </Link>
          )}
        </nav>
      </div>

      {isAuthenticated && isMobileMenuOpen ? (
        <div
          className='border-t px-4 pb-4 pt-3 md:hidden'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          <div className='flex flex-col gap-2'>
            <Link
              href='/'
              onClick={closeMobileMenu}
              className='rounded-lg px-3 py-2 text-sm font-semibold'
              style={{
                color: "var(--text)",
                backgroundColor: "var(--surface-2)",
              }}>
              Home
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href='/Dashboard'
                  onClick={closeMobileMenu}
                  className='rounded-lg px-3 py-2 text-sm font-semibold'
                  style={{
                    color: "var(--text)",
                    backgroundColor: "var(--surface-2)",
                  }}>
                  Dashboard
                </Link>
                <p className='px-1 text-xs app-text-muted'>
                  Signed in as {session?.user?.name}
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
