"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  AlertCircle,
  Loader2,
  User,
  Activity,
} from "lucide-react";

function RiwayatPasienDokterContent() {
  const { id } = useParams(); // pasienId
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [pasienData, setPasienData] = useState(null);
  const [catatanList, setCatatanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const isSuperAdmin = userProfile?.role === "super_admin";

  const fetchPasienHistory = async () => {
    if (!id || !user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Ambil data profil pasien
      const pSnap = await getDoc(doc(db, "users", id));
      if (!pSnap.exists()) {
        setErrorMsg("Pasien tidak ditemukan.");
        setLoading(false);
        return;
      }
      setPasienData(pSnap.data());

      // 2. Ambil catatan perawatan pasien yang PERNAH ditulis oleh dokter ini
      const catQuery = query(
        collection(db, "catatan_perawatan"),
        where("pasienId", "==", id)
      );

      const catSnap = await getDocs(catQuery);
      const rawCatatan = [];

      catSnap.forEach((d) => {
        const data = d.data();
        const writtenByMe =
          isSuperAdmin ||
          data.dokterId === user.uid ||
          (user.email?.includes("bima") && data.dokterId === "dokter_bima") ||
          (user.email?.includes("sinta") && data.dokterId === "dokter_sinta");

        if (writtenByMe) {
          rawCatatan.push({ id: d.id, ...data });
        }
      });

      // Validasi PRD 4.11: Bila ID diganti dengan pasien yang belum pernah ia tangani, tampil "Pasien tidak ditemukan"
      if (rawCatatan.length === 0 && !isSuperAdmin) {
        setErrorMsg("Pasien tidak ditemukan.");
        setLoading(false);
        return;
      }

      // Ambil tanggal & layanan dari janji temu terkait
      const enriched = await Promise.all(
        rawCatatan.map(async (item) => {
          let tanggal = "-";
          let layananNama = "Layanan Klinik";

          if (item.janjiId) {
            try {
              const jSnap = await getDoc(doc(db, "janji_temu", item.janjiId));
              if (jSnap.exists()) {
                const jData = jSnap.data();
                tanggal = jData.tanggal || "-";
                if (jData.layananId) {
                  const lSnap = await getDoc(doc(db, "layanan", jData.layananId));
                  if (lSnap.exists()) layananNama = lSnap.data().nama;
                }
              }
            } catch (e) {
              console.warn(e);
            }
          }

          return { ...item, tanggal, layananNama };
        })
      );

      // Urutkan dari tanggal terbaru
      enriched.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      setCatatanList(enriched);
    } catch (err) {
      console.error("Gagal memuat riwayat pasien:", err);
      setErrorMsg("Gagal memuat catatan riwayat pasien.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasienHistory();
  }, [id, user, userProfile]);

  return (
    <RouteGuard allowedRoles={["dokter", "super_admin"]}>
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-white border border-slate-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Riwayat Perawatan Pasien</h1>
              <p className="text-xs text-[#5A6B78]">
                Catatan medis sebelumnya yang pernah Anda tangani untuk pasien ini
              </p>
            </div>
          </div>

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#5A6B78]">Memuat riwayat pasien...</p>
            </div>
          )}

          {errorMsg && !loading && (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-900 mb-1">{errorMsg}</h3>
              <p className="text-xs text-[#5A6B78] mb-4">
                Pasien belum pernah Anda tangani atau data tidak ditemukan.
              </p>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E7490] text-white text-xs font-semibold rounded-xl"
              >
                Kembali
              </button>
            </div>
          )}

          {!loading && !errorMsg && pasienData && (
            <div className="space-y-6">
              {/* Info Pasien */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-50 text-[#0E7490] flex items-center justify-center font-bold text-lg">
                  {pasienData.nama?.charAt(0) || "P"}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{pasienData.nama}</h2>
                  <p className="text-xs text-[#5A6B78]">
                    Email: {pasienData.email} • No HP: {pasienData.noHp || "-"}
                  </p>
                </div>
              </div>

              {/* Riwayat Catatan */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {catatanList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    Belum ada riwayat catatan perawatan terdahulu.
                  </div>
                ) : (
                  catatanList.map((item) => (
                    <div key={item.id} className="p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">{item.layananNama}</span>
                        <span className="text-xs font-semibold text-gray-600 bg-slate-100 px-2.5 py-1 rounded-lg tabular-nums">
                          {item.tanggal}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                          <span className="font-bold text-gray-700 block mb-1">Tindakan Medis:</span>
                          <p className="text-gray-900 font-medium">{item.tindakan}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                          <span className="font-bold text-gray-700 block mb-1">Catatan Dokter:</span>
                          <p className="text-gray-900">{item.catatan}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </RouteGuard>
  );
}

export default function RiwayatPasienDokterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F7F9]"><Loader2 className="w-8 h-8 text-[#0E7490] animate-spin" /></div>}>
      <RiwayatPasienDokterContent />
    </Suspense>
  );
}
