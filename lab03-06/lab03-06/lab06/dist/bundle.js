(function () {
"use strict";
// Source: lab06/src/api.js
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

// Source: lab06/src/app.js
// Вторая часть bundle: отображение интерфейса и обработчики событий.
const $ = id => document.getElementById(id);
function make(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function info(text, isError = false) {
  $('message').textContent = text;
  $('message').className = 'notice ' + (isError ? 'error' : 'good');
}
async function loadProjects() {
  try {
    const rows = await api.list($('search').value);
    $('cards').replaceChildren(...rows.map(card));
    info('Данные загружены через fetch. Проектов: ' + rows.length);
  } catch (error) { info(error.message, true); }
}
function card(project) {
  const article = make('article', 'card');
  const actions = make('div', 'actions');
  const edit = make('button', '', 'Редактировать');
  edit.onclick = () => openEditor(project.id);
  const remove = make('button', 'danger', 'Удалить');
  remove.onclick = async () => {
    try { await api.remove(project.id); await loadProjects(); }
    catch (error) { info(error.message, true); }
  };
  actions.append(edit, remove);
  article.append(make('span', 'lang', project.language),
    make('h2', '', project.name), make('p', '', project.description), actions);
  return article;
}
async function openEditor(id = null) {
  try {
    const project = id ? await api.one(id) :
      { name: '', language: '', description: '' };
    $('editor').hidden = false;
    $('editor').replaceChildren();
    $('editor').append(make('h2', '', id ? 'Редактировать проект' : 'Новый проект'));
    const form = make('form', 'form');
    const fields = {};
    for (const key of ['name', 'language', 'description']) {
      const label = make('label', '', key);
      const input = make('input'); input.name = key; input.value = project[key];
      input.required = key !== 'description';
      fields[key] = input; label.append(input); form.append(label);
    }
    const save = make('button', '', 'Сохранить'); save.type = 'submit';
    const cancel = make('button', 'secondary', 'Отмена'); cancel.type = 'button';
    cancel.onclick = () => { $('editor').hidden = true; };
    form.append(save, cancel);
    form.onsubmit = async event => {
      event.preventDefault();
      const value = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value]));
      if (id) value.id = id;
      try {
        await api.save(value); $('editor').hidden = true;
        await loadProjects(); info('Проект сохранён через POST/PUT запрос.');
      } catch (error) { info(error.message, true); }
    };
    $('editor').append(form);
    $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { info(error.message, true); }
}
$('refresh').onclick = loadProjects;
$('new').onclick = () => openEditor();
$('search').oninput = loadProjects;
loadProjects();

})();
