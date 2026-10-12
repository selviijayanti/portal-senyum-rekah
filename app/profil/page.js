"use client";

import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import AppLayout from "@/components/AppLayout";
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ProfilPage() {
  const { user, userProfile, refreshUserProfile } = useAuth();

  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (userProfile) {
      setNama(userProfile.nama || "");
      setNoHp(userProfile.noHp || "");
    }
  }, [userProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!nama.trim()) {
      setErrorMsg("Nama tidak boleh kosong.");
      return;
    }

    if (noHp.trim()) {
      const phoneRegex = /^08[0-9]{8,12}$/;
      if (!phoneRegex.test(noHp.trim())) {
        setErrorMsg("Nomor HP harus berupa angka, diawali 08, dan minimal 10 digit.");
        return;
      }
    }

    try {
      setIsSaving(true);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        nama: nama.trim(),
        noHp: noHp.trim(),
      });

      await refreshUserProfile();
      setSuccessMsg("Profil berhasil diperbarui!");
    } catch (err) {
      console.error("Gagal memperbarui profil:", err);
      setErrorMsg("Gagal menyimpan perubahan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "super_admin":
        return "Super Admin (Pemilik Klinik)";
      case "resepsionis":
        return "Resepsionis";
      case "dokter":
        return "Dokter Gigi";
      case "pasien":
      default:
        return "Pasien";
    }
  };

  return (
    <RouteGuard allowedRoles={["pasien", "resepsionis", "dokter", "super_admin"]}>
      <AppLayout>
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>
            <p className="text-xs text-[#5A6B78]">
              Kelola informasi identitas akun Anda di Portal Senyum Rekah
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {successMsg && (
              <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 pl-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Nomor HP (WhatsApp)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 pl-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] tabular-nums"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="mt-1 text-[11px] text-[#5A6B78]">
                  Format 08xxxxxxxxxx (hanya angka).
                </p>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Alamat Email (Tidak dapat diubah)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={userProfile?.email || user?.email || ""}
                    disabled
                    className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-100 border border-slate-200 text-gray-500 rounded-xl cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Peran (Readonly) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Peran Pengguna (Dikelola oleh Super Admin)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={getRoleLabel(userProfile?.role)}
                    disabled
                    className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-100 border border-slate-200 text-gray-500 rounded-xl cursor-not-allowed font-medium"
                  />
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 bg-[#0E7490] hover:bg-[#155E75] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan Perubahan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  );
}
