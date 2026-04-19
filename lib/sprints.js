/**
 * Sprint metadata helpers — complements detectSprints() with per-sprint
 * loaders that harvest, orchard, silo, and wheat all re-implement today.
 *
 * Usage (ESM):
 *   import { detectSprints } from "@grainulation/barn";
 *   import { loadSprintClaims, loadSprintCompilation, sprintSummary }
 *     from "@grainulation/barn/sprints";
 *
 * Returns null for missing/malformed files — consumers decide how to handle.
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/** Load claims.json for a sprint directory. Returns full object or null. */
export function loadSprintClaims(sprintDir) {
  const p = resolve(sprintDir, "claims.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

/** Load compilation.json for a sprint directory. Returns full object or null. */
export function loadSprintCompilation(sprintDir) {
  const p = resolve(sprintDir, "compilation.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Quick summary for a sprint directory — the shape harvest/orchard typically
 * want: question, phase, active/total claim count, conflict count, last modified.
 *
 * Returns null if the sprint directory doesn't have claims.json.
 */
export function sprintSummary(sprintDir) {
  const claims = loadSprintClaims(sprintDir);
  if (!claims) return null;
  const meta = claims.meta || {};
  const list = Array.isArray(claims.claims) ? claims.claims : [];
  const compilation = loadSprintCompilation(sprintDir);
  const conflicts = compilation?.conflict_graph?.unresolved?.length ?? 0;

  let lastModified = null;
  try {
    lastModified = statSync(join(sprintDir, "claims.json")).mtimeMs;
  } catch {
    // no stat available
  }

  return {
    path: resolve(sprintDir),
    question: meta.question || "",
    phase: meta.phase || "unknown",
    audience: meta.audience || [],
    initiated: meta.initiated || null,
    claim_count: list.length,
    active_claims: list.filter((c) => c.status === "active").length,
    conflict_count: conflicts,
    compile_status: compilation?.status || null,
    certificate: compilation?.certificate || null,
    last_modified_ms: lastModified,
  };
}

/**
 * Map a list of sprint paths to their summaries, dropping any that fail to load.
 * Useful after detectSprints() when you want batch metadata for a dashboard.
 */
export function summarize(sprintDirs) {
  const out = [];
  for (const dir of sprintDirs) {
    const s = sprintSummary(dir);
    if (s) out.push(s);
  }
  return out;
}
