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

// ==================== DELETE RECIPE ====================

interface DeleteRecipeRequest {
  recipeId: string;
  userId: string;
}

interface DeleteRecipeResponse {
  success: boolean;
}

/**
 * Tarif siler (sadece tarifi oluşturan kullanıcı silebilir)
 * DELETE /recipe/:recipeId
 */
export const deleteRecipe = api(
  { expose: true, method: "DELETE", path: "/recipe/:recipeId" },
  async ({ recipeId, userId }: DeleteRecipeRequest): Promise<DeleteRecipeResponse> => {
    const { data, error } = await supabase.rpc("delete_recipe", {
      recipe_id_param: recipeId,
      user_id_param: userId,
    });

    if (error) {
      console.error("deleteRecipe error:", error);
      throw APIError.internal("Tarif silinemedi");
    }

    if (!data) {
      throw APIError.permissionDenied("Bu tarifi silme yetkiniz yok");
    }

    return { success: true };
  }
);

// ==================== UPDATE RECIPE ====================

interface UpdateRecipeRequest {
  recipeId: string;
  userId: string;
  title: string;
  ingredients: Ingredient[] | null;
  instructions: Instruction[] | null;
}

interface UpdateRecipeResponse {
  recipe: Recipe | null;
}

/**
 * Tarifi günceller (sadece tarifi oluşturan kullanıcı güncelleyebilir)
 * PUT /recipe/:recipeId
 */
export const updateRecipe = api(
  { expose: true, method: "PUT", path: "/recipe/:recipeId" },
  async ({ recipeId, userId, title, ingredients, instructions }: UpdateRecipeRequest): Promise<UpdateRecipeResponse> => {
    const { data, error } = await supabase.rpc("update_recipe", {
      recipe_id_param: recipeId,
      user_id_param: userId,
      title_param: title,
      ingredients_param: ingredients || null,
      instructions_param: instructions || null,
    });

    if (error) {
      console.error("updateRecipe error:", error);
      throw APIError.internal("Tarif güncellenemedi");
    }

    if (!data || data.length === 0) {
      throw APIError.permissionDenied("Bu tarifi güncelleme yetkiniz yok");
    }

    return { recipe: data[0] };
  }
);
