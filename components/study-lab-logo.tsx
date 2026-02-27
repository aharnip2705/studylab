"use client";

import Link from "next/link";

interface StudyLabLogoProps {
  /** Sidebar/collapsed modda link olmadan, sadece metin */
  href?: string;
  /** Pro kullanıcılar için gradient PRO etiketi göster */
  showProBadge?: boolean;
  /** Boyut: sm | md | lg */
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
  size = "md",
  className = "",
}: StudyLabLogoProps) {
  const content = (
    <span
      className={`inline-flex items-center gap-2 font-sans tracking-tight antialiased ${sizeClasses[size]} ${className}`}
    >
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
