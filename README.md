# barn

Open tools for structured research. Use with wheat, or use standalone.

Barn extracts the reusable utilities from the [wheat](https://github.com/grainulation/wheat) research sprint system into a standalone package. Zero npm dependencies -- Node built-in only.

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

HTML templates for sprint artifacts. Self-contained (inline CSS/JS, no external deps), dark theme, mobile responsive.

- **adr.html** -- Architecture Decision Record
- **brief.html** -- Sprint brief / recommendation document
- **certificate.html** -- Compilation certificate
- **changelog.html** -- Sprint changelog
- **comparison.html** -- Side-by-side comparison dashboard
- **conflict-map.html** -- Claim conflict visualization
- **dashboard.html** -- Sprint status dashboard
- **email-digest.html** -- Email digest summary
- **evidence-matrix.html** -- Evidence tier matrix
- **explainer.html** -- Full-screen scroll-snap presentation
- **handoff.html** -- Knowledge transfer document
- **one-pager.html** -- Single-page executive summary
- **postmortem.html** -- Sprint postmortem
- **rfc.html** -- Request for Comments
- **risk-register.html** -- Risk tracking register
- **slide-deck.html** -- Slide deck presentation
- **wiki-page.html** -- Wiki-style documentation page

Copy templates into your project:

```bash
cp node_modules/@grainulation/barn/templates/explainer.html ./output/
```

## Philosophy

- Zero npm dependencies. Node built-in modules only.
- Git as the source of truth. No config files for state that git already knows.
- Self-describing structures. New sessions understand the repo without full scans.
- Works with AI search tools (Glob, Grep, Read) out of the box.

## License

MIT
