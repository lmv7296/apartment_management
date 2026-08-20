"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import IconConstruction from "@/utils/icons/IconConstruction";
import IconGrid from "@/utils/icons/IconGrid";
import IconBuilding from "@/utils/icons/IconBuilding";
import IconCash from "@/utils/icons/IconCash";
import IconChat from "@/utils/icons/IconChat";
import IconSettings from "@/utils/icons/IconSettings";
import IconDoc from "@/utils/icons/IconDoc";
import IconUser from "@/utils/icons/IconUser"
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/Dashboard", Icon: IconGrid },
  {
    key: "properties",
    label: "Properties",
    href: "/Properties",
    Icon: IconBuilding,
  },
  {key: " Tenants " , label:"Tenants", href: "/Tenants", Icon: IconUser},
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
