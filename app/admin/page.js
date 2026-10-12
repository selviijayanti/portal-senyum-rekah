"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Users,
  Settings,
  Clock,
  BarChart3,
  CalendarCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Activity,
  Database,
} from "lucide-react";
import { seedInitialData } from "@/lib/seedData";

export default function DasborAdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [kunjunganHariIni, setKunjunganHariIni] = useState(0);
  const [kunjunganBulanIni, setKunjunganBulanIni] = useState(0);
  const [menungguKonfirmasi, setMenungguKonfirmasi] = useState(0);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const [todayStr, setTodayStr] = useState("");
  const [currentMonthPrefix, setCurrentMonthPrefix] = useState("");

  const fetchMetrics = async (tStr, mPrefix) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const snap = await getDocs(collection(db, "janji_temu"));
      let countToday = 0;
      let countMonth = 0;
      let countPending = 0;

      snap.forEach((d) => {
        const item = d.data();
        if (item.status === "selesai") {
          if (item.tanggal === tStr) countToday += 1;
          if (item.tanggal && item.tanggal.startsWith(mPrefix)) countMonth += 1;
        }
        if (item.status === "menunggu") {
          countPending += 1;
        }
      });

      setKunjunganHariIni(countToday);
      setKunjunganBulanIni(countMonth);
      setMenungguKonfirmasi(countPending);
    } catch (err) {
      console.error("Gagal memuat metrik admin:", err);
      setErrorMsg("Gagal memuat ringkasan data klinik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tStr = new Date().toISOString().split("T")[0];
    const mPrefix = tStr.substring(0, 7);
    setTodayStr(tStr);
    setCurrentMonthPrefix(mPrefix);
    fetchMetrics(tStr, mPrefix);
  }, []);

  const handleRunSeed = async () => {
    setSeedingLoading(true);
    setSeedMsg("");
    const res = await seedInitialData();
    if (res.success) {
      setSeedMsg(res.message);
    } else {
      setSeedMsg(`Gagal seed: ${res.error}`);
    }
    setSeedingLoading(false);
    fetchMetrics();
  };

  return (
    <RouteGuard allowedRoles={["super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dasbor Super Admin</h1>
              <p className="text-xs text-[#5A6B78]">
                Panel kendali dan ringkasan operasional Klinik Gigi Senyum Rekah
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunSeed}
                disabled={seedingLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
              >
                <Database className="w-3.5 h-3.5 text-[#0E7490]" />
                {seedingLoading ? "Mengisi Data..." : "Inisialisasi Seed Data"}
              </button>
            </div>
          </div>

          {seedMsg && (
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-800">
              {seedMsg}
            </div>
          )}

          {/* Kartu Metrik Utama Sesuai PRD 4.12 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Kunjungan Hari Ini */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A6B78]">
                Kunjungan Hari Ini
              </span>
              <div className="mt-2 text-3xl font-extrabold text-gray-900 tabular-nums">
                {kunjunganHariIni}
              </div>
              <p className="mt-1 text-xs text-[#5A6B78]">
                Pasien selesai periksa hari ini ({todayStr})
              </p>
            </div>

            {/* 2. Kunjungan Bulan Ini (Bisa diklik membuka Laporan bulan berjalan) */}
            <div
              onClick={() => router.push(`/admin/laporan?bulan=${currentMonthPrefix}`)}
              className="bg-cyan-50/70 hover:bg-cyan-100/70 border border-cyan-200/80 rounded-2xl p-6 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E7490]">
                    Kunjungan Bulan Ini
                  </span>
                  <TrendingUp className="w-4 h-4 text-[#0E7490]" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-cyan-950 tabular-nums">
                  {kunjunganBulanIni}
                </div>
                <p className="mt-1 text-xs text-cyan-800">
                  Total janji selesai bulan {currentMonthPrefix}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#0E7490]">
                <span>Buka Laporan Bulan Ini</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 3. Menunggu Konfirmasi */}
            <div
              onClick={() => router.push("/resepsionis/janji?status=menunggu")}
              className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 rounded-2xl p-6 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Menunggu Konfirmasi
                </span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-amber-900 tabular-nums">
                {menungguKonfirmasi}
              </div>
              <p className="mt-1 text-xs text-amber-700">
                Janji yang perlu dikonfirmasi resepsionis
              </p>
            </div>
          </div>

          {/* Navigasi Modul Manajemen Admin */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-slate-100">
              Menu Pengelolaan Super Admin
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/pengguna"
                className="p-5 rounded-xl border border-slate-200 hover:border-[#0E7490] hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0E7490] flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Kelola Pengguna</h3>
                  <p className="text-xs text-[#5A6B78] mt-1">
                    Atur peran pengguna dan status aktif akun
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/layanan"
                className="p-5 rounded-xl border border-slate-200 hover:border-[#0E7490] hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0E7490] flex items-center justify-center mb-3">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Layanan Klinik</h3>
                  <p className="text-xs text-[#5A6B78] mt-1">
                    Kelola nama, harga, dan durasi pemeriksaan
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/jadwal-dokter"
                className="p-5 rounded-xl border border-slate-200 hover:border-[#0E7490] hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0E7490] flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Jadwal Dokter</h3>
                  <p className="text-xs text-[#5A6B78] mt-1">
                    Atur hari dan jam praktik dokter gigi
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/laporan"
                className="p-5 rounded-xl border border-slate-200 hover:border-[#0E7490] hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0E7490] flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Laporan Kunjungan</h3>
                  <p className="text-xs text-[#5A6B78] mt-1">
                    Rekap kunjungan per dokter dan layanan
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  );
}
