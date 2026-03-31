# ascii-fix

```
+---------------------------------------+
|              ascii-fix                |
|                                       |
|   Fix broken ASCII art tables,        |
|   boxes, and diagrams -- instantly.   |
+---------------------------------------+
```

[![npm version](https://img.shields.io/npm/v/ascii-fix)](https://www.npmjs.com/package/ascii-fix)
[![license](https://img.shields.io/npm/l/ascii-fix)](https://github.com/L-ubu/ascii-fix/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/ascii-fix)](https://nodejs.org)

AI models love generating ASCII tables and boxes but consistently mess up column alignment, padding, corners, and widths. **ascii-fix** auto-detects and corrects all of it. Zero dependencies.

> **Want AI rules instead of a tool?** See [ascii-fix-rules](https://github.com/L-ubu/ascii-fix-rules) — install with `npx ascii-fix-rules init` to teach your AI assistant to generate correct ASCII art without needing this tool.

## Before / After

```
BEFORE (AI-generated mess):              AFTER (ascii-fix):

+----------------------------+           +----------------------------+
|  SLIMESHELL v0.5.0         |           |  SLIMESHELL v0.5.0         |
+----------------------------+           +----------------------------+
|  73 files . 52k lines  |              |  73 files . 52k lines      |
|  45 pages              |              |  45 pages                   |
+----------------------------+           +----------------------------+
```

```
BEFORE:                                  AFTER:

+-------+-----+----------+              +-------+-----+----------+
| Name  | Age | City     |              | Name  | Age | City     |
+-------+-----+----------+              +-------+-----+----------+
| Alice | 30 | New York |               | Alice | 30  | New York |
| Bob | 25 | LA |                       | Bob   | 25  | LA       |
+-------+-----+----------+              +-------+-----+----------+
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

| Style | Characters |
|-------|-----------|
| Unicode Heavy | `+` `=` `\|` corners: top `+` bottom `+` |
| Unicode Light | `+` `-` `\|` corners: top `+` bottom `+` |
| Plain ASCII | `+` `-` `\|` |
| Rounded | `+` `-` `\|` rounded corners |

The tool supports 4 box-drawing character sets: **unicode-heavy** (`╔═╗║`), **unicode-light** (`┌─┐│`), **plain ASCII** (`+-|`), and **rounded** (`╭─╮│`). Use `--style` to convert between them.

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
