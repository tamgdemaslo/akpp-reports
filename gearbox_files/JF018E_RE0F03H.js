// Данные о трансмиссии: JF018E
// Инициализируем глобальный объект если его нет
window.allGearboxData = window.allGearboxData || {};

// Добавляем данные о коробке передач
Object.assign(window.allGearboxData, {
  // КЛЮЧ: AKPP_JF018E_RE0F03H
  "AKPP_JF018E_RE0F03H": {

    // ========== ОСНОВНАЯ ИНФОРМАЦИЯ (из парсера) ==========
    "gearbox": "JF018E",
    "manufacturer": "Jatco",
    "description": "",
    "weak_points": "",
    "url": "",
    "cars": [],

    // ========== ОСНОВНАЯ ИНФОРМАЦИЯ ==========
    "analogs": [
      "RE0F03H",
      "RE0F02H"
    ],
    "summary": "JF018E | 5,2 л | 34 / 9 Н·м | NS-3 | 35–45 °C",

    // ========== МАСЛО И ОБЪЕМЫ ==========
    "fluid": "Nissan CVT NS-3",
    "dry_capacity": "9,0 л",
    "service_interval": "40 000 км / 3 года",

    // ========== OEM КОДЫ И ЗАПЧАСТИ ==========
    "oem_json": {
      "mesh_filter": [
        "31728-28X0A (2017+)",
        "31728-3ZX0A (≤20170)"
      ],
      "cartridge_filter": [
        "31726-3XX0A"
      ],
      "o_ring": [
        "31526-3VX0A"
      ],
      "pan_gasket": [
        "31397-1XF0D"
      ],
      "drain_plug_washer": [
        "11026-01M02"
      ]
    },

    // ========== ПРОЦЕДУРА ЗАМЕНЫ МАСЛА ==========
    "procedure": "«Как у JF016E», объём доливки после цикла ≈ 0,4 л."
  }
});

// Константа для совместимости (опционально, можно удалить)
const AKPP_JF018E_RE0F03H_data = window.allGearboxData["AKPP_JF018E_RE0F03H"];