#!/usr/bin/env python3
"""
seo_fill.py
-----------
Batch-fills SEO columns (title, description, keywords) in a Tilda products CSV export.

Usage:
    python seo_fill.py input.csv [output.csv]
If output file is omitted, a new file with suffix _seo.csv is created next to input.

Strategy:
• Uses the product Title as SEO title.
• Builds description like: "<Title>. Цена <Price> ₽. Быстрая доставка по РФ."
• Generates keywords from brand, viscosity (SAE field), category words + misc words.

The script preserves the original CSV structure with the leading numeric index and the
"|" separator used by Tilda. All other columns remain unchanged.
"""

import csv
import re
import sys
from pathlib import Path

# ---------------- helpers ----------------------------------------------------
STOPWORDS = {
    'моторное', 'масло', 'масла', 'для', 'и', 'в', 'л', 'л.', 'л', 'канистрах'
}

def slugify(text: str) -> list[str]:
    """Very rough tokenizer that returns lower-cased words without punct."""
    words = re.findall(r"[а-яА-Яa-zA-Z0-9\-\.]+", text.lower())
    return [w for w in words if w not in STOPWORDS]

# ---------------- main -------------------------------------------------------

def main(path_in: str, path_out: str | None = None):
    pin = Path(path_in)
    if path_out is None:
        path_out = pin.with_stem(pin.stem + "_seo").with_suffix('.csv')
    
    with pin.open("r", encoding="utf-8") as f_in, Path(path_out).open("w", encoding="utf-8", newline="") as f_out:
        # Write UTF-8 BOM for better compatibility with Excel
        f_out.write('\ufeff')
        reader = csv.reader(f_in, delimiter=';')
        writer = csv.writer(f_out, delimiter=';')

        header_fields = next(reader)
        writer.writerow(header_fields)  # keep header

        # Locate needed column indices
        try:
            idx_title = header_fields.index('Title')
            idx_price = header_fields.index('Price')
            idx_brand = header_fields.index('Brand')
            idx_sae = header_fields.index('Characteristics:SAE')
            idx_category = header_fields.index('Category')
            idx_seo_title = header_fields.index('SEO title')
            idx_seo_descr = header_fields.index('SEO descr')
            idx_seo_keywords = header_fields.index('SEO keywords')
        except ValueError as e:
            sys.exit(f"Не удалось найти нужную колонку: {e}")

        for row in reader:
            fields = row
            if len(fields) < len(header_fields):
                fields += [''] * (len(header_fields) - len(fields))

            # if empty — fill
            title = fields[idx_title].strip() or ''
            price = fields[idx_price].strip() or ''
            brand = fields[idx_brand].strip()
            sae = fields[idx_sae].strip()
            category = fields[idx_category].strip()

            if not fields[idx_seo_title]:
                fields[idx_seo_title] = title

            if not fields[idx_seo_descr]:
                descr = f"{title}. Цена {price} ₽. Быстрая доставка по России." if price else f"{title}. Быстрая доставка по России."
                fields[idx_seo_descr] = descr

            if not fields[idx_seo_keywords]:
                kw_set = set()
                kw_set.update(slugify(title))
                for token in (brand, sae, category):
                    kw_set.update(slugify(token))
                kw_set.update(['моторное масло', 'купить', 'цена'])
                fields[idx_seo_keywords] = ', '.join(sorted(kw_set))

            writer.writerow(fields)

    print(f"✅ SEO данные сгенерированы: {path_out}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Укажите путь к CSV файлу, экспортированному из Tilda.")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)

