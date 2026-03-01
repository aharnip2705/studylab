"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateStudyField, updateTargetNets } from "@/lib/actions/profile";
import { STUDY_FIELD_OPTIONS, type StudyField } from "@/lib/study-field";
import { Button } from "@/components/ui/button";

interface ProfileAndFieldFormProps {
  fullName: string;
  email: string;
}

export function ProfileAndFieldForm({ fullName, email }: ProfileAndFieldFormProps) {
  const [studyField, setStudyField] = useState<StudyField | "">("");
  const [tytTarget, setTytTarget] = useState("");
  const [aytTarget, setAytTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const profile = await getProfile();
      const p = profile as { study_field?: StudyField; tyt_target_net?: number | null; ayt_target_net?: number | null } | null;
      setStudyField(p?.study_field ?? "esit_agirlik");
      setTytTarget(p?.tyt_target_net != null ? String(p.tyt_target_net) : "");
      setAytTarget(p?.ayt_target_net != null ? String(p.ayt_target_net) : "");
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!studyField) return;
    const tytNum =
      tytTarget !== "" ? Math.round(parseFloat(tytTarget) * 100) / 100 : null;
    const aytNum =
      aytTarget !== "" ? Math.round(parseFloat(aytTarget) * 100) / 100 : null;
    if (tytNum !== null && (tytNum <= 0 || tytNum > 120)) {
      setMessage({ type: "error", text: "TYT hedefi 0-120 arası olmalı." });
      return;
    }
    if (aytNum !== null && (aytNum <= 0 || aytNum > 80)) {
      setMessage({ type: "error", text: "AYT hedefi 0-80 arası olmalı." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const [r1, r2] = await Promise.all([
      updateStudyField(studyField as StudyField),
      updateTargetNets(tytNum, aytNum),
    ]);
    setSaving(false);
    if (r1.error || r2.error) {
      setMessage({ type: "error", text: r1.error ?? r2.error ?? "Hata oluştu" });
    } else {
      setMessage({ type: "success", text: "Ayarlar kaydedildi." });
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">Ad Soyad</label>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          {fullName || "—"}
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">E-posta</label>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          {email || "—"}
        </p>
        <p className="mt-1 text-xs text-slate-500">Ad soyad ve e-posta hesap oluşturulurken kaydedilir, değiştirilemez.</p>
      </div>
      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Alanınız Nedir?</h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Seçiminize göre panelde görünen dersler güncellenir.
        </p>
        <select
          value={studyField}
          onChange={(e) => setStudyField(e.target.value as StudyField)}
          className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          {STUDY_FIELD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Nihai Net Hedefleri</h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Her deneme eklerken hedef sorulmaz; buradan bir kez belirleyin.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">TYT Net Hedefi</label>
            <input
              type="number"
              min={0.25}
              max={120}
              step={0.25}
              value={tytTarget}
              onChange={(e) => setTytTarget(e.target.value)}
              onBlur={() => {
                if (tytTarget === "" || parseFloat(tytTarget) === 0 || tytTarget === "0") setTytTarget("");
                const n = parseFloat(tytTarget);
                if (!Number.isNaN(n) && n > 120) setTytTarget("120");
              }}
              placeholder="örn: 100"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">Maks 120 (0 girilemez)</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">AYT Net Hedefi</label>
            <input
              type="number"
              min={0.25}
              max={80}
              step={0.25}
              value={aytTarget}
              onChange={(e) => setAytTarget(e.target.value)}
              onBlur={() => {
                if (aytTarget === "" || parseFloat(aytTarget) === 0 || aytTarget === "0") setAytTarget("");
                const n = parseFloat(aytTarget);
                if (!Number.isNaN(n) && n > 80) setAytTarget("80");
              }}
              placeholder="örn: 60"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">Maks 80 (0 girilemez)</p>
          </div>
        </div>
      </div>
      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
