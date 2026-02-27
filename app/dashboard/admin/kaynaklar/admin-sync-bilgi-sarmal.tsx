"use client";

import { useState } from "react";
import { syncResourcePublishersAndIcons } from "@/lib/actions/admin-resources";
import { RefreshCw, Loader2 } from "lucide-react";

export function AdminSyncBilgiSarmal() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    nameMatchesUpdated: number;
    iconsUpdated: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await syncResourcePublishersAndIcons();
    setLoading(false);
    if ("error" in res) setError(res.error);
    else if (res.success) setResult(res);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
        Yayınevi eşleştirme ve görseller
      </h3>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Kaynak isimlerinde geçen yayınevi adlarını otomatik eşleştirir (örn. isimde &quot;Karekök&quot;
        varsa yayınevi Karekök yapılır). Yeni gelen kaynaklar dahil tüm kaynakların görselini
        yayınevlerinin logosu ile günceller.
      </p>
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {loading ? "Güncelleniyor…" : "Yayınevlerini Eşleştir ve Görselleri Güncelle"}
      </button>
      {error && (
        <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      )}
      {result && (
        <p className="mt-4 rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
          <strong>{result.nameMatchesUpdated}</strong> kaynağın yayınevi isme göre eşleştirildi.
          <strong className="ml-1">{result.iconsUpdated}</strong> kaynağın görseli yayınevi logosu ile
          güncellendi.
        </p>
      )}
    </div>
  );
}
