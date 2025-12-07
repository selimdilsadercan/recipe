"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";

export default function Page() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace("/home");
      } else {
        router.replace("/sign-in");
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Loading durumu
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-[#FF6B35] rounded-full"></div>
      </div>
    </div>
  );
}
