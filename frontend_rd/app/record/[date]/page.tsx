"use client";

import { useState, useRef, KeyboardEvent, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

const EXPENSE_CATEGORIES = [
  "식비", "교통비", "생활용품", "문화/여가", "의류", "의료", "구독", "기타",
];

const DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

type ActivityLine = { id: number; type: "bullet" | "sub"; content: string };
type ExpenseRow = { id: number; category: string; place: string; item: string; amount: string };

let nextLineId = 1;
let nextExpenseId = 2;

function parseDateParam(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const obj = new Date(y, m - 1, d);
  return { year: y, month: m, day: d, dayOfWeek: DAY_NAMES[obj.getDay()] };
}

export default function RecordPage() {
  const params = useParams();
  const date = params.date as string;
  const { year, month, day, dayOfWeek } = parseDateParam(date);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [diary, setDiary] = useState("");

  // 활동서 — 줄 단위 리스트
  const [lines, setLines] = useState<ActivityLine[]>([
    { id: nextLineId++, type: "bullet", content: "" },
  ]);

  const updateLine = useCallback((idx: number, value: string) => {
    setLines((prev) => {
      const next = [...prev];
      const line = next[idx];
      // 빈 bullet에서 '-' 입력 시 sub로 전환
      if (line.type === "bullet" && line.content === "" && value === "-") {
        next[idx] = { ...line, type: "sub", content: "" };
      } else {
        next[idx] = { ...line, content: value };
      }
      return next;
    });
  }, []);

  const handleLineKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const newLine: ActivityLine = { id: nextLineId++, type: "bullet", content: "" };
        setLines((prev) => {
          const next = [...prev];
          next.splice(idx + 1, 0, newLine);
          return next;
        });
        setTimeout(() => lineRefs.current[idx + 1]?.focus(), 0);
      }

      if (e.key === "Backspace") {
        setLines((prev) => {
          const line = prev[idx];
          // 내용 있으면 기본 동작
          if (line.content !== "") return prev;
          // 빈 sub → bullet으로 전환
          if (line.type === "sub") {
            e.preventDefault();
            const next = [...prev];
            next[idx] = { ...line, type: "bullet" };
            return next;
          }
          // 빈 bullet + 줄이 2개 이상 → 줄 삭제
          if (prev.length > 1) {
            e.preventDefault();
            const next = prev.filter((_, i) => i !== idx);
            setTimeout(() => lineRefs.current[Math.max(0, idx - 1)]?.focus(), 0);
            return next;
          }
          return prev;
        });
      }
    },
    []
  );

  // 호조(지출)
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { id: 1, category: "식비", place: "", item: "", amount: "" },
  ]);

  const addExpenseRow = () => {
    setExpenses((prev) => [
      ...prev,
      { id: nextExpenseId++, category: "식비", place: "", item: "", amount: "" },
    ]);
  };

  const removeExpenseRow = (id: number) => {
    setExpenses((prev) => prev.filter((r) => r.id !== id));
  };

  const updateExpenseRow = (id: number, field: keyof ExpenseRow, value: string) => {
    setExpenses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const totalExpense = expenses.reduce((sum, r) => {
    const n = parseInt(r.amount.replace(/,/g, ""), 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const itemCount = expenses.filter((r) => r.amount !== "").length;

  return (
    <div className="flex h-full w-full">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
              aria-label="달력으로 돌아가기"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {year}년 {month}월 {day}일
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">{dayOfWeek}</p>
            </div>
          </div>
          <button
            onClick={() => alert("저장 기능은 백엔드 연동 후 활성화됩니다.")}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            저장
          </button>
        </div>

        {/* 7:3 본문 */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── 왼쪽 70% : 사초(일기) ── */}
          <div className="flex flex-col w-[70%] border-r border-gray-100 overflow-y-auto">
            <div className="flex-1 px-10 py-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[11px] font-bold tracking-widest text-gray-300 uppercase">사초</span>
                <span className="text-gray-200">·</span>
                <span className="text-[11px] text-gray-300">일기</span>
              </div>
              <textarea
                ref={textareaRef}
                value={diary}
                onChange={(e) => {
                  setDiary(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                placeholder="오늘 하루를 기록하세요..."
                style={{ minHeight: "500px" }}
                className="w-full resize-none overflow-hidden outline-none text-gray-800 text-[15px] leading-9 placeholder:text-gray-200 bg-transparent"
              />
            </div>
          </div>

          {/* ── 오른쪽 30% ── */}
          <div className="w-[30%] overflow-y-auto bg-[#fafaf8] flex flex-col">
            <div className="px-6 py-8 space-y-0">

              {/* ── 활동서 섹션 ── */}
              <div className="mb-2">
                <div className="text-center mb-4">
                  <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">활동서</p>
                  <p className="text-[13px] font-bold text-gray-700">오늘의 활동</p>
                </div>

                <div className="border-t border-dashed border-gray-300 mb-4" />

                {/* 활동 줄 목록 */}
                <div className="space-y-1">
                  {lines.map((line, idx) => (
                    <div
                      key={line.id}
                      className={`flex items-center gap-1.5 ${line.type === "sub" ? "pl-4" : ""}`}
                    >
                      <span className="text-gray-400 text-[12px] shrink-0 select-none">
                        {line.type === "bullet" ? "•" : "-"}
                      </span>
                      <input
                        ref={(el) => { lineRefs.current[idx] = el; }}
                        type="text"
                        value={line.content}
                        onChange={(e) => updateLine(idx, e.target.value)}
                        onKeyDown={(e) => handleLineKeyDown(e, idx)}
                        placeholder={idx === 0 && lines.length === 1 ? "활동 입력 후 Enter" : ""}
                        className="flex-1 text-[12px] text-gray-600 bg-transparent outline-none placeholder:text-gray-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 섹션 구분 ── */}
              <div className="border-t-2 border-dashed border-gray-300 my-6" />

              {/* ── 호조(지출) 영수증 섹션 ── */}
              <div>
                <div className="text-center mb-4">
                  <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">호조</p>
                  <p className="text-[13px] font-bold text-gray-700">지출 내역서</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {year}.{String(month).padStart(2, "0")}.{String(day).padStart(2, "0")}
                  </p>
                </div>

                <div className="border-t border-dashed border-gray-300 mb-4" />

                <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-2 px-0.5">
                  <span>항목</span>
                  <span>금액</span>
                </div>

                <div className="space-y-3">
                  {expenses.map((row, idx) => (
                    <div key={row.id} className="group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <select
                              value={row.category}
                              onChange={(e) => updateExpenseRow(row.id, "category", e.target.value)}
                              className="text-[10px] text-gray-400 bg-transparent outline-none border-none cursor-pointer"
                            >
                              {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={row.place}
                            onChange={(e) => updateExpenseRow(row.id, "place", e.target.value)}
                            placeholder="장소"
                            className="w-full text-[12px] text-gray-600 bg-transparent outline-none placeholder:text-gray-300 leading-snug"
                          />
                          <input
                            type="text"
                            value={row.item}
                            onChange={(e) => updateExpenseRow(row.id, "item", e.target.value)}
                            placeholder="물품명"
                            className="w-full text-[11px] text-gray-400 bg-transparent outline-none placeholder:text-gray-300 leading-snug"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={row.amount}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, "");
                              const formatted = raw ? parseInt(raw, 10).toLocaleString() : "";
                              updateExpenseRow(row.id, "amount", formatted);
                            }}
                            placeholder="0"
                            className="w-16 text-[12px] text-gray-700 font-medium bg-transparent outline-none text-right placeholder:text-gray-300"
                          />
                          <span className="text-[10px] text-gray-400">원</span>
                          <button
                            onClick={() => removeExpenseRow(row.id)}
                            disabled={expenses.length === 1}
                            className="opacity-0 group-hover:opacity-100 disabled:!opacity-0 text-gray-300 hover:text-gray-500 transition-all text-sm leading-none ml-0.5"
                            aria-label="삭제"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {idx < expenses.length - 1 && (
                        <div className="border-b border-dotted border-gray-200 mt-3" />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addExpenseRow}
                  className="mt-4 flex items-center gap-1 text-[11px] text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <span>+</span>
                  <span>항목 추가</span>
                </button>

                <div className="border-t border-dashed border-gray-300 mt-6 pt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-gray-400">항목 수</span>
                    <span className="text-[11px] text-gray-500">{itemCount}건</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-gray-600">합계</span>
                    <span className="text-[15px] font-bold text-gray-800">
                      {totalExpense.toLocaleString()}
                      <span className="text-[11px] font-normal text-gray-400 ml-0.5">원</span>
                    </span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 mt-6 pt-4 text-center">
                  <p className="text-[10px] text-gray-300 tracking-wide">— 호조 기록부 —</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
