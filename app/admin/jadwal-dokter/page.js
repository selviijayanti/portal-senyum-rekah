"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Clock,
  PlusCircle,
  Calendar,
  Stethoscope,
  Trash2,
  AlertCircle,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function KelolaJadwalDokterPage() {
  const [dokterList, setDokterList] = useState([]);
  const [selectedDokterId, setSelectedDokterId] = useState("");
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states tambah hari
  const [modalOpen, setModalOpen] = useState(false);
  const [hari, setHari] = useState("senin");
  const [jamMulai, setJamMulai] = useState("09:00");
  const [jamSelesai, setJamSelesai] = useState("15:00");

  // State konfirmasi hapus jadwal
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDokterAndJadwal = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Ambil Dokter
      const dokSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "dokter"))
      );
      const dList = [];
      dokSnap.forEach((d) => dList.push({ id: d.id, ...d.data() }));

      if (dList.length === 0) {
        const defaultDoc = [
          { id: "dokter_bima", nama: "drg. Bima" },
          { id: "dokter_sinta", nama: "drg. Sinta" },
        ];
        setDokterList(defaultDoc);
        if (!selectedDokterId) setSelectedDokterId(defaultDoc[0].id);
      } else {
        setDokterList(dList);
        if (!selectedDokterId) setSelectedDokterId(dList[0].id);
      }

      // 2. Ambil Jadwal
      const jadSnap = await getDocs(collection(db, "jadwal_dokter"));
      const jList = [];
      jadSnap.forEach((d) => jList.push({ id: d.id, ...d.data() }));
      setJadwalList(jList);
    } catch (err) {
      console.error("Gagal memuat jadwal:", err);
      setErrorMsg("Gagal memuat jadwal dokter.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDokterAndJadwal();
  }, []);

  const currentDokterJadwal = jadwalList.filter(
    (j) => j.dokterId === selectedDokterId
  );

  const handleTambahJadwal = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedDokterId || !hari || !jamMulai || !jamSelesai) {
      setErrorMsg("Semua kolom jadwal wajib diisi.");
      return;
    }

    if (jamSelesai <= jamMulai) {
      setErrorMsg("Jam selesai harus setelah jam mulai.");
      return;
    }

    // Cek apakah dokter sudah memiliki jadwal pada hari itu
    const exists = currentDokterJadwal.some(
      (j) => j.hari?.toLowerCase() === hari.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`Dokter ini sudah memiliki jadwal pada hari ${hari}. Hapus jadwal sebelumnya jika ingin mengubah.`);
      return;
    }

    try {
      setActionLoading(true);
      await addDoc(collection(db, "jadwal_dokter"), {
        dokterId: selectedDokterId,
        hari: hari.toLowerCase(),
        jamMulai,
        jamSelesai,
        dibuatPada: serverTimestamp(),
      });

      setSuccessMsg(`Jadwal hari ${hari} berhasil ditambahkan!`);
      setModalOpen(false);
      await fetchDokterAndJadwal();
    } catch (err) {
      console.error("Gagal menyimpan jadwal:", err);
      setErrorMsg("Gagal menyimpan jadwal dokter.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHapusJadwal = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "jadwal_dokter", deleteId));
      setDeleteId(null);
      setSuccessMsg("Jadwal berhasil dihapus.");
      await fetchDokterAndJadwal();
    } catch (err) {
      console.error("Gagal menghapus jadwal:", err);
      setErrorMsg("Gagal menghapus jadwal. Coba lagi.");
      setDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <RouteGuard allowedRoles={["super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Jadwal Praktik Dokter</h1>
              <p className="text-xs text-[#5A6B78]">
                Atur hari praktik (Senin-Sabtu) serta jam mulai dan jam selesai untuk tiap dokter
              </p>
            </div>

            <button
              onClick={() => {
                setErrorMsg("");
                setSuccessMsg("");
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Hari Praktik
            </button>
          </div>

          {/* Pilih Dokter Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase text-gray-700">Pilih Dokter:</span>
            <div className="flex flex-wrap gap-2">
              {dokterList.map((dok) => (
                <button
                  key={dok.id}
                  onClick={() => setSelectedDokterId(dok.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    selectedDokterId === dok.id
                      ? "bg-[#0E7490] text-white border-[#0E7490] shadow-xs"
                      : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 inline mr-1" />
                  {dok.nama}
                </button>
              ))}
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tabel Jadwal Dokter Terpilih */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat jadwal dokter...</p>
              </div>
            )}

            {!loading && currentDokterJadwal.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Belum ada jadwal khusus</h3>
                <p className="text-xs text-[#5A6B78] mt-1 max-w-sm mx-auto mb-4">
                  Dokter ini saat ini memakai jadwal praktik default klinik (Senin - Sabtu, 09:00 - 15:00 WITA). Klik Tambah Hari untuk mengatur jadwal spesifik.
                </p>
              </div>
            )}

            {!loading && currentDokterJadwal.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Hari Praktik</th>
                      <th className="px-6 py-3.5">Jam Mulai</th>
                      <th className="px-6 py-3.5">Jam Selesai</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentDokterJadwal.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 capitalize">
                          {item.hari}
                        </td>
                        <td className="px-6 py-4 tabular-nums font-semibold text-gray-800">
                          {item.jamMulai} WITA
                        </td>
                        <td className="px-6 py-4 tabular-nums font-semibold text-gray-800">
                          {item.jamSelesai} WITA
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus jadwal hari ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Tambah Jadwal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Tambah Hari Praktik
                </h3>
                <p className="text-xs text-[#5A6B78] mb-4">
                  Pilih hari (Senin - Sabtu) dan rentang jam praktik.
                </p>

                <form onSubmit={handleTambahJadwal} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                      Hari Praktik <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={hari}
                      onChange={(e) => setHari(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] font-medium"
                    >
                      <option value="senin">Senin</option>
                      <option value="selasa">Selasa</option>
                      <option value="rabu">Rabu</option>
                      <option value="kamis">Kamis</option>
                      <option value="jumat">Jumat</option>
                      <option value="sabtu">Sabtu</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                        Jam Mulai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={jamMulai}
                        onChange={(e) => setJamMulai(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                        Jam Selesai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={jamSelesai}
                        onChange={(e) => setJamSelesai(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold text-xs rounded-xl"
                    >
                      {actionLoading ? "Menyimpan..." : "Simpan Jadwal"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Konfirmasi Hapus Jadwal */}
          {deleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
                <h3 className="text-base font-bold text-gray-900 mb-1">Hapus Jadwal Praktik</h3>
                <p className="text-xs text-[#5A6B78] mb-6">
                  Yakin ingin menghapus jadwal praktik ini? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteId(null)}
                    disabled={deleteLoading}
                    className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleHapusJadwal}
                    disabled={deleteLoading}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl"
                  >
                    {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
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
