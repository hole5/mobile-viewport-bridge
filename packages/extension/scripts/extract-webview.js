const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'media', 'webview', 'index.html');
const out = path.join(__dirname, '..', 'src', 'webview');
const html = fs.readFileSync(src, 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const marker = 'const VSCODE_API';
const markerAt = html.indexOf(marker);
if (!styleMatch || markerAt < 0) {
  console.error('parse failed');
  process.exit(1);
}

const scriptOpen = html.lastIndexOf('<script>', markerAt);
const bodyClose = html.lastIndexOf('</body>');
const scriptClose = html.lastIndexOf('</script>', bodyClose);
const bodyOpen = html.indexOf('<body');
const bodyTagEnd = html.indexOf('>', bodyOpen);

const bodyAttrs = html.slice(bodyOpen + 5, bodyTagEnd).trim();
const bodyInner = html.slice(bodyTagEnd + 1, scriptOpen).trim();
const script = html.slice(scriptOpen + '<script>'.length, scriptClose).trim();

if (!script.startsWith('const VSCODE_API')) {
  console.error('script does not start with VSCODE_API, got:', script.slice(0, 80));
  process.exit(1);
}

fs.mkdirSync(path.join(out, 'styles'), { recursive: true });
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
fs.writeFileSync(path.join(out, 'styles', 'main.css'), styleMatch[1].trim() + '\n');
fs.writeFileSync(path.join(out, '_extracted_body.html'), bodyInner + '\n');
fs.writeFileSync(path.join(out, '_extracted_script.js'), script + '\n');
console.log({
  css: styleMatch[1].length,
  body: bodyInner.length,
  js: script.length,
  scriptHead: script.slice(0, 60),
});
