"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Calendar,
  Clock,
  User,
  PlusCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  Stethoscope,
} from "lucide-react";

export default function BerandaPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [janjiTerdekat, setJanjiTerdekat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJanjiTerdekat = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Ambil janji milik user yang belum selesai/dibatalkan atau yang terdekat
      const q = query(
        collection(db, "janji_temu"),
        where("pasienId", "==", user.uid)
      );

      const snap = await getDocs(q);
      const list = [];
      snap.forEach((docItem) => {
        list.push({ id: docItem.id, ...docItem.data() });
      });

      // Saring yang belum selesai & belum dibatalkan untuk janji terdekat
      const aktif = list.filter(
        (j) => j.status !== "dibatalkan" && j.status !== "selesai"
      );

      // Urutkan berdasarkan tanggal & jam terdekat
      aktif.sort((a, b) => {
        const dateA = `${a.tanggal} ${a.jam}`;
        const dateB = `${b.tanggal} ${b.jam}`;
        return dateA.localeCompare(dateB);
      });

      if (aktif.length > 0) {
        // Ambil info dokter dan layanan
        const targetJanji = aktif[0];
        
        let dokterNama = "Dokter Gigi";
        let layananNama = "Layanan Klinik";

        if (targetJanji.dokterId) {
          try {
            const dSnap = await getDoc(doc(db, "users", targetJanji.dokterId));
            if (dSnap.exists()) dokterNama = dSnap.data().nama;
          } catch (e) {
            console.warn(e);
          }
        }

        if (targetJanji.layananId) {
          try {
            const lSnap = await getDoc(doc(db, "layanan", targetJanji.layananId));
            if (lSnap.exists()) layananNama = lSnap.data().nama;
          } catch (e) {
            console.warn(e);
          }
        }

        setJanjiTerdekat({
          ...targetJanji,
          dokterNama,
          layananNama,
        });
      } else {
        setJanjiTerdekat(null);
      }
    } catch (err) {
      console.error("Gagal mengambil janji terdekat:", err);
      setError("Gagal memuat janji terdekat. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJanjiTerdekat();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "menunggu":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-menunggu">Menunggu Konfirmasi</span>;
      case "dikonfirmasi":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-dikonfirmasi">Dikonfirmasi</span>;
      case "hadir":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-hadir">Hadir (Siap Periksa)</span>;
      case "selesai":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-selesai">Selesai</span>;
      case "dibatalkan":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-dibatalkan">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <RouteGuard allowedRoles={["pasien", "super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#0E7490] to-[#155E75] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-xs mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Klinik Gigi Senyum Rekah</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Selamat Datang di Portal Pasien
              </h1>
              <p className="mt-1 text-sm text-cyan-100 max-w-lg">
                Jadwalkan pemeriksaan dan pantau riwayat perawatan gigi Anda dengan mudah dan rahasia.
              </p>
            </div>

            <Link
              href="/janji/baru"
              className="inline-flex items-center gap-2 bg-white text-[#0E7490] hover:bg-cyan-50 font-semibold px-5 py-3 rounded-xl text-sm transition-all shadow-sm shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Buat Janji Baru
            </Link>
          </div>

          {/* Kartu Janji Terdekat */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0E7490]" />
                Janji Terdekat Anda
              </h2>
              <Link
                href="/janji"
                className="text-xs font-semibold text-[#0E7490] hover:underline flex items-center gap-1"
              >
                Lihat Semua Janji
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Keadaan 1: Memuat */}
            {loading && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat janji terdekat...</p>
              </div>
            )}

            {/* Keadaan 2: Gagal */}
            {error && !loading && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={fetchJanjiTerdekat}
                  className="px-3 py-1 bg-white border border-red-300 rounded-lg text-xs font-semibold hover:bg-red-50"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Keadaan 3: Kosong */}
            {!loading && !error && !janjiTerdekat && (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Belum ada janji</h3>
                <p className="text-xs text-[#5A6B78] mt-1 max-w-sm mx-auto mb-5">
                  Anda tidak memiliki jadwal janji temu aktif saat ini. Buat janji baru untuk menjadwalkan pemeriksaan gigi.
                </p>
                <Link
                  href="/janji/baru"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E7490] text-white text-xs font-semibold rounded-xl hover:bg-[#155E75] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Buat Janji Sekarang
                </Link>
              </div>
            )}

            {/* Keadaan 4: Berhasil (Ada Janji Terdekat) */}
            {!loading && !error && janjiTerdekat && (
              <div
                onClick={() => router.push(`/janji/${janjiTerdekat.id}`)}
                className="bg-slate-50 hover:bg-cyan-50/50 transition-colors border border-slate-200/80 rounded-xl p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-base">
                      {janjiTerdekat.layananNama}
                    </span>
                    {getStatusBadge(janjiTerdekat.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#5A6B78]">
                    <div className="flex items-center gap-1.5 font-medium tabular-nums">
                      <Calendar className="w-4 h-4 text-[#0E7490]" />
                      <span>{janjiTerdekat.tanggal}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium tabular-nums">
                      <Clock className="w-4 h-4 text-[#0E7490]" />
                      <span>Pukul {janjiTerdekat.jam} WITA</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Stethoscope className="w-4 h-4 text-[#0E7490]" />
                      <span>{janjiTerdekat.dokterNama}</span>
                    </div>
                  </div>

                  {janjiTerdekat.keluhan && (
                    <p className="text-xs text-gray-600 bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                      <span className="font-semibold text-gray-700">Keluhan: </span>
                      {janjiTerdekat.keluhan}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#0E7490] self-end sm:self-center">
                  <span>Lihat Rincian</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  );
}
