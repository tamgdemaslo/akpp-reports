#!/usr/bin/env node
/**
 * Генерирует gearbox_files/zz_aisin_cards.js с полными карточками для всех 71 Aisin из списка.
 * Ключи совпадают с ZZ_LIST_STUBS.js (AISIN_AW5040LE и т.д.).
 */

const fs = require('fs');
const path = require('path');

const AISIN_LIST = [
  // Передний привод 4-ст.
  { key: 'AISIN_AW5040LE', gearbox: 'AW50-40LE', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW5040LM', gearbox: 'AW50-40LM', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW5040LN', gearbox: 'AW50-40LN', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW5042LE', gearbox: 'AW50-42LE', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW6040LE', gearbox: 'AW60-40LE', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW6040SN', gearbox: 'AW60-40SN', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW6041LE', gearbox: 'AW60-41LE', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW6041SN', gearbox: 'AW60-41SN', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW7040LE', gearbox: 'AW70-40LE', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW7241LE', gearbox: 'AW72-41LE', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW7341LS', gearbox: 'AW73-41LS', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW8040LE', gearbox: 'AW80-40LE', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW8040LS', gearbox: 'AW80-40LS', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW8140LE', gearbox: 'AW81-40LE', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW8140LS', gearbox: 'AW81-40LS', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW9040LS', gearbox: 'AW90-40LS', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW9140LS', gearbox: 'AW91-40LS', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_TS40SN', gearbox: 'TS-40SN', family: '4fwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '6,5-7,5 л', interval: '50 000-60 000 км', filterAtService: true },
  // Передний привод 5-ст. (AW55 — обслуживание по сливной пробке, фильтр при ТО не меняется)
  { key: 'AISIN_AW5550SN', gearbox: 'AW55-50SN', family: '5fwd', fluid: 'ATF JWS-3309', drain: 3.8, fillRange: '50-60', dry: '7,0-7,5 л', interval: '50 000-60 000 км', filterAtService: false, contentKey: 'aw55' },
  { key: 'AISIN_AW5551LE', gearbox: 'AW55-51LE', family: '5fwd', fluid: 'ATF JWS-3309', drain: 3.8, fillRange: '50-60', dry: '7,0-7,5 л', interval: '50 000-60 000 км', filterAtService: false, contentKey: 'aw55' },
  { key: 'AISIN_AW5551SN', gearbox: 'AW55-51SN', family: '5fwd', fluid: 'ATF JWS-3309', drain: 3.8, fillRange: '50-60', dry: '7,0-7,5 л', interval: '50 000-60 000 км', filterAtService: false, contentKey: 'aw55' },
  { key: 'AISIN_AW9550LS', gearbox: 'AW95-50LS', family: '5fwd', fluid: 'ATF JWS-3309 / Toyota WS', drain: 3.5, fillRange: '40-50', dry: '7,0-7,5 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_AW9551LS', gearbox: 'AW95-51LS', family: '5fwd', fluid: 'ATF JWS-3309 / Toyota WS', drain: 3.5, fillRange: '40-50', dry: '7,0-7,5 л', interval: '60 000 км', filterAtService: true },
  // Передний привод 6-ст.
  { key: 'AISIN_TM60LS', gearbox: 'TM-60LS', family: '6fwd', fluid: 'ATF JWS-3309', drain: 4, fillRange: '35-45', dry: '7,0-7,5 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TF60SN', gearbox: 'TF-60SN', family: '6fwd', fluid: 'ATF JWS-3309', drain: 3.8, fillRange: '35-45', dry: '6,7-7,2 л', interval: '60 000 км', filterAtService: true, contentKey: 'tf60' },
  { key: 'AISIN_TF61SN', gearbox: 'TF-61SN', family: '6fwd', fluid: 'ATF JWS-3309', drain: 3.8, fillRange: '35-45', dry: '6,7-7,2 л', interval: '60 000 км', filterAtService: true, contentKey: 'tf60' },
  { key: 'AISIN_TF62SN', gearbox: 'TF-62SN', family: '6fwd', fluid: 'ATF JWS-3309', drain: 3.8, fillRange: '35-45', dry: '6,7-7,2 л', interval: '60 000 км', filterAtService: true, contentKey: 'tf60' },
  { key: 'AISIN_TF70SC', gearbox: 'TF-70SC', family: '6fwd', fluid: 'ATF JWS-3309', drain: 4, fillRange: '35-45', dry: '7,0-7,5 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TF71SC', gearbox: 'TF-71SC', family: '6fwd', fluid: 'ATF JWS-3309', drain: 4, fillRange: '35-45', dry: '7,0-7,5 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TF72SC', gearbox: 'TF-72SC', family: '6fwd', fluid: 'ATF JWS-3309', drain: 4, fillRange: '35-45', dry: '7,0-7,5 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TF73SC', gearbox: 'TF-73SC', family: '6fwd', fluid: 'ATF JWS-3309', drain: 4, fillRange: '35-45', dry: '7,0-7,5 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TF80SC', gearbox: 'TF-80SC', family: '6fwd', fluid: 'ATF JWS-3309 / AW-1', drain: 3.8, fillRange: '40-50', dry: '7,0 л', interval: '60 000 км', filterAtService: false, contentKey: 'tf80' },
  { key: 'AISIN_TF80SD', gearbox: 'TF-80SD', family: '6fwd', fluid: 'ATF JWS-3309 / AW-1', drain: 3.8, fillRange: '40-50', dry: '7,0 л', interval: '60 000 км', filterAtService: false, contentKey: 'tf80' },
  { key: 'AISIN_TF81SC', gearbox: 'TF-81SC', family: '6fwd', fluid: 'ATF JWS-3309 / AW-1', drain: 3.8, fillRange: '40-50', dry: '7,4 л', interval: '60 000 км', filterAtService: false, contentKey: 'tf80' },
  { key: 'AISIN_TF82SC', gearbox: 'TF-82SC', family: '6fwd', fluid: 'ATF JWS-3309 / AW-1', drain: 3.8, fillRange: '40-50', dry: '7,0-7,5 л', interval: '60 000 км', filterAtService: false, contentKey: 'tf80' },
  // Передний привод 8-ст.
  { key: 'AISIN_TG80LS', gearbox: 'TG-80LS', family: '8fwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true },
  { key: 'AISIN_TG80SC', gearbox: 'TG-80SC', family: '8fwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true },
  { key: 'AISIN_TG81SC', gearbox: 'TG-81SC', family: '8fwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true },
  { key: 'AISIN_TG81SD', gearbox: 'TG-81SD', family: '8fwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true },
  // Задний привод 4-ст.
  { key: 'AISIN_AW0370LE', gearbox: 'AW03-70LE', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW0370LS', gearbox: 'AW03-70LS', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW0371LE', gearbox: 'AW03-71LE', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW0371LS', gearbox: 'AW03-71LS', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW0372LE', gearbox: 'AW03-72LE', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW0372LS', gearbox: 'AW03-72LS', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW3040LE', gearbox: 'AW30-40LE', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW3040LS', gearbox: 'AW30-40LS', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW3041LS', gearbox: 'AW30-41LS', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW3043LE', gearbox: 'AW30-43LE', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  { key: 'AISIN_AW3180LE', gearbox: 'AW31-80LE', family: '4rwd', fluid: 'ATF Toyota WS', drain: 4, fillRange: '35-45', dry: '8,0-9,0 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TW40E', gearbox: 'TW-40E', family: '4rwd', fluid: 'Toyota Type T-IV / JWS-3309', drain: 3.5, fillRange: '40-50', dry: '7,0-8,0 л', interval: '50 000-60 000 км', filterAtService: true },
  // Задний привод 5-ст.
  { key: 'AISIN_AW3050LE', gearbox: 'AW30-50LE', family: '5rwd', fluid: 'ATF JWS-3309 / Toyota WS', drain: 3.5, fillRange: '40-50', dry: '7,5-8,0 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_AW3550LS', gearbox: 'AW35-50LS', family: '5rwd', fluid: 'ATF Toyota WS', drain: 4, fillRange: '35-45', dry: '8,0-8,5 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_AW3551LS', gearbox: 'AW35-51LS', family: '5rwd', fluid: 'ATF Toyota WS', drain: 4, fillRange: '35-45', dry: '8,0-8,5 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TB50LS', gearbox: 'TB-50LS', family: '5rwd', fluid: 'ATF Toyota WS', drain: 4, fillRange: '35-45', dry: '8,0-8,5 л', interval: '60 000 км', filterAtService: true },
  // Задний привод 6-ст.
  { key: 'AISIN_TB60SN', gearbox: 'TB-60SN', family: '6rwd', fluid: 'ATF JWS-3309', drain: 5, fillRange: '35-45', dry: '11,5-12,0 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TB61SN', gearbox: 'TB-61SN', family: '6rwd', fluid: 'ATF JWS-3309', drain: 5, fillRange: '35-45', dry: '11,5-12,0 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TB65SN', gearbox: 'TB-65SN', family: '6rwd', fluid: 'ATF JWS-3309', drain: 5, fillRange: '35-45', dry: '11,5-12,0 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TB60LS', gearbox: 'TB-60LS', family: '6rwd', fluid: 'ATF JWS-3309', drain: 5, fillRange: '35-45', dry: '11,5-12,0 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TB68LS', gearbox: 'TB-68LS', family: '6rwd', fluid: 'ATF JWS-3309', drain: 5, fillRange: '35-45', dry: '11,5-12,0 л', interval: '60 000 км', filterAtService: true },
  { key: 'AISIN_TR60SN', gearbox: 'TR-60SN', family: '6rwd', fluid: 'ATF JWS-3309', drain: 5, fillRange: '35-45', dry: '11,5-12,0 л', interval: '60 000 км', filterAtService: true, contentKey: 'tr60' },
  // Задний привод 8-ст.
  { key: 'AISIN_TL80NF', gearbox: 'TL-80NF', family: '8rwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5.5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true, contentKey: 'tr80' },
  { key: 'AISIN_TL80SD', gearbox: 'TL-80SD', family: '8rwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5.5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true, contentKey: 'tr80' },
  { key: 'AISIN_TL80SN', gearbox: 'TL-80SN', family: '8rwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5.5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true, contentKey: 'tr80' },
  { key: 'AISIN_TR80SD', gearbox: 'TR-80SD', family: '8rwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5.5, fillRange: '38-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true, contentKey: 'tr80' },
  { key: 'AISIN_TR81SD', gearbox: 'TR-81SD', family: '8rwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5.5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true, contentKey: 'tr80' },
  { key: 'AISIN_TR82SD', gearbox: 'TR-82SD', family: '8rwd', fluid: 'ATF Toyota WS (JWS 3324)', drain: 5.5, fillRange: '35-45', dry: '9,5-10,5 л', interval: '60 000-100 000 км', filterAtService: true, contentKey: 'tr80' },
  // Вариаторы
  { key: 'AISIN_XA10LN', gearbox: 'XA-10LN', family: 'cvt', fluid: 'Toyota CVT Fluid TC / FE', drain: 4, fillRange: '36-46', dry: '7,0-8,0 л', interval: '80 000-100 000 км', filterAtService: true },
  { key: 'AISIN_XA11LN', gearbox: 'XA-11LN', family: 'cvt', fluid: 'Toyota CVT Fluid TC / FE', drain: 4, fillRange: '36-46', dry: '7,0-8,0 л', interval: '80 000-100 000 км', filterAtService: true },
  { key: 'AISIN_XA15LN', gearbox: 'XA-15LN', family: 'cvt', fluid: 'Toyota CVT Fluid TC / FE', drain: 4, fillRange: '36-46', dry: '7,0-8,0 л', interval: '80 000-100 000 км', filterAtService: true },
  { key: 'AISIN_XB20LN', gearbox: 'XB-20LN', family: 'cvt', fluid: 'Toyota CVT Fluid TC / FE', drain: 4, fillRange: '36-46', dry: '7,0-8,0 л', interval: '80 000-100 000 км', filterAtService: true },
];

// Контент для мастеров: описание, слабые места, частые вопросы (по семействам, из тематических источников)
const EXTRA_CONTENT = {
  aw55: {
    description: '**Aisin AW55** (AW55-50SN / AW55-51LE / AW55-51SN) — 5-ступенчатая АКПП, известная по Volvo, Saab, Opel, Nissan, Renault. Обслуживается без снятия поддона: только слив через пробку и залив через трубку щупа.\n\nДля мастера по замене масла важно: уровень проверять только при 50–60 °C и на работающем двигателе; перелив так же вреден, как недолив. Фильтр при обычном ТО не меняется — он внутри, для замены потребовалось бы снятие КПП.',
    weak_points: '**1. Очень чувствительна к уровню ATF.** Проверка на холодной коробке или при заглушенном двигателе даёт неверный результат; по форумам Volvo/Nissan частые жалобы после сервиса связаны именно с недоливом или переливом.\n\n**2. Только JWS-3309.** Использование Dexron III/VI меняет фрикционные свойства и провоцирует пинки и проскальзывание.\n\n**3. Один слив обновляет лишь часть объёма.** Для заметного освежения ATF делают 2–3 частичные замены с интервалом 200–500 км; аппаратная промывка сильно изношенной коробки без оценки гидроблока рискованна.\n\n**4. Уплотнение сливной пробки — одноразовое.** Повторное использование ведёт к течам.',
    faq: [
      { question: 'Меняется ли фильтр на AW55 при обычном ТО?', answer: 'Нет. При сервисной замене масла поддон не снимается, фильтр внутренний — для его замены потребовалось бы снятие КПП. Обслуживание только через сливную пробку и щуп.', url: '' },
      { question: 'Какое масло лить в AW55?', answer: 'Только ATF JWS-3309 (Volvo 1161540/1161640, Toyota Type T-IV, Mobil ATF 3309, Aisin AFW+). Dexron применять нельзя.', url: '' },
      { question: 'При какой температуре проверять уровень?', answer: 'При 50–60 °C, двигатель работает, селектор «P», автомобиль строго горизонтально. Доливать до метки HOT малыми порциями.', url: '' },
    ],
  },
  tf60: {
    description: '**Aisin TF-60SN / TF-61SN / TF-62SN** — 6-ступенчатые переднеприводные АКПП (VAG 09G / 09K / 09M и др.). Нижний поддон, при ТО меняются фильтр и прокладка. Уровень выставляется при 35–45 °C по переливной трубке.\n\nДля мастера важно: фильтр и прокладка должны соответствовать поколению поддона (Early/Mid/Late — разное число болтов и тип поддона); проверка уровня вне диапазона температур даёт недолив или перелив.',
    weak_points: '**1. Проверка уровня вне 35–45 °C** — частая причина недолива или перелива и последующих жалоб на переключения.\n\n**2. Фильтр и прокладка разных поколений** — подсос воздуха или неверный уровень; поддон Early/Mid 17 болтов T27, Late — 13 болтов T40, фильтры не взаимозаменяемы.\n\n**3. Только JWS-3309.** Универсальный ATF или Dexron вызывает проскальзывания и перегрев фрикционов.\n\n**4. Повторное использование болтов и шайб** — типичная причина течей после сервиса.',
    faq: [
      { question: 'Меняется ли фильтр на TF-60SN при ТО?', answer: 'Да. У TF-60/61/62 нижний поддон, фильтр при нормальном ТО меняется. Подбирать по поколению поддона (Early/Mid/Late).', url: '' },
      { question: 'Какое масло лить?', answer: 'Только ATF JWS-3309 (VAG G 055 025 A2). Объём при частичной замене с поддоном обычно 3,5–4 л.', url: '' },
      { question: 'Почему после замены клиент жалуется на переключения?', answer: 'Сначала проверить уровень при 35–45 °C и посадку фильтра/O-ring. Часто причина — неверный уровень или ошибка с поколением фильтра.', url: '' },
    ],
  },
  tf80: {
    description: '**Aisin TF-80SC / TF-80SD / TF-81SC / TF-82SC** (AF40-6, AF21) — 6-ступенчатые АКПП на Volvo, GM/Opel, Land Rover. Обслуживание без снятия поддона: слив через наружную пробку 24 мм, уровень через верхнюю пробку (Torx T40 или 17 мм). Фильтр встроенный, при обычном ТО не меняется.\n\nДля мастера: уровень выставлять при 40–50 °C; перелив приводит к вспениванию и износу фрикционов, недолив — к проскальзыванию.',
    weak_points: '**1. Перелив и недолив** — перелив даёт вспенивание ATF и падение давления; недолив — подсос воздуха и проскакивание пакетов. Температура при проверке уровня критична.\n\n**2. Пробка уровня** может прикипеть; перед сливом убедиться, что откручивается.\n\n**3. Фильтр при частичной замене не меняется** — он встроен в гидроблок, меняется только при ремонте.',
    faq: [
      { question: 'Меняется ли фильтр при обычном ТО?', answer: 'Нет. Фильтр встроен, при частичной замене масла не обслуживается. Меняется только при полной разборке/ремонте.', url: '' },
      { question: 'Какое масло лить?', answer: 'JWS 3309 / AW-1 (Volvo 31256775, GM 93160393, Toyota 08886-81015). Объём слива обычно 3,5–4,5 л в зависимости от модификации.', url: '' },
      { question: 'При какой температуре выставлять уровень?', answer: 'При 40–50 °C. Дождаться перехода струи в капли (~1 капля/с) — тогда уровень верный.', url: '' },
    ],
  },
  tr60: {
    description: '**Aisin TR-60SN** — 6-ступенчатая заднеприводная АКПП (VAG 09D, Touareg, Q7, Cayenne). Нижний поддон, при ТО меняются фильтр и прокладка. Уровень по переливной трубке при 35–45 °C.\n\nДля мастера: обязательно выкручивать переливную трубку при сливе, иначе в коробке остаётся 2,5+ л старого масла. Болты поддона с заводским герметиком — одноразовые.',
    weak_points: '**1. Не снять переливную трубку при сливе** — в коробке остаётся много старого ATF, замена получается неполной.\n\n**2. Проверка уровня вне 35–45 °C** даёт недолив или перелив.\n\n**3. Только JWS-3309.** Универсальный ATF вызывает проскальзывания и перегрев.\n\n**4. Термостат** после большого пробега часто закисает, задерживая прогрев ATF — при жалобах на холодное поведение стоит проверять.',
    faq: [
      { question: 'Меняется ли фильтр на TR-60SN при ТО?', answer: 'Да. Нижний поддон, фильтр при нормальном ТО меняется. Объём слива с поддоном и трубкой 4,5–5,5 л.', url: '' },
      { question: 'Почему важно выкручивать переливную трубку?', answer: 'Без этого из коробки выльется только около 1 л; ещё 3–3,5 л выйдет после выкручивания трубки. Иначе замена почти бесполезна.', url: '' },
      { question: 'Какое масло?', answer: 'ATF JWS-3309 (VAG G 055 025 A2, Toyota T-IV). 6–7 л на сервис с фильтром.', url: '' },
    ],
  },
  tr80: {
    description: '**Aisin TR-80SD / TR-81SD / TR-82SD, TL-80*** — 8-ступенчатые заднеприводные АКПП (VAG 0C8, Audi, VW, Porsche). Нижний поддон, пластиковый фильтр меняется при ТО. ATF только Toyota WS (JWS 3324, G 055 540 A2). Уровень при 35–45 °C.\n\nДля мастера: нельзя лить JWS-3309 или Dexron — только WS; перелив вызывает вспенивание; прокладку и шайбу пробки менять обязательно.',
    weak_points: '**1. Не та жидкость.** JWS-3309/Dexron вместо WS ведёт к перегреву и пробуксовке пакетов.\n\n**2. Перелив** — пенообразование, падение давления, износ фрикционов.\n\n**3. Повторное использование алюминиевой шайбы пробки** — частая причина потения поддона.\n\n**4. В городе ATF стареет быстрее** — каждое потемнение сигнал к замене (часто 30–40 тыс. км).',
    faq: [
      { question: 'Какое масло лить в TR-80SD / 0C8?', answer: 'Только ATF Toyota WS (JWS 3324, VAG G 055 540 A2). JWS-3309 и Dexron применять нельзя.', url: '' },
      { question: 'Меняется ли фильтр при ТО?', answer: 'Да. Нижний поддон, пластиковый фильтр при нормальном ТО меняется. OEM уточнять по каталогу (0C8 325 435 и др.).', url: '' },
      { question: 'При какой температуре выставлять уровень?', answer: 'При 35–45 °C на работающем двигателе. Струя должна перейти в частые капли — тогда затянуть пробку.', url: '' },
    ],
  },
};

function emptyOemJson(filterInfo) {
  return {
    oem_fluid_1: '',
    oem_fluid_1_price: 0,
    oem_fluid_2: '',
    oem_fluid_2_price: 0,
    oem_filter_internal: '',
    oem_filter_internal_price: 0,
    oem_filter_internal_info: filterInfo,
    oem_filter_external: '',
    oem_filter_external_price: 0,
    oem_filter_external_info: 'Внешнего сервисного фильтра нет.',
    oem_gasket_1: '',
    oem_gasket_1_price: 0,
    oem_gasket_1_info: 'Прокладку поддона подбирать по каталогу применения / VIN.',
    oem_gasket_2: '',
    oem_gasket_2_price: 0,
    oem_gasket_2_info: '',
    oem_o_ring_1: '',
    oem_o_ring_1_price: 0,
    oem_o_ring_1_info: '',
    oem_o_ring_2: '',
    oem_o_ring_2_price: 0,
    oem_o_ring_2_info: '',
    oem_drain_plug: '',
    oem_drain_plug_price: 0,
    oem_drain_plug_info: 'OEM сливной пробки уточнять по каталогу автомобиля.',
    oem_drain_plug_washer: '',
    oem_drain_plug_washer_price: 0,
    oem_drain_plug_washer_info: '',
    oem_bolt_1: '',
    oem_bolt_1_price: 0,
    oem_bolt_1_info: 'Болты поддона уточнять по каталогу применения.',
    oem_bolt_2: '',
    oem_bolt_2_price: 0,
    oem_bolt_2_info: '',
  };
}

function buildCard(item) {
  const extra = item.contentKey && EXTRA_CONTENT[item.contentKey];
  const filterAtService = item.filterAtService;
  const filterInfo = filterAtService
    ? 'Нижний поддон: фильтр при сервисном ТО меняется. OEM фильтра и прокладки уточнять по каталогу конкретного применения (автомобиль / VIN).'
    : 'При обычной сервисной замене масла поддон не снимается (слив через сливную пробку) либо фильтр встроен и не сервисируется. Для замены фильтра потребовалось бы снятие КПП / разборка; OEM фильтра для стандартного ТО не указывается.';

  const procedure = filterAtService
    ? `1. Прогрейте АКПП до рабочей температуры (≈40–50 °C), установите автомобиль строго горизонтально.\n2. Слейте ATF через сливную пробку в мерную тару, зафиксируйте объём.\n3. Снимите нижний поддон, замените фильтр и прокладку. Очистите магниты и поддон.\n4. Установите поддон с новыми болтами/прокладкой, момент затяжки по мануалу применения.\n5. Залейте свежую ATF в объёме, близком к слитому.\n6. Запустите двигатель, пройдите селектором все диапазоны. При температуре ${item.fillRange} °C выставьте уровень по контрольной пробке или щупу.\n7. После тест-драйва проверьте герметичность и уровень.`
    : `1. Прогрейте АКПП до ${item.fillRange} °C (по диагностике или после поездки), установите автомобиль строго горизонтально.\n2. Слейте ATF через сливную пробку в мерную тару, зафиксируйте объём.\n3. Установите новую шайбу/уплотнение сливной пробки, затяните пробку (обычно 35 Н·м — сверять по мануалу).\n4. Через заливную трубку/щуп залейте объём, равный слитому.\n5. Запустите двигатель, пройдите селектором все диапазоны. При температуре ${item.fillRange} °C проверьте уровень по щупу или контрольной пробке, при необходимости доливайте.\n6. Перелив так же вреден, как недолив. После тест-драйва повторно проверьте уровень и отсутствие течей.`;

  return {
    manufacturer: 'Aisin',
    gearbox: item.gearbox,
    summary: `${item.gearbox} | ${item.drain} л | ${item.fluid.startsWith('ATF ') ? item.fluid : 'ATF ' + item.fluid} | уровень при ${item.fillRange} °C | интервал ${item.interval}`,
    analogs: [item.gearbox],
    fluid: item.fluid,
    drain_volume: item.drain,
    fluid_type: item.fluid,
    fluid_spec: item.fluid + '; уточнять по каталогу применения',
    fill_range_celsius: item.fillRange,
    work_temp_celsius: item.fillRange,
    pan_torque_nm: filterAtService ? 10 : 0,
    drain_torque_nm: 35,
    fill_torque_nm: 35,
    dry_capacity: item.dry,
    service_interval: item.interval + ' или 3–5 лет; при тяжёлом режиме чаще',
    tools: [
      'подъёмник или ровная площадка',
      'ключ/головка для сливной и заливной пробок',
      'динамометрический ключ 5–60 Н·м',
      'насос/воронка для заливки ATF',
      'диагностический сканер или пирометр для контроля температуры ATF',
      'мерная тара для слитой жидкости',
    ],
    parts_list: filterAtService
      ? [(item.fluid.startsWith('ATF ') ? item.fluid : 'ATF ' + item.fluid) + ' 5–8 л', 'фильтр АКПП (по каталогу применения)', 'прокладка поддона', 'шайба/уплотнение сливной пробки']
      : [(item.fluid.startsWith('ATF ') ? item.fluid : 'ATF ' + item.fluid) + ' 4–6 л', 'шайба или уплотнение сливной пробки'],
    oem_json: emptyOemJson(filterInfo),
    procedure,
    mistakes: [
      'Проверка уровня вне диапазона ' + item.fillRange + ' °C приводит к недоливу или переливу.',
      'Использование ATF другой спецификации (например Dexron вместо JWS-3309/WS) может вызвать проскальзывание и износ.',
      filterAtService ? 'Повторное использование прокладки поддона или шайбы пробки — частая причина течей.' : 'Повторное использование уплотнения сливной пробки — причина течей.',
    ],
    nuances: filterAtService
      ? 'Нижний поддон: при ТО фильтр и прокладка меняются. OEM уточнять по каталогу конкретного автомобиля. Один частичный слив обновляет не весь объём ATF; для более полной замены делают 2–3 цикла с интервалом 200–500 км.'
      : 'Обслуживание без снятия поддона (или фильтр встроен). Фильтр при стандартном ТО не меняется. Уровень проверять только при указанной температуре и на горизонтальной площадке.',
    procedure_id: item.key,
    ...(extra && extra.description && { description: extra.description }),
    ...(extra && extra.weak_points && { weak_points: extra.weak_points }),
    ...(extra && extra.faq && extra.faq.length && { faq: extra.faq }),
  };
  return card;
}

const projectRoot = path.join(__dirname, '..');
const outPath = path.join(projectRoot, 'gearbox_files', 'zz_aisin_cards.js');

const allData = {};
for (const item of AISIN_LIST) {
  allData[item.key] = buildCard(item);
}

const header = `// Полные карточки Aisin (71 модель), сгенерировано scripts/build_aisin_cards.js
window.allGearboxData = window.allGearboxData || {};

Object.assign(window.allGearboxData, 
`;
const footer = `);
`;

const content = header + JSON.stringify(allData, null, 2) + footer;
fs.writeFileSync(outPath, content, 'utf8');
console.log('OK: ' + outPath + ' (71 карточка)');
