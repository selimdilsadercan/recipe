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
