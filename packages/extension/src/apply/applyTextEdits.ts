import * as vscode from 'vscode';
import type { PendingEdit } from '@mvb/shared';

export type TextApplyFailure = { id: string; reason: string };

export type TextApplyResult = {
  appliedIds: string[];
  failed: TextApplyFailure[];
  filesChanged: string[];
};

type SelectorHints = {
  tag?: string;
  id?: string;
  classes: string[];
};

const TEXT_FILE_GLOB = '**/*.{html,htm,vue,jsx,tsx,svelte,astro,mdx,js,ts}';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extract tag / id / classes from the rightmost compound selector. */
export function parseSelectorHints(selector: string): SelectorHints {
  const parts = String(selector || '')
    .split(/[>+~\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1] || '';
  const cleaned = last.replace(/::?[a-zA-Z0-9_-]+(\([^)]*\))?/g, '');
  const tagMatch = cleaned.match(/^([a-zA-Z][\w-]*)/);
  const idMatch = cleaned.match(/#([a-zA-Z_][\w-]*)/);
  const classes = [...cleaned.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((m) => m[1]);
  return {
    tag: tagMatch?.[1],
    id: idMatch?.[1],
    classes,
  };
}

function latestTextValue(edit: PendingEdit): string | null {
  for (let i = edit.ops.length - 1; i >= 0; i--) {
    const op = edit.ops[i];
    if (op.type === 'text') return op.value;
  }
  return null;
}

function buildSearchNeedles(hints: SelectorHints): string[] {
  const needles: string[] = [];
  if (hints.id) needles.push(`id="${hints.id}"`, `id='${hints.id}'`);
  for (const c of hints.classes) {
    needles.push(c);
  }
  return needles;
}

/**
 * Replace first matching element's text content using class/id/tag hints.
 * Supports HTML and JSX-ish className.
 */
export function replaceElementInnerText(
  source: string,
  hints: SelectorHints,
  newText: string,
): { next: string; changed: boolean } {
  const tag = hints.tag ? escapeRegExp(hints.tag) : '[a-zA-Z][\\w-]*';
  const attrBits: string[] = [];

  if (hints.id) {
    attrBits.push(`id\\s*=\\s*["']${escapeRegExp(hints.id)}["']`);
  }
  for (const c of hints.classes) {
    attrBits.push(
      `class(?:Name)?\\s*=\\s*["'][^"']*\\b${escapeRegExp(c)}\\b[^"']*["']`,
    );
  }

  if (!attrBits.length) {
    return { next: source, changed: false };
  }

  // Require all id/class hints to appear on the opening tag (order-independent via lookaheads).
  const lookaheads = attrBits.map((b) => `(?=[^>]*\\b${b})`).join('');
  const re = new RegExp(
    `(<(${tag})\\b${lookaheads}[^>]*>)([\\s\\S]*?)(<\\/\\2\\s*>)`,
    'i',
  );

  const m = re.exec(source);
  if (!m) return { next: source, changed: false };

  const open = m[1];
  const close = m[4];
  const inner = m[3];

  // Prefer replacing a simple text-only inner; otherwise replace entire inner.
  const trimmed = inner.trim();
  let nextInner: string;
  if (!trimmed.includes('<')) {
    const leading = inner.match(/^\s*/)?.[0] ?? '';
    const trailing = inner.match(/\s*$/)?.[0] ?? '';
    nextInner = `${leading}${newText}${trailing}`;
  } else {
    nextInner = newText;
  }

  if (inner === nextInner) return { next: source, changed: false };

  const next = source.slice(0, m.index) + open + nextInner + close + source.slice(m.index + m[0].length);
  return { next, changed: true };
}

async function resolveCandidateUris(edit: PendingEdit, hints: SelectorHints): Promise<vscode.Uri[]> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return [];

  const hintFile = edit.sourceHint?.file?.trim();
  if (hintFile) {
    const abs = vscode.Uri.file(hintFile);
    try {
      await vscode.workspace.fs.stat(abs);
      return [abs];
    } catch {
      const rel = await vscode.workspace.findFiles(hintFile, '**/node_modules/**', 5);
      if (rel.length) return rel;
    }
  }

  const needles = buildSearchNeedles(hints);
  if (!needles.length) return [];

  const found = new Map<string, { uri: vscode.Uri; score: number }>();
  for (const folder of folders) {
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, TEXT_FILE_GLOB),
      '**/node_modules/**',
      400,
    );
    for (const uri of files) {
      let text: string;
      try {
        const raw = await vscode.workspace.fs.readFile(uri);
        text = Buffer.from(raw).toString('utf8');
      } catch {
        continue;
      }
      const hit = needles.some((n) => text.includes(n));
      if (!hit) continue;
      const score =
        (hints.id && (text.includes(`id="${hints.id}"`) || text.includes(`id='${hints.id}'`)) ? 10 : 0) +
        hints.classes.reduce(
          (s, c) =>
            s +
            (text.includes(`class="${c}"`) ||
            text.includes(`class='${c}'`) ||
            text.includes(`className="${c}"`) ||
            text.includes(`className='${c}'`)
              ? 5
              : text.includes(c)
                ? 1
                : 0),
          0,
        );
      if (score <= 0) continue;
      const key = uri.toString();
      const prev = found.get(key);
      if (!prev || score > prev.score) found.set(key, { uri, score });
    }
  }
  return [...found.values()]
    .sort((a, b) => b.score - a.score)
    .map((x) => x.uri);
}

async function applyOneTextEdit(edit: PendingEdit): Promise<{ ok: boolean; file?: string; reason?: string }> {
  const value = latestTextValue(edit);
  if (value === null) return { ok: false, reason: 'no text op' };

  const hints = parseSelectorHints(edit.selector);
  if (!hints.id && !hints.classes.length) {
    return { ok: false, reason: `selector lacks id/class: ${edit.selector}` };
  }

  const uris = await resolveCandidateUris(edit, hints);
  if (!uris.length) {
    return { ok: false, reason: `no source file matched selector ${edit.selector}` };
  }

  for (const uri of uris) {
    const doc = await vscode.workspace.openTextDocument(uri);
    const original = doc.getText();
    const { next, changed } = replaceElementInnerText(original, hints, value);
    if (!changed) continue;

    const editBuilder = new vscode.WorkspaceEdit();
    const full = new vscode.Range(doc.positionAt(0), doc.positionAt(original.length));
    editBuilder.replace(uri, full, next);
    const ok = await vscode.workspace.applyEdit(editBuilder);
    if (!ok) return { ok: false, reason: `applyEdit failed for ${uri.fsPath}` };
    await doc.save();
    return { ok: true, file: uri.fsPath };
  }

  return { ok: false, reason: `matched files but could not rewrite text for ${edit.selector}` };
}

/** Locally apply text-only pending edits to workspace source files. */
export async function applyTextEditsLocally(edits: PendingEdit[]): Promise<TextApplyResult> {
  const appliedIds: string[] = [];
  const failed: TextApplyFailure[] = [];
  const filesChanged: string[] = [];

  for (const edit of edits) {
    const result = await applyOneTextEdit(edit);
    if (result.ok) {
      appliedIds.push(edit.id);
      if (result.file && !filesChanged.includes(result.file)) filesChanged.push(result.file);
    } else {
      failed.push({ id: edit.id, reason: result.reason || 'unknown' });
    }
  }

  return { appliedIds, failed, filesChanged };
}
