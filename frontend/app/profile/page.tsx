"use client";

import AppBar, { ActivePage } from "@/components/AppBar";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { User } from "@phosphor-icons/react";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-[#FAF9F7]">
        <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 overflow-y-auto px-5">
        <div className="flex flex-col items-center py-8">
          {/* Profile Avatar */}
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <User size={48} color="#6B7280" />
          </div>
          
          {/* Auth Section */}
          <SignedOut>
            <p className="text-gray-600 mb-4">Hesabınıza giriş yapın</p>
            <SignInButton mode="modal">
              <button className="rounded-full bg-[#FF6B35] px-6 py-3 text-white font-medium hover:bg-[#e55a2b] transition-colors">
                Giriş Yap
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <div className="flex flex-col items-center gap-4">
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    avatarBox: "w-24 h-24"
                  }
                }}
              />
              <p className="text-gray-600">Hesap ayarlarını yönetin</p>
            </div>
          </SignedIn>
        </div>
      </main>

      {/* Bottom Navigation */}
      <AppBar activePage={ActivePage.PROFILE} />
    </div>
  );
}
