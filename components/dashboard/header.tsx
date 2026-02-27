"use client";

import { User } from "@supabase/supabase-js";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { HeaderCountdownRadial } from "./header-countdown-radial";
import { useSidebar } from "./sidebar-provider";
import { StudyLabLogo } from "@/components/study-lab-logo";
import { useSubscription } from "@/lib/swr/hooks";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Günaydın";
  if (h >= 12 && h < 17) return "İyi günler";
  if (h >= 17 && h < 21) return "İyi akşamlar";
  return "İyi geceler";
}

function getFirstName(fullName: string): string {
  const trimmed = fullName?.trim() || "";
  return trimmed.split(/\s+/)[0] || trimmed;
}

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
  const firstName = getFirstName(fullName) || "Kullanıcı";
  const greeting = getGreeting();
  const { setMobileOpen } = useSidebar();
  const { data: subscription } = useSubscription();
  const proActive = subscription?.proActive ?? false;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/70 px-6 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/60">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-800/80"
          title="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </button>
        <StudyLabLogo href="/dashboard" showProBadge={proActive} size="md" />
        <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-500">
          {greeting}, {firstName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <HeaderCountdownRadial />
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
