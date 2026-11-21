#!/usr/bin/env python3
"""Refresh data/media.json from the folders in images/projects.

Project sections name a folder. This script records the pictures, videos,
and documents in each folder so the site can show them without a file list
in projects.json. Run it after adding or removing files:

    python3 scripts/index-media.py
"""

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(ROOT, "images", "projects")
OUT = os.path.join(ROOT, "data", "media.json")

IMAGES = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEOS = {".mp4", ".webm"}
DOCS = {".pdf", ".pptx"}


def natural_key(name):
    return [
        int(part) if part.isdigit() else part.lower()
        for part in re.split(r"(\d+)", name)
    ]


def load_notes(path):
    notes = {}
    if not os.path.isfile(path):
        return notes
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return notes
    if not isinstance(data, dict):
        return notes
    for folder, groups in data.items():
        if not isinstance(groups, dict):
            continue
        for item in groups.get("images") or []:
            if not isinstance(item, dict):
                continue
            name = item.get("file")
            title = str(item.get("title") or "").strip()
            description = str(item.get("description") or "").strip()
            if name and (title or description):
                notes[(folder, name)] = {
                    "title": title,
                    "description": description,
                }
    return notes


def image_entry(folder, name, notes):
    note = notes.get((folder, name))
    if not note:
        return name
    entry = {"file": name}
    if note["title"]:
        entry["title"] = note["title"]
    if note["description"]:
        entry["description"] = note["description"]
    return entry


def main():
    notes = load_notes(OUT)
    catalog = {}
    for dirpath, dirnames, filenames in os.walk(IMAGES_DIR):
        dirnames[:] = [
            name
            for name in dirnames
            if not name.startswith(".") and not name.startswith("_")
        ]
        dirnames.sort(key=natural_key)
        groups = {"images": [], "videos": [], "docs": []}
        for name in filenames:
            if name.startswith("."):
                continue
            ext = os.path.splitext(name)[1].lower()
            if ext in IMAGES:
                groups["images"].append(name)
            elif ext in VIDEOS:
                groups["videos"].append(name)
            elif ext in DOCS:
                groups["docs"].append(name)
        if not any(groups.values()):
            continue
        rel = os.path.relpath(dirpath, IMAGES_DIR).replace(os.sep, "/")
        if rel == ".":
            rel = ""
        groups["images"] = [
            image_entry(rel, name, notes)
            for name in sorted(groups["images"], key=natural_key)
        ]
        groups["videos"].sort(key=natural_key)
        groups["docs"].sort(key=natural_key)
        catalog[rel] = groups

    ordered = {key: catalog[key] for key in sorted(catalog, key=natural_key)}
    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(ordered, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print("Wrote %s (%d folders)" % (os.path.relpath(OUT, ROOT), len(ordered)))


if __name__ == "__main__":
    main()
