#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * Скрипт заполнения незаполненных записей АКПП через OpenAI API.
 * Запуск: OPENAI_API_KEY=sk-... node fill_unfilled_gearboxes.js [--dry-run] [--limit N] [--concurrency N]
 *
 * Переменные окружения:
 *   OPENAI_API_KEY — ключ API OpenAI (обязательно)
 *   OPENAI_MODEL   — модель (по умолчанию: gpt-5.4-2026-03-05; можно указать другую версию и т.п.)
 *
 * Файлы с синтаксическими ошибками в .js (например дубли ключей без запятой) пропускаются.
 *
 * Флаги:
 *   --dry-run      — только показать список незаполненных, не вызывать API и не записывать файлы
 *   --limit N      — обработать не более N файлов (для теста)
 *   --concurrency N — число параллельных запросов к API (по умолчанию 5)
 */

const fs = require('fs');
const path = require('path');
const fetch = typeof globalThis.fetch === 'function' ? globalThis.fetch : require('node-fetch');

const GEARBOX_DIR = path.join(__dirname, 'gearbox_files');
const EXCLUDE_FILES = new Set([
  'gearbox_index.js',
  'mistakes.js',
  'nuances.js',
  'parts_list.js',
  'tools.js',
  'TEMPLATE_NEW_GEARBOX.js',
]);

// Шаблон структуры для подсказки модели
const DATA_TEMPLATE = `
// ШАБЛОН СТРУКТУРЫ ДАННЫХ ДЛЯ АКПП
{
  "manufacturer": "Производитель (ZF, Aisin, Mercedes и т.д.)",
  "gearbox": "Название АКПП",
  "summary": "Краткое описание | Слив: X л | Моменты: поддон X Н·м, пробки X/X Н·м | Масло: название | Проверка уровня: X–X °C",
  "fluid": "Тип масла (основной)",
  "drain_volume": 4.8,
  "fluid_type": "Тип масла",
  "fluid_spec": "Спецификация (допуск)",
  "fill_range_celsius": "30-50",
  "work_temp_celsius": "50",
  "dry_capacity": "≈8,8 л (полный объем)",
  "pan_torque_nm": 10,
  "drain_torque_nm": 12,
  "fill_torque_nm": 35,
  "service_interval": "60 000–80 000 км либо 6–8 лет",
  "tools": ["Инструмент 1", "Инструмент 2"],
  "parts_list": ["Запчасть 1", "Запчасть 2"],
  "oem_json": {
    "oem_fluid_1": "OEM код основного масла",
    "oem_fluid_1_price": 0,
    "oem_fluid_2": "",
    "oem_filter_internal": "OEM код внутреннего фильтра",
    "oem_filter_internal_price": 0,
    "oem_filter_internal_info": "Описание фильтра",
    "oem_filter_external": "",
    "oem_filter_external_price": 0,
    "oem_filter_external_info": "",
    "oem_gasket_1": "OEM код прокладки или интегрирован в поддон",
    "oem_gasket_1_price": 0,
    "oem_gasket_1_info": "Описание",
    "oem_gasket_2": "",
    "oem_gasket_2_price": 0,
    "oem_gasket_2_info": "",
    "oem_o_ring_1": "OEM код O-Ring",
    "oem_o_ring_1_price": 0,
    "oem_o_ring_1_info": "",
    "oem_o_ring_2": "",
    "oem_o_ring_2_price": 0,
    "oem_o_ring_2_info": "",
    "oem_drain_plug": "OEM код сливной пробки",
    "oem_drain_plug_price": 0,
    "oem_drain_plug_info": "",
    "oem_drain_plug_washer": "OEM код шайбы или не требуется",
    "oem_drain_plug_washer_price": 0,
    "oem_drain_plug_washer_info": "",
    "oem_bolt_1": "",
    "oem_bolt_1_price": 0,
    "oem_bolt_1_info": "",
    "oem_bolt_2": "",
    "oem_bolt_2_price": 0,
    "oem_bolt_2_info": ""
  },
  "procedure": "Подробная пошаговая процедура замены масла:\\n\\n1. Шаг первый...\\n2. Шаг второй...",
  "mistakes": ["Ошибка 1", "Ошибка 2"],
  "nuances": "Важные нюансы и особенности для данной АКПП:\\n\\n• Нюанс 1\\n• Нюанс 2",
  "procedure_id": "КЛЮЧ_АКПП"
}
`;

