"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabase";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function formatAmount(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return n.toLocaleString();
}

function formatAmountFull(n: number) {
  return n.toLocaleString() + "원";
}

// ── CSS 세로 막대 차트 ──────────────────────────────────────────
function VerticalBarChart({
  data,
}: {
  data: { label: string; expense: number; income: number }[];
}) {
  const maxVal = Math.max(...data.flatMap((d) => [d.expense, d.income]), 1);

  return (
    <div className="flex items-end justify-between gap-1 h-36 px-1">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: "112px" }}>
            {/* 수입 */}
            <div
              className="flex-1 bg-emerald-200 rounded-t-sm transition-all duration-500"
              style={{ height: `${(d.income / maxVal) * 100}%`, minHeight: d.income > 0 ? "2px" : "0" }}
              title={`수입 ${formatAmountFull(d.income)}`}
            />
            {/* 지출 */}
            <div
              className="flex-1 bg-rose-200 rounded-t-sm transition-all duration-500"
              style={{ height: `${(d.expense / maxVal) * 100}%`, minHeight: d.expense > 0 ? "2px" : "0" }}
              title={`지출 ${formatAmountFull(d.expense)}`}
            />
          </div>
          <span className="text-[9px] text-gray-300">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── CSS 수평 비중 바 ────────────────────────────────────────────
function HorizontalBars({
  items,
  color,
  formatValue,
}: {
  items: { label: string; value: number }[];
  color: string;
  formatValue: (v: number) => string;
}) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-600">{item.label}</span>
            <span className="text-[11px] text-gray-400">{formatValue(item.value)}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${(item.value / maxVal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 단순 세로 막대 (기록 수) ────────────────────────────────────
function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-1 h-24 px-1">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
            <div
              className="w-full bg-gray-200 rounded-t-sm transition-all duration-500"
              style={{ height: `${(d.value / maxVal) * 100}%`, minHeight: d.value > 0 ? "2px" : "0" }}
              title={`${d.value}건`}
            />
          </div>
          <span className="text-[9px] text-gray-300">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── 카드 ────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-5 py-4">
      <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-xl font-bold leading-tight ${valueColor ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-300 mt-1">{sub}</p>}
    </div>
  );
}

// ── 섹션 래퍼 ────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-6 py-5">
      <p className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-5">{title}</p>
      {children}
    </div>
  );
}

