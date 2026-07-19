"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/session-store";

export function useLoadSession() {
  const setSession = useSessionStore((s) => s.setSession);
  const loaded = useSessionStore((s) => s.loaded);

  useEffect(() => {
    if (loaded) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { role: "admin" | "cliente" | null; profile: unknown }) => {
        setSession(data.role, data.profile as never);
      })
      .catch(() => setSession(null, null));
  }, [loaded, setSession]);
}
