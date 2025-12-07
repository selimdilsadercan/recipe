"use client";

import Link from "next/link";
import { 
  BookmarkSimple, 
  CalendarBlank, 
  ShoppingCart, 
  User
} from "@phosphor-icons/react";

// Aktif sayfa enum'u
export enum ActivePage {
  COOKBOOKS = "cookbooks",
  PLAN = "plan",
  GROCERIES = "groceries",
  PROFILE = "profile",
}

interface AppBarProps {
  activePage: ActivePage;
}

export default function AppBar({ activePage }: AppBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        {/* Tarifler */}
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
          <span className="text-xs font-medium">Tarifler</span>
        </Link>

        {/* Plan */}
        <Link
          href="/plan"
          className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
            activePage === ActivePage.PLAN ? "text-[#FF6B35]" : "text-gray-500"
          }`}
        >
          <div className={activePage === ActivePage.PLAN ? "bg-[#FFF0EB] p-2 rounded-xl" : "p-2"}>
            <CalendarBlank 
              size={24} 
              weight={activePage === ActivePage.PLAN ? "fill" : "regular"}
              color={activePage === ActivePage.PLAN ? "#FF6B35" : "#6B7280"} 
            />
          </div>
          <span className="text-xs font-medium">Plan</span>
        </Link>

        {/* Alışveriş */}
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
          <span className="text-xs font-medium">Alışveriş</span>
        </Link>

        {/* Profil */}
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
          <span className="text-xs font-medium">Profil</span>
        </Link>
      </div>
    </nav>
  );
}
