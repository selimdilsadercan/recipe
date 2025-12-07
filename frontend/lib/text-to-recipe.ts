/**
 * Text formatındaki tarifi parse edip yapılandırılmış veriye çevirir.
 * 
 * Beklenen format:
 * - İlk satır: Tarif başlığı
 * - "Malzemeler:" satırından sonra malzeme listesi
 * - "Yapılış:" satırından sonra adımlar (1. 2. 3. şeklinde numaralı)
 * 
 * Boş satırlar ignore edilir.
 */

export interface Ingredient {
  index: number;
  amount: string;
  name: string;
}

export interface Instruction {
  index: number;
  text: string;
}

export interface ParsedRecipe {
  title: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
}

/**
 * Malzeme satırını amount ve name olarak ayırır.
 * Türkçe ölçü birimlerini tanır: g, kg, ml, litre, adet, paket, bardak, 
 * tatlı kaşığı, yemek kaşığı, çay kaşığı, tutam, demet, dilim, etc.
 */
function parseIngredientLine(line: string, index: number): Ingredient {
  const trimmed = line.trim();
  
  // Yaygın Türkçe ölçü birimleri pattern'i
  // Örnek: "125 g", "1 tatlı kaşığı", "yarım paket", "2 adet", "1 su bardağı"
  const unitPatterns = [
    // Kaşık türleri
    /^([\d½¼¾,.\/]+\s*(?:tatlı|yemek|çay|kahve)\s*kaşığı)\s+(.+)$/i,
    // Bardak türleri
    /^([\d½¼¾,.\/]+\s*(?:su|çay)?\s*bardağı?)\s+(.+)$/i,
    // Yarım/çeyrek + birim
    /^(yarım|çeyrek)\s+(paket|bardak|limon|demet|baş)\s+(.+)$/i,
    // Sayı + birim (g, kg, ml, lt, litre, adet, paket, demet, dilim, tutam, diş)
    /^([\d½¼¾,.\/]+\s*(?:g|gr|kg|ml|lt|litre|cl|adet|paket|demet|dilim|tutam|diş|dal|yaprak|avuç))\s+(.+)$/i,
    // Sadece sayı + isim (örn: "2 yumurta")
    /^([\d½¼¾,.\/]+)\s+(.+)$/,
  ];

  // Yarım/çeyrek + birim için özel durum
  const halfQuarterMatch = trimmed.match(/^(yarım|çeyrek)\s+(paket|bardak|limon|demet|baş)\s+(.+)$/i);
  if (halfQuarterMatch) {
    return {
      index,
      amount: `${halfQuarterMatch[1]} ${halfQuarterMatch[2]}`,
      name: halfQuarterMatch[3].trim()
    };
  }

  // Diğer pattern'leri dene
  for (const pattern of unitPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        index,
        amount: match[1].trim(),
        name: match[2].trim()
      };
    }
  }

  // Hiçbir pattern eşleşmezse, tüm satırı name olarak al
  return {
    index,
    amount: "",
    name: trimmed
  };
}

/**
 * Yapılış adımını parse eder.
 * Baştaki numarayı (örn: "1.", "2.") kaldırır.
 */
function parseInstructionLine(line: string, index: number): Instruction {
  const trimmed = line.trim();
  
  // Baştaki numarayı kaldır (örn: "1. ", "2. ", "10. ")
  const withoutNumber = trimmed.replace(/^\d+\.\s*/, "");
  
  return {
    index,
    text: withoutNumber.trim()
  };
}

/**
 * Düz text formatındaki tarifi parse eder.
 * 
 * @param text - Parse edilecek tarif metni
 * @returns ParsedRecipe veya null (format hatalıysa)
 */
export function parseRecipeText(text: string): ParsedRecipe | null {
  if (!text || !text.trim()) {
    return null;
  }

  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return null;
  }

  // "Malzemeler:" ve "Yapılış:" satırlarını bul
  const ingredientsMarkerIndex = lines.findIndex(line => 
    line.toLowerCase().startsWith("malzemeler")
  );
  
  const instructionsMarkerIndex = lines.findIndex(line => 
    line.toLowerCase().startsWith("yapılış")
  );

  // Her iki marker da gerekli
  if (ingredientsMarkerIndex === -1 || instructionsMarkerIndex === -1) {
    return null;
  }

  // Başlık: İlk satırdan "Malzemeler:" satırına kadar (genellikle ilk satır)
  // Eğer Malzemeler ilk satırda değilse, önceki satırlar başlık
  let title = "";
  if (ingredientsMarkerIndex > 0) {
    // İlk satırı başlık olarak al
    title = lines[0];
  }

  // Malzemeler: "Malzemeler:" satırından "Yapılış:" satırına kadar
  const ingredientLines = lines.slice(ingredientsMarkerIndex + 1, instructionsMarkerIndex);
  const ingredients: Ingredient[] = ingredientLines
    .filter(line => line.length > 0 && !line.toLowerCase().startsWith("malzemeler"))
    .map((line, idx) => parseIngredientLine(line, idx + 1));

  // Yapılış: "Yapılış:" satırından sonra
  const instructionLines = lines.slice(instructionsMarkerIndex + 1);
  const instructions: Instruction[] = instructionLines
    .filter(line => line.length > 0 && !line.toLowerCase().startsWith("yapılış"))
    .map((line, idx) => parseInstructionLine(line, idx + 1));

  return {
    title,
    ingredients,
    instructions
  };
}
