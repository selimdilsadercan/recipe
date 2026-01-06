/**
 * Besin Değeri Arama Servisi
 * 3 Katmanlı Mimari: JSON → Supabase DB → USDA API
 */

import { COMMON_INGREDIENTS, type Ingredient, type NutrientData } from "./common-ingredients";
import Fuse from "fuse.js";

// Fuse.js fuzzy search instance with optimized Turkish matching
const fuse = new Fuse(COMMON_INGREDIENTS, {
  keys: [
    { name: "name_tr", weight: 2 },      // Türkçe ad - en yüksek ağırlık
    { name: "aliases_tr", weight: 1.5 }, // Türkçe takma adlar
    { name: "name_en", weight: 0.5 },    // İngilizce ad - düşük ağırlık
  ],
  threshold: 0.35,        // 0.4'ten daha sıkı eşleşme
  includeScore: true,
  ignoreLocation: true,   // String sonundaki eşleşmeleri cezalandırma
  minMatchCharLength: 2,  // Minimum 2 karakter eşleşmeli
  findAllMatches: true,
});

export interface LookupResult {
  found: boolean;
  source: "json" | "db" | "api" | "not_found";
  ingredient: Ingredient | null;
  confidence: number;
}

/**
 * Malzeme adından besin değerlerini bul
 * @param ingredientName - Türkçe veya İngilizce malzeme adı
 * @returns Besin değerleri ve kaynak bilgisi
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase client will be injected from calling service (nutrition.ts)
// This avoids Encore's "secrets must be loaded from within services" error

// USDA API configuration
const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

// USDA nutrient ID mapping to our schema
const USDA_NUTRIENT_MAP: Record<number, keyof NutrientData> = {
  1008: "calories",      // Energy (kcal)
  1003: "protein",       // Protein
  1004: "fat",           // Total lipid (fat)
  1005: "carbs",         // Carbohydrate
  1079: "fiber",         // Fiber, total dietary
  2000: "sugar",         // Sugars, total
  1253: "cholesterol",   // Cholesterol
  1106: "vitamin_a",     // Vitamin A, RAE
  1162: "vitamin_c",     // Vitamin C
  1114: "vitamin_d",     // Vitamin D (D2 + D3)
  1109: "vitamin_e",     // Vitamin E
  1185: "vitamin_k",     // Vitamin K
  1165: "thiamin",       // Thiamin (B1)
  1166: "riboflavin",    // Riboflavin (B2)
  1167: "niacin",        // Niacin (B3)
  1175: "vitamin_b6",    // Vitamin B-6
  1178: "vitamin_b12",   // Vitamin B-12
  1087: "calcium",       // Calcium
  1089: "iron",          // Iron
  1090: "magnesium",     // Magnesium
  1091: "phosphorus",    // Phosphorus
  1092: "potassium",     // Potassium
  1093: "sodium",        // Sodium
  1095: "zinc",          // Zinc
  1098: "copper",        // Copper
  1101: "manganese",     // Manganese
  1103: "selenium",      // Selenium
};

export async function lookupIngredient(
  ingredientName: string,
  supabaseClient?: SupabaseClient,
  usdaApiKey?: string
): Promise<LookupResult> {
  const normalizedName = ingredientName.toLowerCase().trim();
  
  // 1. Katman: JSON'dan ara (hızlı, ücretsiz)
  const jsonResult = searchInJson(normalizedName);
  if (jsonResult.found && jsonResult.confidence > 0.8) {
    return jsonResult;
  }
  
  // 2. Katman: Supabase DB'den ara (sadece client varsa)
  if (supabaseClient) {
    const dbResult = await searchInDatabase(normalizedName, supabaseClient);
    if (dbResult.found) {
      // JSON sonucu varsa ama güveni düşükse, DB sonucuyla karşılaştır
      if (jsonResult.found && jsonResult.confidence > dbResult.confidence) {
        return jsonResult;
      }
      return dbResult;
    }
  }
  
  // 3. Katman: USDA API (nadir malzemeler için)
  if (usdaApiKey) {
    const apiResult = await searchInUSDAApi(normalizedName, usdaApiKey);
    if (apiResult.found) {
      return apiResult;
    }
  }
  
  // Bulunamadıysa en iyi JSON tahminini döndür (eğer varsa)
  if (jsonResult.found) {
    return jsonResult;
  }
  
  return {
    found: false,
    source: "not_found",
    ingredient: null,
    confidence: 0,
  };
}

// ... searchInJson ...

/**
 * Supabase veritabanından arama (RPC veya Text Search)
 */
