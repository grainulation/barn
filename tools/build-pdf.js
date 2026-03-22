#!/usr/bin/env node
/**
 * build-pdf.js — Convert markdown to PDF via npx md-to-pdf
 *
 * Usage:
 *   barn build-pdf <markdown-file>
 *   barn build-pdf output/brief.md
 *
 * Uses npx to invoke md-to-pdf, so no local install is required.
 * Zero npm dependencies (Node built-in only).
 */

import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const target = process.argv[2];

if (!target || target === "--help" || target === "-h") {
  console.log(`build-pdf — convert markdown to PDF

Usage:
  barn build-pdf <markdown-file>

Example:
  barn build-pdf output/brief.md

Uses npx md-to-pdf under the hood. No local install needed.`);
  process.exit(target ? 0 : 1);
}

if (!existsSync(target)) {
  console.error(`File not found: ${target}`);
  process.exit(1);
}

try {
  execSync(`npx md-to-pdf "${target}"`, { stdio: "inherit" });
  const pdfPath = target.replace(/\.md$/, ".pdf");
  console.log(`PDF generated: ${pdfPath}`);
} catch (e) {
  console.error("PDF generation failed:", e.message);
  process.exit(1);
}
