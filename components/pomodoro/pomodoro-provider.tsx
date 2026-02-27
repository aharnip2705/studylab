"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

const POMODORO_STORE_KEY = "yks-pomodoro-state";

interface PomodoroState {
  mode: "pomodoro" | "countdown" | "stopwatch";
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  countdownMin: number;
  countdownSec: number;
  secondsLeft: number;
  stopwatchSec: number;
  isRunning: boolean;
  phase: PomodoroPhase;
  cycle: number;
  laps: number[];
}

const defaultState: PomodoroState = {
  mode: "pomodoro",
  workMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  countdownMin: 10,
  countdownSec: 0,
  secondsLeft: 25 * 60,
  stopwatchSec: 0,
  isRunning: false,
  phase: "work",
  cycle: 0,
  laps: [],
};

function loadStored(): Partial<PomodoroState> {
  try {
    const raw = localStorage.getItem(POMODORO_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      workMin: Number(parsed.workMin) || 25,
      shortBreakMin: Number(parsed.shortBreakMin) || 5,
      longBreakMin: Number(parsed.longBreakMin) || 15,
      countdownMin: Number(parsed.countdownMin) || 10,
      countdownSec: Number(parsed.countdownSec) || 0,
      mode: (parsed.mode as PomodoroState["mode"]) || "pomodoro",
    };
  } catch {
    return {};
  }
}

function saveStored(s: PomodoroState) {
  try {
    localStorage.setItem(
      POMODORO_STORE_KEY,
      JSON.stringify({
        workMin: s.workMin,
        shortBreakMin: s.shortBreakMin,
        longBreakMin: s.longBreakMin,
        countdownMin: s.countdownMin,
        countdownSec: s.countdownSec,
        mode: s.mode,
      })
    );
  } catch {
    /* ignore */
  }
}

export type ToastMessage =
  | { type: "shortBreak"; minutes: number }
  | { type: "longBreak"; minutes: number }
  | { type: "workResume" };

