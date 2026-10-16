"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Settings,
  PlusCircle,
  Clock,
  Tag,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Save,
} from "lucide-react";

export default function KelolaLayananPage() {
  const [layananList, setLayananList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [nama, setNama] = useState("");
  const [durasiMenit, setDurasiMenit] = useState(30);
  const [harga, setHarga] = useState("");
  const [aktif, setAktif] = useState(true);

  const fetchLayanan = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const snap = await getDocs(collection(db, "layanan"));
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      list.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      setLayananList(list);
    } catch (err) {
      console.error("Gagal memuat layanan:", err);
      setErrorMsg("Gagal memuat daftar layanan klinik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayanan();
  }, []);

  const handleTambahLayanan = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const durasi = Number(durasiMenit);
    const hargaNum = Number(harga);

    if (!nama.trim() || !durasi || isNaN(hargaNum)) {
      setErrorMsg("Semua kolom bertanda bintang wajib diisi.");
      return;
    }

    if (durasi % 30 !== 0 || durasi <= 0) {
      setErrorMsg("Durasi harus berupa kelipatan 30 menit (contoh: 30, 60, 90).");
      return;
    }

    try {
      setIsAdding(true);
      await addDoc(collection(db, "layanan"), {
        nama: nama.trim(),
        durasiMenit: durasi,
        harga: hargaNum,
        aktif: aktif,
        dibuatPada: serverTimestamp(),
      });

      setModalOpen(false);
      setNama("");
      setDurasiMenit(30);
      setHarga("");
      setAktif(true);
      await fetchLayanan();
    } catch (err) {
      console.error("Gagal menambah layanan:", err);
      setErrorMsg("Gagal menyimpan layanan baru.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleAktif = async (item) => {
    try {
      const lRef = doc(db, "layanan", item.id);
      await updateDoc(lRef, {
        aktif: !item.aktif,
      });
      await fetchLayanan();
    } catch (err) {
      console.error("Gagal update status layanan:", err);
      setErrorMsg("Gagal memperbarui status layanan. Coba lagi.");
    }
  };

  return (
    <RouteGuard allowedRoles={["super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kelola Layanan Klinik</h1>
              <p className="text-xs text-[#5A6B78]">
                Atur tarif, durasi menit (kelipatan 30), dan ketersediaan layanan pemeriksaan
              </p>
            </div>

            <button
              onClick={() => {
                setErrorMsg("");
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Layanan Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat data layanan...</p>
              </div>
            )}

            {errorMsg && !loading && (
              <div className="p-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {errorMsg}
                </div>
              </div>
            )}

            {!loading && !errorMsg && layananList.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Belum ada layanan klinik</h3>
                <p className="text-xs text-[#5A6B78] mt-1 mb-4">
                  Tambahkan layanan baru atau inisialisasi seed data dari Dasbor Admin.
                </p>
              </div>
            )}

            {!loading && !errorMsg && layananList.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Nama Layanan</th>
                      <th className="px-6 py-3.5">Durasi Waktu</th>
                      <th className="px-6 py-3.5">Tarif / Harga</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {layananList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {item.nama}
                        </td>
                        <td className="px-6 py-4 tabular-nums font-medium text-gray-700">
                          {item.durasiMenit} Menit
                        </td>
                        <td className="px-6 py-4 tabular-nums font-bold text-gray-900">
                          Rp {Number(item.harga).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4">
                          {item.aktif ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleAktif(item)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              item.aktif
                                ? "text-amber-700 hover:bg-amber-50 border border-amber-200"
                                : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            }`}
                          >
                            {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Tambah Layanan */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Tambah Layanan Baru
                </h3>
                <p className="text-xs text-[#5A6B78] mb-4">
                  Durasi harus kelipatan 30 menit. Layanan aktif dapat dipilih oleh pasien saat buat janji.
                </p>

                {errorMsg && (
                  <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleTambahLayanan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Nama Layanan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Cabut Gigi Geraham"
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                        Durasi (Menit) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={durasiMenit}
                        onChange={(e) => setDurasiMenit(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] font-medium tabular-nums"
                      >
                        <option value={30}>30 Menit</option>
                        <option value={60}>60 Menit</option>
                        <option value={90}>90 Menit</option>
                        <option value={120}>120 Menit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                        Harga (Rp) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={harga}
                        onChange={(e) => setHarga(e.target.value)}
                        placeholder="250000"
                        required
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="layananAktif"
                      checked={aktif}
                      onChange={(e) => setAktif(e.target.checked)}
                      className="rounded text-[#0E7490] focus:ring-[#0E7490] w-4 h-4"
                    />
                    <label htmlFor="layananAktif" className="text-xs font-medium text-gray-700">
                      Aktifkan layanan ini sekarang
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      disabled={isAdding}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="py-2.5 px-3 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold text-xs rounded-xl"
                    >
                      {isAdding ? "Menyimpan..." : "Simpan Layanan"}
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
