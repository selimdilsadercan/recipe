
import { commonIngredients } from "../lib/common-ingredients";
import Fuse from "fuse.js";

const fuse = new Fuse(commonIngredients, {
  keys: [
    { name: "name_tr", weight: 2 },
    { name: "aliases_tr", weight: 1.5 },
    { name: "name_en", weight: 1 },
  ],
  threshold: 0.4, // Bu değer nutrition-lookup.ts ile aynı olmalı
  includeScore: true,
});

function test(query: string) {
    console.log(`Searching for "${query}"...`);
    const results = fuse.search(query);
    if (results.length > 0) {
        const best = results[0];
        console.log(`✅ Found: ${best.item.name_tr} (Score: ${best.score}) - ID: ${best.item.id}`);
    } else {
        console.log(`❌ Not found: "${query}"`);
    }
}

test("sıvıyağ");
test("sıvı yağ");
test("siviyag");
test("köri");
test("kori");
