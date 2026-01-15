import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { parseRecipeWithLLM, ParsedRecipe, ParseResult, ParseError } from "../lib/gemini-client";

const geminiApiKey = secret("GeminiApiKey");

// Simple in-memory rate limiting (per IP would be better but this works for MVP)
// Reset every minute
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 30; // Global limit: ~500 users * 3-4 requests/day average

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    requestCount = 0;
    lastResetTime = now;
  }
  requestCount++;
  return requestCount <= MAX_REQUESTS_PER_MINUTE;
}

interface ParseRecipeRequest {
  text: string;
}

interface ParseRecipeResponse {
  success: boolean;
  recipe: ParsedRecipe | null;
  error?: ParseError;
  errorMessage?: string;
}

export const parseRecipe = api(
  { expose: true, method: "POST", path: "/recipe/parse" },
  async (req: ParseRecipeRequest): Promise<ParseRecipeResponse> => {
    // Rate limiting temporarily disabled for cloud environment
    // TODO: Implement Redis-based rate limiting for production
    // if (!checkRateLimit()) {
    //   return { 
    //     success: false,
    //     recipe: null, 
    //     error: "RATE_LIMITED",
    //     errorMessage: "Çok fazla istek. Lütfen 1 dakika bekleyin."
    //   };
    // }

    // Validate input
    if (!req.text || req.text.trim().length === 0) {
      return { 
        success: false,
        recipe: null, 
        error: "EMPTY_TEXT",
        errorMessage: "Tarif metni boş olamaz."
      };
    }

    // Limit text length to prevent abuse
    if (req.text.length > 10000) {
      return {
        success: false,
        recipe: null,
        error: "UNKNOWN",
        errorMessage: "Metin çok uzun. Maksimum 10.000 karakter."
      };
    }

    try {
      const result = await parseRecipeWithLLM(req.text, geminiApiKey());
      
      return {
        success: result.success,
        recipe: result.recipe || null,
        error: result.error,
        errorMessage: result.errorMessage
      };
    } catch (error) {
      console.error("Parse endpoint error:", error);
      return { 
        success: false,
        recipe: null, 
        error: "UNKNOWN",
        errorMessage: "Sunucu hatası oluştu."
      };
    }
  }
);
