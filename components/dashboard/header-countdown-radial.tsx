"use client";

import { useState, useEffect, useMemo } from "react";
import { useProfile } from "@/lib/swr/hooks";
import { getTargetExamDate, getCountdownValues } from "@/lib/exam-dates";

export function HeaderCountdownRadial() {
  const { data: profile } = useProfile();
  const [now, setNow] = useState<Date | null>(null);

  const target = useMemo(() => {
    if (!profile?.exam_type || !profile.target_year) return null;
    return getTargetExamDate(
      profile.exam_type,
      profile.study_field ?? null,
      profile.target_year
    );
  }, [profile?.exam_type, profile?.study_field, profile?.target_year]);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now || !target) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 dark:border-slate-600">
        <span className="text-xs font-medium text-slate-400">...</span>
      </div>
    );
  }

  const countdown = getCountdownValues(target.date);
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const totalSecondsInDay = 86400;
  const secondsElapsedToday =
    countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
  const progress = 1 - secondsElapsedToday / totalSecondsInDay;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center"
      title={`${target.label}'a kalan süre`}
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
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-200/40 dark:text-slate-600/50"
        />
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

      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums leading-tight text-slate-900 dark:text-white">
          {countdown.days}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 leading-none">
          gün
        </span>
        <span className="mt-0.5 text-[10px] font-medium tabular-nums leading-tight text-slate-500 dark:text-slate-400">
          {String(countdown.hours).padStart(2, "0")}:
          {String(countdown.minutes).padStart(2, "0")}:
          {String(countdown.seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
