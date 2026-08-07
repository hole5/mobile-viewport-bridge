/**
 * patch-vsix.js
 * 打包后处理：从 .vsix 中移除 TRAE CLI 不兼容的 vsixmanifest 属性
 * - Microsoft.VisualStudio.Code.EnabledApiProposals (空值导致 TRAE 扫描异常)
 * - Microsoft.VisualStudio.Code.ExecutesCode (TRAE 内核不识别)
 *
 * 使用 adm-zip 纯 JS 库操作 zip，无外部依赖（PowerShell/tar）。
 */
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const extRoot = path.join(__dirname, '..');

// 找到最新生成的 vsix
function findLatestVsix() {
  const files = fs.readdirSync(extRoot)
    .filter(f => f.endsWith('.vsix'))
    .map(f => ({
      name: f,
      path: path.join(extRoot, f),
      mtime: fs.statSync(path.join(extRoot, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return files[0] || null;
}

const latest = findLatestVsix();
if (!latest) {
  console.error('[patch-vsix] 未找到 .vsix 文件');
  process.exit(1);
}

const vsixPath = latest.path;
console.log(`[patch-vsix] 处理: ${latest.name}`);

const zip = new AdmZip(vsixPath);

// --- 1. 修改 extension.vsixmanifest ---
const manifestEntry = zip.getEntry('extension.vsixmanifest');
if (!manifestEntry) {
  console.error('[patch-vsix] 未找到 extension.vsixmanifest');
  process.exit(1);
}

let manifest = manifestEntry.getData().toString('utf8');
let changed = false;

const propertiesToRemove = [
  'Microsoft.VisualStudio.Code.EnabledApiProposals',
  'Microsoft.VisualStudio.Code.ExecutesCode',
];

for (const prop of propertiesToRemove) {
  const regex = new RegExp(`\\s*<Property Id="${prop}"[^/]*/>\\s*`, 'g');
  if (regex.test(manifest)) {
    manifest = manifest.replace(regex, '\n\t\t\t\t');
    changed = true;
    console.log(`[patch-vsix] 移除属性: ${prop}`);
  }
}

// 将 ExtensionKind 从 workspace 改为 ui（TRAE 不支持 workspace 类型扩展）
const kindRegex = /<Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="workspace" \/>/;
if (kindRegex.test(manifest)) {
  manifest = manifest.replace(kindRegex, '<Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="ui" />');
  changed = true;
  console.log('[patch-vsix] ExtensionKind: workspace → ui');
}

if (changed) {
  zip.updateFile('extension.vsixmanifest', Buffer.from(manifest, 'utf8'));
}

// --- 2. 清理 extension/package.json ---
const pkgEntry = zip.getEntry('extension/package.json');
if (pkgEntry) {
  const pkg = JSON.parse(pkgEntry.getData().toString('utf8'));
  delete pkg.scripts;
  delete pkg.dependencies;
  delete pkg.devDependencies;
  zip.updateFile('extension/package.json', Buffer.from(JSON.stringify(pkg, null, 2), 'utf8'));
  console.log('[patch-vsix] 清理 package.json: 移除 scripts/dependencies/devDependencies');
  changed = true;
}

if (!changed) {
  console.log('[patch-vsix] 无需修改，属性不存在');
  process.exit(0);
}

// --- 3. 保存 ---
zip.writeZip(vsixPath);
console.log(`[patch-vsix] 完成: ${latest.name}`);
