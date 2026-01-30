# Инструкция по использованию поиска АКПП по VIN

## Что сделано

Добавлен функционал поиска АКПП по VIN-коду в проект `akpp-generator`.

## Компоненты

1. **Backend сервер** (`vin_backend.py`) - HTTP сервер на порту 8001 для обработки запросов поиска по VIN
2. **Frontend функция** (`searchByVIN()`) - JavaScript функция в `akpp_generator_unified.html`
3. **Интеграция с формой** - автоматическое заполнение формы после успешного поиска

## Как запустить

### 1. Запустить backend сервер

```bash
cd "/Users/ilaeliseenko/Desktop/ТГМ софт/akpp-generator"
python3 vin_backend.py 8001
```

Backend будет доступен на `http://localhost:8001`

### 2. Открыть HTML страницу

Откройте в браузере файл `akpp_generator_unified.html`

### 3. Использовать поиск по VIN

1. В поле "🔍 Поиск АКПП по VIN-коду" введите VIN-код (17 символов)
2. Нажмите кнопку "Найти"
3. Система автоматически:
   - Декодирует VIN через partsapi.ru
   - Определяет АКПП через OpenAI GPT-5.2
   - Находит АКПП в базе данных
   - Заполняет форму автоматически (если АКПП найдена)

## Что происходит при поиске

1. **Декодирование VIN** — получение данных об автомобиле через API api-cloud.ru (проект «декордер 2.0», `vin_client.py`)
2. **Определение АКПП** — отправка преобразованных данных в OpenAI (через `gearbox_resolver.py` из «декордер») для определения кода АКПП
3. **Поиск в базе** — поиск найденной АКПП в `window.allGearboxData`
4. **Заполнение формы** — автоматический выбор производителя и модели, заполнение всех полей

## Структура данных

- **Данные по VIN**: проект «декордер 2.0» — `vin_client.py`, API `https://api-cloud.ru/api/vindecoder.php`. Ответ API содержит `reports[]` с полями: brand, model, modification, engineVolume, enginePower, gear, drive, fuelType, modelYear, startYear, finishYear и др.
- **Определение АКПП**: проект «декордер» — `gearbox_resolver.py` (build_prompt, call_openai), объединённая БД: `gearbox_database_merged.json`
- Результат поиска сопоставляется с данными в `window.allGearboxData`

## Возможные результаты

- **EXACT** - АКПП точно определена, форма заполнена автоматически
- **AMBIGUOUS** - найдено несколько вариантов, нужно выбрать вручную
- **UNKNOWN** - АКПП не определена, нужно выбрать вручную

## Требования

- Python 3.12+
- Установленные пакеты: `requests`, `openai` (для gearbox_resolver в «декордер»)
- Переменные окружения:
  - `VINDECODER_TOKEN` — токен API api-cloud.ru (декордер 2.0)
  - `OPENAI_API_KEY` — ключ OpenAI
- Запущенный backend сервер на порту 8001
- Доступ в интернет (api-cloud.ru и OpenAI)
