import { GoogleGenerativeAI } from "@google/generative-ai";

// Types
export interface ParsedRecipe {
  title: string;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  ingredients: { amount: string; name: string }[];
  instructions: { step: number; text: string }[];
}

// Error types for better user feedback
export type ParseError = 
  | "EMPTY_TEXT"
  | "NOT_A_RECIPE"
  | "INVALID_JSON"
  | "API_ERROR"
  | "RATE_LIMITED"
  | "UNKNOWN";

export interface ParseResult {
  success: boolean;
  recipe?: ParsedRecipe;
  error?: ParseError;
  errorMessage?: string;
}

export async function parseRecipeWithLLM(text: string, apiKey: string): Promise<ParseResult> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use JSON mode for guaranteed valid JSON output
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { 
        responseMimeType: "application/json"
      }
    });

    const prompt = `Sen uzman bir şef ve veri analistisin. Aşağıdaki metni analiz et ve yapılandırılmış bir tarif formatına dönüştür.

Aşağıdaki JSON şemasına UYGUN olarak döndür:

{
  "title": "string (tarif başlığı, bulunamazsa 'Adsız Tarif')",
  "servings": "number veya null (kaç kişilik)",
  "prep_time": "number veya null (hazırlık süresi dakika)",
  "cook_time": "number veya null (pişirme süresi dakika)",
  "ingredients": [
    { "amount": "string (miktar, örn: '2 yemek kaşığı')", "name": "string (malzeme adı)" }
  ],
  "instructions": [
    { "step": 1, "text": "string (adım açıklaması)" }
  ]
}

KURALLAR:
1. "amount" her zaman string olmalı. Miktar yoksa boş string "" kullan.
2. "step" 1'den başlayarak numaralandır.
3. Metin tarif değilse, title: "Geçersiz Metin" ve boş array'ler döndür.
4. Türkçe karakterleri koru.

METİN:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // With JSON mode, this should always be valid JSON
    const parsed = JSON.parse(responseText) as ParsedRecipe;
    
    // Validate basic structure
    if (!parsed.ingredients || !Array.isArray(parsed.ingredients)) {
      parsed.ingredients = [];
    }
    if (!parsed.instructions || !Array.isArray(parsed.instructions)) {
      parsed.instructions = [];
    }
    
    // Check if it's actually a recipe
    if (parsed.title === "Geçersiz Metin" || 
        (parsed.ingredients.length === 0 && parsed.instructions.length === 0)) {
      return {
        success: false,
        error: "NOT_A_RECIPE",
        errorMessage: "Bu metin bir tarif içermiyor gibi görünüyor."
      };
    }
    
    return { success: true, recipe: parsed };
    
  } catch (error: any) {
    // Log the FULL error details to see what's really happening
    console.error("Gemini Parse Error - Full Details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    // Categorize errors for better user feedback
    if (error.message?.includes("quota") || error.message?.includes("rate")) {
      return {
        success: false,
        error: "RATE_LIMITED",
        errorMessage: `Çok fazla istek gönderildi. Lütfen biraz bekleyin. [Debug: ${error.message}]`
      };
    }
    
    if (error.message?.includes("API key")) {
      return {
        success: false,
        error: "API_ERROR",
        errorMessage: "Sunucu yapılandırma hatası."
      };
    }
    
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: "INVALID_JSON",
        errorMessage: "Tarif analizi başarısız oldu. Lütfen tekrar deneyin."
      };
    }
    
    return {
      success: false,
      error: "UNKNOWN",
      errorMessage: "Beklenmeyen bir hata oluştu."
    };
  }
}
