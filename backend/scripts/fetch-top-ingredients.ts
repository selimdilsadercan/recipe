/**
 * USDA'dan En Popüler 150 Malzemeyi Çek
 * Bu script USDA API'dan malzeme bilgilerini çeker ve 
 * common-ingredients.ts formatında çıktı verir.
 * 
 * Çalıştır: npx tsx scripts/fetch-top-ingredients.ts
 */

// En çok kullanılan 150 Türk/dünya mutfağı malzemesi
const TOP_INGREDIENTS = [
  // ET VE ET ÜRÜNLERİ (15)
  { tr: "Tavuk göğsü", en: "chicken breast", aliases: ["tavuk göğüs", "göğüs eti"] },
  { tr: "Tavuk but", en: "chicken thigh", aliases: ["but eti", "tavuk budu"] },
  { tr: "Dana kıyma", en: "ground beef", aliases: ["kıyma", "yağlı kıyma", "sığır kıyması"] },
  { tr: "Dana eti", en: "beef", aliases: ["sığır eti", "dana biftek"] },
  { tr: "Kuzu eti", en: "lamb", aliases: ["kuzu but", "kuzu kol"] },
  { tr: "Kuzu kıyma", en: "ground lamb", aliases: ["kuzu kıyması"] },
  { tr: "Hindi göğsü", en: "turkey breast", aliases: ["hindi eti"] },
  { tr: "Sosis", en: "sausage", aliases: ["sucuk benzeri"] },
  { tr: "Pastırma", en: "pastrami", aliases: ["kayseri pastırması"] },
  { tr: "Sucuk", en: "sucuk sausage", aliases: ["kangal sucuk"] },
  { tr: "Köfte", en: "meatball", aliases: ["dana köfte"] },
  { tr: "Ciğer", en: "liver", aliases: ["dana ciğeri", "tavuk ciğeri"] },
  { tr: "Jambon", en: "ham", aliases: ["hindi jambon"] },
  { tr: "Bacon", en: "bacon", aliases: ["domuz pastırması"] },
  { tr: "Biftek", en: "steak", aliases: ["bonfile", "antrikot"] },

  // BALIK VE DENİZ ÜRÜNLERİ (15)
  { tr: "Somon", en: "salmon", aliases: ["somon balığı", "atlantik somonu"] },
  { tr: "Levrek", en: "sea bass", aliases: ["levrek balığı"] },
  { tr: "Çipura", en: "sea bream", aliases: ["çupra"] },
  { tr: "Hamsi", en: "anchovy", aliases: ["taze hamsi"] },
  { tr: "Mezgit", en: "whiting fish", aliases: ["mezgit balığı"] },
  { tr: "Uskumru", en: "mackerel", aliases: ["uskumru balığı"] },
  { tr: "Alabalık", en: "trout", aliases: ["gökkuşağı alabalık"] },
  { tr: "Palamut", en: "bonito", aliases: ["palamut balığı"] },
  { tr: "Karides", en: "shrimp", aliases: ["jumbo karides", "küçük karides"] },
  { tr: "Midye", en: "mussels", aliases: ["kara midye"] },
  { tr: "Kalamar", en: "squid", aliases: ["mürekkep balığı"] },
  { tr: "Ahtapot", en: "octopus", aliases: ["ahtapot kolu"] },
  { tr: "Ton balığı", en: "tuna", aliases: ["ton", "orkinos"] },
  { tr: "Sardalya", en: "sardine", aliases: ["sardalye"] },
  { tr: "Istavrit", en: "horse mackerel", aliases: ["istavrit balığı"] },

  // YUMURTA VE SÜT ÜRÜNLERİ (15)
  { tr: "Yumurta", en: "egg", aliases: ["tavuk yumurtası", "taze yumurta"] },
  { tr: "Tam yağlı süt", en: "whole milk", aliases: ["süt", "inek sütü"] },
  { tr: "Yarım yağlı süt", en: "low fat milk", aliases: ["light süt"] },
  { tr: "Yoğurt", en: "yogurt", aliases: ["sade yoğurt", "tam yağlı yoğurt"] },
  { tr: "Süzme yoğurt", en: "strained yogurt", aliases: ["labne"] },
  { tr: "Beyaz peynir", en: "feta cheese", aliases: ["peynir", "ezine peyniri"] },
  { tr: "Kaşar peyniri", en: "kashkaval cheese", aliases: ["kaşar", "taze kaşar"] },
  { tr: "Lor peyniri", en: "cottage cheese", aliases: ["lor"] },
  { tr: "Tulum peyniri", en: "tulum cheese", aliases: ["eski tulum"] },
  { tr: "Mozzarella", en: "mozzarella cheese", aliases: ["pizza peyniri"] },
  { tr: "Parmesan", en: "parmesan cheese", aliases: ["parmigiano"] },
  { tr: "Krema", en: "heavy cream", aliases: ["sıvı krema", "çırpılmış krema"] },
  { tr: "Tereyağı", en: "butter", aliases: ["tereyağ"] },
  { tr: "Margarin", en: "margarine", aliases: ["bitkisel margarin"] },
  { tr: "Ayran", en: "ayran", aliases: ["tuzlu yoğurt içeceği"] },

  // SEBZELER (30)
  { tr: "Domates", en: "tomato", aliases: ["kırmızı domates", "taze domates"] },
  { tr: "Soğan", en: "onion", aliases: ["kuru soğan", "baş soğan"] },
  { tr: "Sarımsak", en: "garlic", aliases: ["taze sarımsak", "sarımsak dişi"] },
  { tr: "Patates", en: "potato", aliases: ["taze patates", "yer elması"] },
  { tr: "Havuç", en: "carrot", aliases: ["taze havuç"] },
  { tr: "Biber", en: "pepper", aliases: ["yeşil biber", "dolmalık biber"] },
  { tr: "Kırmızı biber", en: "red bell pepper", aliases: ["kapya biber"] },
  { tr: "Patlıcan", en: "eggplant", aliases: ["kemer patlıcan"] },
  { tr: "Kabak", en: "zucchini", aliases: ["sakız kabağı", "yazlık kabak"] },
  { tr: "Salatalık", en: "cucumber", aliases: ["hıyar"] },
  { tr: "Marul", en: "lettuce", aliases: ["kıvırcık marul", "göbek marul"] },
  { tr: "Ispanak", en: "spinach", aliases: ["taze ıspanak"] },
  { tr: "Brokoli", en: "broccoli", aliases: ["brokoli çiçeği"] },
  { tr: "Karnabahar", en: "cauliflower", aliases: ["karnibahar"] },
  { tr: "Lahana", en: "cabbage", aliases: ["beyaz lahana", "kırmızı lahana"] },
  { tr: "Pırasa", en: "leek", aliases: ["taze pırasa"] },
  { tr: "Kereviz", en: "celery", aliases: ["kereviz sapı", "kereviz kökü"] },
  { tr: "Kuşkonmaz", en: "asparagus", aliases: ["taze kuşkonmaz"] },
  { tr: "Bezelye", en: "peas", aliases: ["taze bezelye", "dondurulmuş bezelye"] },
  { tr: "Fasulye", en: "green beans", aliases: ["taze fasulye", "yeşil fasulye"] },
  { tr: "Enginar", en: "artichoke", aliases: ["enginar kalbi"] },
  { tr: "Bamya", en: "okra", aliases: ["taze bamya"] },
  { tr: "Mantar", en: "mushroom", aliases: ["kültür mantarı", "şitaki"] },
  { tr: "Pancar", en: "beet", aliases: ["kırmızı pancar"] },
  { tr: "Turp", en: "radish", aliases: ["kırmızı turp", "beyaz turp"] },
  { tr: "Roka", en: "arugula", aliases: ["taze roka"] },
  { tr: "Maydanoz", en: "parsley", aliases: ["taze maydanoz"] },
  { tr: "Dereotu", en: "dill", aliases: ["taze dereotu"] },
  { tr: "Nane", en: "mint", aliases: ["taze nane", "kuru nane"] },
  { tr: "Fesleğen", en: "basil", aliases: ["taze fesleğen"] },

  // MEYVELER (20)
  { tr: "Elma", en: "apple", aliases: ["taze elma", "kırmızı elma", "yeşil elma"] },
  { tr: "Muz", en: "banana", aliases: ["taze muz"] },
  { tr: "Portakal", en: "orange", aliases: ["taze portakal"] },
  { tr: "Limon", en: "lemon", aliases: ["taze limon"] },
  { tr: "Çilek", en: "strawberry", aliases: ["taze çilek"] },
  { tr: "Üzüm", en: "grapes", aliases: ["taze üzüm", "siyah üzüm"] },
  { tr: "Karpuz", en: "watermelon", aliases: ["taze karpuz"] },
  { tr: "Kavun", en: "melon", aliases: ["taze kavun"] },
  { tr: "Şeftali", en: "peach", aliases: ["taze şeftali"] },
  { tr: "Kayısı", en: "apricot", aliases: ["taze kayısı"] },
  { tr: "Kiraz", en: "cherry", aliases: ["taze kiraz"] },
  { tr: "Vişne", en: "sour cherry", aliases: ["taze vişne"] },
  { tr: "Erik", en: "plum", aliases: ["taze erik", "mürdüm eriği"] },
  { tr: "Armut", en: "pear", aliases: ["taze armut"] },
  { tr: "Nar", en: "pomegranate", aliases: ["taze nar"] },
  { tr: "İncir", en: "fig", aliases: ["taze incir", "kuru incir"] },
  { tr: "Hurma", en: "dates", aliases: ["kuru hurma"] },
  { tr: "Avokado", en: "avocado", aliases: ["taze avokado"] },
  { tr: "Mango", en: "mango", aliases: ["taze mango"] },
  { tr: "Ananas", en: "pineapple", aliases: ["taze ananas"] },

  // TAHILLAR VE BAKLİYAT (20)
  { tr: "Pirinç", en: "rice", aliases: ["beyaz pirinç", "baldo", "basmati"] },
  { tr: "Bulgur", en: "bulgur", aliases: ["pilavlık bulgur", "köftelik bulgur"] },
  { tr: "Un", en: "flour", aliases: ["buğday unu", "beyaz un"] },
  { tr: "Makarna", en: "pasta", aliases: ["spagetti", "penne", "erişte"] },
  { tr: "Nohut", en: "chickpeas", aliases: ["kuru nohut"] },
  { tr: "Mercimek", en: "lentils", aliases: ["yeşil mercimek", "kırmızı mercimek"] },
  { tr: "Kuru fasulye", en: "white beans", aliases: ["beyaz fasulye"] },
  { tr: "Barbunya", en: "borlotti beans", aliases: ["barbunya fasulye"] },
  { tr: "Börülce", en: "black eyed peas", aliases: ["göz fasulye"] },
  { tr: "Yulaf", en: "oats", aliases: ["yulaf ezmesi", "rolled oats"] },
  { tr: "Kinoa", en: "quinoa", aliases: ["beyaz kinoa"] },
  { tr: "Kuskus", en: "couscous", aliases: ["ince kuskus"] },
  { tr: "Mısır", en: "corn", aliases: ["taze mısır", "konserve mısır"] },
  { tr: "Ekmek", en: "bread", aliases: ["beyaz ekmek", "tam buğday ekmek"] },
  { tr: "Pirinç unu", en: "rice flour", aliases: ["pirinç nişastası"] },
  { tr: "Mısır unu", en: "corn flour", aliases: ["mısır nişastası"] },
  { tr: "Galeta unu", en: "breadcrumbs", aliases: ["galeta"] },
  { tr: "Maya", en: "yeast", aliases: ["instant maya", "kuru maya"] },
  { tr: "Kabartma tozu", en: "baking powder", aliases: ["kabartıcı"] },
  { tr: "Karbonat", en: "baking soda", aliases: ["yemek sodası"] },

  // YAĞLAR VE SOSLAR (10)
  { tr: "Zeytinyağı", en: "olive oil", aliases: ["sızma zeytinyağı", "riviera"] },
  { tr: "Ayçiçek yağı", en: "sunflower oil", aliases: ["bitkisel yağ"] },
  { tr: "Mısır yağı", en: "corn oil", aliases: ["mısırözü yağı"] },
  { tr: "Susam yağı", en: "sesame oil", aliases: ["koyu susam yağı"] },
  { tr: "Hindistan cevizi yağı", en: "coconut oil", aliases: ["sıvı hindistan cevizi"] },
  { tr: "Ketçap", en: "ketchup", aliases: ["domates sosu"] },
  { tr: "Mayonez", en: "mayonnaise", aliases: ["mayo"] },
  { tr: "Hardal", en: "mustard", aliases: ["dijon hardal"] },
  { tr: "Soya sosu", en: "soy sauce", aliases: ["shoyu"] },
  { tr: "Sirke", en: "vinegar", aliases: ["elma sirkesi", "üzüm sirkesi"] },

  // BAHARATLAR (15)
  { tr: "Tuz", en: "salt", aliases: ["sofra tuzu", "deniz tuzu"] },
  { tr: "Karabiber", en: "black pepper", aliases: ["toz karabiber"] },
  { tr: "Pul biber", en: "red pepper flakes", aliases: ["kırmızı pul biber"] },
  { tr: "Kimyon", en: "cumin", aliases: ["toz kimyon"] },
  { tr: "Kekik", en: "thyme", aliases: ["kuru kekik"] },
  { tr: "Defne yaprağı", en: "bay leaves", aliases: ["defne"] },
  { tr: "Tarçın", en: "cinnamon", aliases: ["toz tarçın", "tarçın çubuğu"] },
  { tr: "Zencefil", en: "ginger", aliases: ["taze zencefil", "toz zencefil"] },
  { tr: "Zerdeçal", en: "turmeric", aliases: ["toz zerdeçal"] },
  { tr: "Sumak", en: "sumac", aliases: ["ekşi sumak"] },
  { tr: "Köri", en: "curry powder", aliases: ["köri tozu"] },
  { tr: "Muskat", en: "nutmeg", aliases: ["hindistan cevizi"] },
  { tr: "Karanfil", en: "cloves", aliases: ["tane karanfil"] },
  { tr: "Safran", en: "saffron", aliases: ["safran ipliği"] },
  { tr: "Vanilya", en: "vanilla", aliases: ["vanilya özü", "vanilya çubuğu"] },

  // TATLANDIRICLAR VE DİĞER (10)
  { tr: "Şeker", en: "sugar", aliases: ["toz şeker", "kristal şeker"] },
  { tr: "Bal", en: "honey", aliases: ["çiçek balı", "süzme bal"] },
  { tr: "Pekmez", en: "molasses", aliases: ["üzüm pekmezi", "dut pekmezi"] },
  { tr: "Tahin", en: "tahini", aliases: ["susam ezmesi"] },
  { tr: "Fındık", en: "hazelnut", aliases: ["çiğ fındık", "kavrulmuş fındık"] },
  { tr: "Ceviz", en: "walnut", aliases: ["çiğ ceviz"] },
  { tr: "Badem", en: "almond", aliases: ["çiğ badem", "badem unu"] },
  { tr: "Antep fıstığı", en: "pistachio", aliases: ["fıstık"] },
  { tr: "Su", en: "water", aliases: ["içme suyu"] },
  { tr: "Kakao", en: "cocoa powder", aliases: ["toz kakao"] },
];

