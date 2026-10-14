// ЛР5. Намеренно используется XMLHttpRequest и отдельный порт API.
const API = 'http://127.0.0.1:8001/api/projects';
const $ = id => document.getElementById(id);
function request(path, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', API + path);
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300)
      callback(null, JSON.parse(xhr.responseText));
    else callback(new Error('HTTP ' + xhr.status));
  };
  xhr.onerror = () => callback(new Error('Запрос заблокирован: вероятен CORS или сервер недоступен'));
  xhr.send();
}
function message(text, type = '') {
  $('message').className = 'notice ' + type;
  $('message').textContent = text;
}
function loadProjects() {
  const query = encodeURIComponent($('search').value);
  request('?search=' + query, (error, rows) => {
    if (error) {
      $('list').replaceChildren();
      return message(error.message + '. Проверьте DevTools → Console/Network.', 'error');
    }
    message('Ответ сервера получен через XMLHttpRequest. Найдено проектов: ' + rows.length, 'good');
    $('list').replaceChildren(...rows.map(makeCard));
  });
}
function makeCard(project) {
  const card = document.createElement('article'); card.className = 'card';
  const lang = document.createElement('span'); lang.className = 'lang'; lang.textContent = project.language;
  const title = document.createElement('h2'); title.textContent = project.name;
  const description = document.createElement('p'); description.textContent = project.description;
  const actions = document.createElement('div'); actions.className = 'actions';
  const button = document.createElement('button'); button.textContent = 'Редактировать';
  button.onclick = () => editProject(project.id);
  actions.append(button); card.append(lang, title, description, actions);
  return card;
}
function showEditor(project, id = null) {
    $('editor').hidden = false;
    $('editor').replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = id ? 'Редактирование проекта #' + id : 'Добавление проекта';
    const form = document.createElement('div'); form.className = 'form';
    for (const field of ['name', 'language', 'description']) {
      const label = document.createElement('label'); label.textContent = field;
      const input = document.createElement('input'); input.value = project[field] || '';
      label.append(input); form.append(label);
    }
    const note = document.createElement('p');
    note.className = 'lead'; note.textContent = 'ЛР5: кнопки «Сохранить» ещё нет.';
    const home = document.createElement('button'); home.textContent = 'На главную';
    home.onclick = () => { $('editor').hidden = true; loadProjects(); };
    $('editor').append(heading, form, note, home);
    $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function editProject(id) {
  request('/' + id, (error, project) => {
    if (error) return message(error.message, 'error');
    showEditor(project, id);
  });
}
$('new').onclick = () => showEditor({ name: '', language: '', description: '' });
$('find').onclick = loadProjects;
$('search').onkeydown = event => { if (event.key === 'Enter') loadProjects(); };
$('home').onclick = () => { $('editor').hidden = true; $('search').value = ''; loadProjects(); };
loadProjects();
