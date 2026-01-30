/**
 * Поиск АКПП по VIN: api-cloud.ru + OpenAI.
 * Работает на Railway без отдельного Python backend.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = require('node-fetch');

const VIN_API_BASE = 'https://api-cloud.ru/api/vindecoder.php';
const OPENAI_MODEL = 'gpt-4o-mini'; // или gpt-4o, gpt-4

/**
 * Собирает список кодов АКПП для промта из gearbox_files/*.js
 */
function loadGearboxList() {
  const gearboxDir = path.join(__dirname, 'gearbox_files');
  const files = fs.readdirSync(gearboxDir)
    .filter(f => f.endsWith('.js') && f !== 'gearbox_index.js' && f !== 'all_gearbox_bundle.js');
  const list = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(gearboxDir, file), 'utf8');
    const mManu = content.match(/"manufacturer":\s*"([^"]+)"/);
    const mGear = content.match(/"gearbox":\s*"([^"]+)"/);
    const mAnalogs = content.match(/"analogs":\s*\[([^\]]*)\]/);
    if (mManu && mGear) {
      let line = `${mManu[1]} ${mGear[1]}`;
      if (mAnalogs && mAnalogs[1].trim()) {
        const analogs = mAnalogs[1].match(/"([^"]+)"/g);
        if (analogs && analogs.length) line += ` (аналоги: ${analogs.slice(0, 3).map(a => a.replace(/"/g, '')).join(', ')})`;
      }
      list.push(line);
    }
  }
  return list.slice(0, 350);
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
 * Строит промт для OpenAI (как в gearbox_resolver)
 */
function buildPrompt(transformed, gearboxList) {
  const gearboxDbJson = (gearboxList || []).slice(0, 280).join('\n');
  const totalCodesCount = (gearboxList || []).length;
  const inputStr = JSON.stringify(transformed, null, 2);

  return `Ты — TransmissionCodeResolver. По марке, модели, году и мотору определи типичную АКПП и верни её код из базы.

ОБЯЗАТЕЛЬНО: Если во входе есть manuName, modelName и год (yearOfConstrFrom/To или по контексту) — определи типичную для этой модели АКПП и верни STATUS=EXACT с кодом из базы. НЕ возвращай UNKNOWN, если по марке/модели/году можно однозначно назвать типичную коробку (BMW 7er 2016 → ZF 8HP, VW Golf 1.6 → VW 09G и т.д.).

Используй поля из JSON: manuName (марка), modelName (модель), typeName/modification, cylinderCapacityLiter (объём), fuelType, powerHpFrom/To, powerKwFrom/To, yearOfConstrFrom/To (год производства). Поле gearFromApi — подсказка из VIN (например "8-speed automatic" → ищи ZF 8HP или аналог).

Типичные соответствия (используй знания + базу ниже):
- BMW 7er (G11/G12), 5er (F10), 3er (F30) с 2010-х — ZF 8HP (8HP45, 8HP50, 8HP75 и т.д. по мощности)
- BMW 7er 2016 — ZF 8HP50 или ZF 8HP75 (из базы)
- VW/Audi: Golf, Passat 1.6/1.4 TSI — VW 09G, 09K; 2.0 TDI — 02E, 0B5
- Mercedes C/E-класс — 722.9 (7G-Tronic), 722.6 (NAG1)
- Hyundai/Kia 2.0 — Aisin A6LF1, A6GF1; 1.6 — Aisin U841
- Ford 2.0/2.5 — 6F35, FNR5; GM — 6T30, 6T40, 6L50

Код выбирай ТОЛЬКО из GEARBOX_DATABASE ниже. Формат: "Производитель КОД" (например "ZF 8HP50", "VW 09G"). Если в базе несколько кодов одной семьи (ZF 8HP45, 8HP50, 8HP75) — выбери наиболее подходящий по году и классу авто, либо один из них с CONFIDENCE 0.85.

ФОРМАТ ВЫХОДА (все 7 строк):
1) STATUS=EXACT|AMBIGUOUS|UNKNOWN|INVALID_INPUT
2) GEARBOX_CODE=<код из базы или пусто>
3) STANDARD=<ZF|AISIN|JATCO|FORD|GM|VW|MB|BMW|HYUNDAI|OTHER|UNKNOWN>
4) CONFIDENCE=<0.70-1.00 для EXACT>
5) CANDIDATES=<пусто или кандидаты через |>
6) MISSING_KEYS=<пусто>
7) FINGERPRINT=<manuName;modelName;typeName;cylinderCapacityLiter;power;fuelType;yearFrom-yearTo>

=== GEARBOX_DATABASE ===
${gearboxDbJson}
(Выбирай ТОЛЬКО из этого списка. Всего ${totalCodesCount} кодов.)

=== ВХОД ===
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
      { role: 'system', content: 'Ты — TransmissionCodeResolver. По марке, модели, году и мотору определяешь типичную АКПП. Всегда старайся вернуть STATUS=EXACT с кодом из базы, если модель авто известна (BMW 7er → ZF 8HP, VW Golf → VW 09G и т.д.). Отвечай строго в формате KEY=VALUE, без другого текста.' },
      { role: 'user', content: prompt },
    ],
  });
  return completion.choices[0].message.content || '';
}

/**
 * Парсит ответ OpenAI (KEY=VALUE) в объект
 */
function parseOpenAIResponse(text) {
  const result = {};
  for (const line of (text || '').trim().split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      result[key] = value;
    }
  }
  return result;
}

let cachedGearboxList = null;

/**
 * Обработчик поиска по VIN: api-cloud → transform → prompt → OpenAI → response
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

  if (!cachedGearboxList) cachedGearboxList = loadGearboxList();

  const transformed = transformReportsToGearboxFormat(raw.reports || [], raw.vin || {});
  const prompt = buildPrompt(transformed, cachedGearboxList);
  const responseText = await callOpenAI(prompt, openaiKey);
  const parsed = parseOpenAIResponse(responseText);

  parsed.vin_data = buildVinDataForFrontend(raw);
  return parsed;
}

module.exports = {
  loadGearboxList,
  fetchVinFromApiCloud,
  transformReportsToGearboxFormat,
  buildVinDataForFrontend,
  buildPrompt,
  callOpenAI,
  parseOpenAIResponse,
  handleVinSearch,
};
