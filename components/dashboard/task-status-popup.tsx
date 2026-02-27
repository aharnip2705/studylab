"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/lib/actions/plans";
import { cn } from "@/lib/utils";
import { Check, Minus, X } from "lucide-react";

type Status = "tamamlanmadi" | "kismen_tamamlandi" | "tamamlandi";

interface TaskStatusPopupProps {
  taskId: string;
  currentStatus: Status;
  onClose: () => void;
  position: { x: number; y: number };
}

const statusOptions: { value: Status; label: string; icon: React.ElementType }[] = [
  { value: "tamamlandi", label: "Tamamlandı", icon: Check },
  { value: "kismen_tamamlandi", label: "Kısmen Tamamlandı", icon: Minus },
  { value: "tamamlanmadi", label: "Tamamlanmadı", icon: X },
];

export function TaskStatusPopup({
  taskId,
  currentStatus,
  onClose,
  position,
}: TaskStatusPopupProps) {
  const [status, setStatus] = useState<Status>(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSelect(newStatus: Status) {
    setLoading(true);
    const result = await updateTaskStatus(taskId, newStatus);
    setLoading(false);
    if (result.success) {
      setStatus(newStatus);
      router.refresh();
      onClose();
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div
        className="animate-dropdown-in fixed z-50 min-w-[200px] rounded-lg border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        style={{ left: position.x, top: position.y }}
      >
        <p className="border-b border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Durum
        </p>
        {statusOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              disabled={loading}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                isSelected &&
                  "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
