/**
 * Поиск АКПП по VIN: api-cloud.ru + OpenAI.
 * Работает на Railway без отдельного Python backend.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = require('node-fetch');

const VIN_API_BASE = 'https://api-cloud.ru/api/vindecoder.php';
const OPENAI_MODEL = 'gpt-5.2';

/** OEM/альтернативные обозначения → код из нашего списка (для сопоставления) */
const OEM_ALIASES = {
  GA8P75H: '8HP75', GA8P75HZ: '8HP75', GA8P50H: '8HP50', GA8P45H: '8HP45',
  '8HP75': '8HP75', '8HP50': '8HP50', '8HP45': '8HP45', '8HP51': '8HP51', '8HP76': '8HP76', '8HP90': '8HP90',
  '09G': '09G', '09K': '09K', '02E': '02E', '0B5': '0B5', '722.9': '722.9', '722.6': '722.6',
};


function normalizeCode(s) {
  return String(s || '').replace(/[\s\-_\.\(\)]/g, '').toUpperCase();
}

/**
 * Собирает список строк для промта и карту кодов (код → { key, display }) для сопоставления
 */
function loadGearboxListAndMap() {
  const gearboxDir = path.join(__dirname, 'gearbox_files');
  const files = fs.readdirSync(gearboxDir)
    .filter(f => f.endsWith('.js') && f !== 'gearbox_index.js' && f !== 'all_gearbox_bundle.js');
  const list = [];
  const codeToEntry = {}; // нормализованный код или алиас → { key, display }
  for (const file of files) {
    const content = fs.readFileSync(path.join(gearboxDir, file), 'utf8');
    const mKey = content.match(/КЛЮЧ:\s*([A-Za-z0-9_]+)/) || content.match(/"([A-Za-z0-9_]+)"\s*:\s*\{/);
    const key = mKey ? mKey[1] : null;
    const mManu = content.match(/"manufacturer":\s*"([^"]+)"/);
    const mGear = content.match(/"gearbox":\s*"([^"]+)"/);
    const mAnalogs = content.match(/"analogs":\s*\[([^\]]*)\]/);
    if (mManu && mGear) {
      const manu = mManu[1];
      const gearStr = mGear[1];
      let line = `${manu} ${gearStr}`;
      if (mAnalogs && mAnalogs[1].trim()) {
        const analogs = mAnalogs[1].match(/"([^"]+)"/g);
        if (analogs && analogs.length) line += ` (аналоги: ${analogs.slice(0, 3).map(a => a.replace(/"/g, '')).join(', ')})`;
      }
      list.push(line);
      if (key) {
        const codes = gearStr.split(/[\s,]+/).map(c => c.trim()).filter(Boolean);
        for (const code of codes) {
          const norm = normalizeCode(code);
          const display = `${manu} ${code}`;
          if (!codeToEntry[norm]) codeToEntry[norm] = { key, display };
          codeToEntry[norm] = { key, display };
        }
        for (const a of (mAnalogs && mAnalogs[1].match(/"([^"]+)"/g) || []).map(x => x.replace(/"/g, ''))) {
          const norm = normalizeCode(a);
          if (!codeToEntry[norm]) codeToEntry[norm] = { key, display: `${manu} ${codes[0] || a}` };
        }
      }
    }
  }
  return { list: list.slice(0, 350), codeToEntry };
}

/** Для обратной совместимости */
function loadGearboxList() {
  const { list } = loadGearboxListAndMap();
  return list;
}

/**
 * Запрос к api-cloud.ru по VIN
 */
async function fetchVinFromApiCloud(vin, token, useHeader = false) {
  const url = new URL(VIN_API_BASE);
  url.searchParams.set('type', 'vin');
  url.searchParams.set('vin', String(vin).trim().toUpperCase());
  if (!useHeader) url.searchParams.set('token', token);

  const options = {
    method: 'GET',
    headers: { Accept: 'application/json' },
    timeout: 120000,
  };
  if (useHeader) options.headers['Token'] = token;

  const res = await fetch(url.toString(), options);
  const raw = await res.json();

  if (raw.error) {
    throw new Error(`API VIN ${raw.error}: ${raw.message || ''}`);
  }
  return raw;
}

function get(obj, key) {
  if (obj[key] !== undefined) return obj[key];
  const k = Object.keys(obj).find(x => x.toLowerCase() === key.toLowerCase());
  return k ? obj[k] : undefined;
}

/**
 * Преобразует reports из api-cloud.ru в формат для промта (manuName, modelName, ...)
 */
