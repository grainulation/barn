#!/usr/bin/env node
/**
 * barn serve — local HTTP server for the barn UI
 *
 * Two-column template browser with sprint auto-detection.
 * SSE for live updates, POST endpoints for actions.
 * Zero npm dependencies (node:http only).
 *
 * Usage:
 *   barn serve [--port 9093] [--root /path/to/repo]
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync, watchFile } from 'node:fs';
import { join, resolve, extname, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const TEMPLATES_DIR = join(__dirname, '..', 'templates');
const TOOLS_DIR = join(__dirname, '..', 'tools');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const PORT = parseInt(arg('port', '9093'), 10);
const ROOT = resolve(arg('root', process.cwd()));

// ── State ─────────────────────────────────────────────────────────────────────

let state = {
  templates: [],
  sprints: [],
  activeSprint: null,
  manifest: null,
};

const sseClients = new Set();

function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch { sseClients.delete(res); }
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────

function loadTemplates() {
  const templates = [];
  if (!existsSync(TEMPLATES_DIR)) return templates;

  for (const file of readdirSync(TEMPLATES_DIR)) {
    if (!file.endsWith('.html')) continue;
    const filePath = join(TEMPLATES_DIR, file);
    const content = readFileSync(filePath, 'utf8');
    const name = file.replace('.html', '');

    // Extract placeholders
    const placeholders = [...new Set(content.match(/\{\{[A-Z_]+\}\}/g) || [])];

    // Extract description from first comment
    const commentMatch = content.match(/<!--\s*(.*?)\s*-->/);
    const description = commentMatch ? commentMatch[1] : '';

    // Count lines and size
    const lines = content.split('\n').length;
    const size = statSync(filePath).size;

    // Detect features
    const features = [];
    if (content.includes('scroll-snap')) features.push('scroll-snap');
    if (content.includes('@media')) features.push('responsive');
    if (content.includes('var(--')) features.push('css-variables');
    if (content.includes('<table')) features.push('tables');
    if (content.includes('.card')) features.push('cards');
    if (content.includes('.slide')) features.push('slides');

    templates.push({ name, file, placeholders, description, lines, size, features });
  }
  return templates;
}

function loadSprints() {
  try {
    const mod = join(TOOLS_DIR, 'detect-sprints.js');
    if (!existsSync(mod)) return { sprints: [], active: null };

    const result = execFileSync('node', [mod, '--json', '--root', ROOT], {
      timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const data = JSON.parse(result.toString());
    return {
      sprints: data.sprints || [],
      active: (data.sprints || []).find(s => s.status === 'active') || null,
    };
  } catch {
    return { sprints: [], active: null };
  }
}

function loadManifest() {
  const manifestPath = join(ROOT, 'wheat-manifest.json');
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

async function refreshState() {
  state.templates = loadTemplates();
  const sprintData = loadSprints();
  state.sprints = sprintData.sprints;
  state.activeSprint = sprintData.active;
  state.manifest = loadManifest();
  broadcast({ type: 'state', data: state });
}

// ── MIME types ────────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── SSE endpoint ──
  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ type: 'state', data: state })}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // ── API: state ──
  if (req.method === 'GET' && url.pathname === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }

  // ── API: template content ──
  if (req.method === 'GET' && url.pathname === '/api/template') {
    const name = url.searchParams.get('name');
    if (!name) { res.writeHead(400); res.end('missing name'); return; }
    const filePath = join(TEMPLATES_DIR, name + '.html');
    if (!existsSync(filePath)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(readFileSync(filePath, 'utf8'));
    return;
  }

  // ── API: refresh ──
  if (req.method === 'POST' && url.pathname === '/api/refresh') {
    await refreshState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }

  // ── Static files ──
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;

  // Prevent directory traversal
  const resolved = resolve(PUBLIC_DIR, '.' + filePath);
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }

  if (existsSync(resolved) && statSync(resolved).isFile()) {
    const ext = extname(resolved);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(resolved));
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

// ── File watching ─────────────────────────────────────────────────────────────

// Watch templates dir for changes
if (existsSync(TEMPLATES_DIR)) {
  for (const file of readdirSync(TEMPLATES_DIR)) {
    if (file.endsWith('.html')) {
      watchFile(join(TEMPLATES_DIR, file), { interval: 2000 }, () => refreshState());
    }
  }
}

// Watch claims.json for sprint changes
const claimsPath = join(ROOT, 'claims.json');
if (existsSync(claimsPath)) {
  watchFile(claimsPath, { interval: 2000 }, () => refreshState());
}

// ── Start ─────────────────────────────────────────────────────────────────────

await refreshState();

server.listen(PORT, () => {
  console.log(`barn: serving on http://localhost:${PORT}`);
  console.log(`  templates: ${state.templates.length} found`);
  console.log(`  sprints: ${state.sprints.length} detected`);
  if (state.activeSprint) {
    console.log(`  active: ${state.activeSprint.name} (${state.activeSprint.phase})`);
  }
  console.log(`  root: ${ROOT}`);
});
