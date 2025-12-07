"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import AppBar, { ActivePage } from "@/components/AppBar";
import { 
  Image,
  Plus
} from "@phosphor-icons/react";
import { getUserRecipesAction, getOrCreateUserAction } from "./actions";
import type { lib } from "@/lib/client";

export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  const [recipes, setRecipes] = useState<lib.RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Clerk user yüklendiğinde Supabase user ID'sini al
  useEffect(() => {
    async function fetchSupabaseUser() {
      if (!user?.id) return;
      
      const result = await getOrCreateUserAction(user.id);
      if (result.data) {
        setSupabaseUserId(result.data.id);
      } else {
        console.error("User bulunamadı. Clerk ID:", user.id, result.error);
        setError(result.error || "Kullanıcı bilgisi bulunamadı");
      }
    }
    
    if (isLoaded && user) {
      fetchSupabaseUser();
    }
  }, [user, isLoaded]);

  // Supabase user ID hazır olduğunda tarifleri getir
  useEffect(() => {
    if (supabaseUserId) {
      fetchRecipes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseUserId]);

  async function fetchRecipes() {
    if (!supabaseUserId) return;
    
    try {
      setLoading(true);
      const result = await getUserRecipesAction(supabaseUserId);
      if (result.error) {
        setError(result.error);
      } else {
        setRecipes(result.data || []);
      }
    } catch (err) {
      setError("Tarifler yüklenirken hata oluştu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Clerk henüz yüklenmemişse veya kullanıcı giriş yapmamışsa
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </main>
        <AppBar activePage={ActivePage.COOKBOOKS} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-5">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tariflerinizi görüntüleyin</h2>
          <p className="text-gray-600 text-center">Tariflerinizi görmek için giriş yapın.</p>
        </main>
        <AppBar activePage={ActivePage.COOKBOOKS} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header - Üst kısım (logo + giriş) */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-5 pb-24 overflow-y-auto">
        {/* Category Selector */}
        <div className="flex items-center gap-2 mt-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Tariflerim</h2>
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

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Henüz tarif eklemediniz.</p>
            <p className="text-gray-500 text-sm mt-1">Sağ alttaki + butonuna tıklayarak ilk tarifinizi ekleyin!</p>
          </div>
        )}

        {/* Recipe Grid */}
        {!loading && !error && recipes.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/recipe?id=${recipe.id}`)}
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

      {/* Floating Action Button - Navigate to Create Recipe */}
      <button 
        onClick={() => router.push("/create-recipe")}
        className="fixed right-5 bottom-30 w-14 h-14 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center hover:bg-[#e55a2b] transition-colors hover:scale-105 active:scale-95 z-50"
      >
        <Plus size={28} weight="bold" color="white" />
      </button>

      {/* AppBar - Alt kısım (navigation) */}
      <AppBar activePage={ActivePage.COOKBOOKS} />
    </div>
  );
}
