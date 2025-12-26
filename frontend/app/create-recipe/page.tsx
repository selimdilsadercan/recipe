"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { X, Image, CaretDown, CaretUp, Users, Timer } from "@phosphor-icons/react";
import { parseRecipeText } from "@/lib/text-to-recipe";
import { createRecipe, getOrCreateUserAction } from "./actions";
import { useShareIntent } from "@/lib/use-share-intent";

function CreateRecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const sharedTextFromIntent = useShareIntent();
  
  const [recipeText, setRecipeText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(true);
  
  // Metadata state
  const [servings, setServings] = useState<string>("");
  const [prepTime, setPrepTime] = useState<string>("");
  const [cookTime, setCookTime] = useState<string>("");

  // Handle shared text from Instagram or other apps
  useEffect(() => {
    // Check URL params first
    const sharedTextFromUrl = searchParams.get('sharedText');
    if (sharedTextFromUrl) {
      setRecipeText(decodeURIComponent(sharedTextFromUrl));
    } 
    // Then check native share intent
    else if (sharedTextFromIntent) {
      setRecipeText(sharedTextFromIntent);
    }
  }, [searchParams, sharedTextFromIntent]);

  async function handleImport() {
    if (!recipeText.trim()) {
      setError("Lütfen tarif metnini yapıştırın");
      return;
    }

    if (!user?.id) {
      setError("Lütfen giriş yapın");
      return;
    }

    // Parse recipe text
    const parsed = parseRecipeText(recipeText);
    
    if (!parsed) {
      setError("Tarif formatı hatalı. 'Malzemeler:' ve 'Yapılış:' satırlarını kontrol edin.");
      return;
    }

    if (!parsed.title) {
      setError("Tarif başlığı bulunamadı. İlk satırda başlık olmalı.");
      return;
    }

    try {
      setIsImporting(true);
      setError(null);

      // Get user via server action
      const userResult = await getOrCreateUserAction(user.id);
      if (userResult.error || !userResult.data) {
        setError(userResult.error || "Kullanıcı bilgisi alınamadı");
        return;
      }

      // Create recipe via server action
      const recipeResult = await createRecipe(
        parsed.title,
        userResult.data.id,
        parsed.ingredients,
        parsed.instructions,
        servings ? parseInt(servings) : null,
        prepTime ? parseInt(prepTime) : null,
        cookTime ? parseInt(cookTime) : null
      );

      if (recipeResult.error) {
        setError(recipeResult.error);
        return;
      }

      // Redirect to home
      router.push("/home");
    } catch (err) {
      console.error("Import error:", err);
      setError("Tarif kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsImporting(false);
    }
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} color="#374151" />
        </button>
        
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Image size={24} color="#374151" />
          </button>
          
          <button
            onClick={handleImport}
            disabled={isImporting || !recipeText.trim()}
            className="px-4 py-2 text-[#FF6B35] font-semibold hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? "Kaydediliyor..." : "Import"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 py-4 overflow-y-auto">
        {/* İçe Aktarma İpuçları */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl mb-4 overflow-hidden">
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="text-amber-800 font-medium">💡 İçe Aktarma İpuçları</span>
            {tipsOpen ? (
              <CaretUp size={20} color="#92400e" />
            ) : (
              <CaretDown size={20} color="#92400e" />
            )}
          </button>
          
          {tipsOpen && (
            <div className="px-4 pb-3 text-amber-700 text-sm space-y-2">
              <p>Tarifin doğru algılanması için şu formata uyun:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>İlk satır:</strong> Tarif başlığı</li>
                <li><strong>Malzemeler:</strong> satırından sonra her malzeme ayrı satırda</li>
                <li><strong>Yapılış:</strong> satırından sonra numaralı adımlar (1. 2. 3.)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Recipe Metadata */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tarif Bilgileri (opsiyonel)</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Users size={14} />
                Kişi
              </label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="4"
                min="1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Timer size={14} />
                Hazırlık (dk)
              </label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="20"
                min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Timer size={14} />
                Pişirme (dk)
              </label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="15"
                min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Recipe Text Area */}
        <textarea
          value={recipeText}
          onChange={(e) => {
            setRecipeText(e.target.value);
            setError(null);
          }}
          placeholder={`Körili Kremalı Tavuklu Makarna

Malzemeler:
125 g makarna
250 g tavuk göğsü
1 tatlı kaşığı köri
...

Yapılış:
1. 1 litre kaynar suya 1 tatlı kaşığı tuz ekle...
2. 8–10 dakika haşla...
...`}
          className="w-full h-[calc(100vh-280px)] p-4 bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-gray-900 placeholder-gray-400 text-base leading-relaxed"
        />
      </main>
    </div>
  );
}

export default function CreateRecipePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    }>
      <CreateRecipeContent />
    </Suspense>
  );
}
