/**
 * common-ingredients.ts dosyasını güncelle
 * 
 * generated-ingredients.json dosyasını okur ve common-ingredients.ts dosyasındaki
 * COMMON_INGREDIENTS arrayini günceller.
 */

import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const cwd = process.cwd();
  const jsonPath = path.join(cwd, 'lib', 'generated-ingredients.json');
  const tsPath = path.join(cwd, 'lib', 'common-ingredients.ts');
  
  if (!fs.existsSync(jsonPath)) {
    console.error("JSON dosyası bulunamadı!");
    process.exit(1);
  }
  
  // JSON dosyasını oku ve düzelt
  let jsonContent = fs.readFileSync(jsonPath, 'utf8').trim();
  // Fix comma at the end if exists (e.g. from crash)
  if (jsonContent.endsWith(',')) {
    jsonContent = jsonContent.slice(0, -1);
  }
  // Remove last comma before closing bracket if exists
  jsonContent = jsonContent.replace(/,\s*\]$/, ']');
  
  if (!jsonContent.endsWith(']')) {
    jsonContent += '\n]';
  }
  
  let ingredients: any[] = [];
  try {
    ingredients = JSON.parse(jsonContent);
  } catch (e) {
    console.error("JSON parse hatası. Dosya bozuk olabilir:", e);
    // Try to recover simple comma error
    try {
        if (jsonContent.match(/,\s*\]$/)) {
             jsonContent = jsonContent.replace(/,\s*\]$/, ']');
             ingredients = JSON.parse(jsonContent);
        } else {
            console.log("Last 100 chars:", jsonContent.slice(-100));
            process.exit(1);
        }
    } catch (err) {
        process.exit(1);
    }
  }
  
  console.log(`${ingredients.length} malzeme okundu.`);
  
  // TS dosyasını oku
  const tsContent = fs.readFileSync(tsPath, 'utf8');
  
  // Header kısmını bul (Interface bitimine kadar)
  // "export const COMMON_INGREDIENTS" satırına kadar olan kısmı al
  const splitIndex = tsContent.indexOf('export const COMMON_INGREDIENTS');
  
  if (splitIndex === -1) {
    console.error("Target file structure unknown (cannot find COMMON_INGREDIENTS export).");
    process.exit(1);
  }
  
  const header = tsContent.slice(0, splitIndex);
  
  // Yeni içeriği oluştur
  const newContent = `${header}export const COMMON_INGREDIENTS: Ingredient[] = ${JSON.stringify(ingredients, null, 2)};
`;

  fs.writeFileSync(tsPath, newContent);
  console.log(`common-ingredients.ts başarıyla güncellendi! (${ingredients.length} kayıt)`);
}

main().catch(console.error);
