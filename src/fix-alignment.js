import { visualWidth, visualPadEnd } from './utils.js';

/**
 * Calculate the maximum visual width for each column position.
 * @param {string[][]} rows - Array of cell arrays (each cell is a string).
 * @returns {number[]} Max visual width per column.
 */
export function calculateColumnWidths(rows) {
  const maxCols = Math.max(0, ...rows.map((r) => r.length));
  const widths = new Array(maxCols).fill(0);

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const w = visualWidth(row[i]);
      if (w > widths[i]) widths[i] = w;
    }
  }

  return widths;
}

/**
 * Pad a cell's content to a target visual width (left-aligned).
 */
export function padCell(content, targetWidth) {
  return visualPadEnd(content, targetWidth);
}
