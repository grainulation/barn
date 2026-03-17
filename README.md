# @grainulation/barn

[![npm version](https://img.shields.io/npm/v/@grainulation/barn)](https://www.npmjs.com/package/@grainulation/barn) [![npm downloads](https://img.shields.io/npm/dm/@grainulation/barn)](https://www.npmjs.com/package/@grainulation/barn) [![license](https://img.shields.io/npm/l/@grainulation/barn)](https://github.com/grainulation/barn/blob/main/LICENSE) [![node](https://img.shields.io/node/v/@grainulation/barn)](https://nodejs.org) [![CI](https://github.com/grainulation/barn/actions/workflows/ci.yml/badge.svg)](https://github.com/grainulation/barn/actions)

**Shared tools for the grainulation ecosystem.**

Barn extracts the reusable utilities from [wheat](https://github.com/grainulation/wheat) into a standalone package. Sprint detection, manifest generation, PDF builds, and 17 HTML templates for research artifacts.

## Install

```bash
npm install @grainulation/barn
```

Or use directly:

```bash
npx @grainulation/barn detect-sprints --json
```

## Tools

### detect-sprints

Find sprint directories in a repo by scanning for `claims.json` files. Uses git history to determine which sprint is active.

```bash
barn detect-sprints              # Human-readable output
barn detect-sprints --json       # Machine-readable JSON
barn detect-sprints --active     # Print only the active sprint path
barn detect-sprints --root /path # Scan a specific directory
```

### generate-manifest

Build a `wheat-manifest.json` topic map from claims, files, and git history. Gives AI tools (and humans) a single file that describes the entire sprint state.

```bash
barn generate-manifest                        # Write wheat-manifest.json
barn generate-manifest --root /path           # Target a specific repo
barn generate-manifest --out custom-name.json # Custom output path
```

### build-pdf

Convert markdown to PDF via `md-to-pdf` (invoked through npx -- no local install needed).

```bash
barn build-pdf output/brief.md
```

## Templates

17 self-contained HTML templates for sprint artifacts. Dark theme, inline CSS/JS, no external deps, mobile responsive.

| Template | Purpose |
|----------|---------|
| `adr.html` | Architecture Decision Record |
| `brief.html` | Sprint brief / recommendation document |
| `certificate.html` | Compilation certificate |
| `changelog.html` | Sprint changelog |
| `comparison.html` | Side-by-side comparison dashboard |
| `conflict-map.html` | Claim conflict visualization |
| `dashboard.html` | Sprint status dashboard |
| `email-digest.html` | Email digest summary |
| `evidence-matrix.html` | Evidence tier matrix |
| `explainer.html` | Full-screen scroll-snap presentation |
| `handoff.html` | Knowledge transfer document |
| `one-pager.html` | Single-page executive summary |
| `postmortem.html` | Sprint postmortem |
| `rfc.html` | Request for Comments |
| `risk-register.html` | Risk tracking register |
| `slide-deck.html` | Slide deck presentation |
| `wiki-page.html` | Wiki-style documentation page |

```bash
cp node_modules/@grainulation/barn/templates/explainer.html ./output/
```

## Zero dependencies

Node built-in modules only. No npm install waterfall.

## Part of the grainulation ecosystem

| Tool | Role |
|------|------|
| [wheat](https://github.com/grainulation/wheat) | Research engine -- grow structured evidence |
| [farmer](https://github.com/grainulation/farmer) | Permission dashboard -- approve AI actions in real time |
| **barn** | Shared tools -- templates, validators, sprint detection |
| [mill](https://github.com/grainulation/mill) | Format conversion -- export to PDF, CSV, slides, 24 formats |
| [silo](https://github.com/grainulation/silo) | Knowledge storage -- reusable claim libraries and packs |
| [harvest](https://github.com/grainulation/harvest) | Analytics -- cross-sprint patterns and prediction scoring |
| [orchard](https://github.com/grainulation/orchard) | Orchestration -- multi-sprint coordination and dependencies |
| [grainulation](https://github.com/grainulation/grainulation) | Unified CLI -- single entry point to the ecosystem |

## License

MIT
