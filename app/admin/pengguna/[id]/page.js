"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  User,
  Mail,
  Shield,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Save,
  Ban,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";

function DetailPenggunaAdminContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [userData, setUserData] = useState(null);
  const [selectedRole, setSelectedRole] = useState("pasien");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isSelf = user?.uid === id;

  const fetchUser = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const uRef = doc(db, "users", id);
      const uSnap = await getDoc(uRef);

      if (!uSnap.exists()) {
        setErrorMsg("Pengguna tidak ditemukan.");
        setLoading(false);
        return;
      }

      const data = uSnap.data();
      setUserData(data);
      setSelectedRole(data.role || "pasien");
    } catch (err) {
      console.error("Gagal memuat pengguna:", err);
      setErrorMsg("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  // Simpan Perubahan Peran
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (isSelf && selectedRole !== "super_admin") {
      setErrorMsg("Anda tidak bisa menurunkan peran akun Anda sendiri.");
      return;
    }

    const validRoles = ["pasien", "resepsionis", "dokter", "super_admin"];
    if (!validRoles.includes(selectedRole)) {
      setErrorMsg("Peran tidak valid.");
      return;
    }

    try {
      setActionLoading(true);
      const uRef = doc(db, "users", id);
      await updateDoc(uRef, {
        role: selectedRole,
      });

      setSuccessMsg(`Peran berhasil diubah menjadi ${selectedRole}!`);
      await fetchUser();
    } catch (err) {
      console.error("Gagal mengubah peran:", err);
      setErrorMsg("Gagal menyimpan peran baru.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleAktif = async () => {
    if (!userData) return;
    setSuccessMsg("");
    setErrorMsg("");

    if (isSelf) {
      setErrorMsg("Anda tidak bisa menonaktifkan akun Anda sendiri.");
      return;
    }

    const currentStatus = userData.aktif !== false;
    const newStatus = !currentStatus;

    try {
      setActionLoading(true);
      const uRef = doc(db, "users", id);
      await updateDoc(uRef, {
        aktif: newStatus,
      });

      setSuccessMsg(`Status akun berhasil diubah menjadi ${newStatus ? "Aktif" : "Nonaktif"}!`);
      await fetchUser();
    } catch (err) {
      console.error("Gagal mengubah status aktif:", err);
      setErrorMsg("Gagal memperbarui status akun.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <RouteGuard allowedRoles={["super_admin"]}>
      <AppLayout>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/pengguna"
              className="p-2 rounded-xl bg-white border border-slate-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ubah Peran Pengguna</h1>
              <p className="text-xs text-[#5A6B78]">
                ID: <span className="font-mono text-gray-700">{id}</span>
              </p>
            </div>
          </div>

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#5A6B78]">Memuat data akun pengguna...</p>
            </div>
          )}

          {errorMsg && !loading && !userData && (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-900 mb-1">{errorMsg}</h3>
            </div>
          )}

          {!loading && userData && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Data Akun Profil */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5A6B78] uppercase font-semibold">Nama Pengguna</span>
                  <span className="text-sm font-bold text-gray-900">{userData.nama}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5A6B78] uppercase font-semibold">Alamat Email</span>
                  <span className="text-sm font-medium text-gray-800">{userData.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5A6B78] uppercase font-semibold">Nomor WhatsApp</span>
                  <span className="text-sm font-semibold text-gray-800 tabular-nums">{userData.noHp || "-"}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs text-[#5A6B78] uppercase font-semibold">Status Akun</span>
                  <span className={`text-xs font-bold ${userData.aktif !== false ? "text-emerald-600" : "text-red-600"}`}>
                    {userData.aktif !== false ? "AKTIF" : "NONAKTIF"}
                  </span>
                </div>
              </div>

              {/* Form Ubah Peran */}
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                    Pilih Peran Pengguna (Role)
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={isSelf}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] font-medium"
                  >
                    <option value="pasien">Pasien (Akses Beranda & Janji Mandiri)</option>
                    <option value="resepsionis">Resepsionis (Akses Kelola Janji & Data Kontak)</option>
                    <option value="dokter">Dokter (Akses Dasbor Pemeriksaan Medis)</option>
                    <option value="super_admin">Super Admin (Akses Penuh Seluruh Sistem)</option>
                  </select>
                  {isSelf && (
                    <p className="mt-1 text-[11px] text-amber-600">
                      Anda tidak dapat menurunkan peran akun Super Admin Anda sendiri.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || isSelf}
                  className="w-full py-2.5 px-4 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Peran Pengguna
                </button>
              </form>

              {/* Tindakan Nonaktifkan / Aktifkan Akun */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Status Keaktifan Akun</h4>
                  <p className="text-[11px] text-[#5A6B78]">
                    {userData.aktif !== false
                      ? "Akun saat ini aktif. Nonaktifkan untuk memblokir akses ke aplikasi."
                      : "Akun saat ini nonaktif. Aktifkan kembali untuk memberi akses masuk."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAktif}
                  disabled={actionLoading || isSelf}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors shrink-0 ${
                    userData.aktif !== false
                      ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                  } disabled:opacity-50`}
                >
                  {userData.aktif !== false ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                </button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </RouteGuard>
  );
}

export default function DetailPenggunaAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F7F9]"><Loader2 className="w-8 h-8 text-[#0E7490] animate-spin" /></div>}>
      <DetailPenggunaAdminContent />
    </Suspense>
  );
}
