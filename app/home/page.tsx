"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import AppBar, { ActivePage } from "@/components/AppBar";
import { 
  Image,
  Plus
} from "@phosphor-icons/react";
import { getAllRecipes, createNewRecipe, Recipe } from "@/lib/recipe-service";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newRecipeTitle, setNewRecipeTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    try {
      setLoading(true);
      const data = await getAllRecipes();
      setRecipes(data);
    } catch (err) {
      setError("Tarifler yüklenirken hata oluştu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRecipe() {
    if (!newRecipeTitle.trim()) return;
    
    try {
      setIsCreating(true);
      await createNewRecipe(newRecipeTitle.trim());
      setNewRecipeTitle("");
      setDrawerOpen(false);
      // Listeyi yenile
      fetchRecipes();
    } catch (err) {
      console.error("Tarif oluşturma hatası:", err);
    } finally {
      setIsCreating(false);
    }
  }

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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        )}

        {/* Recipe Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Recipe Image */}
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title || "Tarif"}
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
        )}
      </main>

      {/* Floating Action Button with Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <button className="fixed right-5 bottom-30 w-14 h-14 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center hover:bg-[#e55a2b] transition-colors hover:scale-105 active:scale-95 z-50">
            <Plus size={28} weight="bold" color="white" />
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Yeni Tarif Ekle</DrawerTitle>
            <DrawerDescription>
              Tarifinize bir isim verin.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Tarif adı"
              value={newRecipeTitle}
              onChange={(e) => setNewRecipeTitle(e.target.value)}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
            <button 
              onClick={handleCreateRecipe}
              disabled={!newRecipeTitle.trim() || isCreating}
              className="w-full py-3 px-4 bg-[#FF6B35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Oluşturuluyor..." : "Tarif Oluştur"}
            </button>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <button className="w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                İptal
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* AppBar - Alt kısım (navigation) */}
      <AppBar activePage={ActivePage.COOKBOOKS} />
    </div>
  );
}
