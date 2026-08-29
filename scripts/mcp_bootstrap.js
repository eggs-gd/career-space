#!/usr/bin/env node
'use strict';
/*
 * Entry point for the `career-space` MCP server -- what every .mcp.json/.codex/config.toml/
 * .gemini/settings.json/.cursor/mcp.json points `command` at.
 *
 * Now that the whole scripts/ layer is TypeScript (compiled to scripts/dist/*.js), this is a
 * single layer, not two: `node` is already what every one of these MCP configs assumes (it's
 * also what `design-patterns`/`pyright` run through), so there's no separate "find a working
 * interpreter" step left to do -- this process already IS that interpreter. The only remaining
 * job: make sure `scripts/dist/mcp_server.js` actually exists and is importable (running
 * `npm ci` + `npm run build` first if not), then hand off to it.
 *
 * What this does NOT do: silently reinstall or rebuild on every connection -- the readiness
 * check below is a real one (an actual `require()`, not just a directory/file-existence check),
 * so a already-built `scripts/dist/` is a no-op fast path, same as every connection after the
 * first.
 */

const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_ENTRY = path.join(REPO_ROOT, 'scripts', 'dist', 'mcp_server.js');

function isReady() {
  if (!fs.existsSync(SERVER_ENTRY)) return false;
  // A real check, not just "the file exists" -- require() also confirms node_modules actually
  // has what mcp_server.js needs (the exact class of bug the old Python bootstrap's `_is_ready()`
  // was written to catch: a half-finished or stale install looking present but not working).
  try {
    require.resolve(SERVER_ENTRY);
    // require.resolve only proves the file resolves as a module, not that its own dependencies
    // (@modelcontextprotocol/sdk, puppeteer, ...) are actually installed -- node_modules itself
    // existing alongside a built dist/ is what we're actually confirming here.
    return fs.existsSync(path.join(REPO_ROOT, 'node_modules', '@modelcontextprotocol', 'sdk'));
  } catch {
    return false;
  }
}

function run(command, args) {
  // `npm`/`npx` on Windows are `.cmd` shims, not a directly-executable `.exe` -- `spawnSync`
  // without `shell: true` can't resolve them there and fails with ENOENT even though `npm`
  // genuinely is on PATH (a well-known Node-on-Windows gotcha, confirmed live via this repo's own
  // CI on windows-latest). `node` itself (the other thing this file spawns, below) is a real .exe
  // everywhere and doesn't need this -- only applied here, not blanket-enabled.
  //
  // Node's `shell: true` + a separate `args` array is itself deprecated (DEP0190, args are only
  // concatenated, not escaped) -- Node's own fix is to pass one pre-built command string instead,
  // which is fine here since `command`/`args` are always this file's own hardcoded literals
  // ('npm', 'install', 'run', 'build'), never anything from outside input.
  const isWindows = process.platform === 'win32';
  const result = isWindows
    ? spawnSync(`${command} ${args.join(' ')}`, { cwd: REPO_ROOT, stdio: 'inherit', shell: true })
    : spawnSync(command, args, { cwd: REPO_ROOT, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : `exit code ${result.status}`;
    throw new Error(`${command} ${args.join(' ')} failed: ${detail}`);
  }
}

function bootstrap() {
  console.error('career-space: first connection -- running `npm ci` and `npm run build` once (this is slow; every connection after this one is instant)...');
  // `npm ci`, not `npm install`: package-lock.json is committed, so this installs exactly what's
  // locked (deterministic, and faster) instead of npm's own dependency resolution potentially
  // landing on a slightly different tree across machines/times -- the whole point of an "iron-
  // clad" bootstrap. Falls back to a clear error (not a silent `npm install` retry) if the
  // lockfile and package.json are ever out of sync -- that's a real bug to fix, not paper over.
  run('npm', ['ci']);
  run('npm', ['run', 'build']);
}

function main() {
  if (!isReady()) {
    try {
      bootstrap();
    } catch (err) {
      console.error(`career-space: setup failed -- ${err.message}`);
      console.error('Fix the underlying error above, then reconnect. Manual alternative: run `npm install && npm run build` yourself in this repo -- see README.md.');
      process.exit(1);
    }
  }

  const child = spawn('node', [SERVER_ENTRY], { stdio: 'inherit', cwd: REPO_ROOT });
  child.on('error', (err) => {
    console.error(`career-space: failed to launch the server: ${err.message}`);
    process.exit(1);
  });
  child.on('exit', (code, signal) => {
    process.exit(code === null ? (signal ? 1 : 0) : code);
  });
}

main();
