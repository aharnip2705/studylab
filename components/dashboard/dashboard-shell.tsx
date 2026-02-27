"use client";

import type { User } from "@supabase/supabase-js";
import { SidebarProvider } from "./sidebar-provider";
import { BackgroundProvider } from "@/components/background-provider";
import { PomodoroProvider } from "@/components/pomodoro/pomodoro-provider";
import { SWRProvider } from "@/components/swr-provider";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";
import { DashboardContent } from "./dashboard-content";

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <SWRProvider>
    <BackgroundProvider>
    <PomodoroProvider>
    <SidebarProvider>
      <div className="dashboard-main-bg flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardSidebar />
        <DashboardContent>
          <DashboardHeader user={user} />
          <main className="flex-1 p-6">{children}</main>
        </DashboardContent>
      </div>
    </SidebarProvider>
    </PomodoroProvider>
    </BackgroundProvider>
    </SWRProvider>
  );
}
