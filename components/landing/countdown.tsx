"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const target = new Date(2026, 5, 20); // 20 Haziran 2026

    function update() {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (timeLeft === null) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200">YKS 2026&apos;ya son</p>
        <div className="flex gap-2 sm:gap-4">
          {["Gün", "Saat", "Dakika", "Saniye"].map((label) => (
            <div key={label} className="h-16 w-14 sm:h-20 sm:w-16 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 flex flex-col items-center justify-center animate-pulse">
              <span className="text-xl font-bold text-slate-400">--</span>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">20-21 Haziran 2026</p>
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: "Gün" },
    { value: timeLeft.hours, label: "Saat" },
    { value: timeLeft.minutes, label: "Dakika" },
    { value: timeLeft.seconds, label: "Saniye" },
  ] as const;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200">YKS 2026&apos;ya son</p>
      <div className="flex gap-2 sm:gap-4">
        {units.map(({ value, label }) => (
          <div
            key={label}
            className={cn(
              "flex flex-col items-center justify-center h-16 w-14 sm:h-20 sm:w-16 rounded-xl",
              "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-600/80 shadow-lg"
            )}
          >
            <span className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">20-21 Haziran 2026</p>
    </div>
  );
}
