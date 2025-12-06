"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import AppBar, { ActivePage } from "@/components/AppBar";
import { 
  Image,
  Plus
} from "@phosphor-icons/react";
import { getAllRecipes, Recipe } from "@/lib/recipe-service";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const data = await getAllRecipes();
        setRecipes(data);
      } catch (err) {
        setError("Tarifler yüklenirken hata oluştu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipes();
  }, []);

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

      {/* Floating Action Button */}
      <button className="fixed right-5 bottom-30 w-14 h-14 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center hover:bg-[#e55a2b] transition-colors hover:scale-105 active:scale-95">
        <Plus size={28} weight="bold" color="white" />
      </button>

      {/* AppBar - Alt kısım (navigation) */}
      <AppBar activePage={ActivePage.COOKBOOKS} />
    </div>
  );
}
