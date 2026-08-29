#!/usr/bin/env node
'use strict';
/*
 * CI-only smoke test for the MCP bootstrap chain -- run by
 * .github/workflows/mcp-bootstrap.yml on every push/PR, across OS and architecture. Not part of
 * the real bootstrap chain and not referenced by any .mcp.json/.codex/.gemini/.cursor config --
 * this only exists to answer one question per platform: does `node scripts/mcp_bootstrap.js` --
 * the exact command every MCP config points at -- actually run `npm ci` + `npm run build`
 * and reach a running server here?
 *
 * Deliberately not a protocol test -- no MCP client, no fake tool calls, no docker. It spawns the
 * real bootstrap chain with a stdin pipe left open (never written to, never closed), which is
 * indistinguishable from a real MCP client that has connected but hasn't sent anything yet: the
 * server should block reading it. If the process is still alive and waiting after the timeout,
 * bootstrap + npm ci/build + handoff to the real server all worked. If it
 * exits on its own before that -- crash, missing dependency, whatever -- that's a real failure,
 * and stdout/stderr are printed so the Actions log shows exactly what broke.
 */

const { spawn } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const TIMEOUT_MS = 180_000; // generous: first run also runs npm ci + npm run build (Puppeteer's Chromium download included)

const child = spawn('node', ['scripts/mcp_bootstrap.js'], {
  cwd: REPO_ROOT,
  // 'pipe' everywhere, not 'inherit' -- keeps these fds ours, not the CI step's own stdout, so
  // killing this process cleanly ends the step regardless of anything a descendant process
  // (npm ci/build, the real server) does with its own output.
  stdio: ['pipe', 'pipe', 'pipe'],
});
// child.stdin is intentionally never written to or closed -- see header.

let out = '';
let err = '';
child.stdout.on('data', (d) => { out += d; });
child.stderr.on('data', (d) => { err += d; });

let settled = false;
function finish(ok, reason) {
  if (settled) return;
  settled = true;
  if (!child.killed) child.kill();
  console.log(`--- stdout ---\n${out}`);
  console.log(`--- stderr ---\n${err}`);
  if (ok) {
    console.log(`OK: ${reason}`);
    process.exit(0);
  } else {
    console.error(`FAIL: ${reason}`);
    process.exit(1);
  }
}

child.on('error', (e) => finish(false, `failed to spawn: ${e.message}`));
child.on('exit', (code, signal) => {
  // Only unexpected if we didn't request it ourselves via finish()'s child.kill().
  if (!settled) {
    finish(
      false,
      `server process exited on its own (code=${code}, signal=${signal}) before the timeout -- ` +
        'it should still be running and blocked on stdio'
    );
  }
});

setTimeout(
  () => finish(true, `still running and blocked on stdio after ${TIMEOUT_MS}ms -- bootstrap and launch succeeded`),
  TIMEOUT_MS
);
