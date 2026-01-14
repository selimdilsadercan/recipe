"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { X, Image, CaretDown, CaretUp, Users, Timer, Check, ArrowLeft, PencilSimple, SpinnerGap } from "@phosphor-icons/react";

import { createRecipe, getOrCreateUserAction, parseRecipeAction } from "./actions";
import { useShareIntent } from "@/lib/use-share-intent";

// Parsed recipe type (matches backend)
interface ParsedRecipe {
  title: string;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  ingredients: { amount: string; name: string }[];
  instructions: { step: number; text: string }[];
}

function CreateRecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const sharedTextFromIntent = useShareIntent();
  
  // Step state: "input" or "preview"
  const [step, setStep] = useState<"input" | "preview">("input");
  
  const [recipeText, setRecipeText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(true);
  
  // Parsed result for preview
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  
  // Editable metadata (can override LLM's guess)
  const [servings, setServings] = useState<string>("");
  const [prepTime, setPrepTime] = useState<string>("");
  const [cookTime, setCookTime] = useState<string>("");

  // Handle shared text from Instagram or other apps
  useEffect(() => {
    const sharedTextFromUrl = searchParams.get('sharedText');
    if (sharedTextFromUrl) {
      setRecipeText(decodeURIComponent(sharedTextFromUrl));
    } else if (sharedTextFromIntent) {
      setRecipeText(sharedTextFromIntent);
    }
  }, [searchParams, sharedTextFromIntent]);

  // Step 1: Parse with LLM
  async function handleAnalyze() {
    if (!recipeText.trim()) {
      setError("Lütfen tarif metnini yapıştırın");
      return;
    }

    if (!user?.id) {
      setError("Lütfen giriş yapın");
      return;
    }

    try {
      setIsParsing(true);
      setError(null);

      const parseResult = await parseRecipeAction(recipeText);
      
      if (parseResult.error || !parseResult.data) {
        setError(parseResult.error || "Tarif yapısı anlaşılamadı.");
        setIsParsing(false);
        return;
      }

      // Set parsed result and move to preview
      setParsedRecipe(parseResult.data);
      
      // Pre-fill metadata from LLM
      if (parseResult.data.servings) setServings(String(parseResult.data.servings));
      if (parseResult.data.prep_time) setPrepTime(String(parseResult.data.prep_time));
      if (parseResult.data.cook_time) setCookTime(String(parseResult.data.cook_time));
      
      setStep("preview");
      setIsParsing(false);
    } catch (err) {
      console.error("Parse error:", err);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setIsParsing(false);
    }
  }

  // Step 2: Save confirmed recipe
  async function handleSave() {
    if (!parsedRecipe || !user?.id) return;

    try {
      setIsSaving(true);
      setError(null);

      // Get user
      const userResult = await getOrCreateUserAction(user.id);
      if (userResult.error || !userResult.data) {
        setError(userResult.error || "Kullanıcı bilgisi alınamadı");
        setIsSaving(false);
        return;
      }

      // Save recipe
      const recipeResult = await createRecipe(
        parsedRecipe.title || "Adsız Tarif",
        userResult.data.id,
        parsedRecipe.ingredients,
        parsedRecipe.instructions,
        servings ? parseInt(servings) : null,
        prepTime ? parseInt(prepTime) : null,
        cookTime ? parseInt(cookTime) : null
      );

      if (recipeResult.error) {
        setError(recipeResult.error);
        setIsSaving(false);
        return;
      }

      router.push("/home");
    } catch (err) {
      console.error("Save error:", err);
      setError("Tarif kaydedilemedi.");
      setIsSaving(false);
    }
  }

  // Go back to input step
  function handleBackToInput() {
    setStep("input");
    setParsedRecipe(null);
    setError(null);
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

  // ========== PREVIEW STEP ==========
  if (step === "preview" && parsedRecipe) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <button
            onClick={handleBackToInput}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={24} color="#374151" />
            <span className="text-gray-700 text-sm">Düzenle</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#FF6B35] text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <SpinnerGap size={18} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Check size={18} weight="bold" />
                Onayla ve Kaydet
              </>
            )}
          </button>
        </header>

        {/* Preview Content */}
        <main className="flex-1 px-5 py-4 overflow-y-auto pb-20">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <Check size={20} color="#16a34a" weight="bold" />
            <span className="text-green-700 text-sm">Yapay zeka tarifi analiz etti. Kontrol edip onaylayın.</span>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">{parsedRecipe.title}</h2>
          </div>

          {/* Metadata */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <PencilSimple size={16} />
              Tarif Bilgileri (düzenlenebilir)
            </h3>
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Malzemeler ({parsedRecipe.ingredients.length})
            </h3>
            <ul className="space-y-2">
              {parsedRecipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="w-2 h-2 bg-[#FF6B35] rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>
                    {ing.amount && <span className="font-medium">{ing.amount} </span>}
                    {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Yapılış ({parsedRecipe.instructions.length} adım)
            </h3>
            <ol className="space-y-3">
              {parsedRecipe.instructions.map((inst, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 bg-[#FF6B35] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {inst.step || idx + 1}
                  </span>
                  <span className="text-gray-700">{inst.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </main>
      </div>
    );
  }

  // ========== INPUT STEP ==========
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
            onClick={handleAnalyze}
            disabled={isParsing || !recipeText.trim()}
            className="px-4 py-2 bg-[#FF6B35] text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isParsing ? (
              <>
                <SpinnerGap size={18} className="animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              "🤖 Tarifi Analiz Et"
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 py-4 overflow-y-auto">
        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl mb-4 overflow-hidden">
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="text-blue-800 font-medium">🤖 Yapay Zeka ile Akıllı İçe Aktarma</span>
            {tipsOpen ? (
              <CaretUp size={20} color="#1e40af" />
            ) : (
              <CaretDown size={20} color="#1e40af" />
            )}
          </button>
          
          {tipsOpen && (
            <div className="px-4 pb-3 text-blue-700 text-sm space-y-2">
              <p>Herhangi bir formatta tarif yapıştırın:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Instagram'dan kopyalanan tarifler</li>
                <li>Web sitelerinden kopyalanan metinler</li>
                <li>Düz paragraf şeklinde yazılmış tarifler</li>
                <li>Yapay zeka her formatı anlar!</li>
              </ul>
            </div>
          )}
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
          placeholder={`Tarif metnini buraya yapıştırın...

Örnek:
Körili Kremalı Tavuklu Makarna

Malzemeler:
125 g makarna
250 g tavuk göğsü
1 tatlı kaşığı köri
...

Yapılış:
1. Suyu kaynatın ve makarnayı haşlayın
2. Tavuğu küp küp doğrayın
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
