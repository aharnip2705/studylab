"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { mutate } from "swr";
import { updateTaskStatus, updateTaskNotes, deleteTask } from "@/lib/actions/plans";
import { SWR_KEYS } from "@/lib/swr/keys";
import { cn } from "@/lib/utils";
import { Check, Minus, X, Trash2, FileText } from "lucide-react";

type TaskType = "video" | "test" | "deneme";
type Status = "tamamlanmadi" | "kismen_tamamlandi" | "tamamlandi";

const statusOptions: { value: Status; label: string; icon: React.ElementType }[] = [
  { value: "tamamlandi", label: "Tamamlandı", icon: Check },
  { value: "kismen_tamamlandi", label: "Kısmen Tamamlandı", icon: Minus },
  { value: "tamamlanmadi", label: "Tamamlanmadı", icon: X },
];

interface TaskDetailModalProps {
  taskId: string;
  subjectName: string;
  taskType: TaskType;
  resourceName: string | null;
  questionCount: number | null;
  solvedQuestionsCount: number | null;
  status: Status;
  notes: string | null;
  excuse: string | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

export function TaskDetailModal({
  taskId,
  subjectName,
  taskType,
  resourceName,
  questionCount,
  solvedQuestionsCount: initialSolvedCount,
  status,
  notes,
  excuse: initialExcuse,
  onClose,
  onDeleted,
}: TaskDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState<Status>(status);
  const [currentNotes, setCurrentNotes] = useState(notes ?? "");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  // Modal açıldığında mevcut duruma göre ilgili paneli göster (tamamlanmadı → mazeret, kısmen → çözülen soru sayısı)
  const [pendingStatus, setPendingStatus] = useState<Status | null>(() => {
    if (status === "tamamlanmadi") return "tamamlanmadi";
    if (status === "kismen_tamamlandi" && questionCount != null && questionCount > 0) return "kismen_tamamlandi";
    return null;
  });
  const [solvedCount, setSolvedCount] = useState("");
  const [isEditingSolvedCount, setIsEditingSolvedCount] = useState(false);
  const [recentlySavedSolvedCount, setRecentlySavedSolvedCount] = useState<number | null>(null);
  const [excuse, setExcuse] = useState(initialExcuse ?? "");
  const [isEditingExcuse, setIsEditingExcuse] = useState(false);
  const [recentlySavedExcuse, setRecentlySavedExcuse] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExcuse(initialExcuse ?? "");
    if ((initialExcuse ?? "").trim()) setRecentlySavedExcuse(null);
  }, [initialExcuse]);

  useEffect(() => {
    if (initialSolvedCount != null) setRecentlySavedSolvedCount(null);
  }, [initialSolvedCount]);

  const hasSavedExcuse =
    ((initialExcuse ?? "").trim() || (recentlySavedExcuse ?? "").trim()).length > 0;

  const displayedSolvedCount =
    initialSolvedCount ?? recentlySavedSolvedCount ?? null;
  const showKismenSolvedPanel =
    currentStatus === "kismen_tamamlandi" &&
    pendingStatus !== "tamamlanmadi" &&
    questionCount != null &&
    questionCount > 0 &&
    displayedSolvedCount != null;

  const desc =
    taskType === "video"
      ? resourceName || "Video dersi"
      : questionCount
        ? `${resourceName || "Kaynak"} • ${questionCount} soru`
        : resourceName || "Test/Deneme";

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleStatusChange(newStatus: Status) {
    if (newStatus === "kismen_tamamlandi" && questionCount != null && questionCount > 0) {
      setPendingStatus(newStatus);
      setSolvedCount("");
      return;
    }
    if (newStatus === "tamamlanmadi") {
      setPendingStatus(newStatus);
      setExcuse("");
      return;
    }
    await doStatusUpdate(newStatus);
  }

  async function doStatusUpdate(
    newStatus: Status,
    extra?: { solved_questions_count?: number; excuse?: string | null }
  ) {
    setStatusError(null);
    setLoading(true);
    const result = await updateTaskStatus(taskId, newStatus, extra);
    setLoading(false);
    if (result.success) {
      setCurrentStatus(newStatus);
      setPendingStatus(null);
      setSolvedCount("");
      if (extra?.solved_questions_count != null) {
        setRecentlySavedSolvedCount(extra.solved_questions_count);
      }
      if (extra?.excuse !== undefined) {
        const val = (extra.excuse ?? "").trim();
        setExcuse(extra.excuse ?? "");
        setRecentlySavedExcuse(val || null);
        setIsEditingExcuse(false);
      } else if (newStatus !== "tamamlanmadi") {
        setExcuse("");
      }
      if (newStatus !== "kismen_tamamlandi" && extra?.solved_questions_count == null) {
        setRecentlySavedSolvedCount(null);
      }
      mutate(SWR_KEYS.weeklyPlan);
      mutate(SWR_KEYS.stats);
    } else {
      setStatusError(result.error ?? "Durum kaydedilemedi.");
    }
  }

  async function handleSaveNotes() {
    setLoading(true);
    await updateTaskNotes(taskId, currentNotes.trim() || null);
    setLoading(false);
    mutate(SWR_KEYS.weeklyPlan);
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setLoading(true);
    const result = await deleteTask(taskId);
    setLoading(false);
    if (result.success) {
      onClose();
      onDeleted?.(taskId);
      mutate(SWR_KEYS.weeklyPlan);
      mutate(SWR_KEYS.stats);
    }
  }

  return createPortal(
    <>
      <div
        ref={overlayRef}
        className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => e.target === overlayRef.current && onClose()}
      >
        <div
          className="animate-modal-in w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {subjectName} • {taskType === "video" ? "Video" : taskType === "test" ? "Test" : "Deneme"}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
            <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Durum</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                // Pending varsa sadece o seçili görünsün; yoksa mevcut durum
                const isSelected = pendingStatus ? pendingStatus === opt.value : currentStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusChange(opt.value)}
                    disabled={loading}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      isSelected && opt.value === "tamamlandi" && "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      isSelected && opt.value === "kismen_tamamlandi" && "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      isSelected && opt.value === "tamamlanmadi" && "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      !isSelected && "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {statusError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{statusError}</p>
            )}
            {pendingStatus === "kismen_tamamlandi" && (
              <div className="animate-panel-in mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  Çözülen soru sayısı? {questionCount != null && `(Maks: ${questionCount})`}
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={questionCount ?? 999}
                    value={solvedCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const max = questionCount ?? 999;
                      setSolvedCount(String(Math.min(val, max)));
                    }}
                    placeholder={`0 - ${questionCount ?? "?"}`}
                    className="w-24 rounded border border-amber-300 bg-white px-2 py-1.5 text-sm dark:border-amber-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(solvedCount) || 0;
                      const max = questionCount ?? null;
                      let finalStatus: Status;
                      let extra: { solved_questions_count?: number; excuse?: string | null } = {};
                      if (val === 0) {
                        finalStatus = "tamamlanmadi";
                        extra = { solved_questions_count: 0 };
                      } else if (max !== null && val >= max) {
                        finalStatus = "tamamlandi";
                        extra = { solved_questions_count: val };
                      } else {
                        finalStatus = "kismen_tamamlandi";
                        extra = { solved_questions_count: val };
                      }
                      doStatusUpdate(finalStatus, extra);
                    }}
                    disabled={loading || solvedCount === ""}
                    className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingStatus(null)}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
            {showKismenSolvedPanel && !isEditingSolvedCount && (
              <div className="animate-panel-in mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Çözülen: {displayedSolvedCount}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSolvedCount(true);
                      setSolvedCount(String(displayedSolvedCount ?? 0));
                    }}
                    className="shrink-0 rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                  >
                    Düzenle
                  </button>
                </div>
              </div>
            )}
            {showKismenSolvedPanel && isEditingSolvedCount && (
              <div className="animate-panel-in mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  Çözülen soru sayısı {questionCount != null && `(Maks: ${questionCount})`}
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={questionCount ?? 999}
                    value={solvedCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const max = questionCount ?? 999;
                      setSolvedCount(String(Math.min(val, max)));
                    }}
                    className="w-24 rounded border border-amber-300 bg-white px-2 py-1.5 text-sm dark:border-amber-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(solvedCount) || 0;
                      const max = questionCount ?? null;
                      let finalStatus: Status;
                      let extra: { solved_questions_count?: number } = {};
                      if (val === 0) {
                        finalStatus = "tamamlanmadi";
                        extra = { solved_questions_count: 0 };
                      } else if (max !== null && val >= max) {
                        finalStatus = "tamamlandi";
                        extra = { solved_questions_count: val };
                      } else {
                        finalStatus = "kismen_tamamlandi";
                        extra = { solved_questions_count: val };
                      }
                      doStatusUpdate(finalStatus, extra);
                      setIsEditingSolvedCount(false);
                    }}
                    disabled={loading || solvedCount === ""}
                    className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSolvedCount(false);
                      setSolvedCount("");
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
            {(currentStatus === "tamamlanmadi" || pendingStatus === "tamamlanmadi") &&
              pendingStatus !== "kismen_tamamlandi" && (
              <div className="animate-panel-in mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="mb-2 text-sm font-medium text-red-800 dark:text-red-200">
                  {pendingStatus === "tamamlanmadi"
                    ? "Tamamlanmadı olarak güncellemek için mazeret girmeniz gerekiyor."
                    : hasSavedExcuse && !isEditingExcuse
                      ? "Mazeret:"
                      : "Mazeretin nedir?"}
                </p>
                {pendingStatus === "tamamlanmadi" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={excuse}
                      onChange={(e) => setExcuse(e.target.value)}
                      placeholder="Mazeretinizi yazın..."
                      className="w-full rounded border border-red-300 bg-white px-3 py-2 text-sm dark:border-red-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          doStatusUpdate("tamamlanmadi", {
                            excuse: excuse.trim() || null,
                            solved_questions_count: 0,
                          })
                        }
                        disabled={loading || !excuse.trim()}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingStatus(null)}
                        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : hasSavedExcuse && !isEditingExcuse ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex-1 break-words text-sm text-red-900 dark:text-red-200">
                      {(initialExcuse ?? "").trim() || recentlySavedExcuse || ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditingExcuse(true)}
                      className="shrink-0 rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Düzenle
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={excuse}
                      onChange={(e) => setExcuse(e.target.value)}
                      placeholder="Mazeretinizi yazın..."
                      className="w-full rounded border border-red-300 bg-white px-3 py-2 text-sm dark:border-red-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          doStatusUpdate("tamamlanmadi", {
                            excuse: excuse.trim() || null,
                            solved_questions_count: 0,
                          })
                        }
                        disabled={loading || !excuse.trim()}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingExcuse(false);
                          setExcuse(initialExcuse ?? "");
                        }}
                        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <FileText className="h-4 w-4" />
              Not
            </p>
            <textarea
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Bu göreve not ekleyin..."
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Delete */}
          <div className="flex items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                deleteConfirm
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              )}
            >
              <Trash2 className="h-4 w-4" />
              {deleteConfirm ? "Silme işlemini onayla" : "Görevi Sil"}
            </button>
            {deleteConfirm && (
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
              >
                İptal
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
