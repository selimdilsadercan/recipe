"use client";

import { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// This page is deployed to Vercel and acts as a bridge for OAuth.
// - For NATIVE apps (source=native): Forwards params to the app via Deep Link
// - For WEB users: Processes the callback normally with Clerk

export default function SSOCallbackPage() {
  const [isNative, setIsNative] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");
    
    if (source === "native") {
      setIsNative(true);
      
      // Remove the 'source' parameter before forwarding to avoid confusion
      params.delete("source");
      const queryString = params.toString();

      // Construct the deep link URL with all parameters
      const appUrl = `com.recipe.app://oauth-native-callback?${queryString}`;

      console.log("Forwarding to native app:", appUrl);

      // Try multiple methods to open the native app
      
      // Method 1: Hidden Iframe (Standard approach)
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = appUrl;
      document.body.appendChild(iframe);

      // Method 2: Window location (Fallback)
      setTimeout(() => {
        window.location.href = appUrl;
      }, 100);

      return () => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      };
    } else {
      // Web user - let Clerk handle it
      setIsNative(false);
    }
  }, []);

  // Still determining...
  if (isNative === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-6">
        <div className="text-center">
          <div className="mb-6">
             <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">İşleniyor...</h1>
        </div>
      </div>
    );
  }

  // Native app - show redirecting UI
  if (isNative) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-6">
        <div className="text-center">
          <div className="mb-6">
             <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Uygulamaya Dönülüyor</h1>
          <p className="text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    );
  }

  // Web user - let Clerk handle the callback and create session
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7]">
       <AuthenticateWithRedirectCallback 
         afterSignInUrl="/home"
         afterSignUpUrl="/home"
         signInUrl="/sign-in"
         signUpUrl="/sign-up"
       />
    </div>
  );  
}