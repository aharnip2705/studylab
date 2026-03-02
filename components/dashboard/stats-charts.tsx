"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const COLORS = ["#818cf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6", "#22d3ee"];

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  return useMemo(() => {
    const dark = resolvedTheme === "dark";
    return {
      bg: dark ? "#0f172a" : "#ffffff",
      border: dark ? "#1e293b" : "#e2e8f0",
      grid: dark ? "#1e293b" : "#e2e8f0",
      text: dark ? "#e2e8f0" : "#334155",
      tick: "#64748b",
      label: "#94a3b8",
    };
  }, [resolvedTheme]);
}

interface StatsChartsProps {
  stats: {
    dailyData: { date: string; label: string; tamamlandi: number; kismen: number; toplam: number }[];
    subjectData: { name: string; tamamlandi: number; kismen: number; toplam: number }[];
    weeklyTotal: number;
    previousWeekTotal: number;
    previousWeekTopics: number;
    thisWeekTopics: number;
  } | null;
}

export function StatsCharts({ stats }: StatsChartsProps) {
  const ct = useChartTheme();

  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 dark:border-slate-800 dark:bg-slate-900/80">
        <p className="text-center text-slate-500">İstatistik yüklenemedi.</p>
      </div>
    );
  }

  const {
    dailyData,
    subjectData,
    weeklyTotal,
    previousWeekTotal = 0,
    previousWeekTopics = 0,
    thisWeekTopics = 0,
  } = stats;

  const questionDiff = weeklyTotal - previousWeekTotal;
  const topicDiff = thisWeekTopics - previousWeekTopics;

  const tooltipStyle = {
    backgroundColor: ct.bg,
    border: `1px solid ${ct.border}`,
    borderRadius: "12px",
    color: ct.text,
    fontSize: "12px",
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700 dark:hover:shadow-slate-950/30">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
          Önceki haftaya kıyasla
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition-all hover:scale-[1.01] hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700">
            <p className="mb-0.5 text-xs font-medium text-slate-500">Toplam çözülen soru</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {previousWeekTotal} → {weeklyTotal}
            </p>
            <p
              className={`text-sm font-semibold ${
                questionDiff >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {questionDiff >= 0 ? "+" : ""}
              {questionDiff} soru
            </p>
          </div>
          <div className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition-all hover:scale-[1.01] hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700">
            <p className="mb-0.5 text-xs font-medium text-slate-500">Bitirilen konu</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {previousWeekTopics} → {thisWeekTopics}
            </p>
            <p
              className={`text-sm font-semibold ${
                topicDiff >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {topicDiff >= 0 ? "+" : ""}
              {topicDiff} konu
            </p>
          </div>
        </div>
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Önceki hafta", soru: previousWeekTotal, konu: previousWeekTopics },
                { name: "Bu hafta", soru: weeklyTotal, konu: thisWeekTopics },
              ]}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                type="number"
                tick={{ fill: ct.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: ct.label, fontSize: 12 }}
                width={65}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [
                  v ?? 0,
                  name === "soru" ? "Soru" : "Konu",
                ]}
              />
              <Bar dataKey="soru" fill={COLORS[0]} name="soru" radius={[0, 6, 6, 0]} />
              <Bar dataKey="konu" fill={COLORS[1]} name="konu" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700 dark:hover:shadow-slate-950/30">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
          Bu hafta – günlük soru çözümü
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tamamlandiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="kismenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                dataKey="label"
                tick={{ fill: ct.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: ct.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: ct.label }}
                formatter={(v, name) => [
                  v ?? 0,
                  name === "tamamlandi" ? "Tamamlandı" : "Kısmen",
                ]}
              />
              <Area
                type="monotone"
                dataKey="tamamlandi"
                stackId="1"
                stroke="#818cf8"
                fill="url(#tamamlandiGrad)"
                strokeWidth={2}
                name="tamamlandi"
              />
              <Area
                type="monotone"
                dataKey="kismen"
                stackId="1"
                stroke="#fb923c"
                fill="url(#kismenGrad)"
                strokeWidth={2}
                name="kismen"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700 dark:hover:shadow-slate-950/30">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
          Derse göre dağılım
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div className="h-56 w-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  dataKey="toplam"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={42}
                  paddingAngle={2}
                  label={false}
                >
                  {subjectData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                      className="transition-opacity hover:opacity-90"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number | undefined) => [v ?? 0, "Soru"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:flex-col sm:gap-y-3">
            {subjectData.map((item, index) => {
              const total = subjectData.reduce((s, d) => s + d.toplam, 0);
              const pct = total > 0 ? ((item.toplam / total) * 100).toFixed(0) : "0";
              return (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {item.name}{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">{pct}%</span>
                    <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">({item.toplam})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
