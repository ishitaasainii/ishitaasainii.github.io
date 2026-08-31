#!/usr/bin/env python3
"""Check and correct the site's data JSON files.

Fixes things a hand edit often gets wrong: trailing commas, BOM, mixed
line endings, type slips, missing photos in a project list, and formatting.
Fails if a file cannot be parsed or a required field is missing.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
PROJECTS_DIR = ROOT / "images" / "projects"
ABOUT_DIR = ROOT / "images" / "about"

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

PROJECT_KEYS = (
    "id",
    "title",
    "category",
    "year",
    "location",
    "tagline",
    "description",
    "cover",
    "images",
)
ABOUT_KEYS = ("name", "role", "lead", "portrait", "description", "tools", "links")
QUOTE_KEYS = ("text", "author")
LINK_KEYS = ("label", "url")


def log(message: str) -> None:
    print(message)


def natural_key(name: str) -> list:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", name)]


def strip_trailing_commas(text: str) -> str:
    """Drop commas that sit before ] or }, ignoring anything inside strings."""
    out: list[str] = []
    in_string = False
    escape = False
    i = 0
    length = len(text)
    while i < length:
        ch = text[i]
        if in_string:
            out.append(ch)
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            i += 1
            continue
        if ch == '"':
            in_string = True
            out.append(ch)
            i += 1
            continue
        if ch == ",":
            j = i + 1
            while j < length and text[j] in " \t\r\n":
                j += 1
            if j < length and text[j] in "]}":
                i += 1
                continue
        out.append(ch)
        i += 1
    return "".join(out)


def parse_json(path: Path) -> tuple[object, list[str]]:
    notes: list[str] = []
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        raw = raw[3:]
        notes.append("removed UTF-8 BOM")
    text = raw.decode("utf-8")
    if "\r" in text:
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        notes.append("normalised line endings")
    try:
        return json.loads(text), notes
    except json.JSONDecodeError as first:
        repaired = strip_trailing_commas(text)
        if repaired != text:
            try:
                data = json.loads(repaired)
            except json.JSONDecodeError:
                pass
            else:
                notes.append("removed trailing commas")
                return data, notes
        raise ValueError(f"{path.relative_to(ROOT)} is not valid JSON: {first}") from first


def dump_json(data: object) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def as_nonempty_string(value: object, field: str, errors: list[str]) -> str | None:
    if not isinstance(value, str):
        errors.append(f"{field} must be a string")
        return None
    text = " ".join(value.split())
    if not text:
        errors.append(f"{field} must not be empty")
        return None
    return text


def as_string_list(value: object, field: str, errors: list[str]) -> list[str] | None:
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, list):
        errors.append(f"{field} must be a list of strings")
        return None
    items: list[str] = []
    for index, item in enumerate(value):
        if not isinstance(item, str):
            errors.append(f"{field}[{index}] must be a string")
            continue
        text = item.strip()
        if not text:
            errors.append(f"{field}[{index}] must not be empty")
            continue
        items.append(text)
    return items


def as_year(value: object, field: str, errors: list[str]) -> int | None:
    if isinstance(value, bool):
        errors.append(f"{field} must be a year")
        return None
    if isinstance(value, int):
        year = value
    elif isinstance(value, float) and value.is_integer():
        year = int(value)
    elif isinstance(value, str) and value.strip().isdigit():
        year = int(value.strip())
    else:
        errors.append(f"{field} must be a year")
        return None
    if year < 1900 or year > 2100:
        errors.append(f"{field} looks wrong ({year})")
        return None
    return year


def list_images(folder: Path) -> list[str]:
    if not folder.is_dir():
        return []
    names = [
        path.name
        for path in folder.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
    ]
    names.sort(key=natural_key)
    return names


def pick_cover(listed: str | None, files: list[str]) -> str | None:
    if listed and listed in files:
        return listed
    for preferred in ("cover.jpg", "cover.jpeg", "cover.png", "cover.webp"):
        if preferred in files:
            return preferred
    return files[0] if files else None


def ordered(data: dict, keys: tuple[str, ...]) -> dict:
    ordered_data = {key: data[key] for key in keys if key in data}
    for key, value in data.items():
        if key not in ordered_data:
            ordered_data[key] = value
    return ordered_data


def correct_project(project: object, index: int) -> tuple[dict | None, list[str], list[str]]:
    notes: list[str] = []
    errors: list[str] = []
    label = f"projects[{index}]"

    if not isinstance(project, dict) or isinstance(project, list):
        return None, notes, [f"{label} must be an object"]

    project_id = as_nonempty_string(project.get("id"), f"{label}.id", errors)
    if project_id and not SLUG_RE.match(project_id):
        errors.append(
            f"{label}.id must be lowercase letters, numbers, and hyphens only ({project_id!r})"
        )

    title = as_nonempty_string(project.get("title"), f"{label}.title", errors)
    category = as_nonempty_string(project.get("category"), f"{label}.category", errors)
    year = as_year(project.get("year"), f"{label}.year", errors)
    location = as_nonempty_string(project.get("location"), f"{label}.location", errors)
    tagline = as_nonempty_string(project.get("tagline"), f"{label}.tagline", errors)
    description = as_string_list(project.get("description"), f"{label}.description", errors)

    if errors or project_id is None:
        return None, notes, errors

    folder = PROJECTS_DIR / project_id
    files = list_images(folder)
    if not folder.is_dir():
        errors.append(f"{label}: missing folder images/projects/{project_id}/")
        return None, notes, errors
    if not files:
        errors.append(f"{label}: no photos in images/projects/{project_id}/")
        return None, notes, errors

    cover = project.get("cover")
    if cover is not None and not isinstance(cover, str):
        errors.append(f"{label}.cover must be a file name")
        return None, notes, errors
    cover_name = pick_cover(cover.strip() if isinstance(cover, str) else None, files)
    if cover_name is None:
        errors.append(f"{label}: could not choose a cover photo")
        return None, notes, errors
    if cover_name != cover:
        notes.append(f"{project_id}: set cover to {cover_name}")

    listed_images = project.get("images", [])
    if isinstance(listed_images, str):
        listed_images = [listed_images]
        notes.append(f"{project_id}: wrapped images in a list")
    if not isinstance(listed_images, list):
        errors.append(f"{label}.images must be a list of file names")
        return None, notes, errors

    gallery = [name for name in files if name != cover_name]
    cleaned: list[str] = []
    seen: set[str] = set()
    for name in listed_images:
        if not isinstance(name, str):
            notes.append(f"{project_id}: dropped a non-string image entry")
            continue
        name = name.strip()
        if not name or name == cover_name or name in seen:
            continue
        if name not in files:
            notes.append(f"{project_id}: dropped missing photo {name}")
            continue
        seen.add(name)
        cleaned.append(name)

    missing = [name for name in gallery if name not in seen]
    if missing:
        cleaned.extend(missing)
        notes.append(f"{project_id}: added {len(missing)} photo(s) from the folder")
    cleaned.sort(key=natural_key)

    if title is None or category is None or year is None or location is None or tagline is None or description is None:
        return None, notes, errors

    corrected = ordered(
        {
            "id": project_id,
            "title": title,
            "category": category,
            "year": year,
            "location": location,
            "tagline": tagline,
            "description": description,
            "cover": cover_name,
            "images": cleaned,
        },
        PROJECT_KEYS,
    )
    return corrected, notes, errors


def correct_projects(data: object) -> tuple[object | None, list[str], list[str]]:
    notes: list[str] = []
    errors: list[str] = []
    if not isinstance(data, list):
        return None, notes, ["projects.json must be a list of projects"]

    seen_ids: set[str] = set()
    corrected: list[dict] = []
    for index, project in enumerate(data):
        item, item_notes, item_errors = correct_project(project, index)
        notes.extend(item_notes)
        errors.extend(item_errors)
        if item is None:
            continue
        if item["id"] in seen_ids:
            errors.append(f"duplicate project id {item['id']!r}")
            continue
        seen_ids.add(item["id"])
        corrected.append(item)

    folders = {path.name for path in PROJECTS_DIR.iterdir() if path.is_dir()} if PROJECTS_DIR.is_dir() else set()
    unused = sorted(folders - seen_ids)
    if unused:
        notes.append("folders with no project entry: " + ", ".join(unused))

    if errors:
        return None, notes, errors
    return corrected, notes, errors


def correct_about(data: object) -> tuple[object | None, list[str], list[str]]:
    notes: list[str] = []
    errors: list[str] = []
    if not isinstance(data, dict) or isinstance(data, list):
        return None, notes, ["about.json must be an object"]

    name = as_nonempty_string(data.get("name"), "name", errors)
    role = as_nonempty_string(data.get("role"), "role", errors)
    lead = as_nonempty_string(data.get("lead"), "lead", errors)
    portrait = as_nonempty_string(data.get("portrait"), "portrait", errors)
    description = as_string_list(data.get("description"), "description", errors)
    tools = as_string_list(data.get("tools"), "tools", errors)

    links_raw = data.get("links", [])
    if not isinstance(links_raw, list):
        errors.append("links must be a list")
        links: list[dict] | None = None
    else:
        links = []
        for index, link in enumerate(links_raw):
            if not isinstance(link, dict):
                errors.append(f"links[{index}] must be an object")
                continue
            label = as_nonempty_string(link.get("label"), f"links[{index}].label", errors)
            url = as_nonempty_string(link.get("url"), f"links[{index}].url", errors)
            if label and url:
                links.append(ordered({"label": label, "url": url}, LINK_KEYS))

    if portrait and not (ABOUT_DIR / portrait).is_file():
        errors.append(f"missing portrait images/about/{portrait}")

    if errors or name is None or role is None or lead is None or portrait is None or description is None or tools is None or links is None:
        return None, notes, errors

    return (
        ordered(
            {
                "name": name,
                "role": role,
                "lead": lead,
                "portrait": portrait,
                "description": description,
                "tools": tools,
                "links": links,
            },
            ABOUT_KEYS,
        ),
        notes,
        errors,
    )


def correct_quotes(data: object) -> tuple[object | None, list[str], list[str]]:
    notes: list[str] = []
    errors: list[str] = []
    if not isinstance(data, list):
        return None, notes, ["quotes.json must be a list of quotes"]

    corrected: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for index, quote in enumerate(data):
        if not isinstance(quote, dict):
            errors.append(f"quotes[{index}] must be an object")
            continue
        text = as_nonempty_string(quote.get("text"), f"quotes[{index}].text", errors)
        author = as_nonempty_string(quote.get("author"), f"quotes[{index}].author", errors)
        if text is None or author is None:
            continue
        key = (text, author)
        if key in seen:
            notes.append(f"dropped duplicate quote by {author}")
            continue
        seen.add(key)
        corrected.append(ordered({"text": text, "author": author}, QUOTE_KEYS))

    if errors:
        return None, notes, errors
    if not corrected:
        return None, notes, ["quotes.json must contain at least one quote"]
    return corrected, notes, errors


HANDLERS = {
    "projects.json": correct_projects,
    "about.json": correct_about,
    "quotes.json": correct_quotes,
}


def process_file(path: Path, write: bool) -> int:
    rel = path.relative_to(ROOT)
    try:
        data, parse_notes = parse_json(path)
    except (OSError, UnicodeDecodeError, ValueError) as exc:
        log(f"ERROR  {rel}: {exc}")
        return 1

    handler = HANDLERS.get(path.name)
    if handler is None:
        log(f"ERROR  {rel}: unknown data file")
        return 1

    corrected, notes, errors = handler(data)
    for note in parse_notes + notes:
        kind = "note" if note.startswith("folders with no project") else "fix"
        log(f"{kind:<6} {rel}: {note}")
    if errors:
        for error in errors:
            log(f"ERROR  {rel}: {error}")
        return 1

    rendered = dump_json(corrected)
    current = path.read_text(encoding="utf-8")
    if current == rendered:
        log(f"ok     {rel}")
        return 0

    if write:
        path.write_text(rendered, encoding="utf-8", newline="\n")
        log(f"wrote  {rel}")
        return 0

    log(f"ERROR  {rel}: would be rewritten (run without --check)")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="report problems without writing files",
    )
    args = parser.parse_args()

    files = [DATA_DIR / name for name in HANDLERS]
    missing = [path for path in files if not path.is_file()]
    if missing:
        for path in missing:
            log(f"ERROR  missing {path.relative_to(ROOT)}")
        return 1

    status = 0
    for path in files:
        status |= process_file(path, write=not args.check)
    return status


if __name__ == "__main__":
    sys.exit(main())
