"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  Users,
  Search,
  Mail,
  Shield,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function KelolaPenggunaPage() {
  const router = useRouter();

  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const snap = await getDocs(collection(db, "users"));
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      list.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      setUsersList(list);
    } catch (err) {
      console.error("Gagal memuat pengguna:", err);
      setErrorMsg("Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = usersList.filter(
    (u) =>
      (u.nama || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case "super_admin":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-[#0E7490] border border-cyan-300">Super Admin</span>;
      case "resepsionis":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Resepsionis</span>;
      case "dokter":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">Dokter</span>;
      case "pasien":
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Pasien</span>;
    }
  };

  return (
    <RouteGuard allowedRoles={["super_admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kelola Pengguna & Peran</h1>
              <p className="text-xs text-[#5A6B78]">
                Kelola hak akses peran (pasien, resepsionis, dokter, super_admin) dan status akun
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pengguna berdasarkan nama, email, peran..."
                className="w-full px-3.5 py-2 pl-9 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <span className="text-xs text-[#5A6B78] font-medium tabular-nums shrink-0">
              Total: <span className="font-bold text-gray-900">{filtered.length}</span> Pengguna
            </span>
          </div>

          {/* Tabel Pengguna */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0E7490]" />
                <p className="text-sm">Memuat data pengguna...</p>
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
                <h3 className="text-sm font-semibold text-gray-800">Tidak ada pengguna cocok</h3>
                <p className="text-xs text-[#5A6B78] mt-1">
                  Tidak ditemukan pengguna dengan pencarian &quot;{searchTerm}&quot;.
                </p>
              </div>
            )}

            {!loading && !errorMsg && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Nama</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Peran (Role)</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/admin/pengguna/${item.id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {item.nama || "Pengguna"}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">
                          {item.email}
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(item.role)}
                        </td>
                        <td className="px-6 py-4">
                          {item.aktif !== false ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E7490] hover:underline">
                            Ubah Peran
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
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
