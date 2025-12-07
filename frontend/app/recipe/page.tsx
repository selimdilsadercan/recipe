"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PencilSimple, DotsThreeVertical, Image } from "@phosphor-icons/react";
import { getRecipeByIdAction } from "./actions";
import type { lib } from "@/lib/client";
import type { Ingredient, Instruction } from "@/lib/text-to-recipe";

type TabType = "ingredients" | "instructions";

function RecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id");

  const [recipe, setRecipe] = useState<lib.Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("ingredients");

  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
    } else {
      setError("Tarif ID'si bulunamadı");
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  async function fetchRecipe() {
    if (!recipeId) return;

    try {
      setLoading(true);
      const result = await getRecipeByIdAction(recipeId);
      if (result.data) {
        setRecipe(result.data);
      } else {
        setError(result.error || "Tarif bulunamadı");
      }
    } catch (err) {
      console.error(err);
      setError("Tarif yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <header className="flex items-center px-5 py-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} color="#374151" />
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center px-5">
          <p className="text-red-500">{error || "Tarif bulunamadı"}</p>
        </main>
      </div>
    );
  }

  // Cast ingredients and instructions to local types for rendering
  const ingredients = (recipe.ingredients as unknown as Ingredient[] | null) || [];
  const instructions = (recipe.instructions as unknown as Instruction[] | null) || [];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} color="#374151" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <PencilSimple size={24} color="#374151" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <DotsThreeVertical size={24} color="#374151" />
          </button>
        </div>
      </header>

      {/* Recipe Image - sadece varsa göster */}
      {recipe.image_url && (
        <div className="w-full aspect-[16/9]">
          <img
            src={recipe.image_url}
            alt={recipe.title || "Tarif"}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Recipe Title */}
      <div className="px-5 py-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab("ingredients")}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === "ingredients"
              ? "text-[#FF6B35] border-b-2 border-[#FF6B35]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Malzemeler
        </button>
        <button
          onClick={() => setActiveTab("instructions")}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === "instructions"
              ? "text-[#FF6B35] border-b-2 border-[#FF6B35]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Yapılış
        </button>
      </div>

      {/* Tab Content */}
      <main className="flex-1 px-5 py-4 overflow-y-auto">
        {activeTab === "ingredients" && (
          <div className="space-y-3">
            {ingredients.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Malzeme bilgisi bulunmuyor</p>
            ) : (
              ingredients.map((ingredient) => (
                <div key={ingredient.index} className="flex items-start gap-3 py-2">
                  <span className="text-[#FF6B35] mt-0.5">✕</span>
                  <div>
                    {ingredient.amount && (
                      <span className="font-semibold text-gray-900">{ingredient.amount} </span>
                    )}
                    <span className="text-gray-700">{ingredient.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "instructions" && (
          <div className="space-y-4">
            {instructions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Yapılış bilgisi bulunmuyor</p>
            ) : (
              instructions.map((instruction) => (
                <div key={instruction.index} className="flex items-start gap-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {instruction.index}
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-1">{instruction.text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RecipePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    }>
      <RecipeContent />
    </Suspense>
  );
}
