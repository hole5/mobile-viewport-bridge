/** Pending edit queue management — extracted from runtime.ts. */

import { buildOps, mergeOps, summarizeOps, copyText } from './utils';
import { VSCODE_API, IS_EXTENSION } from '../bridge';

export type PendingItem = {
  id: string;
  nodeId: string;
  sel: string;
  text: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  width: string;
  height: string;
  display: string;
  borderRadius: string;
  margin: string;
  padding: string;
  src: string;
  ops: ReturnType<typeof buildOps>;
  createdAt: string;
  updatedAt?: string;
  sourceHint: { component: string };
};

export type AppliedHistoryEntry = {
  at: string;
  count: number;
  ids: string[];
};

export type PendingManagerCtx = {
  getPending: () => PendingItem[];
  setPending: (items: PendingItem[]) => void;
  getSelectedId: () => string;
  setSelectedId: (id: string) => void;
  getAppliedHistory: () => AppliedHistoryEntry[];
  setAppliedHistory: (h: AppliedHistoryEntry[]) => void;
  getMode: () => string;
  getSettings: () => { mergePending: boolean; copyOnApply: boolean };
  notify: (msg: string) => void;
  applySelection: (fields: Record<string, unknown>, highlight: boolean, opts?: Record<string, unknown>) => void;
  setMode: (mode: string, opts?: Record<string, unknown>) => void;
  renderModeList: () => void;
  pendingBadge: HTMLElement | null;
};

export type PendingManager = {
  toProtocolEdit: (p: PendingItem) => Record<string, unknown>;
  buildApplyPrompt: () => string;
  refreshPendingUi: () => void;
  upsertPending: (fields: Record<string, unknown>) => { edit: PendingItem; merged: boolean };
  removePending: (id: string) => void;
  clearAllPending: (silent?: boolean) => void;
  focusPendingEdit: (p: PendingItem) => void;
  applyToCode: () => Promise<void>;
  updatePendingBadge: () => void;
};

