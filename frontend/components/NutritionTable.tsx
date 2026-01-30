"use client";

import { useState, useEffect } from "react";
import { calculateNutritionAction } from "@/app/recipe/actions";
import type { nutrition, lib } from "@/lib/client";
import { 
  Dna, 
  Flame, 
  Drop, 
  Cookie, 
  Info,
  CaretDown,
  CaretUp
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface NutritionTableProps {
  ingredients: { 
    name: string; 
    amount: string;
    name_normalized?: string;
    name_en?: string;
    amount_estimated_g?: number | null;
  }[];
  servings: number;
  className?: string;
}

export function NutritionTable({ ingredients, servings, className }: NutritionTableProps) {
  const [data, setData] = useState<nutrition.CalculateNutritionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"total" | "serving">("serving");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (ingredients.length > 0) {
      fetchNutrition();
    }
  }, [ingredients, servings]);

  async function fetchNutrition() {
    try {
      setLoading(true);
      setError(null);
      const result = await calculateNutritionAction(ingredients, servings);
      
      if (result.data) {
        setData(result.data);
      } else {
        setError("Hesaplama yapılamadı");
      }
    } catch (err) {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={cn("p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm animate-pulse", className)}>
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-4 mb-4">
          <div className="h-24 w-24 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  // Gösterilecek veriyi seç (Toplam veya Porsiyon)
  const displayData = viewMode === "serving" && data.per_serving ? data.per_serving : data.total;
  const coverageEmoji = data.coverage_percent === 100 ? "✅" : data.coverage_percent > 80 ? "⚠️" : "❌";

  // Makro oranlarını hesapla (Progress bar için)
  const totalMacros = displayData.protein * 4 + displayData.carbs * 4 + displayData.fat * 9;
  const proteinPercent = totalMacros > 0 ? Math.round((displayData.protein * 4 / totalMacros) * 100) : 0;
  const carbsPercent = totalMacros > 0 ? Math.round((displayData.carbs * 4 / totalMacros) * 100) : 0;
  const fatPercent = totalMacros > 0 ? Math.round((displayData.fat * 9 / totalMacros) * 100) : 0;

  return (
    <div className={cn("bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden", className)}>
      {/* Header & Toggle */}
      <div className="p-6 pb-2 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Flame weight="fill" className="text-orange-500" />
          Besin Değerleri
        </h3>
        
        {servings >= 1 && (
          <div className="flex bg-gray-100 p-1 rounded-full text-xs font-medium">
            <button
              onClick={() => setViewMode("serving")}
              className={cn(
                "px-3 py-1 rounded-full transition-all",
                viewMode === "serving" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Porsiyon
            </button>
            <button
              onClick={() => setViewMode("total")}
              className={cn(
                "px-3 py-1 rounded-full transition-all",
                viewMode === "total" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Toplam
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 pt-2">
        <div className="flex items-center gap-6 mb-6">
          {/* Calorie Circle */}
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="50" fill="none" className="stroke-gray-100" strokeWidth="8" />
              <circle 
                cx="56" cy="56" r="50" 
                fill="none" 
                className="stroke-orange-500" 
                strokeWidth="8" 
                strokeDasharray={`${(displayData.calories / 2000) * 314} 314`} // 2000kcal baz alındı basitçe
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-gray-900">{Math.round(displayData.calories)}</span>
              <span className="text-xs text-gray-500 font-medium">kcal</span>
            </div>
          </div>

          {/* Macros List */}
          <div className="flex-1 space-y-3">
            <MacroRow 
              label="Protein" 
              value={displayData.protein} 
              unit="g" 
              color="bg-green-500" 
              percent={proteinPercent} 
              icon={<Dna size={16} />}
            />
            <MacroRow 
              label="Karb" 
              value={displayData.carbs} 
              unit="g" 
              color="bg-amber-400" 
              percent={carbsPercent} 
              icon={<Cookie size={16} />}
            />
            <MacroRow 
              label="Yağ" 
              value={displayData.fat} 
              unit="g" 
              color="bg-red-500" 
              percent={fatPercent} 
              icon={<Drop size={16} />}
            />
          </div>
        </div>

        {/* Info Banner & Warnings */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
            <Info size={16} className="text-blue-500" />
            <span>Analiz doğruluğu: <strong className={data.coverage_percent < 100 ? "text-amber-600" : "text-green-600"}>%{data.coverage_percent}</strong></span>
          </div>

          {/* Low Confidence / Not Found Warnings */}
          {data.ingredients.some((i: nutrition.AnalyzedIngredient) => !i.found || (i.confidence && i.confidence < 0.8)) && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <h4 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                <Info size={14} className="text-amber-600" />
                Dikkat Gerektiren Malzemeler
              </h4>
              <ul className="space-y-1">
                {data.ingredients
                  .filter((i: nutrition.AnalyzedIngredient) => !i.found || (i.confidence && i.confidence < 0.8))
                  .map((item: nutrition.AnalyzedIngredient, idx: number) => (
                    <li key={idx} className="text-xs text-amber-800 flex justify-between">
                      <span>{item.original_name}</span>
                      <span className="opacity-75">
                        {!item.found 
                          ? "(Bulunamadı)" 
                          : item.confidence && item.confidence < 0.8 
                            ? `(Düşük Güven: ${item.matched_name})` 
                            : ""}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {showDetails ? "Detayları Gizle" : "Detaylı Analiz"}
          {showDetails ? <CaretUp /> : <CaretDown />}
        </button>

        {/* Detailed Table (Collapsible) */}
        {showDetails && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {/* Micronutrients Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
              <DetailRow label="Lif" value={displayData.fiber} unit="g" />
              <DetailRow label="Şeker" value={displayData.sugar} unit="g" />
              <DetailRow label="Kolesterol" value={displayData.cholesterol} unit="mg" />
              <DetailRow label="Sodyum" value={displayData.sodium} unit="mg" />
              <DetailRow label="Kalsiyum" value={displayData.calcium} unit="mg" />
              <DetailRow label="Demir" value={displayData.iron} unit="mg" />
              <DetailRow label="Potasyum" value={displayData.potassium} unit="mg" />
              <DetailRow label="Vit C" value={displayData.vitamin_c} unit="mg" />
              <DetailRow label="Vit A" value={displayData.vitamin_a} unit="IU" />
              <DetailRow label="Vit D" value={displayData.vitamin_d} unit="IU" />
            </div>

            {/* Debug Table: Ingredient Matching Fidelity */}
            <div className="bg-gray-50 rounded-lg p-3 overflow-hidden">
               <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Malzeme Eşleşme Kontrolü</h4>
               <div className="overflow-x-auto">
                 <table className="w-full text-xs text-left">
                   <thead className="text-gray-500 border-b border-gray-200">
                     <tr>
                       <th className="pb-1 font-medium">Orijinal</th>
                       <th className="pb-1 font-medium">Birim Analizi</th>
                       <th className="pb-1 font-medium">USDA Eşleşmesi</th>
                       <th className="pb-1 font-medium text-right">Kalori</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {data.ingredients.map((ing: nutrition.AnalyzedIngredient, idx: number) => (
                       <tr key={idx} className={!ing.found ? "opacity-50" : ""}>
                         <td className="py-1.5 pr-2 font-medium text-gray-800">{ing.original_name}</td>
                         <td className="py-1.5 pr-2 text-xs text-gray-500">
                             {ing.amount_g ? `${ing.amount_g}g` : "-"}
                             {ing.amount_str !== String(ing.amount_g) && <span className="opacity-50 ml-1">({ing.amount_str})</span>}
                         </td>
                         <td className="py-1.5 pr-2 text-gray-600">
                           {ing.found ? (
                             <span className={ing.confidence && ing.confidence < 0.8 ? "text-amber-600" : "text-green-700"}>
                               {ing.matched_name}
                             </span>
                           ) : (
                             <span className="text-red-500 italic">Bulunamadı</span>
                           )}
                         </td>
                         <td className="py-1.5 text-right font-mono text-gray-700">
                           {ing.found && ing.nutrients ? Math.round(ing.nutrients.calories) : "-"}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MacroRow({ label, value, unit, color, percent, icon }: any) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 font-medium flex items-center gap-1.5">
          {icon} {label}
        </span>
        <span className="font-bold text-gray-900">{Math.round(value)}{unit}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, unit }: any) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value} <span className="text-xs text-gray-400">{unit}</span></span>
    </div>
  );
}
