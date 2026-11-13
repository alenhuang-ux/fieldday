#!/usr/bin/env python3
"""Append award-record differences to award-site/update-history.json.

Compares the previously committed awards-data.js with the freshly generated one
and records additions, removals, and rank/score/name changes so the website can
show a durable update history.

Usage:
    python record_update_history.py \
        --previous /tmp/previous-awards-data.js \
        --current award-site/awards-data.js \
        --history award-site/update-history.json

First run (no history file yet) seeds the baseline silently so the history
starts from the next real change instead of one huge initial diff.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

MAX_ENTRIES_DEFAULT = 500

FIELD_LABELS = {
    "rankText": "名次",
    "score": "成績",
    "note": "備註",
}


def load_records(path: Path) -> list[dict]:
    """Extract the JSON array from an awards-data.js file."""
    text = path.read_text("utf-8")
    marker = "window.AWARD_RECORDS = "
    start = text.find(marker)
    if start == -1:
        raise RuntimeError(f"{path} 找不到 window.AWARD_RECORDS")
    start += len(marker)
    end = text.rfind(";")
    return json.loads(text[start:end])


def people_text(record: dict) -> str:
    members = record.get("members")
    if isinstance(members, list) and members:
        return "、".join(str(m) for m in members)
    return str(record.get("rawName") or "")


def class_text(record: dict) -> str:
    parts = [record.get("schoolUnit"), record.get("gradeLabel"), record.get("className")]
    return " ".join(str(p) for p in parts if p)


def index_by_id(records: list[dict]) -> dict[str, dict]:
    return {str(r.get("id")): r for r in records}


def diff_record(old: dict, new: dict) -> list[dict]:
    changes = []
    for field, label in FIELD_LABELS.items():
        before = str(old.get(field) or "")
        after = str(new.get(field) or "")
        if before != after:
            changes.append({"label": label, "before": before, "after": after})
    old_people = people_text(old)
    new_people = people_text(new)
    if old_people != new_people:
        changes.append({"label": "名單", "before": old_people, "after": new_people})
    return changes


def base_entry(record: dict) -> dict:
    return {
        "eventName": str(record.get("eventName") or ""),
        "people": people_text(record),
        "classText": class_text(record),
    }


def build_entries(previous: list[dict], current: list[dict], now: str) -> list[dict]:
    old_map = index_by_id(previous)
    new_map = index_by_id(current)
    entries: list[dict] = []

    for record_id, new in new_map.items():
        old = old_map.get(record_id)
        if old is None:
            entries.append({
                "time": now,
                "type": "added",
                **base_entry(new),
                "changes": [{
                    "label": "新增",
                    "before": "",
                    "after": f"{new.get('rankText', '')} {new.get('score', '')}".strip(),
                }],
            })
            continue
        changes = diff_record(old, new)
        if changes:
            entries.append({
                "time": now,
                "type": "changed",
                **base_entry(new),
                "changes": changes,
            })

    for record_id, old in old_map.items():
        if record_id not in new_map:
            entries.append({
                "time": now,
                "type": "removed",
                **base_entry(old),
                "changes": [{
                    "label": "移除",
                    "before": f"{old.get('rankText', '')} {old.get('score', '')}".strip(),
                    "after": "",
                }],
            })

    return entries


def main() -> int:
    parser = argparse.ArgumentParser(description="Record award update history.")
    parser.add_argument("--previous", required=True, help="先前版本的 awards-data.js")
    parser.add_argument("--current", required=True, help="本次產生的 awards-data.js")
    parser.add_argument("--history", required=True, help="update-history.json 路徑")
    parser.add_argument("--max-entries", type=int, default=MAX_ENTRIES_DEFAULT)
    args = parser.parse_args()

    history_path = Path(args.history)
    current_path = Path(args.current)
    previous_path = Path(args.previous)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    if history_path.exists():
        history = json.loads(history_path.read_text("utf-8"))
    else:
        history = None

    current_records = load_records(current_path)

    if history is None:
        # 第一次啟用：以目前資料為基準，從下一次異動才開始記錄。
        history = {
            "version": 1,
            "seededAt": now,
            "updatedAt": now,
            "entries": [],
        }
        history_path.parent.mkdir(parents=True, exist_ok=True)
        history_path.write_text(
            json.dumps(history, ensure_ascii=False, indent=2), "utf-8"
        )
        print(f"history seeded ({len(current_records)} records baseline) -> {history_path}")
        return 0

    if not previous_path.exists():
        print("no previous snapshot; skip diff", file=sys.stderr)
        return 0

    previous_records = load_records(previous_path)
    new_entries = build_entries(previous_records, current_records, now)

    if new_entries:
        history["entries"] = (history.get("entries") or []) + new_entries
        history["entries"] = history["entries"][-args.max_entries :]
        history["updatedAt"] = now
        history_path.write_text(
            json.dumps(history, ensure_ascii=False, indent=2), "utf-8"
        )
        print(f"history +{len(new_entries)} entries (total {len(history['entries'])})")
    else:
        print("history unchanged")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
