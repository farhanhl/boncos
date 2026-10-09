"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // Refresh at most once every 24 hours
const STORAGE_KEY = "boncos_last_session_refresh";

/**
 * Client-side background session refresher.
 * When a user is logged in, this silently renews the 14-day server session cookie
 * once per day, making active sessions seamlessly permanent without requiring re-login.
 */
export function SessionRefresher() {
  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const lastRefreshStr = localStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        if (lastRefreshStr) {
          const lastRefresh = parseInt(lastRefreshStr, 10);
          if (now - lastRefresh < REFRESH_INTERVAL_MS) {
            return;
          }
        }

        const idToken = await user.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, rememberMe: true }),
        });

        if (res.ok) {
          localStorage.setItem(STORAGE_KEY, String(now));
        }
      } catch {
        // Silent background execution: do not interrupt user
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
