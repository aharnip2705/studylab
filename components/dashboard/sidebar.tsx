"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, PlusCircle, BarChart2, PlayCircle, Settings, PanelLeftClose, PanelLeft, Timer, X, ClipboardList, CreditCard } from "lucide-react";
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

const navItems = [
  { href: "/dashboard", label: "Haftalık Plan", icon: CalendarDays },
  { href: "/dashboard/gorev-ekle", label: "Görev Ekle", icon: PlusCircle },
  { href: "/dashboard/konu-takip", label: "Konularım/Kaynaklarım", icon: ClipboardList },
  { href: "/dashboard/istatistikler", label: "İstatistikler", icon: BarChart2 },
  { href: "/dashboard/videolar", label: "Video Dersler", icon: PlayCircle },
  { href: "/dashboard/sayac", label: "Pomodoro / Sayaç", icon: Timer },
  { href: "/dashboard/ayarlar", label: "Ayarlar", icon: Settings },
  { href: "/plans", label: "Abonelik", icon: CreditCard },
];

export function DashboardSidebar({ user }: { user?: User | null }) {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const firstName = getFirstName(fullName) || "Kullanıcı";
  const greeting = getGreeting();
  const { data: subscription } = useSubscription();

  const sub = subscription?.subscription;
  const isAdmin = subscription?.isAdmin ?? false;
  const proActive = subscription?.proActive ?? false;
  const plan = sub?.plan ?? "free";
  const isStandard = plan === "standard" || plan === "standard_trial";
  const showProBadge = proActive || isAdmin;
  const showStandardBadge = !showProBadge && isStandard;

  return (
    <>
      {/* Mobil menü overlay - sadece md altında */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        >
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="animate-slide-in-from-left absolute left-0 top-0 h-full w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <StudyLabLogo
                  href="/dashboard"
                  size="md"
                  showProBadge={showProBadge}
                  showStandardBadge={showStandardBadge}
                />
                <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {greeting}, {firstName}
              </p>
            </div>
            <nav className="space-y-0.5 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? "bg-slate-200 text-slate-900 dark:bg-slate-700/50 dark:text-slate-200" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 md:flex ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className={`flex h-20 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
        {!collapsed && (
          <StudyLabLogo
            href="/dashboard"
            size="md"
            showProBadge={showProBadge}
            showStandardBadge={showStandardBadge}
          />
        )}
        <button
          type="button"
          onClick={toggle}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 ${!collapsed ? "ml-auto" : ""}`}
          title={collapsed ? "Menüyü aç" : "Menüyü kapat"}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              scroll={false}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] ${
                collapsed ? "justify-center px-0" : ""
              } ${
                isActive
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={`shrink-0 border-t border-slate-200 dark:border-slate-800 ${collapsed ? "px-2 py-3" : "px-4 py-3"}`}>
        <a
          href="mailto:iletisim@studylab.tr"
          className="flex items-center gap-2 text-xs text-slate-400 opacity-70 transition-opacity duration-300 hover:opacity-100 dark:text-slate-500"
          title="iletisim@studylab.tr"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          {!collapsed && <span>iletisim@studylab.tr</span>}
        </a>
      </div>
    </aside>
    </>
  );
}