async function searchInDatabase(
  query: string,
  client: SupabaseClient
): Promise<LookupResult> {
  try {
    // RPC fonksiyonunu çağır (bkz: create_ingredients_hybrid.sql)
    const { data, error } = await client.rpc('search_ingredients', { 
      search_query: query,
      limit_count: 1 
    });

    if (error) {
      console.error("Supabase search error:", error);
      return { found: false, source: "db", ingredient: null, confidence: 0 };
    }

    if (data && data.length > 0) {
      const item = data[0];
      
      // DB Hibrit şemasını Ingredient arayüzüne çevir
      const ingredient: Ingredient = {
        id: item.id,
        fdc_id: item.fdc_id,
        name_en: item.name_en,
        name_tr: item.name_tr || item.name_en, // Türkçe yoksa İngilizce kullan
        aliases_tr: [], // DB'den alias gelmiyor şimdilik
        category: item.category,
        per_100g: {
          // Kolonlardan gelenler
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          fat: Number(item.fat) || 0,
          carbs: Number(item.carbs) || 0,
          fiber: Number(item.fiber) || 0,
          sugar: Number(item.sugar) || 0,
          cholesterol: Number(item.cholesterol) || 0,
          
          // JSONB'den gelenler (micros)
          // Not: Supabase JSON keyleri string döner, cast etmek gerekebilir
          vitamin_a: Number(item.micros?.vitamin_a) || 0,
          vitamin_c: Number(item.micros?.vitamin_c) || 0,
          vitamin_d: Number(item.micros?.vitamin_d) || 0,
          vitamin_e: Number(item.micros?.vitamin_e) || 0,
          vitamin_k: Number(item.micros?.vitamin_k) || 0,
          thiamin: Number(item.micros?.thiamin) || 0,
          riboflavin: Number(item.micros?.riboflavin) || 0,
          niacin: Number(item.micros?.niacin) || 0,
          vitamin_b6: Number(item.micros?.vitamin_b6) || 0,
          vitamin_b12: Number(item.micros?.vitamin_b12) || 0,
          calcium: Number(item.micros?.calcium) || 0,
          iron: Number(item.micros?.iron) || 0,
          magnesium: Number(item.micros?.magnesium) || 0,
          phosphorus: Number(item.micros?.phosphorus) || 0,
          potassium: Number(item.micros?.potassium) || 0,
          sodium: Number(item.micros?.sodium) || 0,
          zinc: Number(item.micros?.zinc) || 0,
          copper: Number(item.micros?.copper) || 0,
          manganese: Number(item.micros?.manganese) || 0,
          selenium: Number(item.micros?.selenium) || 0,
        }
      };

      return {
        found: true,
        source: "db",
        ingredient,
        confidence: 0.9 // DB eşleşmesi genellikle güvenilirdir (kelime bazlı)
      };
    }
    
    return { found: false, source: "db", ingredient: null, confidence: 0 };
    
  } catch (err) {
    console.error("Search exception:", err);
    return { found: false, source: "db", ingredient: null, confidence: 0 };
  }
}

/**
 * USDA FoodData Central API'den arama (3. katman fallback)
 */
