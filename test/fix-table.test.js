import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fixTable } from '../src/fix-table.js';
import { fix } from '../src/index.js';

describe('fixTable', () => {
  it('should fix a misaligned unicode-light table', () => {
    const input = [
      '┌───────┬───┬──────────┐',
      '│ Name  │ Age │ City     │',
      '├───────┼───┼──────────┤',
      '│ Alice │ 30 │ New York │',
      '│ Bob │ 25 │ LA │',
      '└───────┴───┴──────────┘',
    ].join('\n');

    const fixed = fixTable(input);
    const lines = fixed.split('\n');

    // All lines should have same visual width
    const widths = lines.filter((l) => l.trim()).map((l) => l.length);
    const uniqueWidths = new Set(widths);
    assert.equal(uniqueWidths.size, 1, `Expected uniform width, got: ${[...uniqueWidths]}`);

    // Content should be preserved
    assert.ok(fixed.includes('Alice'));
    assert.ok(fixed.includes('New York'));
    assert.ok(fixed.includes('Bob'));
    assert.ok(fixed.includes('LA'));
  });

  it('should be idempotent', () => {
    const input = [
      '┌───────┬───┬──────────┐',
      '│ Name  │ Age │ City     │',
      '├───────┼───┼──────────┤',
      '│ Alice │ 30 │ New York │',
      '│ Bob │ 25 │ LA │',
      '└───────┴───┴──────────┘',
    ].join('\n');

    const fixed1 = fixTable(input);
    const fixed2 = fixTable(fixed1);
    assert.equal(fixed1, fixed2, 'Running fixTable twice should give same result');
  });

  it('should convert table style', () => {
    const input = [
      '┌───────┬─────┐',
      '│ Name  │ Age │',
      '├───────┼─────┤',
      '│ Alice │ 30  │',
      '└───────┴─────┘',
    ].join('\n');

    const fixed = fixTable(input, { style: 'unicode-heavy' });
    assert.ok(fixed.includes('╔'), 'Should use heavy top-left corner');
    assert.ok(fixed.includes('║'), 'Should use heavy vertical');
    assert.ok(fixed.includes('═'), 'Should use heavy horizontal');
  });

  it('should handle ASCII table', () => {
    const input = [
      '+------+-----+',
      '| Name | Age |',
      '+------+-----+',
      '| Bob  | 25  |',
      '+------+-----+',
    ].join('\n');

    const fixed = fixTable(input, { style: 'ascii' });
    assert.ok(fixed.includes('+'));
    assert.ok(fixed.includes('|'));
    assert.ok(fixed.includes('Bob'));
  });

  it('should preserve content exactly', () => {
    const input = [
      '┌──────────┬─────┐',
      '│ Hello!   │ 123 │',
      '├──────────┼─────┤',
      '│ Special@#$ │ yes │',
      '└──────────┴─────┘',
    ].join('\n');

    const fixed = fixTable(input);
    assert.ok(fixed.includes('Hello!'));
    assert.ok(fixed.includes('Special@#$'));
    assert.ok(fixed.includes('123'));
    assert.ok(fixed.includes('yes'));
  });

  it('should work through the fix() auto-detect function', () => {
    const input = [
      '┌───────┬─────┐',
      '│ A │ B │',
      '└───────┴─────┘',
    ].join('\n');

    const fixed = fix(input);
    assert.ok(fixed.includes('A'));
    assert.ok(fixed.includes('B'));
  });

  it('should handle table with unequal column counts', () => {
    const input = [
      '┌───┬───┬───┐',
      '│ A │ B │ C │',
      '├───┼───┼───┤',
      '│ 1 │ 2 │',
      '└───┴───┴───┘',
    ].join('\n');

    const fixed = fixTable(input);
    // Should not throw
    assert.ok(fixed.includes('A'));
    assert.ok(fixed.includes('1'));
  });

  it('should preserve trailing newline', () => {
    const input = '┌───┬───┐\n│ A │ B │\n└───┴───┘\n';
    const fixed = fixTable(input);
    assert.ok(fixed.endsWith('\n'), 'Should preserve trailing newline');
  });

  it('should not add trailing newline if absent', () => {
    const input = '┌───┬───┐\n│ A │ B │\n└───┴───┘';
    const fixed = fixTable(input);
    assert.ok(!fixed.endsWith('\n'), 'Should not add trailing newline');
  });

  it('should return plain text unchanged', () => {
    const input = 'This is just text, no table here.';
    const fixed = fixTable(input);
    assert.equal(fixed, input);
  });
});
