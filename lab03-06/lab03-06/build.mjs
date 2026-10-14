// Простой учебный bundler без внешних зависимостей.
// Объединяет два JavaScript-файла в один исполняемый bundle.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const files = ['lab06/src/api.js', 'lab06/src/app.js'];
const result = '(function () {\n"use strict";\n' + files.map(file =>
  '// Source: ' + file + '\n' + readFileSync(join(root, file), 'utf8')
).join('\n') + '\n})();\n';
mkdirSync(join(root, 'lab06/dist'), { recursive: true });
writeFileSync(join(root, 'lab06/dist/bundle.js'), result);
console.log('Сборка завершена: lab06/dist/bundle.js');
