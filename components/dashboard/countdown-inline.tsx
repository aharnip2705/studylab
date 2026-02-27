"use client";

import { useState, useEffect } from "react";

export function CountdownInline() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    const target = new Date(2026, 5, 20);

    function update() {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    }

    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  if (timeLeft === null) {
    return (
      <span className="text-slate-500">Yükleniyor...</span>
    );
  }

  return (
    <span className="font-semibold text-slate-900 dark:text-white">
      {timeLeft.days} gün {timeLeft.hours} saat {timeLeft.minutes} dk
    </span>
  );
}
