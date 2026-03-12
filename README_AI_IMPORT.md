## Импорт карт АКПП из ИИ в `gearbox_data.yaml`

Этот файл объясняет, **в каком формате ИИ должен отдавать данные по одной коробке**, и **как эти данные попадают в генератор**.

### 1. Куда в итоге попадают данные

- Все новые/обновлённые коробки живут в файле `gearbox_data.yaml` в разделе:

  ```yaml
  gearboxes:
    ZF6HP19_21:
      ...
    8HP45:
      ...
    # ← сюда добавляются новые ключи
    5R55S_5R55N_5R55W:
      ...
  ```

- Из `gearbox_data.yaml` потом собирается JS‑бандл (`build_gearbox_bundle.js`), и уже он используется в `akpp_generator_unified.html`.

### 2. Что теперь можно скармливать импортеру

Импортер принимает:

- чистый JSON;
- JSON внутри блока ```json ... ```;
- обычный текстовый ответ, если внутри него есть один корректный JSON-объект.

То есть теперь **не обязательно вручную чистить ответ ИИ**, если он всё-таки написал пару строк вокруг JSON.

### 3. Формат JSON, который должен вернуть ИИ

ИИ **не должен писать YAML**. Лучший формат ответа: **один JSON‑объект** с полями, совместимыми с `gearbox_template.json`.

Пример **минимально полезного** JSON для одной коробки:

```json
{
  "manufacturer": "Ford",
  "gearbox": "5R55S / 5R55N / 5R55W",
  "summary": "Краткое резюме по коробке...",
  "analogs": ["5R55S", "5R55N", "5R55W"],
  "fluid": "ATF MERCON V",
  "drain_volume": 4.5,
  "fluid_type": "ATF MERCON V",
  "fluid_spec": "MERCON V (подтверждать по VIN/мануалу)",
  "fill_range_celsius": "70-90",
  "work_temp_celsius": "80-95",
  "pan_torque_nm": 0,
  "drain_torque_nm": 0,
  "fill_torque_nm": 0,
  "dry_capacity": "10-12",
  "service_interval": "50 000–60 000 км или 3–4 года",
  "tools": [
    "подъёмник/эстакада",
    "динамометрический ключ 5–60 Н·м"
  ],
  "parts_list": [
    "ATF MERCON V 8–10 л",
    "фильтр АКПП",
    "прокладка поддона"
  ],
  "oem_json": {
    "oem_fluid_1": "",
    "oem_fluid_1_price": 0,
    "oem_filter_internal": "",
    "oem_filter_internal_price": 0,
    "oem_filter_internal_info": "Описание внутреннего фильтра / маслоприёмника (если нет кода)",
    "oem_filter_external": "",
    "oem_filter_external_price": 0,
    "oem_filter_external_info": "Описание внешнего картридж-фильтра (если есть)",
    "oem_gasket_1": "",
    "oem_gasket_1_price": 0,
    "oem_gasket_1_info": "",
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
    "oem_drain_plug_info": "",
    "oem_drain_plug_washer": "",
    "oem_drain_plug_washer_price": 0,
    "oem_drain_plug_washer_info": "",
    "oem_bolt_1": "",
    "oem_bolt_1_price": 0,
    "oem_bolt_1_info": "",
    "oem_bolt_2": "",
    "oem_bolt_2_price": 0,
    "oem_bolt_2_info": ""
  },
  "procedure": "Подробная пошаговая процедура замены масла в одном строковом поле.\nМожно использовать переносы строк.",
  "mistakes": [
    "Типичная ошибка 1",
    "Типичная ошибка 2"
  ],
  "nuances": "Нюансы обслуживания и особенности конструкции."
}
```

**Требования к JSON:**

- валидный JSON (без комментариев, без висячих запятых);
- строковые поля могут быть многострочными — это конвертер превратит в `|`‑блок в YAML;
- если точных OEM‑кодов нет — заполняем только `*_info` текстом.

### 4. Как импортировать ответ ИИ в `gearbox_data.yaml`

1. Сохранить ответ ИИ в файл, например:

   ```bash
   data/ford_5r55s.txt
   ```

2. Запустить скрипт импорта из корня проекта:

   ```bash
   node import_gearbox_from_ai.js data/ford_5r55s.txt 5R55S_5R55N_5R55W
   ```

   - `data/ford_5r55s.txt` — путь к ответу ИИ.
   - `5R55S_5R55N_5R55W` — ключ, под которым блок появится в `gearbox_data.yaml`.

3. Скрипт:
   - вытащит JSON из ответа,
   - найдёт `gearbox_data.yaml`,
   - добавит или перезапишет блок с этим ключом,
   - **создаст рабочий JS-файл в `gearbox_files/ZZ_AI_<KEY>.js`**,
   - **сразу автоматически пересоберёт бандл для сайта**.

