#!/usr/bin/env python3
import pandas as pd
import numpy as np

# Создаем структуру данных на основе оригинального файла с дополнениями
column_a = [
    '', 
    'ИНН: 392302838630',
    'ОГРНИП: 319392600035915', 
    '',
    '',
    'Заказ-наряд № ${o.name} от ${formatter.format("%1$td.%1$tm.%1$tY", formatter.getExcelDate(o.moment))}',
    '',
    'Автомобиль',
    '${formatter.findAttribute(o, "Модель Авто").valueString}',
    '',
    'Пробег',
    '${formatter.findAttribute(o, "Пробег").valueString}',
    '',
    'ЗАКАЗЧИК [НЕДОСТАЮЩИЙ ПУНКТ]',
    'Наименование: _________________________________',
    'Адрес: _____________________________________',
    'Телефон: ___________________________________',
    'Работы по заказ-наряду',
    '№',
    '<jx:forEach items="${formatter.getServices(o)}" var="position">',
    '$[ROW() - ROW(A19)]',
    '</jx:forEach>',
    '',
    '',
    'Запчасти и расходные материалы',
    '№',
    '<jx:forEach items="${formatter.getGoods(o)}" var="position">',
    '$[ROW() - ROW(A27)]',
    '</jx:forEach>',
    '',
    '',
    '',
    'Всего наименований ${o.getPositions().size()} на сумму ${formatter.allAmountText(o)}',
    '${formatter.printAmount(formatter.getCurrency(o), formatter.allAmount(o))}',
    '',
    '',
    'Рекомендации',
    '${formatter.findAttribute(o, "Рекомендации").valueText}',
    '',
    'ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ [НЕДОСТАЮЩИЕ ПУНКТЫ]',
    'Срок выполнения работ: _________________',
    'Условия доплаты: _____________________',
    'Способ оплаты: ______________________',
    'Размер предоплаты: ___________________',
    'Порядок выдачи автомобиля: ____________',
    '',
    'ГАРАНТИЙНЫЕ ОБЯЗАТЕЛЬСТВА [ДОПОЛНЕННЫЙ РАЗДЕЛ]',
    'Гарантия на работы: _____ месяцев / _____ км пробега',
    'Гарантия на запчасти: согласно гарантии производителя',
    'Гарантия не распространяется на: _________________',
    'Условия гарантийного обслуживания: _______________',
    '',
    'Исполнитель',
    '',
    '',
    'ИП Елисеенко И.С',
    '',
    'СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ [НЕДОСТАЮЩИЙ ПУНКТ]',
    'Клиент дает согласие на обработку персональных данных в соответствии с ФЗ-152 "О персональных данных" для целей выполнения договора.',
    'Подпись клиента: _________________ Дата: __________'
]

# Определяем количество строк
num_rows = len(column_a)

# Создаем все колонки с одинаковой длиной
data = {
    'A': column_a,
    'B': [''] * num_rows,
    'C': [''] * num_rows,
    'D': [''] * num_rows,
    'E': [''] * num_rows,
    'F': [''] * num_rows,
    'G': [''] * num_rows,
    'H': [''] * num_rows,
    'I': [''] * num_rows
}

# Теперь заполняем нужные ячейки
data['E'][1] = 'Калининград, Дачная улица 6В'
data['E'][2] = '+7(995) 054-58-59'
data['E'][7] = 'Vin/Frame'
data['E'][8] = '${formatter.findAttribute(o, "VIN номер").valueString}'
data['E'][10] = 'Гос.номер'
data['E'][11] = '${formatter.findAttribute(o, "Гос. номер").valueString}'
data['E'][13] = 'ИНФОРМАЦИЯ ОБ АВТОМОБИЛЕ [НЕДОСТАЮЩИЕ ПУНКТЫ]'
data['E'][14] = 'Год выпуска: _______________________'
data['E'][15] = 'Цвет: _____________________________'
data['E'][16] = 'Объем двигателя: ___________________'
data['E'][17] = 'Цена'
data['E'][18] = '${position.basePrice.sumInCurrency / 100}'
data['E'][22] = 'Сумма чека'
data['E'][24] = 'Цена'
data['E'][25] = '${position.basePrice.sumInCurrency / 100}'
data['E'][29] = 'Сумма чека'
data['E'][30] = 'Скидка'
data['E'][31] = 'Итого'

data['B'][17] = 'Наименование/Вид работ'
data['B'][19] = '${position.printName}'
data['B'][25] = 'Наименование'
data['B'][26] = '${position.printName}'

data['F'][13] = 'Номер двигателя: ___________________'
data['F'][14] = 'Номер кузова: _____________________'
data['F'][15] = 'Номер шасси: ______________________'
data['F'][16] = 'ДАТА И ВРЕМЯ [НЕДОСТАЮЩИЕ ПУНКТЫ]'
data['F'][17] = 'Кол-во'
data['F'][18] = '${position.quantity}'
data['F'][22] = '${formatter.allSum(o)/100.00}'
data['F'][24] = 'Кол-во'
data['F'][25] = '${position.quantity}'
data['F'][29] = '${formatter.allSum(o)/100.00}'
data['F'][30] = '${formatter.allDiscount(o)/100.00}'
data['F'][31] = '${formatter.allAmount(o)/100.00}'

data['G'][13] = 'Дата приема в ремонт: _______________'
data['G'][14] = 'Время приема: _____________________'
data['G'][15] = 'Планируемая дата готовности: ________'
data['G'][16] = 'Фактическая дата готовности: _______'
data['G'][17] = 'Скидка'
data['G'][18] = '${(position.basePrice.sumInCurrency * position.quantity) / 100 - (position.price.sumInCurrency * position.quantity) / 100}'
data['G'][21] = 'Сумма'
data['G'][24] = 'Скидка'
data['G'][25] = '${(position.basePrice.sumInCurrency * position.quantity) / 100 - (position.price.sumInCurrency * position.quantity) / 100}'
data['G'][28] = 'Сумма'
data['G'][30] = 'НДС: не облагается (п.2 ст.346.11 НК РФ)'

data['H'][13] = 'Время выдачи: ____________________'
data['H'][14] = 'НЕИСПРАВНОСТИ И РАБОТЫ [НЕДОСТАЮЩИЙ ПУНКТ]'
data['H'][15] = 'Неисправности со слов клиента: _________________________'
data['H'][16] = 'Неисправности, выявленные при диагностике: _____________'
data['H'][17] = 'Сумма'
data['H'][18] = '${formatter.round(position.price.sumInCurrency * position.quantity) / 100.0}'
data['H'][21] = '${formatter.calcTotalAmount(formatter.getServices(o)) / 100.00}'
data['H'][25] = 'Сумма'
data['H'][26] = '${formatter.round(position.price.sumInCurrency * position.quantity) / 100.0}'
data['H'][28] = '${formatter.calcTotalAmount(formatter.getGoods(o)) / 100.00}'

data['E'][51] = 'Заказчик'
data['E'][54] = '${o.targetAgentRequisite.agent.name}'

data['A'][51] = 'Исполнитель'
data['A'][54] = 'ИП Елисеенко И.С'

# Создаем DataFrame
df = pd.DataFrame(data)

# Сохраняем в Excel
output_path = '/Users/ilaeliseenko/Desktop/akpp-generator/Заказ_наряд_дополненный.xlsx'
df.to_excel(output_path, index=False, header=False, engine='openpyxl')

print(f'Файл успешно сохранен: {output_path}')
print(f'Размер файла: {df.shape[0]} строк, {df.shape[1]} столбцов')
