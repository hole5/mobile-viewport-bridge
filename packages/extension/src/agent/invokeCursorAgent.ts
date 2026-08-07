import * as vscode from 'vscode';
import {
  LAYOUT_SNAP_STEP_PX,
  alignMoveOp,
  alignStyleOpValue,
  type EditOp,
  type PendingEdit,
} from '@mvb/shared';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function tryCommands(commands: string[], args?: unknown): Promise<string | null> {
  for (const cmd of commands) {
    try {
      if (args !== undefined) await vscode.commands.executeCommand(cmd, args);
      else await vscode.commands.executeCommand(cmd);
      return cmd;
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * Open Cursor Agent and feed an MCP apply prompt.
 * Cursor has no stable public "prompt" API; best-effort: new agent chat → paste → submit.
 */
export async function invokeCursorAgentWithPrompt(prompt: string): Promise<{
  mode: 'agent' | 'clipboard';
  detail: string;
}> {
  const previousClipboard = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(prompt);

  // Prefer native chat/composer open-with-query when available (Cursor ≥2.3 / VS Code chat)
  const openedWithQuery = await tryCommands(
    ['workbench.action.chat.open', 'workbench.action.chat.openAgent'],
    { query: prompt },
  );
  if (openedWithQuery) {
    await sleep(150);
    await tryCommands([
      'workbench.action.chat.submit',
      'composer.submit',
      'composer.sendToAgent',
    ]);
    scheduleRestoreClipboard(previousClipboard);
    return { mode: 'agent', detail: openedWithQuery };
  }

  const opened = await tryCommands([
    'composer.newAgentChat',
    'composer.newChat',
    'composer.createNewComposerTab',
    'aichat.newchataction',
    'workbench.action.chat.newChat',
  ]);

  if (!opened) {
    return {
      mode: 'clipboard',
      detail: 'no-agent-command',
    };
  }

  await sleep(220);
  try {
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
  } catch {
    /* paste may fail if focus wrong; prompt still on clipboard */
  }
  await sleep(120);
  await tryCommands([
    'composer.sendToAgent',
    'composer.submit',
    'workbench.action.chat.submit',
    'aichat.submitinsertselectionintochat',
  ]);

  scheduleRestoreClipboard(previousClipboard);
  return { mode: 'agent', detail: opened };
}

function scheduleRestoreClipboard(previous: string): void {
  setTimeout(() => {
    void Promise.resolve(vscode.env.clipboard.writeText(previous)).catch(() => undefined);
  }, 2500);
}

/** Align move / position-ish style ops onto the layout grid before prompting Agent. */
export function alignEditsForAgent(edits: PendingEdit[]): PendingEdit[] {
  return edits.map((edit) => ({
    ...edit,
    ops: edit.ops.map((op): EditOp => {
      if (op.type === 'move') return alignMoveOp(op, LAYOUT_SNAP_STEP_PX);
      if (op.type === 'style') {
        return {
          ...op,
          value: alignStyleOpValue(op.prop, op.value, LAYOUT_SNAP_STEP_PX),
        };
      }
      return op;
    }),
  }));
}

export type ApplyAgentPromptOptions = {
  editsJson: string;
  pendingCount: number;
  textAppliedIds?: string[];
  textFailed?: { id: string; reason: string }[];
  textFilesChanged?: string[];
};

/** Prompt: Agent handles non-text ops with strict apply, layout snap, and verify loop. */
export function buildMcpApplyAgentPrompt(opts: ApplyAgentPromptOptions): string {
  const {
    editsJson,
    pendingCount,
    textAppliedIds = [],
    textFailed = [],
    textFilesChanged = [],
  } = opts;

  const lines = [
    '你是 Cursor Agent。用户在 Mobile Viewport Bridge 中点击了「应用到代码」。',
    '请立即通过 MCP（mobile-viewport-bridge）完成剩余源码回写，不要只口头说明。',
    '',
    '分工说明：',
    '- 纯文本 text op 已由扩展尝试本地回写；你只需处理队列中剩余的 style / attr / move（及本地失败的 text）。',
    '- 必须严格按 pending 的 selector + ops 执行，禁止无关重构或 invent 编辑。',
    '',
    '必须按顺序：',
    '1) viewport_get_pending_edits — 读取待回写队列（以 MCP 返回为准）',
    '2) 按每条 edit 修改工作区源码',
    '3) 自检：对照 ops 目标值核对已改文件；不对则继续修，直到一致',
    '4) 仅修复本次回写引入的语法/类型/明显破损，不做无关改动',
    '5) viewport_apply_edit_result — 传入已处理的 editIds，reload: true',
    '6) 如需再刷预览可调用 viewport_reload',
    '',
    '布局 / 拖动对齐（避免用户拖动产生的亚像素偏移）：',
    `- 所有 move.x / move.y 及 left/top/right/bottom/width/height/margin/padding/gap/translate 等间距类数值，按 ${LAYOUT_SNAP_STEP_PX}px 网格四舍五入后再写入源码`,
    '- 优先用 margin / gap / flex / grid 表达位置；避免把轻微拖动写成 absolute + 零碎 left/top',
    '- 若 ops 是 delta 位移，映射到现有布局体系（sibling 顺序、gap、margin）而不是堆叠 transform 噪声',
    '- 写入后数值应落在网格上（例如 16px 而非 16.37px）',
    '',
    `扩展侧本地文本回写：成功 ${textAppliedIds.length} 条` +
      (textAppliedIds.length ? ` [${textAppliedIds.join(', ')}]` : ''),
    textFilesChanged.length ? `文本已改文件: ${textFilesChanged.join(', ')}` : '',
    textFailed.length
      ? `文本本地失败（请你一并处理）: ${JSON.stringify(textFailed)}`
      : '文本本地失败: 无',
    '',
    `当前交给 Agent 的 pending 数量: ${pendingCount}`,
    '本地 pending 快照（若与 MCP 不一致，以 viewport_get_pending_edits 为准）：',
    editsJson || '[]',
    '',
    '完成后简要说明：改了哪些文件、如何对齐拖动/间距、自检结果。',
  ];

  return lines.filter((l) => l !== undefined).join('\n');
}
