import {
  CHARSETS,
  allBoxChars,
  isBoxChar,
  isVertical,
  isHorizontal,
  charToStyle,
  detectStyle,
} from './charsets.js';
import { visualWidth, splitLines, normalizeLineEndings } from './utils.js';

/**
 * Detect ASCII art type, style, issues, and region in the input text.
 *
 * Returns:
 *   { type: 'table'|'box'|'none', style, issues: [...], region: { startLine, endLine } }
 */
export function detect(text) {
  if (!text || typeof text !== 'string') {
    return { type: 'none', style: null, issues: [], region: null };
  }

  const { text: normalized } = normalizeLineEndings(text);
  const lines = splitLines(normalized);

  const region = findRegion(lines);
  if (!region) {
    return { type: 'none', style: null, issues: [], region: null };
  }

  const regionLines = lines.slice(region.startLine, region.endLine + 1);
  const boxCharsFound = collectBoxChars(regionLines);
  const { style } = detectStyle(boxCharsFound);

  const type = classifyType(regionLines);
  const issues = detectIssues(regionLines, type, style, region.startLine);

  return { type, style, issues, region };
}

/**
 * Find the first contiguous region of ASCII art in the lines.
 */
function findRegion(lines) {
  const boxChars = allBoxChars();
  let startLine = -1;
  let endLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) {
      if (startLine !== -1 && endLine !== -1) {
        // Allow one blank line inside a region, but two breaks it
        const nextNonEmpty = lines.slice(i + 1).findIndex((l) => l.trim().length > 0);
        if (nextNonEmpty === 0) {
          const nextLine = lines[i + 1].trim();
          if (lineHasBoxChars(nextLine, boxChars)) continue;
        }
        break;
      }
      continue;
    }

    if (lineHasBoxChars(trimmed, boxChars)) {
      if (startLine === -1) startLine = i;
      endLine = i;
    } else if (startLine !== -1) {
      // Non-box line after region started — check if it's content between box lines
      // Look ahead to see if more box lines follow
      const hasMoreBox = lines
        .slice(i + 1, i + 3)
        .some((l) => lineHasBoxChars(l.trim(), boxChars));
      if (!hasMoreBox) break;
      endLine = i;
    }
  }

  if (startLine === -1) return null;
  return { startLine, endLine };
}

function lineHasBoxChars(trimmed, boxChars) {
  if (!trimmed) return false;
  for (const ch of trimmed) {
    if (boxChars.has(ch)) return true;
  }
  return false;
}

/**
 * Collect all box-drawing characters from lines.
 */
function collectBoxChars(lines) {
  const boxChars = allBoxChars();
  const found = [];
  for (const line of lines) {
    for (const ch of line) {
      if (boxChars.has(ch)) found.push(ch);
    }
  }
  return found;
}

/**
 * Classify whether the region is a table or a box.
 * Table: content rows have 3+ vertical delimiters.
 * Box: content rows have exactly 2 vertical delimiters (at edges).
 */
function classifyType(lines) {
  const contentRows = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Content rows have vertical delimiters but also non-border content
    return hasVerticalDelimiters(trimmed) && !isSeparatorLine(trimmed);
  });

  if (contentRows.length === 0) return 'box'; // all borders = treat as box

  // Count vertical delimiters in content rows
  let totalDelimiters = 0;
  let rowCount = 0;
  for (const row of contentRows) {
    const count = countVerticalDelimiters(row.trim());
    totalDelimiters += count;
    rowCount++;
  }

  const avgDelimiters = totalDelimiters / rowCount;
  return avgDelimiters > 2.5 ? 'table' : 'box';
}

function hasVerticalDelimiters(line) {
  for (const ch of line) {
    if (isVertical(ch)) return true;
  }
  return false;
}

function countVerticalDelimiters(line) {
  let count = 0;
  for (const ch of line) {
    if (isVertical(ch)) count++;
  }
  return count;
}

