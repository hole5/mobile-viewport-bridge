/**
 * start-mcp.js - MCP 服务保活启动器
 * 用 pipe 方式启动 server.js，保持 stdin 不关闭
 */
const { spawn } = require('child_process');
const path = require('path');

const child = spawn(process.execPath, [path.join(__dirname, 'dist', 'server.js')], {
  cwd: __dirname,
  stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, MVB_WS_PORT: '3847' },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

// 保持父进程存活
setInterval(() => {}, 86400000);
