import { create } from "zustand";
import type { AdminUser, Cliente } from "@/types";

type SessionRole = "admin" | "cliente" | null;

interface SessionState {
  role: SessionRole;
  adminProfile: AdminUser | null;
  clienteProfile: Cliente | null;
  loaded: boolean;
  setSession: (role: SessionRole, profile: AdminUser | Cliente | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  role: null,
  adminProfile: null,
  clienteProfile: null,
  loaded: false,
  setSession: (role, profile) =>
    set({
      role,
      loaded: true,
      adminProfile: role === "admin" ? (profile as AdminUser) : null,
      clienteProfile: role === "cliente" ? (profile as Cliente) : null,
    }),
  clear: () => set({ role: null, adminProfile: null, clienteProfile: null, loaded: true }),
}));
