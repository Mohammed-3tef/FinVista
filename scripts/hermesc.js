#!/usr/bin/env node
/**
 * Fake hermesc for Windows builds.
 *
 * The real hermesc compiles a JS bundle → Hermes bytecode (.hbc).
 * hermesc.exe is not shipped for Win64 in this version of RN, so this script
 * acts as a pass-through: it copies the input JS bundle to the output path.
 *
 * Hermes can execute plain JS bundles at runtime — bytecode is an optimisation,
 * not a requirement. The app will start a tiny bit slower on first launch but
 * will otherwise be functionally identical to a bytecode build.
 *
 * Invoked by the React Native Gradle Plugin as:
 *   hermesc -w -emit-binary -max-diagnostic-width=80 -out <output.hbc> <input.bundle> [-O] [-output-source-map]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

// Find -out <path>
const outIdx = args.indexOf('-out');
if (outIdx === -1 || outIdx + 1 >= args.length) {
  console.error('fake-hermesc: missing -out argument');
  process.exit(1);
}
const output = args[outIdx + 1];

// Input bundle is the last positional argument (not starting with '-',
// and not the value after -out)
let input = null;
for (let i = args.length - 1; i >= 0; i--) {
  if (!args[i].startsWith('-') && i !== outIdx + 1) {
    input = args[i];
    break;
  }
}

if (!input) {
  console.error('fake-hermesc: could not locate input bundle in args:', args);
  process.exit(1);
}

// Copy JS bundle to the expected .hbc output path
fs.copyFileSync(input, output);

// If -output-source-map is requested, create an empty source map next to the
// output so RNGP's source-map composition step doesn't crash.
if (args.includes('-output-source-map')) {
  fs.writeFileSync(output + '.map', JSON.stringify({ version: 3, sources: [], mappings: '' }));
}
