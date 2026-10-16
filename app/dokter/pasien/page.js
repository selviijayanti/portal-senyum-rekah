"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Users,
  Search,
  AlertCircle,
  Loader2,
  FileText,
  ChevronRight,
  User,
} from "lucide-react";

export default function DokterPasienPage() {
  const { user, userProfile } = useAuth();

  const [pasienList, setPasienList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  const isSuperAdmin = userProfile?.role === "super_admin";

  const fetchPasienTertangani = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const catSnap = await getDocs(collection(db, "catatan_perawatan"));

      // Kumpulkan pasienId unik
      const pasienIdSet = new Set();
      catSnap.forEach((d) => {
        const data = d.data();
        const writtenByMe =
          isSuperAdmin ||
          data.dokterId === user.uid ||
          (userProfile?.nama?.toLowerCase().includes("bima") && data.dokterId === "dokter_bima") ||
          (userProfile?.nama?.toLowerCase().includes("sinta") && data.dokterId === "dokter_sinta") ||
          (user?.email?.toLowerCase().includes("bima") && data.dokterId === "dokter_bima") ||
          (user?.email?.toLowerCase().includes("sinta") && data.dokterId === "dokter_sinta");

        if (writtenByMe && data.pasienId) {
          pasienIdSet.add(data.pasienId);
        }
      });

      if (pasienIdSet.size === 0) {
        setPasienList([]);
        setLoading(false);
        return;
      }

      // Ambil data profil tiap pasien
      const pasienData = await Promise.all(
        Array.from(pasienIdSet).map(async (pid) => {
          try {
            const pSnap = await getDoc(doc(db, "users", pid));
            if (pSnap.exists()) {
              return { id: pid, ...pSnap.data() };
            }
            return { id: pid, nama: "Pasien Tidak Dikenal", email: "-", noHp: "-" };
          } catch {
            return { id: pid, nama: "Pasien Tidak Dikenal", email: "-", noHp: "-" };
          }
        })
      );

      pasienData.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      setPasienList(pasienData);
    } catch (err) {
      console.error("Gagal memuat data pasien tertangani:", err);
      setErrorMsg("Gagal memuat daftar pasien. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasienTertangani();
  }, [user, userProfile]);

  const filtered = pasienList.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nama?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  return (
    <RouteGuard allowedRoles={["dokter", "super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Riwayat Pasien Tertangani</h1>
              <p className="text-xs text-[#5A6B78] mt-0.5">
                Daftar pasien yang pernah Anda tangani — klik untuk melihat riwayat perawatannya.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari nama atau email pasien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat daftar pasien...</p>
              </div>
            )}

            {errorMsg && !loading && (
              <div className="p-6">
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            {!loading && !errorMsg && filtered.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {search ? "Tidak ada pasien yang cocok" : "Belum ada pasien ditangani"}
                </h3>
                <p className="text-xs text-[#5A6B78] mt-1 max-w-sm mx-auto">
                  {search
                    ? "Coba kata kunci lain."
                    : "Pasien yang pernah Anda periksa dan selesai akan muncul di sini."}
                </p>
              </div>
            )}

            {!loading && !errorMsg && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Nama Pasien</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">No. WhatsApp</th>
                      <th className="px-6 py-3.5 text-right">Riwayat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((pasien) => (
                      <tr key={pasien.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0E7490]/10 flex items-center justify-center text-[#0E7490] shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-gray-900">{pasien.nama}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{pasien.email || "-"}</td>
                        <td className="px-6 py-4 font-medium tabular-nums">{pasien.noHp || "-"}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dokter/pasien/${pasien.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Lihat Riwayat
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
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
