import OpenAI from "openai";

// Types
export interface ParsedRecipe {
  title: string;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  ingredients: { 
    amount: string; 
    name: string;
    name_normalized: string;  // Temel gıda adı (niteleyicisiz)
    name_en: string;          // İngilizce karşılık (USDA için)
  }[];
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

// System prompt to guide the model
const SYSTEM_PROMPT = `Sen uzman bir şef ve veri analistisin. Kullanıcının verdiği tarif metnini analiz et ve JSON formatına dönüştür.

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
   - Metin tarif değilse veya anlamsızsa valid bir JSON döndür ama içi boş olsun veya title="Geçersiz Metin" olsun.

4. TÜRKÇE:
   - Tüm Türkçe karakterleri koru: ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü

5. MALZEME NORMALİZASYONU (ÖNEMLİ):
   Her malzeme için 4 alan doldur:
   - name: Orijinal malzeme adı (metinde yazıldığı gibi)
   - name_normalized: Boyut, niteleyici ve miktar ifadeleri KALDIRILMIŞ temel gıda adı
     * "orta boy patlıcan" → "patlıcan"
     * "yağsız dana kıyma" → "dana kıyma"
     * "taze sıkılmış portakal suyu" → "portakal suyu"
     * "közlenmiş kırmızı biber" → "kırmızı biber"
   - name_en: USDA veritabanı için standart İngilizce karşılık
     * "patlıcan" → "eggplant"
     * "dana kıyma" → "ground beef"
     * "domates salçası" → "tomato paste"
     * "badem sütü" → "almond milk"
     * "chia tohumu" → "chia seeds"

ÇIKTI FORMATI (JSON ONLY):
{
  "title": "Tarif Başlığı",
  "servings": 4, // veya null
  "prep_time": 30, // dakika veya null
  "cook_time": 45, // dakika veya null
  "ingredients": [
    { "amount": "2 adet", "name": "orta boy soğan", "name_normalized": "soğan", "name_en": "onion" }
  ],
  "instructions": [
    { "step": 1, "text": "Soğanları küp küp doğrayın." }
  ]
}
`;

// MuleRouter Configuration (mulerouter.ai)
// Using OpenAI-compatible vendor endpoint
// Docs: https://mulerouter.ai/docs/api-reference/introduction
const DEFAULT_BASE_URL = "https://api.mulerouter.ai/vendors/openai/v1";
const DEFAULT_MODEL = "qwen-flash"; // Qwen3 Flash model

export async function parseRecipeWithLLM(text: string, apiKey: string, baseUrl?: string): Promise<ParseResult> {
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl || DEFAULT_BASE_URL,
  });

  // Allow env override, otherwise use Alibaba Cloud default for Qwen Flash
  const MODEL_NAME = process.env.QWEN_MODEL_NAME || DEFAULT_MODEL;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analiz et:\n\n${text}` }
      ],
      response_format: { type: "json_object" }, // Qwen supports JSON mode
      temperature: 0.1, // Low temp for precision
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error("Empty response from AI");
    }

    let parsed: ParsedRecipe;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Retry once if JSON is broken (simple string check or heuristic could apply here)
      console.warn("Invalid JSON from Qwen:", content);
      return {
        success: false,
        error: "INVALID_JSON",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorMessage: "AI geçerli bir JSON üretmedi."
      };
    }

    // Basic structure validation
    if (!parsed.ingredients || !Array.isArray(parsed.ingredients)) {
        parsed.ingredients = [];
    }
    if (!parsed.instructions || !Array.isArray(parsed.instructions)) {
        parsed.instructions = [];
    }
    
    // Check "Not a recipe" cases
    if (parsed.title === "Geçersiz Metin" || 
        (parsed.ingredients.length === 0 && parsed.instructions.length === 0)) {
      return {
        success: false,
        error: "NOT_A_RECIPE",
        errorMessage: "Bu metin bir tarif içermiyor gibi görünüyor."
      };
    }

    return {
      success: true,
      recipe: parsed
    };

  } catch (error: any) {
    console.error("Qwen (Alibaba) Parse Error:", error);

    // Error categorization
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      return {
        success: false,
        error: "RATE_LIMITED",
        errorMessage: "Çok fazla istek. Lütfen bekleyin."
      };
    }
    
    if (error.status === 401) {
       return {
        success: false,
        error: "API_ERROR",
        errorMessage: "API Anahtarı hatası (Yetkilendirme)."
      }; 
    }

    return {
      success: false,
      error: "UNKNOWN",
      errorMessage: "AI servisine erişilemedi: " + (error.message || "Bilinmeyen hata")
    };
  }
}
