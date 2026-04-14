import Sidebar from "../components/Sidebar";

export default function ExpensePage() {
  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center px-8 py-5 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900">호조</h1>
            <p className="text-xs text-gray-400 mt-0.5">지출 관리</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-300">지출 관리 페이지 — 준비 중</p>
        </div>
      </main>
    </div>
  );
}
