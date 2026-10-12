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
} from "lucide-react";

export default function DasborDokterPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [todayJanji, setTodayJanji] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [todayStr, setTodayStr] = useState("");
  const isSuperAdmin = userProfile?.role === "super_admin";

  const fetchDokterJadwal = async (currentDate) => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // Ambil janji hari ini
      const janjiSnap = await getDocs(collection(db, "janji_temu"));
      const raw = [];

      janjiSnap.forEach((docItem) => {
        const data = docItem.data();
        // Dokter hanya melihat janji miliknya sendiri (kecuali super_admin)
        const isMyAppointment =
          isSuperAdmin ||
          data.dokterId === user.uid ||
          // Fallback dev matching by email/name if uid was from mock doctor
          (user.email?.includes("bima") && data.dokterId === "dokter_bima") ||
          (user.email?.includes("sinta") && data.dokterId === "dokter_sinta");

        if (data.tanggal === currentDate && isMyAppointment) {
          raw.push({ id: docItem.id, ...data });
        }
      });

      // Urutkan per jam
      raw.sort((a, b) => a.jam.localeCompare(b.jam));

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
      setErrorMsg("Gagal memuat jadwal dokter hari ini.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTodayStr(today);
    fetchDokterJadwal(today);
  }, [user, userProfile]);

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dasbor Dokter Gigi</h1>
              <p className="text-xs text-[#5A6B78]">
                Jadwal pemeriksaan pasien hari ini ({todayStr}) untuk {userProfile?.nama || "Dokter"}
              </p>
            </div>

            <button
              onClick={fetchDokterJadwal}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-gray-700 transition-colors shadow-2xs"
            >
              Segarkan Jadwal
            </button>
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
                <h3 className="text-sm font-semibold text-gray-800">Tidak ada jadwal periksa hari ini</h3>
                <p className="text-xs text-[#5A6B78] mt-1 max-w-sm mx-auto">
                  Belum ada janji pasien yang dijadwalkan untuk Anda pada hari ini.
                </p>
              </div>
            )}

            {!loading && !errorMsg && todayJanji.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                            >
                              <span>Periksa</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <Link
                              href={`/dokter/janji/${item.id}`}
                              className="text-xs text-[#0E7490] font-semibold hover:underline"
                            >
                              Rincian
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
