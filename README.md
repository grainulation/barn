# grove

Open tools for structured research. Use with wheat, or use standalone.

Grove extracts the reusable utilities from the [wheat](https://github.com/aid-ninja/wheat) research sprint system into a standalone package. Zero npm dependencies -- Node built-in only.

## Install

```bash
npm install @grainulator/grove
```

Or use directly:

```bash
npx @grainulator/grove detect-sprints --json
```

## Tools

### detect-sprints

Find sprint directories in a repo by scanning for `claims.json` files. Uses git history to determine which sprint is active.

```bash
grove detect-sprints              # Human-readable output
grove detect-sprints --json       # Machine-readable JSON
grove detect-sprints --active     # Print only the active sprint path
grove detect-sprints --root /path # Scan a specific directory
```

### generate-manifest

Build a `wheat-manifest.json` topic map from claims, files, and git history. Gives AI tools (and humans) a single file that describes the entire sprint state.

```bash
grove generate-manifest                        # Write wheat-manifest.json
grove generate-manifest --root /path           # Target a specific repo
grove generate-manifest --out custom-name.json # Custom output path
```

### build-pdf

Convert markdown to PDF via `md-to-pdf` (invoked through npx -- no local install needed).

```bash
grove build-pdf output/brief.md
```

## Templates

HTML templates for sprint artifacts. Self-contained (inline CSS/JS, no external deps), dark theme, mobile responsive.

- **explainer.html** -- Full-screen scroll-snap presentation. Replace `{{TITLE}}` and `{{SUBTITLE}}` placeholders, add `.slide` sections.
- **dashboard.html** -- Sprint status dashboard. Populate from `compilation.json` data. Includes phase progress, evidence bars, conflict tracking, and claim inventory.

Copy templates into your project:

```bash
cp node_modules/@grainulator/grove/templates/explainer.html ./output/
```

## Philosophy

- Zero npm dependencies. Node built-in modules only.
- Git as the source of truth. No config files for state that git already knows.
- Self-describing structures. New sessions understand the repo without full scans.
- Works with AI search tools (Glob, Grep, Read) out of the box.

## License

MIT
