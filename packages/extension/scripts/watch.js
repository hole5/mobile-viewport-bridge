const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const extRoot = path.join(__dirname, '..');
const dist = path.join(extRoot, 'dist');
const mediaSrc = path.join(extRoot, 'media');

// 确保 @mvb/shared 先构建一次（esbuild 会后续监听到 shared 源文件变更）
try {
  const sharedRoot = path.join(__dirname, '..', '..', 'shared');
  execSync('npx tsc -p tsconfig.json', { cwd: sharedRoot, stdio: 'inherit' });
  console.log('[watch] @mvb/shared built');
} catch (e) {
  console.error('[watch] @mvb/shared build failed, continuing...');
  console.error(e.message);
}

fs.mkdirSync(path.join(dist, 'media'), { recursive: true });

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else {
      try { if (!fs.existsSync(d) || fs.statSync(s).mtimeMs > fs.statSync(d).mtimeMs) fs.copyFileSync(s, d); }
      catch { fs.copyFileSync(s, d); }
    }
  }
}

function copyMedia() {
  const dest = path.join(dist, 'media');
  if (fs.existsSync(mediaSrc)) copyDir(mediaSrc, dest);
  console.log('[watch] media copied');
}

// 首次全量构建
copyMedia();

// esbuild 监看扩展入口
esbuild.context({
  entryPoints: [path.join(__dirname, '..', 'src', 'extension.ts')],
  bundle: true,
  outfile: path.join(dist, 'extension.js'),
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
  sourcemap: true,
  minify: false,
}).then((ctx) => {
  ctx.watch();
  console.log('[watch] esbuild watching src/extension.ts ...');
}).catch((e) => {
  console.error('esbuild watch failed:', e);
  process.exit(1);
});

// Webview 单独入口
const wvSrc = path.join(extRoot, 'src', 'webview');
const wvOut = path.join(extRoot, 'media', 'webview');
fs.mkdirSync(path.join(wvOut, 'styles'), { recursive: true });
fs.mkdirSync(path.join(wvOut, 'assets'), { recursive: true });

esbuild.context({
  entryPoints: [path.join(wvSrc, 'main.ts')],
  bundle: true,
  outfile: path.join(wvOut, 'app.js'),
  platform: 'browser',
  target: ['es2020'],
  format: 'iife',
  sourcemap: true,
  minify: false,
}).then((ctx) => {
  ctx.watch();
  console.log('[watch] esbuild watching src/webview/main.ts ...');
}).catch((e) => {
  console.error('webview watch failed:', e);
  process.exit(1);
});

// 文件系统监看：HTML/CSS/静态资源变化 -> 自动拷贝
function watchDir(dir, label) {
  if (!fs.existsSync(dir)) return;
  fs.watch(dir, { recursive: true }, (event, filename) => {
    if (!filename) return;
    const rel = path.relative(dir, filename);
    if (rel.startsWith('node_modules') || rel.includes('.git')) return;

    // webview 源文件变化 -> 拷贝到 media/webview
    if (dir === wvSrc) {
      const srcPath = path.join(wvSrc, rel);
      const dstPath = path.join(wvOut, rel);
      try {
        if (event === 'rename' || !fs.existsSync(dstPath)) {
          fs.mkdirSync(path.dirname(dstPath), { recursive: true });
          if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, dstPath);
        } else {
          fs.copyFileSync(srcPath, dstPath);
        }
      } catch {}
      // 同步拷贝到 dist/media/webview
      const distDst = path.join(dist, 'media', 'webview', rel);
      try {
        fs.mkdirSync(path.dirname(distDst), { recursive: true });
        if (fs.existsSync(dstPath)) fs.copyFileSync(dstPath, distDst);
      } catch {}
      console.log(`[watch] ${rel}`);
    }

    // media 目录文件变化 -> 拷贝到 dist/media
    if (dir === mediaSrc) {
      const srcPath = path.join(mediaSrc, rel);
      const dstPath = path.join(dist, 'media', rel);
      try {
        fs.mkdirSync(path.dirname(dstPath), { recursive: true });
        if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, dstPath);
        else {
          // 文件被删除，也从 dist 中移除
          try { if (fs.existsSync(dstPath)) fs.unlinkSync(dstPath); } catch {}
        }
      } catch {}
      console.log(`[watch] media/${rel}`);
    }
  });
  console.log(`[watch] fs watching ${label} ...`);
}

watchDir(mediaSrc, 'media/');
watchDir(wvSrc, 'src/webview/ (HTML/CSS)');

console.log('[watch] All watchers active. Press Ctrl+C to stop.');
console.log('[watch] Now press F5 to launch Extension Dev Host.');
