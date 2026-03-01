"use client";

import { useState, useCallback } from "react";
import { useStats, usePracticeExams, useSubscription } from "@/lib/swr/hooks";
import { revalidateKey } from "@/lib/swr/hooks";
import { deletePracticeExam } from "@/lib/actions/practice-exams";
import { StatsCharts } from "@/components/dashboard/stats-charts";
import { ExamAnalytics, ExamHistoryTable, computeExam } from "@/components/dashboard/exam-analytics";
import { ExamEntryModal } from "@/components/dashboard/exam-entry-modal";
import { AiInsightDrawer } from "@/components/dashboard/ai-insight-drawer";
import useSWR from "swr";
import { getProfile } from "@/lib/actions/profile";

export function IstatistiklerClient() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: exams, isLoading: examsLoading } = usePracticeExams();
  const { data: subscription } = useSubscription();
  const { data: profile } = useSWR("profile", getProfile);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "exams">("exams");
  const [examFilter, setExamFilter] = useState<"tyt" | "ayt">("tyt");

  const proActive = subscription?.proActive ?? false;
  const studyField = (profile as { study_field?: string } | null)?.study_field ?? null;
  const tytTargetNet = (profile as { tyt_target_net?: number | null } | null)?.tyt_target_net ?? null;
  const aytTargetNet = (profile as { ayt_target_net?: number | null } | null)?.ayt_target_net ?? null;

  const filteredExams = (exams ?? []).filter((e) => e.exam_type === examFilter);

  const handleExamAdded = useCallback(() => {
    revalidateKey("practiceExams");
  }, []);

  const handleDeleteExam = useCallback(async (id: string) => {
    await deletePracticeExam(id);
    revalidateKey("practiceExams");
  }, []);

  const isLoading = statsLoading || examsLoading;

  if (isLoading && !stats && !exams) {
    return (
      <div className="space-y-6 px-1">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-800/50" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-800/50" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-800/50" />
      </div>
    );
  }

  const computed = filteredExams.map(computeExam);

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            İstatistikler
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Deneme analizleri ve ilerleme takibi
          </p>
        </div>
        <div className="flex items-center gap-2">
          {proActive && (
            <AiInsightDrawer
              exams={exams ?? []}
              isPro={proActive}
              studyField={studyField}
              tytTargetNet={tytTargetNet}
              aytTargetNet={aytTargetNet}
            />
          )}
          <button
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-400 hover:shadow-indigo-500/30"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              className="transition-transform group-hover:rotate-90"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Deneme Ekle
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-slate-800/40 p-1">
        {([
          { key: "exams" as const, label: "Deneme Analizi" },
          { key: "overview" as const, label: "Haftalık Özet" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-slate-700/80 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TYT / AYT Filtresi (deneme analizi sekmesinde) */}
      {activeTab === "exams" && (
        <div className="flex gap-1 rounded-lg bg-slate-800/30 p-0.5">
          {([
            { key: "tyt" as const, label: "TYT" },
            { key: "ayt" as const, label: "AYT" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setExamFilter(key)}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                examFilter === key
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
              <span className="ml-1 text-[10px] text-slate-600">
                ({(exams ?? []).filter((e) => e.exam_type === key).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "exams" ? (
        <div className="space-y-5">
          <ExamAnalytics
            exams={filteredExams}
            studyField={studyField as import("@/lib/study-field").StudyField | null}
            tytTargetNet={tytTargetNet}
            aytTargetNet={aytTargetNet}
          />
          {computed.length > 0 && (
            <ExamHistoryTable
              exams={computed}
              onDelete={handleDeleteExam}
              tytTargetNet={tytTargetNet}
              aytTargetNet={aytTargetNet}
            />
          )}
        </div>
      ) : (
        <StatsCharts stats={stats ?? null} />
      )}

      {/* Modal */}
      <ExamEntryModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleExamAdded}
        studyField={studyField as import("@/lib/study-field").StudyField | null}
      />
    </div>
  );
}
