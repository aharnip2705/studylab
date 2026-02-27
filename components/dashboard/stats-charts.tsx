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

const COLORS = ["#818cf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6", "#22d3ee"];

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
  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
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

  return (
    <div className="space-y-5">
      {/* Önceki hafta kıyaslaması */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/30">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
          Önceki haftaya kıyasla
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="group rounded-xl border border-slate-800 bg-slate-800/40 p-5 transition-all hover:scale-[1.01] hover:border-slate-700">
            <p className="mb-0.5 text-xs font-medium text-slate-500">Toplam çözülen soru</p>
            <p className="text-2xl font-bold text-white">
              {previousWeekTotal} → {weeklyTotal}
            </p>
            <p
              className={`text-sm font-semibold ${
                questionDiff >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {questionDiff >= 0 ? "+" : ""}
              {questionDiff} soru
            </p>
          </div>
          <div className="group rounded-xl border border-slate-800 bg-slate-800/40 p-5 transition-all hover:scale-[1.01] hover:border-slate-700">
            <p className="mb-0.5 text-xs font-medium text-slate-500">Bitirilen konu</p>
            <p className="text-2xl font-bold text-white">
              {previousWeekTopics} → {thisWeekTopics}
            </p>
            <p
              className={`text-sm font-semibold ${
                topicDiff >= 0 ? "text-emerald-400" : "text-rose-400"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                width={65}
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

      {/* Günlük soru çözümü */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/30">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
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
                labelStyle={{ color: "#94a3b8" }}
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

      {/* Derse göre dağılım */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/30">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">
          Derse göre dağılım
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subjectData}
                dataKey="toplam"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: "#475569" }}
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
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                }}
                formatter={(v: number | undefined) => [v ?? 0, "Soru"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
