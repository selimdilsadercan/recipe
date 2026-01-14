"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  PencilSimple,
  DotsThreeVertical,
  Trash,
  ForkKnife,
  Timer,
  Plus,
  Minus,
} from "@phosphor-icons/react";
import { useUser } from "@clerk/clerk-react";
import {
  getRecipeByIdAction,
  deleteRecipeAction,
  getOrCreateUserAction,
} from "./actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { lib } from "@/lib/client";
import { scaleAmount, getScaleFactor } from "@/lib/scale-ingredient";
import { NutritionTable } from "@/components/NutritionTable";

function RecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user } = useUser();

  const [recipe, setRecipe] = useState<lib.Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentServings, setCurrentServings] = useState<number | null>(null);

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
        // Initialize currentServings with recipe's original servings
        if (result.data.servings) {
          setCurrentServings(result.data.servings);
        }
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

  // Calculate scaled ingredients for display and nutrition
  const nutritionIngredients = recipe?.ingredients?.map(ing => {
    if (!currentServings || !recipe?.servings) return { name: ing.name, amount: ing.amount || "" };
    const factor = getScaleFactor(currentServings, recipe.servings);
    const scaledAmount = scaleAmount(ing.amount || "", factor);
    return { name: ing.name, amount: scaledAmount };
  }) || [];

  async function handleDeleteRecipe() {
    if (!recipeId || !user?.id) return;

    try {
      setIsDeleting(true);

      // Önce Clerk ID ile Supabase user ID'sini al
      const userResult = await getOrCreateUserAction(user.id);
      if (!userResult.data) {
        setError(userResult.error || "Kullanıcı bilgisi alınamadı");
        setIsDeleteDialogOpen(false);
        return;
      }

      const result = await deleteRecipeAction(recipeId, userResult.data.id);

      if (result.data) {
        // Başarılı silme - ana sayfaya yönlendir
        router.push("/home");
      } else {
        setError(result.error || "Tarif silinemedi");
        setIsDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      setError("Tarif silinirken hata oluştu");
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-4">
        <p className="text-red-500 mb-4 text-center">{error}</p>
        <button
          onClick={() => router.push("/home")}
          className="text-[#FF6B35] underline"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const ingredients = (recipe.ingredients as lib.Ingredient[]) || [];
  const instructions = (recipe.instructions as lib.Instruction[]) || [];

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col font-sans mb-20">
      {/* Header Image & Actions */}
      <header className="relative px-5 py-4 flex items-center justify-between bg-white z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} color="#374151" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/edit-recipe?id=${recipeId}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <PencilSimple size={24} color="#374151" />
          </button>

          {/* More Button with Popover */}
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <DotsThreeVertical size={24} color="#374151" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              <button
                onClick={() => {
                  setIsPopoverOpen(false);
                  setIsDeleteDialogOpen(true);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash size={20} />
                <span className="font-medium">Tarifi Sil</span>
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Tarifi silmek istediğinize emin misiniz?"
        description="Bu işlem geri alınamaz. Tarif kalıcı olarak silinecektir."
        confirmText={isDeleting ? "Siliniyor..." : "Evet, Sil"}
        onConfirm={handleDeleteRecipe}
        isLoading={isDeleting}
        variant="danger"
      />

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
        
        {/* Recipe Metadata */}
        {(recipe.servings || recipe.prep_time || recipe.cook_time) && (
          <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <ForkKnife size={18} className="text-gray-400" />
                <span>{recipe.servings} Kişilik</span>
              </div>
            )}
            {(recipe.prep_time || recipe.cook_time) && (
              <div className="flex items-center gap-1">
                <Timer size={18} className="text-gray-400" />
                <span>
                  {recipe.cook_time && `${recipe.cook_time}dk Pişirme`}
                  {recipe.prep_time && recipe.cook_time && ', '}
                  {recipe.prep_time && `${recipe.prep_time}dk Hazırlama`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content - Malzemeler ve Yapılış Alt Alta */}
      <main className="flex-1 px-5 py-6 overflow-y-auto">
        
        {/* Nutrition Table */}
        {nutritionIngredients.length > 0 && currentServings && (
          <div className="mb-8">
            <NutritionTable 
              ingredients={nutritionIngredients} 
              servings={currentServings} 
            />
          </div>
        )}

        {/* Malzemeler Bölümü */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Malzemeler</h2>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            
            {/* Serving Size Adjuster */}
            {recipe.servings && currentServings && (
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-300 rounded-full">
                  <button
                    onClick={() => setCurrentServings(Math.max(1, currentServings - 1))}
                    disabled={currentServings <= 1}
                    className="p-2 text-[#FF6B35] hover:bg-gray-100 rounded-l-full disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={18} weight="bold" />
                  </button>
                  <span className="px-3 min-w-[2rem] text-center font-semibold text-gray-900">
                    {currentServings}
                  </span>
                  <button
                    onClick={() => setCurrentServings(currentServings + 1)}
                    className="p-2 text-[#FF6B35] hover:bg-gray-100 rounded-r-full"
                  >
                    <Plus size={18} weight="bold" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">kişilik</span>
              </div>
            )}
          </div>

          {ingredients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Malzeme bilgisi bulunmuyor
            </p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
              {ingredients.map((ingredient, idx) => {
                // Determine scaled amount for display
                const displayAmount = nutritionIngredients[idx]?.amount || ingredient.amount;
                
                return (
                  <div key={idx} className="flex items-center gap-3 py-1.5">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]"></div>
                    </div>
                    <div className="flex-1 flex items-center gap-2 pb-0.5">
                      {displayAmount && (
                        <span className="font-semibold text-gray-900 text-base leading-tight">
                          {displayAmount}
                        </span>
                      )}
                      <span className="text-gray-700 text-base leading-tight">
                        {ingredient.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Yapılış Bölümü */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Yapılış</h2>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {instructions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Yapılış bilgisi bulunmuyor
            </p>
          ) : (
            <div className="space-y-3">
              {instructions.map((instruction, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex-shrink-0">
                    <div className="w-[1.625rem] h-[1.625rem] rounded-full bg-[#FF6B35] flex items-center justify-center">
                      <span className="text-white font-semibold text-sm leading-none">
                        {(instruction as unknown as { step?: number }).step ??
                          idx + 1}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-normal flex-1 text-base pb-0.5">
                    {instruction.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function RecipePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      }
    >
      <RecipeContent />
    </Suspense>
  );
}
