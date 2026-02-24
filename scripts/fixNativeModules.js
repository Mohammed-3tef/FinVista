/**
 * fixNativeModules.js
 * Postinstall script that patches third-party Android build.gradle files
 * that still reference the defunct jcenter() repository.
 * Run automatically via `npm run postinstall`.
 */
const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'react-native-get-sms-android/android/build.gradle',
    replacements: [
      { from: /jcenter\(\)/g, to: 'mavenCentral()' },
      {
        from: "classpath 'com.android.tools.build:gradle:3.3.1'",
        to: "classpath 'com.android.tools.build:gradle:8.3.2'",
      },
    ],
  },
];

let changed = 0;

for (const fix of fixes) {
  const filePath = path.join(__dirname, '..', 'node_modules', fix.file);
  if (!fs.existsSync(filePath)) {
    console.log(`[fixNativeModules] skip (not found): ${fix.file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const { from, to } of fix.replacements) {
    content = content.replace(from, to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[fixNativeModules] patched: ${fix.file}`);
    changed++;
  } else {
    console.log(`[fixNativeModules] already patched: ${fix.file}`);
  }
}

console.log(`[fixNativeModules] done. ${changed} file(s) updated.`);
