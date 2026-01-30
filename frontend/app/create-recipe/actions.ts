/**
 * Create Recipe API Service
 * Client-side API calls for recipe creation
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

// text-to-recipe formatındaki tipler (uyumluluk için)
interface ParsedIngredient {
  index?: number;
  name: string;
  amount?: string;
  unit?: string;
  name_normalized?: string;  // LLM tarafından normalize edilmiş ad
  name_en?: string;          // İngilizce karşılık (USDA için)
  amount_estimated_g?: number | null; // Tahmini gramaj
}

interface ParsedInstruction {
  index?: number;
  step?: number;
  text: string;
}

/**
 * text-to-recipe ingredient'i client lib formatına dönüştürür
 */
function convertIngredient(ing: ParsedIngredient) {
  return {
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    name_normalized: ing.name_normalized,  // USDA lookup için gerekli
    name_en: ing.name_en,                  // USDA lookup için gerekli
    amount_estimated_g: ing.amount_estimated_g
  };
}

/**
 * text-to-recipe instruction'ı client lib formatına dönüştürür
 */
function convertInstruction(inst: ParsedInstruction) {
  return {
    step: inst.step ?? inst.index ?? 1,
    text: inst.text
  };
}

/**
 * Yeni tarif oluşturur
 */
export async function createRecipe(
  title: string,
  userId: string,
  ingredients?: ParsedIngredient[] | null,
  instructions?: ParsedInstruction[] | null,
  servings?: number | null,
  prepTime?: number | null,
  cookTime?: number | null
): Promise<ActionResponse<lib.Recipe>> {
  try {
    const client = createBrowserClient();
    
    // Tipleri dönüştür
    const convertedIngredients = ingredients?.map(convertIngredient);
    const convertedInstructions = instructions?.map(convertInstruction);
    
    const response = await client.recipe.createRecipe({
      title,
      userId,
      ingredients: convertedIngredients as any,
      instructions: convertedInstructions,
      servings,
      prepTime,
      cookTime
    });
    
    return {
      data: response.recipe,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to create recipe:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
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

// ParsedRecipe type for LLM response
interface ParsedRecipe {
  title: string;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  ingredients: { 
    amount: string; 
    name: string;
    name_normalized?: string;  // LLM tarafından normalize edilmiş ad
    name_en?: string;          // İngilizce karşılık (USDA için)
    amount_estimated_g?: number | null;
  }[];
  instructions: { step: number; text: string }[];
}

/**
 * Tarifi LLM ile ayrıştırır
 */
export async function parseRecipeAction(
  text: string
): Promise<ActionResponse<ParsedRecipe>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.recipe.parseRecipe({ text });
    
    if (!response.success || !response.recipe) {
      return {
        data: null,
        error: response.errorMessage || "Tarif ayrıştırılamadı"
      };
    }
    
    return {
      data: response.recipe as ParsedRecipe,
      error: null
    };
  } catch (error) {
    console.error("Failed to parse recipe:", error);
    return {
      data: null,
      error: "Sunucu hatası oluştu"
    };
  }
}
