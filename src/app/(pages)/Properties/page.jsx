"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PropertiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  //logic for checking if logged in and redirecting to login if not
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/Login");
    }
  }, [status, router]);

  React.useEffect(() => {}, []);

  return (
    <>
      <h1>Properties</h1>
    </>
  );
}
