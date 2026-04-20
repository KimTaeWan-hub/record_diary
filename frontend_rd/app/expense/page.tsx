"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabase";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

type ExpenseRow = {
  id: string;
  date: string;
  category: string;
  place: string;
  item: string;
  amount: number;
};

type IncomeRow = {
  id: string;
  date: string;
  category: string;
  source: string;
  amount: number;
};

type ExpenseEditForm = { category: string; place: string; item: string; amount: string };
type IncomeEditForm = { category: string; source: string; amount: string };

type ViewMode = "date" | "category";
type DataType = "expense" | "income";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = DAY_NAMES[new Date(y, m - 1, d).getDay()];
  return `${m}/${d} (${dow})`;
}

function formatAmount(amount: number) {
  return amount.toLocaleString() + "원";
}

function getYearMonth(dateStr: string) {
  const [y, m] = dateStr.split("-").map(Number);
  return { year: y, month: m };
}

export default function ExpensePage() {
  const router = useRouter();
  const today = new Date();

  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(today.getMonth() + 1);
  const [viewMode, setViewMode] = useState<ViewMode>("date");
  const [dataType, setDataType] = useState<DataType>("expense");

  // 지출 인라인 편집
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseEditForm, setExpenseEditForm] = useState<ExpenseEditForm>({ category: "", place: "", item: "", amount: "" });
  const [openExpenseCatPicker, setOpenExpenseCatPicker] = useState(false);
  const expensePickerRef = useRef<HTMLDivElement>(null);

  // 수입 인라인 편집
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [incomeEditForm, setIncomeEditForm] = useState<IncomeEditForm>({ category: "", source: "", amount: "" });
  const [openIncomeCatPicker, setOpenIncomeCatPicker] = useState(false);
  const incomePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [expensesRes, expCatRes, incomesRes, incCatRes] = await Promise.all([
        supabase.from("expenses").select("id, date, category, place, item, amount").gt("amount", 0).order("date", { ascending: false }).order("sort_order"),
        supabase.from("expense_categories").select("name").order("is_default", { ascending: false }).order("created_at"),
        supabase.from("incomes").select("id, date, category, source, amount").gt("amount", 0).order("date", { ascending: false }).order("sort_order"),
        supabase.from("income_categories").select("name").order("is_default", { ascending: false }).order("created_at"),
      ]);
      setExpenses(expensesRes.data ?? []);
      if (expCatRes.data?.length) setExpenseCategories(expCatRes.data.map((c) => c.name));
      setIncomes(incomesRes.data ?? []);
      if (incCatRes.data?.length) setIncomeCategories(incCatRes.data.map((c) => c.name));
      setLoading(false);
    };
    fetchData();
  }, []);

  // 피커 외부 클릭 닫기
  useEffect(() => {
    if (!openExpenseCatPicker && !openIncomeCatPicker) return;
    const handler = (e: MouseEvent) => {
      if (expensePickerRef.current && !expensePickerRef.current.contains(e.target as Node)) setOpenExpenseCatPicker(false);
      if (incomePickerRef.current && !incomePickerRef.current.contains(e.target as Node)) setOpenIncomeCatPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openExpenseCatPicker, openIncomeCatPicker]);

  // ── 지출 편집 ──
  const startEditExpense = (item: ExpenseRow) => {
    setEditingExpenseId(item.id);
    setExpenseEditForm({ category: item.category, place: item.place, item: item.item, amount: item.amount > 0 ? item.amount.toLocaleString() : "" });
    setOpenExpenseCatPicker(false);
  };
  const cancelEditExpense = () => { setEditingExpenseId(null); setOpenExpenseCatPicker(false); };
  const saveEditExpense = async () => {
    if (!editingExpenseId) return;
    const amount = parseInt(expenseEditForm.amount.replace(/,/g, ""), 10) || 0;
    const { error } = await supabase.from("expenses").update({ category: expenseEditForm.category, place: expenseEditForm.place, item: expenseEditForm.item, amount }).eq("id", editingExpenseId);
    if (!error) {
      setExpenses((prev) => prev.map((e) => e.id === editingExpenseId ? { ...e, ...expenseEditForm, amount } : e));
      setEditingExpenseId(null);
    }
  };
  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setEditingExpenseId(null);
    }
  };

  // ── 수입 편집 ──
  const startEditIncome = (item: IncomeRow) => {
    setEditingIncomeId(item.id);
    setIncomeEditForm({ category: item.category, source: item.source, amount: item.amount > 0 ? item.amount.toLocaleString() : "" });
    setOpenIncomeCatPicker(false);
  };
  const cancelEditIncome = () => { setEditingIncomeId(null); setOpenIncomeCatPicker(false); };
  const saveEditIncome = async () => {
    if (!editingIncomeId) return;
    const amount = parseInt(incomeEditForm.amount.replace(/,/g, ""), 10) || 0;
    const { error } = await supabase.from("incomes").update({ category: incomeEditForm.category, source: incomeEditForm.source, amount }).eq("id", editingIncomeId);
    if (!error) {
      setIncomes((prev) => prev.map((i) => i.id === editingIncomeId ? { ...i, ...incomeEditForm, amount } : i));
      setEditingIncomeId(null);
    }
  };
  const deleteIncome = async (id: string) => {
    const { error } = await supabase.from("incomes").delete().eq("id", id);
    if (!error) {
      setIncomes((prev) => prev.filter((i) => i.id !== id));
      setEditingIncomeId(null);
    }
  };

  // ── 필터링 ──
  const allDates = [...new Set([...expenses, ...incomes].map((e) => e.date))];
  const years = [...new Set(allDates.map((d) => getYearMonth(d).year))].sort((a, b) => b - a);
  if (!years.includes(today.getFullYear())) years.unshift(today.getFullYear());

  const filteredExpenses = expenses.filter((e) => {
    const { year, month } = getYearMonth(e.date);
    return year === selectedYear && (selectedMonth === null || month === selectedMonth);
  });
  const filteredIncomes = incomes.filter((i) => {
    const { year, month } = getYearMonth(i.date);
    return year === selectedYear && (selectedMonth === null || month === selectedMonth);
  });

  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = filteredIncomes.reduce((s, i) => s + i.amount, 0);
  const netAmount = totalIncome - totalExpense;

  // 지출 그룹
  const expByDate = filteredExpenses.reduce<Record<string, ExpenseRow[]>>((acc, e) => { if (!acc[e.date]) acc[e.date] = []; acc[e.date].push(e); return acc; }, {});
  const sortedExpDates = Object.keys(expByDate).sort((a, b) => b.localeCompare(a));
  const expByCategory = filteredExpenses.reduce<Record<string, { items: ExpenseRow[]; total: number }>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = { items: [], total: 0 };
    acc[e.category].items.push(e); acc[e.category].total += e.amount; return acc;
  }, {});
  const sortedExpCats = Object.keys(expByCategory).sort((a, b) => expByCategory[b].total - expByCategory[a].total);

  // 수입 그룹
  const incByDate = filteredIncomes.reduce<Record<string, IncomeRow[]>>((acc, i) => { if (!acc[i.date]) acc[i.date] = []; acc[i.date].push(i); return acc; }, {});
  const sortedIncDates = Object.keys(incByDate).sort((a, b) => b.localeCompare(a));
  const incByCategory = filteredIncomes.reduce<Record<string, { items: IncomeRow[]; total: number }>>((acc, i) => {
    if (!acc[i.category]) acc[i.category] = { items: [], total: 0 };
    acc[i.category].items.push(i); acc[i.category].total += i.amount; return acc;
  }, {});
  const sortedIncCats = Object.keys(incByCategory).sort((a, b) => incByCategory[b].total - incByCategory[a].total);

  const isEmpty = dataType === "expense" ? filteredExpenses.length === 0 : filteredIncomes.length === 0;

  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">호조</h1>
            <p className="text-xs text-gray-400 mt-0.5">지출 · 수입 관리</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 지출/수입 탭 */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
              <button onClick={() => setDataType("expense")} className={`px-3 py-1.5 text-xs rounded transition-colors ${dataType === "expense" ? "bg-white text-gray-900 font-medium shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>지출</button>
              <button onClick={() => setDataType("income")} className={`px-3 py-1.5 text-xs rounded transition-colors ${dataType === "income" ? "bg-white text-gray-900 font-medium shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>수입</button>
            </div>
            {/* 날짜/카테고리 토글 */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
              <button onClick={() => setViewMode("date")} className={`px-3 py-1.5 text-xs rounded transition-colors ${viewMode === "date" ? "bg-white text-gray-900 font-medium shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>날짜별</button>
              <button onClick={() => setViewMode("category")} className={`px-3 py-1.5 text-xs rounded transition-colors ${viewMode === "category" ? "bg-white text-gray-900 font-medium shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>카테고리별</button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽 필터 */}
          <aside className="w-44 shrink-0 border-r border-gray-100 bg-[#f9f8f6] flex flex-col overflow-hidden">
            <div className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-hidden">

              {/* 연도 */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-1.5">연도</p>
                <div className="flex flex-wrap gap-1">
                  {years.map((y) => (
                    <button key={y} onClick={() => setSelectedYear(y)} className={`px-2 py-1 rounded text-xs transition-colors ${selectedYear === y ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:bg-gray-200/70"}`}>{y}년</button>
                  ))}
                </div>
              </div>

              {/* 월 */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-1.5">월</p>
                <div className="grid grid-cols-3 gap-1">
                  <button onClick={() => setSelectedMonth(null)} className={`col-span-3 py-1 rounded text-xs transition-colors ${selectedMonth === null ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:bg-gray-200/70"}`}>전체</button>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                    <button key={m} onClick={() => setSelectedMonth(m)} className={`py-1 rounded text-xs transition-colors ${selectedMonth === m ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:bg-gray-200/70"}`}>{m}월</button>
                  ))}
                </div>
              </div>

              {/* 수지 요약 */}
              {!loading && (
                <div className="pt-3 border-t border-gray-200 space-y-2.5">
                  <div>
                    <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-0.5">수입</p>
                    <p className="text-sm font-bold text-emerald-600">{formatAmount(totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-0.5">지출</p>
                    <p className="text-sm font-bold text-rose-500">{formatAmount(totalExpense)}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-0.5">순수익</p>
                    <p className={`text-sm font-bold ${netAmount >= 0 ? "text-gray-700" : "text-rose-500"}`}>
                      {netAmount >= 0 ? "+" : ""}{formatAmount(netAmount)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* 메인 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-300">불러오는 중...</p></div>
            ) : isEmpty ? (
              <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-300">기록된 {dataType === "expense" ? "지출" : "수입"}이 없습니다.</p></div>
            ) : dataType === "expense" ? (

              /* ══════════ 지출 ══════════ */
              viewMode === "date" ? (
                <div className="px-10 py-8">
                  <p className="text-xs text-gray-400 mb-8">{selectedYear}년 {selectedMonth != null ? `${selectedMonth}월` : "전체"} · {filteredExpenses.length}건 · {formatAmount(totalExpense)}</p>
                  <div className="space-y-8">
                    {sortedExpDates.map((date) => {
                      const items = expByDate[date];
                      const dayTotal = items.reduce((s, e) => s + e.amount, 0);
                      return (
                        <div key={date}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <button onClick={() => router.push(`/record/${date}`)} className="text-[13px] font-medium text-gray-700 hover:text-gray-900 transition-colors">{formatDate(date)}</button>
                              <div className="border-b border-dotted border-gray-200 w-8" />
                            </div>
                            <span className="text-[12px] font-medium text-gray-500">{formatAmount(dayTotal)}</span>
                          </div>
                          <div className="space-y-1 pl-1">
                            {items.map((item) =>
                              editingExpenseId === item.id ? (
                                <div key={item.id} className="border border-gray-200 rounded-md p-3 bg-white space-y-2">
                                  <div className="relative" ref={expensePickerRef}>
                                    <button onClick={() => setOpenExpenseCatPicker((v) => !v)} className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">{expenseEditForm.category} ▾</button>
                                    {openExpenseCatPicker && (
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10 min-w-[110px] py-1">
                                        {expenseCategories.map((cat) => (
                                          <button key={cat} onClick={() => { setExpenseEditForm((f) => ({ ...f, category: cat })); setOpenExpenseCatPicker(false); }} className="w-full text-left px-3 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5">
                                            <span className={`text-[9px] ${expenseEditForm.category === cat ? "text-gray-700" : "opacity-0"}`}>✓</span>
                                            <span className={expenseEditForm.category === cat ? "font-medium text-gray-800" : "text-gray-500"}>{cat}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <input type="text" value={expenseEditForm.place} onChange={(e) => setExpenseEditForm((f) => ({ ...f, place: e.target.value }))} placeholder="이용처" className="flex-1 text-[12px] border-b border-gray-200 outline-none py-0.5 text-gray-600 placeholder:text-gray-300 bg-transparent" />
                                    <input type="text" value={expenseEditForm.item} onChange={(e) => setExpenseEditForm((f) => ({ ...f, item: e.target.value }))} placeholder="내용" className="flex-1 text-[12px] border-b border-gray-200 outline-none py-0.5 text-gray-600 placeholder:text-gray-300 bg-transparent" />
                                    <input type="text" inputMode="numeric" value={expenseEditForm.amount} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setExpenseEditForm((f) => ({ ...f, amount: raw ? parseInt(raw, 10).toLocaleString() : "" })); }} placeholder="금액" className="w-20 text-[12px] border-b border-gray-200 outline-none py-0.5 text-right text-gray-700 placeholder:text-gray-300 bg-transparent" />
                                    <span className="text-[10px] text-gray-400 self-end pb-0.5">원</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <button onClick={() => deleteExpense(item.id)} className="text-[11px] text-rose-400 hover:text-rose-600 transition-colors">삭제</button>
                                    <div className="flex gap-2">
                                      <button onClick={cancelEditExpense} className="text-[11px] text-gray-400 hover:text-gray-600">취소</button>
                                      <button onClick={saveEditExpense} className="text-[11px] text-gray-900 font-medium hover:text-gray-600">저장</button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div key={item.id} onClick={() => startEditExpense(item)} className="flex items-center justify-between gap-4 group py-1.5 -mx-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 shrink-0">{item.category}</span>
                                    <span className="text-[12px] text-gray-500 truncate">{[item.place, item.item].filter(Boolean).join(" · ")}</span>
                                  </div>
                                  <span className="text-[12px] text-gray-700 font-medium shrink-0">{formatAmount(item.amount)}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-10 py-8">
                  <p className="text-xs text-gray-400 mb-8">{selectedYear}년 {selectedMonth != null ? `${selectedMonth}월` : "전체"} · {filteredExpenses.length}건 · {formatAmount(totalExpense)}</p>
                  <div className="space-y-10">
                    {sortedExpCats.map((cat) => {
                      const { items, total } = expByCategory[cat];
                      const ratio = Math.round((total / totalExpense) * 100);
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200">{cat}</span>
                              <span className="text-[11px] text-gray-300">{items.length}건</span>
                              <div className="flex-1 border-b border-dotted border-gray-200 w-8" />
                            </div>
                            <div className="text-right">
                              <span className="text-[13px] font-medium text-gray-700">{formatAmount(total)}</span>
                              <span className="text-[10px] text-gray-300 ml-1.5">{ratio}%</span>
                            </div>
                          </div>
                          <div className="space-y-2 pl-1">
                            {items.map((item) =>
                              editingExpenseId === item.id ? (
                                <div key={item.id} className="border border-gray-200 rounded-md p-3 bg-white space-y-2">
                                  <div className="relative" ref={expensePickerRef}>
                                    <button onClick={() => setOpenExpenseCatPicker((v) => !v)} className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">{expenseEditForm.category} ▾</button>
                                    {openExpenseCatPicker && (
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10 min-w-[110px] py-1">
                                        {expenseCategories.map((cat) => (
                                          <button key={cat} onClick={() => { setExpenseEditForm((f) => ({ ...f, category: cat })); setOpenExpenseCatPicker(false); }} className="w-full text-left px-3 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5">
                                            <span className={`text-[9px] ${expenseEditForm.category === cat ? "text-gray-700" : "opacity-0"}`}>✓</span>
                                            <span className={expenseEditForm.category === cat ? "font-medium text-gray-800" : "text-gray-500"}>{cat}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <input type="text" value={expenseEditForm.place} onChange={(e) => setExpenseEditForm((f) => ({ ...f, place: e.target.value }))} placeholder="이용처" className="flex-1 text-[12px] border-b border-gray-200 outline-none py-0.5 text-gray-600 placeholder:text-gray-300 bg-transparent" />
                                    <input type="text" value={expenseEditForm.item} onChange={(e) => setExpenseEditForm((f) => ({ ...f, item: e.target.value }))} placeholder="내용" className="flex-1 text-[12px] border-b border-gray-200 outline-none py-0.5 text-gray-600 placeholder:text-gray-300 bg-transparent" />
                                    <input type="text" inputMode="numeric" value={expenseEditForm.amount} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setExpenseEditForm((f) => ({ ...f, amount: raw ? parseInt(raw, 10).toLocaleString() : "" })); }} placeholder="금액" className="w-20 text-[12px] border-b border-gray-200 outline-none py-0.5 text-right text-gray-700 placeholder:text-gray-300 bg-transparent" />
                                    <span className="text-[10px] text-gray-400 self-end pb-0.5">원</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <button onClick={() => deleteExpense(item.id)} className="text-[11px] text-rose-400 hover:text-rose-600 transition-colors">삭제</button>
                                    <div className="flex gap-2">
                                      <button onClick={cancelEditExpense} className="text-[11px] text-gray-400 hover:text-gray-600">취소</button>
                                      <button onClick={saveEditExpense} className="text-[11px] text-gray-900 font-medium hover:text-gray-600">저장</button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div key={item.id} onClick={() => startEditExpense(item)} className="flex items-center justify-between gap-4 group py-1 -mx-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[11px] text-gray-300 shrink-0 w-12">{formatDate(item.date)}</span>
                                    <span className="text-[12px] text-gray-500 truncate">{[item.place, item.item].filter(Boolean).join(" · ")}</span>
                                  </div>
                                  <span className="text-[12px] text-gray-700 font-medium shrink-0">{formatAmount(item.amount)}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )

            ) : (

              /* ══════════ 수입 ══════════ */
              viewMode === "date" ? (
                <div className="px-10 py-8">
                  <p className="text-xs text-gray-400 mb-8">{selectedYear}년 {selectedMonth != null ? `${selectedMonth}월` : "전체"} · {filteredIncomes.length}건 · {formatAmount(totalIncome)}</p>
                  <div className="space-y-8">
                    {sortedIncDates.map((date) => {
                      const items = incByDate[date];
                      const dayTotal = items.reduce((s, i) => s + i.amount, 0);
                      return (
                        <div key={date}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <button onClick={() => router.push(`/record/${date}`)} className="text-[13px] font-medium text-gray-700 hover:text-gray-900 transition-colors">{formatDate(date)}</button>
                              <div className="border-b border-dotted border-gray-200 w-8" />
                            </div>
                            <span className="text-[12px] font-medium text-emerald-600">{formatAmount(dayTotal)}</span>
                          </div>
                          <div className="space-y-1 pl-1">
                            {items.map((item) =>
                              editingIncomeId === item.id ? (
                                <div key={item.id} className="border border-gray-200 rounded-md p-3 bg-white space-y-2">
                                  <div className="relative" ref={incomePickerRef}>
                                    <button onClick={() => setOpenIncomeCatPicker((v) => !v)} className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">{incomeEditForm.category} ▾</button>
                                    {openIncomeCatPicker && (
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10 min-w-[110px] py-1">
                                        {incomeCategories.map((cat) => (
                                          <button key={cat} onClick={() => { setIncomeEditForm((f) => ({ ...f, category: cat })); setOpenIncomeCatPicker(false); }} className="w-full text-left px-3 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5">
                                            <span className={`text-[9px] ${incomeEditForm.category === cat ? "text-gray-700" : "opacity-0"}`}>✓</span>
                                            <span className={incomeEditForm.category === cat ? "font-medium text-gray-800" : "text-gray-500"}>{cat}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <input type="text" value={incomeEditForm.source} onChange={(e) => setIncomeEditForm((f) => ({ ...f, source: e.target.value }))} placeholder="출처" className="flex-1 text-[12px] border-b border-gray-200 outline-none py-0.5 text-gray-600 placeholder:text-gray-300 bg-transparent" />
                                    <input type="text" inputMode="numeric" value={incomeEditForm.amount} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setIncomeEditForm((f) => ({ ...f, amount: raw ? parseInt(raw, 10).toLocaleString() : "" })); }} placeholder="금액" className="w-20 text-[12px] border-b border-gray-200 outline-none py-0.5 text-right text-gray-700 placeholder:text-gray-300 bg-transparent" />
                                    <span className="text-[10px] text-gray-400 self-end pb-0.5">원</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <button onClick={() => deleteIncome(item.id)} className="text-[11px] text-rose-400 hover:text-rose-600 transition-colors">삭제</button>
                                    <div className="flex gap-2">
                                      <button onClick={cancelEditIncome} className="text-[11px] text-gray-400 hover:text-gray-600">취소</button>
                                      <button onClick={saveEditIncome} className="text-[11px] text-gray-900 font-medium hover:text-gray-600">저장</button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div key={item.id} onClick={() => startEditIncome(item)} className="flex items-center justify-between gap-4 group py-1.5 -mx-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">{item.category}</span>
                                    <span className="text-[12px] text-gray-500 truncate">{item.source}</span>
                                  </div>
                                  <span className="text-[12px] text-emerald-600 font-medium shrink-0">{formatAmount(item.amount)}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-10 py-8">
                  <p className="text-xs text-gray-400 mb-8">{selectedYear}년 {selectedMonth != null ? `${selectedMonth}월` : "전체"} · {filteredIncomes.length}건 · {formatAmount(totalIncome)}</p>
                  <div className="space-y-10">
                    {sortedIncCats.map((cat) => {
                      const { items, total } = incByCategory[cat];
                      const ratio = Math.round((total / totalIncome) * 100);
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">{cat}</span>
                              <span className="text-[11px] text-gray-300">{items.length}건</span>
                              <div className="flex-1 border-b border-dotted border-gray-200 w-8" />
                            </div>
                            <div className="text-right">
                              <span className="text-[13px] font-medium text-gray-700">{formatAmount(total)}</span>
                              <span className="text-[10px] text-gray-300 ml-1.5">{ratio}%</span>
                            </div>
                          </div>
                          <div className="space-y-2 pl-1">
                            {items.map((item) =>
                              editingIncomeId === item.id ? (
                                <div key={item.id} className="border border-gray-200 rounded-md p-3 bg-white space-y-2">
                                  <div className="relative" ref={incomePickerRef}>
                                    <button onClick={() => setOpenIncomeCatPicker((v) => !v)} className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">{incomeEditForm.category} ▾</button>
                                    {openIncomeCatPicker && (
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10 min-w-[110px] py-1">
                                        {incomeCategories.map((cat) => (
                                          <button key={cat} onClick={() => { setIncomeEditForm((f) => ({ ...f, category: cat })); setOpenIncomeCatPicker(false); }} className="w-full text-left px-3 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5">
                                            <span className={`text-[9px] ${incomeEditForm.category === cat ? "text-gray-700" : "opacity-0"}`}>✓</span>
                                            <span className={incomeEditForm.category === cat ? "font-medium text-gray-800" : "text-gray-500"}>{cat}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <input type="text" value={incomeEditForm.source} onChange={(e) => setIncomeEditForm((f) => ({ ...f, source: e.target.value }))} placeholder="출처" className="flex-1 text-[12px] border-b border-gray-200 outline-none py-0.5 text-gray-600 placeholder:text-gray-300 bg-transparent" />
                                    <input type="text" inputMode="numeric" value={incomeEditForm.amount} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setIncomeEditForm((f) => ({ ...f, amount: raw ? parseInt(raw, 10).toLocaleString() : "" })); }} placeholder="금액" className="w-20 text-[12px] border-b border-gray-200 outline-none py-0.5 text-right text-gray-700 placeholder:text-gray-300 bg-transparent" />
                                    <span className="text-[10px] text-gray-400 self-end pb-0.5">원</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <button onClick={() => deleteIncome(item.id)} className="text-[11px] text-rose-400 hover:text-rose-600 transition-colors">삭제</button>
                                    <div className="flex gap-2">
                                      <button onClick={cancelEditIncome} className="text-[11px] text-gray-400 hover:text-gray-600">취소</button>
                                      <button onClick={saveEditIncome} className="text-[11px] text-gray-900 font-medium hover:text-gray-600">저장</button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div key={item.id} onClick={() => startEditIncome(item)} className="flex items-center justify-between gap-4 group py-1 -mx-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[11px] text-gray-300 shrink-0 w-12">{formatDate(item.date)}</span>
                                    <span className="text-[12px] text-gray-500 truncate">{item.source}</span>
                                  </div>
                                  <span className="text-[12px] text-emerald-600 font-medium shrink-0">{formatAmount(item.amount)}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
