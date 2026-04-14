const navItems = [
  { label: "사초", sublabel: "일기", href: "/" },
  { label: "호조", sublabel: "지출", href: "/expense" },
  { label: "AI 비서", sublabel: "검색·회상", href: "/search" },
  { label: "통계", sublabel: "대시보드", href: "/stats" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-full flex flex-col border-r border-gray-100 bg-[#f9f8f6]">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center text-sm font-bold rounded-sm select-none">
            實
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-900">실록</p>
            <p className="text-[10px] text-gray-400 leading-tight">일상 기록 서비스</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-md text-sm group hover:bg-gray-200/70 transition-colors"
          >
            <span className="font-medium text-gray-800 group-hover:text-gray-900">
              {item.label}
            </span>
            <span className="text-[11px] text-gray-400">{item.sublabel}</span>
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 text-center">
          조선왕조실록 정신으로 기록합니다
        </p>
      </div>
    </aside>
  );
}
