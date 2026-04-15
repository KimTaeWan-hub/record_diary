"use client";

import { useEffect } from "react";

type ToastType = "success" | "error";

type Props = {
  message: string;
  type?: ToastType;
  onClose: () => void;
};

export default function Toast({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-md shadow-md text-sm font-medium z-50
        transition-all animate-fade-in
        ${type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"}
      `}
    >
      {message}
    </div>
  );
}
