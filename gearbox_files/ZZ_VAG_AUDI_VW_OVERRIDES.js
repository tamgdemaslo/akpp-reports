// Дополнительные метаданные и заглушки для VAG (Audi / VW)
// Категории по типу коробки и количеству ступеней, чтобы их было видно в селекторе

window.allGearboxData = window.allGearboxData || {};

Object.assign(window.allGearboxData, {
  // === ГИДРОМЕХАНИЧЕСКИЕ АВТОМАТЫ ===
  // 4-ступенчатые
  "AKPP_01M": {
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 4
  },
  "AKPP_01N": {
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 4
  },
  // 01P и 018 у нас нет как отдельных AKPP_ файлов — делаем заглушки
  "VAG_01P": {
    gearbox: "01P",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 4
  },
  "VAG_018": {
    gearbox: "018",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 4
  },

  // 5-ступенчатые
  "AKPP_01L01V5hp19": {
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 5
  },
  // 09A и 09B (Jatco) как автоматы VAG
  "AKPP_09AJF506": {
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 5
  },
  "VAG_09B": {
    gearbox: "09B",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 5
  },

  // 6-ступенчатые для поперечных моторов (Aisin AQ160/250/260/400/450)
  "ZF6HP19_21": {
    // Уже есть как ZF 6HP19/21 (09L), пропускаем — это продольный автомат
  },

  "VAG_AQ160": {
    gearbox: "AQ160",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },
  "VAG_AQ250": {
    gearbox: "AQ250",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },
  "VAG_AQ260": {
    gearbox: "AQ260",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },
  "VAG_AQ400": {
    gearbox: "AQ400",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },
  "VAG_AQ450": {
    gearbox: "AQ450",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },

  // 6-ступенчатые для продольных моторов (AL420/600/651/750/950)
  "VAG_AL420": {
    gearbox: "AL420",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },
  "VAG_AL600": {
    gearbox: "AL600",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },
  "VAG_AL651": {
    gearbox: "AL651",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },
  "VAG_AL750": {
    gearbox: "AL750",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },
  "VAG_AL950": {
    gearbox: "AL950",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 6
  },

  // 8-ступенчатые для поперечных моторов (AQ300/301/450/451)
  "VAG_AQ300": {
    gearbox: "AQ300",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AQ301": {
    gearbox: "AQ301",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AQ450_8": {
    gearbox: "AQ450",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AQ451": {
    gearbox: "AQ451",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },

  // 8-ступенчатые для продольных моторов (AL450/550/551/552/951/952/1000)
  "VAG_AL450": {
    gearbox: "AL450",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AL550": {
    gearbox: "AL550",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AL551": {
    gearbox: "AL551",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AL552": {
    gearbox: "AL552",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AL951": {
    gearbox: "AL951",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AL952": {
    gearbox: "AL952",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },
  "VAG_AL1000": {
    gearbox: "AL1000",
    manufacturer: "Audi / VW",
    gearbox_type: "гидромеханический автомат",
    gearbox_gears: 8
  },

  // === РОБОТИЗИРОВАННЫЕ КОРОБКИ (DSG / SQ) ===
  // 5-ступенчатые
  "VAG_SQ100": {
    gearbox: "SQ100",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 5
  },
  "VAG_SQ150": {
    gearbox: "SQ150",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 5
  },

  // 6-ступенчатые роботы
  "VAG_DQ250": {
    gearbox: "DQ250",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 6
  },
  "VAG_DQ400E": {
    gearbox: "DQ400e",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 6
  },

  // 7-ступенчатые роботы поперечные
  "VAG_DQ200": {
    gearbox: "DQ200",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 7
  },
  "VAG_DQ380": {
    gearbox: "DQ380",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 7
  },
  "VAG_DQ381": {
    gearbox: "DQ381",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 7
  },
  "VAG_DQ500": {
    gearbox: "DQ500",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 7
  },
  "VAG_DQ501": {
    gearbox: "DQ501",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 7
  },

  // 7-ступенчатые роботы продольные
  "VAG_DL382": {
    gearbox: "DL382",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 7
  },
  "VAG_DL501": {
    gearbox: "DL501",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 7
  },
  "VAG_DL800": {
    gearbox: "DL800",
    manufacturer: "Audi / VW",
    gearbox_type: "роботизированная",
    gearbox_gears: 7
  },

  // === ВАРИАТОРЫ ===
  "VAG_VL300": {
    gearbox: "VL300",
    manufacturer: "Audi / VW",
    gearbox_type: "вариатор"
  },
  "VAG_VL380": {
    gearbox: "VL380",
    manufacturer: "Audi / VW",
    gearbox_type: "вариатор"
  },
  "VAG_VL381": {
    gearbox: "VL381",
    manufacturer: "Audi / VW",
    gearbox_type: "вариатор"
  }
});

