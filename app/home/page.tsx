"use client";

import { useState } from "react";
import Header from "@/components/Header";
import AppBar, { ActivePage } from "@/components/AppBar";
import { 
  CaretDown,
  Image,
  Plus
} from "@phosphor-icons/react";

// Örnek tarif verileri
const sampleRecipes = [
  {
    id: 1,
    title: "Chedarlı Tiftiklenmiş BBQ Tavuk",
    image: null,
  },
  {
    id: 2,
    title: "Kremalı Tavuklu Makarna",
    image: null,
  },
];

export default function Home() {

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header - Üst kısım (logo + giriş) */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-5 pb-24 overflow-y-auto">
        {/* Category Selector */}
        <div className="flex items-center gap-2 mt-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Tüm Tarifler</h2>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-2 gap-4">
          {sampleRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Recipe Image */}
              <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image size={48} color="#9CA3AF" />
                )}
              </div>
              {/* Recipe Title */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                  {recipe.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed right-5 bottom-30 w-14 h-14 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center hover:bg-[#e55a2b] transition-colors hover:scale-105 active:scale-95">
        <Plus size={28} weight="bold" color="white" />
      </button>

      {/* AppBar - Alt kısım (navigation) */}
      <AppBar activePage={ActivePage.COOKBOOKS} />
    </div>
  );
}
