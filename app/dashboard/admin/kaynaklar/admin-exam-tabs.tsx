"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "YKS", label: "YKS", color: "indigo" },
  { key: "LGS", label: "LGS", color: "emerald" },
  { key: "KPSS", label: "KPSS", color: "amber" },
] as const;

export function AdminExamTabs({ activeExam }: { activeExam: "YKS" | "LGS" | "KPSS" }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/50">
      {TABS.map((tab) => {
        const isActive = activeExam === tab.key;
        return (
          <Link
            key={tab.key}
            href={`${pathname}?exam=${tab.key}`}
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-all duration-200 ${
              isActive
                ? tab.color === "indigo"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : tab.color === "emerald"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-amber-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
