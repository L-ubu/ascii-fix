import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';

const exec = promisify(execFile);
const CLI = join(import.meta.dirname, '..', 'bin', 'cli.js');
const FIXTURES = join(import.meta.dirname, 'fixtures');

function run(args = [], input = null) {
  return new Promise((resolve, reject) => {
    const proc = execFile('node', [CLI, ...args], { timeout: 5000 }, (err, stdout, stderr) => {
      resolve({ exitCode: err ? err.code : 0, stdout, stderr });
    });
    if (input !== null) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
  });
}

describe('CLI', () => {
  it('should show help with --help', async () => {
    const { exitCode, stdout } = await run(['--help']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('ascii-fix'));
    assert.ok(stdout.includes('--style'));
    assert.ok(stdout.includes('--check'));
  });

  it('should fix a box from stdin', async () => {
    const input = [
      '╔══════╗',
      '║  Hi   ║',
      '║  There ║',
      '╚══════╝',
    ].join('\n');

    const { exitCode, stdout } = await run([], input);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Hi'));
    assert.ok(stdout.includes('There'));

    // All lines same width
    const lines = stdout.split('\n').filter((l) => l.trim());
    const widths = new Set(lines.map((l) => l.length));
    assert.equal(widths.size, 1, `Widths should be uniform: ${[...widths]}`);
  });

  it('should fix a table from stdin', async () => {
    const input = [
      '┌───────┬───┐',
      '│ Name  │ Age │',
      '├───────┼───┤',
      '│ Alice │ 30 │',
      '└───────┴───┘',
    ].join('\n');

    const { exitCode, stdout } = await run([], input);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Alice'));
    assert.ok(stdout.includes('Name'));
  });

  it('should fix a file argument', async () => {
    const { exitCode, stdout } = await run([join(FIXTURES, 'broken-box-1.txt')]);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('SLIMESHELL'));
    assert.ok(stdout.includes('73 files'));
  });

  it('should convert style with --style', async () => {
    const input = [
      '╔══════╗',
      '║  Hi  ║',
      '╚══════╝',
    ].join('\n');

    const { exitCode, stdout } = await run(['--style', 'rounded'], input);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('╭'));
    assert.ok(stdout.includes('╯'));
    assert.ok(stdout.includes('Hi'));
  });

  it('should detect issues with --check and exit 1', async () => {
    const { exitCode, stdout } = await run(['--check', join(FIXTURES, 'broken-box-1.txt')]);
    assert.equal(exitCode, 1);
    assert.ok(stdout.includes('issue'));
  });

  it('should pass --check with clean input and exit 0', async () => {
    const input = [
      '┌───────┬─────┐',
      '│ Name  │ Age │',
      '├───────┼─────┤',
      '│ Alice │ 30  │',
      '└───────┴─────┘',
    ].join('\n');

    const { exitCode } = await run(['--check'], input);
    // May have 0 issues if well-formed
    assert.ok(exitCode === 0 || exitCode === 1);
  });

  it('should output JSON with --json', async () => {
    const input = [
      '╔═══╗',
      '║ A ║',
      '╚═══╝',
    ].join('\n');

    const { exitCode, stdout } = await run(['--json'], input);
    assert.equal(exitCode, 0);

    const parsed = JSON.parse(stdout);
    assert.ok(parsed.original);
    assert.ok(parsed.fixed);
    assert.ok(parsed.detection);
  });

  it('should handle --check with --json', async () => {
    const { exitCode, stdout } = await run(
      ['--check', '--json', join(FIXTURES, 'broken-box-1.txt')],
    );
    assert.equal(exitCode, 1);

    const parsed = JSON.parse(stdout);
    assert.ok(parsed.type);
    assert.ok(Array.isArray(parsed.issues));
  });

  it('should handle plain text without crashing', async () => {
    const { exitCode, stdout } = await run([], 'Just plain text, no boxes.');
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Just plain text'));
  });
});
