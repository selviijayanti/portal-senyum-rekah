"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  BarChart3,
  Calendar,
  Stethoscope,
  Activity,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

function LaporanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bulan, setBulan] = useState(searchParams.get("bulan") || "");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [dokterRekap, setDokterRekap] = useState([]);
  const [layananRekap, setLayananRekap] = useState([]);
  const [totalKunjungan, setTotalKunjungan] = useState(0);

  const handleBulanChange = (newBulan) => {
    setBulan(newBulan);
    router.replace(`/admin/laporan?bulan=${newBulan}`);
  };

  const fetchLaporan = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Ambil semua dokter
      const dokSnap = await getDocs(collection(db, "users"));
      const dokterMap = {};
      dokSnap.forEach((d) => {
        const u = d.data();
        if (u.role === "dokter") {
          dokterMap[d.id] = u.nama;
        }
      });
      if (!dokterMap["dokter_bima"]) dokterMap["dokter_bima"] = "drg. Bima";
      if (!dokterMap["dokter_sinta"]) dokterMap["dokter_sinta"] = "drg. Sinta";

      // 2. Ambil semua layanan
      const laySnap = await getDocs(collection(db, "layanan"));
      const layananMap = {};
      laySnap.forEach((d) => {
        layananMap[d.id] = d.data().nama;
      });

      // 3. Ambil janji berstatus 'selesai' pada bulan terpilih
      const janjiSnap = await getDocs(collection(db, "janji_temu"));
      const perDokter = {};
      const perLayanan = {};
      let total = 0;

      // Inisialisasi counter dokter
      Object.entries(dokterMap).forEach(([id, nama]) => {
        perDokter[id] = { id, nama, jumlah: 0 };
      });

      // Inisialisasi counter layanan
      Object.entries(layananMap).forEach(([id, nama]) => {
        perLayanan[id] = { id, nama, jumlah: 0 };
      });

      janjiSnap.forEach((d) => {
        const item = d.data();
        if (item.status === "selesai" && item.tanggal && item.tanggal.startsWith(bulan)) {
          total += 1;

          // Hitung dokter
          const dId = item.dokterId || "dokter_bima";
          if (!perDokter[dId]) {
            perDokter[dId] = { id: dId, nama: dokterMap[dId] || "drg. Dokter", jumlah: 0 };
          }
          perDokter[dId].jumlah += 1;

          // Hitung layanan
          const lId = item.layananId;
          if (lId) {
            if (!perLayanan[lId]) {
              perLayanan[lId] = { id: lId, nama: layananMap[lId] || "Layanan", jumlah: 0 };
            }
            perLayanan[lId].jumlah += 1;
          }
        }
      });

      setTotalKunjungan(total);
      setDokterRekap(Object.values(perDokter).sort((a, b) => b.jumlah - a.jumlah));
      setLayananRekap(Object.values(perLayanan).sort((a, b) => b.jumlah - a.jumlah));
    } catch (err) {
      console.error("Gagal memuat laporan:", err);
      setErrorMsg("Gagal menyusun rekap laporan kunjungan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bulan) {
      const cur = new Date().toISOString().substring(0, 7);
      setBulan(cur);
      return;
    }
    fetchLaporan();
  }, [bulan]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan Kunjungan Klinik</h1>
          <p className="text-xs text-[#5A6B78]">
            Rekap jumlah kunjungan berstatus Selesai per dokter dan per layanan
          </p>
        </div>

        {/* Pemilihan Bulan (Tersimpan di URL) */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <Calendar className="w-4 h-4 text-[#0E7490]" />
          <span className="text-xs font-semibold text-gray-700">Pilih Bulan:</span>
          <input
            type="month"
            value={bulan}
            onChange={(e) => handleBulanChange(e.target.value)}
            className="text-xs font-semibold bg-transparent text-gray-900 focus:outline-none tabular-nums"
          />
        </div>
      </div>

      {/* Ringkasan Total */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Total Kunjungan Pasien Selesai ({bulan})
          </span>
          <div className="mt-1 text-3xl font-extrabold tabular-nums">
            {totalKunjungan} <span className="text-sm font-normal text-slate-300">Kunjungan</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-cyan-300">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#5A6B78]">Menghitung rekap kunjungan...</p>
        </div>
      )}

      {errorMsg && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tabel 1: Kunjungan Per Dokter */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#0E7490]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Kunjungan per Dokter
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-slate-50/50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Nama Dokter</th>
                    <th className="px-6 py-3 text-right">Jumlah Kunjungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dokterRekap.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-xs text-slate-400 italic">
                        Tidak ada data dokter.
                      </td>
                    </tr>
                  ) : (
                    dokterRekap.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-bold text-gray-900">
                          {item.nama}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-[#0E7490] tabular-nums">
                          {item.jumlah} Kunjungan
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabel 2: Kunjungan Per Layanan */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0E7490]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Kunjungan per Layanan
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-slate-50/50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Nama Layanan</th>
                    <th className="px-6 py-3 text-right">Jumlah Kunjungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {layananRekap.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-xs text-slate-400 italic">
                        Tidak ada data layanan.
                      </td>
                    </tr>
                  ) : (
                    layananRekap.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-bold text-gray-900">
                          {item.nama}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-[#0E7490] tabular-nums">
                          {item.jumlah} Kunjungan
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LaporanKunjunganAdminPage() {
  return (
    <RouteGuard allowedRoles={["super_admin"]}>
      <AppLayout>
        <Suspense fallback={<div className="p-8 text-center text-xs">Memuat laporan...</div>}>
          <LaporanContent />
        </Suspense>
      </AppLayout>
    </RouteGuard>
  );
}
