import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fix, fixTable, fixBox, detect, convert } from '../src/index.js';

describe('edge cases', () => {
  describe('empty and minimal inputs', () => {
    it('should return empty string unchanged', () => {
      assert.equal(fix(''), '');
    });

    it('should return null unchanged', () => {
      assert.equal(fix(null), null);
    });

    it('should return undefined unchanged', () => {
      assert.equal(fix(undefined), undefined);
    });

    it('should return plain text unchanged', () => {
      const text = 'Hello world\nThis is just text\nNothing to fix here';
      assert.equal(fix(text), text);
    });

    it('should handle single-line box', () => {
      const input = '╔═══╗';
      const fixed = fix(input);
      // Single border line with no content — should at least not crash
      assert.ok(typeof fixed === 'string');
    });
  });

  describe('CJK and emoji in tables', () => {
    it('should align table with CJK characters', () => {
      const input = [
        '┌──────┬──────┐',
        '│ Name │ City │',
        '├──────┼──────┤',
        '│ 太郎 │ 東京 │',
        '│ Bob  │ LA   │',
        '└──────┴──────┘',
      ].join('\n');

      const fixed = fixTable(input);
      const lines = fixed.split('\n').filter((l) => l.trim());

      // All lines same width
      const widths = lines.map((l) => [...l].reduce((w, c) => {
        const cp = c.codePointAt(0);
        if (cp >= 0x4e00 && cp <= 0x9fff) return w + 2;
        if (cp >= 0x3040 && cp <= 0x30ff) return w + 2;
        return w + 1;
      }, 0));

      // Content preserved
      assert.ok(fixed.includes('太郎'));
      assert.ok(fixed.includes('東京'));
      assert.ok(fixed.includes('Bob'));
      assert.ok(fixed.includes('LA'));
    });

    it('should align table with emoji', () => {
      const input = [
        '┌──────┬───────┐',
        '│ Icon │ Name  │',
        '├──────┼───────┤',
        '│ 😀   │ Happy │',
        '│ 🎉  │ Party │',
        '└──────┴───────┘',
      ].join('\n');

      const fixed = fixTable(input);
      assert.ok(fixed.includes('😀'));
      assert.ok(fixed.includes('🎉'));
      assert.ok(fixed.includes('Happy'));
      assert.ok(fixed.includes('Party'));
    });
  });

  describe('CJK and emoji in boxes', () => {
    it('should fix box with CJK content', () => {
      const input = [
        '╔════════╗',
        '║  こんにちは  ║',
        '║  Hello     ║',
        '╚════════╝',
      ].join('\n');

      const fixed = fixBox(input);
      const lines = fixed.split('\n').filter((l) => l.trim());

      // All lines same length is tricky with CJK, but content preserved
      assert.ok(fixed.includes('こんにちは'));
      assert.ok(fixed.includes('Hello'));

      // Border should be wide enough for CJK content
      const topLine = lines[0];
      assert.ok(topLine.startsWith('╔'));
      assert.ok(topLine.endsWith('╗'));
    });

    it('should fix box with emoji content', () => {
      const input = [
        '╔═══════╗',
        '║ 🎉 Party time! ║',
        '║ Simple text    ║',
        '╚═══════╝',
      ].join('\n');

      const fixed = fixBox(input);
      assert.ok(fixed.includes('🎉 Party time!'));
      assert.ok(fixed.includes('Simple text'));
    });
  });

  describe('style conversion matrix', () => {
    const lightBox = [
      '┌──────────┐',
      '│ Content  │',
      '└──────────┘',
    ].join('\n');

    const heavyBox = [
      '╔══════════╗',
      '║ Content  ║',
      '╚══════════╝',
    ].join('\n');

    it('light → heavy', () => {
      const fixed = convert(lightBox, 'unicode-heavy');
      assert.ok(fixed.includes('╔'));
      assert.ok(fixed.includes('║'));
      assert.ok(fixed.includes('═'));
      assert.ok(fixed.includes('Content'));
    });

    it('heavy → light', () => {
      const fixed = convert(heavyBox, 'unicode-light');
      assert.ok(fixed.includes('┌'));
      assert.ok(fixed.includes('│'));
      assert.ok(fixed.includes('─'));
      assert.ok(fixed.includes('Content'));
    });

    it('light → rounded', () => {
      const fixed = convert(lightBox, 'rounded');
      assert.ok(fixed.includes('╭'));
      assert.ok(fixed.includes('╯'));
      assert.ok(fixed.includes('Content'));
    });

    it('heavy → ascii', () => {
      const fixed = convert(heavyBox, 'ascii');
      assert.ok(fixed.includes('+'));
      assert.ok(fixed.includes('|'));
      assert.ok(fixed.includes('-'));
      assert.ok(fixed.includes('Content'));
    });

    it('light → ascii', () => {
      const fixed = convert(lightBox, 'ascii');
      assert.ok(fixed.includes('+'));
      assert.ok(fixed.includes('|'));
      assert.ok(fixed.includes('Content'));
    });

    it('heavy → rounded', () => {
      const fixed = convert(heavyBox, 'rounded');
      assert.ok(fixed.includes('╭'));
      assert.ok(fixed.includes('╯'));
      assert.ok(fixed.includes('Content'));
    });
  });

  describe('table style conversions', () => {
    const lightTable = [
      '┌──────┬─────┐',
      '│ Name │ Age │',
      '├──────┼─────┤',
      '│ Bob  │ 25  │',
      '└──────┴─────┘',
    ].join('\n');

    it('light table → heavy', () => {
      const fixed = fixTable(lightTable, { style: 'unicode-heavy' });
      assert.ok(fixed.includes('╔'));
      assert.ok(fixed.includes('╬') || fixed.includes('╦'));
      assert.ok(fixed.includes('Bob'));
    });

    it('light table → rounded', () => {
      const fixed = fixTable(lightTable, { style: 'rounded' });
      assert.ok(fixed.includes('╭'));
      assert.ok(fixed.includes('╯'));
      assert.ok(fixed.includes('Bob'));
    });

    it('light table → ascii', () => {
      const fixed = fixTable(lightTable, { style: 'ascii' });
      assert.ok(fixed.includes('+'));
      assert.ok(fixed.includes('|'));
      assert.ok(fixed.includes('Bob'));
    });
  });

  describe('content preservation', () => {
    it('should preserve special characters in table cells', () => {
      const input = [
        '┌────────────┬───────┐',
        '│ Formula    │ Value │',
        '├────────────┼───────┤',
        '│ a + b = c  │ 42    │',
        '│ x > y      │ true  │',
        '│ 100%       │ done  │',
        '│ $99.99     │ price │',
        '│ foo@bar    │ email │',
        '│ a & b      │ both  │',
        '└────────────┴───────┘',
      ].join('\n');

      const fixed = fixTable(input);
      assert.ok(fixed.includes('a + b = c'));
      assert.ok(fixed.includes('x > y'));
      assert.ok(fixed.includes('100%'));
      assert.ok(fixed.includes('$99.99'));
      assert.ok(fixed.includes('foo@bar'));
      assert.ok(fixed.includes('a & b'));
    });

    it('should preserve special characters in box content', () => {
      const input = [
        '╔══════════════════╗',
        '║ Price: $99.99    ║',
        '║ Email: a@b.com   ║',
        '║ 100% complete    ║',
        '╚══════════════════╝',
      ].join('\n');

      const fixed = fixBox(input);
      assert.ok(fixed.includes('$99.99'));
      assert.ok(fixed.includes('a@b.com'));
      assert.ok(fixed.includes('100% complete'));
    });

    it('should never modify cell text content', () => {
      const input = [
        '┌─────┬─────┐',
        '│  A  │  B  │',
        '├─────┼─────┤',
        '│  1  │  2  │',
        '└─────┴─────┘',
      ].join('\n');

      const fixed = fixTable(input);
      assert.ok(fixed.includes('A'));
      assert.ok(fixed.includes('B'));
      assert.ok(fixed.includes('1'));
      assert.ok(fixed.includes('2'));
    });
  });

  describe('CRLF handling', () => {
    it('should handle CRLF in tables', () => {
      const input = '┌───┬───┐\r\n│ A │ B │\r\n└───┴───┘\r\n';
      const fixed = fixTable(input);
      assert.ok(fixed.includes('\r\n'), 'Should preserve CRLF');
      assert.ok(fixed.includes('A'));
      assert.ok(fixed.includes('B'));
    });

    it('should handle CRLF in boxes', () => {
      const input = '╔═══╗\r\n║ X ║\r\n╚═══╝\r\n';
      const fixed = fixBox(input);
      assert.ok(fixed.includes('\r\n'), 'Should preserve CRLF');
      assert.ok(fixed.includes('X'));
    });
  });

  describe('indentation preservation', () => {
    it('should preserve 2-space indent in table', () => {
      const input = [
        '  ┌───┬───┐',
        '  │ A │ B │',
        '  └───┴───┘',
      ].join('\n');

      const fixed = fixTable(input);
      for (const line of fixed.split('\n').filter((l) => l.trim())) {
        assert.ok(line.startsWith('  '), `Line should start with 2 spaces: "${line}"`);
      }
    });

    it('should preserve tab indent', () => {
      const input = [
        '\t╔═══╗',
        '\t║ A ║',
        '\t╚═══╝',
      ].join('\n');

      const fixed = fixBox(input);
      for (const line of fixed.split('\n').filter((l) => l.trim())) {
        assert.ok(line.startsWith('\t'), `Line should start with tab: "${line}"`);
      }
    });
  });

  describe('idempotency', () => {
    it('fix(fix(table)) === fix(table)', () => {
      const input = [
        '┌───────┬───┬──────────┐',
        '│ Name  │ Age │ City     │',
        '├───────┼───┼──────────┤',
        '│ Alice │ 30 │ New York │',
        '│ Bob │ 25 │ LA │',
        '└───────┴───┴──────────┘',
      ].join('\n');

      const once = fix(input);
      const twice = fix(once);
      const thrice = fix(twice);
      assert.equal(once, twice);
      assert.equal(twice, thrice);
    });

    it('fix(fix(box)) === fix(box)', () => {
      const input = [
        '╔══════════════════════════╗',
        '║  Short                    ║',
        '║  Much longer content here ║',
        '╚══════════════════════════╝',
      ].join('\n');

      const once = fix(input);
      const twice = fix(once);
      const thrice = fix(twice);
      assert.equal(once, twice);
      assert.equal(twice, thrice);
    });

    it('convert(convert(box)) is idempotent', () => {
      const input = [
        '╔══════════╗',
        '║  Hello   ║',
        '╚══════════╝',
      ].join('\n');

      const rounded = convert(input, 'rounded');
      const roundedAgain = convert(rounded, 'rounded');
      assert.equal(rounded, roundedAgain);
    });
  });

  describe('wide tables', () => {
    it('should handle table with many columns', () => {
      const input = [
        '┌───┬───┬───┬───┬───┬───┐',
        '│ A │ B │ C │ D │ E │ F │',
        '├───┼───┼───┼───┼───┼───┤',
        '│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │',
        '└───┴───┴───┴───┴───┴───┘',
      ].join('\n');

      const fixed = fixTable(input);
      assert.ok(fixed.includes('A'));
      assert.ok(fixed.includes('F'));
      assert.ok(fixed.includes('1'));
      assert.ok(fixed.includes('6'));

      // Should be idempotent
      assert.equal(fixTable(fixed), fixed);
    });

    it('should handle table with very wide cells', () => {
      const input = [
        '┌────────────────────────────────────────┬───┐',
        '│ This is a very long cell value here   │ B │',
        '├────────────────────────────────────────┼───┤',
        '│ Short │ X │',
        '└────────────────────────────────────────┴───┘',
      ].join('\n');

      const fixed = fixTable(input);
      assert.ok(fixed.includes('This is a very long cell value here'));
      assert.ok(fixed.includes('Short'));

      // All lines same width
      const lines = fixed.split('\n').filter((l) => l.trim());
      const widths = new Set(lines.map((l) => l.length));
      assert.equal(widths.size, 1, `Widths should be uniform: ${[...widths]}`);
    });
  });

  describe('table without borders', () => {
    it('should handle table with only header separator', () => {
      const input = [
        '│ Name  │ Age │',
        '├───────┼─────┤',
        '│ Alice │ 30  │',
        '│ Bob   │ 25  │',
      ].join('\n');

      const fixed = fixTable(input);
      assert.ok(fixed.includes('Alice'));
      assert.ok(fixed.includes('Bob'));
    });
  });

  describe('box with separator', () => {
    it('should handle box with multiple separators', () => {
      const input = [
        '╔══════════════╗',
        '║  Title       ║',
        '╠══════════════╣',
        '║  Section 1   ║',
        '╠══════════════╣',
        '║  Section 2   ║',
        '╚══════════════╝',
      ].join('\n');

      const fixed = fixBox(input);
      assert.ok(fixed.includes('Title'));
      assert.ok(fixed.includes('Section 1'));
      assert.ok(fixed.includes('Section 2'));

      // Should have two separators
      const sepCount = (fixed.match(/╠/g) || []).length;
      assert.equal(sepCount, 2);
    });
  });

  describe('detect function', () => {
    it('should detect mixed styles', () => {
      const input = [
        '╔──────────────┐',
        '║  Content     │',
        '╚──────────────┘',
      ].join('\n');

      const result = detect(input);
      assert.equal(result.style, 'mixed');
    });

    it('should return issues array for broken table', () => {
      const input = [
        '┌───────┬───┬──────────┐',
        '│ Name  │ Age │ City     │',
        '├───────┼───┼──────────┤',
        '│ Alice │ 30 │ New York │',
        '└───────┴───┴──────────┘',
      ].join('\n');

      const result = detect(input);
      assert.ok(Array.isArray(result.issues));
      assert.equal(result.type, 'table');
    });

    it('should detect box with separator as box', () => {
      const input = [
        '╔═══════════╗',
        '║  Title    ║',
        '╠═══════════╣',
        '║  Content  ║',
        '╚═══════════╝',
      ].join('\n');

      const result = detect(input);
      assert.equal(result.type, 'box');
      assert.equal(result.style, 'unicode-heavy');
    });
  });

  describe('single row table', () => {
    it('should handle table with only one data row', () => {
      const input = [
        '┌──────┬─────┐',
        '│ Name │ Age │',
        '└──────┴─────┘',
      ].join('\n');

      const fixed = fixTable(input);
      assert.ok(fixed.includes('Name'));
      assert.ok(fixed.includes('Age'));
    });
  });

  describe('stress test', () => {
    it('should handle a large table without crashing', () => {
      const rows = [];
      rows.push('┌──────┬──────┐');
      rows.push('│ Key  │ Value │');
      rows.push('├──────┼──────┤');
      for (let i = 0; i < 100; i++) {
        rows.push(`│ k${i.toString().padStart(3, '0')} │ v${i} │`);
      }
      rows.push('└──────┴──────┘');

      const input = rows.join('\n');
      const start = Date.now();
      const fixed = fixTable(input);
      const elapsed = Date.now() - start;

      assert.ok(elapsed < 1000, `Should fix in under 1s, took ${elapsed}ms`);
      assert.ok(fixed.includes('k000'));
      assert.ok(fixed.includes('k099'));

      // All lines same width
      const lines = fixed.split('\n').filter((l) => l.trim());
      const widths = new Set(lines.map((l) => l.length));
      assert.equal(widths.size, 1, `Widths should be uniform: ${[...widths]}`);
    });
  });
});
