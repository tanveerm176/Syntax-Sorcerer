# Deprecated Code - Historical Reference

This folder contains code that has been superseded by improved implementations during the refactoring process.

## Files

### `extractCodeBlocks.js`

**Status:** Deprecated - Replaced by Tree-Sitter AST parser  
**Reason:** Regex-based string parsing approach was fragile and couldn't handle complex JavaScript patterns

**Limitations of this approach:**

- ❌ Regex-based detection of functions/classes
- ❌ Couldn't handle destructuring, arrow functions in objects
- ❌ Prone to false positives/negatives
- ❌ No proper syntax tree understanding

**Replaced by:** `src/lib/codeParser/treeSitterParser.js`

---

### `tokenizerService.js`

**Status:** Deprecated - Unused/Consolidated  
**Reason:** Written but never integrated into the pipeline; functionality consolidated into lib/codeParser

**What happened:**

- This file had Tree-Sitter code written but was never actually called
- It was an attempt to use Tree-Sitter but wasn't integrated into processFile.js
- The new `lib/codeParser` module provides the same functionality with proper integration

**Replaced by:** `src/lib/codeParser/` module
See `src/lib/codeParser/` for the improved implementation.
