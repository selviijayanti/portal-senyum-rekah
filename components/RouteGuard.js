"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Loader2, ArrowLeft, Ban } from "lucide-react";

export function getDefaultRoute(role) {
  switch (role) {
    case "resepsionis":
      return "/resepsionis";
    case "dokter":
      return "/dokter";
    case "super_admin":
      return "/admin";
    case "pasien":
    default:
      return "/beranda";
  }
}

export default function RouteGuard({ children, allowedRoles = [] }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/masuk");
    }
  }, [loading, user, router]);

  // 1. Selama role dan status autentikasi belum selesai dibaca
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9]">
        <div className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Loader2 className="w-10 h-10 text-[#0E7490] animate-spin" />
          <p className="text-sm font-medium text-[#5A6B78]">Memuat informasi pengguna...</p>
        </div>
      </div>
    );
  }

  // 2. Jika belum login
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9]">
        <div className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin" />
          <p className="text-sm text-[#5A6B78]">Mengarahkan ke halaman masuk...</p>
        </div>
      </div>
    );
  }

  // 3. Jika akun dinonaktifkan
  if (userProfile && userProfile.aktif === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akun Dinonaktifkan</h2>
          <p className="text-sm text-[#5A6B78] mb-6">
            Akun Anda dinonaktifkan oleh administrator klinik. Silakan hubungi pihak Klinik Gigi Senyum Rekah untuk informasi lebih lanjut.
          </p>
          <button
            onClick={() => window.location.href = "/masuk"}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors"
          >
            Kembali ke Masuk
          </button>
        </div>
      </div>
    );
  }

  // 4. Periksa kecocokan Peran (super_admin selalu boleh semua halaman)
  const isSuperAdmin = userProfile?.role === "super_admin";
  const hasAccess = isSuperAdmin || (userProfile && allowedRoles.includes(userProfile.role));

  if (!hasAccess) {
    const fallbackRoute = getDefaultRoute(userProfile?.role);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-amber-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-[#5A6B78] mb-6">
            Halaman ini tidak dapat dibuka oleh peran Anda saat ini (
            <span className="font-semibold text-gray-800 capitalize">
              {userProfile?.role?.replace("_", " ") || "Tidak dikenal"}
            </span>
            ). Halaman ini khusus untuk peran yang berwenang.
          </p>
          <Link
            href={fallbackRoute}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#0E7490] hover:bg-[#155E75] text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Halaman Utama Saya
          </Link>
        </div>
      </div>
    );
  }

  // 5. Berhak membuka halaman
  return <>{children}</>;
}
