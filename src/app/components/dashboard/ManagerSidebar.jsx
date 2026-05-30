"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconGrid(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path d='M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
    </svg>
  );
}
function IconConstruction(props) {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' {...props}>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M3.13861 8.5856C3.10395 8.79352 3.07799 8.98444 3.05852 9.15412C2.89911 9.20305 2.72733 9.2683 2.55279 9.35557C2.18416 9.53989 1.78511 9.83206 1.48045 10.2891C1.17162 10.7523 1 11.325 1 12C1 12.675 1.17162 13.2477 1.48045 13.7109C1.78511 14.1679 2.18416 14.4601 2.55279 14.6444C2.72733 14.7317 2.89911 14.7969 3.05852 14.8459C3.07798 15.0156 3.10395 15.2065 3.13861 15.4144C3.27452 16.2299 3.54822 17.3325 4.10557 18.4472C4.66489 19.5658 5.51956 20.7149 6.8203 21.5821C8.1273 22.4534 9.82502 23 12 23C14.175 23 15.8727 22.4534 17.1797 21.5821C18.4804 20.7149 19.3351 19.5658 19.8944 18.4472C20.4518 17.3325 20.7255 16.2299 20.8614 15.4144C20.896 15.2065 20.922 15.0156 20.9415 14.8459C21.1009 14.7969 21.2727 14.7317 21.4472 14.6444C21.8158 14.4601 22.2149 14.1679 22.5196 13.7109C22.8284 13.2477 23 12.675 23 12C23 11.325 22.8284 10.7523 22.5196 10.2891C22.2149 9.83206 21.8158 9.53989 21.4472 9.35557C21.2727 9.2683 21.1009 9.20305 20.9415 9.15412C20.922 8.98444 20.896 8.79352 20.8614 8.5856C20.7255 7.77011 20.4518 6.6675 19.8944 5.55278C19.3351 4.43416 18.4804 3.28511 17.1797 2.41795C15.8727 1.54662 14.175 1 12 1C9.82502 1 8.1273 1.54662 6.8203 2.41795C5.51957 3.28511 4.66489 4.43416 4.10558 5.55279C3.54822 6.6675 3.27452 7.77011 3.13861 8.5856ZM18.9025 15H5.09753C5.20639 15.692 5.43305 16.63 5.89443 17.5528C6.33511 18.4342 6.98044 19.2851 7.9297 19.9179C8.8727 20.5466 10.175 21 12 21C13.825 21 15.1273 20.5466 16.0703 19.9179C17.0196 19.2851 17.6649 18.4342 18.1056 17.5528C18.5669 16.63 18.7936 15.692 18.9025 15ZM18.9025 9H18C17.4477 9 17 9.44771 17 10C17 10.5523 17.4477 11 18 11H20C20.3084 11.012 20.6759 11.1291 20.8554 11.3984C20.9216 11.4977 21 11.675 21 12C21 12.325 20.9216 12.5023 20.8554 12.6016C20.6759 12.8709 20.3084 12.988 20 13H4C3.69155 12.988 3.32414 12.8709 3.14455 12.6016C3.07838 12.5023 3 12.325 3 12C3 11.675 3.07838 11.4977 3.14455 11.3984C3.32414 11.1291 3.69155 11.012 4 11H6C6.55228 11 7 10.5523 7 10C7 9.44771 6.55228 9 6 9H5.09753C5.20639 8.30804 5.43306 7.36996 5.89443 6.44721C6.33512 5.56584 6.98044 4.71489 7.92971 4.08205C8.24443 3.87224 8.59917 3.68195 9 3.52152V6C9 6.55228 9.44771 7 10 7C10.5523 7 11 6.55228 11 6V3.04872C11.3146 3.01691 11.6476 3 12 3C12.3524 3 12.6854 3.01691 13 3.04872V6C13 6.55228 13.4477 7 14 7C14.5523 7 15 6.55228 15 6V3.52152C15.4008 3.68195 15.7556 3.87224 16.0703 4.08205C17.0196 4.71489 17.6649 5.56584 18.1056 6.44721C18.5669 7.36996 18.7936 8.30804 18.9025 9Z'
      />
    </svg>
  );
}

function IconBuilding(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path
        fillRule='evenodd'
        d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm0 6h2v2H7v-2zm4 0h2v2h-2v-2z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function IconDoc(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path
        fillRule='evenodd'
        d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function IconCash(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path d='M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z' />
    </svg>
  );
}

function IconChat(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path
        fillRule='evenodd'
        d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function IconSettings(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path
        fillRule='evenodd'
        d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
        clipRule='evenodd'
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/Dashboard", Icon: IconGrid },
  {
    key: "properties",
    label: "Properties",
    href: "/Properties",
    Icon: IconBuilding,
  },
  // { key: "leases", label: "Leases", href: "/Maintenance", Icon: IconDoc },
  // { key: "finances", label: "Finances", href: "/Payments", Icon: IconCash },
  // { key: "messages", label: "Messages", href: "/Settings", Icon: IconChat },
  {
    key: "Construction",
    label: "Construction",
    href: "/Construction",
    Icon: IconConstruction,
  },
];

export default function ManagerSidebar({ activeItem = "dashboard" }) {
  const pathname = usePathname();

  return (
    <aside
      className='fixed inset-y-0 left-0 z-40 hidden w-[210px] flex-col overflow-y-auto border-r bg-white py-6 lg:flex'
      style={{ borderColor: "#dde5f0" }}>
      <div className='mb-8 px-5'>
        <div className='flex items-center gap-2'>
          <div
            className='flex h-8 w-8 items-center justify-center rounded-lg text-white'
            style={{
              background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
            }}>
            <IconBuilding className='h-4 w-4' />
          </div>
          <div>
            <p className='text-[13px] font-black leading-none text-slate-900'>
              Curator Pro
            </p>
            <p className='mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400'>
              Property Management
            </p>
          </div>
        </div>
      </div>

      <nav className='flex-1 space-y-0.5 px-3'>
        {NAV_ITEMS.map(({ key, label, href, Icon }) => {
          // const active = key === activeItem || pathname === href;
          const isActive =
            pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={key}
              href={href}
              className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors'
              style={
                isActive
                  ? { backgroundColor: "#eff6ff", color: "#1d4ed8" }
                  : { color: "#64748b" }
              }>
              <Icon className='h-4 w-4 shrink-0' />
              {label}
            </Link>
          );
        })}
      </nav>

      <div
        className='space-y-0.5 border-t px-3 pt-4'
        style={{ borderColor: "#dde5f0" }}>
        {/* <Link
          href='/Settings'
          className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900'>
          <IconSettings className='h-4 w-4' />
          Support
        </Link> */}
        <Link
          href='/Settings'
          className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900'>
          <IconSettings className='h-4 w-4' />
          Settings
        </Link>
      </div>
    </aside>
  );
}
