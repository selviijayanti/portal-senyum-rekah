"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Stethoscope,
  Clock,
  Calendar,
  User,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  CheckCircle2,
  History,
  Activity,
} from "lucide-react";

function PemeriksaanDokterContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [janji, setJanji] = useState(null);
  const [pasienData, setPasienData] = useState(null);
  const [existingCatatan, setExistingCatatan] = useState(null);

  // Form states
  const [tindakan, setTindakan] = useState("");
  const [catatan, setCatatan] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isSuperAdmin = userProfile?.role === "super_admin";

  const fetchPemeriksaanData = async () => {
    if (!id || !user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const janjiRef = doc(db, "janji_temu", id);
      const janjiSnap = await getDoc(janjiRef);

      if (!janjiSnap.exists()) {
        setErrorMsg("Janji tidak ditemukan.");
        setLoading(false);
        return;
      }

      const data = janjiSnap.data();

      // Penjagaan: hanya janji milik dokter itu (kecuali super_admin)
      const isMyAppointment =
        isSuperAdmin ||
        data.dokterId === user.uid ||
        (user.email?.includes("bima") && data.dokterId === "dokter_bima") ||
        (user.email?.includes("sinta") && data.dokterId === "dokter_sinta");

      if (!isMyAppointment) {
        setErrorMsg("Janji tidak ditemukan.");
        setLoading(false);
        return;
      }

      // Ambil data pasien
      let pData = { nama: "Pasien", email: "-", noHp: "-" };
      if (data.pasienId) {
        try {
          const pSnap = await getDoc(doc(db, "users", data.pasienId));
          if (pSnap.exists()) pData = pSnap.data();
        } catch (e) {
          console.warn(e);
        }
      }
      setPasienData(pData);

      // Ambil data layanan
      let layananNama = "Layanan Klinik";
      if (data.layananId) {
        try {
          const lSnap = await getDoc(doc(db, "layanan", data.layananId));
          if (lSnap.exists()) layananNama = lSnap.data().nama;
        } catch (e) {
          console.warn(e);
        }
      }

      // Cek apakah sudah ada catatan_perawatan
      const catQuery = query(
        collection(db, "catatan_perawatan"),
        where("janjiId", "==", id)
      );
      const catSnap = await getDocs(catQuery);
      if (!catSnap.empty) {
        const catData = catSnap.docs[0].data();
        setExistingCatatan(catData);
        setTindakan(catData.tindakan || "");
        setCatatan(catData.catatan || "");
      }

      setJanji({
        id: janjiSnap.id,
        ...data,
        layananNama,
      });
    } catch (err) {
      console.error("Gagal memuat janji:", err);
      setErrorMsg("Gagal memuat janji pemeriksaan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPemeriksaanData();
  }, [id, user, userProfile]);

  // Submit Pemeriksaan & Tandai Selesai
  const handleSubmitSelesai = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!janji || janji.status !== "hadir") {
      setErrorMsg("Hanya janji dengan status Hadir yang dapat diperiksa dan ditandai selesai.");
      return;
    }

    if (!tindakan.trim() || !catatan.trim()) {
      setErrorMsg("Tindakan medis dan catatan dokter wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Simpan ke koleksi catatan_perawatan sesuai PRD 7.1
      await addDoc(collection(db, "catatan_perawatan"), {
        janjiId: janji.id,
        pasienId: janji.pasienId,
        dokterId: janji.dokterId || user.uid,
        tindakan: tindakan.trim(),
        catatan: catatan.trim(),
        dibuatPada: serverTimestamp(),
      });

      // 2. Perbarui status janji_temu menjadi 'selesai'
      const janjiRef = doc(db, "janji_temu", janji.id);
      await updateDoc(janjiRef, {
        status: "selesai",
      });

      // 3. Hapus dari slot_terisi
      try {
        await deleteDoc(doc(db, "slot_terisi", janji.id));
      } catch (errSlot) {
        console.warn("Hapus slot:", errSlot);
      }

      // Muat ulang data
      await fetchPemeriksaanData();
    } catch (err) {
      console.error("Gagal menyimpan pemeriksaan:", err);
      setErrorMsg("Gagal menyimpan catatan pemeriksaan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RouteGuard allowedRoles={["dokter", "super_admin"]}>
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dokter"
                className="p-2 rounded-xl bg-white border border-slate-200 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pemeriksaan Pasien</h1>
                <p className="text-xs text-[#5A6B78]">
                  ID Janji: <span className="font-mono text-gray-700">{id}</span>
                </p>
              </div>
            </div>

            {janji?.pasienId && (
              <Link
                href={`/dokter/pasien/${janji.pasienId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
              >
                <History className="w-4 h-4 text-[#0E7490]" />
                Lihat Riwayat Pasien
              </Link>
            )}
          </div>

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#5A6B78]">Memuat data pemeriksaan...</p>
            </div>
          )}

          {errorMsg && !loading && !janji && (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-900 mb-1">{errorMsg}</h3>
              <p className="text-xs text-[#5A6B78] mb-4">
                Janji ini tidak ditemukan atau bukan milik jadwal periksa Anda.
              </p>
              <Link
                href="/dokter"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E7490] text-white text-xs font-semibold rounded-xl"
              >
                Kembali ke Dasbor Dokter
              </Link>
            </div>
          )}

          {!loading && janji && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[11px] font-bold text-[#5A6B78] uppercase">Nama Pasien</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{pasienData?.nama}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[11px] font-bold text-[#5A6B78] uppercase">Layanan</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{janji.layananNama}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[11px] font-bold text-[#5A6B78] uppercase">Status Janji</span>
                  <p className="text-xs font-bold text-gray-900 mt-1 uppercase tracking-wide">
                    {janji.status}
                  </p>
                </div>
              </div>

              {/* Keluhan Pasien */}
              <div>
                <span className="text-xs font-semibold text-[#5A6B78] uppercase">Keluhan Pasien:</span>
                <p className="mt-1 p-3 bg-cyan-50/60 rounded-xl border border-cyan-100 text-sm text-cyan-950 font-medium">
                  {janji.keluhan || "-"}
                </p>
              </div>

              {/* Status Selesai: Tampilkan Hasil Pemeriksaan */}
              {janji.status === "selesai" ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Pemeriksaan telah selesai ditandai dan catatan medis tersimpan.</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-gray-700 uppercase">Tindakan Medis:</span>
                      <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-gray-900 font-medium">
                        {tindakan || existingCatatan?.tindakan}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-gray-700 uppercase">Catatan / Instruksi Dokter:</span>
                      <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-gray-900">
                        {catatan || existingCatatan?.catatan}
                      </p>
                    </div>
                  </div>
                </div>
              ) : janji.status === "hadir" ? (
                /* Form Pemeriksaan Pasien Hadir */
                <form onSubmit={handleSubmitSelesai} className="space-y-4 pt-2">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 font-medium">
                    Pasien sudah hadir di klinik dan siap diperiksa. Silakan isi tindakan medis serta catatan dokter di bawah ini.
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                      Tindakan Medis yang Dilakukan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={tindakan}
                      onChange={(e) => setTindakan(e.target.value)}
                      placeholder="Contoh: Tambal gigi dengan komposit pada geraham kiri bawah..."
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                      Catatan & Instruksi Dokter <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Contoh: Hindari makanan keras selama 24 jam. Kontrol kembali bila masih terasa linu."
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-[#15A66A] hover:bg-[#128a58] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Menyimpan Catatan...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Tandai Selesai & Simpan Pemeriksaan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  Janji ini berstatus <span className="font-bold uppercase">{janji.status}</span>. Hanya janji dengan status <strong>Hadir</strong> yang dapat diperiksa oleh dokter.
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </RouteGuard>
  );
}

export default function PemeriksaanDokterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F7F9]"><Loader2 className="w-8 h-8 text-[#0E7490] animate-spin" /></div>}>
      <PemeriksaanDokterContent />
    </Suspense>
  );
}
