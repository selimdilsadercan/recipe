"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { CookingPot } from "@phosphor-icons/react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-5 py-4 bg-[#FAF9F7]">
      <div className="flex items-center gap-2">
        <CookingPot size={32} weight="fill" color="#FF6B35" />
        <span className="text-2xl font-bold text-[#FF6B35]">ReciMe</span>
      </div>
      <div>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-full bg-[#FF6B35] px-4 py-2 text-white font-medium text-sm hover:bg-[#e55a2b] transition-colors">
              Giriş Yap
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
