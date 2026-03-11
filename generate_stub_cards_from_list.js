const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const LIST_PATH = path.join(ROOT, 'список_всех_АКПП.txt');
const OUT_PATH = path.join(ROOT, 'gearbox_files', 'ZZ_LIST_STUBS.js');

function parseListFile(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let currentManufacturer = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('Производитель:')) {
      currentManufacturer = line.replace('Производитель:', '').trim();
      continue;
    }
    if (currentManufacturer && line.startsWith('Список АКПП:')) {
      const listPart = line.replace('Список АКПП:', '').trim();
      blocks.push({ manufacturer: currentManufacturer, list: listPart });
      currentManufacturer = null;
    }
  }

  return blocks;
}

function extractCodes(listString) {
  // Берём только «слова» с латиницей и цифрами, без кириллицы
  const cleaned = listString
    .replace(/[/|]/g, ' ')
    .replace(/[,:;()\u2013\u2014]/g, ' ');

  const rawTokens = cleaned.split(/\s+/);
  const codes = [];

  for (const token of rawTokens) {
    if (!token) continue;
    // Пропускаем, если есть кириллица
    if (/[А-Яа-яЁё]/.test(token)) continue;
    // Должны быть и буквы, и цифры
    if (!/[A-Za-z]/.test(token) || !/[0-9]/.test(token)) continue;

    // Убираем хвостовые точки и прочую пунктуацию
    const code = token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.]+$/g, '');
    if (!code) continue;

    codes.push(code);
  }

  return codes;
}

function makeKey(manufacturer, code) {
  const mfrPart = manufacturer.replace(/[^A-Za-z0-9]+/g, '').toUpperCase();
  const codePart = code.replace(/[^A-Za-z0-9.]+/g, '').toUpperCase();
  if (!mfrPart || !codePart) return null;
  return `${mfrPart}_${codePart}`;
}

function generateStubs(blocks) {
  const entries = [];
  const seenKeys = new Set();

  for (const { manufacturer, list } of blocks) {
    const codes = extractCodes(list);
    for (const code of codes) {
      const key = makeKey(manufacturer, code);
      if (!key) continue;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      entries.push({ key, manufacturer, code });
    }
  }

  return entries;
}

function buildOutput(entries) {
  const lines = [];
  lines.push('// Автоматически сгенерированные заглушки АКПП из списка производителей');
  lines.push('// Файл создан скриптом generate_stub_cards_from_list.js');
  lines.push('');
  lines.push('window.allGearboxData = window.allGearboxData || {};');
  lines.push('');
  lines.push('(function(){');
  lines.push('  const data = window.allGearboxData;');
  lines.push('');

  for (const { key, manufacturer, code } of entries) {
    lines.push(`  if (!data["${key}"]) {`);
    lines.push(`    data["${key}"] = {`);
    lines.push(`      gearbox: "${code}",`);
    lines.push(`      manufacturer: "${manufacturer}"`);
    lines.push('    };');
    lines.push('  }');
  }

  lines.push('})();');
  lines.push('');

  return lines.join('\n');
}

function main() {
  const txt = fs.readFileSync(LIST_PATH, 'utf8');
  const blocks = parseListFile(txt);
  const entries = generateStubs(blocks);
  const out = buildOutput(entries);
  fs.writeFileSync(OUT_PATH, out, 'utf8');
  console.log(`Generated ${entries.length} stub entries to ${OUT_PATH}`);
}

if (require.main === module) {
  main();
}