/**
 * Загружает данные АКПП из .js файла (выполняет в песочнице с window и Object).
 */
function loadGearboxDataFromFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const window = { allGearboxData: {} };
  try {
    const fn = new Function('window', 'Object', code + '; return window.allGearboxData;');
    const data = fn(window, Object);
    return data && typeof data === 'object' ? data : null;
  } catch (e) {
    console.error('  Ошибка загрузки', filePath + ':', e.message);
    return null;
  }
}

/**
 * Проверяет, пустой ли oem_json (все строковые поля пустые или нулевые цены).
 */
function isOemJsonEmpty(oem) {
  if (!oem || typeof oem !== 'object') return true;
  const strKeys = Object.keys(oem).filter(k => typeof oem[k] === 'string' && !k.endsWith('_price'));
  return strKeys.every(k => !oem[k] || String(oem[k]).trim() === '');
}

/**
 * Определяет, считается ли запись АКПП незаполненной (нет процедуры, oem_json, parts_list, mistakes, nuances).
 */
function isUnfilled(record) {
  if (!record || !record.gearbox) return false;
  const hasProcedure = record.procedure && String(record.procedure).length >= 250;
  const hasOem = record.oem_json && !isOemJsonEmpty(record.oem_json);
  const hasParts = record.parts_list && Array.isArray(record.parts_list) && record.parts_list.length > 0;
  const hasMistakes = record.mistakes && Array.isArray(record.mistakes) && record.mistakes.length > 0;
  const hasNuances = record.nuances && String(record.nuances).length >= 80;
  return !hasProcedure || !hasOem || !hasParts || !hasMistakes || !hasNuances;
}

/**
 * Собирает список .js файлов АКПП (из директории, без исключённых).
 */
function getGearboxFileList() {
  const files = fs.readdirSync(GEARBOX_DIR).filter(f => f.endsWith('.js') && !EXCLUDE_FILES.has(f));
  return files.sort();
}

/**
 * Вызов OpenAI API (Chat Completions) для генерации недостающих полей.
 */
async function callOpenAI(apiKey, model, existingRecord, missingFields) {
  const systemPrompt = `Ты — эксперт по обслуживанию АКПП. Заполняй только недостающие поля для записи АКПП в формате JSON.
Правила:
- Не представляй сгенерированную информацию как факт; для непроверенных данных помечай [Вывод] или [Не проверено].
- Если не можешь подтвердить — пиши "Я не могу это подтвердить" или оставляй поле пустым/общим.
- Выдавай только валидный JSON с полями: ${missingFields.join(', ')}.
- procedure — многострочный текст, в JSON используй \\n для переносов.
- oem_json — объект со всеми ключами из шаблона (oem_fluid_1, oem_filter_internal, oem_gasket_1, oem_drain_plug и т.д.), пустые строки "" где нет данных.
- mistakes — массив строк (3–7 пунктов).
- parts_list — массив строк (4–8 пунктов).
- nuances — строка с буллетами через \\n.`;

  const userContent = `Шаблон структуры:
${DATA_TEMPLATE}

Текущие данные АКПП (уже заполненные поля):
${JSON.stringify(existingRecord, null, 2)}

Сгенерируй только недостающие поля в формате JSON (без комментариев, без markdown-блоков): ${missingFields.join(', ')}.`;

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Пустой ответ OpenAI');

  // Убрать markdown-обёртку ```json ... ```
  let raw = content.trim();
  const m = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (m) raw = m[1].trim();
  return JSON.parse(raw);
}

/**
 * Определяет, какие поля отсутствуют или пустые.
 */
function getMissingFields(record) {
  const missing = [];
  if (!record.procedure || String(record.procedure).length < 250) missing.push('procedure');
  if (!record.oem_json || isOemJsonEmpty(record.oem_json)) missing.push('oem_json');
  if (!record.parts_list || !Array.isArray(record.parts_list) || record.parts_list.length === 0) missing.push('parts_list');
  if (!record.mistakes || !Array.isArray(record.mistakes) || record.mistakes.length === 0) missing.push('mistakes');
  if (!record.nuances || String(record.nuances).length < 80) missing.push('nuances');
  return missing;
}

/**
 * Глубокое слияние сгенерированных полей в существующую запись (без перезаписи уже заполненного).
 */
