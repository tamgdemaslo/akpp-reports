// Подробная карточка для сайта: VAG 09B (Jatco JF506E, то же семейство что 09A)
window.allGearboxData = window.allGearboxData || {};

Object.assign(window.allGearboxData, {
  "VAG_09B": {
    "manufacturer": "VAG",
    "gearbox": "VAG 09B",
    "summary": "боковой поддон, фильтр НЕ меняется при ТО (требуется снятие КПП) | слив ~3 л | готовить 3,5–4 л ATF | уровень при ~40 °C и на работающем двигателе | ATF VW G 052 990 A2",
    "analogs": [
      "09B",
      "09A",
      "JF506E",
      "Jatco 5-speed"
    ],
    "fluid": "ATF VW G 052 990 A2",
    "drain_volume": 3,
    "fluid_type": "ATF VW G 052 990 A2",
    "fluid_spec": "Для 09B та же спецификация, что для 09A: G 052 990 A2 (не G 052 162). Ross-Tech и VW Vortex подтверждают идентичную платформу JF506E.",
    "fill_range_celsius": "35-45",
    "work_temp_celsius": "40",
    "pan_torque_nm": 0,
    "drain_torque_nm": 0,
    "fill_torque_nm": 0,
    "dry_capacity": "~5–6 л (частичный слив заменяет ~50%)",
    "service_interval": "30 000–40 000 км или 2–3 года; drain-and-fill — единственный сервис без снятия КПП",
    "tools": [
      "подъёмник или домкрат, автомобиль горизонтально",
      "головка 24 mm (15/16\" подходит) для сливной пробки",
      "воронка и шланг для заливки через верхнюю заливную трубку",
      "VCDS — измерение ATF в блоке 004",
      "отвёртка для снятия красной заглушки и чёрного колпачка заливной пробки"
    ],
    "parts_list": [
      "ATF VW G 052 990 A2 3,5–4 л",
      "новая сливная пробка и уплотнение — сверять по VIN или старой детали"
    ],
    "oem_json": {
      "oem_fluid_1": "G 052 990 A2",
      "oem_fluid_1_price": 0,
      "oem_fluid_2": "",
      "oem_fluid_2_price": 0,
      "oem_filter_internal": "",
      "oem_filter_internal_price": 0,
      "oem_filter_internal_info": "У 09B та же конструкция, что у 09A: боковой поддон, нижнего нет. Фильтр внутри корпуса, при обычном ТО НЕ меняется (доступ только при снятии КПП). OEM фильтра не указываем.",
      "oem_filter_external": "",
      "oem_filter_external_price": 0,
      "oem_filter_external_info": "Внешнего сервисного фильтра у 09B нет.",
      "oem_gasket_1": "",
      "oem_gasket_1_price": 0,
      "oem_gasket_1_info": "Нижнего поддона нет. Прокладка поддона не применима.",
      "oem_gasket_2": "",
      "oem_gasket_2_price": 0,
      "oem_gasket_2_info": "",
      "oem_o_ring_1": "",
      "oem_o_ring_1_price": 0,
      "oem_o_ring_1_info": "",
      "oem_o_ring_2": "",
      "oem_o_ring_2_price": 0,
      "oem_o_ring_2_info": "",
      "oem_drain_plug": "",
      "oem_drain_plug_price": 0,
      "oem_drain_plug_info": "Сливная пробка 24 mm. Новое уплотнение — сверять по VIN или старой детали.",
      "oem_drain_plug_washer": "",
      "oem_drain_plug_washer_price": 0,
      "oem_drain_plug_washer_info": "Точный OEM без VIN не фиксирую.",
      "oem_bolt_1": "",
      "oem_bolt_1_price": 0,
      "oem_bolt_1_info": "Болтов поддона нет.",
      "oem_bolt_2": "",
      "oem_bolt_2_price": 0,
      "oem_bolt_2_info": ""
    },
    "procedure": "1. Подтвердите 09B (Jatco JF506E — то же семейство, что 09A), выставьте автомобиль горизонтально.\n2. Прогрейте АКПП, проверьте доступность заливной пробки до слива (красная заглушка, чёрный колпачок).\n3. Слейте ATF через сливную пробку 24 mm (~3 л), установите новую с уплотнением.\n4. Залейте ~3 л через заливную трубку.\n5. Запустите двигатель, пройдите селектором R, D, N, 3, 2 по ~10 с.\n6. При ~40 °C (VCDS 004) откройте check plug: лёгкая капля = ОК; не идёт — долить.\n7. По опыту форумов 09A/09B: Bentley 2,5 л часто даёт гул — 3 + 0,25–0,5 л обычно лучше.",
    "mistakes": [
      "Заливать G 052 162 A2 вместо G 052 990 A2.",
      "Проверять уровень на заглушённом двигателе или не пройти селектором все диапазоны.",
      "Доверять только 2,5 л по Bentley — по практике 3 + 0,25–0,5 л.",
      "Обещать замену фильтра при ТО — фильтр доступен только при снятии КПП.",
      "Обещать, что drain-and-fill устранит проблемы соленоидов."
    ],
    "nuances": "09B и 09A — одна платформа Jatco JF506E (Ross-Tech). Боковой поддон, фильтр при ТО не меняется. Сервис — только drain-and-fill. Недолив даёт гул.",
    "description": "**VAG 09B** — 5-ступенчатая АКПП Jatco JF506E, та же платформа, что 09A. Применения: Sharan, Seat Alhambra (2001–2010) и родственные модели.\n\nДля мастера: **конструкция идентична 09A** — боковой поддон, нижнего нет, фильтр при ТО не меняется. ATF — **G 052 990 A2**. Сервис — только drain-and-fill. По VW Vortex владельцы 09B (Sharan) используют те же процедуры и объёмы, что для 09A.",
    "weak_points": "**1. Соленоиды и valve body.** Та же картина, что у 09A: проблемы соленоидов, задержки переключений. Замена масла не устраняет.\n\n**2. Недолив и гул.** Bentley 2,5 л часто даёт гул. Практика: 3 + 0,25–0,5 л.\n\n**3. Путаница ATF.** 09B требует G 052 990 A2, не G 052 162.",
    "faq": [
      {
        "question": "Меняется ли фильтр при обычном ТО на 09B?",
        "answer": "Нет. 09B — та же платформа JF506E, что 09A. Боковой поддон, фильтр при ТО не меняется.",
        "url": "https://wiki.ross-tech.com/wiki/index.php/5-Speed_Automatic_Transmission_(09A)"
      },
      {
        "question": "Какую ATF указывать?",
        "answer": "Только G 052 990 A2. Та же спецификация, что для 09A.",
        "url": "https://www.vwvortex.com/threads/jf506e-09b-5-speed-atf-alternatives.3846405/"
      },
      {
        "question": "Сколько ATF готовить?",
        "answer": "Сливается ~3 л. Иметь 3,5–4 л. 3 + 0,25–0,5 л по опыту форумов лучше 2,5 л.",
        "url": "https://www.vwvortex.com/threads/jf506e-09b-5-speed-atf-alternatives.3846405/"
      },
      {
        "question": "Чем 09B отличается от 09A?",
        "answer": "По Ross-Tech — одна платформа Jatco JF506E. Различия в применениях (09B — Sharan, Alhambra; 09A — Golf, Jetta и др.). Сервис и ATF одинаковы.",
        "url": "https://wiki.ross-tech.com/wiki/index.php/5-Speed_Automatic_Transmission_(09A)"
      }
    ],
    "procedure_id": "VAG_09B"
  }
});
