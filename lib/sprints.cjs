/**
 * sprints.cjs — CommonJS mirror of lib/sprints.js.
 */

"use strict";

const fs = require("node:fs");
const { join, resolve } = require("node:path");

function loadSprintClaims(sprintDir) {
  const p = resolve(sprintDir, "claims.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function loadSprintCompilation(sprintDir) {
  const p = resolve(sprintDir, "compilation.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function sprintSummary(sprintDir) {
  const claims = loadSprintClaims(sprintDir);
  if (!claims) return null;
  const meta = claims.meta || {};
  const list = Array.isArray(claims.claims) ? claims.claims : [];
  const compilation = loadSprintCompilation(sprintDir);
  const conflicts =
    (compilation &&
      compilation.conflict_graph &&
      compilation.conflict_graph.unresolved &&
      compilation.conflict_graph.unresolved.length) ||
    0;

  let lastModified = null;
  try {
    lastModified = fs.statSync(join(sprintDir, "claims.json")).mtimeMs;
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
    compile_status: (compilation && compilation.status) || null,
    certificate: (compilation && compilation.certificate) || null,
    last_modified_ms: lastModified,
  };
}

function summarize(sprintDirs) {
  const out = [];
  for (const dir of sprintDirs) {
    const s = sprintSummary(dir);
    if (s) out.push(s);
  }
  return out;
}

module.exports = {
  loadSprintClaims,
  loadSprintCompilation,
  sprintSummary,
  summarize,
};
