"use client";

import { useState, useEffect } from "react";

const EXAM_DATE = new Date(2026, 5, 20); // 20 Haziran 2026

export function HeaderCountdownRadial() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    function update() {
      const now = new Date();
      const diff = EXAM_DATE.getTime() - now.getTime();
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
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 dark:border-slate-600">
        <span className="text-xs font-medium text-slate-400">...</span>
      </div>
    );
  }

  // r=30, viewBox=80x80, center=(40,40)
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const totalSecondsInDay = 86400;
  const secondsElapsedToday = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  const progress = 1 - secondsElapsedToday / totalSecondsInDay;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center"
      title="YKS 2026'ya kalan süre"
    >
      <svg
        className="h-20 w-20 -rotate-90"
        viewBox="0 0 80 80"
        aria-hidden
      >
        <defs>
          <linearGradient id="countdown-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(210 80% 55%)" />
            <stop offset="50%" stopColor="hsl(260 70% 60%)" />
            <stop offset="100%" stopColor="hsl(290 70% 55%)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-200/40 dark:text-slate-600/50"
        />
        {/* Progress */}
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#countdown-ring-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums leading-tight text-slate-900 dark:text-white">
          {timeLeft.days}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 leading-none">
          gün
        </span>
        <span className="mt-0.5 text-[10px] font-medium tabular-nums leading-tight text-slate-500 dark:text-slate-400">
          {String(timeLeft.hours).padStart(2, "0")}:
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
