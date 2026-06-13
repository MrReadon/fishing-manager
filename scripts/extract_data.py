from __future__ import annotations

import json
import re
from pathlib import Path

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "mastersheet.xlsx"
OUTPUT = ROOT / "data.js"
FISH_IMAGE_DIR = ROOT / "assets" / "fish"

WATER_RU = {
    "Freshwater": "Пресная вода",
    "Saltwater": "Соленая вода",
}

FISH_RU = {
    "Belphoret Bass": "Бас Белфорет",
    "Silver Anchovy": "Серебряный анчоус",
    "Largemouth Bass": "Большеротый окунь",
    "Pink Cod": "Розовая треска",
    "Banded Butterflyfish": "Полосатая рыба-бабочка",
    "Arowana": "Арована",
    "Taion Moray Eel": "Мурена Тайон",
    "Fonsine Barracuda": "Барракуда Фонсин",
    "Ballan Wrasse": "Губан Баллан",
    "Dolly Varden Trout": "Голец Долли Варден",
    "Azure fishes (10 types)": "Лазурные рыбы (10 видов)",
    "Lava Starfish": "Лавовая морская звезда",
    "Leaf Sea Horse": "Листовой морской конек",
    "Amberjack": "Сериола",
    "Pajama Cardinalfish": "Пижамная рыба-кардинал",
    "Imp Catalufa": "Каталуфа беса",
    "Flame Fish": "Огненная рыба",
    "Barracuda": "Барракуда",
    "Ruby Phantasmal Fish": "Рубиновая призрачная рыба",
    "Amber Phantasmal Fish": "Янтарная призрачная рыба",
    "Topaz Phantasmal Fish": "Топазовая призрачная рыба",
    "Emerald Phantasmal Fish": "Изумрудная призрачная рыба",
    "Crystal Phantasmal Fish": "Кристальная призрачная рыба",
    "Sapphire Phantasmal Fish": "Сапфировая призрачная рыба",
    "Lavender Phantasmal Fish": "Лавандовая призрачная рыба",
    "Rose Phantasmal Fish": "Розовая призрачная рыба",
    "Lanquis Barracuda": "Барракуда Ланкис",
    "Ghost Thornfish": "Призрачная рыба-шип",
    "Lava Catfish": "Лавовый сом",
    "Aurora Starfish": "Морская звезда Аврора",
    "Solisium Carp": "Карп Солизиума",
    "Striped Mackerel": "Полосатая скумбрия",
    "Black Bream": "Черный лещ",
    "Small-Mouthed Rockfish": "Малоротый морской окунь",
    "Squid": "Кальмар",
    "Rainbow Ray-Finned Fish": "Радужная лучеперая рыба",
    "Obsidian Starfish": "Обсидиановая морская звезда",
    "Luderick": "Людерик",
    "Bluegill": "Синежаберник",
    "Lava Eel": "Лавовый угорь",
    "Blacktail Snook": "Чернохвостый снук",
    "Blue filefish": "Синий файлефиш",
    "Mackerel": "Скумбрия",
    "Lanquis Carp": "Карп Ланкис",
    "Mullet": "Кефаль",
    "Swamp Eel": "Болотный угорь",
    "Swamp Mudfish": "Болотная илистая рыба",
    "Mahi Mahi": "Махи-махи",
    "Horse Mackerel": "Ставрида",
    "Ice Smelt": "Ледяная корюшка",
    "Skipjack Tuna": "Тунец-скипджек",
    "Mantis Shrimp": "Креветка-богомол",
    "Discus": "Дискус",
    "Sunspot Rockfish": "Солнечно-пятнистый морской окунь",
    "Mushroom Jellyfish": "Грибная медуза",
    "Striped Crimson Seabream": "Полосатый багровый морской карась",
    "Pennant Coralfish": "Вымпельная коралловая рыба",
    "Heliber Goldfish": "Золотая рыбка Хелибер",
    "Red Salmon": "Красный лосось",
    "Peacock Bass": "Павлиний окунь",
    "Blacktip Shark": "Черноперая акула",
    "Kahawai": "Кахавай",
    "Sea Cockatrice": "Морской кокатрикс",
    "Lanquis Bass": "Бас Ланкис",
}

