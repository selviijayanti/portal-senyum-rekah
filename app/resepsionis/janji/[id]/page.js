"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle,
  CheckCircle2,
  CalendarDays,
  XCircle,
  UserCheck,
} from "lucide-react";
import { getLocalDateString } from "@/lib/dateUtils";

// Helper: konversi "HH:MM" → menit sejak tengah malam
const timeToMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Cek apakah dua slot bertumpang tindih berdasarkan jam mulai dan durasi
const slotsOverlap = (jamA, durA, jamB, durB) => {
  const startA = timeToMin(jamA);
  const startB = timeToMin(jamB);
  return startA < startB + durB && startB < startA + durA;
};

function RincianJanjiResepsionisContent() {
  const { id } = useParams();
  const router = useRouter();

  const [janji, setJanji] = useState(null);
  const [pasienData, setPasienData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Modal Batalkan states
  const [batalModalOpen, setBatalModalOpen] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState("");

  // Modal Jadwal Ulang states
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newTanggal, setNewTanggal] = useState("");
  const [newJam, setNewJam] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [jadwalList, setJadwalList] = useState([]);

  const [todayStr, setTodayStr] = useState("");

  const fetchJanjiDetail = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const janjiRef = doc(db, "janji_temu", id);
      const janjiSnap = await getDoc(janjiRef);

      if (!janjiSnap.exists()) {
        setErrorMsg("Janji temu tidak ditemukan.");
        setLoading(false);
        return;
      }

      const data = janjiSnap.data();

      // Ambil data pasien (Nama, Email, NoHP)
      let pData = { nama: "Pasien", email: "-", noHp: "-" };
      if (data.pasienId) {
        try {
          const pSnap = await getDoc(doc(db, "users", data.pasienId));
          if (pSnap.exists()) {
            pData = pSnap.data();
          }
        } catch (e) {
          console.warn(e);
        }
      }
      setPasienData(pData);

      // Ambil dokter dan layanan info
      let dokterNama = "Dokter Gigi";
      let layananNama = "Layanan Klinik";
      let durasiMenit = 30;

      if (data.dokterId) {
        try {
          const dSnap = await getDoc(doc(db, "users", data.dokterId));
          if (dSnap.exists()) dokterNama = dSnap.data().nama;
        } catch (e) {
          console.warn(e);
        }
      }

      if (data.layananId) {
        try {
          const lSnap = await getDoc(doc(db, "layanan", data.layananId));
          if (lSnap.exists()) {
            const lData = lSnap.data();
            layananNama = lData.nama;
            durasiMenit = lData.durasiMenit || 30;
          }
        } catch (e) {
          console.warn(e);
        }
      }

      setJanji({
        id: janjiSnap.id,
        ...data,
        dokterNama,
        layananNama,
        durasiMenit,
      });
    } catch (err) {
      console.error("Gagal memuat janji:", err);
      setErrorMsg("Gagal memuat rincian janji.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTodayStr(getLocalDateString());
    fetchJanjiDetail();
  }, [id]);

  // Ambil jadwal_dokter untuk reschedule slot
  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const snap = await getDocs(collection(db, "jadwal_dokter"));
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setJadwalList(list);
      } catch (e) {
        console.warn("Gagal memuat jadwal dokter:", e);
      }
    };
    fetchJadwal();
  }, []);

  // Aksi 1: Konfirmasi Janji
  const handleKonfirmasi = async () => {
    if (!janji) return;
    setActionLoading(true);
    setActionError("");
    try {
      const janjiRef = doc(db, "janji_temu", janji.id);
      await updateDoc(janjiRef, {
        status: "dikonfirmasi",
      });
      await fetchJanjiDetail();
    } catch (e) {
      console.error("Gagal konfirmasi:", e);
      setActionError("Gagal mengonfirmasi janji. Coba lagi.");
    } finally {
      setActionLoading(false);
    }
  };

  // Aksi 2: Batalkan Janji oleh Resepsionis
  const handleBatalkan = async (e) => {
    e.preventDefault();
    if (!janji || !alasanBatal.trim()) return;

    setActionLoading(true);
    setActionError("");
    try {
      const janjiRef = doc(db, "janji_temu", janji.id);
      await updateDoc(janjiRef, {
        status: "dibatalkan",
        alasanBatal: alasanBatal.trim(),
      });

      // Hapus slot_terisi agar slot kembali kosong
      try {
        await deleteDoc(doc(db, "slot_terisi", janji.id));
      } catch (errSlot) {
        console.warn(errSlot);
      }

      setBatalModalOpen(false);
      setAlasanBatal("");
      await fetchJanjiDetail();
    } catch (e) {
      console.error("Gagal membatalkan:", e);
      setActionError("Gagal membatalkan janji. Coba lagi.");
    } finally {
      setActionLoading(false);
    }
  };

  // Aksi 3: Tandai Hadir (Hanya jika hari ini dan dikonfirmasi)
  const handleTandaiHadir = async () => {
    if (!janji) return;
    setActionLoading(true);
    try {
      const janjiRef = doc(db, "janji_temu", janji.id);
      await updateDoc(janjiRef, {
        status: "hadir",
      });
      await fetchJanjiDetail();
    } catch (e) {
      console.error("Gagal menandai hadir:", e);
      setActionError("Gagal menandai kehadiran pasien. Coba lagi.");
    } finally {
      setActionLoading(false);
    }
  };

  // Hitung slot jam kosong untuk jadwal ulang
  useEffect(() => {
    const fetchRescheduleSlots = async () => {
      if (!newTanggal || !janji) {
        setAvailableSlots([]);
        return;
      }
      setSlotsLoading(true);
      setNewJam("");

      try {
        const dateObj = new Date(newTanggal + "T00:00:00");
        const days = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
        const dayName = days[dateObj.getDay()];

        if (dayName === "minggu") {
          setAvailableSlots([]);
          setSlotsLoading(false);
          return;
        }

        // Cari jadwal dokter pada hari ini dari jadwal_dokter (bukan hardcode)
        const dokterJadwal = jadwalList.find(
          (j) =>
            j.dokterId === janji.dokterId &&
            j.hari?.toLowerCase() === dayName
        );
        const jamMulai = dokterJadwal?.jamMulai || "09:00";
        const jamSelesai = dokterJadwal?.jamSelesai || "15:00";

        // Buat semua kemungkinan slot per 30 menit
        const allPossibleSlots = [];
        let [curH, curM] = jamMulai.split(":").map(Number);
        const [endH, endM] = jamSelesai.split(":").map(Number);
        while (curH < endH || (curH === endH && curM < endM)) {
          allPossibleSlots.push(
            `${String(curH).padStart(2, "0")}:${String(curM).padStart(2, "0")}`
          );
          curM += 30;
          if (curM >= 60) { curH += 1; curM = 0; }
        }

        // Ambil slot_terisi untuk tanggal dan dokter ini (beserta durasi)
        const qSlots = query(
          collection(db, "slot_terisi"),
          where("dokterId", "==", janji.dokterId),
          where("tanggal", "==", newTanggal)
        );
        const snap = await getDocs(qSlots);
        const bookedSlots = [];
        snap.forEach((d) => {
          // Abaikan slot milik janji ini sendiri
          if (d.id !== janji.id && d.data().jam) {
            bookedSlots.push({ jam: d.data().jam, durasiMenit: d.data().durasiMenit || 30 });
          }
        });

        // Durasi layanan janji ini
        const rescheduleDurasi = janji.durasiMenit || 30;

        // Filter: slot kosong = tidak ada overlap dengan janji lain
        const free = allPossibleSlots.filter((slot) =>
          !bookedSlots.some(({ jam, durasiMenit }) =>
            slotsOverlap(slot, rescheduleDurasi, jam, durasiMenit)
          )
        );
        setAvailableSlots(free);
        if (free.length > 0) setNewJam(free[0]);
      } catch (err) {
        console.error("Gagal slot reschedule:", err);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchRescheduleSlots();
  }, [newTanggal, janji, jadwalList]);

  // Simpan Jadwal Ulang
  const handleSimpanJadwalUlang = async (e) => {
    e.preventDefault();
    if (!janji || !newTanggal || !newJam) return;

    setActionLoading(true);
    setActionError("");
    try {
      const janjiRef = doc(db, "janji_temu", janji.id);
      await updateDoc(janjiRef, {
        tanggal: newTanggal,
        jam: newJam,
      });

      // 2. Perbarui slot_terisi
      const slotRef = doc(db, "slot_terisi", janji.id);
      await setDoc(slotRef, {
        dokterId: janji.dokterId,
        tanggal: newTanggal,
        jam: newJam,
        durasiMenit: janji.durasiMenit || 30,
      });

      setRescheduleModalOpen(false);
      await fetchJanjiDetail();
    } catch (e) {
      console.error("Gagal menjadwal ulang:", e);
      setActionError("Gagal menjadwal ulang janji. Coba lagi.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "menunggu":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold badge-menunggu">Menunggu Konfirmasi</span>;
      case "dikonfirmasi":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold badge-dikonfirmasi">Dikonfirmasi</span>;
      case "hadir":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold badge-hadir">Hadir (Siap Periksa)</span>;
      case "selesai":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold badge-selesai">Selesai</span>;
      case "dibatalkan":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold badge-dibatalkan">Dibatalkan</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const isLocked = janji?.status === "selesai" || janji?.status === "dibatalkan";
  const canMarkHadir = janji?.status === "dikonfirmasi" && janji?.tanggal === todayStr;

  return (
    <RouteGuard allowedRoles={["resepsionis", "super_admin"]}>
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/resepsionis/janji"
              className="p-2 rounded-xl bg-white border border-slate-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kelola Janji Pasien</h1>
              <p className="text-xs text-[#5A6B78]">
                ID: <span className="font-mono text-gray-700">{id}</span>
              </p>
            </div>
          </div>

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#5A6B78]">Memuat data janji...</p>
            </div>
          )}

          {errorMsg && !loading && (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-900 mb-1">{errorMsg}</h3>
            </div>
          )}

          {!loading && !errorMsg && janji && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Status & Jam */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs text-[#5A6B78] uppercase font-semibold">Status Saat Ini</span>
                  <div className="mt-1">{getStatusBadge(janji.status)}</div>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs text-[#5A6B78] uppercase font-semibold">Jadwal Periksa</span>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">
                    {janji.tanggal} pukul {janji.jam} WITA
                  </p>
                </div>
              </div>

              {/* Data Pasien & Janji Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-semibold text-[#5A6B78] uppercase">Nama Pasien</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{pasienData?.nama}</p>
                  <p className="text-xs text-[#5A6B78] mt-0.5 tabular-nums">No HP: {pasienData?.noHp || "-"}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-semibold text-[#5A6B78] uppercase">Dokter Gigi</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{janji.dokterNama}</p>
                  <p className="text-xs text-[#5A6B78] mt-0.5">Layanan: {janji.layananNama}</p>
                </div>
              </div>

              {/* Keluhan Pasien */}
              <div>
                <span className="text-xs font-semibold text-[#5A6B78] uppercase">Keluhan Pasien</span>
                <div className="mt-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-gray-800">
                  {janji.keluhan || "-"}
                </div>
              </div>

              {/* Alasan Batal */}
              {janji.status === "dibatalkan" && janji.alasanBatal && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <span className="font-bold">Alasan Pembatalan: </span>
                  {janji.alasanBatal}
                </div>
              )}

              {/* Tombol Tindakan Resepsionis */}
              {!isLocked && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 justify-end">
                  {/* 1. Konfirmasi Janji */}
                  {janji.status === "menunggu" && (
                    <button
                      onClick={handleKonfirmasi}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0E7490] hover:bg-[#155E75] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Konfirmasi Janji
                    </button>
                  )}

                  {/* 2. Jadwal Ulang */}
                  <button
                    onClick={() => {
                      setNewTanggal(janji.tanggal);
                      setRescheduleModalOpen(true);
                    }}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-slate-500" />
                    Jadwal Ulang
                  </button>

                  {/* 3. Batalkan Janji */}
                  <button
                    onClick={() => setBatalModalOpen(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Batalkan Janji
                  </button>

                  {/* 4. Tandai Hadir (hanya jika dikonfirmasi & hari ini) */}
                  {canMarkHadir ? (
                    <button
                      onClick={handleTandaiHadir}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      Tandai Pasien Hadir
                    </button>
                  ) : (
                    janji.status === "dikonfirmasi" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Tandai Hadir aktif pada hari H ({janji.tanggal})
                      </span>
                    )
                  )}
                </div>
              )}

              {/* Pesan error tindakan inline */}
              {actionError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {isLocked && (
                <p className="text-xs text-slate-400 italic text-right pt-2 border-t">
                  Janji temu ini berstatus {janji.status} dan tidak dapat diubah lagi.
                </p>
              )}
            </div>
          )}

          {/* Modal Batalkan dengan Alasan */}
          {batalModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Batalkan Janji Pasien
                </h3>
                <p className="text-xs text-[#5A6B78] mb-4">
                  Masukkan alasan pembatalan janji ini agar tercatat dan dapat dibaca oleh pasien.
                </p>

                <form onSubmit={handleBatalkan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Alasan Pembatalan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={alasanBatal}
                      onChange={(e) => setAlasanBatal(e.target.value)}
                      placeholder="Contoh: Dokter berhalangan hadir / Pasien memohon pembatalan via telepon"
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBatalModalOpen(false)}
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !alasanBatal.trim()}
                      className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl"
                    >
                      {actionLoading ? "Memproses..." : "Ya, Batalkan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Jadwal Ulang */}
          {rescheduleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Jadwalkan Ulang Janji
                </h3>
                <p className="text-xs text-[#5A6B78] mb-4">
                  Pilih tanggal dan slot jam kosong baru untuk pasien {pasienData?.nama}.
                </p>

                <form onSubmit={handleSimpanJadwalUlang} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Tanggal Baru <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newTanggal}
                      onChange={(e) => setNewTanggal(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Pilih Slot Jam Kosong <span className="text-red-500">*</span>
                    </label>
                    {slotsLoading ? (
                      <div className="py-2 text-xs text-[#5A6B78] flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Mengecek slot...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                        Tidak ada slot tersedia pada tanggal ini.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 pt-1 max-h-36 overflow-y-auto">
                        {availableSlots.map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setNewJam(s)}
                            className={`py-1.5 px-2 text-xs font-semibold rounded-lg border tabular-nums ${
                              newJam === s
                                ? "bg-[#0E7490] text-white border-[#0E7490]"
                                : "bg-white text-gray-700 border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setRescheduleModalOpen(false)}
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !newJam}
                      className="py-2.5 px-3 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold text-xs rounded-xl"
                    >
                      {actionLoading ? "Menyimpan..." : "Simpan Jadwal"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </RouteGuard>
  );
}

export default function RincianJanjiResepsionisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F7F9]"><Loader2 className="w-8 h-8 text-[#0E7490] animate-spin" /></div>}>
      <RincianJanjiResepsionisContent />
    </Suspense>
  );
}
