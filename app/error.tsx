"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

function isSupabaseConfigError(error: Error): boolean {
  return error?.message?.includes("Supabase") ?? false;
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConfigError = isSupabaseConfigError(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 dark:bg-slate-950">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        {isConfigError ? "Yapılandırma eksik" : "Bir hata oluştu"}
      </h1>
      <p className="max-w-lg text-center text-slate-600 dark:text-slate-400">
        {isConfigError ? (
          <>
            Supabase ortam değişkenleri tanımlı değil. Vercel deploy için{" "}
            <strong>Settings → Environment Variables</strong> bölümüne{" "}
            <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            ve{" "}
            <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            ekleyin. Lokal geliştirme için proje kökünde{" "}
            <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
              .env.local
            </code>{" "}
            dosyası oluşturun.
          </>
        ) : (
          "Sayfa yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."
        )}
      </p>
      <Button onClick={reset}>Tekrar Dene</Button>
      <a
        href="/"
        className="text-sm text-primary-600 hover:underline dark:text-primary-400"
      >
        Anasayfaya dön
      </a>
    </div>
  );
}
