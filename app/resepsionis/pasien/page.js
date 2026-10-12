"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Users,
  Search,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  User,
} from "lucide-react";

export default function DataPasienPage() {
  const [pasienList, setPasienList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPasien = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // Ambil user yang berperan pasien
      const q = query(
        collection(db, "users"),
        where("role", "==", "pasien")
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      // Urutkan nama abjad
      list.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      setPasienList(list);
    } catch (err) {
      console.error("Gagal memuat data pasien:", err);
      setErrorMsg("Gagal memuat data pasien.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasien();
  }, []);

  const filtered = pasienList.filter((p) =>
    (p.nama || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.noHp || "").includes(searchTerm)
  );

  return (
    <RouteGuard allowedRoles={["resepsionis", "super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Data Kontak Pasien</h1>
              <p className="text-xs text-[#5A6B78]">
                Daftar kontak telepon dan email pasien terdaftar di Klinik Senyum Rekah
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama, email, atau nomor HP..."
                className="w-full px-3.5 py-2 pl-9 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <span className="text-xs text-[#5A6B78] font-medium tabular-nums shrink-0">
              Total: <span className="font-bold text-gray-900">{filtered.length}</span> Pasien
            </span>
          </div>

          {/* Tabel Pasien */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat data pasien...</p>
              </div>
            )}

            {errorMsg && !loading && (
              <div className="p-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {errorMsg}
                </div>
              </div>
            )}

            {!loading && !errorMsg && filtered.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Tidak ada pasien ditemukan</h3>
                <p className="text-xs text-[#5A6B78] mt-1">
                  Tidak ditemukan pasien dengan kata kunci &quot;{searchTerm}&quot;.
                </p>
              </div>
            )}

            {!loading && !errorMsg && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Nama Pasien</th>
                      <th className="px-6 py-3.5">Alamat Email</th>
                      <th className="px-6 py-3.5">Nomor HP (WhatsApp)</th>
                      <th className="px-6 py-3.5">Status Akun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                              {item.nama?.charAt(0) || "P"}
                            </div>
                            <span>{item.nama}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800 tabular-nums">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{item.noHp || "-"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.aktif !== false ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Nonaktif
                            </span>
                          )}
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
