#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { fix, detect } from '../src/index.js';

const USAGE = `
ascii-fix — Fix broken ASCII art tables, boxes, and diagrams

Usage:
  ascii-fix [options] [file]
  cat file.txt | ascii-fix [options]

Options:
  --style <style>   Target style: unicode-heavy, unicode-light, ascii, rounded
  --check           Detect issues only (no fix). Exit code 1 if issues found.
  --write           Fix and write back to file (requires file argument)
  --json            Output as JSON
  --help            Show this help message

Examples:
  echo "broken table" | ascii-fix
  ascii-fix input.txt
  ascii-fix --style rounded input.txt
  ascii-fix --check input.txt
  ascii-fix --write input.txt
  ascii-fix --json input.txt
`.trim();

const { values: flags, positionals } = parseArgs({
  options: {
    style: { type: 'string', short: 's' },
    check: { type: 'boolean', default: false },
    write: { type: 'boolean', short: 'w', default: false },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
});

if (flags.help) {
  console.log(USAGE);
  process.exit(0);
}

async function main() {
  let input;
  const file = positionals[0];

  if (file) {
    try {
      input = readFileSync(file, 'utf-8');
    } catch (err) {
      console.error(`Error reading file: ${err.message}`);
      process.exit(2);
    }
  } else if (!process.stdin.isTTY) {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    input = Buffer.concat(chunks).toString('utf-8');
  } else {
    console.log(USAGE);
    process.exit(0);
  }

  if (flags.check) {
    const result = detect(input);
    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.issues.length === 0) {
        console.log('No issues found.');
      } else {
        console.log(`Found ${result.issues.length} issue(s):`);
        for (const issue of result.issues) {
          console.log(`  Line ${issue.line}: [${issue.type}] ${issue.message}`);
        }
      }
    }
    process.exit(result.issues.length > 0 ? 1 : 0);
  }

  const options = {};
  if (flags.style) options.style = flags.style;

  const fixed = fix(input, options);

  if (flags.json) {
    const detection = detect(input);
    console.log(
      JSON.stringify({ original: input, fixed, detection }, null, 2),
    );
  } else if (flags.write) {
    if (!file) {
      console.error('Error: --write requires a file argument');
      process.exit(2);
    }
    writeFileSync(file, fixed, 'utf-8');
    console.log(`Fixed and wrote back to ${file}`);
  } else {
    process.stdout.write(fixed);
  }
}

main();
