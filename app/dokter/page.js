"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Stethoscope,
  Clock,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  ChevronRight,
  Activity,
  CheckCircle2,
  CalendarDays,
  ListFilter,
} from "lucide-react";
import { getLocalDateString, getTomorrowDateString, formatDateIndo } from "@/lib/dateUtils";

export default function DasborDokterPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [todayJanji, setTodayJanji] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [todayStr, setTodayStr] = useState("");
  const [tomorrowStr, setTomorrowStr] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState("tanggal"); // "tanggal" atau "semua"

  const isSuperAdmin = userProfile?.role === "super_admin";

  const fetchDokterJadwal = async (currentDate, mode = viewMode) => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const janjiSnap = await getDocs(collection(db, "janji_temu"));
      const raw = [];
      const currentToday = todayStr || getLocalDateString();

      janjiSnap.forEach((docItem) => {
        const data = docItem.data();
        
        // Dokter hanya melihat janji miliknya sendiri (atau super_admin)
        // Cocokkan UID akun, atau ID bawaan dokter_bima / dokter_sinta
        const isMyAppointment =
          isSuperAdmin ||
          data.dokterId === user.uid ||
          (userProfile?.nama?.toLowerCase().includes("bima") && data.dokterId === "dokter_bima") ||
          (userProfile?.nama?.toLowerCase().includes("sinta") && data.dokterId === "dokter_sinta") ||
          (user?.email?.toLowerCase().includes("bima") && data.dokterId === "dokter_bima") ||
          (user?.email?.toLowerCase().includes("sinta") && data.dokterId === "dokter_sinta");

        if (!isMyAppointment) return;

        if (mode === "tanggal") {
          if (data.tanggal === currentDate) {
            raw.push({ id: docItem.id, ...data });
          }
        } else {
          // Mode semua jadwal mendatang
          if (data.tanggal >= currentToday && data.status !== "dibatalkan") {
            raw.push({ id: docItem.id, ...data });
          }
        }
      });

      // Urutkan per tanggal dan jam
      raw.sort((a, b) => {
        const dateTimeA = `${a.tanggal} ${a.jam}`;
        const dateTimeB = `${b.tanggal} ${b.jam}`;
        return dateTimeA.localeCompare(dateTimeB);
      });

      // Ambil data pasien dan layanan
      const enriched = await Promise.all(
        raw.map(async (item) => {
          let pasienNama = "Pasien";
          let layananNama = "Layanan Klinik";

          if (item.pasienId) {
            try {
              const pSnap = await getDoc(doc(db, "users", item.pasienId));
              if (pSnap.exists()) pasienNama = pSnap.data().nama;
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

          return { ...item, pasienNama, layananNama };
        })
      );

      setTodayJanji(enriched);
    } catch (err) {
      console.error("Gagal memuat jadwal dokter:", err);
      setErrorMsg("Gagal memuat jadwal dokter.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = getLocalDateString();
    const tomorrow = getTomorrowDateString();
    setTodayStr(today);
    setTomorrowStr(tomorrow);
    setSelectedDate(today);
    fetchDokterJadwal(today, "tanggal");
  }, [user, userProfile]);

  const handleSelectDate = (newDate) => {
    setSelectedDate(newDate);
    setViewMode("tanggal");
    fetchDokterJadwal(newDate, "tanggal");
  };

  const handleToggleViewMode = (newMode) => {
    setViewMode(newMode);
    fetchDokterJadwal(selectedDate, newMode);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "hadir":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
            Siap Diperiksa
          </span>
        );
      case "dikonfirmasi":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-dikonfirmasi">Dikonfirmasi</span>;
      case "menunggu":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-menunggu">Menunggu</span>;
      case "selesai":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-selesai">Selesai</span>;
      case "dibatalkan":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-dibatalkan">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <RouteGuard allowedRoles={["dokter", "super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dasbor Dokter Gigi</h1>
              <p className="text-xs text-[#5A6B78]">
                {viewMode === "tanggal"
                  ? `Jadwal pemeriksaan pasien tanggal ${selectedDate} (${formatDateIndo(selectedDate)})`
                  : "Semua jadwal janji temu pasien mendatang"}
                {" untuk "}<span className="font-semibold text-gray-800">{userProfile?.nama || "Dokter"}</span>
              </p>
            </div>

            <button
              onClick={() => fetchDokterJadwal(selectedDate, viewMode)}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-gray-700 transition-colors shadow-2xs self-start sm:self-auto"
            >
              Segarkan Jadwal
            </button>
          </div>

          {/* Filter Tanggal & Mode Tampilan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectDate(todayStr)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  viewMode === "tanggal" && selectedDate === todayStr
                    ? "bg-[#0E7490] text-white shadow-xs"
                    : "bg-slate-100 text-gray-700 hover:bg-slate-200"
                }`}
              >
                Hari Ini ({todayStr})
              </button>

              <button
                type="button"
                onClick={() => handleSelectDate(tomorrowStr)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  viewMode === "tanggal" && selectedDate === tomorrowStr
                    ? "bg-[#0E7490] text-white shadow-xs"
                    : "bg-slate-100 text-gray-700 hover:bg-slate-200"
                }`}
              >
                Besok ({tomorrowStr})
              </button>

              <button
                type="button"
                onClick={() => handleToggleViewMode("semua")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === "semua"
                    ? "bg-[#0E7490] text-white shadow-xs"
                    : "bg-slate-100 text-gray-700 hover:bg-slate-200"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                Semua Janji Mendatang
              </button>
            </div>

            {/* Input Pemilih Tanggal Manual */}
            <div className="flex items-center gap-2">
              <label htmlFor="pilih-tanggal" className="text-xs font-medium text-[#5A6B78] flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-[#0E7490]" />
                Pilih Tanggal:
              </label>
              <input
                id="pilih-tanggal"
                type="date"
                value={selectedDate}
                onChange={(e) => handleSelectDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0E7490]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat jadwal pemeriksaan...</p>
              </div>
            )}

            {errorMsg && !loading && (
              <div className="p-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {errorMsg}
                </div>
              </div>
            )}

            {!loading && !errorMsg && todayJanji.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {viewMode === "tanggal"
                    ? `Tidak ada jadwal periksa untuk tanggal ${selectedDate}`
                    : "Tidak ada jadwal periksa pasien mendatang"}
                </h3>
                <p className="text-xs text-[#5A6B78] mt-1 max-w-sm mx-auto">
                  {viewMode === "tanggal"
                    ? "Gunakan tombol di atas untuk memilih tanggal lain atau melihat semua jadwal mendatang."
                    : "Belum ada janji temu pasien yang dijadwalkan ke depan untuk akun Anda."}
                </p>
              </div>
            )}

            {!loading && !errorMsg && todayJanji.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      {viewMode === "semua" && <th className="px-6 py-3.5">Tanggal</th>}
                      <th className="px-6 py-3.5">Jam</th>
                      <th className="px-6 py-3.5">Pasien</th>
                      <th className="px-6 py-3.5">Layanan</th>
                      <th className="px-6 py-3.5">Keluhan</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todayJanji.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          item.status === "hadir" ? "bg-purple-50/30" : ""
                        }`}
                      >
                        {viewMode === "semua" && (
                          <td className="px-6 py-4 font-semibold text-[#0E7490] tabular-nums">
                            {item.tanggal}
                          </td>
                        )}
                        <td className="px-6 py-4 font-bold text-gray-900 tabular-nums">
                          {item.jam} WITA
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {item.pasienNama}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {item.layananNama}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-600">
                          {item.keluhan || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === "hadir" ? (
                            <Link
                              href={`/dokter/janji/${item.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Periksa Pasien</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : item.status === "selesai" ? (
                            <Link
                              href={`/dokter/janji/${item.id}`}
                              className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Catatan Medis
                            </Link>
                          ) : (
                            <Link
                              href={`/dokter/janji/${item.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
                            >
                              <span>Lihat Rincian</span>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  );
}
