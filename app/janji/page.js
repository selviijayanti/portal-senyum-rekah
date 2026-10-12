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
  Calendar,
  Clock,
  PlusCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Stethoscope,
} from "lucide-react";

export default function DaftarJanjiPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [janjiList, setJanjiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJanji = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "janji_temu"),
        where("pasienId", "==", user.uid)
      );

      const snap = await getDocs(q);
      const rawList = [];
      snap.forEach((d) => rawList.push({ id: d.id, ...d.data() }));

      // Urutkan dari tanggal & jam terdekat
      rawList.sort((a, b) => {
        const dateA = `${a.tanggal} ${a.jam}`;
        const dateB = `${b.tanggal} ${b.jam}`;
        return dateA.localeCompare(dateB);
      });

      // Ambil nama dokter & layanan
      const enriched = await Promise.all(
        rawList.map(async (item) => {
          let dokterNama = "Dokter Gigi";
          let layananNama = "Layanan Klinik";

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

          return { ...item, dokterNama, layananNama };
        })
      );

      setJanjiList(enriched);
    } catch (err) {
      console.error("Gagal mengambil data janji:", err);
      setError("Gagal memuat daftar janji. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJanji();
  }, [user]);

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
    <RouteGuard allowedRoles={["pasien", "super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Janji Saya</h1>
              <p className="text-xs text-[#5A6B78]">
                Daftar janji temu pemeriksaan gigi Anda di Klinik Senyum Rekah
              </p>
            </div>
            <Link
              href="/janji/baru"
              className="inline-flex items-center gap-2 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Buat Janji Baru
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Keadaan 1: Memuat */}
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat daftar janji...</p>
              </div>
            )}

            {/* Keadaan 2: Gagal */}
            {error && !loading && (
              <div className="p-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
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

            {/* Keadaan 3: Kosong */}
            {!loading && !error && janjiList.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Belum ada riwayat janji</h3>
                <p className="text-xs text-[#5A6B78] mt-1 max-w-sm mx-auto mb-5">
                  Anda belum pernah membuat janji temu. Klik tombol di bawah untuk membuat janji baru.
                </p>
                <Link
                  href="/janji/baru"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E7490] text-white text-xs font-semibold rounded-xl hover:bg-[#155E75]"
                >
                  <PlusCircle className="w-4 h-4" />
                  Buat Janji Pertama
                </Link>
              </div>
            )}

            {/* Keadaan 4: Berhasil (Tabel Janji) */}
            {!loading && !error && janjiList.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Tanggal</th>
                      <th className="px-6 py-3.5">Jam</th>
                      <th className="px-6 py-3.5">Dokter</th>
                      <th className="px-6 py-3.5">Layanan</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {janjiList.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/janji/${item.id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 tabular-nums">
                          {item.tanggal}
                        </td>
                        <td className="px-6 py-4 tabular-nums font-medium text-gray-700">
                          {item.jam} WITA
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
                            Rincian
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
      </AppLayout>
    </RouteGuard>
  );
}
