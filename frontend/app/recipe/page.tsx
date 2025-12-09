"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  PencilSimple,
  DotsThreeVertical,
  Trash,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { lib } from "@/lib/client";
import type { Ingredient, Instruction } from "@/lib/text-to-recipe";

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
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
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
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
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
  const ingredients =
    (recipe.ingredients as unknown as Ingredient[] | null) || [];
  const instructions =
    (recipe.instructions as unknown as Instruction[] | null) || [];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tarifi silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Tarif kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecipe}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Content - Malzemeler ve Yapılış Alt Alta */}
      <main className="flex-1 px-5 py-6 overflow-y-auto">
        {/* Malzemeler Bölümü */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Malzemeler</h2>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {ingredients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Malzeme bilgisi bulunmuyor
            </p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
              {ingredients.map((ingredient, idx) => (
                <div key={idx} className="flex items-center gap-3 py-1.5">
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]"></div>
                  </div>
                  <div className="flex-1 flex items-center gap-2 pb-0.5">
                    {ingredient.amount && (
                      <span className="font-semibold text-gray-900 text-base leading-tight">
                        {ingredient.amount}
                      </span>
                    )}
                    <span className="text-gray-700 text-base leading-tight">
                      {ingredient.name}
                    </span>
                  </div>
                </div>
              ))}
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
