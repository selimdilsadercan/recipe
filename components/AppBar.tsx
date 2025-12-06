"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { 
  CookingPot,
  BookmarkSimple, 
  CalendarBlank, 
  ShoppingCart, 
  User
} from "@phosphor-icons/react";

// Aktif sayfa enum'u
export enum ActivePage {
  COOKBOOKS = "cookbooks",
  MEAL_PLAN = "mealplan",
  GROCERIES = "groceries",
  PROFILE = "profile",
}

interface AppBarProps {
  activePage: ActivePage;
  showHeader?: boolean; // Header'ı göster/gizle (varsayılan: false)
}

export default function AppBar({ activePage, showHeader = false }: AppBarProps) {
  return (
    <>
      {/* Header - Sadece showHeader true ise göster */}
      {showHeader && (
        <header className="flex items-center justify-between px-5 py-4 bg-white">
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
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 pb-6 z-50">
        <div className="flex items-center justify-around">
          {/* Cookbooks */}
          <Link
            href="/home"
            className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
              activePage === ActivePage.COOKBOOKS ? "text-[#FF6B35]" : "text-gray-500"
            }`}
          >
            <div className={activePage === ActivePage.COOKBOOKS ? "bg-[#FFF0EB] p-2 rounded-xl" : "p-2"}>
              <BookmarkSimple 
                size={24} 
                weight={activePage === ActivePage.COOKBOOKS ? "fill" : "regular"}
                color={activePage === ActivePage.COOKBOOKS ? "#FF6B35" : "#6B7280"} 
              />
            </div>
            <span className="text-xs font-medium">Cookbooks</span>
          </Link>

          {/* Meal Plan */}
          <Link
            href="/plan"
            className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
              activePage === ActivePage.MEAL_PLAN ? "text-[#FF6B35]" : "text-gray-500"
            }`}
          >
            <div className={activePage === ActivePage.MEAL_PLAN ? "bg-[#FFF0EB] p-2 rounded-xl" : "p-2"}>
              <CalendarBlank 
                size={24} 
                weight={activePage === ActivePage.MEAL_PLAN ? "fill" : "regular"}
                color={activePage === ActivePage.MEAL_PLAN ? "#FF6B35" : "#6B7280"} 
              />
            </div>
            <span className="text-xs font-medium">Meal Plan</span>
          </Link>

          {/* Groceries */}
          <Link
            href="/groceries"
            className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
              activePage === ActivePage.GROCERIES ? "text-[#FF6B35]" : "text-gray-500"
            }`}
          >
            <div className={activePage === ActivePage.GROCERIES ? "bg-[#FFF0EB] p-2 rounded-xl" : "p-2"}>
              <ShoppingCart 
                size={24} 
                weight={activePage === ActivePage.GROCERIES ? "fill" : "regular"}
                color={activePage === ActivePage.GROCERIES ? "#FF6B35" : "#6B7280"} 
              />
            </div>
            <span className="text-xs font-medium">Groceries</span>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
              activePage === ActivePage.PROFILE ? "text-[#FF6B35]" : "text-gray-500"
            }`}
          >
            <div className={activePage === ActivePage.PROFILE ? "bg-[#FFF0EB] p-2 rounded-xl" : "p-2"}>
              <User 
                size={24} 
                weight={activePage === ActivePage.PROFILE ? "fill" : "regular"}
                color={activePage === ActivePage.PROFILE ? "#FF6B35" : "#6B7280"} 
              />
            </div>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
