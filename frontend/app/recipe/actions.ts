/**
 * Recipe API Service
 * Client-side API calls for recipe operations
 * (Static export compatible - no server actions)
 */

import { createBrowserClient } from "@/lib/api";
import { isUnauthenticatedError, getErrorMessage } from "@/lib/api-error-handler";
import type { lib } from "@/lib/client";

// Standardized response format
interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Clerk ID ile Supabase user'ı getirir veya oluşturur
 */
export async function getOrCreateUserAction(
  clerkId: string
): Promise<ActionResponse<lib.User & { isNewUser?: boolean }>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.identity.getOrCreateUser({ clerkId });
    
    if (response.user) {
      return {
        data: { ...response.user, isNewUser: response.isNewUser },
        error: null
      };
    }
    
    return {
      data: null,
      error: "Kullanıcı oluşturulamadı"
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to get or create user:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Recipe ID ile tarif detayını getirir
 */
export async function getRecipeByIdAction(
  recipeId: string
): Promise<ActionResponse<lib.Recipe>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.recipe.getRecipeById(recipeId);
    
    return {
      data: response.recipe,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to fetch recipe:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Tarifi siler (sadece tarifi oluşturan kullanıcı silebilir)
 */
export async function deleteRecipeAction(
  recipeId: string,
  userId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.recipe.deleteRecipe(recipeId, { userId });
    
    return {
      data: response.success,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to delete recipe:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Tarifin besin değerlerini hesaplar
 */
export async function calculateNutritionAction(
  ingredients: { name: string; amount: string }[],
  servings: number = 1
): Promise<ActionResponse<lib.CalculateNutritionResponse>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.nutrition.calculateRecipeNutrition({
      ingredients,
      servings,
    });
    
    return {
      data: response,
      error: null
    };
  } catch (error) {
    console.error("Failed to calculate nutrition:", error);
    return {
      data: null,
      error: "Besin değerleri hesaplanamadı"
    };
  }
}
