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
 */
export function detectStyle(chars) {
  if (!chars || chars.length === 0) return { style: null, confidence: 0 };

  const styleCounts = {};
  for (const style of Object.keys(CHARSETS)) {
    styleCounts[style] = 0;
  }

  let total = 0;
  for (const char of chars) {
    const entries = _charMap.get(char);
    if (!entries) continue;
    total++;
    for (const { style } of entries) {
      styleCounts[style]++;
    }
  }

  if (total === 0) return { style: null, confidence: 0 };

  let bestStyle = null;
  let bestCount = 0;
  for (const [style, count] of Object.entries(styleCounts)) {
    if (count > bestCount) {
      bestCount = count;
      bestStyle = style;
    }
  }

  // ASCII style is ambiguous (+ - | are shared with other styles via overlap)
  // Only report ascii if ALL characters are ascii-exclusive
  const hasNonAsciiBoxChars = chars.some((c) => {
    const entries = _charMap.get(c);
    if (!entries) return false;
    return entries.some((e) => e.style !== 'ascii');
  });

  if (!hasNonAsciiBoxChars && total > 0) {
    return { style: 'ascii', confidence: 1 };
  }

  // Filter out ascii from consideration if non-ascii box chars are present
  if (hasNonAsciiBoxChars) {
    delete styleCounts['ascii'];
    bestStyle = null;
    bestCount = 0;
    for (const [style, count] of Object.entries(styleCounts)) {
      if (count > bestCount) {
        bestCount = count;
        bestStyle = style;
      }
    }
  }

  const confidence = bestCount / total;

  // Check for mixed: if top style doesn't cover >80% of chars
  if (confidence < 0.8) {
    return { style: 'mixed', confidence };
  }

  return { style: bestStyle, confidence };
}