async function searchInUSDAApi(query: string, apiKey: string): Promise<LookupResult> {
  try {
    const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        // Search all data types (SR Legacy, Foundation, Branded, etc.)
        pageSize: 1,
        pageNumber: 1,
      }),
    });

    if (!response.ok) {
      console.error("USDA API error:", response.status, response.statusText);
      return { found: false, source: "api", ingredient: null, confidence: 0 };
    }

    const data = await response.json() as { foods?: Array<{ fdcId: number; description: string; foodNutrients?: Array<{ nutrientId: number; value: number }> }> };
    
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      
      // Extract nutrients from USDA format
      const nutrients: NutrientData = {
        calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, cholesterol: 0,
        vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_e: 0, vitamin_k: 0,
        thiamin: 0, riboflavin: 0, niacin: 0, vitamin_b6: 0, vitamin_b12: 0,
        calcium: 0, iron: 0, magnesium: 0, phosphorus: 0, potassium: 0,
        sodium: 0, zinc: 0, copper: 0, manganese: 0, selenium: 0,
      };

      // Map USDA nutrients to our schema
      if (food.foodNutrients) {
        for (const nutrient of food.foodNutrients) {
          const key = USDA_NUTRIENT_MAP[nutrient.nutrientId];
          if (key && nutrient.value !== undefined) {
            nutrients[key] = nutrient.value;
          }
        }
      }

      const ingredient: Ingredient = {
        id: `usda-${food.fdcId}`,
        fdc_id: food.fdcId,
        name_en: food.description || query,
        name_tr: food.description || query, // USDA doesn't have Turkish names
        aliases_tr: [],
        category: "usda",
        per_100g: nutrients,
      };

      return {
        found: true,
        source: "api",
        ingredient,
        confidence: 0.7, // API sonuçları her zaman tam güvenilir değil
      };
    }

    return { found: false, source: "api", ingredient: null, confidence: 0 };
  } catch (err) {
    console.error("USDA API exception:", err);
    return { found: false, source: "api", ingredient: null, confidence: 0 };
  }
}

/**
 * JSON veritabanından fuzzy arama
 */
function searchInJson(query: string): LookupResult {
  // Önce tam eşleşme dene
  const exactMatch = COMMON_INGREDIENTS.find(
    (ing) =>
      ing.name_tr.toLowerCase() === query ||
      ing.aliases_tr.some((alias) => alias.toLowerCase() === query)
  );
  
  if (exactMatch) {
    return {
      found: true,
      source: "json",
      ingredient: exactMatch,
      confidence: 1.0,
    };
  }
  
  // Fuzzy arama
  const results = fuse.search(query);
  
  if (results.length > 0 && results[0].score !== undefined) {
    const bestMatch = results[0];
    const confidence = 1 - bestMatch.score; // Fuse score tersine çevir
    
    return {
      found: true,
      source: "json",
      ingredient: bestMatch.item,
      confidence,
    };
  }
  
  return {
    found: false,
    source: "not_found",
    ingredient: null,
    confidence: 0,
  };
}

/**
 * Besin değerlerini miktara göre hesapla
 * @param nutrients - 100g başına besin değerleri
 * @param amountGrams - Gram cinsinden miktar
 */
export function calculateNutrients(
  nutrients: NutrientData,
  amountGrams: number
): NutrientData {
  const factor = amountGrams / 100;
  
  return {
    calories: Math.round(nutrients.calories * factor * 10) / 10,
    protein: Math.round(nutrients.protein * factor * 10) / 10,
    fat: Math.round(nutrients.fat * factor * 10) / 10,
    carbs: Math.round(nutrients.carbs * factor * 10) / 10,
    fiber: Math.round(nutrients.fiber * factor * 10) / 10,
    sugar: Math.round(nutrients.sugar * factor * 10) / 10,
    cholesterol: Math.round(nutrients.cholesterol * factor * 10) / 10,
    vitamin_a: Math.round(nutrients.vitamin_a * factor * 10) / 10,
    vitamin_c: Math.round(nutrients.vitamin_c * factor * 10) / 10,
    vitamin_d: Math.round(nutrients.vitamin_d * factor * 10) / 10,
    vitamin_e: Math.round(nutrients.vitamin_e * factor * 10) / 10,
    vitamin_k: Math.round(nutrients.vitamin_k * factor * 10) / 10,
    thiamin: Math.round(nutrients.thiamin * factor * 100) / 100,
    riboflavin: Math.round(nutrients.riboflavin * factor * 100) / 100,
    niacin: Math.round(nutrients.niacin * factor * 10) / 10,
    vitamin_b6: Math.round(nutrients.vitamin_b6 * factor * 100) / 100,
    vitamin_b12: Math.round(nutrients.vitamin_b12 * factor * 10) / 10,
    calcium: Math.round(nutrients.calcium * factor * 10) / 10,
    iron: Math.round(nutrients.iron * factor * 10) / 10,
    magnesium: Math.round(nutrients.magnesium * factor * 10) / 10,
    phosphorus: Math.round(nutrients.phosphorus * factor * 10) / 10,
    potassium: Math.round(nutrients.potassium * factor * 10) / 10,
    sodium: Math.round(nutrients.sodium * factor * 10) / 10,
    zinc: Math.round(nutrients.zinc * factor * 10) / 10,
    copper: Math.round(nutrients.copper * factor * 100) / 100,
    manganese: Math.round(nutrients.manganese * factor * 100) / 100,
    selenium: Math.round(nutrients.selenium * factor * 10) / 10,
  };
}

