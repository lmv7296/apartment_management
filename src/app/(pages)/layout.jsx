"use client";

import { useSession } from "@/app/providers";
import { usePathname } from "next/navigation";
import ManagerSidebar from "@/app/components/dashboard/ManagerSidebar";

const SIDEBAR_ROUTE_KEYS = [
  ["/Dashboard", "dashboard"],
  ["/Properties", "properties"],
  ["/Maintenance", "leases"],
  ["/Payments", "finances"],
  ["/Settings", "messages"],
];

function getActiveSidebarItem(pathname) {
  for (const [prefix, key] of SIDEBAR_ROUTE_KEYS) {
    if (pathname.startsWith(prefix)) {
      return key;
    }
  }
  return "dashboard";
}

export default function PagesLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = String(session?.user?.role || "").toLowerCase();
  const isManager = status === "authenticated" && role === "manager";

  if (!isManager) {
    return children;
  }

  return (
    <div className='h-full lg:pl-[210px]'>
      <ManagerSidebar activeItem={getActiveSidebarItem(pathname)} />
      <div className='min-w-0'>{children}</div>
    </div>
  );
}
