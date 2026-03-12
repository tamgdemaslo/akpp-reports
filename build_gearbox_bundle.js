#!/usr/bin/env node
/**
 * Собирает один файл all_gearbox_bundle.js из всех gearbox_files/*.js.
 * Один запрос вместо 160+ — страница грузится быстрее.
 *
 * Запуск: node build_gearbox_bundle.js
 */

const fs = require('fs');
const path = require('path');

const GEARBOX_DIR = path.join(__dirname, 'gearbox_files');
const BUNDLE_FILE = path.join(GEARBOX_DIR, 'all_gearbox_bundle.js');
// Режим сборки только заглушек (ZZ_LIST_STUBS.js)
const ONLY_STUBS = true;
const EXCLUDE = new Set([
  'gearbox_index.js',
  'mistakes.js',
  'nuances.js',
  'parts_list.js',
  'tools.js',
  'TEMPLATE_NEW_GEARBOX.js',
  'all_gearbox_bundle.js',
]);

function loadGearboxDataFromFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const window = { allGearboxData: {} };
  try {
    const fn = new Function('window', 'Object', code + '; return window.allGearboxData;');
    const data = fn(window, Object);
    return data && typeof data === 'object' ? data : null;
  } catch (e) {
    return null;
  }
}

function buildBundle() {
  const files = ONLY_STUBS
    ? ['ZZ_LIST_STUBS.js']
    : fs.readdirSync(GEARBOX_DIR)
        .filter(f => f.endsWith('.js') && !EXCLUDE.has(f))
        .sort();

  const allData = {};
  const loadedFiles = [];

  for (const file of files) {
    const filePath = path.join(GEARBOX_DIR, file);
    const data = loadGearboxDataFromFile(filePath);
    if (data && typeof data === 'object') {
      Object.assign(allData, data);
      loadedFiles.push(file);
    }
  }

  const indexStr = JSON.stringify(loadedFiles, null, 2);
  const dataStr = JSON.stringify(allData, null, 0);

  const content =
    '// Единый бандл всех АКПП (сгенерировано build_gearbox_bundle.js)\n' +
    'window.gearboxIndex = ' + indexStr + ';\n' +
    'window.allGearboxData = window.allGearboxData || {};\n' +
    'Object.assign(window.allGearboxData, ' + dataStr + ');\n';

  fs.writeFileSync(BUNDLE_FILE, content, 'utf8');
  const size = (fs.statSync(BUNDLE_FILE).size / 1024 / 1024).toFixed(2);
  console.log('OK: ' + BUNDLE_FILE);
  console.log('  Файлов: ' + loadedFiles.length + ', ключей АКПП: ' + Object.keys(allData).length + ', размер: ' + size + ' MB');
}

buildBundle();