/**
 * Birden fazla malzemenin besin değerlerini topla
 */
export function sumNutrients(nutrientsList: NutrientData[]): NutrientData {
  const sum: NutrientData = {
    calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, cholesterol: 0,
    vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_e: 0, vitamin_k: 0,
    thiamin: 0, riboflavin: 0, niacin: 0, vitamin_b6: 0, vitamin_b12: 0,
    calcium: 0, iron: 0, magnesium: 0, phosphorus: 0, potassium: 0, sodium: 0,
    zinc: 0, copper: 0, manganese: 0, selenium: 0,
  };
  
  for (const nutrients of nutrientsList) {
    for (const key of Object.keys(sum) as (keyof NutrientData)[]) {
      sum[key] += nutrients[key];
    }
  }
  
  // Yuvarla
  for (const key of Object.keys(sum) as (keyof NutrientData)[]) {
    sum[key] = Math.round(sum[key] * 10) / 10;
  }
  
  return sum;
}

/**
 * Miktar string'inden gram değeri çıkar
 * Örnek: "250 g" → 250, "1 su bardağı" → 240
 */
export function parseAmountToGrams(amountString: string, ingredientName?: string): number | null {
  if (!amountString) return null;
  
  const normalized = amountString.toLowerCase().trim();
  
  // Yaygın birim dönüşümleri (gram cinsinden)
  const unitConversions: Record<string, number> = {
    // Gram türevleri
    "g": 1,
    "gr": 1,
    "gram": 1,
    "kg": 1000,
    "kilogram": 1000,
    
    // Litre türevleri (su için yaklaşık)
    "ml": 1,
    "lt": 1000,
    "litre": 1000,
    "cl": 10,
    
    // Bardak türleri
    "su bardağı": 240,
    "çay bardağı": 150,
    "bardak": 240,
    
    // Kaşık türleri
    "yemek kaşığı": 15,
    "tatlı kaşığı": 10,
    "çay kaşığı": 5,
    "kahve kaşığı": 2,
    
    // Diğer
    "adet": 50, // Ortalama
    "dilim": 30,
    "tutam": 1,
    "diş": 5, // Sarımsak için
    "dal": 5,
    "demet": 50,
    "avuç": 30,
  };
  
  // Sayı + birim pattern
  const match = normalized.match(/^([\d,.½¼¾\/]+)\s*(.+)$/);
  
  if (match) {
    let value = parseNumber(match[1]);
    const unit = match[2].trim();
    
    // Birim dönüşümü
    for (const [unitKey, grams] of Object.entries(unitConversions)) {
      if (unit.includes(unitKey)) {
        return Math.round(value * grams);
      }
    }
    
    // Birim bulunamazsa gram olarak varsay
    return Math.round(value);
  }
  
  return null;
}

/**
 * Türkçe sayı ifadelerini parse et
 * "1/2" → 0.5, "½" → 0.5, "1,5" → 1.5
 */
function parseNumber(str: string): number {
  // Unicode fractions
  const fractionMap: Record<string, number> = {
    "½": 0.5,
    "¼": 0.25,
    "¾": 0.75,
  };
  
  for (const [fraction, value] of Object.entries(fractionMap)) {
    if (str.includes(fraction)) {
      const rest = str.replace(fraction, "").trim();
      return (rest ? parseFloat(rest.replace(",", ".")) : 0) + value;
    }
  }
  
  // "/" fraction
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 2) {
      return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
  }
  
  // Normal number
  return parseFloat(str.replace(",", ".")) || 0;
}
