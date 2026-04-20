"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import Sidebar from "../components/Sidebar";
import { searchDiary, SearchMessage } from "@/lib/ai";

type Role = "user" | "assistant";

type Message = {
  id: number;
  role: Role;
  content: string;
  route?: string;    // expense_sql | activity_sql | semantic
  loading?: boolean;
};

const ROUTE_LABEL: Record<string, string> = {
  expense_sql:  "지출 데이터",
  activity_sql: "활동 데이터",
  semantic:     "일기 검색",
};

const SUGGESTIONS = [
  "이번 달에 간 식당 목록",
  "올해 본 영화는?",
  "지난달 지출 합계",
  "최근에 행복했던 날은?",
];

let nextId = 1;

export default function SearchPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (query: string) => {
    const text = query.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: nextId++, role: "user", content: text };
    const loadingMsg: Message = { id: nextId++, role: "assistant", content: "", loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsLoading(true);

    // 대화 히스토리 구성 (로딩 메시지 제외)
    const history: SearchMessage[] = messages
      .filter((m) => !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await searchDiary(text, history);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: res.answer, route: res.route, loading: false }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: "답변을 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.", loading: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full w-full">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI 비서</h1>
            <p className="text-xs text-gray-400 mt-0.5">기록을 검색하고 회상합니다</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              대화 초기화
            </button>
          )}
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            /* 빈 상태 — 예시 질문 */
            <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center text-lg font-bold rounded-sm mx-auto mb-4 select-none">
                  實
                </div>
                <p className="text-sm font-medium text-gray-700">무엇이든 물어보세요</p>
                <p className="text-xs text-gray-400 mt-1">일기, 지출, 활동 기록을 바탕으로 답해드립니다</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white text-[12px] text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors leading-snug"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-8 py-6 space-y-6 max-w-3xl mx-auto w-full">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* AI 아바타 */}
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold rounded-sm shrink-0 mt-0.5 select-none">
                      實
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {/* 말풍선 */}
                    {msg.loading ? (
                      <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 text-gray-400 text-[13px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-gray-900 text-white rounded-tr-sm"
                            : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* 출처 태그 */}
                    {msg.role === "assistant" && !msg.loading && msg.route && (
                      <span className="text-[10px] text-gray-300 px-1">
                        {ROUTE_LABEL[msg.route] ?? msg.route}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* 입력창 */}
        <div className="shrink-0 border-t border-gray-100 px-8 py-4 bg-white">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="질문을 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none overflow-hidden outline-none text-[13px] text-gray-800 placeholder:text-gray-300 leading-relaxed bg-transparent disabled:opacity-50"
              style={{ minHeight: "24px", maxHeight: "120px" }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="전송"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