console.log(`Toplam ${TOP_INGREDIENTS.length} malzeme tanımlı.`);

// USDA API'dan besin değerlerini çek
const USDA_API_KEY = "3FxdSkKl2lP6WWk7T22L8iNHKmZmRs1ylrClEYvE";
const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

interface NutrientData {
  calories: number; protein: number; fat: number; carbs: number;
  fiber: number; sugar: number; cholesterol: number;
  vitamin_a: number; vitamin_c: number; vitamin_d: number;
  vitamin_e: number; vitamin_k: number; thiamin: number;
  riboflavin: number; niacin: number; vitamin_b6: number;
  vitamin_b12: number; calcium: number; iron: number;
  magnesium: number; phosphorus: number; potassium: number;
  sodium: number; zinc: number; copper: number;
  manganese: number; selenium: number;
}

const NUTRIENT_MAP: Record<number, keyof NutrientData> = {
  1008: "calories", 1003: "protein", 1004: "fat", 1005: "carbs",
  1079: "fiber", 2000: "sugar", 1253: "cholesterol",
  1106: "vitamin_a", 1162: "vitamin_c", 1114: "vitamin_d",
  1109: "vitamin_e", 1185: "vitamin_k", 1165: "thiamin",
  1166: "riboflavin", 1167: "niacin", 1175: "vitamin_b6",
  1178: "vitamin_b12", 1087: "calcium", 1089: "iron",
  1090: "magnesium", 1091: "phosphorus", 1092: "potassium",
  1093: "sodium", 1095: "zinc", 1098: "copper",
  1101: "manganese", 1103: "selenium",
};

