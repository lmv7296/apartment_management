"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const SessionContext = createContext({ data: null, status: "loading" });

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
        // Fetch additional profile data from users table
        const { data: profile, error } = await supabase
          .from("users")
          .select("id, company_id, role, unit_id, name")
          .eq("id", sbSession.user.id)
          .single();

        if (!cancelled) {
          if (profile) {
            setSession({
              user: {
                id: sbSession.user.id,
                email: sbSession.user.email,
                name: profile.name || sbSession.user.email,
                role: profile.role || "tenant",
                company_id: profile.company_id || null,
                unit_id: profile.unit_id || null,
              },
            });
          } else {
            // Fallback if profile row is not found yet
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
          }
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
