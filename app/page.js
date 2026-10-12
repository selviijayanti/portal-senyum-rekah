"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute } from "@/components/RouteGuard";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && userProfile) {
        router.replace(getDefaultRoute(userProfile.role));
      } else {
        router.replace("/masuk");
      }
    }
  }, [loading, user, userProfile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9]">
      <Loader2 className="w-8 h-8 text-[#0E7490] animate-spin" />
    </div>
  );
}
