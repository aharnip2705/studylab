"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import type { PracticeExam } from "@/lib/actions/practice-exams";
import type { StudyField } from "@/lib/study-field";
import {
  calculateNet,
  calculateTimePerQuestion,
  calculateSuccessRate,
  filterSubjectDetailsByField,
  getExamConfig,
} from "@/lib/exam-config";

interface ExamAnalyticsProps {
  exams: PracticeExam[];
  studyField?: StudyField | null;
  tytTargetNet?: number | null;
  aytTargetNet?: number | null;
}

interface ComputedExam extends PracticeExam {
  net: number;
  timePerQuestion: number;
  successRate: number;
  totalQuestions: number;
  emptyCount: number;
  netTarget: number | null;
}

function computeExam(exam: PracticeExam): ComputedExam {
  const totalQuestions = exam.exam_type === "tyt" ? 120 : 80;
  const net = calculateNet(exam.total_correct, exam.total_wrong);
  const timePerQuestion = calculateTimePerQuestion(
    exam.total_time_minutes,
    totalQuestions
  );
  const netTarget = exam.net_target ?? null;
  const successRate =
    netTarget != null && netTarget > 0
      ? (net / netTarget) * 100
      : calculateSuccessRate(net, totalQuestions);
  const emptyCount = totalQuestions - exam.total_correct - exam.total_wrong;
  return { ...exam, net, timePerQuestion, successRate, totalQuestions, emptyCount, netTarget };
}

