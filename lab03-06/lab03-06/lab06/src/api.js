// Первая часть bundle: Promise-based работа с HTTP API.
const api = {
  async request(path = '', options = {}) {
    const response = await fetch('/api/projects' + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.status === 204 ? null : await response.json();
  },
  list(query = '') { return this.request('?search=' + encodeURIComponent(query)); },
  one(id) { return this.request('/' + id); },
  save(project) {
    const update = Boolean(project.id);
    return this.request(update ? '/' + project.id : '', {
      method: update ? 'PUT' : 'POST',
      body: JSON.stringify(project)
    });
  },
  remove(id) { return this.request('/' + id, { method: 'DELETE' }); }
};
