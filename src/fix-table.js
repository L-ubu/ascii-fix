import { CHARSETS, isVertical, isHorizontal, isBoxChar, allBoxChars } from './charsets.js';
import { visualWidth, visualPadEnd, normalizeLineEndings, splitLines, stripLeadingIndent, restoreLineEndings } from './utils.js';
import { calculateColumnWidths, padCell } from './fix-alignment.js';
import { detect } from './detect.js';

/**
 * Fix a broken ASCII table.
 * @param {string} text - Input text containing a table.
 * @param {object} [options] - Options.
 * @param {string} [options.style] - Target style (unicode-heavy, unicode-light, ascii, rounded).
 * @returns {string} Fixed text.
 */
export function fixTable(text, options = {}) {
  if (!text || typeof text !== 'string') return text;

  const { text: normalized, hadCRLF } = normalizeLineEndings(text);
  const endsWithNewline = normalized.endsWith('\n');
  const allLines = splitLines(normalized);
  const { lines, indent } = stripLeadingIndent(allLines);

  // Find the region
  const detection = detect(lines.join('\n'));
  if (!detection.region) return text;

  const { startLine, endLine } = detection.region;
  const targetStyle = options.style || detection.style || 'unicode-light';
  if (targetStyle === 'mixed') {
    return fixTable(text, { ...options, style: 'unicode-light' });
  }
  const charset = CHARSETS[targetStyle];
  if (!charset) return text;

  // Extract region lines
  const regionLines = lines.slice(startLine, endLine + 1);

  // Classify each line
  const classified = regionLines.map((line) => classifyTableLine(line));

  // Parse content rows into cells
  const contentRows = [];
  for (const entry of classified) {
    if (entry.type === 'content') {
      const cells = parseCells(entry.line);
      contentRows.push(cells);
    }
  }

  if (contentRows.length === 0) return text;

  // Normalize column count
  const maxCols = Math.max(...contentRows.map((r) => r.length));
  for (const row of contentRows) {
    while (row.length < maxCols) row.push('');
  }

  // Calculate column widths
  const colWidths = calculateColumnWidths(contentRows);

  // Render
  let contentIdx = 0;
  const fixedRegion = classified.map((entry) => {
    switch (entry.type) {
      case 'border-top':
        return renderBorderLine(charset.topLeft, charset.horizontal, charset.teeTop, charset.topRight, colWidths);
      case 'border-bottom':
        return renderBorderLine(charset.bottomLeft, charset.horizontal, charset.teeBottom, charset.bottomRight, colWidths);
      case 'separator':
        return renderBorderLine(charset.teeLeft, charset.horizontal, charset.cross, charset.teeRight, colWidths);
      case 'content': {
        const cells = contentRows[contentIdx++];
        return renderContentLine(charset.vertical, cells, colWidths);
      }
      default:
        return entry.line;
    }
  });

  // Reassemble
  const result = [
    ...lines.slice(0, startLine),
    ...fixedRegion,
    ...lines.slice(endLine + 1),
  ].map((line) => (line ? indent + line : line));

  let output = result.join('\n');
  if (endsWithNewline) output += '\n';
  return restoreLineEndings(output, hadCRLF);
}

function classifyTableLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'empty', line };

  const boxChars = allBoxChars();

  // Check if this is a separator/border line (mostly non-vertical box chars)
  let horizontalCount = 0;
  let verticalCount = 0;
  let otherBoxCount = 0;
  let nonSpaceCount = 0;

  for (const ch of trimmed) {
    if (ch === ' ') continue;
    nonSpaceCount++;
    if (isHorizontal(ch) || ch === '-' || ch === '=') horizontalCount++;
    else if (isVertical(ch) || ch === '|') verticalCount++;
    else if (boxChars.has(ch) || ch === '+') otherBoxCount++;
  }

  const isBorderOrSep = nonSpaceCount > 0 && horizontalCount / nonSpaceCount > 0.5;

  if (isBorderOrSep) {
    // Determine if it's top, bottom, or middle separator
    const firstChar = trimmed[0];
    const chars = [...trimmed];
    const lastChar = chars[chars.length - 1];

    // Check for corner characters
    const isTopBorder = isCornerType(firstChar, 'topLeft') || isCornerType(firstChar, 'teeTop');
    const isBottomBorder = isCornerType(firstChar, 'bottomLeft') || isCornerType(firstChar, 'teeBottom');

    if (isTopBorder && !isBottomBorder) return { type: 'border-top', line: trimmed };
    if (isBottomBorder) return { type: 'border-bottom', line: trimmed };
    return { type: 'separator', line: trimmed };
  }

  if (verticalCount >= 2) return { type: 'content', line: trimmed };

  return { type: 'other', line };
}

function isCornerType(char, role) {
  if (char === '+') return true; // ASCII ambiguous
  for (const [, charset] of Object.entries(CHARSETS)) {
    if (charset[role] === char) return true;
  }
  return false;
}

/**
 * Parse a content line into cells by splitting on vertical delimiters.
 */
function parseCells(line) {
  // Find all vertical delimiter characters and their positions
  const chars = [...line];
  const delimIndices = [];
  for (let i = 0; i < chars.length; i++) {
    if (isVertical(chars[i]) || chars[i] === '|') {
      delimIndices.push(i);
    }
  }

  if (delimIndices.length < 2) return [line.trim()];

  // Extract cells between delimiters
  const cells = [];
  for (let i = 0; i < delimIndices.length - 1; i++) {
    const start = delimIndices[i] + 1;
    const end = delimIndices[i + 1];
    const cellContent = chars.slice(start, end).join('').trim();
    cells.push(cellContent);
  }

  return cells;
}

function renderBorderLine(left, horiz, mid, right, colWidths) {
  const segments = colWidths.map((w) => horiz.repeat(w + 2)); // +2 for padding
  return left + segments.join(mid) + right;
}

function renderContentLine(vertical, cells, colWidths) {
  const paddedCells = cells.map((cell, i) => {
    const width = colWidths[i] || 0;
    return ' ' + padCell(cell, width) + ' ';
  });
  return vertical + paddedCells.join(vertical) + vertical;
}
