"use client";

import { useAuth, useClerk } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OAuthNativeCallbackPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { handleRedirectCallback } = useClerk();

  // Zaten giriş yapmışsa direkt Ana Sayfaya
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  // Arka planda sessizce doğrulama işlemini yap
  useEffect(() => {
    const processParams = async () => {
      if (isSignedIn) return;
      
      const params = new URLSearchParams(window.location.search);
      if (!params.get('code')) return;

      try {
        await handleRedirectCallback({
           redirectUrl: "https://recipe-tan-five.vercel.app/sso-callback"
        });
        console.log("Silent verification success");
      } catch (err) {
        console.error("Silent verification error:", err);
      }
    };

    if (isLoaded) {
        processParams();
        handleComplete();
    }
  }, [handleRedirectCallback, isSignedIn, isLoaded]);

  const handleComplete = () => {
    // Sayfayı yenileyerek sunucudan güncel oturum bilgisini al
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Google Girişi Başarılı!</h1>
            <p className="text-gray-600">
              Giriş Yapılıyor...
            </p>
        </div>

      </div>
    </div>
  );
}