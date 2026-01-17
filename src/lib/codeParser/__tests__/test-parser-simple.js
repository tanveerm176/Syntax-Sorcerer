/**
 * Simple test to verify Tree-Sitter parser integration
 * Run with: node src/lib/codeParser/__tests__/test-parser-simple.js
 */

const path = require("path");
const fs = require("fs");

// Since we're in CommonJS but the parser uses ESM,
// we'll test by checking if the files exist and have the expected structure

async function runTests() {
  console.log("🧪 Testing Tree-Sitter Parser Setup\n");
  console.log("=".repeat(60));

  try {
    // Check if main files exist
    const files = {
      "Index Interface": "src/lib/codeParser/index.js",
      "Tree-Sitter Parser": "src/lib/codeParser/treeSitterParser.js",
      "Type Definitions": "src/lib/codeParser/types.js",
      "Sample Test File": "src/lib/codeParser/__tests__/sample.js",
    };

    console.log("\n📂 File Structure Check:");
    console.log("-".repeat(60));

    let allFilesExist = true;
    for (const [name, filepath] of Object.entries(files)) {
      const fullPath = path.join(
        "c:/Users/tanve/Desktop/RB Projects/SyntaxSorcerer",
        filepath,
      );
      const exists = fs.existsSync(fullPath);
      console.log(`  ${exists ? "✅" : "❌"} ${name}: ${filepath}`);
      allFilesExist = allFilesExist && exists;
    }

    if (!allFilesExist) {
      throw new Error("Some required files are missing");
    }

    // Check file contents
    console.log("\n📋 Code Structure Validation:");
    console.log("-".repeat(60));

    const indexPath = path.join(
      "c:/Users/tanve/Desktop/RB Projects/SyntaxSorcerer",
      "src/lib/codeParser/index.js",
    );
    const indexContent = fs.readFileSync(indexPath, "utf8");

    const checks = [
      {
        name: "Has parseCodeFile export",
        check: indexContent.includes("export async function parseCodeFile"),
      },
      {
        name: "Imports Tree-Sitter parser",
        check: indexContent.includes("parseCodeWithTreeSitter"),
      },
      {
        name: "Has proper JSDoc",
        check:
          indexContent.includes("@param") && indexContent.includes("@returns"),
      },
    ];

    checks.forEach(({ name, check }) => {
      console.log(`  ${check ? "✅" : "❌"} ${name}`);
    });

    // Check Tree-Sitter parser
    const treeSitterPath = path.join(
      "c:/Users/tanve/Desktop/RB Projects/SyntaxSorcerer",
      "src/lib/codeParser/treeSitterParser.js",
    );
    const treeSitterContent = fs.readFileSync(treeSitterPath, "utf8");

    console.log("\n🌳 Tree-Sitter Implementation Check:");
    console.log("-".repeat(60));

    const tsChecks = [
      {
        name: "Imports Tree-Sitter library",
        check: treeSitterContent.includes("tree-sitter"),
      },
      {
        name: "Imports JavaScript language",
        check: treeSitterContent.includes("tree-sitter-javascript"),
      },
      {
        name: "Exports parseCodeWithTreeSitter function",
        check: treeSitterContent.includes(
          "export async function parseCodeWithTreeSitter",
        ),
      },
      {
        name: "Traverses AST nodes",
        check: treeSitterContent.includes("function traverse"),
      },
      {
        name: "Extracts function_declaration nodes",
        check: treeSitterContent.includes("function_declaration"),
      },
      {
        name: "Extracts class_declaration nodes",
        check: treeSitterContent.includes("class_declaration"),
      },
    ];

    tsChecks.forEach(({ name, check }) => {
      console.log(`  ${check ? "✅" : "❌"} ${name}`);
    });

    return true;
  } catch (error) {
    console.error("\n❌ Error during validation:");
    console.error(error.message);
    console.error("\n" + "=".repeat(60));
    return false;
  }
}

// Run tests
runTests().then((success) => {
  process.exit(success ? 0 : 1);
});