async function fetchIngredient(item: typeof TOP_INGREDIENTS[0]) {
  const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: item.en,
      dataType: ["SR Legacy", "Foundation"],
      pageSize: 1,
    }),
  });

  const data = await response.json() as any;
  
  if (data.foods && data.foods.length > 0) {
    const food = data.foods[0];
    const nutrients: NutrientData = {
      calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, cholesterol: 0,
      vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_e: 0, vitamin_k: 0,
      thiamin: 0, riboflavin: 0, niacin: 0, vitamin_b6: 0, vitamin_b12: 0,
      calcium: 0, iron: 0, magnesium: 0, phosphorus: 0, potassium: 0,
      sodium: 0, zinc: 0, copper: 0, manganese: 0, selenium: 0,
    };

    if (food.foodNutrients) {
      for (const n of food.foodNutrients) {
        const key = NUTRIENT_MAP[n.nutrientId];
        if (key) nutrients[key] = Math.round(n.value * 100) / 100;
      }
    }

    return {
      id: `${item.en.replace(/\s+/g, '-').toLowerCase()}`,
      fdc_id: food.fdcId,
      name_en: food.description,
      name_tr: item.tr,
      aliases_tr: item.aliases,
      category: "food",
      per_100g: nutrients,
    };
  }
  return null;
}

