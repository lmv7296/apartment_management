"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import LogoMark from "./logo-mark";

function IconMail(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
      <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
    </svg>
  );
}

function IconBell(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
    </svg>
  );
}

function MobileNav({ isOpen, onClose, session, onSignOut }) {
  return isOpen ? (
    <div
      className='border-t px-4 pb-4 pt-3 md:hidden'
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}>
      <div
        className='mb-4 flex items-center gap-3 rounded-xl border p-3'
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-2)",
        }}>
        <div
          className='flex h-10 w-10 items-center justify-center rounded-lg'
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
          }}>
          <svg
            className='h-6 w-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
            />
          </svg>
        </div>
        <div className='flex-1'>
          <p className='text-xs uppercase tracking-wide app-text-muted'>
            Signed in as
          </p>
          <p className='text-sm font-semibold'>{session?.user?.name}</p>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <Link
          href='/Dashboard'
          onClick={onClose}
          className='rounded-lg px-3 py-2 text-sm font-semibold'
          style={{
            color: "var(--text)",
            backgroundColor: "var(--surface-2)",
          }}>
          Dashboard
        </Link>
        <Link
          href='/Settings'
          onClick={onClose}
          className='rounded-lg px-3 py-2 text-sm font-semibold'
          style={{
            color: "var(--text)",
            backgroundColor: "var(--surface-2)",
          }}>
          Settings
        </Link>
        <button
          type='button'
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className='rounded-lg px-3 py-2 text-left text-sm font-semibold'
          style={{
            color: "var(--danger)",
            backgroundColor: "var(--surface-2)",
          }}>
          Sign out
        </button>
      </div>
    </div>
  ) : null;
}

function AuthenticatedActions({ isMobileMenuOpen, onToggleMobileMenu }) {
  return (
    <button
      type='button'
      aria-label='Toggle navigation menu'
      onClick={onToggleMobileMenu}
      className='rounded-lg border px-2.5 py-1.5 text-sm font-bold'
      style={{
        borderColor: "var(--border)",
        color: "var(--text)",
        backgroundColor: "var(--surface)",
      }}>
      Menu
    </button>
  );
}

