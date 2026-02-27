"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, PlusCircle, BarChart2, PlayCircle, Settings, PanelLeftClose, PanelLeft, Timer, X } from "lucide-react";
import { useSidebar } from "./sidebar-provider";
import { StudyLabLogo } from "@/components/study-lab-logo";

const navItems = [
  { href: "/dashboard", label: "Haftalık Plan", icon: CalendarDays },
  { href: "/dashboard/gorev-ekle", label: "Görev Ekle", icon: PlusCircle },
  { href: "/dashboard/istatistikler", label: "İstatistikler", icon: BarChart2 },
  { href: "/dashboard/videolar", label: "Video Dersler", icon: PlayCircle },
  { href: "/dashboard/sayac", label: "Pomodoro / Sayaç", icon: Timer },
  { href: "/dashboard/ayarlar", label: "Ayarlar", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

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
            <div className="flex h-20 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
              <StudyLabLogo href="/dashboard" size="md" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
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
                      isActive ? "bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200" : "text-slate-700 dark:text-slate-300"
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
          <StudyLabLogo href="/dashboard" size="md" />
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
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
    </>
  );
}
