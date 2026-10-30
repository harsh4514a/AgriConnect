import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiDirectory = resolve(workspaceRoot, 'apps/api');
const webDirectory = resolve(workspaceRoot, 'apps/web');
const apiPort = Number(process.env.PORT ?? 3001);
const webPort = Number(process.env.WEB_PORT ?? 3000);
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || `http://localhost:${apiPort}`;

for (const [name, port] of [
  ['PORT', apiPort],
  ['WEB_PORT', webPort],
]) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`${name} must be a valid TCP port number.`);
    process.exit(1);
  }
}

if (apiPort === webPort) {
  console.error('PORT and WEB_PORT must use different values.');
  process.exit(1);
}

const children = [];
const managedPorts = new Set();
let stopping = false;
let stopPromise;

function portIsOpen(port, timeoutMs = 800) {
  return new Promise((resolveResult) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const finish = (isOpen) => {
      socket.destroy();
      resolveResult(isOpen);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function isAgriConnectApi(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(1200),
    });
    const body = await response.json();

    return (
      (response.ok && body?.status === 'ok') ||
      (response.status === 503 && body?.message === 'Service is not ready')
    );
  } catch {
    return false;
  }
}

function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

async function waitForChildren(timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const directChildrenRunning = children.some((child) => !hasExited(child));
    const portsStillOpen = await Promise.all(
      [...managedPorts].map((port) => portIsOpen(port, 100)),
    );

    if (!directChildrenRunning && portsStillOpen.every((isOpen) => !isOpen)) return;
    await new Promise((resolveResult) => setTimeout(resolveResult, 100));
  }
}

function signalChildGroup(child, signal) {
  try {
    // The detached child group includes Nest/Next and their worker processes.
    process.kill(process.platform === 'win32' ? child.pid : -child.pid, signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') {
      console.error(`Could not signal ${child.pid}'s process group: ${error.message}`);
    }
  }

  if (!hasExited(child)) {
    try {
      child.kill(signal);
    } catch (error) {
      if (error?.code !== 'ESRCH') {
        console.error(`Could not signal dev process ${child.pid}: ${error.message}`);
      }
    }
  }
}

function stopDevelopmentServers(exitCode = 0) {
  if (stopPromise) return stopPromise;

  stopping = true;
  process.exitCode = exitCode;
  stopPromise = (async () => {
    console.log('\nStopping AgriConnect development servers...');
    children.forEach((child) => signalChildGroup(child, 'SIGTERM'));
    await waitForChildren(2500);

    children.forEach((child) => signalChildGroup(child, 'SIGKILL'));
    await waitForChildren(500);

    const portsStillOpen = await Promise.all(
      [...managedPorts].map((port) => portIsOpen(port, 100)),
    );
    if (children.some((child) => !hasExited(child)) || portsStillOpen.some(Boolean)) {
      console.error('A dev process did not close after SIGKILL; inspect its process group.');
    }

    process.exit(exitCode);
  })();

  return stopPromise;
}

function launch(name, executable, args, cwd, env) {
  console.log(`Starting ${name}...`);
  const child = spawn(process.execPath, [executable, ...args], {
    cwd,
    env,
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });

  children.push(child);
  child.once('error', (error) => {
    console.error(`${name} failed to start: ${error.message}`);
    void stopDevelopmentServers(1);
  });
  child.once('exit', (code, signal) => {
    if (stopping) return;
    const result = signal ? `signal ${signal}` : `exit code ${code ?? 1}`;
    console.error(`${name} stopped unexpectedly (${result}).`);
    void stopDevelopmentServers(code === 0 ? 0 : 1);
  });

  return child;
}

process.on('SIGINT', () => void stopDevelopmentServers(130));
process.on('SIGTERM', () => void stopDevelopmentServers(143));

const apiAlreadyRunning = await portIsOpen(apiPort);
if (apiAlreadyRunning && !(await isAgriConnectApi(apiPort))) {
  console.error(
    `Port ${apiPort} is already in use by another service. Stop that service, then run pnpm dev again.`,
  );
  process.exit(1);
}

if (await portIsOpen(webPort)) {
  console.error(`Port ${webPort} is already in use. Stop that service or set WEB_PORT, then retry.`);
  process.exit(1);
}

if (apiAlreadyRunning) {
  console.log(`Reusing the AgriConnect API already listening on port ${apiPort}.`);
} else {
  managedPorts.add(apiPort);
  launch(
    'API',
    resolve(apiDirectory, 'node_modules/@nestjs/cli/bin/nest.js'),
    ['start', '--watch'],
    apiDirectory,
    { ...process.env, PORT: String(apiPort) },
  );
}

managedPorts.add(webPort);
launch(
  'Web',
  resolve(webDirectory, 'node_modules/next/dist/bin/next'),
  ['dev', '--port', String(webPort)],
  webDirectory,
  { ...process.env, NEXT_PUBLIC_API_URL: apiUrl },
);
