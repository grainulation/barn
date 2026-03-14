#!/usr/bin/env node
/**
 * barn — CLI for grainulator/barn tools
 *
 * Usage:
 *   barn <command> [options]
 *
 * Commands:
 *   detect-sprints    Find sprint directories in a repo
 *   generate-manifest Build wheat-manifest.json topic map
 *   build-pdf         Convert markdown to PDF via npx md-to-pdf
 *   help              Show this help message
 *
 * Zero npm dependencies (Node built-in only).
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fork } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = join(__dirname, '..', 'tools');

const commands = {
  'detect-sprints': 'detect-sprints.js',
  'generate-manifest': 'generate-manifest.js',
  'build-pdf': 'build-pdf.js',
};

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(`barn — open tools for structured research

Usage:
  barn <command> [options]

Commands:
  detect-sprints      Find sprint directories in a repo
  generate-manifest   Build wheat-manifest.json topic map
  build-pdf <file>    Convert markdown to PDF via npx md-to-pdf
  help                Show this help message

Examples:
  barn detect-sprints --json
  barn detect-sprints --active
  barn generate-manifest --root /path/to/repo
  barn build-pdf output/brief.md

Zero npm dependencies. Node built-in only.
https://github.com/grainulator/barn`);
  process.exit(0);
}

if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  console.error(`Run "barn help" for available commands.`);
  process.exit(1);
}

const toolPath = join(TOOLS_DIR, commands[command]);
const toolArgs = args.slice(1);

// Fork the tool script, passing remaining args
const child = fork(toolPath, toolArgs, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
