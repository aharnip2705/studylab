"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type Task = {
  status: string;
  excuse: string | null;
};

interface ProactiveCoachToastProps {
  tasks: Task[] | undefined;
  weekStart: string;
}

function getWeekEnd(weekStart: string): Date {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + 6);
  return d;
}

export function ProactiveCoachToast({ tasks, weekStart }: ProactiveCoachToastProps) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const incomplete = tasks.filter(
      (t) => t.status === "tamamlanmadi" || t.status === "kismen_tamamlandi"
    );
    if (incomplete.length === 0) return;
    const now = new Date();
    const weekEnd = getWeekEnd(weekStart);
    const daysLeft = Math.ceil((weekEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const shouldAlert = isWeekend || daysLeft <= 2;
    if (!shouldAlert || shownRef.current) return;
    shownRef.current = true;
    toast.warning(
      `${incomplete.length} görev henüz tamamlanmadı`,
      {
        description: daysLeft <= 0
          ? "Hafta bitti. Görevlerini güncelle."
          : `Haftaya ${daysLeft} gün kaldı. Görevlerini kontrol et.`,
        duration: 6000,
      }
    );
  }, [tasks, weekStart]);

  return null;
}
