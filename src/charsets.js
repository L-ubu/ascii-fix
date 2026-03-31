// Box-drawing character sets for all supported styles

export const CHARSETS = {
  'unicode-heavy': {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    teeLeft: '╠',
    teeRight: '╣',
    teeTop: '╦',
    teeBottom: '╩',
    cross: '╬',
  },
  'unicode-light': {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    teeLeft: '├',
    teeRight: '┤',
    teeTop: '┬',
    teeBottom: '┴',
    cross: '┼',
  },
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    teeLeft: '+',
    teeRight: '+',
    teeTop: '+',
    teeBottom: '+',
    cross: '+',
  },
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    teeLeft: '├',
    teeRight: '┤',
    teeTop: '┬',
    teeBottom: '┴',
    cross: '┼',
  },
};

// Build reverse lookup: char → [{ style, role }]
const _charMap = new Map();
for (const [style, chars] of Object.entries(CHARSETS)) {
  for (const [role, char] of Object.entries(chars)) {
    if (!_charMap.has(char)) _charMap.set(char, []);
    _charMap.get(char).push({ style, role });
  }
}

// Set of all box-drawing characters across all styles
const _allBoxChars = new Set(_charMap.keys());

/**
 * Get all styles a character belongs to.
 * Returns array of { style, role } or empty array.
 */
export function charToStyle(char) {
  return _charMap.get(char) || [];
}

/**
 * Set of every box-drawing character across all styles.
 */
export function allBoxChars() {
  return _allBoxChars;
}

/**
 * Check if a character is any kind of box-drawing character.
 */
export function isBoxChar(char) {
  return _allBoxChars.has(char);
}

/**
 * Check if a character is a vertical delimiter in any style.
 */
export function isVertical(char) {
  const entries = _charMap.get(char);
  if (!entries) return false;
  return entries.some((e) => e.role === 'vertical');
}

/**
 * Check if a character is a horizontal line in any style.
 */
export function isHorizontal(char) {
  const entries = _charMap.get(char);
  if (!entries) return false;
  return entries.some((e) => e.role === 'horizontal');
}

/**
 * Get the role(s) of a character within a specific style.
 */
export function charRolesInStyle(char, style) {
  const entries = _charMap.get(char);
  if (!entries) return [];
  return entries.filter((e) => e.style === style).map((e) => e.role);
}

/**
 * Map a box-drawing character to its equivalent in a target style.
 * Uses the first matching role found.
 */
export function mapChar(char, targetStyle) {
  const entries = _charMap.get(char);
  if (!entries || entries.length === 0) return char;
  const role = entries[0].role;
  const target = CHARSETS[targetStyle];
  if (!target) return char;
  return target[role] || char;
}

/**
 * Detect which style a set of characters most likely belongs to.
 * Returns { style, confidence } where confidence is 0-1.
 *
 * Uses "exclusive character" detection: a char is exclusive to a style
 * if it appears in that style but not in any other non-ascii style.
 * If exclusive chars from multiple styles are found, it's mixed.
 */
export function detectStyle(chars) {
  if (!chars || chars.length === 0) return { style: null, confidence: 0 };

  // Check if only ASCII box chars are used
  const hasNonAsciiBoxChars = chars.some((c) => {
    const entries = _charMap.get(c);
    if (!entries) return false;
    return entries.some((e) => e.style !== 'ascii');
  });

  if (!hasNonAsciiBoxChars && chars.length > 0) {
    return { style: 'ascii', confidence: 1 };
  }

  // Find which non-ascii styles have exclusive characters present
  // A character is "exclusive" to style S if it does NOT appear in any other non-ascii style
  const nonAsciiStyles = ['unicode-heavy', 'unicode-light', 'rounded'];
  const stylesWithExclusiveChars = new Set();

  for (const char of chars) {
    const entries = _charMap.get(char);
    if (!entries) continue;

    const nonAsciiEntries = entries.filter((e) => e.style !== 'ascii');
    if (nonAsciiEntries.length === 1) {
      // This char is exclusive to one non-ascii style
      stylesWithExclusiveChars.add(nonAsciiEntries[0].style);
    }
  }

  // If exclusive chars from multiple styles → mixed
  if (stylesWithExclusiveChars.size > 1) {
    return { style: 'mixed', confidence: 0.5 };
  }

  // If exactly one style has exclusive chars → that's the style
  if (stylesWithExclusiveChars.size === 1) {
    const style = [...stylesWithExclusiveChars][0];
    return { style, confidence: 1 };
  }

  // No exclusive chars found — fall back to frequency counting
  // (e.g., only shared chars like ─ │ ├ ┤ ┼ which are in light+rounded)
  const styleCounts = {};
  for (const style of nonAsciiStyles) {
    styleCounts[style] = 0;
  }

  let total = 0;
  for (const char of chars) {
    const entries = _charMap.get(char);
    if (!entries) continue;
    total++;
    for (const { style } of entries) {
      if (style !== 'ascii') styleCounts[style]++;
    }
  }

  let bestStyle = null;
  let bestCount = 0;
  for (const [style, count] of Object.entries(styleCounts)) {
    if (count > bestCount) {
      bestCount = count;
      bestStyle = style;
    }
  }

  const confidence = total > 0 ? bestCount / total : 0;
  return { style: bestStyle, confidence };
}
