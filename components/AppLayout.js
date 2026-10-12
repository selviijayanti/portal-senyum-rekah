"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Clock,
  FileText,
  User,
  Users,
  Settings,
  BarChart3,
  CalendarCheck,
  Stethoscope,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Activity,
  PlusCircle,
  Home,
  ShieldAlert,
} from "lucide-react";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [janjiMenuOpen, setJanjiMenuOpen] = useState(true);

  const role = userProfile?.role || "pasien";

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/masuk");
    } catch (e) {
      console.error("Gagal keluar:", e);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case "super_admin":
        return { label: "Super Admin", color: "bg-cyan-100 text-[#0E7490] border-cyan-300" };
      case "resepsionis":
        return { label: "Resepsionis", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case "dokter":
        return { label: "Dokter Gigi", color: "bg-purple-100 text-purple-800 border-purple-300" };
      case "pasien":
      default:
        return { label: "Pasien", color: "bg-blue-100 text-blue-800 border-blue-300" };
    }
  };

  const badge = getRoleBadge(role);

  const isLinkActive = (href) => {
    if (href === "/beranda" || href === "/resepsionis" || href === "/dokter" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col">
      {/* Bilah Atas (Top Navbar) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 lg:hidden focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#0E7490] flex items-center justify-center text-white font-bold shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-base leading-tight tracking-tight">
                    Senyum Rekah
                  </h1>
                  <p className="text-[11px] text-[#5A6B78] font-medium leading-none">
                    Portal Janji Temu Gigi
                  </p>
                </div>
              </div>
            </div>

            {/* Profile & Status Bilah Atas */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800 leading-tight">
                  {userProfile?.nama || user?.displayName || "Pengguna"}
                </span>
                <span className="text-xs text-[#5A6B78]">
                  {userProfile?.email || user?.email}
                </span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}
              >
                {badge.label}
              </span>

              <button
                onClick={handleLogout}
                title="Keluar dari akun"
                className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar Nav Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sticky top-22 shadow-xs space-y-6">
            {/* Navigasi Berdasarkan Peran */}
            {/* 1. Modul Pasien (Bisa dibuka oleh pasien & super_admin) */}
            {(role === "pasien" || role === "super_admin") && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                  Pasien
                </p>
                <nav className="space-y-1">
                  <Link
                    href="/beranda"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isLinkActive("/beranda")
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Beranda
                  </Link>

                  {/* Janji Saya Dropdown */}
                  <div>
                    <button
                      onClick={() => setJanjiMenuOpen(!janjiMenuOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-gray-700 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>Janji Saya</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          janjiMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {janjiMenuOpen && (
                      <div className="pl-6 pt-1 space-y-1">
                        <Link
                          href="/janji"
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            pathname === "/janji"
                              ? "bg-cyan-50 text-[#0E7490] font-semibold"
                              : "text-gray-600 hover:bg-slate-50"
                          }`}
                        >
                          Daftar Janji
                        </Link>
                        <Link
                          href="/janji/baru"
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            pathname === "/janji/baru"
                              ? "bg-cyan-50 text-[#0E7490] font-semibold"
                              : "text-gray-600 hover:bg-slate-50"
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-[#0E7490]" />
                          Buat Janji
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/riwayat"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isLinkActive("/riwayat")
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Riwayat Perawatan
                  </Link>
                </nav>
              </div>
            )}

            {/* 2. Modul Resepsionis (Bisa dibuka oleh resepsionis & super_admin) */}
            {(role === "resepsionis" || role === "super_admin") && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                  Resepsionis
                </p>
                <nav className="space-y-1">
                  <Link
                    href="/resepsionis"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      pathname === "/resepsionis"
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Dasbor Resepsionis
                  </Link>
                  <Link
                    href="/resepsionis/janji"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isLinkActive("/resepsionis/janji")
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Kelola Janji
                  </Link>
                  <Link
                    href="/resepsionis/pasien"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isLinkActive("/resepsionis/pasien")
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Data Pasien
                  </Link>
                </nav>
              </div>
            )}

            {/* 3. Modul Dokter (Bisa dibuka oleh dokter & super_admin) */}
            {(role === "dokter" || role === "super_admin") && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                  Dokter
                </p>
                <nav className="space-y-1">
                  <Link
                    href="/dokter"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      pathname === "/dokter"
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Dasbor Dokter
                  </Link>
                </nav>
              </div>
            )}

            {/* 4. Modul Super Admin (Khusus super_admin) */}
            {role === "super_admin" && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                  Super Admin
                </p>
                <nav className="space-y-1">
                  <Link
                    href="/admin"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      pathname === "/admin"
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Dasbor Admin
                  </Link>
                  <Link
                    href="/admin/pengguna"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isLinkActive("/admin/pengguna")
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Kelola Pengguna
                  </Link>
                  <Link
                    href="/admin/layanan"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isLinkActive("/admin/layanan")
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Layanan
                  </Link>
                  <Link
                    href="/admin/jadwal-dokter"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isLinkActive("/admin/jadwal-dokter")
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Jadwal Dokter
                  </Link>
                  <Link
                    href="/admin/laporan"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      isLinkActive("/admin/laporan")
                        ? "bg-[#0E7490] text-white shadow-xs"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Laporan Kunjungan
                  </Link>
                </nav>
              </div>
            )}

            {/* Profil untuk semua peran */}
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/profil"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  isLinkActive("/profil")
                    ? "bg-[#0E7490] text-white shadow-xs"
                    : "text-gray-700 hover:bg-slate-100"
                }`}
              >
                <User className="w-4 h-4" />
                Profil Saya
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative bg-white w-72 max-w-full p-4 flex flex-col h-full shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0E7490]" />
                  <span className="font-bold text-gray-900">Senyum Rekah</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4">
                {/* Mobile Links */}
                {(role === "pasien" || role === "super_admin") && (
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-400 px-3 mb-1">
                      Pasien
                    </p>
                    <div className="space-y-1">
                      <Link
                        href="/beranda"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Beranda
                      </Link>
                      <Link
                        href="/janji"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Daftar Janji
                      </Link>
                      <Link
                        href="/janji/baru"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg text-[#0E7490] font-medium"
                      >
                        + Buat Janji
                      </Link>
                      <Link
                        href="/riwayat"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Riwayat Perawatan
                      </Link>
                    </div>
                  </div>
                )}

                {(role === "resepsionis" || role === "super_admin") && (
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-400 px-3 mb-1">
                      Resepsionis
                    </p>
                    <div className="space-y-1">
                      <Link
                        href="/resepsionis"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Dasbor Resepsionis
                      </Link>
                      <Link
                        href="/resepsionis/janji"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Kelola Janji
                      </Link>
                      <Link
                        href="/resepsionis/pasien"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Data Pasien
                      </Link>
                    </div>
                  </div>
                )}

                {(role === "dokter" || role === "super_admin") && (
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-400 px-3 mb-1">
                      Dokter
                    </p>
                    <div className="space-y-1">
                      <Link
                        href="/dokter"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Dasbor Dokter
                      </Link>
                    </div>
                  </div>
                )}

                {role === "super_admin" && (
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-400 px-3 mb-1">
                      Super Admin
                    </p>
                    <div className="space-y-1">
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Dasbor Admin
                      </Link>
                      <Link
                        href="/admin/pengguna"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Kelola Pengguna
                      </Link>
                      <Link
                        href="/admin/layanan"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Layanan
                      </Link>
                      <Link
                        href="/admin/jadwal-dokter"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Jadwal Dokter
                      </Link>
                      <Link
                        href="/admin/laporan"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                      >
                        Laporan Kunjungan
                      </Link>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <Link
                    href="/profil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100"
                  >
                    Profil Saya
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-red-600 bg-red-50 rounded-xl font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Konten Halaman */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
