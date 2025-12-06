"use client";

import { useState } from "react";
import AppBar, { ActivePage } from "@/components/AppBar";
import { 
  ShareNetwork,
  DotsThreeVertical,
  CaretDown,
  ForkKnife,
  Plus
} from "@phosphor-icons/react";

// Örnek grocery verileri
const groceryItems = [
  {
    id: 1,
    category: "ET & DENİZ ÜRÜNLERİ",
    items: [
      { id: 1, name: "1 Kilo Tavuk", checked: false },
    ],
  },
];

export default function GroceriesPage() {
  const [items, setItems] = useState(groceryItems);

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const newItems = [...items];
    newItems[categoryIndex].items[itemIndex].checked = 
      !newItems[categoryIndex].items[itemIndex].checked;
    setItems(newItems);
  };

  const totalItems = items.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-[#FAF9F7]">
        <h1 className="text-2xl font-bold text-gray-900">Alışveriş Listesi</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ShareNetwork size={24} color="#374151" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <DotsThreeVertical size={24} weight="bold" color="#374151" />
          </button>
        </div>
      </header>

      {/* Item Count & Filter */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-gray-600">{totalItems} ürün</span>
        <button className="flex items-center gap-1 bg-gray-200 px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-300 transition-colors">
          Reyonlar
          <CaretDown size={16} />
        </button>
      </div>

      {/* Gradient Divider */}
      <div className="h-1 bg-gradient-to-r from-[#E8B86D] via-[#F5D89A] to-[#E8B86D] mx-5 rounded-full" />

      {/* Main Content */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {items.map((category, catIndex) => (
          <div key={category.category} className="mt-6">
            <h2 className="px-5 text-sm font-bold text-gray-900 tracking-wide mb-4">
              {category.category}
            </h2>
            
            <div className="divide-y divide-gray-200">
              {category.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4 bg-white"
                >
                  <div className="flex items-center gap-4">
                    <ForkKnife size={28} color="#9CA3AF" />
                    <span className={`text-base ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.name}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleItem(catIndex, itemIndex)}
                    className={`w-6 h-6 border-2 rounded ${
                      item.checked 
                        ? 'bg-[#FF6B35] border-[#FF6B35]' 
                        : 'border-gray-300 hover:border-gray-400'
                    } transition-colors flex items-center justify-center`}
                  >
                    {item.checked && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Floating Action Button */}
      <button className="fixed right-5 bottom-30 w-14 h-14 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center hover:bg-[#e55a2b] transition-colors hover:scale-105 active:scale-95">
        <Plus size={28} weight="bold" color="white" />
      </button>

      {/* Bottom Navigation */}
      <AppBar activePage={ActivePage.GROCERIES} />
    </div>
  );
}
