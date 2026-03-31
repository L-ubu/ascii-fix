import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  visualWidth,
  visualPadEnd,
  normalizeLineEndings,
  splitLines,
  stripLeadingIndent,
  restoreLineEndings,
} from '../src/utils.js';

describe('visualWidth', () => {
  it('should return 0 for empty string', () => {
    assert.equal(visualWidth(''), 0);
  });

  it('should return 0 for null/undefined', () => {
    assert.equal(visualWidth(null), 0);
    assert.equal(visualWidth(undefined), 0);
  });

  it('should handle ASCII strings', () => {
    assert.equal(visualWidth('hello'), 5);
    assert.equal(visualWidth('abc 123'), 7);
    assert.equal(visualWidth(' '), 1);
  });

  it('should handle box-drawing characters as width 1', () => {
    assert.equal(visualWidth('─'), 1);
    assert.equal(visualWidth('│'), 1);
    assert.equal(visualWidth('┌'), 1);
    assert.equal(visualWidth('═'), 1);
    assert.equal(visualWidth('║'), 1);
    assert.equal(visualWidth('╔'), 1);
    assert.equal(visualWidth('┌──┐'), 4);
    assert.equal(visualWidth('╔══╗'), 4);
  });

  it('should handle CJK characters as width 2', () => {
    assert.equal(visualWidth('中'), 2);
    assert.equal(visualWidth('中文'), 4);
    assert.equal(visualWidth('日本語'), 6);
    assert.equal(visualWidth('한국어'), 6);
  });

  it('should handle mixed ASCII and CJK', () => {
    assert.equal(visualWidth('hi中文'), 6); // 2 + 4
    assert.equal(visualWidth('A中B'), 4);   // 1 + 2 + 1
  });

  it('should handle fullwidth forms as width 2', () => {
    assert.equal(visualWidth('Ａ'), 2); // fullwidth A
    assert.equal(visualWidth('１'), 2); // fullwidth 1
  });

  it('should handle emoji as width 2', () => {
    assert.equal(visualWidth('😀'), 2);
    assert.equal(visualWidth('🎉'), 2);
    assert.equal(visualWidth('hi😀'), 4); // 2 + 2
  });

  it('should handle combining marks as width 0', () => {
    // e + combining acute accent
    assert.equal(visualWidth('e\u0301'), 1); // é as decomposed
  });

  it('should handle zero-width characters as width 0', () => {
    assert.equal(visualWidth('\u200B'), 0); // zero-width space
    assert.equal(visualWidth('\u200D'), 0); // zero-width joiner
    assert.equal(visualWidth('\uFEFF'), 0); // BOM
  });

  it('should handle hiragana as width 2', () => {
    assert.equal(visualWidth('あ'), 2);
    assert.equal(visualWidth('あいう'), 6);
  });

  it('should handle katakana as width 2', () => {
    assert.equal(visualWidth('ア'), 2);
    assert.equal(visualWidth('アイウ'), 6);
  });

  it('should handle a realistic table content line', () => {
    // "│ 名前 │ 年齢 │" — each CJK is width 2
    const content = '名前';
    assert.equal(visualWidth(content), 4);
  });
});

describe('visualPadEnd', () => {
  it('should pad ASCII string', () => {
    assert.equal(visualPadEnd('hi', 5), 'hi   ');
  });

  it('should not pad if already at target width', () => {
    assert.equal(visualPadEnd('hello', 5), 'hello');
  });

  it('should not pad if wider than target', () => {
    assert.equal(visualPadEnd('hello world', 5), 'hello world');
  });

  it('should pad CJK strings correctly', () => {
    // "中" is width 2, target 5, so need 3 spaces
    assert.equal(visualPadEnd('中', 5), '中   ');
  });

  it('should pad mixed strings correctly', () => {
    // "A中" = 1 + 2 = width 3, target 6, need 3 spaces
    assert.equal(visualPadEnd('A中', 6), 'A中   ');
  });

  it('should pad empty string', () => {
    assert.equal(visualPadEnd('', 3), '   ');
  });

  it('should pad with custom character', () => {
    assert.equal(visualPadEnd('hi', 5, '-'), 'hi---');
  });
});

describe('normalizeLineEndings', () => {
  it('should convert CRLF to LF', () => {
    const { text, hadCRLF } = normalizeLineEndings('a\r\nb\r\nc');
    assert.equal(text, 'a\nb\nc');
    assert.equal(hadCRLF, true);
  });

  it('should leave LF unchanged', () => {
    const { text, hadCRLF } = normalizeLineEndings('a\nb\nc');
    assert.equal(text, 'a\nb\nc');
    assert.equal(hadCRLF, false);
  });

  it('should handle empty string', () => {
    const { text, hadCRLF } = normalizeLineEndings('');
    assert.equal(text, '');
    assert.equal(hadCRLF, false);
  });

  it('should handle mixed line endings', () => {
    const { text, hadCRLF } = normalizeLineEndings('a\r\nb\nc\r\nd');
    assert.equal(text, 'a\nb\nc\nd');
    assert.equal(hadCRLF, true);
  });
});

describe('splitLines', () => {
  it('should split on newlines', () => {
    assert.deepEqual(splitLines('a\nb\nc'), ['a', 'b', 'c']);
  });

  it('should handle trailing newline', () => {
    assert.deepEqual(splitLines('a\nb\n'), ['a', 'b']);
  });

  it('should handle single line', () => {
    assert.deepEqual(splitLines('hello'), ['hello']);
  });

  it('should handle empty string', () => {
    assert.deepEqual(splitLines(''), []);
  });
});

describe('stripLeadingIndent', () => {
  it('should strip common 4-space indent', () => {
    const { lines, indent } = stripLeadingIndent([
      '    hello',
      '    world',
    ]);
    assert.deepEqual(lines, ['hello', 'world']);
    assert.equal(indent, '    ');
  });

  it('should strip minimum indent', () => {
    const { lines, indent } = stripLeadingIndent([
      '    hello',
      '  world',
    ]);
    assert.deepEqual(lines, ['  hello', 'world']);
    assert.equal(indent, '  ');
  });

  it('should handle no indent', () => {
    const { lines, indent } = stripLeadingIndent(['hello', 'world']);
    assert.deepEqual(lines, ['hello', 'world']);
    assert.equal(indent, '');
  });

  it('should skip empty lines when calculating indent', () => {
    const { lines, indent } = stripLeadingIndent([
      '    hello',
      '',
      '    world',
    ]);
    assert.deepEqual(lines, ['hello', '', 'world']);
    assert.equal(indent, '    ');
  });
});

describe('restoreLineEndings', () => {
  it('should restore CRLF', () => {
    assert.equal(restoreLineEndings('a\nb\nc', true), 'a\r\nb\r\nc');
  });

  it('should leave LF when hadCRLF is false', () => {
    assert.equal(restoreLineEndings('a\nb\nc', false), 'a\nb\nc');
  });
});
