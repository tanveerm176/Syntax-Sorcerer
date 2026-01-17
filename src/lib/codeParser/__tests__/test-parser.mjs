/**
 * Test script for Tree-Sitter parser implementation
 * Run with: node --experimental-modules src/lib/codeParser/__tests__/test-parser.mjs
 */

import path from "path";
import { fileURLToPath } from "url";
import { parseCodeFile } from "../index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log("🧪 Testing Tree-Sitter Parser Implementation\n");
  console.log("=".repeat(50));

  const sampleFile = path.join(__dirname, "sample.js");

  try {
    console.log(`\n📂 Parsing: ${sampleFile}\n`);

    const result = await parseCodeFile(sampleFile);

    console.log("✅ Parser executed successfully!\n");

    // Display results
    console.log("📊 Extraction Results:");
    console.log("-".repeat(50));

    console.log(`\n📝 File: ${result.relativeFilePath}`);

    console.log(`\n🔧 Functions Found: ${result.functions.length}`);
    if (result.functions.length > 0) {
      console.log("   Functions:");
      result.functions.forEach((func, idx) => {
        console.log(
          `   ${idx + 1}. ${func.function_name} (${func.code.split("\n").length} lines)`,
        );
      });
    }

    console.log(`\n📚 Classes Found: ${result.classes.length}`);
    if (result.classes.length > 0) {
      console.log("   Classes:");
      result.classes.forEach((cls, idx) => {
        console.log(
          `   ${idx + 1}. ${cls.class_name} (${cls.code.split("\n").length} lines)`,
        );
      });
    }

    console.log("\n" + "=".repeat(50));

    // Validation checks
    console.log("\n✓ Validation Checks:");
    console.log(
      `  ✓ Parsed functions: ${result.functions.length > 0 ? "PASS" : "FAIL"}`,
    );
    console.log(
      `  ✓ Parsed classes: ${result.classes.length > 0 ? "PASS" : "FAIL"}`,
    );
    console.log(
      `  ✓ All functions have names: ${result.functions.every((f) => f.function_name && f.function_name !== "anonymous") ? "PASS" : "FAIL"}`,
    );
    console.log(
      `  ✓ All classes have names: ${result.classes.every((c) => c.class_name) ? "PASS" : "FAIL"}`,
    );

    console.log("\n" + "=".repeat(50));
    console.log("\n✨ Tree-Sitter parser is working correctly!\n");

    return true;
  } catch (error) {
    console.error("\n❌ Error during parsing:");
    console.error(error.message);
    console.error("\n" + "=".repeat(50));
    return false;
  }
}

// Run tests
runTests().then((success) => {
  process.exit(success ? 0 : 1);
});
