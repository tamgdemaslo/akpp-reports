#!/usr/bin/env python3
"""
Split gearbox_data.yaml into individual JS files per gearbox and update gearbox_files/gearbox_index.js.

Each generated file will be placed in gearbox_files/<GearboxKey>.js and will contain:
// Auto-generated from gearbox_data.yaml
window.gearboxData = {
    "<GearboxKey>": { ... }
};

The index file will list all generated filenames.
"""

import yaml
import json
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent
YAML_PATH = BASE_DIR / 'gearbox_data.yaml'
OUTPUT_DIR = BASE_DIR / 'gearbox_files'
INDEX_FILE = OUTPUT_DIR / 'gearbox_index.js'


def main():
    if not YAML_PATH.exists():
        print(f"YAML file not found: {YAML_PATH}")
        sys.exit(1)

    # Quick splitter without relying on full YAML validity: parse manually
    # We'll extract blocks for each gearbox manually to avoid YAML syntax problems.
    inside_gearboxes = False
    current_key = None
    current_block = []
    gearboxes = {}

    with YAML_PATH.open(encoding='utf-8') as f:
        for line in f:
            if not inside_gearboxes:
                if line.startswith('gearboxes:'):
                    inside_gearboxes = True
                continue
            # Detect new gearbox start: either correct 2-space indent or missing indent
            if ((line.startswith('  ') and not line.startswith('    ')) or not line.startswith(' ')) and ':' in line:
                # Save previous block
                if current_key:
                    try:
                        gearboxes[current_key] = yaml.safe_load('\n'.join(current_block))[current_key]
                    except Exception as e:
                        print(f"⚠️  Skipping {current_key} due to YAML error: {e}")
                # Start new block
                current_key = line.strip().rstrip(':')
                current_block = [line]
            else:
                if inside_gearboxes:
                    current_block.append(line)
    # Save last block
    if current_key and current_block:
        try:
            gearboxes[current_key] = yaml.safe_load('\n'.join(current_block))[current_key]
        except Exception as e:
            print(f"⚠️  Skipping {current_key} due to YAML error: {e}")

    OUTPUT_DIR.mkdir(exist_ok=True)
    index_entries = []

    for key, value in gearboxes.items():
        file_name = f"{key}.js"
        file_path = OUTPUT_DIR / file_name
        js_content = (
            f"// Auto-generated from gearbox_data.yaml – {key}\n"
            "window.gearboxData = {\n" +
            json.dumps({key: value}, ensure_ascii=False, indent=4) +
            "\n};\n"
        )
        file_path.write_text(js_content, encoding='utf-8')
        index_entries.append(f'    "{file_name}",')
        print(f"✔ Generated {file_name}")

    # Write index file
    index_content = (
        "// Автоматически сгенерированный индекс файлов АКПП\n"
        "window.gearboxIndex = [\n" +
        "\n".join(index_entries) +
        "\n];\n"
    )
    INDEX_FILE.write_text(index_content, encoding='utf-8')
    print(f"✔ Updated {INDEX_FILE.relative_to(BASE_DIR)}")


if __name__ == '__main__':
    main()

