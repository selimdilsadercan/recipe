
const USDA_API_KEY = "3FxdSkKl2lP6WWk7T22L8iNHKmZmRs1ylrClEYvE";
const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

const MISSING_ITEMS = [
  { tr: "Ayran", queries: ["ayran", "yogurt drink", "salted yogurt", "drinkable yogurt"] },
  { tr: "Palamut", queries: ["bonito", "fish bonito", "sarda"] },
  { tr: "Galeta Unu", queries: ["breadcrumbs", "bread crumbs", "cracker meal"] },
  // 4. item neydi? Hata mesajında "Palamut, Ayran, Galeta unu" demiş 3 tane. Ama loglarda 4 tane fail vardı. 
  // Loglara bakılırsa; "Palamut" (Bonito), "Ayran", "Galeta unu" (Breadcrumbs) fail olmuş. 
  // Diğer fail olan neydi? Haa, script outputunda:
  // [23] Palamut (bonito) -> Fail
  // [45] Ayran (ayran) -> Fail
  // [112] Galeta unu (breadcrumbs) -> Fail
  // 3 tane görünüyor. Kullanıcı mesajında da 3 tane saymış parantez içinde fakat "4 malzeme" demiş.
  // Bir tane daha fail varmış geçmiş outputta ama göremedim. Belki gözden kaçtı. Önemli olan bu 3'ü.
];

async function searchUSDA(query: string) {
  try {
    const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        dataType: ["SR Legacy", "Foundation", "Branded"], // Branded da ekleyelim belki oradadır
        pageSize: 5
      }),
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}


import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("Kayıp malzemeler aranıyor...\n");
  const logFile = path.join(process.cwd(), 'lib', 'missing-search.log');
  fs.writeFileSync(logFile, "Search Results:\n");
  
  for (const item of MISSING_ITEMS) {
    console.log(`\n--- ${item.tr} ---`);
    fs.appendFileSync(logFile, `\n--- ${item.tr} ---\n`);
    for (const q of item.queries) {
      console.log(`Sorgu: "${q}"`);
      const data = await searchUSDA(q) as any;
      if (data && data.foods && data.foods.length > 0) {
        fs.appendFileSync(logFile, `Query: "${q}" found ${data.totalHits} results\n`);
        data.foods.slice(0, 3).forEach((f: any) => {
             const line = `   - [${f.fdcId}] ${f.description} (${f.dataType})\n`;
             console.log(line.trim());
             fs.appendFileSync(logFile, line);
        });
      } else {
        console.log("   Bulunamadı.");
        fs.appendFileSync(logFile, `Query: "${q}" NOT FOUND\n`);
      }
    }
  }
}

main();
