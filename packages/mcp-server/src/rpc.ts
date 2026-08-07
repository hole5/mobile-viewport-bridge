import { EventEmitter } from 'events';

export function log(msg: string): void {
  process.stderr.write(`[MCP] ${msg}\n`);
}

export function send(msg: unknown): void {
  const str = typeof msg === 'string' ? msg : JSON.stringify(msg);
  process.stdout.write(str + '\n');
}

export function response(id: number | string, result: unknown): void {
  send({ jsonrpc: '2.0', id, result });
}

export function notification(method: string, params: unknown): void {
  send({ jsonrpc: '2.0', method, params });
}

/** TRAE-compatible character-depth JSON stream parser */
export class JsonStreamParser extends EventEmitter {
  private buffer = '';
  private inString = false;
  private stringChar = '';
  private depth = 0;
  private escaped = false;

  feed(chunk: string): void {
    this.buffer += chunk;
    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i];
      if (this.escaped) {
        this.escaped = false;
        continue;
      }
      if (this.inString) {
        if (ch === '\\') this.escaped = true;
        else if (ch === this.stringChar) this.inString = false;
        continue;
      }
      if (ch === '"' || ch === "'") {
        this.inString = true;
        this.stringChar = ch;
        continue;
      }
      if (ch === '{' || ch === '[') this.depth++;
      if (ch === '}' || ch === ']') {
        this.depth--;
        if (this.depth === 0) {
          const jsonStr = this.buffer.substring(0, i + 1);
          this.buffer = this.buffer.substring(i + 1).trim();
          i = -1;
          try {
            const msg = JSON.parse(jsonStr);
            this.emit('message', msg);
          } catch (e) {
            const err = e as Error;
            log(`JSON parse error: ${err.message}`);
          }
        }
      }
    }
  }
}
