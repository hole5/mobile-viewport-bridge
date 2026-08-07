/**
 * Independent MCP client smoke test (no Cursor required).
 */
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'dist', 'server.js');
const server = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

let buf = '';
server.stdout.on('data', (chunk) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) !== -1) {
    const line = buf.substring(0, idx).trim();
    buf = buf.substring(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      const preview = JSON.stringify(msg).substring(0, 240);
      console.log(`[RESP] ${preview}`);
    } catch {
      console.log(`[RAW] ${line}`);
    }
  }
});

server.stderr.on('data', (d) => process.stderr.write(d));

function send(method, params, id) {
  const msg = { jsonrpc: '2.0', method, params: params || {} };
  if (id !== undefined) msg.id = id;
  server.stdin.write(JSON.stringify(msg) + '\n');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function test() {
  console.log('=== MCP smoke test ===');
  // TRAE-style initialize without id
  send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test' },
  });
  await sleep(400);

  send('tools/list', {}, 2);
  await sleep(300);

  send('tools/call', { name: 'viewport_list_devices', arguments: {} }, 3);
  await sleep(300);

  send('tools/call', { name: 'viewport_get_overview', arguments: {} }, 4);
  await sleep(300);

  send('tools/call', { name: 'viewport_simulate_edit', arguments: { text: 'Smoke OK' } }, 5);
  await sleep(400);

  send('tools/call', { name: 'viewport_get_pending_edits', arguments: {} }, 6);
  await sleep(400);

  console.log('=== done ===');
  server.stdin.end();
  setTimeout(() => process.exit(0), 300);
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
