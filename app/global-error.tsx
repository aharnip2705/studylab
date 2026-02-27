"use client";

import { useEffect } from "react";

function isSupabaseConfigError(error: Error): boolean {
  return error?.message?.includes("Supabase") ?? false;
}

export default function GlobalError({
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
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          backgroundColor: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          color: "#0f172a",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          {isConfigError ? "Yapılandırma eksik" : "Bir hata oluştu"}
        </h1>
        <p
          style={{
            maxWidth: "32rem",
            textAlign: "center",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {isConfigError ? (
            <>
              Supabase ortam değişkenleri tanımlı değil. Vercel deploy için{" "}
              <strong>Settings → Environment Variables</strong> bölümüne{" "}
              <code
                style={{
                  padding: "0.125rem 0.25rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "#e2e8f0",
                }}
              >
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              ve{" "}
              <code
                style={{
                  padding: "0.125rem 0.25rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "#e2e8f0",
                }}
              >
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              ekleyin.
            </>
          ) : (
            "Uygulama yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin."
          )}
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Tekrar Dene
        </button>
        <a href="/" style={{ fontSize: "0.875rem", color: "#2563eb" }}>
          Anasayfaya dön
        </a>
      </body>
    </html>
  );
}