function isSeparatorLine(line) {
  // A separator line is mostly horizontal chars, corners, and tees
  const boxChars = allBoxChars();
  let boxCount = 0;
  let totalNonSpace = 0;
  for (const ch of line) {
    if (ch === ' ') continue;
    totalNonSpace++;
    if (boxChars.has(ch) && !isVertical(ch)) boxCount++;
  }
  return totalNonSpace > 0 && boxCount / totalNonSpace > 0.8;
}

/**
 * Detect issues in the ASCII art.
 */
function detectIssues(lines, type, style, lineOffset) {
  const issues = [];

  // Check for mixed styles
  if (style === 'mixed') {
    issues.push({
      type: 'mixed-style',
      line: lineOffset,
      message: 'Multiple box-drawing styles detected in the same block',
    });
  }

  // Check for inconsistent widths
  const widths = lines.filter((l) => l.trim()).map((l) => visualWidth(l.trim()));
  if (widths.length > 1) {
    const maxWidth = Math.max(...widths);
    const minWidth = Math.min(...widths);
    if (maxWidth !== minWidth) {
      issues.push({
        type: 'inconsistent-width',
        line: lineOffset,
        message: `Line widths vary from ${minWidth} to ${maxWidth}`,
      });
    }
  }

  if (type === 'table') {
    detectTableIssues(lines, issues, lineOffset);
  } else if (type === 'box') {
    detectBoxIssues(lines, issues, lineOffset);
  }

  return issues;
}

function detectTableIssues(lines, issues, lineOffset) {
  // Check column alignment: delimiter positions should be consistent
  const delimPositions = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    const positions = [];
    let pos = 0;
    for (const ch of trimmed) {
      if (isVertical(ch) || ch === '+' || ch === '┼' || ch === '╬') {
        positions.push(pos);
      }
      pos++;
    }
    if (positions.length >= 2) {
      delimPositions.push({ line: i + lineOffset, positions });
    }
  }

  if (delimPositions.length >= 2) {
    const refPositions = delimPositions[0].positions;
    for (let i = 1; i < delimPositions.length; i++) {
      const curPositions = delimPositions[i].positions;
      if (curPositions.length !== refPositions.length) {
        issues.push({
          type: 'misaligned-column',
          line: delimPositions[i].line,
          message: `Column count mismatch: expected ${refPositions.length}, found ${curPositions.length}`,
        });
      } else {
        for (let j = 0; j < refPositions.length; j++) {
          if (curPositions[j] !== refPositions[j]) {
            issues.push({
              type: 'misaligned-column',
              line: delimPositions[i].line,
              col: curPositions[j],
              message: `Column ${j} at position ${curPositions[j]}, expected ${refPositions[j]}`,
            });
            break;
          }
        }
      }
    }
  }
}

function detectBoxIssues(lines, issues, lineOffset) {
  // Check for broken corners
  const nonEmpty = lines.filter((l) => l.trim());
  if (nonEmpty.length < 2) return;

  const firstLine = nonEmpty[0].trim();
  const lastLine = nonEmpty[nonEmpty.length - 1].trim();

  // First line should start with a top-left corner
  const firstChar = [...firstLine][0];
  const lastCharFirst = [...firstLine].pop();
  const topLeftRoles = charToStyle(firstChar);
  const topRightRoles = charToStyle(lastCharFirst);

  if (
    topLeftRoles.length > 0 &&
    !topLeftRoles.some((r) => r.role === 'topLeft')
  ) {
    issues.push({
      type: 'broken-corner',
      line: lineOffset,
      message: `Expected top-left corner, found '${firstChar}'`,
    });
  }

  // Last line should end with a bottom-right corner
  const firstCharLast = [...lastLine][0];
  const lastCharLast = [...lastLine].pop();
  const bottomLeftRoles = charToStyle(firstCharLast);
  const bottomRightRoles = charToStyle(lastCharLast);

  if (
    bottomRightRoles.length > 0 &&
    !bottomRightRoles.some((r) => r.role === 'bottomRight')
  ) {
    issues.push({
      type: 'broken-corner',
      line: lineOffset + lines.length - 1,
      message: `Expected bottom-right corner, found '${lastCharLast}'`,
    });
  }
}