function mergeGenerated(record, generated) {
  const out = { ...record };
  if (generated.procedure) out.procedure = generated.procedure;
  if (generated.oem_json && typeof generated.oem_json === 'object') {
    out.oem_json = { ...(out.oem_json || {}), ...generated.oem_json };
  }
  if (generated.parts_list && Array.isArray(generated.parts_list)) out.parts_list = generated.parts_list;
  if (generated.mistakes && Array.isArray(generated.mistakes)) out.mistakes = generated.mistakes;
  if (generated.nuances) out.nuances = generated.nuances;
  return out;
}

/**
 * Формирует содержимое .js файла для одной записи (один ключ).
 */
function toJsFileContent(gearboxKey, record) {
  const comment = (record.gearbox && record.gearbox.split(',')[0]) || gearboxKey;
  const obj = { [gearboxKey]: record };
  const jsonStr = JSON.stringify(obj, null, 2);
  return `// Данные о трансмиссии: ${comment}
window.allGearboxData = window.allGearboxData || {};
Object.assign(window.allGearboxData, ${jsonStr});
`;
}

/**
 * Обрабатывает один файл: загрузка, проверка, при необходимости — запрос к API и запись.
 */
async function processFile(fileName, apiKey, model, concurrencySlot, dryRun) {
  const filePath = path.join(GEARBOX_DIR, fileName);
  const data = loadGearboxDataFromFile(filePath);
  if (!data) return { fileName, status: 'skip', reason: 'не удалось загрузить' };

  const keys = Object.keys(data);
  const unfilled = keys.filter(k => isUnfilled(data[k]));
  if (unfilled.length === 0) return { fileName, status: 'ok', reason: 'уже заполнен' };

  if (dryRun) return { fileName, status: 'unfilled', keys: unfilled };

  for (const key of unfilled) {
    const record = data[key];
    const missing = getMissingFields(record);
    if (missing.length === 0) continue;
    try {
      const generated = await callOpenAI(apiKey, model, record, missing);
      Object.assign(data[key], mergeGenerated(record, generated));
      await new Promise(r => setTimeout(r, 200)); // небольшая пауза между запросами для одного файла
    } catch (e) {
      console.error(`  [${fileName}] ${key}: ${e.message}`);
      return { fileName, status: 'error', error: e.message };
    }
  }

  const singleKey = keys.length === 1 ? keys[0] : null;
  if (singleKey) {
    const content = toJsFileContent(singleKey, data[singleKey]);
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    const lines = [
      '// Данные о трансмиссии: несколько моделей',
      'window.allGearboxData = window.allGearboxData || {};',
      'Object.assign(window.allGearboxData, ' + JSON.stringify(data, null, 2) + ');',
    ];
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }
  return { fileName, status: 'written', keys: unfilled };
}

/**
 * Выполняет задачи с ограничением параллелизма.
 */
async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      if (i >= tasks.length) break;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : null;
  const concIdx = args.indexOf('--concurrency');
  const concurrency = concIdx >= 0 && args[concIdx + 1] ? parseInt(args[concIdx + 1], 10) : 5;

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-5.4-2026-03-05';

  if (!apiKey && !dryRun) {
    console.error('Укажите OPENAI_API_KEY в окружении или запустите с --dry-run.');
    process.exit(1);
  }

  const files = getGearboxFileList();
  const toProcess = limit ? files.slice(0, limit) : files;
  console.log(`Файлов к проверке: ${toProcess.length} (concurrency: ${concurrency})${dryRun ? ' [dry-run]' : ''}\n`);

  const tasks = toProcess.map((fileName, i) => () =>
    processFile(fileName, apiKey, model, i % concurrency, dryRun)
  );
  const results = await runWithConcurrency(tasks, concurrency);

  const unfilledList = results.filter(r => r.status === 'unfilled' || r.status === 'written');
  const errors = results.filter(r => r.status === 'error');
  const written = results.filter(r => r.status === 'written');

  if (unfilledList.length) {
    console.log('\nНезаполненные или обновлённые:');
    unfilledList.forEach(r => {
      console.log(`  ${r.fileName}${r.keys ? ' — ключи: ' + r.keys.join(', ') : ''} [${r.status}]`);
    });
  }
  if (errors.length) {
    console.log('\nОшибки:');
    errors.forEach(r => console.log(`  ${r.fileName}: ${r.error}`));
  }
  console.log(`\nГотово. Обработано: ${results.length}, записано: ${written.length}, ошибок: ${errors.length}.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
