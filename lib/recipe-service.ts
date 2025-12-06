import { supabase } from "./supabase";
import { Tables } from "./supabase-types";

export type Recipe = Tables<"recipes">;

/**
 * Tüm tarifleri getirir (RPC fonksiyonu kullanarak)
 */
export async function getAllRecipes(): Promise<Recipe[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_all_recipes");
  console.log(data);

  if (error) {
    console.error("getAllRecipes error:", error);
    throw new Error("Tarifler yüklenemedi");
  }

  return data || [];
}

/**
 * Yeni tarif oluşturur
 */
export async function createNewRecipe(title: string): Promise<Recipe | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("create_new_recipe", {
    title_param: title,
  });

  if (error) {
    console.error("createNewRecipe error:", error);
    throw new Error("Tarif oluşturulamadı");
  }

  return data?.[0] || null;
}
