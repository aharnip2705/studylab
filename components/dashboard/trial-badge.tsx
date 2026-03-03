"use client";

import { useState } from "react";
import Link from "next/link";
import { useSubscription } from "@/lib/swr/hooks";

function getTrialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function TrialBadge() {
  const [isHovered, setIsHovered] = useState(false);
  const { data } = useSubscription();

  const sub = data?.subscription;
  const plan = sub?.plan;
  const isTrial = plan === "pro_trial" || plan === "standard_trial";
  const trialEndsAt = sub?.trial_ends_at ?? null;
  const daysLeft = getTrialDaysLeft(trialEndsAt);

  if (!isTrial || daysLeft === null) return null;

  const label = plan === "pro_trial" ? "Pro" : "Standart";
  const defaultText = `${label} Deneme: ${daysLeft} Gün Kaldı`;
  const hoverText = "Yükselt / Planları İncele";

  return (
    <Link
      href="/plans"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex min-w-0 items-center gap-2 rounded-full border border-white/20 bg-white/60 px-4 py-2 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary-200 hover:bg-white/85 hover:shadow-lg dark:border-slate-600/40 dark:bg-slate-800/60 dark:hover:border-primary-800 dark:hover:bg-slate-800/85"
    >
      <span className="relative grid min-w-[180px] place-items-center">
        <span
          className={`col-start-1 row-start-1 block text-nowrap text-sm font-medium text-slate-700 transition-opacity duration-300 dark:text-slate-200 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        >
          {defaultText}
        </span>
        <span
          className={`col-start-1 row-start-1 block text-nowrap text-sm font-semibold text-primary-600 transition-opacity duration-300 dark:text-primary-400 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {hoverText}
        </span>
      </span>
      <svg
        className="h-4 w-4 shrink-0 text-slate-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary-500"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
}