function UnauthenticatedActions({ onClose }) {
  return (
    <Link
      href='/Login'
      onClick={onClose}
      className='rounded-full px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110'
      style={{
        background: "linear-gradient(90deg, var(--accent), var(--primary))",
      }}>
      Sign in
    </Link>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isManager =
    isAuthenticated &&
    String(session?.user?.role || "").toLowerCase() === "manager";
  const firstName = String(session?.user?.name || "").split(" ")[0];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  if (isManager) {
    return (
      <header
        className='sticky top-0 z-50 flex shrink-0 items-center justify-between gap-4 border-b bg-white px-6 py-3 lg:ml-[210px] lg:w-[calc(100%-210px)]'
        style={{ borderColor: "#dde5f0" }}>
        <div className='flex items-center gap-4'>
          {session?.user?.company_name ? (
            <p className='hidden text-sm font-black text-slate-900 lg:block'>
              {session.user.company_name}
            </p>
          ) : null}
          <div className='relative hidden sm:block'>
            <svg
              className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400'
              viewBox='0 0 20 20'
              fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                clipRule='evenodd'
              />
            </svg>
            <input
              type='text'
              placeholder='Search portfolios...'
              className='w-52 rounded-full border bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-200'
              style={{ borderColor: "#dde5f0" }}
            />
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            aria-label='Messages'
            className='rounded-lg p-2 text-slate-500 hover:bg-slate-100'>
            <IconMail className='h-5 w-5' />
          </button>
          <button
            type='button'
            aria-label='Notifications'
            className='relative rounded-lg p-2 text-slate-500 hover:bg-slate-100'>
            <IconBell className='h-5 w-5' />
          </button>
          <Link
            href='/Properties'
            className='rounded-lg px-4 py-2 text-sm font-bold text-white'
            style={{ backgroundColor: "#0f172a" }}>
            Add Property
          </Link>

          {/* Avatar dropdown */}
          <div className='relative' ref={profileMenuRef}>
            <button
              type='button'
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              className='flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-300 text-xs font-bold text-slate-700'>
              {firstName[0]}
            </button>

            {isProfileMenuOpen ? (
              <div
                className='absolute right-0 mt-2 w-52 rounded-xl border p-1.5'
                style={{
                  borderColor: "#dde5f0",
                  backgroundColor: "#fff",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  zIndex: 60,
                }}>
                <div
                  className='mb-2 rounded-lg border p-3'
                  style={{
                    borderColor: "#dde5f0",
                    backgroundColor: "#f8fafc",
                  }}>
                  <p className='text-[10px] font-bold uppercase tracking-wide text-slate-400'>
                    Signed in as
                  </p>
                  <p className='mt-0.5 text-sm font-semibold text-slate-900'>
                    {session?.user?.name}
                  </p>
                  {session?.user?.company_name ? (
                    <p className='text-xs text-slate-500'>
                      {session.user.company_name}
                    </p>
                  ) : null}
                </div>
                <Link
                  href='/Settings'
                  onClick={() => setIsProfileMenuOpen(false)}
                  className='block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100'>
                  Settings
                </Link>
                <button
                  type='button'
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    signOut({ callbackUrl: "/Login" });
                  }}
                  className='mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold'
                  style={{ color: "#dc2626", backgroundColor: "#fff5f5" }}>
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    );
  } else {
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
              <AuthenticatedActions
                isMobileMenuOpen={isMobileMenuOpen}
                onToggleMobileMenu={() =>
                  setIsMobileMenuOpen((current) => !current)
                }
              />
            ) : (
              <UnauthenticatedActions onClose={closeMobileMenu} />
            )}
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
              <div className='relative' ref={profileMenuRef}>
                <button
                  type='button'
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  className='hidden rounded-full px-3 py-2 text-sm font-semibold sm:inline-flex sm:items-center sm:gap-2'
                  style={{
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text)",
                  }}>
                  <div
                    className='flex h-6 w-6 items-center justify-center rounded-md'
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "white",
                    }}>
                    <svg
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      />
                    </svg>
                  </div>
                  <span>{session?.user?.name}</span>
                  <span aria-hidden='true'>
                    {isProfileMenuOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isProfileMenuOpen ? (
                  <div
                    className='absolute right-0 mt-2 w-56 rounded-xl border p-1.5'
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface)",
                      boxShadow: "var(--shadow)",
                    }}>
                    <div
                      className='mb-2 flex items-center gap-3 rounded-lg border p-3'
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--surface-2)",
                      }}>
                      <div
                        className='flex h-10 w-10 items-center justify-center rounded-lg'
                        style={{
                          backgroundColor: "var(--primary)",
                          color: "white",
                        }}>
                        <svg
                          className='h-6 w-6'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                          />
                        </svg>
                      </div>
                      <div className='flex-1'>
                        <p className='text-xs uppercase tracking-wide app-text-muted'>
                          Signed in as
                        </p>
                        <p className='text-sm font-semibold'>
                          {session?.user?.name}
                        </p>
                      </div>
                    </div>
                    <Link
                      href='/Settings'
                      onClick={() => setIsProfileMenuOpen(false)}
                      className='block rounded-lg px-3 py-2 text-sm font-semibold'
                      style={{
                        color: "var(--text)",
                        backgroundColor: "var(--surface-2)",
                      }}>
                      Settings
                    </Link>
                    <button
                      type='button'
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className='mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold'
                      style={{
                        color: "var(--danger)",
                        backgroundColor: "var(--surface-2)",
                      }}>
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
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
          <MobileNav
            isOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
            session={session}
            onSignOut={() => signOut({ callbackUrl: "/" })}
          />
        ) : null}
      </header>
    );
  }
}
