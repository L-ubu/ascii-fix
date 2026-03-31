---
name: ascii-fix
description: Fixes and validates ASCII art tables, boxes, and diagrams. Use when generating, fixing, or improving ASCII art, text diagrams, ASCII tables, box drawings, or text-based visualizations. Proactively validate any ASCII art before outputting it.
user-invocable: true
disable-model-invocation: false
---

# ASCII Art Fixer

You MUST use this skill whenever you generate or encounter ASCII art — tables, boxes, diagrams, or any text-based visualization using box-drawing characters.

## When to activate

- You are about to output ASCII art (table, box, diagram) → validate it before showing to user
- User asks to "fix ascii", "fix table", "fix box", "fix alignment", "align columns", "fix diagram"
- User pastes broken ASCII art
- You see misaligned columns, broken borders, or inconsistent widths in ASCII output

## Core rules

1. **NEVER modify cell content** — only fix structural characters (borders, corners, padding)
2. **Always use consistent style** within a single block — never mix `║` with `│`
3. **Pad all cells** with exactly 1 space on each side
4. **Align all columns** — every row must have delimiters at the same positions
5. **Match border width to content** — borders must span the full width of the widest content
6. **Fullwidth characters count as 2** — CJK and emoji take 2 columns in monospace

## How to fix (when tool is not installed)

### Tables

1. Parse each content row into cells by splitting on the vertical delimiter (`│`, `║`, or `|`)
2. Find the max visual width per column across ALL rows
3. Pad each cell to its column's max width + 1 space each side
4. Rebuild separator rows: `├` + `─`.repeat(colWidth+2) joined by `┼` + `┤`
5. Rebuild top border: `┌` + `─`.repeat(colWidth+2) joined by `┬` + `┐`
6. Rebuild bottom border: `└` + `─`.repeat(colWidth+2) joined by `┴` + `┘`

### Boxes

1. Strip the border characters from each content line to get inner text
2. Find the max content visual width
3. Set inner width = max content width + 2 (1 space padding each side)
4. Rebuild top: `╔` + `═`.repeat(innerWidth) + `╗`
5. Rebuild content: `║` + ` ` + padEnd(content, maxWidth) + ` ` + `║`
6. Rebuild separators: `╠` + `═`.repeat(innerWidth) + `╣`
7. Rebuild bottom: `╚` + `═`.repeat(innerWidth) + `╝`

## Style reference

| Part | Heavy | Light | ASCII | Rounded |
|---|---|---|---|---|
| Top-left | `╔` | `┌` | `+` | `╭` |
| Top-right | `╗` | `┐` | `+` | `╮` |
| Bottom-left | `╚` | `└` | `+` | `╰` |
| Bottom-right | `╝` | `┘` | `+` | `╯` |
| Horizontal | `═` | `─` | `-` | `─` |
| Vertical | `║` | `│` | `\|` | `│` |
| Tee-left | `╠` | `├` | `+` | `├` |
| Tee-right | `╣` | `┤` | `+` | `┤` |
| Tee-top | `╦` | `┬` | `+` | `┬` |
| Tee-bottom | `╩` | `┴` | `+` | `┴` |
| Cross | `╬` | `┼` | `+` | `┼` |

## Using the CLI tool (if installed)

```bash
# Fix from stdin
echo '<ascii art>' | npx ascii-fix

# Fix with style conversion
echo '<ascii art>' | npx ascii-fix --style rounded

# Detect issues only
echo '<ascii art>' | npx ascii-fix --check

# Fix a file in-place
npx ascii-fix --write input.txt
```

## Using the library (if installed)

```js
import { fix, fixTable, fixBox, detect, convert } from 'ascii-fix';

const fixed = fix(brokenAscii);
const issues = detect(input);           // { type, style, issues, region }
const rounded = convert(input, 'rounded');
```

## Self-check before outputting ASCII art

Before showing any ASCII art to the user, verify:

1. Every row in a table has the same number of columns
2. Every line in a box/table has the same visual width
3. All corners match (e.g. `┌` pairs with `┐`, not `╗`)
4. No mixed styles (don't use `║` and `│` in the same block)
5. All cells have consistent padding (1 space each side)
6. Separator rows have crosses at every column boundary

If any check fails, fix it before outputting. If `ascii-fix` is installed, pipe through it. If not, apply the manual fix rules above.
