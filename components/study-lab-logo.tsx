"use client";

import Link from "next/link";

interface StudyLabLogoProps {
  href?: string;
  /** Pro kullanıcılar için gradient PRO etiketi göster */
  showProBadge?: boolean;
  /** Standart paket kullanıcıları için */
  showStandardBadge?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export function StudyLabLogo({
  href,
  showProBadge = false,
  showStandardBadge = false,
  size = "md",
  className = "",
}: StudyLabLogoProps) {
  const content = (
    <span
      className={`inline-flex flex-col items-start gap-0 font-sans tracking-tight antialiased ${sizeClasses[size]} ${className}`}
    >
      <span className="flex items-center gap-2">
        <span>
          <span className="font-light text-slate-600 dark:text-slate-400">Study</span>
          <span className="font-bold bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent dark:from-indigo-400 dark:via-indigo-300 dark:to-emerald-400">
            Lab
          </span>
        </span>
        {showProBadge && (
          <span className="rounded-md bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/25">
            PRO
          </span>
        )}
        {!showProBadge && showStandardBadge && (
          <span className="rounded-md border border-indigo-300/60 bg-gradient-to-r from-indigo-100 to-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:border-indigo-600/60 dark:from-indigo-900/50 dark:to-violet-900/50 dark:text-indigo-300">
            STANDART
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
