import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detect } from '../src/detect.js';

describe('detect', () => {
  it('should detect a unicode-light table', () => {
    const input = [
      '┌───────┬─────┐',
      '│ Name  │ Age │',
      '├───────┼─────┤',
      '│ Alice │ 30  │',
      '└───────┴─────┘',
    ].join('\n');

    const result = detect(input);
    assert.equal(result.type, 'table');
    assert.equal(result.style, 'unicode-light');
  });

  it('should detect a unicode-heavy box', () => {
    const input = [
      '╔════════════╗',
      '║  Content   ║',
      '╚════════════╝',
    ].join('\n');

    const result = detect(input);
    assert.equal(result.type, 'box');
    assert.equal(result.style, 'unicode-heavy');
  });

  it('should detect an ASCII table', () => {
    const input = [
      '+------+-----+',
      '| Name | Age |',
      '+------+-----+',
      '| Bob  | 25  |',
      '+------+-----+',
    ].join('\n');

    const result = detect(input);
    assert.equal(result.type, 'table');
    assert.equal(result.style, 'ascii');
  });

  it('should detect a rounded box', () => {
    const input = [
      '╭──────────╮',
      '│ Content  │',
      '╰──────────╯',
    ].join('\n');

    const result = detect(input);
    assert.equal(result.type, 'box');
    // Rounded shares │ with unicode-light, but ╭╮╰╯ are unique
    assert.ok(result.style === 'rounded' || result.style === 'unicode-light');
  });

  it('should return none for plain text', () => {
    const result = detect('Hello, this is just plain text.\nNo boxes here.');
    assert.equal(result.type, 'none');
    assert.equal(result.style, null);
    assert.equal(result.issues.length, 0);
  });

  it('should return none for empty input', () => {
    const result = detect('');
    assert.equal(result.type, 'none');
  });

  it('should return none for null input', () => {
    const result = detect(null);
    assert.equal(result.type, 'none');
  });

  it('should detect inconsistent width issues', () => {
    const input = [
      '╔══════════════════════════╗',
      '║  Short                    ║',
      '║  Much longer content     ║',
      '╚══════════════════════════╝',
    ].join('\n');

    const result = detect(input);
    assert.equal(result.type, 'box');
    const widthIssue = result.issues.find((i) => i.type === 'inconsistent-width');
    assert.ok(widthIssue, 'Should detect inconsistent width');
  });

  it('should detect the region boundaries', () => {
    const input = [
      '┌─────┬─────┐',
      '│ A   │ B   │',
      '└─────┴─────┘',
    ].join('\n');

    const result = detect(input);
    assert.ok(result.region);
    assert.equal(result.region.startLine, 0);
    assert.equal(result.region.endLine, 2);
  });

  it('should detect a unicode-heavy table', () => {
    const input = [
      '╔═══════╦═════╗',
      '║ Name  ║ Age ║',
      '╠═══════╬═════╣',
      '║ Alice ║ 30  ║',
      '╚═══════╩═════╝',
    ].join('\n');

    const result = detect(input);
    assert.equal(result.type, 'table');
    assert.equal(result.style, 'unicode-heavy');
  });
});
