import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARSETS,
  charToStyle,
  allBoxChars,
  isBoxChar,
  isVertical,
  isHorizontal,
  mapChar,
  detectStyle,
} from '../src/charsets.js';

describe('CHARSETS', () => {
  it('should have all 4 styles', () => {
    assert.ok(CHARSETS['unicode-heavy']);
    assert.ok(CHARSETS['unicode-light']);
    assert.ok(CHARSETS['ascii']);
    assert.ok(CHARSETS['rounded']);
  });

  it('each style should have all 11 roles', () => {
    const roles = [
      'topLeft', 'topRight', 'bottomLeft', 'bottomRight',
      'horizontal', 'vertical',
      'teeLeft', 'teeRight', 'teeTop', 'teeBottom', 'cross',
    ];
    for (const [style, chars] of Object.entries(CHARSETS)) {
      for (const role of roles) {
        assert.ok(chars[role] !== undefined, `${style} missing role: ${role}`);
      }
    }
  });
});

describe('charToStyle', () => {
  it('should return styles for heavy chars', () => {
    const result = charToStyle('╔');
    assert.ok(result.length > 0);
    assert.ok(result.some((r) => r.style === 'unicode-heavy' && r.role === 'topLeft'));
  });

  it('should return styles for light chars', () => {
    const result = charToStyle('┌');
    assert.ok(result.some((r) => r.style === 'unicode-light' && r.role === 'topLeft'));
  });

  it('should return empty for non-box chars', () => {
    assert.deepEqual(charToStyle('A'), []);
    assert.deepEqual(charToStyle(' '), []);
  });

  it('should return multiple styles for shared chars', () => {
    // │ is in unicode-light and rounded
    const result = charToStyle('│');
    const styles = result.map((r) => r.style);
    assert.ok(styles.includes('unicode-light'));
    assert.ok(styles.includes('rounded'));
  });
});

describe('allBoxChars', () => {
  it('should return a Set', () => {
    assert.ok(allBoxChars() instanceof Set);
  });

  it('should contain heavy chars', () => {
    const chars = allBoxChars();
    assert.ok(chars.has('╔'));
    assert.ok(chars.has('║'));
    assert.ok(chars.has('═'));
  });

  it('should contain light chars', () => {
    const chars = allBoxChars();
    assert.ok(chars.has('┌'));
    assert.ok(chars.has('│'));
    assert.ok(chars.has('─'));
  });

  it('should contain ASCII chars', () => {
    const chars = allBoxChars();
    assert.ok(chars.has('+'));
    assert.ok(chars.has('-'));
    assert.ok(chars.has('|'));
  });

  it('should contain rounded chars', () => {
    const chars = allBoxChars();
    assert.ok(chars.has('╭'));
    assert.ok(chars.has('╮'));
    assert.ok(chars.has('╰'));
    assert.ok(chars.has('╯'));
  });

  it('should not contain regular letters', () => {
    const chars = allBoxChars();
    assert.ok(!chars.has('A'));
    assert.ok(!chars.has('z'));
    assert.ok(!chars.has('1'));
  });
});

describe('isBoxChar', () => {
  it('should return true for box chars', () => {
    assert.ok(isBoxChar('╔'));
    assert.ok(isBoxChar('─'));
    assert.ok(isBoxChar('+'));
  });

  it('should return false for non-box chars', () => {
    assert.ok(!isBoxChar('A'));
    assert.ok(!isBoxChar(' '));
    assert.ok(!isBoxChar('!'));
  });
});

describe('isVertical', () => {
  it('should identify vertical chars', () => {
    assert.ok(isVertical('│'));
    assert.ok(isVertical('║'));
    assert.ok(isVertical('|'));
  });

  it('should not identify horizontal chars', () => {
    assert.ok(!isVertical('─'));
    assert.ok(!isVertical('═'));
    assert.ok(!isVertical('-'));
  });
});

describe('isHorizontal', () => {
  it('should identify horizontal chars', () => {
    assert.ok(isHorizontal('─'));
    assert.ok(isHorizontal('═'));
    assert.ok(isHorizontal('-'));
  });

  it('should not identify vertical chars', () => {
    assert.ok(!isHorizontal('│'));
    assert.ok(!isHorizontal('║'));
    assert.ok(!isHorizontal('|'));
  });
});

describe('mapChar', () => {
  it('should map heavy to light', () => {
    assert.equal(mapChar('╔', 'unicode-light'), '┌');
    assert.equal(mapChar('║', 'unicode-light'), '│');
    assert.equal(mapChar('═', 'unicode-light'), '─');
  });

  it('should map light to heavy', () => {
    assert.equal(mapChar('┌', 'unicode-heavy'), '╔');
    assert.equal(mapChar('│', 'unicode-heavy'), '║');
  });

  it('should map to rounded', () => {
    assert.equal(mapChar('╔', 'rounded'), '╭');
    assert.equal(mapChar('╗', 'rounded'), '╮');
    assert.equal(mapChar('╚', 'rounded'), '╰');
    assert.equal(mapChar('╝', 'rounded'), '╯');
  });

  it('should map to ASCII', () => {
    assert.equal(mapChar('╔', 'ascii'), '+');
    assert.equal(mapChar('║', 'ascii'), '|');
    assert.equal(mapChar('═', 'ascii'), '-');
  });

  it('should return char unchanged for non-box chars', () => {
    assert.equal(mapChar('A', 'unicode-light'), 'A');
  });
});

describe('detectStyle', () => {
  it('should detect unicode-heavy', () => {
    const result = detectStyle(['╔', '═', '═', '╗', '║', '║', '╚', '═', '═', '╝']);
    assert.equal(result.style, 'unicode-heavy');
  });

  it('should detect unicode-light', () => {
    const result = detectStyle(['┌', '─', '─', '┐', '│', '│', '└', '─', '─', '┘']);
    assert.equal(result.style, 'unicode-light');
  });

  it('should detect ascii', () => {
    const result = detectStyle(['+', '-', '-', '+', '|', '|', '+', '-', '-', '+']);
    assert.equal(result.style, 'ascii');
  });

  it('should detect rounded', () => {
    const result = detectStyle(['╭', '─', '─', '╮', '│', '│', '╰', '─', '─', '╯']);
    assert.equal(result.style, 'rounded');
  });

  it('should detect mixed when heavy and light chars present', () => {
    const result = detectStyle(['╔', '─', '─', '┐', '║', '│', '╚', '─', '─', '┘']);
    assert.equal(result.style, 'mixed');
  });

  it('should return null for empty', () => {
    const result = detectStyle([]);
    assert.equal(result.style, null);
  });

  it('should return null for null', () => {
    const result = detectStyle(null);
    assert.equal(result.style, null);
  });
});
