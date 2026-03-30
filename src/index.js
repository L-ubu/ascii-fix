import { detect } from './detect.js';
import { fixTable } from './fix-table.js';
import { fixBox } from './fix-box.js';

export { detect, fixTable, fixBox };

/**
 * Auto-detect and fix ASCII art tables and boxes.
 * @param {string} text - Input text.
 * @param {object} [options] - Options.
 * @param {string} [options.style] - Target style.
 * @returns {string} Fixed text, or unchanged if no ASCII art found.
 */
export function fix(text, options = {}) {
  const { type } = detect(text);

  if (type === 'table') return fixTable(text, options);
  if (type === 'box') return fixBox(text, options);

  return text;
}

/**
 * Convert ASCII art to a different style.
 * @param {string} text - Input text.
 * @param {string} targetStyle - Target style name.
 * @returns {string} Converted text.
 */
export function convert(text, targetStyle) {
  return fix(text, { style: targetStyle });
}
