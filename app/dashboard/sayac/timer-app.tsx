"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Play, Pause, RotateCcw, Flag, Palette } from "lucide-react";
import { usePomodoro } from "@/components/pomodoro/pomodoro-provider";

type Mode = "pomodoro" | "countdown" | "stopwatch";

const POMODORO_THEME_KEY = "yks-pomodoro-theme";

const THEMES: { id: string; name: string; bg: string; bgLight: string; accent: string }[] = [
  { id: "slate", name: "Slate", bg: "from-slate-600 to-slate-800", bgLight: "from-slate-200 to-slate-300", accent: "bg-slate-500" },
  { id: "blue", name: "Mavi", bg: "from-blue-600 to-blue-900", bgLight: "from-blue-200 to-blue-400", accent: "bg-blue-500" },
  { id: "emerald", name: "Yeşil", bg: "from-emerald-600 to-emerald-900", bgLight: "from-emerald-200 to-emerald-400", accent: "bg-emerald-500" },
  { id: "amber", name: "Amber", bg: "from-amber-600 to-amber-900", bgLight: "from-amber-200 to-amber-400", accent: "bg-amber-500" },
  { id: "rose", name: "Pembe", bg: "from-rose-600 to-rose-900", bgLight: "from-rose-200 to-rose-400", accent: "bg-rose-500" },
  { id: "violet", name: "Mor", bg: "from-violet-600 to-violet-900", bgLight: "from-violet-200 to-violet-400", accent: "bg-violet-500" },
  { id: "custom", name: "Özel", bg: "", bgLight: "", accent: "" },
];

