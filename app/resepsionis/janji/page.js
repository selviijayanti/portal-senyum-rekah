"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Calendar,
  Clock,
  Filter,
  Search,
  ChevronRight,
  AlertCircle,
  Loader2,
  Stethoscope,
  User,
} from "lucide-react";

function KelolaJanjiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get("status") || "semua";
  const initialTanggal = searchParams.get("tanggal") || "";

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [tanggalFilter, setTanggalFilter] = useState(initialTanggal);
  const [janjiList, setJanjiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const updateFilters = (newStatus, newTanggal) => {
    setStatusFilter(newStatus);
    setTanggalFilter(newTanggal);

    const params = new URLSearchParams();
    if (newStatus && newStatus !== "semua") params.set("status", newStatus);
    if (newTanggal) params.set("tanggal", newTanggal);

    const queryString = params.toString();
    router.replace(`/resepsionis/janji${queryString ? `?${queryString}` : ""}`);
  };

  const fetchJanji = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const snap = await getDocs(collection(db, "janji_temu"));
      const raw = [];
      snap.forEach((d) => raw.push({ id: d.id, ...d.data() }));

      // Urutkan berdasarkan tanggal & jam
      raw.sort((a, b) => {
        const dateA = `${a.tanggal} ${a.jam}`;
        const dateB = `${b.tanggal} ${b.jam}`;
        return dateA.localeCompare(dateB);
      });

      // Lengkapi data pasien, dokter, dan layanan
      const enriched = await Promise.all(
        raw.map(async (item) => {
          let pasienNama = "Pasien";
          let dokterNama = "Dokter Gigi";
          let layananNama = "Layanan Klinik";

          if (item.pasienId) {
            try {
              const pSnap = await getDoc(doc(db, "users", item.pasienId));
              if (pSnap.exists()) pasienNama = pSnap.data().nama;
            } catch (e) {
              console.warn(e);
            }
          }

          if (item.dokterId) {
            try {
              const dSnap = await getDoc(doc(db, "users", item.dokterId));
              if (dSnap.exists()) dokterNama = dSnap.data().nama;
            } catch (e) {
              console.warn(e);
            }
          }

          if (item.layananId) {
            try {
              const lSnap = await getDoc(doc(db, "layanan", item.layananId));
              if (lSnap.exists()) layananNama = lSnap.data().nama;
            } catch (e) {
              console.warn(e);
            }
          }

          return {
            ...item,
            pasienNama,
            dokterNama,
            layananNama,
          };
        })
      );

      setJanjiList(enriched);
    } catch (err) {
      console.error("Gagal memuat janji:", err);
      setErrorMsg("Gagal memuat data janji temu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJanji();
  }, []);

  // Filter daftar janji
  const filteredList = janjiList.filter((item) => {
    const matchStatus =
      statusFilter === "semua" || item.status === statusFilter;
    const matchTanggal = !tanggalFilter || item.tanggal === tanggalFilter;
    return matchStatus && matchTanggal;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "menunggu":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-menunggu">Menunggu</span>;
      case "dikonfirmasi":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-dikonfirmasi">Dikonfirmasi</span>;
      case "hadir":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-hadir">Hadir</span>;
      case "selesai":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-selesai">Selesai</span>;
      case "dibatalkan":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-dibatalkan">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Janji Temu</h1>
          <p className="text-xs text-[#5A6B78]">
            Konfirmasi, jadwalkan ulang, batalkan, atau tandai kehadiran pasien
          </p>
        </div>
      </div>

      {/* Bar Saringan (Status & Tanggal Tersimpan di URL) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Filter className="w-4 h-4 text-[#0E7490]" />
          <span>Saring:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => updateFilters(e.target.value, tanggalFilter)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] font-medium"
        >
          <option value="semua">Semua Status</option>
          <option value="menunggu">Menunggu Konfirmasi</option>
          <option value="dikonfirmasi">Dikonfirmasi</option>
          <option value="hadir">Hadir</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={tanggalFilter}
            onChange={(e) => updateFilters(statusFilter, e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] font-medium tabular-nums"
          />
          {tanggalFilter && (
            <button
              onClick={() => updateFilters(statusFilter, "")}
              className="text-xs text-red-600 hover:underline px-1 font-medium"
            >
              Reset Tanggal
            </button>
          )}
        </div>

        <div className="ml-auto text-xs text-[#5A6B78] font-medium tabular-nums">
          Ditemukan: <span className="font-bold text-gray-900">{filteredList.length}</span> Janji
        </div>
      </div>

      {/* Tabel Janji */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
            <p className="text-sm">Memuat data janji...</p>
          </div>
        )}

        {errorMsg && !loading && (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={fetchJanji}
                className="px-3 py-1 bg-white border border-red-300 rounded-lg text-xs font-semibold hover:bg-red-50"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {!loading && !errorMsg && filteredList.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Tidak ada janji yang cocok</h3>
            <p className="text-xs text-[#5A6B78] mt-1">
              Tidak ditemukan data janji temu dengan saringan yang dipilih.
            </p>
          </div>
        )}

        {!loading && !errorMsg && filteredList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">Jam</th>
                  <th className="px-6 py-3.5">Pasien</th>
                  <th className="px-6 py-3.5">Dokter</th>
                  <th className="px-6 py-3.5">Layanan</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/resepsionis/janji/${item.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 tabular-nums">
                      {item.tanggal}
                    </td>
                    <td className="px-6 py-4 tabular-nums font-medium text-gray-700">
                      {item.jam} WITA
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {item.pasienNama}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-gray-800">
                        <Stethoscope className="w-3.5 h-3.5 text-[#0E7490]" />
                        {item.dokterNama}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {item.layananNama}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E7490] hover:underline">
                        Kelola
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KelolaJanjiResepsionisPage() {
  return (
    <RouteGuard allowedRoles={["resepsionis", "super_admin"]}>
      <AppLayout>
        <Suspense fallback={<div className="p-8 text-center text-xs">Memuat saringan...</div>}>
          <KelolaJanjiContent />
        </Suspense>
      </AppLayout>
    </RouteGuard>
  );
}
