#!/usr/bin/env node
/**
 * detect-sprints.js — Git-based sprint detection
 *
 * Scans a repo for sprint indicators (claims.json files) and determines
 * which sprint is "active" using filesystem + git heuristics:
 *
 *   1. Find all claims.json files (root + examples/ subdirs)
 *   2. Read meta.phase — "archived" sprints are inactive
 *   3. Query git log for most recent commit touching each claims.json
 *   4. Rank by: non-archived > most recent git activity > initiated date
 *
 * Returns a list of sprints with status (active/archived/example).
 * Works without any config file — pure filesystem + git.
 *
 * Usage:
 *   node detect-sprints.js                    # Human-readable output
 *   node detect-sprints.js --json             # Machine-readable JSON
 *   node detect-sprints.js --active           # Print only the active sprint path
 *   node detect-sprints.js --root /path       # Scan a specific directory
 *
 * Zero npm dependencies (Node built-in only).
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

let ROOT = arg('root', process.cwd());

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely parse JSON from a file path; returns null on failure. */
function loadJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Get the ISO timestamp of the most recent git commit touching a file.
 * Returns null if file is untracked or git is unavailable.
 */
function lastGitCommitDate(filePath) {
  try {
    const result = execFileSync('git', [
      'log', '-1', '--format=%aI', '--', filePath
    ], { cwd: ROOT, timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] });
    const dateStr = result.toString().trim();
    return dateStr || null;
  } catch {
    return null;
  }
}

/**
 * Count git commits touching a file (proxy for activity level).
 */
