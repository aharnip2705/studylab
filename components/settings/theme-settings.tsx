"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BackgroundSettings } from "@/components/background-settings";

const themes = [
  { value: "light", label: "Açık" },
  { value: "dark", label: "Koyu" },
  { value: "system", label: "Sistem" },
];

export function ThemeSettings() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Uygulama görünümünü seçin.
      </p>
      <div className="flex flex-wrap gap-3">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              theme === t.value ? "bg-slate-600 text-white dark:bg-slate-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Arka plan</h3>
        <BackgroundSettings />
      </div>
    </div>
  );
}
