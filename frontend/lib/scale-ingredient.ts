/**
 * Malzeme miktarlarını ölçekleme utility'si
 * Porsiyon değiştiğinde miktarları lineer olarak hesaplar
 */

export interface ParsedAmount {
  value: number;
  unit: string;
  original: string;
}

/**
 * Türkçe kesir ifadelerini sayıya çevirir
 */
function parseFraction(str: string): number {
  // Unicode kesirler
  const fractionMap: Record<string, number> = {
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 0.333,
    '⅔': 0.666,
  };

  // Yarım, çeyrek gibi Türkçe ifadeler
  const turkishFractions: Record<string, number> = {
    'yarım': 0.5,
    'yarim': 0.5,
    'çeyrek': 0.25,
    'ceyrek': 0.25,
  };

  const lowerStr = str.toLowerCase().trim();

  // Unicode kesir kontrolü
  for (const [frac, val] of Object.entries(fractionMap)) {
    if (lowerStr.includes(frac)) {
      // "1½" gibi durumlar
      const numPart = lowerStr.replace(frac, '').trim();
      if (numPart) {
        const num = parseFloat(numPart.replace(',', '.'));
        if (!isNaN(num)) return num + val;
      }
      return val;
    }
  }

  // Türkçe kesir kontrolü
  for (const [word, val] of Object.entries(turkishFractions)) {
    if (lowerStr.startsWith(word)) {
      return val;
    }
  }

  // "1/2" gibi slash formatı
  if (lowerStr.includes('/')) {
    const parts = lowerStr.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0].replace(',', '.'));
      const denominator = parseFloat(parts[1].replace(',', '.'));
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
  }

  // Normal sayı
  const num = parseFloat(lowerStr.replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

/**
 * Miktar string'ini sayı ve birime ayırır
 * Örnek: "250 g" → { value: 250, unit: "g" }
 * Örnek: "2 yemek kaşığı" → { value: 2, unit: "yemek kaşığı" }
 */
export function parseAmount(amountString: string | undefined): ParsedAmount | null {
  if (!amountString || amountString.trim() === '') {
    return null;
  }

  const original = amountString.trim();
  
  // Türkçe birim pattern'leri (en spesifikten en genele)
  const unitPatterns = [
    // Kaşık türleri
    /^([\d½¼¾,.\\/]+)\s*(tatlı\s*kaşığı|yemek\s*kaşığı|çay\s*kaşığı|kahve\s*kaşığı)$/i,
    // Bardak türleri
    /^([\d½¼¾,.\\/]+)\s*(su\s*bardağı|çay\s*bardağı|bardak)$/i,
    // Ölçü birimleri
    /^([\d½¼¾,.\\/]+)\s*(g|gr|kg|ml|lt|litre|cl|adet|paket|demet|dilim|tutam|diş|dal|yaprak|avuç|porsiyon|parça|baş|tane)$/i,
    // Sadece sayı (birim yok veya sonraki kelime malzeme adı)
    /^([\d½¼¾,.\\/]+)$/,
  ];

  // Yarım/çeyrek ile başlayan durumlar
  const halfQuarterMatch = original.match(/^(yarım|çeyrek)\s+(paket|bardak|limon|demet|baş|porsiyon)?/i);
  if (halfQuarterMatch) {
    const value = halfQuarterMatch[1].toLowerCase() === 'yarım' || halfQuarterMatch[1].toLowerCase() === 'yarim' ? 0.5 : 0.25;
    const unit = halfQuarterMatch[2] || '';
    return { value, unit, original };
  }

  for (const pattern of unitPatterns) {
    const match = original.match(pattern);
    if (match) {
      const value = parseFraction(match[1]);
      const unit = match[2] || '';
      if (value > 0) {
        return { value, unit, original };
      }
    }
  }

  return null;
}

/**
 * Sayıyı güzel formata çevirir
 * Örnek: 0.5 → "½", 1.5 → "1½", 2.333 → "2.33"
 */
function formatNumber(num: number): string {
  // Tam sayıysa
  if (Number.isInteger(num)) {
    return num.toString();
  }

  // Kesir kısmını kontrol et
  const intPart = Math.floor(num);
  const decPart = num - intPart;

  // Yaygın kesirler
  const fractions: [number, string][] = [
    [0.5, '½'],
    [0.25, '¼'],
    [0.75, '¾'],
    [0.333, '⅓'],
    [0.666, '⅔'],
  ];

  for (const [val, symbol] of fractions) {
    if (Math.abs(decPart - val) < 0.05) {
      return intPart > 0 ? `${intPart}${symbol}` : symbol;
    }
  }

  // Diğer durumlar için ondalık göster
  return num.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Miktarı ölçekler
 * @param originalAmount Orijinal miktar string'i
 * @param scaleFactor Ölçek faktörü (örn: 2 = iki katı)
 * @returns Ölçeklenmiş miktar string'i
 */
export function scaleAmount(originalAmount: string | undefined, scaleFactor: number): string {
  if (!originalAmount || scaleFactor === 1) {
    return originalAmount || '';
  }

  const parsed = parseAmount(originalAmount);
  if (!parsed) {
    return originalAmount || '';
  }

  const scaledValue = parsed.value * scaleFactor;
  const formattedValue = formatNumber(scaledValue);

  // Birim varsa ekle
  if (parsed.unit) {
    return `${formattedValue} ${parsed.unit}`;
  }

  return formattedValue;
}

/**
 * Ölçek faktörünü hesaplar
 * @param currentServings Mevcut porsiyon sayısı
 * @param originalServings Orijinal porsiyon sayısı
 */
export function getScaleFactor(currentServings: number, originalServings: number): number {
  if (originalServings <= 0) return 1;
  return currentServings / originalServings;
}