function gitCommitCount(filePath) {
  try {
    const result = execFileSync('git', [
      'rev-list', '--count', 'HEAD', '--', filePath
    ], { cwd: ROOT, timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] });
    return parseInt(result.toString().trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Derive a slug from the sprint's path or question.
 */
function deriveName(sprintPath, meta) {
  if (sprintPath !== '.') {
    return basename(sprintPath);
  }
  if (meta?.question) {
    return meta.question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .slice(0, 4)
      .join('-');
  }
  return 'current';
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

/** Find all sprint roots (directories containing claims.json). */
function findSprintRoots() {
  const roots = [];

  const rootClaims = join(ROOT, 'claims.json');
  if (existsSync(rootClaims)) {
    roots.push({ claimsPath: rootClaims, sprintPath: '.' });
  }

  const examplesDir = join(ROOT, 'examples');
  if (existsSync(examplesDir)) {
    try {
      for (const entry of readdirSync(examplesDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const claimsPath = join(examplesDir, entry.name, 'claims.json');
        if (existsSync(claimsPath)) {
          roots.push({
            claimsPath,
            sprintPath: join('examples', entry.name),
          });
        }
      }
    } catch { /* skip if unreadable */ }
  }

  return roots;
}

// ─── Sprint Analysis ─────────────────────────────────────────────────────────

function analyzeSprint(root) {
  const claims = loadJSON(root.claimsPath);
  if (!claims) return null;

  const meta = claims.meta || {};
  const claimsList = claims.claims || [];

  const lastCommit = lastGitCommitDate(root.claimsPath);
  const commitCount = gitCommitCount(root.claimsPath);

  const phase = meta.phase || 'unknown';
  const isArchived = phase === 'archived' || phase === 'complete';
  const isExample = root.sprintPath.startsWith('examples/') || root.sprintPath.startsWith('examples\\');

  let status;
  if (isArchived) {
    status = 'archived';
  } else if (isExample) {
    status = 'example';
  } else {
    status = 'candidate';
  }

  return {
    name: deriveName(root.sprintPath, meta),
    path: root.sprintPath,
    question: meta.question || '',
    phase,
    initiated: meta.initiated || null,
    last_git_activity: lastCommit,
    git_commit_count: commitCount,
    claims_count: claimsList.length,
    active_claims: claimsList.filter(c => c.status === 'active').length,
    status,
  };
}

/**
 * Detect all sprints and determine which is active.
 *
 * Ranking (highest to lowest priority):
 *   1. Non-archived, non-example sprints (root-level candidates)
 *   2. Most recent git commit touching claims.json
 *   3. Most recent meta.initiated date
 *   4. Highest claim count (tiebreaker)
 */
export function detectSprints(rootDir) {
  if (rootDir) ROOT = rootDir;
  const roots = findSprintRoots();
  const sprints = roots.map(analyzeSprint).filter(Boolean);

  const candidates = sprints.filter(s => s.status === 'candidate');
  const others = sprints.filter(s => s.status !== 'candidate');

  candidates.sort((a, b) => {
    const dateA = a.last_git_activity ? new Date(a.last_git_activity).getTime() : 0;
    const dateB = b.last_git_activity ? new Date(b.last_git_activity).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;

    const initA = a.initiated ? new Date(a.initiated).getTime() : 0;
    const initB = b.initiated ? new Date(b.initiated).getTime() : 0;
    if (initB !== initA) return initB - initA;

    return b.claims_count - a.claims_count;
  });

  let active = null;
  if (candidates.length > 0) {
    candidates[0].status = 'active';
    active = candidates[0];
  }

  if (!active && others.length > 0) {
    const nonArchived = others.filter(s => s.status !== 'archived');
    if (nonArchived.length > 0) {
      nonArchived.sort((a, b) => {
        const dateA = a.last_git_activity ? new Date(a.last_git_activity).getTime() : 0;
        const dateB = b.last_git_activity ? new Date(b.last_git_activity).getTime() : 0;
        return dateB - dateA;
      });
      nonArchived[0].status = 'active';
      active = nonArchived[0];
    }
  }

  const allSprints = [...candidates, ...others].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    const dateA = a.last_git_activity ? new Date(a.last_git_activity).getTime() : 0;
    const dateB = b.last_git_activity ? new Date(b.last_git_activity).getTime() : 0;
    return dateB - dateA;
  });

  return { active, sprints: allSprints };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

if (process.argv[1] === __filename) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`detect-sprints — git-based sprint detection (no config required)

Usage:
  barn detect-sprints              Human-readable sprint list
  barn detect-sprints --json       Machine-readable JSON output
  barn detect-sprints --active     Print only the active sprint path
  barn detect-sprints --root PATH  Scan a specific directory

Detects sprints from claims.json files in a repo. Determines the active
sprint using git commit history and metadata — no config pointer needed.`);
    process.exit(0);
  }

  const t0 = performance.now();
  const result = detectSprints();
  const elapsed = (performance.now() - t0).toFixed(1);

  if (args.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  if (args.includes('--active')) {
    if (result.active) {
      console.log(result.active.path);
    } else {
      console.error('No active sprint detected.');
      process.exit(1);
    }
    process.exit(0);
  }

  // Human-readable output
  console.log(`Sprint Detection (${elapsed}ms)`);
  console.log('='.repeat(50));
  console.log(`Found ${result.sprints.length} sprint(s)\n`);

  for (const sprint of result.sprints) {
    const icon = sprint.status === 'active' ? '>>>' : '   ';
    const statusTag = sprint.status.toUpperCase().padEnd(8);
    console.log(`${icon} [${statusTag}] ${sprint.name}`);
    console.log(`    Path:     ${sprint.path}`);
    console.log(`    Phase:    ${sprint.phase}`);
    console.log(`    Claims:   ${sprint.claims_count} total, ${sprint.active_claims} active`);
    console.log(`    Initiated: ${sprint.initiated || 'unknown'}`);
    console.log(`    Last git:  ${sprint.last_git_activity || 'untracked'}`);
    console.log(`    Commits:   ${sprint.git_commit_count}`);
    console.log(`    Question:  ${sprint.question.slice(0, 80)}${sprint.question.length > 80 ? '...' : ''}`);
    console.log();
  }

  if (result.active) {
    console.log(`Active sprint: ${result.active.path} (${result.active.name})`);
  } else {
    console.log('No active sprint detected.');
  }
}
