// String width and text utility helpers — zero dependencies

/**
 * Calculate the visual display width of a string in a monospace terminal.
 * Accounts for fullwidth CJK, emoji (width 2), combining marks (width 0).
 */
export function visualWidth(str) {
  if (!str) return 0;

  // Fast path: pure ASCII
  let allAscii = true;
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 0x7e) {
      allAscii = false;
      break;
    }
  }
  if (allAscii) return str.length;

  // Slow path: iterate codepoints
  let width = 0;
  for (const char of str) {
    const cp = char.codePointAt(0);
    width += codePointWidth(cp);
  }
  return width;
}

function codePointWidth(cp) {
  // Control characters
  if (cp < 0x20) return 0;
  // ASCII
  if (cp < 0x7f) return 1;
  // More control chars
  if (cp >= 0x7f && cp < 0xa0) return 0;

  // Combining marks (width 0)
  if (
    (cp >= 0x0300 && cp <= 0x036f) || // Combining Diacritical Marks
    (cp >= 0x0483 && cp <= 0x0489) || // Cyrillic combining
    (cp >= 0x0591 && cp <= 0x05bd) || // Hebrew combining
    (cp >= 0x05bf && cp <= 0x05bf) ||
    (cp >= 0x05c1 && cp <= 0x05c2) ||
    (cp >= 0x05c4 && cp <= 0x05c5) ||
    (cp >= 0x05c7 && cp <= 0x05c7) ||
    (cp >= 0x0610 && cp <= 0x061a) || // Arabic combining
    (cp >= 0x064b && cp <= 0x065f) ||
    (cp >= 0x0670 && cp <= 0x0670) ||
    (cp >= 0x06d6 && cp <= 0x06dc) ||
    (cp >= 0x06df && cp <= 0x06e4) ||
    (cp >= 0x06e7 && cp <= 0x06e8) ||
    (cp >= 0x06ea && cp <= 0x06ed) ||
    (cp >= 0x0711 && cp <= 0x0711) ||
    (cp >= 0x0730 && cp <= 0x074a) ||
    (cp >= 0x0e31 && cp <= 0x0e31) || // Thai combining
    (cp >= 0x0e34 && cp <= 0x0e3a) ||
    (cp >= 0x0e47 && cp <= 0x0e4e) ||
    (cp >= 0x1dc0 && cp <= 0x1dff) || // Combining Diacritical Marks Supplement
    (cp >= 0x20d0 && cp <= 0x20ff) || // Combining Diacritical Marks for Symbols
    (cp >= 0xfe00 && cp <= 0xfe0f) || // Variation Selectors
    (cp >= 0xfe20 && cp <= 0xfe2f) || // Combining Half Marks
    (cp >= 0xe0100 && cp <= 0xe01ef) // Variation Selectors Supplement
  ) {
    return 0;
  }

  // Zero-width characters
  if (
    cp === 0x200b || // Zero Width Space
    cp === 0x200c || // Zero Width Non-Joiner
    cp === 0x200d || // Zero Width Joiner
    cp === 0x200e || // Left-to-Right Mark
    cp === 0x200f || // Right-to-Left Mark
    cp === 0x2028 || // Line Separator
    cp === 0x2029 || // Paragraph Separator
    cp === 0x202a || // Left-to-Right Embedding
    cp === 0x202b || // Right-to-Left Embedding
    cp === 0x202c || // Pop Directional Formatting
    cp === 0x202d || // Left-to-Right Override
    cp === 0x202e || // Right-to-Left Override
    cp === 0x2060 || // Word Joiner
    cp === 0x2061 || // Function Application
    cp === 0x2062 || // Invisible Times
    cp === 0x2063 || // Invisible Separator
    cp === 0x2064 || // Invisible Plus
    cp === 0xfeff || // Zero Width No-Break Space (BOM)
    cp === 0x00ad // Soft Hyphen
  ) {
    return 0;
  }

  // Fullwidth characters (width 2)
  if (
    (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
    (cp >= 0x2329 && cp <= 0x232a) || // Left/Right-Pointing Angle Bracket
    (cp >= 0x2e80 && cp <= 0x2ef3) || // CJK Radicals Supplement
    (cp >= 0x2f00 && cp <= 0x2fd5) || // Kangxi Radicals
    (cp >= 0x2ff0 && cp <= 0x303e) || // CJK Symbols and Punctuation
    (cp >= 0x3041 && cp <= 0x3096) || // Hiragana
    (cp >= 0x3099 && cp <= 0x30ff) || // Katakana
    (cp >= 0x3105 && cp <= 0x312f) || // Bopomofo
    (cp >= 0x3131 && cp <= 0x318e) || // Hangul Compatibility Jamo
    (cp >= 0x3190 && cp <= 0x31e3) || // Kanbun, CJK Strokes
    (cp >= 0x31f0 && cp <= 0x321e) || // Katakana Phonetic Extensions
    (cp >= 0x3220 && cp <= 0x3247) || // Enclosed CJK
    (cp >= 0x3250 && cp <= 0x4dbf) || // CJK Extension A + misc
    (cp >= 0x4e00 && cp <= 0xa48c) || // CJK Unified Ideographs
    (cp >= 0xa490 && cp <= 0xa4c6) || // Yi Radicals
    (cp >= 0xa960 && cp <= 0xa97c) || // Hangul Jamo Extended-A
    (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul Syllables
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
    (cp >= 0xfe10 && cp <= 0xfe19) || // Vertical Forms
    (cp >= 0xfe30 && cp <= 0xfe6b) || // CJK Compatibility Forms
    (cp >= 0xff01 && cp <= 0xff60) || // Fullwidth Forms
    (cp >= 0xffe0 && cp <= 0xffe6) || // Fullwidth Signs
    (cp >= 0x1f000 && cp <= 0x1f9ff) || // Emoji & Symbols
    (cp >= 0x1fa00 && cp <= 0x1fa6f) || // Chess Symbols, Extended-A
    (cp >= 0x1fa70 && cp <= 0x1faff) || // Symbols Extended-A
    (cp >= 0x20000 && cp <= 0x2fffd) || // CJK Supplementary
    (cp >= 0x30000 && cp <= 0x3fffd) // CJK Tertiary
  ) {
    return 2;
  }

  // Misc symbols often rendered as wide in terminals
  if (
    (cp >= 0x2600 && cp <= 0x27bf) || // Misc Symbols, Dingbats
    (cp >= 0x2b50 && cp <= 0x2b55) // Stars, circles
  ) {
    return 2;
  }

  return 1;
}

/**
 * Pad a string to a target visual width using padChar (default space).
 */
export function visualPadEnd(str, targetWidth, padChar = ' ') {
  const currentWidth = visualWidth(str);
  if (currentWidth >= targetWidth) return str;
  const needed = targetWidth - currentWidth;
  return str + padChar.repeat(needed);
}

/**
 * Normalize line endings to LF. Returns { text, hadCRLF }.
 */
export function normalizeLineEndings(text) {
  const hadCRLF = text.includes('\r\n');
  return { text: text.replace(/\r\n/g, '\n'), hadCRLF };
}

/**
 * Split text into lines. Handles trailing newline consistently.
 */
export function splitLines(text) {
  const lines = text.split('\n');
  // Remove trailing empty string from final newline
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

/**
 * Strip the minimum common leading whitespace from lines.
 * Returns { lines, indent }.
 */
export function stripLeadingIndent(lines) {
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const match = line.match(/^(\s*)/);
    if (match && match[1].length < minIndent) {
      minIndent = match[1].length;
    }
  }

  if (minIndent === Infinity || minIndent === 0) {
    return { lines, indent: '' };
  }

  const indent = lines.find((l) => l.trim() !== '')?.slice(0, minIndent) || '';
  const stripped = lines.map((line) =>
    line.trim() === '' ? '' : line.slice(minIndent),
  );
  return { lines: stripped, indent };
}

/**
 * Restore CRLF line endings if the original had them.
 */
export function restoreLineEndings(text, hadCRLF) {
  if (!hadCRLF) return text;
  return text.replace(/\n/g, '\r\n');
}
