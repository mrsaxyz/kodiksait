// Изолированные проверки API: базовый projects.json не изменяется.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, copyFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const net = require('node:net');

const projectRoot = path.resolve(__dirname, '..');
const testDir = mkdtempSync(path.join(tmpdir(), 'codeslicer-lab04-'));
const dbPath = path.join(testDir, 'projects.json');
copyFileSync(path.join(projectRoot, 'projects.json'), dbPath);
let child, base;

function findPort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port;
      socket.close(() => resolve(port));
    });
    socket.on('error', reject);
  });
}

before(async () => {
  const port = await findPort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error('Не удалось запустить сервер');
    try {
      const response = await fetch(`${base}/api/projects`);
      if (response.ok) return;
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Сервер не готов');
});

after(() => { child?.kill(); rmSync(testDir, { recursive: true, force: true }); });

test('GET список и фильтрация', async () => {
  const result = await fetch(`${base}/api/projects?search=Python`);
  assert.equal(result.status, 200);
  const data = await result.json();
  assert.ok(data.length >= 1);
  assert.ok(data.every(row => (row.name + ' ' + row.language).toLowerCase().includes('python')));
});

test('POST → GET by ID → PUT → DELETE', async () => {
  const post = await fetch(`${base}/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test project', language: 'Go' }) });
  assert.equal(post.status, 201);
  const created = await post.json();
  assert.ok(Number.isInteger(created.id));
  const one = await fetch(`${base}/api/projects/${created.id}`);
  assert.equal(one.status, 200);
  assert.equal((await one.json()).name, 'Test project');
  const put = await fetch(`${base}/api/projects/${created.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Updated test project', language: 'TypeScript' }) });
  assert.equal(put.status, 200);
  assert.equal((await put.json()).language, 'TypeScript');
  const del = await fetch(`${base}/api/projects/${created.id}`, { method: 'DELETE' });
  assert.equal(del.status, 204);
  assert.equal((await fetch(`${base}/api/projects/${created.id}`)).status, 404);
});

test('POST без обязательных полей возвращает 400', async () => {
  const response = await fetch(`${base}/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 400);
});
