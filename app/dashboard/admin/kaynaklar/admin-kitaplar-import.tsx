"use client";

import { useState } from "react";
import { importKitaplarFromJson } from "@/lib/actions/admin-resources";
import { Download, Loader2 } from "lucide-react";

export function AdminKitaplarImport() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    alreadyExists: number;
    publishersCreated: number;
    firstError?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await importKitaplarFromJson();
    setLoading(false);
    if ("error" in res) setError(res.error);
    else if (res.success) setResult(res);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
        Bot verilerini içe aktar
      </h3>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">kitaplar.json</code> dosyasındaki
        scraped kaynakları panele ekler. Önce proje klasöründe{" "}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run scrape</code> çalıştırın.
      </p>
      <button
        type="button"
        onClick={handleImport}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {loading ? "İçe aktarılıyor…" : "İçe Aktar"}
      </button>
      {error && (
        <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 space-y-2">
          <p className="rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <strong>{result.imported}</strong> kaynak eklendi.
            {result.alreadyExists > 0 && (
              <> <strong>{result.alreadyExists}</strong> zaten mevcut. </>
            )}
            {result.skipped > 0 && (
              <> <strong>{result.skipped}</strong> hata nedeniyle atlandı. </>
            )}
            {result.publishersCreated > 0 && (
              <> <strong>{result.publishersCreated}</strong> yeni yayın evi oluşturuldu. </>
            )}
          </p>
          {result.firstError && (
            <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              İlk hata: {result.firstError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
