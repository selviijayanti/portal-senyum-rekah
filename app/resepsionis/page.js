"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Loader2,
  CalendarCheck,
  ChevronRight,
  User,
  Stethoscope,
  Activity,
} from "lucide-react";

export default function DasborResepsionisPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [menungguCount, setMenungguCount] = useState(0);
  const [todayJanjiList, setTodayJanjiList] = useState([]);
  const [todayStr, setTodayStr] = useState("");
  const [dokterMap, setDokterMap] = useState({});

  const fetchData = async (currentDate) => {
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Ambil semua dokter
      const dokSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "dokter"))
      );
      const dMap = {};
      dokSnap.forEach((d) => {
        dMap[d.id] = d.data().nama;
      });
      // Fallback default doctors
      if (!dMap["dokter_bima"]) dMap["dokter_bima"] = "drg. Bima";
      if (!dMap["dokter_sinta"]) dMap["dokter_sinta"] = "drg. Sinta";
      setDokterMap(dMap);

      // 2. Ambil semua janji temu
      const janjiSnap = await getDocs(collection(db, "janji_temu"));
      const allJanji = [];
      let pending = 0;

      janjiSnap.forEach((docItem) => {
        const data = docItem.data();
        allJanji.push({ id: docItem.id, ...data });
        if (data.status === "menunggu") {
          pending += 1;
        }
      });

      setMenungguCount(pending);

      // Saring janji hari ini
      const todayOnly = allJanji.filter((j) => j.tanggal === currentDate && j.status !== "dibatalkan");

      // Lengkapi dengan nama pasien dan layanan
      const enrichedToday = await Promise.all(
        todayOnly.map(async (item) => {
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

          return {
            ...item,
            pasienNama,
            layananNama,
            dokterNama: dMap[item.dokterId] || "drg. Dokter",
          };
        })
      );

      // Urutkan per jam
      enrichedToday.sort((a, b) => a.jam.localeCompare(b.jam));
      setTodayJanjiList(enrichedToday);
    } catch (err) {
      console.error("Gagal memuat dasbor resepsionis:", err);
      setErrorMsg("Gagal memuat data dasbor resepsionis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTodayStr(today);
    fetchData(today);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "menunggu":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold badge-menunggu">Menunggu</span>;
      case "dikonfirmasi":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold badge-dikonfirmasi">Dikonfirmasi</span>;
      case "hadir":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold badge-hadir">Hadir</span>;
      case "selesai":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold badge-selesai">Selesai</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Kelompokkan janji hari ini per dokter (drg. Bima & drg. Sinta)
  const doctorsList = Object.entries(dokterMap).map(([id, nama]) => ({ id, nama }));

  return (
    <RouteGuard allowedRoles={["resepsionis", "super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dasbor Resepsionis</h1>
              <p className="text-xs text-[#5A6B78]">
                Ringkasan janji temu hari ini ({todayStr}) dan antrean konfirmasi
              </p>
            </div>

            <Link
              href="/resepsionis/janji"
              className="inline-flex items-center gap-2 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              Buka Kelola Janji
            </Link>
          </div>

          {/* Kartu Metrik Ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kartu Menunggu Konfirmasi (Bisa diklik untuk filter) */}
            <div
              onClick={() => router.push("/resepsionis/janji?status=menunggu")}
              className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 rounded-2xl p-6 transition-all cursor-pointer flex items-center justify-between shadow-xs"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Menunggu Konfirmasi
                </span>
                <div className="mt-2 text-3xl font-extrabold text-amber-900 tabular-nums">
                  {menungguCount}
                </div>
                <p className="mt-1 text-xs text-amber-700">
                  Janji baru yang memerlukan tindakan konfirmasi Anda
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-200/60 rounded-xl flex items-center justify-center text-amber-800">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            {/* Kartu Janji Hari Ini */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5A6B78]">
                  Total Janji Hari Ini
                </span>
                <div className="mt-2 text-3xl font-extrabold text-gray-900 tabular-nums">
                  {todayJanjiList.length}
                </div>
                <p className="mt-1 text-xs text-[#5A6B78]">
                  Jadwal kunjungan pemeriksaan dokter hari ini
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-[#0E7490]">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Kolom Janji Hari Ini Per Dokter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#0E7490]" />
              Janji Hari Ini per Dokter ({todayStr})
            </h2>

            {loading && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat jadwal dokter...</p>
              </div>
            )}

            {errorMsg && !loading && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            {!loading && !errorMsg && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctorsList.map((dok) => {
                  const dokterJanji = todayJanjiList.filter(
                    (j) => j.dokterId === dok.id || (!j.dokterId && dok.id === "dokter_bima")
                  );

                  return (
                    <div
                      key={dok.id}
                      className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col h-full"
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                        <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-[#0E7490]" />
                          {dok.nama}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[#5A6B78] tabular-nums">
                          {dokterJanji.length} Janji
                        </span>
                      </div>

                      {dokterJanji.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-6 text-center">
                          Tidak ada janji untuk dokter ini hari ini.
                        </p>
                      ) : (
                        <div className="space-y-2.5 flex-1">
                          {dokterJanji.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => router.push(`/resepsionis/janji/${item.id}`)}
                              className="bg-white p-3 rounded-xl border border-slate-200 hover:border-[#0E7490] hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-gray-900 tabular-nums">
                                    {item.jam} WITA
                                  </span>
                                  <span className="text-xs font-medium text-gray-700">
                                    {item.pasienNama}
                                  </span>
                                </div>
                                <span className="text-[11px] text-[#5A6B78] block mt-0.5">
                                  {item.layananNama}
                                </span>
                              </div>
                              <div className="shrink-0">{getStatusBadge(item.status)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  );
}
