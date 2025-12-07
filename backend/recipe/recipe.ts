import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient, Recipe, RecipeSummary, Ingredient, Instruction } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetUserRecipesRequest {
  userId: string;
}

interface GetUserRecipesResponse {
  recipes: RecipeSummary[];
}

interface CreateRecipeRequest {
  title: string;
  userId: string;
  ingredients?: Ingredient[] | null;
  instructions?: Instruction[] | null;
}

interface CreateRecipeResponse {
  recipe: Recipe | null;
}

interface GetRecipeByIdRequest {
  recipeId: string;
}

interface GetRecipeByIdResponse {
  recipe: Recipe | null;
}

// ==================== API ENDPOINTS ====================

/**
 * Belirli kullanıcının tariflerini getirir (RPC fonksiyonu kullanarak)
 * GET /recipe/user/:userId
 */
export const getUserRecipes = api(
  { expose: true, method: "GET", path: "/recipe/user/:userId" },
  async ({ userId }: GetUserRecipesRequest): Promise<GetUserRecipesResponse> => {
    const { data, error } = await supabase.rpc("get_user_recipes", {
      user_id_param: userId,
    });

    if (error) {
      console.error("getUserRecipes error:", error);
      throw APIError.internal("Tarifler yüklenemedi");
    }

    return { recipes: data || [] };
  }
);

/**
 * Yeni tarif oluşturur (kullanıcı ID'si, malzemeler ve yapılış ile)
 * POST /recipe/create
 */
export const createRecipe = api(
  { expose: true, method: "POST", path: "/recipe/create" },
  async ({ title, userId, ingredients, instructions }: CreateRecipeRequest): Promise<CreateRecipeResponse> => {
    const { data, error } = await supabase.rpc("create_new_recipe", {
      title_param: title,
      user_id_param: userId,
      ingredients_param: ingredients || null,
      instructions_param: instructions || null,
    });

    if (error) {
      console.error("createRecipe error:", error);
      throw APIError.internal("Tarif oluşturulamadı");
    }

    return { recipe: data?.[0] || null };
  }
);

/**
 * Tek bir tarifin tüm detaylarını getirir (recipe ID ile)
 * GET /recipe/:recipeId
 */
export const getRecipeById = api(
  { expose: true, method: "GET", path: "/recipe/:recipeId" },
  async ({ recipeId }: GetRecipeByIdRequest): Promise<GetRecipeByIdResponse> => {
    const { data, error } = await supabase.rpc("get_recipe", {
      recipe_id_param: recipeId,
    });

    if (error) {
      console.error("getRecipeById error:", error);
      return { recipe: null };
    }

    return { recipe: data?.[0] || null };
  }
);
