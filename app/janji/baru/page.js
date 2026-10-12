"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  FileText,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function BuatJanjiPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [layananList, setLayananList] = useState([]);
  const [dokterList, setDokterList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);

  // Form states
  const [selectedLayananId, setSelectedLayananId] = useState("");
  const [selectedDokterId, setSelectedDokterId] = useState("");
  const [selectedTanggal, setSelectedTanggal] = useState("");
  const [selectedJam, setSelectedJam] = useState("");
  const [keluhan, setKeluhan] = useState("");

  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [minDateStr, setMinDateStr] = useState("");

  // 1. Ambil Layanan Aktif, Dokter, dan Jadwal
  useEffect(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    setMinDateStr(tmr.toISOString().split("T")[0]);

    const fetchData = async () => {
      try {
        // Layanan aktif
        const laySnap = await getDocs(
          query(collection(db, "layanan"), where("aktif", "==", true))
        );
        const lList = [];
        laySnap.forEach((d) => lList.push({ id: d.id, ...d.data() }));
        setLayananList(lList);
        if (lList.length > 0) setSelectedLayananId(lList[0].id);

        // Dokter
        const dokSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "dokter"))
        );
        const dList = [];
        dokSnap.forEach((d) => dList.push({ id: d.id, ...d.data() }));

        // Jika belum ada akun dokter di koleksi users, sediakan dokter standar klinik
        if (dList.length === 0) {
          const defaultDoctors = [
            { id: "dokter_bima", nama: "drg. Bima", email: "bima@senyumrekah.id" },
            { id: "dokter_sinta", nama: "drg. Sinta", email: "sinta@senyumrekah.id" },
          ];
          setDokterList(defaultDoctors);
          setSelectedDokterId(defaultDoctors[0].id);
        } else {
          setDokterList(dList);
          setSelectedDokterId(dList[0].id);
        }

        // Jadwal Dokter
        const jadSnap = await getDocs(collection(db, "jadwal_dokter"));
        const jList = [];
        jadSnap.forEach((d) => jList.push({ id: d.id, ...d.data() }));
        setJadwalList(jList);
      } catch (err) {
        console.error("Gagal memuat master data janji:", err);
        setErrorMsg("Gagal memuat data formulir janji.");
      }
    };

    fetchData();
  }, []);

  // 2. Hitung Hari dari Tanggal Terpilih (0=Minggu, 1=Senin, ..., 6=Sabtu)
  const getDayName = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const days = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    return days[date.getDay()];
  };

  // 3. Muat Slot Jam Kosong
  useEffect(() => {
    const generateSlots = async () => {
      if (!selectedDokterId || !selectedTanggal || !selectedLayananId) {
        setAvailableSlots([]);
        return;
      }

      setSlotsLoading(true);
      setErrorMsg("");
      setSelectedJam("");

      try {
        const dayName = getDayName(selectedTanggal);
        if (dayName === "minggu") {
          setErrorMsg("Klinik tutup pada hari Minggu. Silakan pilih hari Senin sampai Sabtu.");
          setAvailableSlots([]);
          setSlotsLoading(false);
          return;
        }

        // Cari jam praktik dokter untuk hari ini
        const dokterJadwal = jadwalList.find(
          (j) => j.dokterId === selectedDokterId && j.hari?.toLowerCase() === dayName
        );

        // Jika tidak disetel di jadwal_dokter, gunakan jam praktik standar klinik (09:00 - 15:00)
        const jamMulai = dokterJadwal?.jamMulai || "09:00";
        const jamSelesai = dokterJadwal?.jamSelesai || "15:00";

        // Buat semua kemungkinan slot per 30 menit
        const allPossibleSlots = [];
        let [currentHour, currentMin] = jamMulai.split(":").map(Number);
        const [endHour, endMin] = jamSelesai.split(":").map(Number);

        while (
          currentHour < endHour ||
          (currentHour === endHour && currentMin < endMin)
        ) {
          const timeString = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
          allPossibleSlots.push(timeString);

          currentMin += 30;
          if (currentMin >= 60) {
            currentHour += 1;
            currentMin = 0;
          }
        }

        // Ambil slot_terisi untuk dokter dan tanggal ini
        const qSlots = query(
          collection(db, "slot_terisi"),
          where("dokterId", "==", selectedDokterId),
          where("tanggal", "==", selectedTanggal)
        );
        const slotSnap = await getDocs(qSlots);
        const bookedTimes = new Set();
        slotSnap.forEach((docItem) => {
          const data = docItem.data();
          if (data.jam) {
            bookedTimes.add(data.jam);
          }
        });

        // Filter slot yang belum terisi
        const freeSlots = allPossibleSlots.filter((slot) => !bookedTimes.has(slot));
        setAvailableSlots(freeSlots);
        if (freeSlots.length > 0) {
          setSelectedJam(freeSlots[0]);
        }
      } catch (err) {
        console.error("Gagal menghitung slot:", err);
        setErrorMsg("Gagal memuat slot jam praktik.");
      } finally {
        setSlotsLoading(false);
      }
    };

    generateSlots();
  }, [selectedDokterId, selectedTanggal, selectedLayananId, jadwalList]);

  // 4. Submit Form Buat Janji
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedLayananId || !selectedDokterId || !selectedTanggal || !selectedJam || !keluhan.trim()) {
      setErrorMsg("Semua kolom formulir wajib diisi.");
      return;
    }

    if (new Date(selectedTanggal + "T00:00:00") < new Date(minDateStr + "T00:00:00")) {
      setErrorMsg("Tanggal janji temu paling cepat adalah besok.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Cek kembali slot_terisi (race condition validation)
      const conflictQuery = query(
        collection(db, "slot_terisi"),
        where("dokterId", "==", selectedDokterId),
        where("tanggal", "==", selectedTanggal),
        where("jam", "==", selectedJam)
      );
      const conflictSnap = await getDocs(conflictQuery);
      if (!conflictSnap.empty) {
        setErrorMsg("Slot ini baru saja terisi. Pilih jam lain.");
        setIsSubmitting(false);
        return;
      }

      const chosenLayanan = layananList.find((l) => l.id === selectedLayananId);
      const durasiMenit = chosenLayanan?.durasiMenit || 30;

      // 1. Buat dokumen janji_temu
      const newJanjiRef = doc(collection(db, "janji_temu"));
      const janjiData = {
        pasienId: user.uid,
        dokterId: selectedDokterId,
        layananId: selectedLayananId,
        tanggal: selectedTanggal,
        jam: selectedJam,
        keluhan: keluhan.trim(),
        status: "menunggu", // Status awal sesuai PRD 4.3.1
        alasanBatal: "",
        dibuatPada: serverTimestamp(),
      };

      await setDoc(newJanjiRef, janjiData);

      // 2. Buat dokumen slot_terisi dengan ID dokumen yang SAMA sesuai PRD 7.1
      const slotRef = doc(db, "slot_terisi", newJanjiRef.id);
      await setDoc(slotRef, {
        dokterId: selectedDokterId,
        tanggal: selectedTanggal,
        jam: selectedJam,
        durasiMenit: durasiMenit,
      });

      // Bawa pasien ke rincian janji
      router.push(`/janji/${newJanjiRef.id}`);
    } catch (err) {
      console.error("Gagal membuat janji temu:", err);
      setErrorMsg("Terjadi kesalahan saat menyimpan janji temu. Coba lagi.");
      setIsSubmitting(false);
    }
  };

  return (
    <RouteGuard allowedRoles={["pasien", "super_admin"]}>
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/beranda"
              className="p-2 rounded-xl bg-white border border-slate-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Buat Janji Temu Baru</h1>
              <p className="text-xs text-[#5A6B78]">
                Pilih layanan, dokter, tanggal praktik, dan slot jam yang tersedia
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {errorMsg && (
              <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Pilih Layanan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Layanan Klinik <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLayananId}
                  onChange={(e) => setSelectedLayananId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                >
                  {layananList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama} ({item.durasiMenit} menit) - Rp {Number(item.harga).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Pilih Dokter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Dokter Gigi <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDokterId}
                  onChange={(e) => setSelectedDokterId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                >
                  {dokterList.map((docItem) => (
                    <option key={docItem.id} value={docItem.id}>
                      {docItem.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Pilih Tanggal */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Tanggal Periksa <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={minDateStr}
                  value={selectedTanggal}
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] tabular-nums"
                />
                <p className="mt-1 text-[11px] text-[#5A6B78]">
                  Paling cepat besok. Klinik buka Senin sampai Sabtu.
                </p>
              </div>

              {/* 4. Slot Jam */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Pilih Slot Jam yang Kosong <span className="text-red-500">*</span>
                </label>

                {slotsLoading ? (
                  <div className="py-4 flex items-center gap-2 text-xs text-[#5A6B78]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0E7490]" />
                    Memeriksa ketersediaan slot jam...
                  </div>
                ) : !selectedTanggal ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Pilih tanggal terlebih dahulu untuk melihat slot jam kosong.
                  </p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    Tidak ada slot kosong yang tersedia pada tanggal ini. Silakan pilih hari atau tanggal lain.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                    {availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedJam(slot)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border tabular-nums transition-all ${
                          selectedJam === slot
                            ? "bg-[#0E7490] text-white border-[#0E7490] shadow-xs"
                            : "bg-white text-gray-700 border-slate-300 hover:border-[#0E7490] hover:bg-cyan-50/50"
                        }`}
                      >
                        {slot} WITA
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Keluhan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Keluhan Pasien <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={keluhan}
                  onChange={(e) => setKeluhan(e.target.value)}
                  placeholder="Contoh: Gigi geraham kiri bawah terasa ngilu saat minum air dingin..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedJam}
                  className="w-full py-3 px-4 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan Janji...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Kirim & Buat Janji Temu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  );
}
