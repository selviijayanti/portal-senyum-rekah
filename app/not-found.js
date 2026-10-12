"use client";

import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-16 h-16 bg-slate-100 text-[#0E7490] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <span className="text-4xl font-extrabold text-gray-900 block tracking-tight">
          404
        </span>
        <h1 className="mt-2 text-lg font-bold text-gray-900">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-1 text-xs text-[#5A6B78] mb-6">
          Alamat URL yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
