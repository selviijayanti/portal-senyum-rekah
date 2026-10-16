"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute } from "@/components/RouteGuard";
import { Activity, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function MasukPage() {
  const router = useRouter();
  const { user, userProfile, loading, loginWithEmail, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset status submitting dan tangani BFCache browser (misal user klik tombol Back)
  useEffect(() => {
    setIsSubmitting(false);

    const handlePageShow = () => {
      setIsSubmitting(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Jika sudah masuk dan profil terbaca, arahkan ke halamannya langsung
  useEffect(() => {
    if (!loading && user && userProfile) {
      if (userProfile.aktif === false) {
        setErrorMsg("Akun Anda dinonaktifkan. Hubungi klinik.");
        setIsSubmitting(false);
        return;
      }
      const target = getDefaultRoute(userProfile.role);
      router.replace(target);
    }
  }, [loading, user, userProfile, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Email dan kata sandi wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { profile } = await loginWithEmail(email, password);
      if (profile && profile.aktif === false) {
        setErrorMsg("Akun Anda dinonaktifkan. Hubungi klinik.");
        setIsSubmitting(false);
        return;
      }
      const target = getDefaultRoute(profile?.role || "pasien");
      router.replace(target);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setErrorMsg("Email atau kata sandi tidak cocok. Silakan coba lagi.");
      } else {
        setErrorMsg("Gagal masuk. Periksa kembali koneksi atau data login Anda.");
      }
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    try {
      setIsSubmitting(true);
      const { profile } = await loginWithGoogle();
      if (profile && profile.aktif === false) {
        setErrorMsg("Akun Anda dinonaktifkan. Hubungi klinik.");
        setIsSubmitting(false);
        return;
      }
      const target = getDefaultRoute(profile?.role || "pasien");
      router.replace(target);
    } catch (err) {
      console.error(err);
      setErrorMsg("Masuk dengan akun Google dibatalkan atau gagal.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9]">
        <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F4F7F9]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0E7490] text-white shadow-md mb-4">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Masuk ke Senyum Rekah
        </h2>
        <p className="mt-1 text-sm text-[#5A6B78]">
          Portal Janji Temu dan Catatan Perawatan Klinik Gigi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl sm:px-10 border border-slate-200">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full px-3.5 py-2.5 pl-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] focus:border-transparent"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Kata Sandi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490] focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-gray-600 transition-colors focus:outline-none"
                  title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-[#0E7490] hover:bg-[#155E75] text-white font-medium rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sedang Masuk...
                </>
              ) : (
                "Masuk Sekarang"
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-[#5A6B78] font-medium">atau masuk dengan</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-sm font-medium text-gray-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Masuk dengan Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-[#5A6B78]">
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-semibold text-[#0E7490] hover:underline">
              Daftar sebagai pasien
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
