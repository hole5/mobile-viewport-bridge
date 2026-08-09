const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function buildWebview() {
  const extRoot = path.join(__dirname, '..');
  const wvSrc = path.join(extRoot, 'src', 'webview');
  const wvOut = path.join(extRoot, 'media', 'webview');

  fs.mkdirSync(path.join(wvOut, 'styles'), { recursive: true });
  fs.mkdirSync(path.join(wvOut, 'assets'), { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(wvSrc, 'main.ts')],
    bundle: true,
    outfile: path.join(wvOut, 'app.js'),
    platform: 'browser',
    target: ['es2020'],
    format: 'iife',
    sourcemap: true,
    minify: false,
  });

  fs.copyFileSync(path.join(wvSrc, 'index.html'), path.join(wvOut, 'index.html'));
  fs.copyFileSync(path.join(wvSrc, 'styles', 'main.css'), path.join(wvOut, 'styles', 'main.css'));

  const screenSrc = path.join(wvSrc, 'assets', 'ui-screen.png');
  const screenFallback = path.join(wvOut, 'ui-screen.png');
  if (fs.existsSync(screenSrc)) {
    fs.copyFileSync(screenSrc, path.join(wvOut, 'ui-screen.png'));
  } else if (!fs.existsSync(screenFallback)) {
    throw new Error('Missing ui-screen.png in src/webview/assets');
  }

  // 复制备选手机框 ui-screen1.png
  const screen1Src = path.join(wvSrc, 'assets', 'ui-screen1.png');
  if (fs.existsSync(screen1Src)) {
    fs.copyFileSync(screen1Src, path.join(wvOut, 'ui-screen1.png'));
  }

  console.log('bundled media/webview/app.js');
}

async function main() {
  const dist = path.join(__dirname, '..', 'dist');
  fs.mkdirSync(dist, { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(__dirname, '..', 'src', 'extension.ts')],
    bundle: true,
    outfile: path.join(dist, 'extension.js'),
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    external: ['vscode'],
    sourcemap: true,
    minify: false,
  });

  await buildWebview();

  const mediaSrc = path.join(__dirname, '..', 'media');
  const mediaDest = path.join(dist, 'media');
  fs.mkdirSync(mediaDest, { recursive: true });
  if (fs.existsSync(mediaSrc)) copyDir(mediaSrc, mediaDest);
  console.log('bundled dist/extension.js + dist/media');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
