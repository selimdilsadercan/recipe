import { execSync } from "child_process";
import fs from "fs";

const PROJECT_ID = "bnysrqgzgfdtzurjlwag";

try {
  console.log("🔄 Generating Supabase types...");
  
  const output = execSync(
    `npx supabase gen types typescript --project-id ${PROJECT_ID} --schema public`
  ).toString("utf-8");

  fs.writeFileSync("lib/supabase-types.ts", output, "utf-8");
  
  console.log("✔ Supabase types generated successfully!");
  console.log("📁 Output: lib/supabase-types.ts");
} catch (error) {
  console.error("❌ Error generating types:", error);
  process.exit(1);
}
