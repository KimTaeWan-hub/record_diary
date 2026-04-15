"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabase";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

type DiaryEntry = {
  date: string;
  content: string;
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = DAY_NAMES[new Date(y, m - 1, d).getDay()];
  return { label: `${y}년 ${m}월 ${d}일`, dow };
}

function getYearMonth(dateStr: string) {
  const [y, m] = dateStr.split("-").map(Number);
  return { year: y, month: m };
}

export default function DiaryPage() {
  const router = useRouter();
  const today = new Date();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(today.getMonth() + 1);

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("diaries")
        .select("date, content")
        .neq("content", "")
        .order("date", { ascending: false });

      setEntries(data ?? []);
      setLoading(false);
    };

    fetchEntries();
  }, []);

  const years = [...new Set(entries.map((e) => getYearMonth(e.date).year))].sort((a, b) => b - a);
  if (!years.includes(today.getFullYear())) years.unshift(today.getFullYear());

  const filtered = entries.filter((e) => {
    const { year, month } = getYearMonth(e.date);
    if (year !== selectedYear) return false;
    if (selectedMonth !== null && month !== selectedMonth) return false;
    return true;
  });

  return (
    <div className="flex h-full w-full">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">사초</h1>
            <p className="text-xs text-gray-400 mt-0.5">일기 아카이브</p>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽 필터 */}
          <aside className="w-48 shrink-0 border-r border-gray-100 bg-[#f9f8f6] overflow-y-auto">
            <div className="px-4 py-5">
              <p className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-2">연도</p>
              <div className="space-y-0.5 mb-5">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                      selectedYear === y
                        ? "bg-gray-900 text-white font-medium"
                        : "text-gray-500 hover:bg-gray-200/70"
                    }`}
                  >
                    {y}년
                  </button>
                ))}
              </div>

              <p className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-2">월</p>
              <div className="space-y-0.5">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                    selectedMonth === null
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-500 hover:bg-gray-200/70"
                  }`}
                >
                  전체
                </button>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                      selectedMonth === m
                        ? "bg-gray-900 text-white font-medium"
                        : "text-gray-500 hover:bg-gray-200/70"
                    }`}
                  >
                    {m}월
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 메인 목록 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-300">불러오는 중...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-300">기록된 일기가 없습니다.</p>
              </div>
            ) : (
              <div className="px-10 py-8">
                <p className="text-xs text-gray-400 mb-8">
                  {selectedYear}년 {selectedMonth !== null ? `${selectedMonth}월` : "전체"} · 총 {filtered.length}편
                </p>

                <div className="space-y-0">
                  {filtered.map((entry, idx) => {
                    const { label, dow } = formatDate(entry.date);
                    const preview = entry.content.trim().split("\n")[0].slice(0, 60);
                    const isLast = idx === filtered.length - 1;

                    return (
                      <div
                        key={entry.date}
                        onClick={() => router.push(`/record/${entry.date}`)}
                        className={`group flex items-start gap-6 py-5 cursor-pointer hover:bg-amber-50/40 -mx-4 px-4 rounded-md transition-colors ${
                          !isLast ? "border-b border-dotted border-gray-100" : ""
                        }`}
                      >
                        {/* 날짜 */}
                        <div className="shrink-0 w-28 pt-0.5">
                          <p className="text-[13px] font-medium text-gray-700">{label}</p>
                          <p className="text-[11px] text-gray-300 mt-0.5">{dow}요일</p>
                        </div>

                        {/* 미리보기 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-500 leading-relaxed truncate">
                            {preview || "—"}
                          </p>
                        </div>

                        {/* 화살표 */}
                        <span className="text-gray-200 group-hover:text-gray-400 transition-colors text-sm shrink-0 pt-0.5">
                          →
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