После успешного выполнения новая коробка уже готова для генератора.

Важно:

- Если ты **добавляешь новую коробку**, используй новый ключ, например `5R55S_5R55N_5R55W`.
- Если ты **хочешь заменить старую коробку, которая уже есть на сайте**, используй **тот же ключ, который уже используется в сайте/бандле**.  
  Например, если в старом JS ключ называется `AKPP_5R55S5R55N5R55W`, то для замены надо импортировать именно в этот ключ. Иначе на сайте будут одновременно старая и новая карточки.

### 5. Рекомендуемый мягкий промт для ИИ

Этот вариант мягче: он всё ещё заставляет модель вернуть JSON, но не толкает её в бесконечные "требует уточнения" там, где можно дать осторожно правдоподобные общие данные.

```text
Ты заполняешь JSON для сайта по обслуживанию АКПП.

На входе тебе передаётся только название коробки.
На выходе ты должен вернуть только один валидный JSON-объект без пояснений вне JSON.

Структура JSON должна строго совпадать с шаблоном ниже. Нельзя удалять ключи, переименовывать их, менять типы значений или добавлять новые поля.

Если точные OEM-коды, объёмы, моменты затяжки или спецификации нельзя уверенно подтвердить только по названию коробки, не выдумывай их. Но если для модели в целом правдоподобны общие данные, допускается:
- указывать диапазоны;
- использовать формулировки "обычно", "как правило", "часто", "зависит от ревизии";
- давать безопасные общие рекомендации по обслуживанию;
- заполнять типовые инструменты и типовые расходники.

Не нужно чрезмерно злоупотреблять фразой "требует уточнения", если можно дать осторожное, но полезное описание без ложной точности.

Правила:
1. Если OEM-код не подтверждён — оставляй код пустым, а пояснение пиши в поле *_info.
2. Если точный объём зависит от версии — лучше диапазон или осторожное описание, чем одно жёсткое число.
3. Если коробка имеет разные исполнения фильтра — обязательно укажи это в info/nuances.
4. В `summary`, `procedure`, `mistakes`, `nuances`, `tools`, `parts_list` давай практичную информацию для мастера.
5. В `manufacturer` указывай бренд коробки или основного семейства так, как это обычно используется в проекте: например `Ford`, `ZF`, `Jatco`, `Aisin`.

Шаблон:
{
  "manufacturer": "",
  "gearbox": "",
  "summary": "",
  "analogs": [],
  "fluid": "",
  "drain_volume": 0,
  "fluid_type": "",
  "fluid_spec": "",
  "fill_range_celsius": "",
  "work_temp_celsius": "",
  "pan_torque_nm": 0,
  "drain_torque_nm": 0,
  "fill_torque_nm": 0,
  "dry_capacity": "",
  "service_interval": "",
  "tools": [],
  "parts_list": [],
  "oem_json": {
    "oem_fluid_1": "",
    "oem_fluid_1_price": 0,
    "oem_fluid_2": "",
    "oem_fluid_2_price": 0,
    "oem_filter_internal": "",
    "oem_filter_internal_price": 0,
    "oem_filter_internal_info": "",
    "oem_filter_external": "",
    "oem_filter_external_price": 0,
    "oem_filter_external_info": "",
    "oem_gasket_1": "",
    "oem_gasket_1_price": 0,
    "oem_gasket_1_info": "",
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
    "oem_drain_plug_info": "",
    "oem_drain_plug_washer": "",
    "oem_drain_plug_washer_price": 0,
    "oem_drain_plug_washer_info": "",
    "oem_level_plug": "",
    "oem_level_plug_price": 0,
    "oem_level_plug_info": "",
    "oem_level_plug_washer": "",
    "oem_level_plug_washer_price": 0,
    "oem_level_plug_washer_info": "",
    "oem_bolt_1": "",
    "oem_bolt_1_price": 0,
    "oem_bolt_1_info": "",
    "oem_bolt_2": "",
    "oem_bolt_2_price": 0,
    "oem_bolt_2_info": ""
  },
  "procedure": "",
  "mistakes": [],
  "nuances": ""
}

Входные данные:
Название АКПП: {{GEARBOX_NAME}}

Верни только валидный JSON.
```

### 6. Минимальный рабочий процесс

1. Отправляешь ИИ мягкий промт выше.
2. Сохраняешь ответ как `data/<имя>.txt`.
3. Запускаешь:

   ```bash
   node import_gearbox_from_ai.js data/<имя>.txt <KEY>
   ```

4. Скрипт сам:
   - достанет JSON,
   - обновит `gearbox_data.yaml`,
   - создаст/обновит `gearbox_files/ZZ_AI_<KEY>.js`,
   - пересоберёт бандл.

После этого данные уже можно использовать на сайте.

