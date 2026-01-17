import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";

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

// JSON Schema for structured output
const recipeSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "Tarifin başlığı" },
    servings: { type: SchemaType.INTEGER, nullable: true, description: "Kaç kişilik" },
    prep_time: { type: SchemaType.INTEGER, nullable: true, description: "Hazırlık süresi (dakika)" },
    cook_time: { type: SchemaType.INTEGER, nullable: true, description: "Pişirme süresi (dakika)" },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          amount: { type: SchemaType.STRING, description: "Miktar" },
          name: { type: SchemaType.STRING, description: "Malzeme adı" }
        },
        required: ["amount", "name"]
      }
    },
    instructions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          step: { type: SchemaType.INTEGER, description: "Adım numarası" },
          text: { type: SchemaType.STRING, description: "Adım açıklaması" }
        },
        required: ["step", "text"]
      }
    }
  },
  required: ["title", "ingredients", "instructions"]
};

export async function parseRecipeWithLLM(text: string, apiKey: string): Promise<ParseResult> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use JSON mode with schema for guaranteed valid JSON output
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: recipeSchema
      }
    });

    const prompt = `Sen uzman bir şef ve veri analistisin. Aşağıdaki metni analiz et ve yapılandırılmış bir tarif formatına dönüştür.

KURALLAR:

1. MIKTAR FORMATLAMASI:
   - Miktar belirtilmemişse "yeterince" yaz (örn: tuz, karabiber).
   - Kesin dönüşümleri parantez içinde ekle:
     * "yarım kilo" → "yarım kilo (500g)"
     * "çeyrek kilo" → "çeyrek kilo (250g)"
     * "1 kilo" → "1 kilo (1000g)"
     * "yarım litre" → "yarım litre (500ml)"
   - Belirsiz ölçüleri olduğu gibi bırak: "1 su bardağı", "2 yemek kaşığı" (dönüştürme yapma).

2. ADIM SIRALAMASI:
   - Adımları mutfak mantığına göre kronolojik sırala: hazırlık → pişirme → montaj → servis.
   - Metindeki anlatım sırası farklı olsa bile, bir şefin yapacağı mantıksal sırayla düzenle.
   - "step" 1'den başlayarak numaralandır.

3. GEÇERSİZ METİN:
   - Metin tarif değilse: title="Geçersiz Metin", ingredients=[], instructions=[]

4. TÜRKÇE:
   - Tüm Türkçe karakterleri koru: ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü

METİN:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Parse response
    
    // With JSON mode, this should always be valid JSON
    let parsedRaw = JSON.parse(responseText);
    
    // Handle array response (Gemini sometimes returns an array)
    let parsed: ParsedRecipe;
    if (Array.isArray(parsedRaw)) {
      parsed = parsedRaw[0] as ParsedRecipe;
    } else {
      parsed = parsedRaw as ParsedRecipe;
    }
    
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
        errorMessage: "Çok fazla istek gönderildi. Lütfen biraz bekleyin."
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
