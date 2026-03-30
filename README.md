# ascii-fix

```
╔═══════════════════════════════════════╗
║              ascii-fix                ║
║                                       ║
║   Fix broken ASCII art tables,        ║
║   boxes, and diagrams — instantly.    ║
╚═══════════════════════════════════════╝
```

[![npm version](https://img.shields.io/npm/v/ascii-fix)](https://www.npmjs.com/package/ascii-fix)
[![license](https://img.shields.io/npm/l/ascii-fix)](https://github.com/L-ubu/ascii-fix/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/ascii-fix)](https://nodejs.org)

**Zero-dependency** tool that validates and auto-corrects broken ASCII art. AI models love generating ASCII tables and boxes but consistently mess up alignment, padding, corners, and widths. This tool fixes all of that.

## Before / After

```
BEFORE (AI-generated mess):              AFTER (ascii-fix):

╔══════════════════════════╗             ╔════════════════════════════╗
║  SLIMESHELL v0.5.0       ║             ║  SLIMESHELL v0.5.0        ║
╠══════════════════════════╣             ╠════════════════════════════╣
║  73 files · 52k lines  ║             ║  73 files · 52k lines     ║
║  45 pages              ║             ║  45 pages                  ║
╚══════════════════════════╝             ╚════════════════════════════╝
```

```
BEFORE:                                  AFTER:

┌───────┬───┬──────────┐                ┌───────┬─────┬──────────┐
│ Name  │ Age │ City     │                │ Name  │ Age │ City     │
├───────┼───┼──────────┤                ├───────┼─────┼──────────┤
│ Alice │ 30 │ New York │                │ Alice │ 30  │ New York │
│ Bob │ 25 │ LA │                       │ Bob   │ 25  │ LA       │
└───────┴───┴──────────┘                └───────┴─────┴──────────┘
```

## Installation

```bash
# Use directly with npx (no install)
npx ascii-fix input.txt

# Or install globally
npm install -g ascii-fix

# Or add to your project
npm install ascii-fix
```

## CLI Usage

```bash
# Fix from stdin (pipe)
echo "broken table" | npx ascii-fix

# Fix a file
npx ascii-fix input.txt

# Fix with style option
npx ascii-fix --style unicode-heavy input.txt
npx ascii-fix --style unicode-light input.txt
npx ascii-fix --style ascii input.txt
npx ascii-fix --style rounded input.txt

# Convert between styles
cat box.txt | npx ascii-fix --style rounded

# Only detect issues (no fix)
npx ascii-fix --check input.txt

# Fix and write back to file
npx ascii-fix --write input.txt

# Output as JSON (for programmatic use)
npx ascii-fix --json input.txt
```

### Flags

| Flag | Description |
|------|-------------|
| `--style <style>` | Target style: `unicode-heavy`, `unicode-light`, `ascii`, `rounded` |
| `--check` | Detect issues only. Exit code 1 if issues found. |
| `--write` | Fix and write back to file |
| `--json` | Output as JSON |
| `--help` | Show help |

## Library API

```js
import { fix, fixTable, fixBox, detect, convert } from 'ascii-fix';

// Auto-detect and fix everything
const fixed = fix(brokenAscii);

// Fix only tables
const fixedTable = fixTable(brokenTable);

// Fix only boxes
const fixedBox = fixBox(brokenBox, { style: 'rounded' });

// Detect issues without fixing
const issues = detect(input);
// Returns: { type: 'table'|'box'|'none', style, issues: [...], region }

// Convert between styles
const rounded = convert(heavyBox, 'rounded');
```

## Supported Styles

```
Unicode Heavy (default for heavy input):
╔══════════════╗
║  Content     ║
╠══════════════╣
║  More stuff  ║
╚══════════════╝

Unicode Light:
┌──────────────┐
│  Content     │
├──────────────┤
│  More stuff  │
└──────────────┘

Plain ASCII:
+----------------+
|  Content       |
+----------------+
|  More stuff    |
+----------------+

Rounded:
╭──────────────╮
│  Content     │
├──────────────┤
│  More stuff  │
╰──────────────╯
```

## How It Works

1. **Detect** — Identifies ASCII art regions, classifies as table or box, detects the box-drawing style, and catalogs issues (misaligned columns, inconsistent widths, broken corners, mixed styles).

2. **Parse** — Extracts cell content from tables or inner content from boxes, preserving the actual text exactly.

3. **Calculate** — Computes correct column widths for tables or maximum content width for boxes, using Unicode-aware visual width calculation (CJK and emoji characters count as width 2).

4. **Render** — Re-renders the structure with proper alignment, padding, corners, and consistent style. The fixer is idempotent — running it twice gives the same result.

## Cursor Skill

Install the Cursor skill to fix ASCII art directly in your editor:

1. Copy `cursor-skill/SKILL.md` to your project's `.cursor/skills/ascii-fix/SKILL.md`
2. The AI assistant will automatically use it when you ask to fix ASCII art

Or install the npm package and reference it in your skill.

See [cursor-skill/SKILL.md](cursor-skill/SKILL.md) for details.

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests: `npm test`
4. Commit your changes
5. Push to the branch
6. Open a Pull Request

## License

MIT

---

Made by [Lubu](https://github.com/L-ubu)
