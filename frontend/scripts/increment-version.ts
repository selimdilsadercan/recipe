import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the build.gradle file
const buildGradlePath: string = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

try {
  // Read the current build.gradle file
  let content: string = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Find the current versionCode
  const versionCodeMatch: RegExpMatchArray | null = content.match(/versionCode\s+(\d+)/);
  
  if (versionCodeMatch) {
    const currentVersionCode: number = parseInt(versionCodeMatch[1], 10);
    const newVersionCode: number = currentVersionCode + 1;
    
    // Replace the versionCode
    content = content.replace(
      /versionCode\s+\d+/,
      `versionCode ${newVersionCode}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(buildGradlePath, content, 'utf8');
    
    console.log(`✅ Version code updated from ${currentVersionCode} to ${newVersionCode}`);
  } else {
    console.error('❌ Could not find versionCode in build.gradle');
    process.exit(1);
  }
} catch (error: unknown) {
  const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
  console.error('❌ Error updating version code:', errorMessage);
  process.exit(1);
}
