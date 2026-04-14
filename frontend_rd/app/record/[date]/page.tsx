"use client";

import { useState, useRef, KeyboardEvent, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

const DEFAULT_EXPENSE_CATEGORIES = [
  "식비", "교통비", "생활용품", "문화/여가", "의류", "의료", "구독", "기타",
];

const DEFAULT_ACTIVITY_CATEGORIES = ["식당", "영화", "드라마", "전시", "만남", "여행", "공연"];

const DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

type ActivityLine = { id: number; type: "bullet" | "sub"; category: string; content: string };
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

  // 활동서
  const [activityCategories, setActivityCategories] = useState<string[]>(DEFAULT_ACTIVITY_CATEGORIES);
  const [lines, setLines] = useState<ActivityLine[]>([
    { id: nextLineId++, type: "bullet", category: "식당", content: "" },
  ]);
  const [openPickerId, setOpenPickerId] = useState<number | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // 피커 외부 클릭 시 닫기
  useEffect(() => {
    if (openPickerId === null) return;
    const handler = () => {
      setOpenPickerId(null);
      setShowNewCategoryInput(false);
      setNewCategoryInput("");
    };
    const timer = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [openPickerId]);

  const updateLineCategory = useCallback((id: number, category: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, category } : l)));
  }, []);

  const addCategory = useCallback((name: string, lineId: number) => {
    setActivityCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
    updateLineCategory(lineId, name);
    setOpenPickerId(null);
    setShowNewCategoryInput(false);
    setNewCategoryInput("");
  }, [updateLineCategory]);

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
        if (e.nativeEvent.isComposing) return;
        e.preventDefault();
        const currentLine = lines[idx];
        setLines((prev) => {
          const newLine: ActivityLine = {
            id: nextLineId++,
            type: currentLine.type === "sub" ? "sub" : "bullet",
            category: currentLine.category,
            content: "",
          };
          const next = [...prev];
          next.splice(idx + 1, 0, newLine);
          return next;
        });
        setTimeout(() => lineRefs.current[idx + 1]?.focus(), 0);
      }

      if (e.key === "Backspace") {
        setLines((prev) => {
          const line = prev[idx];
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
    [lines]
  );

  // 호조(지출)
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [openExpensePickerId, setOpenExpensePickerId] = useState<number | null>(null);
  const [showExpenseNewInput, setShowExpenseNewInput] = useState(false);
  const [newExpenseInput, setNewExpenseInput] = useState("");

  useEffect(() => {
    if (openExpensePickerId === null) return;
    const handler = () => {
      setOpenExpensePickerId(null);
      setShowExpenseNewInput(false);
      setNewExpenseInput("");
    };
    const timer = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [openExpensePickerId]);

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
                <div className="space-y-2">
                  {lines.map((line, idx) => (
                    <div key={line.id} className={`flex items-center gap-2 ${line.type === "sub" ? "pl-4" : ""}`}>

                      {/* 카테고리 태그 (bullet만) */}
                      {line.type === "sub" ? (
                        <span className="text-gray-300 text-[12px] shrink-0 select-none">-</span>
                      ) : (
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openPickerId === line.id) {
                              setOpenPickerId(null);
                              setShowNewCategoryInput(false);
                              setNewCategoryInput("");
                            } else {
                              setShowNewCategoryInput(false);
                              setNewCategoryInput("");
                              setOpenPickerId(line.id);
                            }
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors whitespace-nowrap leading-tight"
                        >
                          {line.category} ▾
                        </button>

                        {openPickerId === line.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10 min-w-[96px] py-1"
                          >
                            {activityCategories.map((cat) => (
                              <button
                                key={cat}
                                onClick={() => {
                                  updateLineCategory(line.id, cat);
                                  setOpenPickerId(null);
                                  setShowNewCategoryInput(false);
                                  setNewCategoryInput("");
                                }}
                                className="w-full text-left px-3 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                              >
                                <span className={`text-[9px] ${line.category === cat ? "text-gray-700" : "opacity-0"}`}>✓</span>
                                <span className={line.category === cat ? "text-gray-800 font-medium" : "text-gray-500"}>
                                  {cat}
                                </span>
                              </button>
                            ))}

                            <div className="border-t border-gray-100 mt-1 pt-1">
                              {showNewCategoryInput ? (
                                <div className="px-3 py-1 flex items-center gap-1">
                                  <input
                                    autoFocus
                                    type="text"
                                    value={newCategoryInput}
                                    onChange={(e) => setNewCategoryInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && newCategoryInput.trim()) {
                                        addCategory(newCategoryInput.trim(), line.id);
                                      }
                                      if (e.key === "Escape") {
                                        setShowNewCategoryInput(false);
                                        setNewCategoryInput("");
                                      }
                                    }}
                                    placeholder="새 카테고리"
                                    className="text-[11px] outline-none w-full text-gray-600 placeholder:text-gray-300"
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowNewCategoryInput(true)}
                                  className="w-full text-left px-3 py-1 text-[11px] text-gray-400 hover:bg-gray-50 flex items-center gap-1 transition-colors"
                                >
                                  <span>+</span>
                                  <span>카테고리 추가</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      )}

                      {/* 내용 입력 */}
                      <input
                        ref={(el) => { lineRefs.current[idx] = el; }}
                        type="text"
                        value={line.content}
                        onChange={(e) => updateLine(idx, e.target.value)}
                        onKeyDown={(e) => handleLineKeyDown(e, idx)}
                        placeholder={idx === 0 && lines.length === 1 ? "내용 입력 후 Enter" : ""}
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
                          <div className="flex items-center gap-1 mb-0.5 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openExpensePickerId === row.id) {
                                  setOpenExpensePickerId(null);
                                  setShowExpenseNewInput(false);
                                  setNewExpenseInput("");
                                } else {
                                  setShowExpenseNewInput(false);
                                  setNewExpenseInput("");
                                  setOpenExpensePickerId(row.id);
                                }
                              }}
                              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap leading-tight"
                            >
                              {row.category} ▾
                            </button>

                            {openExpensePickerId === row.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10 min-w-[108px] py-1"
                              >
                                {expenseCategories.map((cat) => (
                                  <button
                                    key={cat}
                                    onClick={() => {
                                      updateExpenseRow(row.id, "category", cat);
                                      setOpenExpensePickerId(null);
                                      setShowExpenseNewInput(false);
                                      setNewExpenseInput("");
                                    }}
                                    className="w-full text-left px-3 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                                  >
                                    <span className={`text-[9px] ${row.category === cat ? "text-gray-700" : "opacity-0"}`}>✓</span>
                                    <span className={row.category === cat ? "text-gray-800 font-medium" : "text-gray-500"}>
                                      {cat}
                                    </span>
                                  </button>
                                ))}

                                <div className="border-t border-gray-100 mt-1 pt-1">
                                  {showExpenseNewInput ? (
                                    <div className="px-3 py-1 flex items-center gap-1">
                                      <input
                                        autoFocus
                                        type="text"
                                        value={newExpenseInput}
                                        onChange={(e) => setNewExpenseInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && newExpenseInput.trim()) {
                                            const name = newExpenseInput.trim();
                                            setExpenseCategories((prev) => prev.includes(name) ? prev : [...prev, name]);
                                            updateExpenseRow(row.id, "category", name);
                                            setOpenExpensePickerId(null);
                                            setShowExpenseNewInput(false);
                                            setNewExpenseInput("");
                                          }
                                          if (e.key === "Escape") {
                                            setShowExpenseNewInput(false);
                                            setNewExpenseInput("");
                                          }
                                        }}
                                        placeholder="새 카테고리"
                                        className="text-[11px] outline-none w-full text-gray-600 placeholder:text-gray-300"
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setShowExpenseNewInput(true)}
                                      className="w-full text-left px-3 py-1 text-[11px] text-gray-400 hover:bg-gray-50 flex items-center gap-1 transition-colors"
                                    >
                                      <span>+</span>
                                      <span>카테고리 추가</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
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
