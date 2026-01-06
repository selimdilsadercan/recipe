/**
 * USDA Veri İçe Aktarma Scripti (Hibrit Şema)
 * 
 * Bu script USDA CSV dosyalarını okur, temizler ve Supabase 'ingredients' tablosuna yükler.
 * 
 * Kaynak Dosyalar:
 * - food.csv: Temel gıda bilgileri
 * - food_nutrient.csv: Besin değerleri
 * - nutrient.csv: Besin tanımları
 * 
 * Hedef:
 * - Filtreleme: Sadece 'sr_legacy_food' ve 'foundation_food' alınır.
 * - Dönüşüm: 27 ana besin değeri seçilir, makrolar kolona, mikrolar JSON'a.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Transform } from 'stream';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const csv = require('csv-parser');

// Çevre değişkenlerini yükle
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role Key gerekli!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Hata: .env dosyasında SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY eksik!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_DIR = path.join(__dirname, '../ingredients/FoodData_Central_csv_2025-12-18');

// Besin ID Eşleşmeleri (USDA Nutrient ID -> DB Column/JSON Key)
const NUTRIENT_MAP: Record<string, string> = {
  // Makrolar (Kolonlar)
  "1008": "calories",
  "1003": "protein",
  "1004": "fat",
  "1005": "carbs",
  "1079": "fiber",
  "2000": "sugar",
  "1253": "cholesterol",
  
  // Vitaminler (JSON)
  "1106": "vitamin_a",
  "1162": "vitamin_c",
  "1114": "vitamin_d",
  "1109": "vitamin_e",
  "1185": "vitamin_k",
  "1165": "thiamin",    // B1
  "1166": "riboflavin", // B2
  "1167": "niacin",     // B3
  "1175": "vitamin_b6",
  "1178": "vitamin_b12",
  
  // Mineraller (JSON)
  "1087": "calcium",
  "1089": "iron",
  "1090": "magnesium",
  "1091": "phosphorus",
  "1092": "potassium",
  "1093": "sodium",
  "1095": "zinc",
  "1098": "copper",
  "1101": "manganese",
  "1103": "selenium"
};

interface Food {
  fdc_id: number;
  name_en: string;
  category: string;
}

// 1. Adım: Hedef Gıdaları Filtrele (SR Legacy + Foundation)
console.log("1. Adım: Gıdalar filtreleniyor...");

const targetFoods = new Map<number, Food>();

async function loadFoods() {
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(path.join(CSV_DIR, 'food.csv'))
      .pipe(csv())
      .on('data', (row: any) => {
        // Sadece temel gıdaları al
        if (
          (row.data_type === 'sr_legacy_food' || row.data_type === 'foundation_food') &&
          !row.description.toLowerCase().includes('baby food') &&
          !row.description.toLowerCase().includes('infant')
        ) {
          targetFoods.set(parseInt(row.fdc_id), {
            fdc_id: parseInt(row.fdc_id),
            name_en: row.description,
            category: row.food_category_id // Kategori ID'si, sonra eşleşebilir
          });
        }
      })
      .on('end', () => {
        console.log(`${targetFoods.size} adet hedef gıda bulundu.`);
        resolve();
      })
      .on('error', reject);
  });
}

// 2. Adım: Besin Değerlerini Eşle
console.log("2. Adım: Besin değerleri okunuyor...");

// Gıda tablosu: fdc_id -> { nutrient_key: value }
const foodNutrients = new Map<number, Record<string, number>>();

async function loadNutrients() {
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(path.join(CSV_DIR, 'food_nutrient.csv'))
      .pipe(csv())
      .on('data', (row: any) => {
        const fdcId = parseInt(row.fdc_id);
        
        // Sadece hedef gıdalar için işlem yap
        if (targetFoods.has(fdcId)) {
          const nutrientId = row.nutrient_id;
          const key = NUTRIENT_MAP[nutrientId];
          
          if (key) {
            let value = parseFloat(row.amount);
            if (isNaN(value)) value = 0;
            
            if (!foodNutrients.has(fdcId)) {
              foodNutrients.set(fdcId, {});
            }
            
            const nutrientData = foodNutrients.get(fdcId)!;
            nutrientData[key] = value;
          }
        }
      })
      .on('end', () => {
        console.log("Besin değerleri eşleştirildi.");
        resolve();
      })
      .on('error', reject);
  });
}

// 3. Adım: Veriyi Dönüştür ve Yükle
async function importData() {
  try {
    await loadFoods();
    await loadNutrients();
    
    console.log("3. Adım: Supabase'e yükleniyor...");
    
    // Batch işlemi için array
    let batch: any[] = [];
    const BATCH_SIZE = 500;
    let totalImported = 0;
    
    for (const [fdcId, food] of targetFoods.entries()) {
      const nutrientData = foodNutrients.get(fdcId) || {};
      
      // Hibrit Şema Dönüşümü
      const record = {
        fdc_id: fdcId,
        name_en: food.name_en,
        // Kategori şimdilik basit tutuluyor, ileride food_category.csv ile zenginleştirilebilir
        category: 'uncategorized', 
        
        // Makrolar (Kolonlar)
        calories: nutrientData.calories || 0,
        protein: nutrientData.protein || 0,
        fat: nutrientData.fat || 0,
        carbs: nutrientData.carbs || 0,
        fiber: nutrientData.fiber || 0,
        sugar: nutrientData.sugar || 0,
        cholesterol: nutrientData.cholesterol || 0,
        
        // Mikrolar (JSONB)
        micros: {
          vitamin_a: nutrientData.vitamin_a || 0,
          vitamin_c: nutrientData.vitamin_c || 0,
          vitamin_d: nutrientData.vitamin_d || 0,
          vitamin_e: nutrientData.vitamin_e || 0,
          vitamin_k: nutrientData.vitamin_k || 0,
          thiamin: nutrientData.thiamin || 0,
          riboflavin: nutrientData.riboflavin || 0,
          niacin: nutrientData.niacin || 0,
          vitamin_b6: nutrientData.vitamin_b6 || 0,
          vitamin_b12: nutrientData.vitamin_b12 || 0,
          calcium: nutrientData.calcium || 0,
          iron: nutrientData.iron || 0,
          magnesium: nutrientData.magnesium || 0,
          phosphorus: nutrientData.phosphorus || 0,
          potassium: nutrientData.potassium || 0,
          sodium: nutrientData.sodium || 0,
          zinc: nutrientData.zinc || 0,
          copper: nutrientData.copper || 0,
          manganese: nutrientData.manganese || 0,
          selenium: nutrientData.selenium || 0
        },
        
        // Arama Vektörü (Basit İngilizce)
        // Not: Gerçek search_vector DB tarafında trigger ile veya burada hesaplanabilir.
        // Şimdilik DB tarafına bırakıp sadece veriyi yüklüyoruz.
      };
      
      batch.push(record);
      
      if (batch.length >= BATCH_SIZE) {
        const { error } = await supabase.from('ingredients').upsert(batch, { onConflict: 'fdc_id' });
        
        if (error) {
          console.error("Yükleme hatası:", error);
        } else {
          totalImported += batch.length;
          console.log(`${totalImported} kayıt yüklendi...`);
        }
        
        batch = []; // Temizle
      }
    }
    
    // Kalanları yükle
    if (batch.length > 0) {
      const { error } = await supabase.from('ingredients').upsert(batch, { onConflict: 'fdc_id' });
      if (error) console.error("Son batch hatası:", error);
      else console.log(`Son ${batch.length} kayıt yüklendi.`);
    }
    
    console.log("İşlem Tamamlandı! 🎉");
    
  } catch (err) {
    console.error("Genel hata:", err);
  }
}

// Scripti Çalıştır
importData();