function transformReportsToGearboxFormat(reports, vinInfo) {
  if (!reports || !reports.length) {
    return {
      manuName: '', modelName: '', typeName: '', secondaryTypes: '',
      cylinderCapacityLiter: '', fuelType: '', powerKwFrom: '', powerKwTo: '',
      powerHpFrom: '', powerHpTo: '', yearOfConstrFrom: '', yearOfConstrTo: '',
      gearFromApi: '', drive: '', vin: vinInfo?.income || vinInfo?.normal || '',
    };
  }
  const r = reports[0];
  const modelYear = get(r, 'modelYear') || get(r, 'startYear') || get(r, 'finishYear');
  const yearFrom = get(r, 'startYear') || (modelYear ? String(modelYear) + '01' : '');
  const yearTo = get(r, 'finishYear') || (modelYear ? String(modelYear) + '12' : '');

  function toYyyymm(val) {
    if (val == null || val === '') return '';
    const s = String(val).trim();
    if (s.length === 4 && /^\d+$/.test(s)) return s + '01';
    if (s.length >= 6) return s.slice(0, 6);
    return s;
  }

  let powerKw = '', powerHp = '';
  const ep = get(r, 'enginePower');
  if (ep != null) {
    const p = parseFloat(ep);
    if (!isNaN(p)) {
      if (p < 500) {
        powerKw = String(Math.round(p));
        powerHp = String(Math.round(p * 1.36));
      } else {
        powerHp = String(Math.round(p));
        powerKw = String(Math.round(p / 1.36));
      }
    } else {
      powerKw = powerHp = String(ep);
    }
  }

  let cylinderCapacityLiter = '';
  const vol = get(r, 'engineVolume');
  if (vol != null) {
    const v = parseFloat(vol);
    cylinderCapacityLiter = isNaN(v) ? String(vol) : String(Math.round(v * 10) / 10);
  }

  return {
    manuName: get(r, 'brand') || '',
    modelName: get(r, 'model') || '',
    typeName: get(r, 'modification') || '',
    secondaryTypes: get(r, 'bodyName') || get(r, 'body') || '',
    cylinderCapacityLiter,
    fuelType: get(r, 'fuelType') || '',
    powerKwFrom: powerKw,
    powerKwTo: powerKw,
    powerHpFrom: powerHp,
    powerHpTo: powerHp,
    yearOfConstrFrom: toYyyymm(yearFrom),
    yearOfConstrTo: toYyyymm(yearTo),
    gearFromApi: get(r, 'gear') || '', // подсказка из API: "8-speed automatic" и т.п.
    drive: get(r, 'drive') || '',
    vin: vinInfo?.income || vinInfo?.normal || '',
  };
}

/**
 * vin_data для фронта (make, model, year, fingerprint)
 */
function buildVinDataForFrontend(raw) {
  const reports = raw.reports || [];
  const vinInfo = raw.vin || {};
  const result = {
    make: '', model: '', year: '', vin: vinInfo.income || vinInfo.normal || '',
    found: !!raw.found,
    countReports: raw.countReports || 0,
    fingerprint: '',
  };
  if (reports.length) {
    const r = reports[0];
    result.make = get(r, 'brand') || '';
    result.model = get(r, 'model') || '';
    const my = get(r, 'modelYear') || get(r, 'startYear') || get(r, 'finishYear');
    result.year = my != null ? String(my) : '';
    result.modification = get(r, 'modification') || '';
    result.gear = get(r, 'gear') || '';
    result.drive = get(r, 'drive') || '';
    result.fuelType = get(r, 'fuelType') || '';
    result.engineVolume = get(r, 'engineVolume') || '';
    result.fingerprint = [
      result.make, result.model, result.modification,
      get(r, 'engineVolume'), get(r, 'enginePower'), result.fuelType,
      get(r, 'startYear'), get(r, 'finishYear'),
    ].join(';');
  }
  return result;
}

/**
 * Промт для OpenAI: только определить АКПП по данным авто (без списка).
 * Сопоставление со списком делаем потом в коде.
 */
function buildPrompt(transformed) {
  const inputStr = JSON.stringify(transformed, null, 2);

  return `По данным автомобиля из VIN определи, какая автоматическая коробка передач на нём установлена.

Данные: марка (manuName), модель (modelName), год (yearOfConstrFrom/To), мотор (cylinderCapacityLiter, fuelType, powerHpFrom/To), подсказка из API (gearFromApi — например "8-speed automatic"). Используй свои знания: каталоги, спецификации, форумы. Назови конкретную модель/код АКПП как она известна — например BMW GA8P75H, ZF 8HP75, Mercedes 722.9, VW 09G. Не подбирай из какого-либо списка — просто определи по данным и знаниям.

Ответь строго в формате (только эти 2 строки):
GEARBOX_CODE=<название или код АКПП>
STATUS=EXACT

Если не можешь определить — напиши STATUS=UNKNOWN и GEARBOX_CODE= пусто.

=== ДАННЫЕ АВТОМОБИЛЯ ===
${inputStr}
`;
}

/**
 * Вызов OpenAI
 */