// ── 메인 ────────────────────────────────────────────────────────
export default function StatsPage() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [years, setYears] = useState<number[]>([today.getFullYear()]);
  const [loading, setLoading] = useState(true);

  // 원시 데이터
  const [expensesByMonth, setExpensesByMonth] = useState<Record<number, number>>({});
  const [incomesByMonth, setIncomesByMonth] = useState<Record<number, number>>({});
  const [expenseByCategory, setExpenseByCategory] = useState<{ label: string; value: number }[]>([]);
  const [activityByCategory, setActivityByCategory] = useState<{ label: string; value: number }[]>([]);
  const [diaryByMonth, setDiaryByMonth] = useState<Record<number, number>>({});
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [diaryDays, setDiaryDays] = useState(0);
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    const fetchYears = async () => {
      const [expRes, incRes, diaRes, actRes] = await Promise.all([
        supabase.from("expenses").select("date").gt("amount", 0),
        supabase.from("incomes").select("date").gt("amount", 0),
        supabase.from("diaries").select("date").neq("content", ""),
        supabase.from("activities").select("date").neq("content", ""),
      ]);
      const allDates = [
        ...(expRes.data ?? []),
        ...(incRes.data ?? []),
        ...(diaRes.data ?? []),
        ...(actRes.data ?? []),
      ].map((r) => parseInt(r.date.split("-")[0]));
      const uniqueYears = [...new Set([today.getFullYear(), ...allDates])].sort((a, b) => b - a);
      setYears(uniqueYears);
    };
    fetchYears();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const [expRes, incRes, diaRes, actRes] = await Promise.all([
        supabase.from("expenses").select("date, amount, category").gt("amount", 0).gte("date", startDate).lte("date", endDate),
        supabase.from("incomes").select("date, amount, category").gt("amount", 0).gte("date", startDate).lte("date", endDate),
        supabase.from("diaries").select("date").neq("content", "").gte("date", startDate).lte("date", endDate),
        supabase.from("activities").select("date, category").neq("content", "").eq("type", "bullet").gte("date", startDate).lte("date", endDate),
      ]);

      // 월별 지출
      const expMonth: Record<number, number> = {};
      let sumExp = 0;
      for (const e of expRes.data ?? []) {
        const m = parseInt(e.date.split("-")[1]);
        expMonth[m] = (expMonth[m] ?? 0) + e.amount;
        sumExp += e.amount;
      }
      setExpensesByMonth(expMonth);
      setTotalExpense(sumExp);

      // 월별 수입
      const incMonth: Record<number, number> = {};
      let sumInc = 0;
      for (const i of incRes.data ?? []) {
        const m = parseInt(i.date.split("-")[1]);
        incMonth[m] = (incMonth[m] ?? 0) + i.amount;
        sumInc += i.amount;
      }
      setIncomesByMonth(incMonth);
      setTotalIncome(sumInc);

      // 지출 카테고리
      const catMap: Record<string, number> = {};
      for (const e of expRes.data ?? []) {
        catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
      }
      setExpenseByCategory(
        Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 7)
          .map(([label, value]) => ({ label, value }))
      );

      // 활동 카테고리
      const actCatMap: Record<string, number> = {};
      for (const a of actRes.data ?? []) {
        actCatMap[a.category] = (actCatMap[a.category] ?? 0) + 1;
      }
      setActivityByCategory(
        Object.entries(actCatMap)
          .sort((a, b) => b[1] - a[1])
          .map(([label, value]) => ({ label, value }))
      );
      setActivityCount((actRes.data ?? []).length);

      // 월별 일기
      const diaMonth: Record<number, number> = {};
      const diaDates = new Set<string>();
      for (const d of diaRes.data ?? []) {
        diaDates.add(d.date);
        const m = parseInt(d.date.split("-")[1]);
        diaMonth[m] = (diaMonth[m] ?? 0) + 1;
      }
      setDiaryByMonth(diaMonth);
      setDiaryDays(diaDates.size);

      setLoading(false);
    };
    fetchStats();
  }, [selectedYear]);

  // 차트용 데이터 가공
  const monthlyData = MONTHS.map((m) => ({
    label: `${m}월`,
    expense: expensesByMonth[m] ?? 0,
    income: incomesByMonth[m] ?? 0,
  }));

  const diaryMonthData = MONTHS.map((m) => ({
    label: `${m}월`,
    value: diaryByMonth[m] ?? 0,
  }));

  const net = totalIncome - totalExpense;

  return (
    <div className="flex h-full w-full">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">통계</h1>
            <p className="text-xs text-gray-400 mt-0.5">연간 기록 대시보드</p>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* 왼쪽 필터 */}
          <aside className="w-44 shrink-0 border-r border-gray-100 bg-[#f9f8f6] flex flex-col overflow-hidden">
            <div className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-hidden">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-1.5">연도</p>
                <div className="flex flex-wrap gap-1">
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        selectedYear === y
                          ? "bg-gray-900 text-white font-medium"
                          : "text-gray-500 hover:bg-gray-200/70"
                      }`}
                    >
                      {y}년
                    </button>
                  ))}
                </div>
              </div>

              {/* 범례 */}
              {!loading && (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <p className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-2">범례</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-200 shrink-0" />
                    <span className="text-[11px] text-gray-500">수입</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-rose-200 shrink-0" />
                    <span className="text-[11px] text-gray-500">지출</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gray-200 shrink-0" />
                    <span className="text-[11px] text-gray-500">기록</span>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* 메인 대시보드 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-300">불러오는 중...</p>
              </div>
            ) : (
              <div className="px-8 py-8 space-y-6">

                {/* 요약 카드 */}
                <div className="grid grid-cols-4 gap-4">
                  <StatCard
                    label="연간 지출"
                    value={formatAmount(totalExpense)}
                    sub={formatAmountFull(totalExpense)}
                    valueColor="text-rose-500"
                  />
                  <StatCard
                    label="연간 수입"
                    value={formatAmount(totalIncome)}
                    sub={formatAmountFull(totalIncome)}
                    valueColor="text-emerald-600"
                  />
                  <StatCard
                    label="순수익"
                    value={(net >= 0 ? "+" : "") + formatAmount(net)}
                    sub={formatAmountFull(net)}
                    valueColor={net >= 0 ? "text-gray-800" : "text-rose-500"}
                  />
                  <StatCard
                    label="기록한 날"
                    value={`${diaryDays}일`}
                    sub={`활동 ${activityCount}건`}
                    valueColor="text-gray-800"
                  />
                </div>

                {/* 2열 그리드 */}
                <div className="grid grid-cols-2 gap-4">

                  {/* 월별 지출·수입 */}
                  <Section title="월별 지출 · 수입">
                    <VerticalBarChart data={monthlyData} />
                    <div className="flex justify-between mt-3 px-1">
                      <span className="text-[10px] text-gray-300">
                        최대 지출: {formatAmountFull(Math.max(...Object.values(expensesByMonth), 0))}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        최대 수입: {formatAmountFull(Math.max(...Object.values(incomesByMonth), 0))}
                      </span>
                    </div>
                  </Section>

                  {/* 지출 카테고리 */}
                  <Section title="지출 카테고리">
                    {expenseByCategory.length === 0 ? (
                      <p className="text-sm text-gray-300">지출 데이터가 없습니다.</p>
                    ) : (
                      <HorizontalBars
                        items={expenseByCategory}
                        color="bg-rose-200"
                        formatValue={formatAmountFull}
                      />
                    )}
                  </Section>

                  {/* 활동 카테고리 */}
                  <Section title="활동 카테고리">
                    {activityByCategory.length === 0 ? (
                      <p className="text-sm text-gray-300">활동 데이터가 없습니다.</p>
                    ) : (
                      <HorizontalBars
                        items={activityByCategory}
                        color="bg-gray-300"
                        formatValue={(v) => `${v}건`}
                      />
                    )}
                  </Section>

                  {/* 월별 일기 작성 */}
                  <Section title="월별 일기 작성">
                    <SimpleBarChart data={diaryMonthData} />
                    <p className="text-[10px] text-gray-300 mt-3 px-1">
                      월 평균 {(diaryDays / 12).toFixed(1)}일 작성
                    </p>
                  </Section>

                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
