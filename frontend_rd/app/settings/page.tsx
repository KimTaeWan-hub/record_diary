"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { supabase } from "@/lib/supabase";

type Category = { name: string; is_default: boolean };
type SectionKey = "activity" | "expense" | "income";

const SECTION_META: Record<SectionKey, { label: string; table: string; dataTable: string; fallback: string }> = {
  activity: { label: "활동서", table: "activity_categories", dataTable: "activities", fallback: "기타" },
  expense: { label: "지출", table: "expense_categories", dataTable: "expenses", fallback: "기타" },
  income: { label: "수입", table: "income_categories", dataTable: "incomes", fallback: "기타" },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SectionKey>("activity");
  const [categories, setCategories] = useState<Record<SectionKey, Category[]>>({
    activity: [],
    expense: [],
    income: [],
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // 편집 상태
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // 삭제 확인 상태
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [deleteAffectedCount, setDeleteAffectedCount] = useState(0);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (editingName && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingName]);

  async function fetchAll() {
    setLoading(true);
    const [actRes, expRes, incRes] = await Promise.all([
      supabase.from("activity_categories").select("name, is_default").order("is_default", { ascending: false }).order("created_at"),
      supabase.from("expense_categories").select("name, is_default").order("is_default", { ascending: false }).order("created_at"),
      supabase.from("income_categories").select("name, is_default").order("is_default", { ascending: false }).order("created_at"),
    ]);
    setCategories({
      activity: actRes.data ?? [],
      expense: expRes.data ?? [],
      income: incRes.data ?? [],
    });
    setLoading(false);
  }

  // 편집 시작
  function startEdit(name: string) {
    setEditingName(name);
    setEditValue(name);
    setDeletingName(null);
  }

  function cancelEdit() {
    setEditingName(null);
    setEditValue("");
  }

  // 이름 변경 저장
  async function commitRename(section: SectionKey) {
    const newName = editValue.trim();
    const oldName = editingName!;
    if (!newName || newName === oldName) {
      cancelEdit();
      return;
    }

    const { table, dataTable } = SECTION_META[section];
    const currentNames = categories[section].map((c) => c.name);
    if (currentNames.includes(newName)) {
      showToast("이미 존재하는 카테고리 이름입니다.", "error");
      return;
    }

    // 1. 카테고리 테이블 업데이트
    const { error: catErr } = await supabase.from(table).update({ name: newName }).eq("name", oldName);
    if (catErr) { showToast("수정에 실패했습니다.", "error"); return; }

    // 2. 데이터 테이블 일괄 반영
    await supabase.from(dataTable).update({ category: newName }).eq("category", oldName);

    setCategories((prev) => ({
      ...prev,
      [section]: prev[section].map((c) => c.name === oldName ? { ...c, name: newName } : c),
    }));
    cancelEdit();
    showToast(`'${oldName}' → '${newName}' 으로 변경되었습니다.`);
  }

  // 삭제 확인 시작
  async function startDelete(section: SectionKey, name: string) {
    const { dataTable } = SECTION_META[section];
    const { count } = await supabase.from(dataTable).select("*", { count: "exact", head: true }).eq("category", name);
    setDeleteAffectedCount(count ?? 0);
    setDeletingName(name);
    setEditingName(null);
  }

  function cancelDelete() {
    setDeletingName(null);
    setDeleteAffectedCount(0);
  }

  // 삭제 실행
  async function commitDelete(section: SectionKey) {
    const name = deletingName!;
    const { table, dataTable, fallback } = SECTION_META[section];

    // 1. 데이터 레코드 → 기타로 이동
    await supabase.from(dataTable).update({ category: fallback }).eq("category", name);

    // 2. 카테고리 삭제
    const { error } = await supabase.from(table).delete().eq("name", name);
    if (error) { showToast("삭제에 실패했습니다.", "error"); cancelDelete(); return; }

    setCategories((prev) => ({
      ...prev,
      [section]: prev[section].filter((c) => c.name !== name),
    }));
    cancelDelete();
    showToast(`'${name}' 카테고리가 삭제되었습니다.`);
  }

  const current = categories[activeTab];
  const meta = SECTION_META[activeTab];

  return (
    <div className="flex h-full w-full">
      <Sidebar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="px-8 py-5 border-b border-gray-100 shrink-0">
          <h1 className="text-xl font-bold text-gray-900">설정</h1>
          <p className="text-xs text-gray-400 mt-0.5">카테고리 관리</p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-lg">

            {/* 탭 */}
            <div className="flex gap-1 mb-8 bg-gray-100 rounded-lg p-1">
              {(Object.keys(SECTION_META) as SectionKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); cancelEdit(); cancelDelete(); }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {SECTION_META[key].label}
                </button>
              ))}
            </div>

            {/* 안내 */}
            <p className="text-[11px] text-gray-400 mb-4">
              기본 카테고리는 삭제할 수 없습니다. 삭제 시 해당 카테고리의 기록은 <span className="font-medium">기타</span>로 이동합니다.
            </p>

            {/* 카테고리 목록 */}
            {loading ? (
              <p className="text-sm text-gray-400">불러오는 중...</p>
            ) : (
              <ul className="space-y-1">
                {current.map((cat) => (
                  <li key={cat.name} className="group">
                    {/* 삭제 확인 UI */}
                    {deletingName === cat.name ? (
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-100">
                        <div>
                          <p className="text-sm text-red-700 font-medium">'{cat.name}' 을 삭제할까요?</p>
                          {deleteAffectedCount > 0 && (
                            <p className="text-[11px] text-red-400 mt-0.5">
                              {deleteAffectedCount}개의 기록이 <span className="font-medium">기타</span>로 이동합니다.
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0 ml-4">
                          <button
                            onClick={cancelDelete}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-md border border-gray-200 bg-white transition-colors"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => commitDelete(activeTab)}
                            className="px-3 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ) : editingName === cat.name ? (
                      /* 편집 UI */
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.nativeEvent.isComposing) return;
                            if (e.key === "Enter") commitRename(activeTab);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="flex-1 text-sm text-gray-800 outline-none bg-transparent"
                        />
                        <button
                          onClick={() => commitRename(activeTab)}
                          className="text-[11px] px-2.5 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-[11px] px-2.5 py-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      /* 기본 행 */
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-800">{cat.name}</span>
                          {cat.is_default && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 leading-tight">기본</span>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(cat.name)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            title="이름 변경"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          {!cat.is_default && (
                            <button
                              onClick={() => startDelete(activeTab, cat.name)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                              title="삭제"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}

                {current.length === 0 && (
                  <li className="text-sm text-gray-400 px-4 py-3">카테고리가 없습니다.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
