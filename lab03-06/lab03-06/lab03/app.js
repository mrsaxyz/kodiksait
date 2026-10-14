// ЛР3. Коллекция существует только в браузере (без запросов к серверу).
const projects = [
  { id: 1, name: 'CodeSlicer Core', language: 'Python',
    description: 'Анализ кода и построение графа зависимостей.' },
  { id: 2, name: 'Local Hub', language: 'JavaScript',
    description: 'Браузерный интерфейс анализа проектов.' },
  { id: 3, name: 'VS Code Cockpit', language: 'TypeScript',
    description: 'Расширение VS Code для review изменений.' }
];
const app = document.getElementById('app');
let nextId = 4;
let search = '';
function node(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}
function home() { location.hash = '#/'; render(); }
function render() {
  app.replaceChildren();
  const match = location.hash.match(/^#\/project\/(\d+)$/);
  if (match) return renderDetails(Number(match[1]));
  const title = node('h1', '', 'Мои проекты для анализа');
  const lead = node('p', 'lead', 'Динамические карточки, фильтрация, просмотр, добавление и удаление.');
  const controls = node('div', 'controls');
  const input = node('input');
  input.placeholder = 'Поиск по названию или языку';
  input.value = search;
  input.oninput = event => { search = event.target.value; render();
    const next = app.querySelector("input"); next.focus();
    next.setSelectionRange(search.length, search.length); };
  const add = node('button', '', '+ Дублировать первый проект');
  add.onclick = () => {
    const first = projects[0];
    projects.push({ ...first, id: nextId++, name: first.name + ' (копия)' });
    render();
  };
  const back = node('button', 'secondary', 'Главная');
  back.onclick = home;
  controls.append(input, add, back);
  const cards = node('div', 'cards');
  projects.filter(p => (p.name + ' ' + p.language).toLowerCase()
    .includes(search.toLowerCase())).forEach(project => {
    const card = node('article', 'card');
    card.append(node('span', 'lang', project.language),
      node('h2', '', project.name), node('p', '', project.description));
    const actions = node('div', 'actions');
    const details = node('button', '', 'Подробнее');
    details.onclick = () => { location.hash = '#/project/' + project.id; };
    const remove = node('button', 'danger', 'Удалить');
    remove.onclick = () => {
      const i = projects.findIndex(p => p.id === project.id);
      if (i >= 0) projects.splice(i, 1);
      render();
    };
    actions.append(details, remove); card.append(actions); cards.append(card);
  });
  app.append(title, lead, controls, cards);
}
function renderDetails(id) {
  const project = projects.find(p => p.id === id);
  const title = node('h1', '', project ? project.name : 'Проект не найден');
  const panel = node('section', 'panel');
  if (project) panel.append(node('p', '', 'Язык: ' + project.language),
    node('p', '', project.description), node('p', '', 'ID: ' + project.id));
  const btn = node('button', '', '← На главную');
  btn.onclick = home; panel.append(btn);
  app.append(title, panel);
}
document.getElementById('header-home').onclick = home;
window.addEventListener('hashchange', render);
render();