import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const cwd = process.cwd();
  console.log(`Current Working Directory: ${cwd}`);
  
  const logFile = path.join(cwd, 'lib', 'fetch.log');
  const outFile = path.join(cwd, 'lib', 'generated-ingredients.json');
  
  try {
    fs.writeFileSync(logFile, "Starting fetch...\n");
    fs.appendFileSync(logFile, `CWD: ${cwd}\n`);
    fs.writeFileSync(outFile, "[\n"); // Start JSON array
  } catch (err) {
    console.error(`Cannot write to ${logFile} or ${outFile}:`, err);
    process.exit(1);
  }
  
  console.log(`USDA'dan besin değerleri çekiliyor... (Logs: ${logFile})\n`);
  
  let success = 0;
  let failed = 0;
  let first = true;
  
  for (let i = 0; i < TOP_INGREDIENTS.length; i++) {
    const item = TOP_INGREDIENTS[i];
    const msg = `[${i+1}/${TOP_INGREDIENTS.length}] ${item.tr}`;
    console.log(msg + "...");
    fs.appendFileSync(logFile, msg + "...\n");
    
    try {
      const result = await fetchIngredient(item);
      if (result) {
        console.log("✓ Found");
        fs.appendFileSync(logFile, "✓ Found\n");
        
        // Append to JSON file
        const comma = first ? "" : ",\n";
        fs.appendFileSync(outFile, comma + JSON.stringify(result, null, 2));
        first = false;
        
        success++;
      } else {
        console.log("✗ Not Found");
        fs.appendFileSync(logFile, "✗ Not Found\n");
        failed++;
      }
    } catch (err) {
      console.log("✗ Error");
      fs.appendFileSync(logFile, `✗ Error: ${err}\n`);
      failed++;
    }
    
    // Rate limit delay
    await new Promise(r => setTimeout(r, 1500)); // 1.5s delay
  }
  
  fs.appendFileSync(outFile, "\n]"); // End JSON array
  fs.appendFileSync(logFile, `\nCompleted: ${success} success, ${failed} failed.\n`);
  console.log(`\nCompleted. Check ${outFile}`);
}

main().catch((err) => {
  require('fs').appendFileSync('lib/fetch.log', `Critical error: ${err}\n`);
  console.error("Critical error:", err);
});
