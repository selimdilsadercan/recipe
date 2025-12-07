"use client";

import { useState } from "react";
import AppBar, { ActivePage } from "@/components/AppBar";
import { 
  CaretLeft,
  CaretRight,
  DotsThreeVertical,
  Plus
} from "@phosphor-icons/react";

// Gün isimleri
const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default function PlanPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return {
      name: dayNames[i],
      date: date.getDate(),
      fullDate: date,
    };
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(currentWeekStart.getDate() + 6);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-[#FAF9F7]">
        <h1 className="text-2xl font-bold text-gray-900">Haftalık Plan</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <DotsThreeVertical size={24} weight="bold" color="#374151" />
        </button>
      </header>

      {/* Date Navigation */}
      <div className="flex items-center justify-between px-5 py-3">
        <button 
          onClick={goToPreviousWeek}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <CaretLeft size={24} color="#6B7280" />
        </button>
        <span className="text-base font-medium text-gray-900">
          {formatDate(currentWeekStart)} - {formatDate(weekEndDate)}
        </span>
        <button 
          onClick={goToNextWeek}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <CaretRight size={24} color="#6B7280" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 overflow-y-auto">
        <div className="divide-y divide-[#E8E4DF]">
          {weekDays.map((day, index) => (
            <div key={index} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-medium text-[#7C7470]">
                  {day.name} {day.date}
                </h3>
                <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <Plus size={20} color="#6B7280" />
                </button>
              </div>
              <p className="text-sm text-gray-600">Henüz tarif eklenmedi</p>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <AppBar activePage={ActivePage.PLAN} />
    </div>
  );
}
