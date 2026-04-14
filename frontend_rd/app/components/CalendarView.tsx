"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 목업 데이터: 날짜 → { 일기 여부, 지출 합계 }
const mockData: Record<string, { hasEntry: boolean; expense?: number }> = {
  "2026-04-01": { hasEntry: true, expense: 15000 },
  "2026-04-03": { hasEntry: true, expense: 8200 },
  "2026-04-05": { hasEntry: true },
  "2026-04-07": { hasEntry: true, expense: 32500 },
  "2026-04-09": { hasEntry: false, expense: 5500 },
  "2026-04-10": { hasEntry: true, expense: 12000 },
  "2026-04-11": { hasEntry: true },
  "2026-04-13": { hasEntry: true, expense: 45200 },
  "2026-04-14": { hasEntry: true, expense: 21000 },
  "2026-04-16": { hasEntry: true, expense: 9800 },
  "2026-04-19": { hasEntry: true },
  "2026-04-21": { hasEntry: true, expense: 67000 },
  "2026-04-22": { hasEntry: true, expense: 4500 },
  "2026-04-25": { hasEntry: true, expense: 18000 },
  "2026-04-28": { hasEntry: true, expense: 11000 },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatExpense(amount: number): string {
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000)}만${amount % 10000 > 0 ? ` ${(amount % 10000).toLocaleString()}` : ""}`;
  }
  return `${amount.toLocaleString()}`;
}

export default function CalendarView() {
  const router = useRouter();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const isToday = (day: number) =>
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate();

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">
          {year}년 {MONTH_NAMES[month]}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="이전 달"
          >
            ‹
          </button>
          <button
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="px-3 h-8 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            오늘
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2.5 text-center text-xs font-medium ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNum = idx - firstDayOfWeek + 1;
          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
          const key = isValid ? toDateKey(year, month, dayNum) : null;
          const data = key ? mockData[key] : null;
          const colIndex = idx % 7;

          return (
            <div
              key={idx}
              onClick={() => isValid && key && router.push(`/record/${key}`)}
              className={`border-b border-r border-gray-100 min-h-[100px] p-2 flex flex-col group
                ${!isValid ? "bg-gray-50/50" : "hover:bg-amber-50/40 cursor-pointer transition-colors"}
                ${colIndex === 0 ? "border-l-0" : ""}
              `}
            >
              {isValid && (
                <>
                  {/* 날짜 숫자 */}
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                        ${isToday(dayNum)
                          ? "bg-gray-900 text-white"
                          : colIndex === 0
                          ? "text-red-400"
                          : colIndex === 6
                          ? "text-blue-400"
                          : "text-gray-700"
                        }
                      `}
                    >
                      {dayNum}
                    </span>
                    {/* 일기 인디케이터 */}
                    {data?.hasEntry && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 mr-0.5 shrink-0" />
                    )}
                  </div>

                  {/* 지출 금액 */}
                  {data?.expense && (
                    <div className="mt-auto">
                      <span className="text-[11px] text-gray-400 font-medium">
                        {formatExpense(data.expense)}원
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 범례 */}
      <div className="flex items-center gap-4 px-8 py-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[11px] text-gray-400">일기 기록</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-medium">N원</span>
          <span className="text-[11px] text-gray-400">지출 합계</span>
        </div>
      </div>
    </div>
  );
}
