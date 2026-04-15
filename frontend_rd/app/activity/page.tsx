"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabase";

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

type Activity = {
  id: string;
  date: string;
  category: string;
  content: string;
  type: "bullet" | "sub";
};

type BulletGroup = {
  bullet: Activity;
  subs: Activity[];
};

type ViewMode = "category" | "timeline";

// 순서대로 bullet 기준으로 sub를 묶음
function groupBullets(items: Activity[]): BulletGroup[] {
  const groups: BulletGroup[] = [];
  for (const item of items) {
    if (item.type === "sub" && groups.length > 0) {
      groups[groups.length - 1].subs.push(item);
    } else {
      groups.push({ bullet: item, subs: [] });
    }
  }
  return groups;
}

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(today.getMonth() + 1);
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("activities")
        .select("id, date, category, content, type")
        .neq("content", "")
        .order("date", { ascending: false })
        .order("sort_order");

      setActivities(data ?? []);
      setLoading(false);
    };

    fetchActivities();
  }, []);

  const years = [...new Set(activities.map((a) => getYearMonth(a.date).year))].sort((a, b) => b - a);
  if (!years.includes(today.getFullYear())) years.unshift(today.getFullYear());

  const filtered = activities.filter((a) => {
    const { year, month } = getYearMonth(a.date);
    if (year !== selectedYear) return false;
    if (selectedMonth !== null && month !== selectedMonth) return false;
    return true;
  });

  // 카테고리별 그룹
  const grouped = filtered.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

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

          {/* 메인 컨텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-300">불러오는 중...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-300">기록된 활동이 없습니다.</p>
              </div>
            ) : viewMode === "category" ? (

              /* ── 카테고리별 보기 ── */
              <div className="px-10 py-8">
                <p className="text-xs text-gray-400 mb-6">
                  {selectedYear}년 {selectedMonth !== null ? `${selectedMonth}월` : "전체"} · 총 {filtered.length}건
                </p>

                <div className="space-y-10">
                  {categories.map((cat) => {
                    const items = grouped[cat];
                    const colorClass = CATEGORY_COLORS[cat] ?? DEFAULT_COLOR;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${colorClass}`}>
                            {cat}
                          </span>
                          <span className="text-[11px] text-gray-300">{items.length}건</span>
                          <div className="flex-1 border-b border-dotted border-gray-200" />
                        </div>

                        <div className="space-y-2 pl-1">
                          {groupBullets(items).map((group) => (
                            <div key={group.bullet.id} className="group">
                              <div className="flex items-baseline gap-3">
                                <span className="text-[11px] text-gray-300 shrink-0 w-8">{formatDate(group.bullet.date)}</span>
                                <span className="text-[13px] text-gray-600">{group.bullet.content}</span>
                                <Link
                                  href={`/record/${group.bullet.date}`}
                                  className="text-[10px] text-gray-200 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                >
                                  → 일기로
                                </Link>
                              </div>
                              {group.subs.map((sub) => (
                                <div key={sub.id} className="flex items-baseline gap-3 pl-11 mt-0.5">
                                  <span className="text-gray-300 text-[11px] shrink-0">-</span>
                                  <span className="text-[12px] text-gray-400">{sub.content}</span>
                                </div>
                              ))}
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
                <p className="text-xs text-gray-400 mb-6">
                  {selectedYear}년 {selectedMonth !== null ? `${selectedMonth}월` : "전체"} · 총 {filtered.length}건
                </p>

                <div className="space-y-2">
                  {groupBullets(filtered).map((group) => {
                    const colorClass = CATEGORY_COLORS[group.bullet.category] ?? DEFAULT_COLOR;
                    return (
                      <div key={group.bullet.id} className="group">
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] text-gray-300 shrink-0 w-10">{formatDate(group.bullet.date)}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${colorClass}`}>
                            {group.bullet.category}
                          </span>
                          <span className="text-[13px] text-gray-600 flex-1">{group.bullet.content}</span>
                          <Link
                            href={`/record/${group.bullet.date}`}
                            className="text-[10px] text-gray-200 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          >
                            → 일기로
                          </Link>
                        </div>
                        {group.subs.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-4 pl-14 mt-0.5">
                            <span className="text-gray-300 text-[11px] shrink-0">-</span>
                            <span className="text-[12px] text-gray-400">{sub.content}</span>
                          </div>
                        ))}
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
