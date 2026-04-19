/**
 * paths.cjs — CommonJS mirror of lib/paths.js.
 */

"use strict";

const { resolve, relative, sep } = require("node:path");
const { realpathSync } = require("node:fs");

// Resolve-and-realpath, so a symlink inside baseDir pointing at /etc
// does not silently pass containment checks. Falls back to logical
// resolve when the path doesn't exist yet.
function resolveReal(p) {
  const abs = resolve(p);
  try {
    return realpathSync(abs);
  } catch {
    return abs;
  }
}

function isInsideDir(target, baseDir) {
  const base = resolveReal(baseDir);
  const t = resolveReal(target);
  if (t === base) return true;
  return t.startsWith(base + sep);
}

function resolveSafe(baseDir, target) {
  const base = resolve(baseDir);
  const resolved = resolve(base, target);
  if (!isInsideDir(resolved, base)) {
    throw new Error(
      `Path escapes workspace: ${target} → ${resolved} (base: ${base})`,
    );
  }
  return resolved;
}

function assertInsideDir(target, baseDir) {
  if (!isInsideDir(target, baseDir)) {
    throw new Error(
      `Path outside workspace: ${target} (base: ${resolve(baseDir)})`,
    );
  }
}

function relativeInside(baseDir, target) {
  if (!isInsideDir(target, baseDir)) return null;
  return relative(resolve(baseDir), resolve(target));
}

module.exports = {
  isInsideDir,
  resolveSafe,
  assertInsideDir,
  relativeInside,
};
