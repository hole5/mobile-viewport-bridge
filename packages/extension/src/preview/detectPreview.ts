import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import * as vscode from 'vscode';

export type PreviewCandidate = {
  url: string;
  label: string;
  /** package.json script name to start preview, e.g. "dev" */
  script?: string;
  /** workspace folder path for running the script */
  cwd?: string;
  reachable: boolean;
  /** preferred / configured port (may be busy) */
  preferredPort?: number;
};

const COMMON_PORTS = [5173, 5174, 3000, 3001, 4173, 8080, 4200, 5500, 4321];

function readJson(file: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function portFromScript(script: string): number | undefined {
  const m =
    script.match(/--port[=\s]+(\d+)/i) ||
    script.match(/-p[=\s]+(\d+)/) ||
    script.match(/localhost:(\d+)/) ||
    script.match(/127\.0\.0\.1:(\d+)/);
  return m ? Number(m[1]) : undefined;
}

function guessPortFromScripts(scripts: Record<string, string>): {
  script: string;
  port: number;
} | null {
  const preferred = ['dev', 'start', 'serve', 'preview', 'docs:dev', 'storybook'];
  for (const name of preferred) {
    const cmd = scripts[name];
    if (!cmd) continue;
    const fromFlag = portFromScript(cmd);
    if (fromFlag) return { script: name, port: fromFlag };
    if (/\bvite\b/i.test(cmd)) return { script: name, port: 5173 };
    if (/\bnext\b/i.test(cmd)) return { script: name, port: 3000 };
    if (/\bnuxt\b/i.test(cmd)) return { script: name, port: 3000 };
    if (/\breact-scripts\b/i.test(cmd) || /\bwebpack-dev-server\b/i.test(cmd)) {
      return { script: name, port: 3000 };
    }
    if (/\bstorybook\b/i.test(cmd)) return { script: name, port: 6006 };
    if (name === 'dev' || name === 'start' || name === 'serve') {
      return { script: name, port: 5173 };
    }
  }
  return null;
}

async function isReachable(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 900);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return res.status > 0;
  } catch {
    return false;
  }
}

/**
 * Prefer `preferred`, then walk upward until a free TCP port on 127.0.0.1 is found.
 * Does not kill existing processes — only picks an unused port.
 */
export function findFreePort(preferred = 5173, maxTries = 40): Promise<number> {
  const start = Math.max(1024, Math.min(preferred, 65000));
  return new Promise((resolve, reject) => {
    let port = start;
    let tries = 0;

    const attempt = () => {
      if (tries++ >= maxTries) {
        reject(new Error(`在 ${start} 附近找不到空闲端口`));
        return;
      }
      const server = net.createServer();
      server.unref();
      server.once('error', () => {
        port += 1;
        attempt();
      });
      server.listen(port, '127.0.0.1', () => {
        const addr = server.address();
        const bound = typeof addr === 'object' && addr ? addr.port : port;
        server.close((err) => {
          if (err) {
            port += 1;
            attempt();
            return;
          }
          resolve(bound);
        });
      });
    };

    attempt();
  });
}

function collectPackageJsonFiles(root: string, maxDepth = 3): string[] {
  const out: string[] = [];
  const skip = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage']);

  function walk(dir: string, depth: number): void {
    if (depth > maxDepth || out.length >= 12) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) out.push(pkg);
    for (const ent of entries) {
      if (!ent.isDirectory() || skip.has(ent.name) || ent.name.startsWith('.')) continue;
      walk(path.join(dir, ent.name), depth + 1);
    }
  }

  walk(root, 0);
  return out;
}

/**
 * Detect previewable web apps in the current workspace and probe local ports.
 */
export async function detectWorkspacePreviews(): Promise<PreviewCandidate[]> {
  const folders = vscode.workspace.workspaceFolders || [];
  const byUrl = new Map<string, PreviewCandidate>();

  for (const folder of folders) {
    const root = folder.uri.fsPath;
    const pkgs = collectPackageJsonFiles(root);
    for (const pkgPath of pkgs) {
      const json = readJson(pkgPath);
      if (!json) continue;
      const scripts = (json.scripts || {}) as Record<string, string>;
      if (!scripts || typeof scripts !== 'object') continue;
      const guess = guessPortFromScripts(scripts);
      if (!guess) continue;
      const cwd = path.dirname(pkgPath);
      const rel =
        cwd === root ? folder.name : path.relative(root, cwd).replace(/\\/g, '/') || folder.name;
      const url = `http://127.0.0.1:${guess.port}`;
      const prev = byUrl.get(url);
      if (!prev || (!prev.script && guess.script)) {
        byUrl.set(url, {
          url,
          label: `${rel} · npm run ${guess.script} (:${guess.port})`,
          script: guess.script,
          cwd,
          reachable: false,
          preferredPort: guess.port,
        });
      }
    }
  }

  for (const port of COMMON_PORTS) {
    const url = `http://127.0.0.1:${port}`;
    if (!byUrl.has(url)) {
      byUrl.set(url, {
        url,
        label: `本机 :${port}`,
        reachable: false,
        preferredPort: port,
      });
    }
  }

  const list = [...byUrl.values()];
  await Promise.all(
    list.map(async (c) => {
      c.reachable = await isReachable(c.url);
    }),
  );

  list.sort((a, b) => {
    if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
    if (!!a.script !== !!b.script) return a.script ? -1 : 1;
    return a.url.localeCompare(b.url);
  });

  return list.filter((c) => c.reachable || c.script);
}

/**
 * Start preview on a guaranteed-free port (prefer candidate port, else next free).
 * Returns the candidate with the actual URL to load.
 */
export async function startPreviewInTerminal(
  candidate: PreviewCandidate,
): Promise<PreviewCandidate> {
  if (!candidate.script || !candidate.cwd) {
    vscode.window.showWarningMessage('未找到可启动的 npm 预览脚本。');
    return candidate;
  }

  const preferred =
    candidate.preferredPort ||
    Number(new URL(candidate.url).port) ||
    5173;
  const port = await findFreePort(preferred);
  const url = `http://127.0.0.1:${port}`;
  const moved = port !== preferred;

  // 显式传 port + strictPort：避免工具在占用时静默改口导致扩展加载错地址
  const cmd = `npm run ${candidate.script} -- --host 127.0.0.1 --port ${port} --strictPort`;
  const term = vscode.window.createTerminal({
    name: `MVB Preview · :${port}`,
    cwd: candidate.cwd,
  });
  term.show(true);
  term.sendText(cmd);

  if (moved) {
    vscode.window.setStatusBarMessage(
      `$(ports) 首选端口 ${preferred} 已被占用，改用空闲端口 ${port}`,
      5000,
    );
  }

  return {
    ...candidate,
    url,
    preferredPort: port,
    label: candidate.label.replace(/:\d+\)/, `:${port})`),
    reachable: false,
  };
}
