"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";

const CATEGORY_COLORS: Record<string, string> = {
  식당: "bg-amber-50 text-amber-700 border-amber-200",
  영화: "bg-blue-50 text-blue-700 border-blue-200",
  드라마: "bg-purple-50 text-purple-700 border-purple-200",
  전시: "bg-green-50 text-green-700 border-green-200",
  만남: "bg-rose-50 text-rose-700 border-rose-200",
  여행: "bg-cyan-50 text-cyan-700 border-cyan-200",
  공연: "bg-orange-50 text-orange-700 border-orange-200",
};

const DEFAULT_COLOR = "bg-gray-50 text-gray-600 border-gray-200";

// 목 데이터 — 백엔드 연동 전 임시
const MOCK_ACTIVITIES = [
  { id: 1, date: "2026-04-13", category: "영화", content: "메가박스 강남 - 프로젝트 헤일메리" },
  { id: 2, date: "2026-04-13", category: "식당", content: "온지음 - 한정식 코스" },
  { id: 3, date: "2026-04-11", category: "만남", content: "친구들이랑 홍대" },
  { id: 4, date: "2026-04-10", category: "전시", content: "국립현대미술관 - 이우환 회고전" },
  { id: 5, date: "2026-04-09", category: "식당", content: "스시야 - 오마카세" },
  { id: 6, date: "2026-04-08", category: "드라마", content: "정년이 - 시즌2 완주" },
  { id: 7, date: "2026-04-06", category: "공연", content: "LG아트센터 - 로미오와 줄리엣" },
  { id: 8, date: "2026-04-05", category: "식당", content: "을밀대 - 평양냉면" },
  { id: 9, date: "2026-04-03", category: "영화", content: "씨네Q - 콘클라베" },
  { id: 10, date: "2026-04-01", category: "만남", content: "대학 동기 모임 - 이태원" },
  { id: 11, date: "2026-03-28", category: "여행", content: "전주 한옥마을 당일치기" },
  { id: 12, date: "2026-03-25", category: "식당", content: "진진 - 중식 코스" },
  { id: 13, date: "2026-03-20", category: "영화", content: "CGV 용산 - 미키 17" },
];

type ViewMode = "category" | "timeline";

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}/${d}`;
}

function getYearMonth(dateStr: string) {
  const [y, m] = dateStr.split("-").map(Number);
  return { year: y, month: m };
}

export default function ActivityPage() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(today.getMonth() + 1);
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  const filtered = MOCK_ACTIVITIES.filter((a) => {
    const { year, month } = getYearMonth(a.date);
    if (year !== selectedYear) return false;
    if (selectedMonth !== null && month !== selectedMonth) return false;
    return true;
  });

  // 카테고리별 그룹
  const grouped = filtered.reduce<Record<string, typeof MOCK_ACTIVITIES>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  const years = [2026, 2025];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="flex h-full w-full">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">활동서</h1>
            <p className="text-xs text-gray-400 mt-0.5">활동 기록 · 아카이브</p>
          </div>

          {/* 뷰 토글 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setViewMode("category")}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                viewMode === "category"
                  ? "bg-white text-gray-900 font-medium shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              카테고리별
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                viewMode === "timeline"
                  ? "bg-white text-gray-900 font-medium shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              시간순
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* 왼쪽 필터 패널 */}
          <aside className="w-48 shrink-0 border-r border-gray-100 bg-[#f9f8f6] overflow-y-auto">
            <div className="px-4 py-5">

              {/* 연도 */}
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

              {/* 월 */}
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
                {months.map((m) => (
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

          {/* 메인 컨텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-300">기록된 활동이 없습니다.</p>
              </div>
            ) : viewMode === "category" ? (

              /* ── 카테고리별 보기 ── */
              <div className="px-10 py-8">
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {selectedYear}년 {selectedMonth !== null ? `${selectedMonth}월` : "전체"} · 총 {filtered.length}건
                  </p>
                </div>

                <div className="space-y-10">
                  {categories.map((cat) => {
                    const items = grouped[cat];
                    const colorClass = CATEGORY_COLORS[cat] ?? DEFAULT_COLOR;
                    return (
                      <div key={cat}>
                        {/* 카테고리 헤더 */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${colorClass}`}>
                            {cat}
                          </span>
                          <span className="text-[11px] text-gray-300">{items.length}건</span>
                          <div className="flex-1 border-b border-dotted border-gray-200" />
                        </div>

                        {/* 항목 목록 */}
                        <div className="space-y-2 pl-1">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-baseline gap-3 group">
                              <span className="text-[11px] text-gray-300 shrink-0 w-8">{formatDate(item.date)}</span>
                              <span className="text-[13px] text-gray-600">{item.content}</span>
                              <Link
                                href={`/record/${item.date}`}
                                className="text-[10px] text-gray-200 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              >
                                → 일기로
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            ) : (

              /* ── 시간순 보기 ── */
              <div className="px-10 py-8">
                <div className="mb-6">
                  <p className="text-xs text-gray-400">
                    {selectedYear}년 {selectedMonth !== null ? `${selectedMonth}월` : "전체"} · 총 {filtered.length}건
                  </p>
                </div>

                <div className="space-y-3">
                  {filtered.map((item) => {
                    const colorClass = CATEGORY_COLORS[item.category] ?? DEFAULT_COLOR;
                    return (
                      <div key={item.id} className="flex items-center gap-4 group">
                        <span className="text-[11px] text-gray-300 shrink-0 w-10">{formatDate(item.date)}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${colorClass}`}>
                          {item.category}
                        </span>
                        <span className="text-[13px] text-gray-600 flex-1">{item.content}</span>
                        <Link
                          href={`/record/${item.date}`}
                          className="text-[10px] text-gray-200 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                          → 일기로
                        </Link>
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
