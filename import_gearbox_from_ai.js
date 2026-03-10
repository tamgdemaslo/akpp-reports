// Скрипт: импорт одной коробки из ответа ИИ в gearbox_data.yaml
//
// Использование:
//   node import_gearbox_from_ai.js path/to/ai_response.txt GEARBOX_KEY
//
// Пример:
//   node import_gearbox_from_ai.js data/ford_5r55s.txt 5R55S_5R55N_5R55W
//
// Скрипт:
// - читает ответ ИИ (чистый JSON, JSON в ```json```, либо текст с JSON внутри)
// - добавляет/обновляет блок под ключом GEARBOX_KEY в gearbox_data.yaml
// - автоматически запускает сборку бандла для сайта

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function sanitizeFileName(value) {
  return String(value)
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extractJsonObject(raw) {
  const fencedMatch = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const start = raw.indexOf('{');
  if (start === -1) {
    throw new Error('В ответе не найден JSON-объект');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return raw.slice(start, i + 1).trim();
      }
    }
  }

  throw new Error('Не удалось выделить завершённый JSON-объект из ответа');
}

function toGeneratedJsFile(key, obj) {
  const payload = JSON.stringify(obj, null, 2);
  return `// Автоматически сгенерировано import_gearbox_from_ai.js
window.allGearboxData = window.allGearboxData || {};

Object.assign(window.allGearboxData, {
  "${key}": ${payload}
});
`;
}

// Простая функция для конвертации JS-объекта в YAML-подобный текст
function toYamlBlock(key, obj, indent = '') {
  const lines = [];
  const baseIndent = indent;
  const childIndent = indent + '  ';

  lines.push(`${baseIndent}${key}:`);

  function writeValue(k, v, levelIndent) {
    const nextIndent = levelIndent + '  ';

    if (v === null || v === undefined) {
      return;
    }

    if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${levelIndent}${k}: []`);
        return;
      }
      lines.push(`${levelIndent}${k}:`);
      v.forEach((item) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          lines.push(`${nextIndent}- ${String(item)}`);
        } else if (typeof item === 'object' && item !== null) {
          // Для массивов объектов — сворачиваем в inline JSON
          lines.push(`${nextIndent}- ${JSON.stringify(item)}`);
        }
      });
    } else if (typeof v === 'object') {
      const keys = Object.keys(v);
      if (keys.length === 0) {
        lines.push(`${levelIndent}${k}: {}`);
        return;
      }
      lines.push(`${levelIndent}${k}:`);
      keys.forEach((childKey) => {
        writeValue(childKey, v[childKey], nextIndent);
      });
    } else if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed.includes('\n')) {
        // Многострочные строки — как YAML block scalar
        lines.push(`${levelIndent}${k}: |`);
        trimmed.split('\n').forEach((line) => {
          lines.push(`${nextIndent}${line}`);
        });
      } else {
        // Однострочные строки — безопасно экранируем кавычки
        const safe = trimmed.replace(/"/g, '\\"');
        lines.push(`${levelIndent}${k}: "${safe}"`);
      }
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      lines.push(`${levelIndent}${k}: ${String(v)}`);
    }
  }

  Object.keys(obj).forEach((k) => {
    writeValue(k, obj[k], childIndent);
  });

  return lines.join('\n') + '\n';
}

function main() {
  const projectRoot = __dirname;
  const yamlPath = path.join(projectRoot, 'gearbox_data.yaml');
  const bundleScriptPath = path.join(projectRoot, 'build_gearbox_bundle.js');
  const gearboxFilesDir = path.join(projectRoot, 'gearbox_files');

  const [,, inputPathArg, keyArg] = process.argv;
  if (!inputPathArg || !keyArg) {
    console.error('Использование: node import_gearbox_from_ai.js path/to/ai_response.txt GEARBOX_KEY');
    process.exit(1);
  }

  const inputPath = path.isAbsolute(inputPathArg)
    ? inputPathArg
    : path.join(projectRoot, inputPathArg);

  if (!fs.existsSync(inputPath)) {
    console.error('Файл ответа ИИ не найден:', inputPath);
    process.exit(1);
  }

  if (!fs.existsSync(yamlPath)) {
    console.error('gearbox_data.yaml не найден по пути:', yamlPath);
    process.exit(1);
  }

  if (!fs.existsSync(gearboxFilesDir)) {
    console.error('Папка gearbox_files не найдена по пути:', gearboxFilesDir);
    process.exit(1);
  }

  const inputRaw = fs.readFileSync(inputPath, 'utf8');
  let jsonRaw;
  try {
    jsonRaw = extractJsonObject(inputRaw);
  } catch (e) {
    console.error('Ошибка извлечения JSON:', e.message);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(jsonRaw);
  } catch (e) {
    console.error('Ошибка парсинга JSON:', e.message);
    process.exit(1);
  }

  const key = keyArg.trim();
  if (!key) {
    console.error('Пустой ключ GEARBOX_KEY');
    process.exit(1);
  }

  const yamlRaw = fs.readFileSync(yamlPath, 'utf8');

  // Ищем начало блока по ключу (например: "  5R55S_5R55N_5R55W:")
  const lines = yamlRaw.split('\n');
  const startRegex = new RegExp(`^\\s{2}${key}:\\s*$`);
  let startIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (startRegex.test(lines[i])) {
      startIndex = i;
      break;
    }
  }

  const newBlock = toYamlBlock(key, data, '  ');

  let newYaml;
  if (startIndex === -1) {
    // Блока ещё нет — просто добавляем в конец файла
    if (!yamlRaw.trimEnd().endsWith('\n')) {
      newYaml = yamlRaw.trimEnd() + '\n' + newBlock;
    } else {
      newYaml = yamlRaw + '\n' + newBlock;
    }
  } else {
    // Блок уже есть — вырезаем до следующего блока того же уровня (начинается с "  <что-то>:")
    let endIndex = lines.length;
    const nextKeyRegex = /^\s{2}[A-Za-z0-9_]+:/;
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (nextKeyRegex.test(lines[i])) {
        endIndex = i;
        break;
      }
    }
    const before = lines.slice(0, startIndex).join('\n');
    const after = lines.slice(endIndex).join('\n');
    newYaml = `${before}\n${newBlock}${after ? '\n' + after : ''}`;
  }

  fs.writeFileSync(yamlPath, newYaml, 'utf8');
  console.log(`Блок "${key}" успешно импортирован в gearbox_data.yaml`);

  const generatedFileName = `ZZ_AI_${sanitizeFileName(key)}.js`;
  const generatedFilePath = path.join(gearboxFilesDir, generatedFileName);
  fs.writeFileSync(generatedFilePath, toGeneratedJsFile(key, data), 'utf8');
  console.log(`Сгенерирован JS-файл для сайта: ${generatedFileName}`);

  if (fs.existsSync(bundleScriptPath)) {
    console.log('Запускаю сборку бандла для сайта...');
    const result = spawnSync(process.execPath, [bundleScriptPath], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    if (result.status !== 0) {
      console.error('Импорт выполнен, но сборка бандла завершилась с ошибкой.');
      process.exit(result.status || 1);
    }

    console.log('Бандл успешно пересобран. Изменения готовы для сайта.');
  } else {
    console.warn('build_gearbox_bundle.js не найден. Импорт выполнен без пересборки бандла.');
  }
}

if (require.main === module) {
  main();
}