interface PomodoroContextValue {
  state: PomodoroState;
  setMode: (m: PomodoroState["mode"]) => void;
  setWorkMin: (v: number) => void;
  setShortBreakMin: (v: number) => void;
  setLongBreakMin: (v: number) => void;
  setCountdownMin: (v: number) => void;
  setCountdownSec: (v: number) => void;
  setSecondsLeft: (v: number) => void;
  setStopwatchSec: (v: number) => void;
  setIsRunning: (v: boolean) => void;
  setPhase: (p: PomodoroPhase) => void;
  setCycle: (c: number) => void;
  setLaps: (l: number[] | ((prev: number[]) => number[])) => void;
  handleStartPause: () => void;
  handleReset: () => void;
  handleLap: () => void;
  resetPomodoro: () => void;
  resetCountdown: () => void;
  resetStopwatch: () => void;
  toast: ToastMessage | null;
  dismissToast: () => void;
  playAlarm: () => void;
  unlockAudio: () => void;
  formatTime: (sec: number) => string;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) return null;
  return ctx;
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const stored = loadStored();
  const [state, setState] = useState<PomodoroState>(() => ({
    ...defaultState,
    ...stored,
    secondsLeft:
      (stored.workMin ?? 25) * 60,
    isRunning: false,
    phase: "work",
    cycle: 0,
    laps: [],
  }));

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const phaseRef = useRef(state.phase);
  const cycleRef = useRef(state.cycle);
  const secondsLeftRef = useRef(state.secondsLeft);
  const workRef = useRef(state.workMin);
  const shortRef = useRef(state.shortBreakMin);
  const longRef = useRef(state.longBreakMin);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  phaseRef.current = state.phase;
  cycleRef.current = state.cycle;
  secondsLeftRef.current = state.secondsLeft;
  workRef.current = state.workMin;
  shortRef.current = state.shortBreakMin;
  longRef.current = state.longBreakMin;

  useEffect(() => {
    secondsLeftRef.current = state.secondsLeft;
    phaseRef.current = state.phase;
    cycleRef.current = state.cycle;
  }, [state.secondsLeft, state.phase, state.cycle]);

  useEffect(() => {
    saveStored(state);
  }, [state.workMin, state.shortBreakMin, state.longBreakMin, state.countdownMin, state.countdownSec, state.mode]);

  const unlockAudio = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.resume?.();
      return;
    }
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
    } catch {
      /* ignore */
    }
  }, []);

  const playAlarm = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const doPlay = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 528;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.08);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } catch {
        /* ignore */
      }
    };
    try {
      if (ctx.state === "suspended") {
        void ctx.resume().then(doPlay);
      } else {
        doPlay();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const showToast = useCallback((msg: ToastMessage) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 6000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const resetPomodoro = useCallback(() => {
    setState((s) => {
      const sec = s.workMin * 60;
      secondsLeftRef.current = sec;
      phaseRef.current = "work";
      cycleRef.current = 0;
      return {
        ...s,
        phase: "work",
        cycle: 0,
        secondsLeft: sec,
      };
    });
  }, []);

  const resetCountdown = useCallback(() => {
    setState((s) => {
      const sec = s.countdownMin * 60 + s.countdownSec;
      secondsLeftRef.current = sec;
      return { ...s, secondsLeft: sec };
    });
  }, []);

  const resetStopwatch = useCallback(() => {
    setState((s) => ({ ...s, stopwatchSec: 0, laps: [] }));
  }, []);

  useEffect(() => {
    if (!state.isRunning) return;
    const tick = () => {
      if (state.mode === "pomodoro" || state.mode === "countdown") {
        const prev = secondsLeftRef.current;
        if (prev <= 0) {
          if (state.mode === "pomodoro") {
            const p = phaseRef.current;
            const c = cycleRef.current;
            if (p === "work") {
              playAlarm();
              const newCycle = c + 1;
              cycleRef.current = newCycle;
              setState((s) => {
                if (newCycle % 4 === 0) {
                  const sec = longRef.current * 60;
                  secondsLeftRef.current = sec;
                  phaseRef.current = "longBreak";
                  showToast({ type: "longBreak", minutes: longRef.current });
                  return {
                    ...s,
                    phase: "longBreak",
                    cycle: newCycle,
                    secondsLeft: sec,
                  };
                } else {
                  const sec = shortRef.current * 60;
                  secondsLeftRef.current = sec;
                  phaseRef.current = "shortBreak";
                  showToast({ type: "shortBreak", minutes: shortRef.current });
                  return {
                    ...s,
                    phase: "shortBreak",
                    cycle: newCycle,
                    secondsLeft: sec,
                  };
                }
              });
            } else {
              playAlarm();
              phaseRef.current = "work";
              const sec = workRef.current * 60;
              secondsLeftRef.current = sec;
              showToast({ type: "workResume" });
              setState((s) => ({
                ...s,
                phase: "work",
                secondsLeft: sec,
              }));
            }
          } else {
            playAlarm();
            setState((s) => ({ ...s, isRunning: false, secondsLeft: 0 }));
          }
        } else {
          secondsLeftRef.current = prev - 1;
          setState((s) => ({ ...s, secondsLeft: prev - 1 }));
        }
      } else {
        setState((s) => ({ ...s, stopwatchSec: s.stopwatchSec + 1 }));
      }
    };
    const id = setInterval(() => {
      workRef.current = state.workMin;
      shortRef.current = state.shortBreakMin;
      longRef.current = state.longBreakMin;
      tick();
    }, 1000);
    return () => clearInterval(id);
  }, [state.isRunning, state.mode, state.workMin, state.shortBreakMin, state.longBreakMin, playAlarm, showToast]);

  const handleStartPause = useCallback(() => {
    unlockAudio();
    setState((s) => {
      if (s.mode === "countdown" && !s.isRunning) {
        const sec = s.countdownMin * 60 + s.countdownSec;
        secondsLeftRef.current = sec;
        return { ...s, isRunning: true, secondsLeft: sec };
      }
      if (s.mode === "pomodoro" && !s.isRunning) {
        secondsLeftRef.current = s.secondsLeft;
      }
      return { ...s, isRunning: !s.isRunning };
    });
  }, [unlockAudio]);

  const handleReset = useCallback(() => {
    setState((s) => {
      const next = { ...s, isRunning: false };
      if (s.mode === "pomodoro") {
        const sec = s.workMin * 60;
        secondsLeftRef.current = sec;
        phaseRef.current = "work";
        cycleRef.current = 0;
        return { ...next, phase: "work", cycle: 0, secondsLeft: sec };
      }
      if (s.mode === "countdown") {
        const sec = s.countdownMin * 60 + s.countdownSec;
        secondsLeftRef.current = sec;
        return { ...next, secondsLeft: sec };
      }
      return { ...next, stopwatchSec: 0, laps: [] };
    });
  }, []);

  const handleLap = useCallback(() => {
    setState((s) =>
      s.mode === "stopwatch"
        ? { ...s, laps: [...s.laps, s.stopwatchSec] }
        : s
    );
  }, []);

  const formatTime = useCallback((sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const value: PomodoroContextValue = {
    state,
    setMode: (m) =>
      setState((s) => {
        if (m === "pomodoro") {
          const sec = s.workMin * 60;
          secondsLeftRef.current = sec;
          phaseRef.current = "work";
          cycleRef.current = 0;
          return { ...s, mode: m, phase: "work", cycle: 0, secondsLeft: sec };
        }
        if (m === "countdown") {
          const sec = s.countdownMin * 60 + s.countdownSec;
          secondsLeftRef.current = sec;
          return { ...s, mode: m, secondsLeft: sec };
        }
        return { ...s, mode: m, stopwatchSec: 0, laps: [] };
      }),
    setWorkMin: (v) => setState((s) => ({ ...s, workMin: v })),
    setShortBreakMin: (v) => setState((s) => ({ ...s, shortBreakMin: v })),
    setLongBreakMin: (v) => setState((s) => ({ ...s, longBreakMin: v })),
    setCountdownMin: (v) => setState((s) => ({ ...s, countdownMin: v })),
    setCountdownSec: (v) => setState((s) => ({ ...s, countdownSec: v })),
    setSecondsLeft: (v) => setState((s) => ({ ...s, secondsLeft: v })),
    setStopwatchSec: (v) => setState((s) => ({ ...s, stopwatchSec: v })),
    setPhase: (p) => setState((s) => ({ ...s, phase: p })),
    setCycle: (c) => setState((s) => ({ ...s, cycle: c })),
    setLaps: (l) =>
      setState((s) => ({
        ...s,
        laps: typeof l === "function" ? l(s.laps) : l,
      })),
    setIsRunning: (v) => setState((s) => ({ ...s, isRunning: v })),
    handleStartPause,
    handleReset,
    handleLap,
    resetPomodoro,
    resetCountdown,
    resetStopwatch,
    toast,
    dismissToast,
    playAlarm,
    unlockAudio,
    formatTime,
  };

  const toastText =
    toast?.type === "shortBreak"
      ? `Kısa mola vakti (${toast.minutes} dakika)`
      : toast?.type === "longBreak"
        ? `Uzun mola vakti (${toast.minutes} dakika)`
        : toast?.type === "workResume"
          ? "Çalışmaya devam"
          : null;

  return (
    <PomodoroContext.Provider value={value}>
      {children}
      {toastText && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex animate-in fade-in slide-in-from-bottom-4 items-start gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          role="status"
          aria-live="polite"
        >
          <p className="flex-1 pr-2 text-sm font-medium text-slate-800 dark:text-slate-200">
            {toastText}
          </p>
          <button
            type="button"
            onClick={dismissToast}
            className="-m-1 shrink-0 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
      )}
    </PomodoroContext.Provider>
  );
}
