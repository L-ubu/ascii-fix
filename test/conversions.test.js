import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fix, convert, fixTable, fixBox } from '../src/index.js';

describe('ASCII style conversions', () => {
  it('ASCII box → unicode-heavy should have correct corners', () => {
    const input = '+--------+\n|  Hello |\n+--------+';
    const fixed = fixBox(input, { style: 'unicode-heavy' });
    const lines = fixed.split('\n');
    assert.ok(lines[0].startsWith('╔'), 'Top should start with ╔');
    assert.ok(lines[0].endsWith('╗'), 'Top should end with ╗');
    assert.ok(lines[2].startsWith('╚'), 'Bottom should start with ╚');
    assert.ok(lines[2].endsWith('╝'), 'Bottom should end with ╝');
  });

  it('ASCII table → unicode-heavy should have correct borders', () => {
    const input = [
      '+------+-----+',
      '| Name | Age |',
      '+------+-----+',
      '| Bob  | 25  |',
      '+------+-----+',
    ].join('\n');

    const fixed = fixTable(input, { style: 'unicode-heavy' });
    const lines = fixed.split('\n').filter((l) => l.trim());
    assert.ok(lines[0].startsWith('╔'), 'Top border starts with ╔');
    assert.ok(lines[0].includes('╦'), 'Top border has ╦');
    assert.ok(lines[0].endsWith('╗'), 'Top border ends with ╗');
    assert.ok(lines[2].startsWith('╠'), 'Separator starts with ╠');
    assert.ok(lines[2].includes('╬'), 'Separator has ╬');
    assert.ok(lines[2].endsWith('╣'), 'Separator ends with ╣');
    assert.ok(lines[4].startsWith('╚'), 'Bottom starts with ╚');
    assert.ok(lines[4].includes('╩'), 'Bottom has ╩');
    assert.ok(lines[4].endsWith('╝'), 'Bottom ends with ╝');
  });

  it('full conversion chain: heavy → rounded → light → ascii → heavy', () => {
    const original = '╔══════════╗\n║  Hello   ║\n╚══════════╝';

    const rounded = convert(original, 'rounded');
    assert.ok(rounded.includes('╭'));
    assert.ok(rounded.includes('╯'));

    const light = convert(rounded, 'unicode-light');
    assert.ok(light.includes('┌'));
    assert.ok(light.includes('┘'));

    const ascii = convert(light, 'ascii');
    assert.ok(ascii.includes('+'));
    assert.ok(ascii.includes('|'));

    const heavy = convert(ascii, 'unicode-heavy');
    assert.ok(heavy.includes('╔'));
    assert.ok(heavy.includes('╝'));
    assert.ok(heavy.includes('Hello'));
  });

  it('table conversion chain preserves content', () => {
    const original = [
      '┌──────┬─────┐',
      '│ Name │ Age │',
      '├──────┼─────┤',
      '│ Bob  │ 25  │',
      '└──────┴─────┘',
    ].join('\n');

    const heavy = fixTable(original, { style: 'unicode-heavy' });
    const ascii = fixTable(heavy, { style: 'ascii' });
    const rounded = fixTable(ascii, { style: 'rounded' });
    const back = fixTable(rounded, { style: 'unicode-light' });

    assert.ok(back.includes('Name'));
    assert.ok(back.includes('Age'));
    assert.ok(back.includes('Bob'));
    assert.ok(back.includes('25'));
  });

  it('ASCII box with separator → heavy', () => {
    const input = [
      '+------------+',
      '| Title      |',
      '+------------+',
      '| Content    |',
      '+------------+',
    ].join('\n');

    const fixed = fixBox(input, { style: 'unicode-heavy' });
    const lines = fixed.split('\n').filter((l) => l.trim());

    assert.ok(lines[0].startsWith('╔'));
    assert.ok(lines[2].startsWith('╠'));
    assert.ok(lines[4].startsWith('╚'));
  });
});

describe('real-world AI output fixes', () => {
  it('should fix typical ChatGPT table output', () => {
    const input = [
      '| Feature | Status | Notes |',
      '|---------|--------|-------|',
      '| Auth | Done | Using JWT |',
      '| API | In Progress | REST endpoints |',
      '| UI | Not Started | React frontend |',
    ].join('\n');

    // This is a markdown-style table (no outer borders) — we detect by | chars
    const result = fix(input);
    // Should at least not crash
    assert.ok(typeof result === 'string');
  });

  it('should fix box where border is too narrow', () => {
    const input = [
      '╔════╗',
      '║ This content is much wider than the border ║',
      '╚════╝',
    ].join('\n');

    const fixed = fixBox(input);
    const lines = fixed.split('\n').filter((l) => l.trim());

    // All lines same width
    const widths = new Set(lines.map((l) => l.length));
    assert.equal(widths.size, 1, `Uniform width expected, got: ${[...widths]}`);
    assert.ok(fixed.includes('This content is much wider than the border'));
  });

  it('should fix box where border is too wide', () => {
    const input = [
      '╔══════════════════════════════════════════╗',
      '║ Short ║',
      '╚══════════════════════════════════════════╝',
    ].join('\n');

    const fixed = fixBox(input);
    const lines = fixed.split('\n').filter((l) => l.trim());

    const widths = new Set(lines.map((l) => l.length));
    assert.equal(widths.size, 1, `Uniform width expected, got: ${[...widths]}`);
    assert.ok(fixed.includes('Short'));
  });

  it('should handle box with empty content lines', () => {
    const input = [
      '╔══════════╗',
      '║ Title    ║',
      '║          ║',
      '║ Content  ║',
      '╚══════════╝',
    ].join('\n');

    const fixed = fixBox(input);
    assert.ok(fixed.includes('Title'));
    assert.ok(fixed.includes('Content'));

    // Should still be well-formed
    const lines = fixed.split('\n').filter((l) => l.trim());
    const widths = new Set(lines.map((l) => l.length));
    assert.equal(widths.size, 1);
  });
});
