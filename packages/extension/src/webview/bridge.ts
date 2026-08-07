/** VS Code webview bridge (null when opened as plain browser demo). */

export type VsCodeApi = {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

declare function acquireVsCodeApi(): VsCodeApi;

export const VSCODE_API: VsCodeApi | null =
  typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

export const IS_EXTENSION = !!VSCODE_API;

export function postToExtension(message: Record<string, unknown>): void {
  VSCODE_API?.postMessage(message);
}
