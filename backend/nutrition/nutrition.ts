import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createClient } from "@supabase/supabase-js";
import { lookupIngredient, calculateNutrients, sumNutrients, parseAmountToGrams } from "../lib/nutrition-lookup";
import type { NutrientData } from "../lib/common-ingredients";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const usdaApiKey = secret("UsdaApiKey");

// Request/Response tipleri
interface IngredientInput {
  name: string;
  name_normalized?: string;  // LLM tarafından normalize edilmiş ad
  name_en?: string;          // İngilizce karşılık (USDA için)
  amount: string; // örn: "2 adet", "200g"
  amount_estimated_g?: number | null; // AI tarafından tahmin edilen gramaj
}

interface CalculateNutritionRequest {
  ingredients: IngredientInput[];
  servings?: number;
}

interface AnalyzedIngredient {
  original_name: string;
  matched_name: string | null;
  amount_str: string;
  amount_g: number | null;
  found: boolean;
  source: "json" | "db" | "api" | "not_found";
  confidence: number; // 0-1 arası güven skoru
  nutrients: NutrientData | null;
}

interface CalculateNutritionResponse {
  total: NutrientData;
  per_serving: NutrientData | null;
  ingredients: AnalyzedIngredient[];
  coverage_percent: number; // Kaç malzeme bulundu?
}

// API Endpoint
export const calculateRecipeNutrition = api(
  { expose: true, method: "POST", path: "/nutrition/calculate" },
  async (req: CalculateNutritionRequest): Promise<CalculateNutritionResponse> => {
    // Create Supabase client for this request
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    
    const analyzedIngredients: AnalyzedIngredient[] = [];
    const nutrientsList: NutrientData[] = [];
    
    let foundCount = 0;

    // Her malzemeyi analiz et
    for (const input of req.ingredients) {
      // 1. Miktarı parse et (AI tahmini varsa onu kullan, yoksa manuel parse dene)
      const amountGrams = input.amount_estimated_g || parseAmountToGrams(input.amount, input.name);
      
      // 2. USDA API key al (varsa)
      let apiKey: string | undefined;
      try {
        apiKey = usdaApiKey();
      } catch {
        apiKey = undefined;
      }
      
      // 3. Besin değerlerini ara - önce name_normalized, sonra name_en ile fallback
      const searchName = input.name_normalized || input.name;
      let lookup = await lookupIngredient(searchName, supabase, apiKey);
      
      // Eğer bulunamadıysa ve name_en varsa, İngilizce ile USDA'da ara
      if (!lookup.found && input.name_en && apiKey) {
        lookup = await lookupIngredient(input.name_en, supabase, apiKey);
      }
      
      let nutrients: NutrientData | null = null;
      
      if (lookup.found && lookup.ingredient && amountGrams !== null) {
        // 3. Miktara göre hesapla
        nutrients = calculateNutrients(lookup.ingredient.per_100g, amountGrams);
        nutrientsList.push(nutrients);
        foundCount++;
      }
      
      analyzedIngredients.push({
        original_name: input.name,
        matched_name: lookup.ingredient?.name_tr || lookup.ingredient?.name_en || null,
        amount_str: input.amount,
        amount_g: amountGrams,
        found: lookup.found,
        source: lookup.source,
        confidence: lookup.confidence,
        nutrients
      });
    }

    // 4. Toplam değerleri hesapla
    const total = sumNutrients(nutrientsList);
    
    // 5. Porsiyon başı hesapla
    let perServing: NutrientData | null = null;
    if (req.servings && req.servings > 0) {
      // Toplamları porsiyona böl (basitçe calculateNutrients mantığını ters kullanarak veya bölerek)
      // calculateNutrients 100g baz alıyor, burada direkt bölebiliriz.
      // Ancak NutrientsData keylerini dönmek daha temiz.
      perServing = {} as NutrientData;
      for (const key of Object.keys(total) as (keyof NutrientData)[]) {
        perServing[key] = Math.round((total[key] / req.servings) * 10) / 10;
      }
    }

    return {
      total,
      per_serving: perServing,
      ingredients: analyzedIngredients,
      coverage_percent: req.ingredients.length > 0 
        ? Math.round((foundCount / req.ingredients.length) * 100) 
        : 0
    };
  }
);
