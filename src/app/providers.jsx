"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const SessionContext = createContext({ data: null, status: "loading" });

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");

export default function Providers({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function loadSession(sbSession) {
      if (!sbSession) {
        if (!cancelled) {
          setSession(null);
          setStatus("unauthenticated");
        }
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${sbSession.access_token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user profile from backend API");
        }
        const profilePayload = await response.json();
        
        // Map backend response structure { id, email, profile: { id, company_id, role, name, unit_id } }
        // to frontend session user object
        const profile = profilePayload.profile || {};

        if (!cancelled) {
          setSession({
            user: {
              id: profilePayload.id || sbSession.user.id,
              email: profilePayload.email || sbSession.user.email,
              name: profile.name || profilePayload.email || sbSession.user.email,
              role: profile.role || "tenant",
              company_id: profile.company_id || null,
              unit_id: profile.unit_id || null,
            },
          });
          setStatus("authenticated");
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
        if (!cancelled) {
          setSession({
            user: {
              id: sbSession.user.id,
              email: sbSession.user.email,
              name: sbSession.user.email,
              role: "tenant",
              company_id: null,
              unit_id: null,
            },
          });
          setStatus("authenticated");
        }
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
      loadSession(sbSession);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sbSession) => {
      loadSession(sbSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ data: session, status }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/Login";
}
