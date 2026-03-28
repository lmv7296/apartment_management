"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { APP_ROUTES } from "@/config/routes";

export default function ApartmentsPage() {
  const { Apartmentsm, setApartments } = React.useState([]);
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
    }
  }, [status, router]);

  // Fetch apartments data from the API when the component mounts
  React.useEffect(() => {
    async function fetchApartments() {
      try {
        const response = await fetch("/api/v1/apartments");
        if (!response.ok) {
          throw new Error("Failed to fetch apartments");
        }
        const data = await response.json();
        setApartments(data);
      } catch (error) {
        console.error("Error fetching apartments:", error);
      }
    }

    fetchApartments();
  }, []);

  return (
    <>
      <ul>
        {Apartmentsm.map((apartment) => (
          <li key={apartment.id}>{apartment.name}</li>
        ))}
      </ul>
    </>
  );
}
