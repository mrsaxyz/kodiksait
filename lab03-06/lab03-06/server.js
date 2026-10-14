// ЛР4 и ЛР6: локальный Node.js API и раздача веб-страниц.
// Библиотеки только стандартные, npm install не требуется.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 8001);
const DB = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, 'projects.json');
const CORS = process.env.ENABLE_CORS === '1';
const types = { '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json' };

function send(res, code, value) {
  const body = JSON.stringify(value, null, 2);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
function readProjects() { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
function writeProjects(rows) { fs.writeFileSync(DB, JSON.stringify(rows, null, 2) + '\n'); }
function loadBody(req) {
  return new Promise((resolve, reject) => {
    let input = '';
    req.on('data', chunk => {
      input += chunk;
      if (input.length > 100000) reject(new Error('Слишком большой запрос'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(input || '{}')); }
      catch { reject(new Error('Неверный JSON')); }
    });
    req.on('error', reject);
  });
}
function valid(body) {
  return body && typeof body.name === 'string' && body.name.trim() &&
    typeof body.language === 'string' && body.language.trim();
}
function serveFile(res, pathname) {
  let relative = pathname === '/' ? '/lab06/index.html' : pathname;
  if (relative.endsWith('/')) relative += 'index.html';
  const full = path.resolve(__dirname, '.' + relative);
  if (!full.startsWith(__dirname + path.sep)) return send(res, 403, { error: 'Forbidden' });
  fs.readFile(full, (err, body) => {
    if (err) return send(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': (types[path.extname(full)] || 'text/plain') + '; charset=utf-8' });
    res.end(body);
  });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:' + PORT);
  const route = /^\/api\/projects(?:\/(\d+))?$/.exec(url.pathname);
  // ЛР5: по умолчанию заголовки CORS отсутствуют. Для демонстрации
  // исправления: ENABLE_CORS=1 node server.js
  if (CORS && req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (!route) {
    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'Маршрут не найден' });
    return serveFile(res, url.pathname);
  }
  const id = route[1] ? Number(route[1]) : null;
  try {
    const rows = readProjects();
    const item = id === null ? null : rows.find(row => row.id === id);
    if (req.method === 'GET' && id === null) {
      const q = (url.searchParams.get('search') || '').toLowerCase();
      return send(res, 200, rows.filter(row =>
        (row.name + ' ' + row.language).toLowerCase().includes(q)));
    }
    if (req.method === 'GET' && id !== null) {
      return item ? send(res, 200, item) : send(res, 404, { error: 'Проект не найден' });
    }
    if (req.method === 'POST' && id === null) {
      const body = await loadBody(req);
      if (!valid(body)) return send(res, 400, { error: 'Нужны поля name и language' });
      const project = { id: Math.max(0, ...rows.map(row => row.id)) + 1,
        name: body.name.trim(), language: body.language.trim(),
        description: String(body.description || ''), status: 'Новый' };
      rows.push(project); writeProjects(rows); return send(res, 201, project);
    }
    if (req.method === 'PUT' && id !== null) {
      if (!item) return send(res, 404, { error: 'Проект не найден' });
      const body = await loadBody(req);
      if (!valid(body)) return send(res, 400, { error: 'Нужны поля name и language' });
      Object.assign(item, { name: body.name.trim(), language: body.language.trim(),
        description: String(body.description || ''), status: 'Обновлён' });
      writeProjects(rows); return send(res, 200, item);
    }
    if (req.method === 'DELETE' && id !== null) {
      if (!item) return send(res, 404, { error: 'Проект не найден' });
      writeProjects(rows.filter(row => row.id !== id));
      res.writeHead(204); return res.end();
    }
    return send(res, 405, { error: 'Метод не поддерживается' });
  } catch (error) { return send(res, 500, { error: error.message }); }
});
server.listen(PORT, '127.0.0.1', () =>
  console.log('CodeSlicer учебное API: http://127.0.0.1:' + PORT));
