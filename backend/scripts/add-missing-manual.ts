
/**
 * Eksik Malzemeleri Manuel Ekleme Scripti
 * 
 * Ayran, Palamut ve Galeta Ununu ekler.
 */

const USDA_API_KEY = "3FxdSkKl2lP6WWk7T22L8iNHKmZmRs1ylrClEYvE";
const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

const MANUAL_ITEMS = [
  // { id: "ayran", ... }, // Already added
  // { id: "breadcrumbs", ... }, // Already added
  // { id: "bonito", ... }, // Already added
  { id: "sunflower_oil", fdc_id: 172336, tr: "Sıvı Yağ", en: "Oil, sunflower", aliases: ["ayçiçek yağı", "kızartma yağı", "siviyag"] },
  { id: "curry_powder", fdc_id: 170924, tr: "Köri", en: "Spices, curry powder", aliases: ["kori", "köri baharatı"] },
  // { id: "chicken_breast", fdc_id: 171140, tr: "Tavuk Göğsü", en: "Chicken, breast, raw", aliases: ["tavuk gogsu"] } // Zaten var ama emin olmak için eklenebilir
];

// Besin haritası (kopyalandı)
const NUTRIENT_MAP: Record<number, string> = {
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

async function fetchDetails(fdcId: number) {
  const response = await fetch(`${USDA_API_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`);
  if (!response.ok) return null;
  return await response.json();
}

import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("Manuel malzemeler ekleniyor...");
  const tsPath = path.join(process.cwd(), 'lib/common-ingredients.ts');
  
  const newIngredients = [];
  
  for (const item of MANUAL_ITEMS) {
    console.log(`Fetching ${item.tr} (${item.fdc_id})...`);
    try {
        const food = await fetchDetails(item.fdc_id) as any;
        if (food) {
             const nutrients: any = {
              calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, cholesterol: 0,
              vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_e: 0, vitamin_k: 0,
              thiamin: 0, riboflavin: 0, niacin: 0, vitamin_b6: 0, vitamin_b12: 0,
              calcium: 0, iron: 0, magnesium: 0, phosphorus: 0, potassium: 0,
              sodium: 0, zinc: 0, copper: 0, manganese: 0, selenium: 0,
            };

            if (food.foodNutrients) {
              for (const n of food.foodNutrients) {
                // Branded foods have nutrients under "nutrient" obj sometimes, or direct.
                // Endpoint /food/{id} format is slightly different than search.
                const nutId = n.nutrient?.id || n.nutrientId;
                const val = n.amount !== undefined ? n.amount : n.value;
                
                const key = NUTRIENT_MAP[nutId];
                if (key && val !== undefined) {
                    nutrients[key] = Math.round(val * 100) / 100;
                }
              }
            }
            
            newIngredients.push({
                id: item.id,
                fdc_id: food.fdcId,
                name_en: food.description,
                name_tr: item.tr,
                aliases_tr: item.aliases,
                category: "manual_added",
                per_100g: nutrients
            });
            console.log("✓ Ok");
        } else {
            console.log("✗ Failed to fetch details");
        }
    } catch (e) {
        console.log(`✗ Error: ${e}`);
    }
  }
  
  if (newIngredients.length > 0) {
      // Append logic
      const tsContent = fs.readFileSync(tsPath, 'utf8');
      
      // Find the closing bracket of the array
      const lastBracket = tsContent.lastIndexOf('];');
      if (lastBracket !== -1) {
          const prefix = tsContent.slice(0, lastBracket).trim();
          // Add comma if needed
          const separator = prefix.endsWith(',') ? '\n' : ',\n';
          
          const newJson = JSON.stringify(newIngredients, null, 2);
          // Remove [ and ] from newJson
          const innerJson = newJson.substring(1, newJson.length - 1);
          
          const newContent = prefix + separator + innerJson + '\n];\n';
          fs.writeFileSync(tsPath, newContent);
          console.log(`Added ${newIngredients.length} ingredients to common-ingredients.ts`);
      } else {
          console.error("Could not find closing bracket in common-ingredients.ts");
      }
  }
}

main();
