"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  FileText,
  Calendar,
  Stethoscope,
  AlertCircle,
  Loader2,
  Activity,
} from "lucide-react";

export default function RiwayatPerawatanPage() {
  const { user } = useAuth();

  const [riwayatList, setRiwayatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchRiwayat = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // Ambil semua janji milik pasien dengan status 'selesai'
      const q = query(
        collection(db, "janji_temu"),
        where("pasienId", "==", user.uid),
        where("status", "==", "selesai")
      );

      const snap = await getDocs(q);
      const janjiSelesai = [];
      snap.forEach((d) => janjiSelesai.push({ id: d.id, ...d.data() }));

      // Urutkan dari tanggal terbaru
      janjiSelesai.sort((a, b) => {
        const dateA = `${a.tanggal} ${a.jam}`;
        const dateB = `${b.tanggal} ${b.jam}`;
        return dateB.localeCompare(dateA);
      });

      // Ambil catatan_perawatan untuk setiap janji
      const enriched = await Promise.all(
        janjiSelesai.map(async (item) => {
          let dokterNama = "Dokter Gigi";
          let layananNama = "Layanan Klinik";
          let tindakan = "-";
          let catatan = "-";

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

          // Cari di koleksi catatan_perawatan
          try {
            const catQuery = query(
              collection(db, "catatan_perawatan"),
              where("janjiId", "==", item.id)
            );
            const catSnap = await getDocs(catQuery);
            if (!catSnap.empty) {
              const catData = catSnap.docs[0].data();
              tindakan = catData.tindakan || "-";
              catatan = catData.catatan || "-";
            }
          } catch (e) {
            console.warn(e);
          }

          return {
            ...item,
            dokterNama,
            layananNama,
            tindakan,
            catatan,
          };
        })
      );

      setRiwayatList(enriched);
    } catch (err) {
      console.error("Gagal memuat riwayat perawatan:", err);
      setErrorMsg("Gagal memuat data riwayat perawatan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [user]);

  return (
    <RouteGuard allowedRoles={["pasien", "super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Riwayat Perawatan</h1>
            <p className="text-xs text-[#5A6B78]">
              Catatan tindakan medis dan instruksi dokter dari kunjungan pemeriksaan yang telah selesai
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat catatan perawatan...</p>
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
                    onClick={fetchRiwayat}
                    className="px-3 py-1 bg-white border border-red-300 rounded-lg text-xs font-semibold hover:bg-red-50"
                  >
                    Coba lagi
                  </button>
                </div>
              </div>
            )}

            {!loading && !errorMsg && riwayatList.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Belum ada riwayat perawatan</h3>
                <p className="text-xs text-[#5A6B78] mt-1 max-w-sm mx-auto">
                  Catatan perawatan medis akan otomatis muncul di sini setelah dokter menyelesaikan sesi pemeriksaan janji temu Anda.
                </p>
              </div>
            )}

            {!loading && !errorMsg && riwayatList.length > 0 && (
              <div className="divide-y divide-slate-100">
                {riwayatList.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                      <div>
                        <span className="font-bold text-gray-900 text-base">{item.layananNama}</span>
                        <div className="flex items-center gap-2 text-xs text-[#5A6B78] mt-1">
                          <Stethoscope className="w-3.5 h-3.5 text-[#0E7490]" />
                          <span>Oleh: {item.dokterNama}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600 tabular-nums">
                        <div className="flex items-center gap-1.5 font-semibold bg-slate-100 px-3 py-1 rounded-lg">
                          <Calendar className="w-3.5 h-3.5 text-[#0E7490]" />
                          <span>{item.tanggal} ({item.jam} WITA)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-selesai">
                          Selesai
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#0E7490]" />
                          Tindakan Medis yang Dilakukan
                        </h4>
                        <p className="text-sm text-gray-800 leading-relaxed font-medium">
                          {item.tindakan}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#0E7490]" />
                          Catatan & Instruksi Dokter
                        </h4>
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {item.catatan}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  );
}
