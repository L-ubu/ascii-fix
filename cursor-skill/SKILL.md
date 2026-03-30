# ASCII Fix

Fix broken ASCII art tables, boxes, and diagrams.

## Description

This skill fixes common issues in AI-generated ASCII art:
- Misaligned columns in tables
- Inconsistent box widths
- Broken corner characters
- Mixed box-drawing styles
- Uneven padding

## When to Use

Trigger this skill when:
- The user asks to "fix ascii", "fix table", "fix box", "align ascii", "fix alignment", "fix diagram"
- You generate ASCII art and want to validate it before outputting
- The user pastes broken ASCII art and asks for help

## How to Use

### Option 1: CLI (if ascii-fix is installed)

Pipe the broken ASCII art through the CLI:

```bash
echo '<broken ascii art>' | npx ascii-fix
```

With style conversion:

```bash
echo '<broken ascii art>' | npx ascii-fix --style rounded
```

To check for issues without fixing:

```bash
echo '<ascii art>' | npx ascii-fix --check
```

### Option 2: Programmatic (if ascii-fix is a dependency)

```js
import { fix, fixTable, fixBox, detect, convert } from 'ascii-fix';

const fixed = fix(brokenInput);
const converted = convert(input, 'rounded');
```

### Option 3: Manual Fix Rules

If the tool is not installed, apply these rules manually:

**For tables:**
1. Split each content row into cells by the vertical delimiter
2. Calculate the maximum visual width for each column across all rows
3. Pad each cell to its column's max width (1 space padding on each side)
4. Re-render separator rows to match the new column widths
5. Re-render top/bottom borders to match

**For boxes:**
1. Extract the inner content from each content line
2. Find the maximum content width
3. Re-render all border/separator lines to: content width + 2 (for padding)
4. Pad all content lines to the max width

**Style characters:**
- Unicode Heavy: `╔═╗║╚╝╠╣╬╦╩`
- Unicode Light: `┌─┐│└┘├┤┼┬┴`
- ASCII: `+-|`
- Rounded: `╭─╮│╰╯├┤┼┬┴`

## Examples

### Fix a broken table

Input:
```
┌───────┬───┬──────────┐
│ Name  │ Age │ City     │
├───────┼───┼──────────┤
│ Alice │ 30 │ New York │
│ Bob │ 25 │ LA │
└───────┴───┴──────────┘
```

Output:
```
┌───────┬─────┬──────────┐
│ Name  │ Age │ City     │
├───────┼─────┼──────────┤
│ Alice │ 30  │ New York │
│ Bob   │ 25  │ LA       │
└───────┴─────┴──────────┘
```

### Fix a broken box

Input:
```
╔══════════════════════════╗
║  Title                    ║
╠══════════════════════════╣
║  Some content           ║
╚══════════════════════════╝
```

Output:
```
╔═══════════════════════════╗
║  Title                    ║
╠═══════════════════════════╣
║  Some content             ║
╚═══════════════════════════╝
```

### Convert style

```bash
cat heavy-box.txt | npx ascii-fix --style rounded
```

Converts `╔═╗║╚╝` to `╭─╮│╰╯`.

## Important Notes

- **Never modify cell content** — only fix structural characters and whitespace
- The fixer is **idempotent** — running it twice gives the same result
- Handles **fullwidth characters** (CJK, emoji) correctly for alignment
- Supports **CRLF and LF** line endings
- **Preserves indentation** of the entire block
