/**
 * @grainulation/barn — public API surface
 *
 * The barn server (lib/server.js) runs as a standalone process.
 * Tools are available via subpath exports (e.g., "@grainulation/barn/detect-sprints").
 *
 * This module provides package metadata for programmatic consumers.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

export const name = pkg.name;
export const version = pkg.version;
