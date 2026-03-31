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

AI models love generating ASCII tables and boxes but consistently mess up column alignment, padding, corners, and widths. **ascii-fix** auto-detects and corrects all of it. Zero dependencies.

## AI Skill (primary use)

The main purpose of ascii-fix is as an **AI skill** — a set of rules and a tool that AI assistants (Cursor, Claude Code, etc.) use to validate and fix ASCII art they generate.

### Install the Cursor skill

Copy `cursor-skill/SKILL.md` into your project:

```bash
mkdir -p .cursor/skills/ascii-fix
cp cursor-skill/SKILL.md .cursor/skills/ascii-fix/SKILL.md
```

Once installed, the AI assistant will:
- **Proactively validate** ASCII art before outputting it
- **Auto-fix** broken ASCII art when you paste it
- **Apply consistent style** across all generated diagrams
- **Know the fix rules** even without the CLI installed

The skill works standalone — it teaches the AI how to fix ASCII art manually. When the CLI is also installed, the AI can pipe content through it for automated fixing.

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

## CLI Tool

```bash
# Use directly with npx (no install needed)
npx ascii-fix input.txt

# Or install globally
npm install -g ascii-fix
```

```bash
# Fix from stdin (pipe)
echo "broken table" | npx ascii-fix

# Fix a file
npx ascii-fix input.txt

# Convert style
cat box.txt | npx ascii-fix --style rounded

# Detect issues only (exit code 1 if broken)
npx ascii-fix --check input.txt

# Fix and write back to file
npx ascii-fix --write input.txt

# JSON output
npx ascii-fix --json input.txt
```

| Flag | Description |
|------|-------------|
| `--style <s>` | Target style: `unicode-heavy`, `unicode-light`, `ascii`, `rounded` |
| `--check` | Detect issues only. Exit 1 if issues found. |
| `--write` | Fix and write back to file |
| `--json` | Output as JSON |
| `--help` | Show help |

## Library API

```bash
npm install ascii-fix
```

```js
import { fix, fixTable, fixBox, detect, convert } from 'ascii-fix';

// Auto-detect and fix everything
const fixed = fix(brokenAscii);

// Fix only tables
const fixedTable = fixTable(brokenTable);

// Fix only boxes
const fixedBox = fixBox(brokenBox, { style: 'rounded' });

// Detect issues without fixing
const result = detect(input);
// → { type: 'table'|'box'|'none', style, issues: [...], region }

// Convert between styles
const rounded = convert(heavyBox, 'rounded');
```

## Supported Styles

```
Unicode Heavy          Unicode Light          Plain ASCII            Rounded
╔══════════════╗       ┌──────────────┐       +----------------+     ╭──────────────╮
║  Content     ║       │  Content     │       |  Content       |     │  Content     │
╠══════════════╣       ├──────────────┤       +----------------+     ├──────────────┤
║  More stuff  ║       │  More stuff  │       |  More stuff    |     │  More stuff  │
╚══════════════╝       └──────────────┘       +----------------+     ╰──────────────╯
```

## How It Works

1. **Detect** — Finds ASCII art regions, classifies as table or box, detects style, catalogs issues
2. **Parse** — Extracts cell content (tables) or inner text (boxes), preserving content exactly
3. **Calculate** — Computes column widths / max content width using Unicode-aware visual width (CJK & emoji = width 2)
4. **Render** — Re-renders with proper alignment, padding, corners, and consistent style

The fixer is **idempotent** — running it twice gives the same result.

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests: `npm test`
4. Commit your changes
5. Open a Pull Request

## License

MIT

---

Made by [Lubu](https://github.com/L-ubu)
