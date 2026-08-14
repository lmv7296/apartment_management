"use client";

import React from "react";
import ManagerDashboard from "./managerDashboard";
import TenantDashboard from "./tenantDashboard";
import { useSession } from "@/app/providers";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/config/routes";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
    }
  }, [status, router]);

  const role = String(session?.user?.role || "tenant").toLowerCase();

  if (status === "loading") {
    return null;
  }


  if (role === "manager") {
    
    return <ManagerDashboard />;
  }

  return <TenantDashboard />;
}
