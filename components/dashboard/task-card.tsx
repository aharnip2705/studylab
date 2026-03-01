"use client";

import { useState } from "react";
import { TaskDetailModal } from "./task-detail-modal";
import { cn } from "@/lib/utils";
import { Video, FileQuestion, ClipboardList, Timer } from "lucide-react";

type TaskType = "video" | "test" | "deneme";
type Status = "tamamlanmadi" | "kismen_tamamlandi" | "tamamlandi";

interface TaskCardProps {
  id: string;
  subjectName: string;
  subjectIconUrl?: string | null;
  taskType: TaskType;
  resourceName: string | null;
  questionCount: number | null;
  solvedQuestionsCount: number | null;
  status: Status;
  notes: string | null;
  excuse: string | null;
  onDeleted?: (id: string) => void;
}

const typeIcons = {
  video: Video,
  test: FileQuestion,
  deneme: Timer,
};

const typeLabels = {
  video: "Video",
  test: "Test",
  deneme: "Deneme",
};

const statusColors = {
  tamamlandi: "border-l-4 border-l-green-600 bg-green-100/80 dark:bg-green-900/30 dark:border-l-green-400",
  kismen_tamamlandi: "border-l-4 border-l-amber-600 bg-amber-100/80 dark:bg-amber-900/30 dark:border-l-amber-400",
  tamamlanmadi: "border-l-4 border-l-red-600 bg-red-100/80 dark:bg-red-900/30 dark:border-l-red-400",
};

export function TaskCard({
  id,
  subjectName,
  subjectIconUrl,
  taskType,
  resourceName,
  questionCount,
  solvedQuestionsCount,
  status,
  notes,
  excuse,
  onDeleted,
}: TaskCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [iconError, setIconError] = useState(false);

  const Icon = typeIcons[taskType];
  const showSubjectIcon = taskType !== "deneme" && subjectIconUrl && !iconError;
  const desc =
    taskType === "video"
      ? resourceName || "Video dersi"
      : questionCount
        ? `${resourceName || "Kaynak"} • ${questionCount} soru`
        : resourceName || "Test/Deneme";

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={cn(
          "task-card animate-item-in flex w-full gap-3 rounded-lg border-l-4 px-3 py-2 text-left transition-all duration-150 hover:shadow-md min-w-0 break-words",
          statusColors[status]
        )}
      >
        {/* Soldaki boşluk: ders sembolü bu alana tam sığar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/60 dark:bg-slate-700/50 dark:ring-1 dark:ring-slate-600/50">
          {showSubjectIcon ? (
            <img
              src={subjectIconUrl ?? ""}
              alt={subjectName}
              className="h-full w-full object-contain p-0.5"
              referrerPolicy="no-referrer"
              onError={() => setIconError(true)}
            />
          ) : (
            <Icon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-white break-words">
              {subjectName}
            </span>
            <span className="shrink-0 text-xs text-slate-500">• {typeLabels[taskType]}</span>
          </div>
          <p className="mt-0.5 break-words text-xs text-slate-600 dark:text-slate-400">
            {desc}
          </p>
        </div>
      </button>
      {showModal && (
        <TaskDetailModal
          taskId={id}
          subjectName={subjectName}
          taskType={taskType}
          resourceName={resourceName}
          questionCount={questionCount}
          solvedQuestionsCount={solvedQuestionsCount}
          status={status}
          notes={notes}
          excuse={excuse}
          onClose={() => setShowModal(false)}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