LOCATION_RU = {
    "Freshwater": "Пресная вода",
    "Saltwater": "Соленая вода",
    "Kastleton": "Каслтон",
    "Golden Rye Pastures": "Золотые нивы",
    "Blackhowl Plains": "Воющие равнины",
    "Urstella Fields": "Урстеллийские поля",
    "Carmine Forest": "Карминовый лес",
    "Nesting Grounds": "Дикие гнездовья",
    "Windhill Shores": "Ветреная отмель",
    "Daybreak Shore": "Рассветный берег",
    "Laslan Coast": "Побережье Ласлана",
    "Vienta Village": "Виента",
    "Veder Mountains": "Горы Ведер",
    "Sanctuary Oasis": "Священный оазис",
    "Moonlight Desert": "Лунная пустыня",
    "Syleus's Abyss Entrance": "Вход в Бездну Силеуса",
    "Syleus's Abyss 4F": "Бездна Силеуса, 4 этаж",
    "Syleus's Abyss 5F": "Бездна Силеуса, 5 этаж",
    "Syleus's Abyss 6F": "Бездна Силеуса, 6 этаж",
    "Watcher's Post": "Пост Смотрителя",
    "Akidu Valley": "Долина Акиду",
    "Stoneguard Coast": "Побережье Стоунгарда",
    "Stonegard Coast": "Побережье Стоунгарда",
    "Purelight Tower": "Светозарная башня",
    "Purelight Hill": "Светозарный холм",
    "Ruins of Turayne": "Развалины Турайна",
    "Tevent Temple (raining)": "Храм Тевента (дождь)",
    "Fonos Basin": "Фоносская котловина",
    "Stoneguard Castle (raining)": "Замок Стоунгард (дождь)",
    "Hall of Illusion": "Зал иллюзий",
    "Sanctum of Desire B1": "Святилище желания B1",
    "Sanctum of Desire Depths": "Глубины Святилища желания",
    "Quietis's Demesne": "Владения Квиетиса",
    "Forest of The Great Tree": "Лес Великого дерева",
    "Deluzhnoa Temple": "Храм Делузноа",
    "Bercant Manor": "Поместье Беркант",
    "Akidu Lake (needs rain)": "Озеро Акиду (нужен дождь)",
    "Herba Village": "Деревня Херба",
    "Swamp of Silence": "Болото тишины",
    "Black Anvil Forge": "Кузница Черной наковальни",
    "Temple of Truth B1": "Храм истины B1",
    "Temple of Truth Entrance": "Вход в Храм истины",
    "Red Fog Island": "Остров красного тумана",
    "Crimson Manor": "Багровое поместье",
    "Crimson Mansion B2": "Багровый особняк B2",
    "Grayclaw Forest": "Лес Серого когтя",
    "Greyclaw Forest": "Лес Серого когтя",
    "Saurodoma Island": "Остров Сауродома",
}


def ru(mapping: dict[str, str], value: str) -> str:
    return mapping.get(value, value)


def slugify(value: str) -> str:
    value = value.lower().replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "fish"


def extract_fish_images(ws) -> dict[int, str]:
    FISH_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    image_by_row = {}

    for image in getattr(ws, "_images", []):
        marker = getattr(image.anchor, "_from", None)
        if marker is None:
            continue

        row = marker.row + 1
        col = marker.col + 1
        fish_name = ws.cell(row, 3).value or ws.cell(row, 2).value

        if col != 2 or not fish_name:
            continue

        fish_en = str(fish_name).replace("\n", " ").strip()
        extension = (getattr(image, "format", None) or "png").lower()
        if extension == "jpeg":
            extension = "jpg"

        filename = f"{slugify(fish_en)}.{extension}"
        output_path = FISH_IMAGE_DIR / filename
        output_path.write_bytes(image._data())
        image_by_row[row] = f"assets/fish/{filename}"

    return image_by_row


def main() -> None:
    wb = load_workbook(SOURCE, data_only=True)
    ws = wb["Master Sheet"]
    image_by_row = extract_fish_images(ws)
    fish_rows = []
    current = None

    for row in range(2, ws.max_row + 1):
        fish_name = ws.cell(row, 3).value or ws.cell(row, 2).value
        level = ws.cell(row, 4).value
        water = ws.cell(row, 5).value
        habitat = ws.cell(row, 6).value

        if fish_name:
            fish_en = str(fish_name).replace("\n", " ").strip()
            water_en = str(water).strip() if water else ""
            current = {
                "id": f"fish-{len(fish_rows) + 1}",
                "name": {"en": fish_en, "ru": ru(FISH_RU, fish_en)},
                "level": int(level) if isinstance(level, float) and level.is_integer() else level,
                "waterType": {"en": water_en, "ru": ru(WATER_RU, water_en)},
                "image": image_by_row.get(row),
                "locations": [],
            }
            fish_rows.append(current)

        if current and habitat:
            location_en = str(habitat).strip()
            location = {"en": location_en, "ru": ru(LOCATION_RU, location_en)}
            if location not in current["locations"]:
                current["locations"].append(location)

    payload = {
        "source": "T&L Fishing Mastersheet.xlsx",
        "generatedFromRows": ws.max_row,
        "fish": fish_rows,
    }
    OUTPUT.write_text(
        "window.FISHING_DATA = "
        + json.dumps(payload, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT} with {len(fish_rows)} fish")


if __name__ == "__main__":
    main()
