"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f8f6]">
      <div className="flex flex-col items-center gap-8">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-gray-900 text-white flex items-center justify-center text-2xl font-bold rounded-sm select-none">
            實
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">실록</p>
            <p className="text-sm text-gray-400 mt-0.5">현대판 일상 실록</p>
          </div>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white border border-gray-200 rounded-lg px-10 py-8 flex flex-col items-center gap-6 w-80">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">나의 하루를 실록처럼</p>
            <p className="text-xs text-gray-400 mt-1">기록하고, 회상하고, 성장하세요</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google로 계속하기
          </button>
        </div>

        <p className="text-xs text-gray-400">
          조선왕조실록 정신으로 기록합니다
        </p>
      </div>
    </div>
  );
}
