#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const os = require('os');

const portArg = process.argv[2];
const port = Number.parseInt(portArg || '3000', 10);

if (!Number.isInteger(port) || port <= 0) {
  console.error(`[kill-port] Invalid port: ${portArg || ''}`);
  process.exit(1);
}

function safeExec(command) {
  try {
    return execSync(command, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
  } catch {
    return '';
  }
}

function killPid(pid) {
  if (!pid) return false;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGKILL');
    }
    return true;
  } catch {
    return false;
  }
}

function collectWindowsPids() {
  let output = safeExec(
    `powershell -Command "Get-NetTCPConnection -State Listen -LocalPort ${port} | Select-Object -ExpandProperty OwningProcess"`,
  );
  if (!output.trim()) {
    output = safeExec(`netstat -ano | findstr :${port}`);
  }
  const matches = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      return parts[parts.length - 1];
    })
    .filter((value) => /^\d+$/.test(value));
  return Array.from(new Set(matches));
}

function collectPosixPids() {
  let output = safeExec(`lsof -ti tcp:${port}`);
  if (!output.trim()) {
    output = safeExec(`fuser ${port}/tcp`);
  }
  const matches = output
    .split(/\s+/)
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));
  return Array.from(new Set(matches));
}

const collectors = {
  win32: collectWindowsPids,
};

function collectPids() {
  const collector = collectors[process.platform];
  if (collector) {
    return collector();
  }
  return collectPosixPids();
}

const pids = collectPids();

if (pids.length === 0) {
  process.exit(0);
}

let killed = 0;
for (const pid of pids) {
  if (killPid(pid)) killed += 1;
}

if (killed > 0) {
  console.log(`[kill-port] Freed port ${port} (killed ${killed} process${killed > 1 ? 'es' : ''})`);
}
