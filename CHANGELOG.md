# Changelog

## 1.2.1

Follow-up bundle for the dedup cascade — absorbs two more pieces of
logic that wheat/harvest/orchard had been duplicating, so every
consumer has one source of truth.

- `@grainulation/barn/detect-sprints` — canonical version of the
  git-aware active-sprint picker (438 LOC). Supersedes the simpler
  standalone loader that was previously at `tools/detect-sprints.js`
  (316 LOC); the new version adds `findSprintRoots` + `analyzeSprint`
  exports, batch git queries for dates/counts (~30× faster on
  ≥10 sprints), and ranks by non-archived first, then most-recent
  git activity, then initiated date. Wheat's local copy of this
  module is deleted in a follow-up consumer commit.
- `@grainulation/barn/sprints` — new `findSprintFiles(targetDir)`
  export. Two-level-deep scan for claims.json files, returning
  `{ file, dir, name, cat }` where `cat ∈ { root, archive, active }`.
  harvest and orchard each had a near-identical ~65 LOC
  implementation in their respective dashboard.js files; those are
  deleted in a follow-up consumer commit. Available in both the
  ESM (`lib/sprints.js`) and CJS (`lib/sprints.cjs`) entry points.

Still zero runtime dependencies.

## 1.2.0

Absorb shared utilities previously duplicated across wheat / mill / silo /
harvest / orchard / farmer. Barn now exports six utility modules with both
ESM and CJS entry points via conditional exports:

- `@grainulation/barn/mcp` — JSON-RPC 2.0 helpers (`jsonRpcResponse`,
  `jsonRpcError`, `JSON_RPC_ERRORS`, `parseJsonRpc`, `buildInitializeResult`)
  used by every MCP server in the ecosystem.
- `@grainulation/barn/paths` — path-traversal guards (`isInsideDir`,
  `resolveSafe`, `assertInsideDir`, `relativeInside`) with separator-aware
  prefix checking to avoid `/foo` matching `/foo-bar`.
- `@grainulation/barn/atomic` — `atomicWrite` / `atomicWriteJSON` with
  tmp-file cleanup on error.
- `@grainulation/barn/cli` — shared `setVerbose` / `vlog` / `parseFlags` /
  `flag` / `flagList` / `loadJSON` / `isFlag` for CLI tools.
- `@grainulation/barn/phases` — canonical phase-prefix map
  (`PHASE_PREFIXES`, `PHASE_NAMES`, `isValidPhase`, `phaseFromClaimId`,
  `prefixForPhase`).
- `@grainulation/barn/sprints` — per-sprint loaders
  (`loadSprintClaims`, `loadSprintCompilation`, `sprintSummary`, `summarize`)
  that complement the existing `detectSprints` active-sprint picker.

All modules ship both `lib/*.js` (ESM) and `lib/*.cjs` (CJS) variants;
package.json exports use `{ "import": ..., "require": ... }` conditional
resolution so CJS consumers (mill, silo, harvest, orchard) and ESM
consumers (wheat, farmer) both work without shimming.

Still zero runtime dependencies.

## 1.0.0

Initial release.

- 17 built-in HTML templates (brief, explainer, dashboard, slide-deck, RFC, ADR, and more)
- Web template browser with tag filtering, source/preview/info tabs
- `detect-sprints` tool for finding active wheat sprints across repos
- `generate-manifest` for building wheat-manifest.json
- `build-pdf` for Markdown-to-PDF conversion
- SSE live-reload when templates change
- Zero runtime dependencies