function hexIsLight(hex: string): boolean {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return false;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function TimerApp() {
  const ctx = usePomodoro();
  const [themeId, setThemeId] = useState("blue");
  const [customColor, setCustomColor] = useState("#2563eb");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(POMODORO_THEME_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setThemeId(parsed.id ?? "blue");
        if (parsed.id === "custom" && parsed.color) setCustomColor(parsed.color);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function saveTheme(id: string, color?: string) {
    const payload = id === "custom" ? { id, color: color ?? customColor } : { id };
    localStorage.setItem(POMODORO_THEME_KEY, JSON.stringify(payload));
  }

  if (!ctx) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-slate-500">Pomodoro yükleniyor…</p>
      </div>
    );
  }

  const {
    state,
    setMode,
    setWorkMin,
    setShortBreakMin,
    setLongBreakMin,
    setCountdownMin,
    setCountdownSec,
    handleStartPause,
    handleReset,
    handleLap,
    formatTime,
  } = ctx;

  const mode = state.mode;
  const workMin = state.workMin;
  const shortBreakMin = state.shortBreakMin;
  const longBreakMin = state.longBreakMin;
  const countdownMin = state.countdownMin;
  const countdownSec = state.countdownSec;

  // Pomodoro input string states (to allow clearing/typing freely)
  const [workMinStr, setWorkMinStr] = useState(String(workMin));
  const [shortBreakStr, setShortBreakStr] = useState(String(shortBreakMin));
  const [longBreakStr, setLongBreakStr] = useState(String(longBreakMin));
  const [countdownMinStr, setCountdownMinStr] = useState(String(countdownMin));
  const [countdownSecStr, setCountdownSecStr] = useState(String(countdownSec));

  useEffect(() => { setWorkMinStr(String(workMin)); }, [workMin]);
  useEffect(() => { setShortBreakStr(String(shortBreakMin)); }, [shortBreakMin]);
  useEffect(() => { setLongBreakStr(String(longBreakMin)); }, [longBreakMin]);
  useEffect(() => { setCountdownMinStr(String(countdownMin)); }, [countdownMin]);
  useEffect(() => { setCountdownSecStr(String(countdownSec)); }, [countdownSec]);
  const secondsLeft = state.secondsLeft;
  const stopwatchSec = state.stopwatchSec;
  const isRunning = state.isRunning;
  const phase = state.phase;
  const laps = state.laps;

  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[1];
  const isCustom = themeId === "custom";
  const customIsLight = isCustom && hexIsLight(customColor);
  const useLightStyles = isLight && !isCustom ? true : isCustom && customIsLight;
  const gradientStyle = isCustom ? { background: customColor } : undefined;

  const displayTime =
    mode === "stopwatch" ? formatTime(stopwatchSec) : formatTime(secondsLeft);

  const containerClass = useLightStyles
    ? "rounded-2xl p-8 text-slate-900 shadow-xl"
    : "rounded-2xl p-8 text-white shadow-xl";
  const bgClass = !isCustom
    ? `bg-gradient-to-br ${isLight ? theme.bgLight : theme.bg}`
    : "";

  return (
    <div
      className={`${containerClass} ${bgClass}`}
      style={gradientStyle}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {(["pomodoro", "countdown", "stopwatch"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? useLightStyles ? "bg-slate-300/60" : "bg-white/20"
                : useLightStyles ? "bg-slate-200/50 hover:bg-slate-300/50" : "bg-white/10 hover:bg-white/15"
            }`}
          >
            {m === "pomodoro" ? "Pomodoro" : m === "countdown" ? "Geri Sayım" : "Kronometre"}
          </button>
        ))}
      </div>

      {mode === "pomodoro" && (
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span>Çalışma (dk):</span>
            <input
              type="text"
              inputMode="numeric"
              value={workMinStr}
              onChange={(e) => setWorkMinStr(e.target.value.replace(/\D/g, ""))}
              onBlur={() => { const v = Math.max(1, Math.min(60, Number(workMinStr) || 1)); setWorkMin(v); setWorkMinStr(String(v)); }}
              disabled={isRunning}
              className={`w-16 rounded px-2 py-1 text-center ${useLightStyles ? "bg-slate-300/60" : "bg-white/20"}`}
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Kısa mola (dk):</span>
            <input
              type="text"
              inputMode="numeric"
              value={shortBreakStr}
              onChange={(e) => setShortBreakStr(e.target.value.replace(/\D/g, ""))}
              onBlur={() => { const v = Math.max(1, Math.min(30, Number(shortBreakStr) || 1)); setShortBreakMin(v); setShortBreakStr(String(v)); }}
              disabled={isRunning}
              className={`w-16 rounded px-2 py-1 text-center ${useLightStyles ? "bg-slate-300/60" : "bg-white/20"}`}
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Uzun mola (dk):</span>
            <input
              type="text"
              inputMode="numeric"
              value={longBreakStr}
              onChange={(e) => setLongBreakStr(e.target.value.replace(/\D/g, ""))}
              onBlur={() => { const v = Math.max(1, Math.min(60, Number(longBreakStr) || 1)); setLongBreakMin(v); setLongBreakStr(String(v)); }}
              disabled={isRunning}
              className={`w-16 rounded px-2 py-1 text-center ${useLightStyles ? "bg-slate-300/60" : "bg-white/20"}`}
            />
          </label>
          {phase !== "work" && (
            <span className={`rounded px-3 py-1 ${useLightStyles ? "bg-slate-300/60" : "bg-white/20"}`}>
              {phase === "shortBreak" ? "Kısa mola" : "Uzun mola"}
            </span>
          )}
        </div>
      )}

      {mode === "countdown" && (
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span>Dakika:</span>
            <input
              type="text"
              inputMode="numeric"
              value={countdownMinStr}
              onChange={(e) => setCountdownMinStr(e.target.value.replace(/\D/g, ""))}
              onBlur={() => { const v = Math.max(0, Math.min(99, Number(countdownMinStr) || 0)); setCountdownMin(v); setCountdownMinStr(String(v)); }}
              disabled={isRunning}
              className={`w-16 rounded px-2 py-1 text-center ${useLightStyles ? "bg-slate-300/60" : "bg-white/20"}`}
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Saniye:</span>
            <input
              type="text"
              inputMode="numeric"
              value={countdownSecStr}
              onChange={(e) => setCountdownSecStr(e.target.value.replace(/\D/g, ""))}
              onBlur={() => { const v = Math.max(0, Math.min(59, Number(countdownSecStr) || 0)); setCountdownSec(v); setCountdownSecStr(String(v)); }}
              disabled={isRunning}
              className={`w-16 rounded px-2 py-1 text-center ${useLightStyles ? "bg-slate-300/60" : "bg-white/20"}`}
            />
          </label>
        </div>
      )}

      <div className="mb-8 text-center">
        <p className="text-7xl font-bold tabular-nums tracking-wider">{displayTime}</p>
      </div>

      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (mode === "countdown") {
              (document.activeElement as HTMLInputElement | null)?.blur();
              const m = Math.max(0, Math.min(99, Number(countdownMinStr) || 0));
              const s = Math.max(0, Math.min(59, Number(countdownSecStr) || 0));
              setCountdownMin(m);
              setCountdownMinStr(String(m));
              setCountdownSec(s);
              setCountdownSecStr(String(s));
              setTimeout(() => handleStartPause(), 0);
            } else {
              handleStartPause();
            }
          }}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium ${useLightStyles ? "bg-slate-300/60 hover:bg-slate-400/60" : "bg-white/20 hover:bg-white/30"}`}
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isRunning ? "Duraklat" : "Başlat"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium ${useLightStyles ? "bg-slate-300/60 hover:bg-slate-400/60" : "bg-white/20 hover:bg-white/30"}`}
        >
          <RotateCcw className="h-5 w-5" />
          Sıfırla
        </button>
        {mode === "stopwatch" && (
          <button
            type="button"
            onClick={handleLap}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium ${useLightStyles ? "bg-slate-300/60 hover:bg-slate-400/60" : "bg-white/20 hover:bg-white/30"}`}
          >
            <Flag className="h-5 w-5" />
            Tur
          </button>
        )}
      </div>

      {mode === "stopwatch" && laps.length > 0 && (
        <div className={`mt-6 max-h-32 overflow-y-auto rounded-lg p-4 ${useLightStyles ? "bg-slate-300/40" : "bg-white/10"}`}>
          <p className="mb-2 text-sm font-medium">Turlar</p>
          <div className="space-y-1 text-sm">
            {laps.map((lap, i) => (
              <div key={i} className="flex justify-between">
                <span>Tur {i + 1}</span>
                <span>{formatTime(lap)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`mt-8 border-t pt-6 ${useLightStyles ? "border-slate-400/40" : "border-white/20"}`}>
        <p className="mb-2 flex items-center gap-2 text-sm font-medium opacity-90">
          <Palette className="h-4 w-4" />
          Pomodoro renkleri
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {THEMES.filter((t) => t.id !== "custom").map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setThemeId(t.id);
                setShowCustomPicker(false);
                saveTheme(t.id);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                themeId === t.id
                  ? useLightStyles ? "bg-slate-400/70" : "bg-white/30"
                  : useLightStyles ? "bg-slate-300/50 hover:bg-slate-400/50" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {t.name}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setThemeId("custom");
                setShowCustomPicker(true);
                saveTheme("custom", customColor);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                themeId === "custom"
                  ? useLightStyles ? "bg-slate-400/70" : "bg-white/30"
                  : useLightStyles ? "bg-slate-300/50 hover:bg-slate-400/50" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Özel
            </button>
            {showCustomPicker && (
              <div className={`flex items-center gap-2 rounded-lg p-2 ${useLightStyles ? "bg-slate-300/50" : "bg-white/10"}`}>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCustomColor(c);
                    saveTheme("custom", c);
                  }}
                  className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(v) || /^[0-9A-Fa-f]{6}$/.test(v)) {
                      const hex = v.startsWith("#") ? v : `#${v}`;
                      setCustomColor(hex);
                      saveTheme("custom", hex);
                    }
                  }}
                  className={`w-20 rounded px-2 py-1 text-xs ${useLightStyles ? "bg-slate-300/60 text-slate-900" : "bg-white/20"}`}
                  placeholder="#2563eb"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
