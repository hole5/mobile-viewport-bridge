const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'media');
const dest = path.join(__dirname, '..', 'dist', 'media');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(src, dest);
console.log('media copied to dist/media');
