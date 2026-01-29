import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { parseRecipeWithLLM, ParsedRecipe, ParseResult, ParseError } from "../lib/openai-client";

// Secrets for Qwen/OpenAI compatible provider
// Note: If these secrets are not set in Encore dashboard, it might throw an error at runtime or build time.
// We only require API Key now, Base URL maps to Alibaba Cloud default in the client.
const qwenApiKey = secret("QwenApiKey");

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
      // Pass the secrets to the client
      const apiKey = qwenApiKey();
      
      // We rely on the default Alibaba Cloud URL defined in openai-client.ts
      const result = await parseRecipeWithLLM(req.text, apiKey);
      
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
