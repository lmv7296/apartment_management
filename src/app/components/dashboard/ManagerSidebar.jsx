"use client";

import Link from "next/link";

function IconGrid(props) {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' {...props}>
      <path d='M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
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
  { key: "leases", label: "Leases", href: "/Maintenance", Icon: IconDoc },
  { key: "finances", label: "Finances", href: "/Payments", Icon: IconCash },
  { key: "messages", label: "Messages", href: "/Settings", Icon: IconChat },
];

export default function ManagerSidebar({ activeItem = "dashboard" }) {
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
          const active = key === activeItem;
          return (
            <Link
              key={key}
              href={href}
              className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors'
              style={
                active
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
        <Link
          href='/Settings'
          className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900'>
          <IconSettings className='h-4 w-4' />
          Support
        </Link>
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
