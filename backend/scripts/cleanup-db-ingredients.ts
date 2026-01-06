/**
 * JSON'a taşınan malzemeleri veritabanından temizle
 * 
 * Bu script `lib/generated-ingredients.json` (veya .ts) dosyasındaki malzemeleri okur
 * ve Supabase veritabanından aynı fdc_id'ye sahip kayıtları siler.
 * 
 * Hedef: JSON'da olan veri DB'de yer kaplamasın.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Çevre değişkenlerini yükle
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Hata: .env dosyasında SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY eksik!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const jsonPath = path.resolve(__dirname, '../lib/generated-ingredients.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`Dosya bulunamadı: ${jsonPath}`);
    console.error("Önce fetch-top-ingredients.ts çalıştırılmalı!");
    process.exit(1);
  }

  // JSON dosyasını oku
  // Not: Dosya yarım kalmış olabilir (sonunda ] eksik olabilir). 
  // Basitçe düzeltmeye çalışalım.
  let content = fs.readFileSync(jsonPath, 'utf8').trim();
  if (!content.endsWith(']')) {
    content += '\n]';
  }
  // Eğer virgülle bitiyorsa ve ] eklediysek, ,] JSON hatası verir.
  // Regex ile son virgülü temizlemek daha güvenli olabilir ama şimdilik try-catch.
  
  let ingredients: any[] = [];
  try {
    ingredients = JSON.parse(content);
  } catch (e) {
    // Virgül hatası olabilir, son virgülü temizleyip tekrar dene
    try {
      if (content.match(/,\s*\]$/)) {
         content = content.replace(/,\s*\]$/, ']');
         ingredients = JSON.parse(content);
      } else {
        throw e;
      }
    } catch (err) {
      console.error("JSON parse hatası:", err);
      process.exit(1);
    }
  }

  console.log(`${ingredients.length} malzeme JSON'dan okundu. DB temizliği başlıyor...`);

  const fdcIds = ingredients.map(ing => ing.fdc_id).filter(Boolean);
  
  if (fdcIds.length === 0) {
    console.log("Silinecek FDC ID bulunamadı.");
    return;
  }

  // Batch silme işlemi (Supabase 'in' operatörü limitli olabilir, batch yapalım)
  const BATCH_SIZE = 100;
  let deletedCount = 0;

  for (let i = 0; i < fdcIds.length; i += BATCH_SIZE) {
    const batch = fdcIds.slice(i, i + BATCH_SIZE);
    
    const { error, count } = await supabase
      .from('ingredients')
      .delete({ count: 'exact' })
      .in('fdc_id', batch);

    if (error) {
      console.error("Silme hatası:", error);
    } else {
      console.log(`Batch ${i/BATCH_SIZE + 1}: ${count} kayıt silindi.`);
      deletedCount += (count || 0);
    }
  }

  console.log(`\nToplam ${deletedCount} mükerrer kayıt veritabanından silindi.`);
}

main().catch(console.error);