export function createPendingManager(ctx: PendingManagerCtx): PendingManager {
  const toProtocolEdit = (p: PendingItem) => ({
    id: p.id,
    nodeId: p.nodeId || p.sel,
    selector: p.sel,
    sourceHint: p.sourceHint || { component: 'demo' },
    ops: p.ops || buildOps(p),
    createdAt: p.createdAt,
  });

  const buildApplyPrompt = () => {
    const edits = ctx.getPending().map(toProtocolEdit);
    return [
      '请调用 MCP 工具 viewport_get_pending_edits 获取可视化编辑队列，',
      '根据每条 edit 的 selector 与 ops 修改项目源码，',
      '完成后调用 viewport_apply_edit_result（传入 editIds）并 viewport_reload。',
      '',
      '当前本地 pending 数量: ' + edits.length,
      edits.length ? '本地预览:\n' + JSON.stringify(edits, null, 2) : '',
    ].filter(Boolean).join('\n');
  };

  const updatePendingBadge = () => {
    const pending = ctx.getPending();
    if (ctx.pendingBadge) {
      ctx.pendingBadge.textContent = 'pending: ' + pending.length;
      ctx.pendingBadge.classList.toggle('text-cyber-cyan', pending.length > 0);
      ctx.pendingBadge.classList.toggle('border-cyber-cyan/40', pending.length > 0);
    }
    const rail = document.getElementById('railPendingCount');
    if (rail) {
      rail.textContent = pending.length > 9 ? '9+' : String(pending.length);
      rail.classList.toggle('hidden', pending.length === 0);
    }
    const btnApply = document.getElementById('btnApply') as HTMLButtonElement | null;
    if (btnApply) btnApply.disabled = !pending.length;
    const pendingSub = document.getElementById('pipToolPendingSub');
    if (pendingSub) pendingSub.textContent = pending.length + ' 条';
  };

  const refreshPendingUi = () => {
    updatePendingBadge();
    const pending = ctx.getPending();
    const preview = document.getElementById('pendingPromptPreview');
    const stat = document.getElementById('pendingStat');
    if (stat) stat.textContent = String(pending.length);
    if (preview) {
      preview.textContent = pending.length
        ? buildApplyPrompt()
        : '队列为空 · 在检查模式写入预览后会出现在此';
    }
    const btnApply = document.getElementById('btnApply') as HTMLButtonElement | null;
    if (btnApply) btnApply.disabled = !pending.length;
    if (ctx.getMode() === 'pending') ctx.renderModeList();
  };

  const upsertPending = (fields: Record<string, unknown>) => {
    const ops = buildOps(fields as Parameters<typeof buildOps>[0]);
    const pending = ctx.getPending();
    const settings = ctx.getSettings();
    const existing = settings.mergePending
      ? pending.find((p) => p.sel === String(fields.sel))
      : null;
    if (existing) {
      existing.ops = mergeOps(existing.ops, ops);
      existing.text = String(fields.text || existing.text);
      existing.color = String(fields.color || existing.color);
      existing.fontSize = String(fields.fontSize || existing.fontSize);
      existing.fontWeight = String(fields.fontWeight || existing.fontWeight);
      existing.width = String(fields.width || existing.width);
      existing.height = String(fields.height || existing.height);
      existing.display = String(fields.display || existing.display);
      existing.borderRadius = String(fields.borderRadius || existing.borderRadius);
      existing.margin = String(fields.margin || existing.margin);
      existing.padding = String(fields.padding || existing.padding);
      existing.src = String(fields.src || existing.src);
      existing.updatedAt = new Date().toISOString();
      ctx.setSelectedId(existing.id);
      ctx.setPending([...pending]);
      refreshPendingUi();
      return { edit: existing, merged: true };
    }
    const edit: PendingItem = {
      id: 'edit-' + Date.now().toString(36),
      nodeId: 'node-' + (String(fields.sel) || 'x').replace(/[^a-zA-Z0-9]+/g, '-'),
      sel: String(fields.sel),
      text: String(fields.text || ''),
      color: String(fields.color || ''),
      fontSize: String(fields.fontSize || ''),
      fontWeight: String(fields.fontWeight || ''),
      width: String(fields.width || ''),
      height: String(fields.height || ''),
      display: String(fields.display || ''),
      borderRadius: String(fields.borderRadius || ''),
      margin: String(fields.margin || ''),
      padding: String(fields.padding || ''),
      src: String(fields.src || ''),
      ops,
      createdAt: new Date().toISOString(),
      sourceHint: { component: 'demo' },
    };
    pending.push(edit);
    ctx.setPending(pending);
    ctx.setSelectedId(edit.id);
    refreshPendingUi();
    return { edit, merged: false };
  };

  const removePending = (id: string) => {
    const pending = ctx.getPending();
    const idx = pending.findIndex((p) => p.id === id);
    if (idx < 0) return;
    pending.splice(idx, 1);
    ctx.setPending(pending);
    if (ctx.getSelectedId() === id) ctx.setSelectedId('');
    refreshPendingUi();
    ctx.notify('已移除 ' + id);
  };

  const clearAllPending = (silent?: boolean) => {
    const pending = ctx.getPending();
    if (!pending.length) {
      if (!silent) ctx.notify('队列已空');
      return;
    }
    const n = pending.length;
    ctx.setPending([]);
    ctx.setSelectedId('');
    refreshPendingUi();
    if (!silent) ctx.notify('已清空 ' + n + ' 条 pending');
  };

  const focusPendingEdit = (p: PendingItem) => {
    ctx.setSelectedId(p.id);
    ctx.applySelection(
      {
        sel: p.sel,
        text: p.text,
        color: p.color,
        fontSize: p.fontSize,
        fontWeight: p.fontWeight,
        width: p.width,
        height: p.height,
        display: p.display,
        borderRadius: p.borderRadius,
        margin: p.margin,
        padding: p.padding,
        src: p.src,
      },
      true,
      { stay: true },
    );
    const hint = document.getElementById('inspectHint');
    if (hint) hint.textContent = '队列项 · ' + p.id + ' · ' + summarizeOps(p.ops);
    if (ctx.getMode() === 'pending') ctx.renderModeList();
  };

  const applyToCode = async () => {
    if (IS_EXTENSION) {
      VSCODE_API.postMessage({ type: 'apply_to_code' });
      ctx.notify('正在应用：文本本地回写，其余交 Agent…');
      return;
    }
    const pending = ctx.getPending();
    if (!pending.length) {
      ctx.notify('无 pending edits');
      return;
    }
    const count = pending.length;
    const ids = pending.map((p) => p.id);
    const prompt = buildApplyPrompt();
    const settings = ctx.getSettings();
    let ok = true;
    if (settings.copyOnApply) {
      ok = await copyText(prompt);
    }
    const appliedHistory = ctx.getAppliedHistory();
    appliedHistory.unshift({
      at: new Date().toISOString(),
      count,
      ids,
    });
    if (appliedHistory.length > 8) appliedHistory.length = 8;
    ctx.setAppliedHistory(appliedHistory);
    ctx.setPending([]);
    ctx.setSelectedId('');
    refreshPendingUi();
    ctx.setMode('pending', { quiet: true });
    if (!settings.copyOnApply) {
      ctx.notify('已应用（演示）' + count + ' 条 · 未改项目文件');
    } else {
      ctx.notify(ok
        ? '已应用（演示）' + count + ' 条 · MCP 提示已复制 · 未改项目文件'
        : '已应用（演示）' + count + ' 条 · 复制失败，请手动复制右侧提示');
    }
  };

  return {
    toProtocolEdit,
    buildApplyPrompt,
    refreshPendingUi,
    upsertPending,
    removePending,
    clearAllPending,
    focusPendingEdit,
    applyToCode,
    updatePendingBadge,
  };
}