function CircularProgress({
  value,
  max,
  label,
  sublabel,
  color,
}: {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-slate-800"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">
            {value.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-slate-300">{label}</p>
        <p className="text-[10px] text-slate-500">{sublabel}</p>
      </div>
    </div>
  );
}

function ComparisonCard({
  label,
  current,
  average,
  unit,
  higherIsBetter = true,
}: {
  label: string;
  current: number;
  average: number;
  unit: string;
  higherIsBetter?: boolean;
}) {
  const diff = current - average;
  const isGood = higherIsBetter ? diff >= 0 : diff <= 0;
  const absDiff = Math.abs(diff);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/50">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-800/20 opacity-0 transition-opacity group-hover:opacity-100" />
      <p className="relative mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="relative text-2xl font-bold text-white">
        {current.toFixed(1)}{" "}
        <span className="text-sm font-normal text-slate-500">{unit}</span>
      </p>
      <div className="relative mt-2 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            isGood
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-rose-500/10 text-rose-400"
          }`}
        >
          {isGood ? (
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {absDiff.toFixed(1)}
        </span>
        <span className="text-[11px] text-slate-500">
          ortalamaya göre
        </span>
      </div>
    </div>
  );
}

function NetTrendChart({ data }: { data: { name: string; net: number }[] }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        Net Trendi (Son 5)
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
              formatter={(v: number | undefined) => [(v ?? 0).toFixed(2) + " net", "Net"]}
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#818cf8"
              strokeWidth={2.5}
              fill="url(#netGrad)"
              dot={{ fill: "#818cf8", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#a5b4fc" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SubjectBreakdown({
  exams,
  examType,
  studyField,
}: {
  exams: ComputedExam[];
  examType?: string;
  studyField?: StudyField | null;
}) {
  const config = examType ? getExamConfig(examType as "tyt" | "ayt", studyField ?? null) : null;
  const subjectQuestions = (config as { subjectQuestions?: Record<string, number> } | null)
    ?.subjectQuestions ?? {};

  const examsWithDetails = exams.filter(
    (e) => e.subject_details && Object.keys(e.subject_details).length > 0
  );
  if (examsWithDetails.length === 0) return null;

  const aggregated: Record<
    string,
    { sumNet: number; sumCorrect: number; sumWrong: number; sumEmpty: number; count: number }
  > = {};
  for (const exam of examsWithDetails) {
    const filtered = filterSubjectDetailsByField(
      exam.subject_details,
      exam.exam_type,
      studyField ?? null
    );
    if (!filtered) continue;
    for (const [subject, { correct, wrong }] of Object.entries(filtered)) {
      const maxQ = subjectQuestions[subject];
      const empty = maxQ != null ? Math.max(0, maxQ - correct - wrong) : 0;
      if (!aggregated[subject]) {
        aggregated[subject] = { sumNet: 0, sumCorrect: 0, sumWrong: 0, sumEmpty: 0, count: 0 };
      }
      aggregated[subject].sumNet += calculateNet(correct, wrong);
      aggregated[subject].sumCorrect += correct;
      aggregated[subject].sumWrong += wrong;
      aggregated[subject].sumEmpty += empty;
      aggregated[subject].count += 1;
    }
  }
  const entries = Object.entries(aggregated);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        Ders Bazlı Performans (Denemelere Göre Ortalama)
      </p>
      <div className="space-y-3">
        {entries.map(([subject, { sumNet, sumCorrect, sumWrong, sumEmpty, count }]) => {
          const avgNet = sumNet / count;
          const avgCorrect = sumCorrect / count;
          const avgWrong = sumWrong / count;
          const avgEmpty = sumEmpty / count;
          const maxQ = subjectQuestions[subject];
          const total = maxQ ?? avgCorrect + avgWrong + avgEmpty;
          const pct = total > 0 ? (avgCorrect / total) * 100 : 0;
          return (
            <div key={subject} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">
                  {subject}
                  {maxQ != null && (
                    <span className="ml-1 font-normal text-slate-600">({maxQ} soru)</span>
                  )}
                </span>
                <span className="text-xs text-slate-500">
                  {avgNet.toFixed(1)} net (ort.) &middot;{" "}
                  {avgCorrect.toFixed(0)}D {avgWrong.toFixed(0)}Y {avgEmpty.toFixed(0)}B
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExamHistoryTable({
  exams,
  onDelete,
}: {
  exams: ComputedExam[];
  onDelete: (id: string) => void;
  tytTargetNet?: number | null;
  aytTargetNet?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        Deneme Geçmişi
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="pb-2 pr-4 font-medium">Tarih</th>
              <th className="pb-2 pr-4 font-medium">Ad</th>
              <th className="pb-2 pr-4 font-medium">Tip</th>
              <th className="pb-2 pr-4 font-medium">Net</th>
              <th className="pb-2 pr-4 font-medium">D/Y/B</th>
              <th className="pb-2 pr-4 font-medium">Süre</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => {
              const dateStr = e.exam_date ?? (e.created_at?.slice(0, 10) ?? "—");
              const displayDate = dateStr !== "—" ? new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "—";
              return (
              <tr
                key={e.id}
                className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
              >
                <td className="py-2.5 pr-4 text-slate-400">
                  {displayDate}
                </td>
                <td className="py-2.5 pr-4 font-medium text-slate-200">
                  {e.exam_name}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-400">
                    {e.exam_type}
                  </span>
                </td>
                <td className="py-2.5 pr-4 font-semibold text-white">
                  {e.net.toFixed(2)}
                </td>
                <td className="py-2.5 pr-4 text-slate-400">
                  {e.total_correct}/{e.total_wrong}/{e.emptyCount}
                </td>
                <td className="py-2.5 pr-4 text-slate-400">
                  {e.total_time_minutes} dk
                </td>
                <td className="py-2.5">
                  <button
                    onClick={() => onDelete(e.id)}
                    className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTargetNet(n: number): string {
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

export function ExamAnalytics({ exams, studyField, tytTargetNet, aytTargetNet }: ExamAnalyticsProps) {
  const computed = exams.map(computeExam);
  const latest = computed[0];
  const effectiveNetTarget =
    latest &&
    (latest.net_target ?? (latest.exam_type === "tyt" ? tytTargetNet : aytTargetNet));

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
        <div className="mb-3 rounded-full bg-slate-800 p-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-400">Henüz deneme sonucu yok</p>
        <p className="mt-1 text-xs text-slate-600">
          İlk deneme sonucunu ekleyerek analizlerine başla
        </p>
      </div>
    );
  }

  const avgNet =
    computed.reduce((sum, e) => sum + e.net, 0) / computed.length;
  const avgTime =
    computed.reduce((sum, e) => sum + e.timePerQuestion, 0) / computed.length;
  const avgSuccess =
    computed.reduce((sum, e) => sum + e.successRate, 0) / computed.length;

  const trendData = [...computed].reverse().map((e, i) => ({
    name: `#${i + 1}`,
    net: parseFloat(e.net.toFixed(2)),
  }));

  return (
    <div className="space-y-5">
      {/* Progress Circles */}
      <div className="grid grid-cols-3 gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <CircularProgress
          value={latest.net}
          max={
            effectiveNetTarget != null && effectiveNetTarget > 0
              ? effectiveNetTarget
              : latest.totalQuestions
          }
          label="Net"
          sublabel={
            effectiveNetTarget != null && effectiveNetTarget > 0
              ? `Hedef ${formatTargetNet(effectiveNetTarget)} net`
              : `${latest.totalQuestions} soru`
          }
          color="#818cf8"
        />
        <CircularProgress
          value={Math.min(latest.successRate, 100)}
          max={100}
          label="Başarı"
          sublabel={`%${latest.successRate.toFixed(0)}`}
          color="#34d399"
        />
        <CircularProgress
          value={latest.timePerQuestion}
          max={120}
          label="sn/soru"
          sublabel={`${latest.total_time_minutes} dk`}
          color="#fb923c"
        />
      </div>

      {/* Net Target Progress */}
      {effectiveNetTarget != null && effectiveNetTarget > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Hedefe Yaklaşma
            </p>
            <span className="text-sm font-bold text-white">
              {latest.net.toFixed(1)} / {formatTargetNet(effectiveNetTarget)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
              style={{
                width: `${Math.min((latest.net / effectiveNetTarget) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {latest.net >= effectiveNetTarget
              ? "Hedefine ulaştın!"
              : `Hedefe ${(effectiveNetTarget - latest.net).toFixed(1)} net kaldı`}
          </p>
        </div>
      )}

      {/* Comparison Cards */}
      {computed.length > 1 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <ComparisonCard
            label="Net"
            current={latest.net}
            average={avgNet}
            unit="net"
          />
          <ComparisonCard
            label="sn/Soru"
            current={latest.timePerQuestion}
            average={avgTime}
            unit="sn"
            higherIsBetter={false}
          />
          <ComparisonCard
            label="Başarı Oranı"
            current={latest.successRate}
            average={avgSuccess}
            unit="%"
          />
        </div>
      )}

      {/* Trend Chart */}
      {computed.length > 1 && <NetTrendChart data={trendData} />}

      {/* Subject Breakdown - tüm denemelere göre ortalama, boş sorular dahil */}
      {(() => {
        const sameTypeExams = computed.filter((e) => e.exam_type === latest.exam_type);
        const hasAnyDetails = sameTypeExams.some(
          (e) => e.subject_details && Object.keys(e.subject_details).length > 0
        );
        return hasAnyDetails ? (
          <SubjectBreakdown
            exams={sameTypeExams}
            examType={latest.exam_type}
            studyField={studyField ?? null}
          />
        ) : null;
      })()}
    </div>
  );
}

export { ExamHistoryTable, computeExam };
export type { ComputedExam };
