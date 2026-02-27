"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = useCallback(() => setCollapsed((p) => !p), []);
  return (
    <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}
