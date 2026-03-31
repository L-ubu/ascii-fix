import { CHARSETS, isVertical, isHorizontal, allBoxChars } from './charsets.js';
import { visualWidth, visualPadEnd, normalizeLineEndings, splitLines, stripLeadingIndent, restoreLineEndings } from './utils.js';
import { detect } from './detect.js';

/**
 * Fix a broken ASCII box.
 * @param {string} text - Input text containing a box.
 * @param {object} [options] - Options.
 * @param {string} [options.style] - Target style.
 * @returns {string} Fixed text.
 */
export function fixBox(text, options = {}) {
  if (!text || typeof text !== 'string') return text;

  const { text: normalized, hadCRLF } = normalizeLineEndings(text);
  const endsWithNewline = normalized.endsWith('\n');
  const allLines = splitLines(normalized);
  const { lines, indent } = stripLeadingIndent(allLines);

  const detection = detect(lines.join('\n'));
  if (!detection.region) return text;

  const { startLine, endLine } = detection.region;
  const targetStyle = options.style || detection.style || 'unicode-light';
  if (targetStyle === 'mixed') {
    return fixBox(text, { ...options, style: 'unicode-light' });
  }
  const charset = CHARSETS[targetStyle];
  if (!charset) return text;

  const regionLines = lines.slice(startLine, endLine + 1);

  // Classify each line and resolve ambiguous ASCII borders
  const classified = resolveAmbiguousBorders(
    regionLines.map((line) => classifyBoxLine(line)),
  );

  // Extract content from content lines
  const contents = [];
  for (const entry of classified) {
    if (entry.type === 'content') {
      contents.push(extractBoxContent(entry.line));
    }
  }

  // Calculate max content width
  const maxContentWidth = Math.max(0, ...contents.map((c) => visualWidth(c)));

  // Total inner width: content + 2 (1 space padding each side)
  const innerWidth = maxContentWidth + 2;

  // Render
  let contentIdx = 0;
  const fixedRegion = classified.map((entry) => {
    switch (entry.type) {
      case 'border-top':
        return charset.topLeft + charset.horizontal.repeat(innerWidth) + charset.topRight;
      case 'border-bottom':
        return charset.bottomLeft + charset.horizontal.repeat(innerWidth) + charset.bottomRight;
      case 'separator':
        return charset.teeLeft + charset.horizontal.repeat(innerWidth) + charset.teeRight;
      case 'content': {
        const content = contents[contentIdx++];
        return charset.vertical + ' ' + visualPadEnd(content, maxContentWidth) + ' ' + charset.vertical;
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

function classifyBoxLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'empty', line };

  let horizontalCount = 0;
  let verticalCount = 0;
  let nonSpaceCount = 0;
  const boxChars = allBoxChars();

  for (const ch of trimmed) {
    if (ch === ' ') continue;
    nonSpaceCount++;
    if (isHorizontal(ch) || ch === '-' || ch === '=') horizontalCount++;
    else if (isVertical(ch) || ch === '|') verticalCount++;
  }

  // Border/separator: mostly horizontal chars
  if (nonSpaceCount > 0 && horizontalCount / nonSpaceCount > 0.5) {
    const firstChar = trimmed[0];

    // Determine type by first character (skip ASCII — all corners are '+')
    for (const [styleName, cs] of Object.entries(CHARSETS)) {
      if (styleName === 'ascii') continue;
      if (firstChar === cs.topLeft) return { type: 'border-top', line: trimmed };
      if (firstChar === cs.bottomLeft) return { type: 'border-bottom', line: trimmed };
      if (firstChar === cs.teeLeft) return { type: 'separator', line: trimmed };
    }

    // ASCII ambiguous: use position heuristic
    if (firstChar === '+') {
      // Will be determined by position in the final array
      return { type: 'border-or-sep', line: trimmed };
    }

    return { type: 'separator', line: trimmed };
  }

  // Content line: has vertical delimiters
  if (verticalCount >= 2) return { type: 'content', line: trimmed };

  return { type: 'other', line };
}

/**
 * Extract inner content from a box content line.
 * e.g., "║  Some content  ║" → "Some content"
 */
function extractBoxContent(line) {
  const chars = [...line];

  // Find first and last vertical delimiter
  let start = -1;
  let end = -1;
  for (let i = 0; i < chars.length; i++) {
    if (isVertical(chars[i]) || chars[i] === '|') {
      if (start === -1) start = i;
      end = i;
    }
  }

  if (start === -1 || start === end) return line.trim();

  // Extract content between delimiters, trim single space padding but preserve content
  const inner = chars.slice(start + 1, end).join('');
  // Trim exactly 1 leading space and trailing whitespace
  const trimmed = inner.replace(/^ /, '').replace(/\s+$/, '');
  return trimmed;
}

/**
 * Post-process classified lines to resolve ambiguous ASCII borders.
 * First border-or-sep becomes border-top, last becomes border-bottom, rest become separators.
 */
function resolveAmbiguousBorders(classified) {
  let firstBorderIdx = -1;
  let lastBorderIdx = -1;

  for (let i = 0; i < classified.length; i++) {
    if (classified[i].type === 'border-or-sep') {
      if (firstBorderIdx === -1) firstBorderIdx = i;
      lastBorderIdx = i;
    }
  }

  for (let i = 0; i < classified.length; i++) {
    if (classified[i].type === 'border-or-sep') {
      if (i === firstBorderIdx) classified[i].type = 'border-top';
      else if (i === lastBorderIdx) classified[i].type = 'border-bottom';
      else classified[i].type = 'separator';
    }
  }

  return classified;
}