async function callOpenAI(prompt, apiKey) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'Ты определяешь модель АКПП по данным автомобиля. Назови конкретную АКПП как она известна (например BMW GA8P75H, ZF 8HP75, 09G). Не подбирай из списка — просто определи по своим знаниям. Ответь только GEARBOX_CODE=<значение> и STATUS=EXACT или UNKNOWN.' },
      { role: 'user', content: prompt },
    ],
  });
  return completion.choices[0].message.content || '';
}

/**
 * Парсит ответ OpenAI (KEY=VALUE) в объект. Устойчив к пробелам, markdown, лишнему тексту.
 */
function parseOpenAIResponse(text) {
  const result = {};
  const raw = (text || '').trim();
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !result[key]) result[key] = value;
    }
  }
  if (!result.GEARBOX_CODE && raw) {
    const m = raw.match(/GEARBOX_CODE\s*[=:]\s*([^\s\n]+(?:\s+[^\s\n]+)?)/i);
    if (m) result.GEARBOX_CODE = m[1].trim().replace(/^["']|["']$/g, '');
  }
  if (!result.STATUS && raw) {
    const m = raw.match(/STATUS\s*[=:]\s*(\w+)/i);
    if (m) result.STATUS = m[1].trim();
  }
  return result;
}

let cachedGearbox = null; // { list, codeToEntry }

/**
 * Сопоставляет ответ OpenAI с нашим списком (включая синонимы: GA8P75H ↔ 8HP75).
 * Возвращает { matched: true, displayCode, key } или { matched: false, originalCode }.
 */
function matchGearboxToList(openaiCode, codeToEntry) {
  if (!openaiCode || !codeToEntry) return { matched: false, originalCode: openaiCode || '' };
  const raw = String(openaiCode).trim();
  const parts = raw.split(/\s+/);
  const codePart = parts.length > 1 ? parts[parts.length - 1] : raw;
  const norm = normalizeCode(codePart);
  const normFull = normalizeCode(raw);

  const tryFind = (c) => {
    const entry = codeToEntry[c];
    if (entry) return entry;
    const alias = OEM_ALIASES[c] || c;
    return codeToEntry[normalizeCode(alias)] || codeToEntry[alias];
  };

  let entry = tryFind(norm) || tryFind(normFull);
  if (!entry && norm.length >= 4) {
    for (const [oem, ourCode] of Object.entries(OEM_ALIASES)) {
      if (norm.includes(normalizeCode(oem)) || norm.includes(normalizeCode(ourCode))) {
        entry = codeToEntry[normalizeCode(ourCode)] || codeToEntry[ourCode];
        if (entry) break;
      }
    }
  }
  if (!entry) {
    for (const key of Object.keys(codeToEntry)) {
      if (key.includes(norm) || norm.includes(key)) {
        entry = codeToEntry[key];
        break;
      }
    }
  }
  if (entry) return { matched: true, displayCode: entry.display, key: entry.key };
  return { matched: false, originalCode: raw };
}

/**
 * Обработчик поиска по VIN: VIN → все данные → OpenAI → сопоставление со списком → ответ
 */
async function handleVinSearch(vin, lang = 'ru', env = process.env) {
  const token = env.VINDECODER_TOKEN;
  const openaiKey = env.OPENAI_API_KEY;

  if (!token) throw new Error('Не указан VINDECODER_TOKEN (токен api-cloud.ru)');
  if (!openaiKey) throw new Error('Не указан OPENAI_API_KEY');

  let raw;
  try {
    raw = await fetchVinFromApiCloud(vin, token, false);
  } catch (e) {
    if (/503|602|token/i.test(String(e.message))) {
      raw = await fetchVinFromApiCloud(vin, token, true);
    } else {
      throw e;
    }
  }

  if (!cachedGearbox) cachedGearbox = loadGearboxListAndMap();
  const { codeToEntry } = cachedGearbox;

  const transformed = transformReportsToGearboxFormat(raw.reports || [], raw.vin || {});
  const prompt = buildPrompt(transformed);
  const responseText = await callOpenAI(prompt, openaiKey);
  const parsed = parseOpenAIResponse(responseText);

  const openaiCode = parsed.GEARBOX_CODE || '';
  // Сначала ИИ определил АКПП — теперь сверяем со списком и ищем сходства
  const match = matchGearboxToList(openaiCode, codeToEntry);

  if (match.matched) {
    parsed.GEARBOX_CODE = match.displayCode;
    parsed.GEARBOX_KEY = match.key;
    parsed.IN_LIST = true;
  } else if (openaiCode) {
    parsed.GEARBOX_CODE = openaiCode;
    parsed.NOT_IN_LIST = true;
  }

  parsed.vin_data = buildVinDataForFrontend(raw);
  return parsed;
}

module.exports = {
  loadGearboxList,
  loadGearboxListAndMap,
  matchGearboxToList,
  fetchVinFromApiCloud,
  transformReportsToGearboxFormat,
  buildVinDataForFrontend,
  buildPrompt,
  callOpenAI,
  parseOpenAIResponse,
  handleVinSearch,
};
