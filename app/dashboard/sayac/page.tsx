import { TimerApp } from "./timer-app";

export default function SayacPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Pomodoro / Sayaç
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Odaklanmak için Pomodoro, geri sayım veya kronometre kullanın.
        </p>
      </div>
      <TimerApp />
    </div>
  );
}
