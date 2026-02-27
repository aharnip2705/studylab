"use client";

import { useSidebar } from "./sidebar-provider";

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col transition-[margin-left] duration-200 ease-out ${
        collapsed ? "md:ml-[72px]" : "md:ml-64"
      }`}
    >
      {children}
    </div>
  );
}
