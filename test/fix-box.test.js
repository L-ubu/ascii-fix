import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fixBox } from '../src/fix-box.js';
import { fix, convert } from '../src/index.js';

describe('fixBox', () => {
  it('should fix a unicode-heavy box with inconsistent widths', () => {
    const input = [
      '╔══════════════════════════╗',
      '║  SLIMESHELL v0.5.0       ║',
      '╠══════════════════════════╣',
      '║  73 files · 52k lines  ║',
      '║  45 pages              ║',
      '╚══════════════════════════╝',
    ].join('\n');

    const fixed = fixBox(input);
    const lines = fixed.split('\n').filter((l) => l.trim());

    // All lines should have same visual width
    const widths = lines.map((l) => l.length);
    const uniqueWidths = new Set(widths);
    assert.equal(uniqueWidths.size, 1, `Expected uniform width, got: ${[...uniqueWidths]}`);

    // Content preserved
    assert.ok(fixed.includes('SLIMESHELL v0.5.0'));
    assert.ok(fixed.includes('73 files'));
    assert.ok(fixed.includes('45 pages'));
  });

  it('should fix a unicode-light box', () => {
    const input = [
      '┌──────────────┐',
      '│  Content     │',
      '├──────────────┤',
      '│  More stuff  │',
      '└──────────────┘',
    ].join('\n');

    const fixed = fixBox(input);
    assert.ok(fixed.includes('Content'));
    assert.ok(fixed.includes('More stuff'));
    assert.ok(fixed.includes('┌'));
    assert.ok(fixed.includes('└'));
  });

  it('should fix a rounded box', () => {
    const input = [
      '╭──────────────╮',
      '│  Content     │',
      '├──────────────┤',
      '│  More stuff  │',
      '╰──────────────╯',
    ].join('\n');

    const fixed = fixBox(input, { style: 'rounded' });
    assert.ok(fixed.includes('╭'));
    assert.ok(fixed.includes('╰'));
    assert.ok(fixed.includes('Content'));
  });

  it('should fix a plain ASCII box', () => {
    const input = [
      '+----------------+',
      '|  Content       |',
      '+----------------+',
      '|  More stuff    |',
      '+----------------+',
    ].join('\n');

    const fixed = fixBox(input, { style: 'ascii' });
    assert.ok(fixed.includes('+'));
    assert.ok(fixed.includes('|'));
    assert.ok(fixed.includes('Content'));
    assert.ok(fixed.includes('More stuff'));
  });

  it('should be idempotent', () => {
    const input = [
      '╔══════════════╗',
      '║  Content     ║',
      '║  More stuff  ║',
      '╚══════════════╝',
    ].join('\n');

    const fixed1 = fixBox(input);
    const fixed2 = fixBox(fixed1);
    assert.equal(fixed1, fixed2, 'Running fixBox twice should give same result');
  });

  it('should convert box style', () => {
    const input = [
      '╔══════════╗',
      '║  Hello   ║',
      '╚══════════╝',
    ].join('\n');

    const fixed = convert(input, 'rounded');
    assert.ok(fixed.includes('╭'), 'Should use rounded top-left');
    assert.ok(fixed.includes('╯'), 'Should use rounded bottom-right');
  });

  it('should handle box with content wider than border', () => {
    const input = [
      '╔════╗',
      '║  This is very long content  ║',
      '╚════╝',
    ].join('\n');

    const fixed = fixBox(input);
    const lines = fixed.split('\n').filter((l) => l.trim());
    const widths = lines.map((l) => l.length);
    const uniqueWidths = new Set(widths);
    assert.equal(uniqueWidths.size, 1, 'All lines should have uniform width after fix');
    assert.ok(fixed.includes('This is very long content'));
  });

  it('should preserve content exactly', () => {
    const input = [
      '╔════════════════╗',
      '║  Special!@#$%  ║',
      '║  1234567890    ║',
      '╚════════════════╝',
    ].join('\n');

    const fixed = fixBox(input);
    assert.ok(fixed.includes('Special!@#$%'));
    assert.ok(fixed.includes('1234567890'));
  });

  it('should work through fix() auto-detect', () => {
    const input = [
      '╔════════════╗',
      '║  Content   ║',
      '╚════════════╝',
    ].join('\n');

    const fixed = fix(input);
    assert.ok(fixed.includes('Content'));
  });

  it('should preserve leading indentation', () => {
    const input = [
      '    ╔════════════╗',
      '    ║  Content   ║',
      '    ╚════════════╝',
    ].join('\n');

    const fixed = fixBox(input);
    const lines = fixed.split('\n').filter((l) => l.trim());
    for (const line of lines) {
      assert.ok(line.startsWith('    '), `Line should be indented: "${line}"`);
    }
  });

  it('should return plain text unchanged', () => {
    const input = 'Just regular text, no box.';
    const fixed = fixBox(input);
    assert.equal(fixed, input);
  });

  it('should preserve trailing newline', () => {
    const input = '╔═══╗\n║ A ║\n╚═══╝\n';
    const fixed = fixBox(input);
    assert.ok(fixed.endsWith('\n'));
  });
});
