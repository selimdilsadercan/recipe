/**
 * Fuzzy Matching Test Suite
 * Tests ingredient matching accuracy with various scenarios
 * 
 * Run: npx tsx backend/scripts/test-fuzzy-matching.ts
 */

import { COMMON_INGREDIENTS } from "../lib/common-ingredients";
import Fuse from "fuse.js";

// Test cases with expected matches
interface TestCase {
  input: string;
  expectedMatch: string | null; // null = should not match
  category: "typo" | "alias" | "partial" | "negative";
}

const TEST_CASES: TestCase[] = [
  // ============ TYPO TESTS (Yazım Hataları) ============
  { input: "dometes", expectedMatch: "Domates", category: "typo" },
  { input: "patatis", expectedMatch: "Patates", category: "typo" },
  { input: "soğn", expectedMatch: "Soğan", category: "typo" },
  { input: "yumurda", expectedMatch: "Yumurta", category: "typo" },
  { input: "tavk göğsü", expectedMatch: "Tavuk göğsü", category: "typo" },
  { input: "sarmsak", expectedMatch: "Sarımsak", category: "typo" },
  { input: "zeytınyağı", expectedMatch: "Zeytinyağı", category: "typo" },
  { input: "biber", expectedMatch: "Yeşil biber", category: "typo" },
  { input: "pırınç", expectedMatch: "Pirinç", category: "typo" },
  { input: "mercmek", expectedMatch: "Mercimek", category: "typo" },
  
  // ============ ALIAS TESTS (Alternatif İsimler) ============
  { input: "kıyma", expectedMatch: "Dana kıyma", category: "alias" },
  { input: "peynir", expectedMatch: "Beyaz peynir", category: "alias" },
  { input: "süt", expectedMatch: "Tam yağlı süt", category: "alias" },
  { input: "göğüs eti", expectedMatch: "Tavuk göğsü", category: "alias" },
  { input: "sızma zeytinyağı", expectedMatch: "Zeytinyağı", category: "alias" },
  { input: "yeşil mercimek", expectedMatch: "Mercimek", category: "alias" },
  { input: "hıyar", expectedMatch: "Salatalık", category: "alias" },
  { input: "yer elması", expectedMatch: "Patates", category: "alias" },
  { input: "pilavlık bulgur", expectedMatch: "Bulgur", category: "alias" },
  { input: "toz şeker", expectedMatch: "Şeker", category: "alias" },
  
  // ============ PARTIAL MATCH TESTS (Kısmi Eşleşme) ============
  { input: "tavuk", expectedMatch: "Tavuk göğsü", category: "partial" },
  { input: "dana", expectedMatch: "Dana kıyma", category: "partial" },
  { input: "kuzu", expectedMatch: "Kuzu eti", category: "partial" },
  { input: "somon balığı", expectedMatch: "Somon", category: "partial" },
  { input: "beyaz", expectedMatch: "Beyaz peynir", category: "partial" },
  
  // ============ NEGATIVE TESTS (Eşleşmemeli) ============
  { input: "xyzabc", expectedMatch: null, category: "negative" },
  { input: "asdfghjkl", expectedMatch: null, category: "negative" },
  { input: "motor yağı", expectedMatch: null, category: "negative" },
];

// Current Fuse.js configuration
const fuse = new Fuse(COMMON_INGREDIENTS, {
  keys: ["name_tr", "aliases_tr", "name_en"],
  threshold: 0.4,
  includeScore: true,
});

// Improved Fuse.js configuration with better Turkish support
const fuseImproved = new Fuse(COMMON_INGREDIENTS, {
  keys: [
    { name: "name_tr", weight: 2 },      // Primary Turkish name - higher weight
    { name: "aliases_tr", weight: 1.5 }, // Turkish aliases
    { name: "name_en", weight: 0.5 },    // English name - lower weight
  ],
  threshold: 0.35,        // Slightly stricter
  includeScore: true,
  ignoreLocation: true,   // Don't penalize matches at end of string
  minMatchCharLength: 2,  // Minimum 2 chars to match
  findAllMatches: true,
});

function runTests(fuseInstance: Fuse<typeof COMMON_INGREDIENTS[0]>, label: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${label}`);
  console.log("=".repeat(60));
  
  let passed = 0;
  let failed = 0;
  const failedCases: { input: string; expected: string | null; got: string | null; score: number }[] = [];
  
  for (const testCase of TEST_CASES) {
    const results = fuseInstance.search(testCase.input);
    const topResult = results[0];
    const matchedName = topResult?.item.name_tr || null;
    const score = topResult?.score ?? 1;
    
    // For negative tests, we want NO match or very low confidence (score > 0.5)
    const isCorrect = testCase.expectedMatch === null 
      ? (matchedName === null || score > 0.5)
      : matchedName === testCase.expectedMatch;
    
    if (isCorrect) {
      passed++;
    } else {
      failed++;
      failedCases.push({
        input: testCase.input,
        expected: testCase.expectedMatch,
        got: matchedName,
        score: score
      });
    }
  }
  
  const accuracy = ((passed / TEST_CASES.length) * 100).toFixed(1);
  
  console.log(`\n📊 Results: ${passed}/${TEST_CASES.length} passed (${accuracy}%)`);
  
  if (failedCases.length > 0) {
    console.log(`\n❌ Failed cases:`);
    for (const fc of failedCases) {
      console.log(`   "${fc.input}" → Expected: "${fc.expected}", Got: "${fc.got}" (score: ${fc.score.toFixed(3)})`);
    }
  }
  
  // Category breakdown
  const categories = ["typo", "alias", "partial", "negative"] as const;
  console.log(`\n📈 Category breakdown:`);
  for (const cat of categories) {
    const catCases = TEST_CASES.filter(tc => tc.category === cat);
    const catPassed = catCases.filter(tc => {
      const results = fuseInstance.search(tc.input);
      const topResult = results[0];
      const matchedName = topResult?.item.name_tr || null;
      const score = topResult?.score ?? 1;
      return tc.expectedMatch === null 
        ? (matchedName === null || score > 0.5)
        : matchedName === tc.expectedMatch;
    }).length;
    console.log(`   ${cat}: ${catPassed}/${catCases.length}`);
  }
  
  return { passed, failed, accuracy: parseFloat(accuracy) };
}

// Run tests
console.log("🧪 Fuzzy Matching Test Suite\n");
console.log(`Total test cases: ${TEST_CASES.length}`);
console.log(`Total ingredients in JSON: ${COMMON_INGREDIENTS.length}`);

const currentResults = runTests(fuse, "Current Configuration (threshold: 0.4)");
const improvedResults = runTests(fuseImproved, "Improved Configuration (threshold: 0.35, weighted keys)");

console.log(`\n${"=".repeat(60)}`);
console.log("📋 SUMMARY");
console.log("=".repeat(60));
console.log(`Current:  ${currentResults.accuracy}% accuracy`);
console.log(`Improved: ${improvedResults.accuracy}% accuracy`);
console.log(`Improvement: ${(improvedResults.accuracy - currentResults.accuracy).toFixed(1)}%`);

if (improvedResults.accuracy >= 90) {
  console.log(`\n✅ Target accuracy (90%+) achieved!`);
} else {
  console.log(`\n⚠️ Target accuracy (90%+) not yet achieved. Consider:`);
  console.log(`   - Adding more aliases to common-ingredients.ts`);
  console.log(`   - Adjusting threshold further`);
  console.log(`   - Adding Turkish-specific text normalization`);
}
