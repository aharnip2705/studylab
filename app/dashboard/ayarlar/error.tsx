"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AyarlarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ayarlar error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-slate-600 dark:text-slate-400">
        Ayarlar yüklenirken bir sorun oluştu.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Tekrar Dene</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard&apos;a Dön</Link>
        </Button>
      </div>
    </div>
  );
}
