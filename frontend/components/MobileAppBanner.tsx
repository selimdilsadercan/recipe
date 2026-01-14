"use client";

import { useState, useEffect } from "react";
import { Globe, X } from "@phosphor-icons/react";

// App bilgileri - değiştirilecekse sadece burayı değiştir
const APP_CONFIG = {
  name: "Vepie",
  icon: "/app-icon.png", // public klasöründeki ikon
  playStoreUrl: null as string | null, // İleride eklenecek
  appStoreUrl: null as string | null, // İleride eklenecek
};

const STORAGE_KEY = "mobile-app-banner-dismissed";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = navigator.userAgent || navigator.vendor;
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return true;
  }
  
  // Android detection
  if (/android/i.test(userAgent)) {
    return true;
  }
  
  // Generic mobile detection
  if (/Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return true;
  }
  
  return false;
}

function isAlreadyDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function setDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "true");
}

export function MobileAppBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Sadece mobil cihazlarda ve daha önce kapatılmamışsa göster
    if (isMobileDevice() && !isAlreadyDismissed()) {
      // Küçük bir gecikme ile göster (sayfa yüklendikten sonra)
      const timer = setTimeout(() => {
        setShow(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOpenApp = () => {
    // Şimdilik store linki yok, sadece kapat
    if (APP_CONFIG.playStoreUrl || APP_CONFIG.appStoreUrl) {
      // iOS için App Store, Android için Play Store
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const url = isIOS ? APP_CONFIG.appStoreUrl : APP_CONFIG.playStoreUrl;
      if (url) {
        window.open(url, "_blank");
      }
    }
    setDismissed();
    setShow(false);
  };

  const handleContinueBrowser = () => {
    setDismissed();
    setShow(false);
  };

  const handleClose = () => {
    setDismissed();
    setShow(false);
  };

  if (!show) return null;

  const hasStoreLink = APP_CONFIG.playStoreUrl || APP_CONFIG.appStoreUrl;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up shadow-2xl">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={20} color="#9CA3AF" />
        </button>
        
        {/* Header */}
        <div className="text-center py-4 border-b border-gray-100">
          <p className="text-lg font-medium text-gray-900">Bunu şurada aç...</p>
        </div>
        
        {/* Options */}
        <div className="p-5 space-y-3">
          {/* App Option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm">
                <img
                  src={APP_CONFIG.icon}
                  alt={APP_CONFIG.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{APP_CONFIG.name}</p>
                <p className="text-xs text-gray-500">
                  {hasStoreLink ? "Uygulamayı aç" : "Yakında"}
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenApp}
              disabled={!hasStoreLink}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                hasStoreLink
                  ? "bg-[#FF6B35] text-white hover:bg-[#e55a2b]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {hasStoreLink ? "Aç" : "Yakında"}
            </button>
          </div>
          
          {/* Browser Option */}
          <div className="flex items-center justify-between p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Globe size={24} color="#9CA3AF" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Tarayıcı</p>
                <p className="text-xs text-gray-500">Web sitesinde devam et</p>
              </div>
            </div>
            <button
              onClick={handleContinueBrowser}
              className="px-6 py-2.5 rounded-full font-semibold text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Devam Et
            </button>
          </div>
        </div>
        
        {/* Safe area padding for iPhone */}
        <div className="h-8" />
      </div>
      
      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
