#!/usr/bin/env node
/**
 * basic.test.js — Sanity tests for grove tools
 *
 * Runs without any test framework. Zero dependencies.
 * Exit code 0 = all pass, 1 = failures.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${name}`);
    failed++;
  }
}

// ─── File structure checks ───────────────────────────────────────────────────

console.log('\n--- File structure ---');

const expectedFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'bin/grove.js',
  'tools/detect-sprints.js',
  'tools/generate-manifest.js',
  'tools/build-pdf.js',
  'templates/explainer.html',
  'templates/dashboard.html',
  'site/index.html',
];

for (const file of expectedFiles) {
  assert(existsSync(join(ROOT, file)), `${file} exists`);
}

// ─── package.json checks ────────────────────────────────────────────────────

console.log('\n--- package.json ---');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

assert(pkg.name === '@grainulator/grove', 'name is @grainulator/grove');
assert(pkg.type === 'module', 'type is module (ESM)');
assert(pkg.license === 'MIT', 'license is MIT');
assert(pkg.bin?.grove === './bin/grove.js', 'bin points to grove.js');
assert(!pkg.dependencies || Object.keys(pkg.dependencies).length === 0, 'zero runtime dependencies');

// ─── Template checks ────────────────────────────────────────────────────────

console.log('\n--- Templates ---');

const explainer = readFileSync(join(ROOT, 'templates/explainer.html'), 'utf8');
assert(explainer.includes('scroll-snap-type'), 'explainer has scroll-snap');
assert(explainer.includes('{{TITLE}}'), 'explainer has TITLE placeholder');
assert(!explainer.includes('<link'), 'explainer has no external CSS links');
assert(!explainer.includes('<script src'), 'explainer has no external JS');

const dashboard = readFileSync(join(ROOT, 'templates/dashboard.html'), 'utf8');
assert(dashboard.includes('{{SPRINT_QUESTION}}'), 'dashboard has SPRINT_QUESTION placeholder');
assert(dashboard.includes('.phase-track'), 'dashboard has phase track');
assert(dashboard.includes('.evidence-bar'), 'dashboard has evidence bars');

// ─── CLI help check ─────────────────────────────────────────────────────────

console.log('\n--- CLI ---');

try {
  const helpOutput = execFileSync(process.execPath, [join(ROOT, 'bin/grove.js'), 'help'], {
    timeout: 5000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString();
  assert(helpOutput.includes('detect-sprints'), 'grove help lists detect-sprints');
  assert(helpOutput.includes('generate-manifest'), 'grove help lists generate-manifest');
  assert(helpOutput.includes('build-pdf'), 'grove help lists build-pdf');
} catch (e) {
  assert(false, `grove help runs without error: ${e.message}`);
}

// ─── detect-sprints --help check ────────────────────────────────────────────

console.log('\n--- detect-sprints ---');

try {
  const dsHelp = execFileSync(process.execPath, [join(ROOT, 'tools/detect-sprints.js'), '--help'], {
    timeout: 5000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString();
  assert(dsHelp.includes('--json'), 'detect-sprints help mentions --json');
  assert(dsHelp.includes('--active'), 'detect-sprints help mentions --active');
  assert(dsHelp.includes('--root'), 'detect-sprints help mentions --root');
} catch (e) {
  assert(false, `detect-sprints --help runs: ${e.message}`);
}

// ─── Site checks ─────────────────────────────────────────────────────────────

console.log('\n--- Site ---');

const site = readFileSync(join(ROOT, 'site/index.html'), 'utf8');
assert(site.includes('#22c55e'), 'site uses grove green accent');
assert(site.includes('@grainulator/grove'), 'site mentions package name');
assert(site.includes('detect-sprints'), 'site documents detect-sprints');
assert(site.includes('generate-manifest'), 'site documents generate-manifest');
assert(site.includes('build-pdf'), 'site documents build-pdf');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
