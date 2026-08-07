/**
 * @deprecated Prefer editing src/webview directly (scheme B).
 * This only re-extracts from the last media/webview monolithic HTML if present.
 */
console.error(
  [
    'UI source of truth is packages/extension/src/webview/.',
    'Design reference: ui-preview/ui2 (do not copy into media as source).',
    'Edit src/webview/** then run: npm run build',
  ].join('\n'),
);
process.exit(1);
