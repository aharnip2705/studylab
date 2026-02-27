"use client";

import { useEffect, useState } from "react";

// Standart renkler - tonlara göre ayrılmadan, düz liste + Özel
const STANDARD_COLORS: { id: string; name: string; value: string }[] = [
  { id: "red", name: "Kırmızı", value: "#ef4444" },
  { id: "orange", name: "Turuncu", value: "#f97316" },
  { id: "amber", name: "Amber", value: "#f59e0b" },
  { id: "yellow", name: "Sarı", value: "#eab308" },
  { id: "lime", name: "Limon", value: "#84cc16" },
  { id: "green", name: "Yeşil", value: "#22c55e" },
  { id: "emerald", name: "Zümrüt", value: "#10b981" },
  { id: "teal", name: "Teal", value: "#14b8a6" },
  { id: "cyan", name: "Turkuaz", value: "#06b6d4" },
  { id: "sky", name: "Gök Mavisi", value: "#0ea5e9" },
  { id: "blue", name: "Mavi", value: "#3b82f6" },
  { id: "indigo", name: "Çivit", value: "#6366f1" },
  { id: "violet", name: "Mor", value: "#8b5cf6" },
  { id: "purple", name: "Menekşe", value: "#a855f7" },
  { id: "fuchsia", name: "Fuşya", value: "#d946ef" },
  { id: "pink", name: "Pembe", value: "#ec4899" },
  { id: "rose", name: "Gül", value: "#f43f5e" },
  { id: "slate", name: "Gri", value: "#64748b" },
  { id: "black", name: "Siyah", value: "#000000" },
  { id: "white", name: "Beyaz", value: "#ffffff" },
];

const GRID_COLS = 10;
const BG_KEY = "yks-bg-settings";

export function getBgSettings() {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(BG_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function BackgroundSettings() {
  const [mounted, setMounted] = useState(false);
  const [bgType, setBgType] = useState("none");
  const [bgValue, setBgValue] = useState("");
  const [bgOpacity, setBgOpacity] = useState(100);
  const [bgBlur, setBgBlur] = useState(0);
  const [customColor, setCustomColor] = useState("#64748b");
  const [imageUrlInput, setImageUrlInput] = useState("");

  useEffect(() => {
    setMounted(true);
    const s = getBgSettings();
    if (s) {
      setBgType(s.type ?? "none");
      setBgValue(s.value ?? "");
      setImageUrlInput(s.type === "image" ? s.value ?? "" : "");
      setBgOpacity(s.opacity ?? 100);
      setBgBlur(s.blur ?? 0);
      if (s.value && s.type === "solid") setCustomColor(s.value);
    }
  }, []);

  function save(updates: Record<string, unknown>) {
    const next = {
      type: updates.type ?? bgType,
      value: updates.value ?? bgValue,
      opacity: updates.opacity ?? bgOpacity,
      blur: updates.blur ?? bgBlur,
    };
    setBgType(next.type as string);
    setBgValue(next.value as string);
    if (next.type === "image") setImageUrlInput((next.value as string) || "");
    setBgOpacity(next.opacity as number);
    setBgBlur(next.blur as number);
    localStorage.setItem(BG_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("bg-settings-change"));
  }

  function handleApplyImageUrl() {
    const url = imageUrlInput.trim();
    if (!url) return;
    save({ type: "image", value: url });
  }

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      {/* Standart renkler + Özel */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Düz renk</p>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
          >
            {STANDARD_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => save({ type: "solid", value: c.value })}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  c.value === "#ffffff" ? "border-slate-300 dark:border-slate-600" : "border-slate-300 dark:border-slate-600"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 pl-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-7 w-8 cursor-pointer shrink-0 border-0 bg-transparent p-0"
            />
            <button
              type="button"
              onClick={() => save({ type: "solid", value: customColor })}
              className="rounded-r-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Özel
            </button>
          </div>
        </div>
      </div>

      {/* Akışkan temalar - çeşitli, beyaz yok */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Akışkan gradient</p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "blue-violet", name: "Mavi-Mor", gradient: "linear-gradient(135deg, hsl(210 45% 35%) 0%, hsl(280 40% 30%) 100%)" },
            { id: "emerald-teal", name: "Yeşil-Teal", gradient: "linear-gradient(135deg, hsl(160 45% 30%) 0%, hsl(190 50% 28%) 100%)" },
            { id: "amber-rose", name: "Amber-Gül", gradient: "linear-gradient(135deg, hsl(35 55% 35%) 0%, hsl(330 50% 30%) 100%)" },
            { id: "violet-fuchsia", name: "Mor-Fuşya", gradient: "linear-gradient(135deg, hsl(265 50% 32%) 0%, hsl(320 55% 28%) 100%)" },
            { id: "slate-indigo", name: "Indigo", gradient: "linear-gradient(135deg, hsl(220 35% 25%) 0%, hsl(260 45% 22%) 100%)" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => save({ type: "fluid", value: f.id })}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 dark:border-slate-600 ${
                bgType === "fluid" && bgValue === f.id ? "ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900" : "border-slate-300"
              }`}
              style={{ background: f.gradient }}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* URL ile arka plan */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Özel görsel URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="button"
            onClick={handleApplyImageUrl}
            disabled={!imageUrlInput.trim()}
            className="shrink-0 rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500 dark:bg-slate-500 dark:hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Saydamlık ve bulanıklık */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Saydamlık: %{bgOpacity}</label>
        <input type="range" min={10} max={100} value={bgOpacity} onChange={(e) => save({ opacity: Number(e.target.value) })} className="w-full" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Bulanıklık: {bgBlur}px</label>
        <input type="range" min={0} max={24} value={bgBlur} onChange={(e) => save({ blur: Number(e.target.value) })} className="w-full" />
      </div>

      {/* Arka planı kaldır */}
      <div>
        <button
          type="button"
          onClick={() => save({ type: "none", value: "" })}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Arka planı kaldır
        </button>
      </div>
    </div>
  );
}
