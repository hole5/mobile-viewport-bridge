import type { EditOp, PendingEdit } from '@mvb/shared';

export type PartitionedEdits = {
  /** Edits that contain only text ops (eligible for local apply). */
  textOnly: PendingEdit[];
  /** Edits after stripping text ops — style/attr/move remain for Agent. */
  agentEdits: PendingEdit[];
  /** Edit ids that become empty after stripping text (fully handled locally if text apply succeeds). */
  textConsumedIds: string[];
};

function isTextOp(op: EditOp): op is Extract<EditOp, { type: 'text' }> {
  return op.type === 'text';
}

/** Split pending queue: local text vs Agent (style / attr / move / mixed remainder). */
export function partitionPendingEdits(edits: PendingEdit[]): PartitionedEdits {
  const textOnly: PendingEdit[] = [];
  const agentEdits: PendingEdit[] = [];
  const textConsumedIds: string[] = [];

  for (const edit of edits) {
    const textOps = edit.ops.filter(isTextOp);
    const otherOps = edit.ops.filter((op) => !isTextOp(op));

    if (textOps.length && !otherOps.length) {
      textOnly.push({ ...edit, ops: textOps });
      textConsumedIds.push(edit.id);
      continue;
    }

    if (textOps.length && otherOps.length) {
      textOnly.push({ ...edit, ops: textOps });
      agentEdits.push({ ...edit, ops: otherOps });
      continue;
    }

    if (otherOps.length) {
      agentEdits.push({ ...edit, ops: otherOps });
    }
  }

  return { textOnly, agentEdits, textConsumedIds };
}
