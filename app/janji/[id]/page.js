"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Calendar,
  Clock,
  Stethoscope,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Trash2,
  FileText,
  User,
  CheckCircle2,
} from "lucide-react";

function RincianJanjiPasienContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [janji, setJanji] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchJanjiDetail = async () => {
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

      // Penjagaan: Bila ID diganti dengan janji orang lain dan bukan super_admin
      const isOwner = data.pasienId === user.uid;
      const isSuperAdmin = userProfile?.role === "super_admin";

      if (!isOwner && !isSuperAdmin) {
        setErrorMsg("Janji tidak ditemukan.");
        setLoading(false);
        return;
      }

      // Ambil dokter dan layanan info
      let dokterNama = "Dokter Gigi";
      let layananNama = "Layanan Klinik";

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
          if (lSnap.exists()) layananNama = lSnap.data().nama;
        } catch (e) {
          console.warn(e);
        }
      }

      setJanji({
        id: janjiSnap.id,
        ...data,
        dokterNama,
        layananNama,
      });
    } catch (err) {
      console.error("Gagal memuat rincian janji:", err);
      setErrorMsg("Gagal memuat rincian janji temu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJanjiDetail();
  }, [id, user, userProfile]);

  // Validasi apakah boleh dibatalkan oleh pasien (H-1 dan status menunggu / dikonfirmasi)
  const canCancel = () => {
    if (!janji) return false;
    if (janji.status !== "menunggu" && janji.status !== "dikonfirmasi") return false;

    // Cek batas H-1
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentDate = new Date(janji.tanggal + "T00:00:00");
    const diffTime = appointmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Pada hari janji (diffDays <= 0) atau lewat, tombol batal tidak tampil
    return diffDays >= 1;
  };

  const handleBatalkanJanji = async () => {
    if (!janji) return;
    setIsCancelling(true);

    try {
      // 1. Update status janji_temu menjadi dibatalkan
      const janjiRef = doc(db, "janji_temu", janji.id);
      await updateDoc(janjiRef, {
        status: "dibatalkan",
        alasanBatal: "Dibatalkan oleh pasien",
      });

      // 2. Hapus slot_terisi agar slot kembali kosong
      try {
        const slotRef = doc(db, "slot_terisi", janji.id);
        await deleteDoc(slotRef);
      } catch (errSlot) {
        console.warn("Hapus slot terisi:", errSlot);
      }

      setConfirmModalOpen(false);
      // Muat ulang data terbaru
      await fetchJanjiDetail();
    } catch (err) {
      console.error("Gagal membatalkan janji:", err);
      alert("Gagal membatalkan janji. Coba lagi.");
    } finally {
      setIsCancelling(false);
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

  return (
    <RouteGuard allowedRoles={["pasien", "super_admin"]}>
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/janji"
              className="p-2 rounded-xl bg-white border border-slate-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rincian Janji Temu</h1>
              <p className="text-xs text-[#5A6B78]">
                ID Janji: <span className="font-mono text-gray-700">{id}</span>
              </p>
            </div>
          </div>

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#5A6B78]">Memuat rincian janji...</p>
            </div>
          )}

          {errorMsg && !loading && (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{errorMsg}</h3>
              <p className="text-xs text-[#5A6B78] mb-5">
                Data janji yang diminta tidak ditemukan atau Anda tidak memiliki hak untuk melihatnya.
              </p>
              <Link
                href="/janji"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E7490] text-white text-xs font-semibold rounded-xl"
              >
                Kembali ke Daftar Janji
              </Link>
            </div>
          )}

          {!loading && !errorMsg && janji && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header Status */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs text-[#5A6B78] uppercase font-semibold">Status Janji</span>
                  <div className="mt-1">{getStatusBadge(janji.status)}</div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#5A6B78] uppercase font-semibold">Waktu Praktik</span>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">
                    {janji.jam} WITA
                  </p>
                </div>
              </div>

              {/* Data Janji Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-semibold text-[#5A6B78] uppercase">Layanan Klinik</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{janji.layananNama}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-semibold text-[#5A6B78] uppercase">Dokter Pemeriksa</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{janji.dokterNama}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-semibold text-[#5A6B78] uppercase">Tanggal Periksa</span>
                  <p className="text-sm font-bold text-gray-900 mt-1 tabular-nums">{janji.tanggal}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-semibold text-[#5A6B78] uppercase">Slot Jam</span>
                  <p className="text-sm font-bold text-gray-900 mt-1 tabular-nums">{janji.jam} WITA</p>
                </div>
              </div>

              {/* Keluhan Pasien */}
              <div>
                <span className="text-xs font-semibold text-[#5A6B78] uppercase">Keluhan Pasien</span>
                <div className="mt-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-gray-800">
                  {janji.keluhan || "-"}
                </div>
              </div>

              {/* Alasan Batal jika ada */}
              {janji.status === "dibatalkan" && janji.alasanBatal && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <span className="font-bold">Alasan Pembatalan: </span>
                  {janji.alasanBatal}
                </div>
              )}

              {/* Tombol Batalkan Janji (Hanya jika memenuhi syarat H-1) */}
              {canCancel() && (
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-xl border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Batalkan Janji Temu
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modal Konfirmasi Pembatalan */}
          {confirmModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Batalkan Janji Temu?
                </h3>
                <p className="text-xs text-[#5A6B78] mb-6">
                  Apakah Anda yakin ingin membatalkan janji temu ini? Slot jam yang telah Anda pilih akan kembali tersedia untuk pasien lain.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConfirmModalOpen(false)}
                    disabled={isCancelling}
                    className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleBatalkanJanji}
                    disabled={isCancelling}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Ya, Batalkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </RouteGuard>
  );
}

export default function RincianJanjiPasienPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F7F9]"><Loader2 className="w-8 h-8 text-[#0E7490] animate-spin" /></div>}>
      <RincianJanjiPasienContent />
    </Suspense>
  );
}
