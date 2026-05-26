#!/usr/bin/env python3
"""Fetch the NEHS sports award table and regenerate award-site/awards-data.js.

This script uses only Python's standard library so it can run on a Mac, a small
school server, cron, launchd, or a GitHub Action without installing packages.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen


DEFAULT_URL = "https://jedi.nehs.hc.edu.tw/sport/award2.php"
DEFAULT_OUTPUT = "award-site/awards-data.js"

RANK_NUMBERS = {
    "第一名": 1,
    "第二名": 2,
    "第三名": 3,
    "第四名": 4,
    "第五名": 5,
    "第六名": 6,
}

HIGH_GRADE_NUMBERS = {"一": 10, "二": 11, "三": 12}
MIDDLE_GRADE_NUMBERS = {"一": 7, "二": 8, "三": 9}
BILINGUAL_GRADE_NUMBERS = {
    "七年": 7,
    "八年": 8,
    "九年": 9,
    "十年": 10,
    "十一年": 11,
    "十二年": 12,
}


def clean_cell(value: str) -> str:
    value = re.sub(r"</?pre>", "", value, flags=re.I)
    value = re.sub(r"<br\s*/?>", "", value, flags=re.I)
    value = re.sub(r"<[^>]*>", "", value)
    value = html.unescape(value).replace("\xa0", " ")
    return re.sub(r"\s+", " ", value).strip()


def split_event(raw_event: str) -> dict[str, str]:
    match = re.match(r"^(.*?)\s+(Gr\.\s.*)$", raw_event)
    return {
        "eventName": (match.group(1) if match else raw_event).strip(),
        "eventEn": (match.group(2) if match else "").strip(),
    }


def classify_type(event_name: str) -> str:
    if "400公尺接力" in event_name:
        return "400公尺接力"
    if "1200公尺接力" in event_name:
        return "1200公尺接力"
    if "100公尺" in event_name and "接力" not in event_name:
        return "100公尺"
    if "200公尺" in event_name:
        return "200公尺"
    if "400公尺" in event_name and "接力" not in event_name:
        return "400公尺"
    if "800公尺" in event_name:
        return "800公尺"
    if "1500公尺" in event_name:
        return "1500公尺"
    if "跳遠" in event_name:
        return "跳遠"
    if "鉛球" in event_name:
        return "鉛球"
    if "跳高" in event_name:
        return "跳高"
    return "全部"


def parse_rank(raw_rank: str) -> dict[str, str | int]:
    match = re.match(r"^(第[一二三四五六七八九十]+名)\s+(.+)$", raw_rank)
    rank_text = match.group(1) if match else raw_rank
    return {
        "rank": RANK_NUMBERS.get(rank_text, 0),
        "rankText": rank_text,
        "rankEn": match.group(2) if match else "",
    }


def parse_grade_class(raw_grade_class: str) -> dict[str, str | int]:
    parts = raw_grade_class.split(maxsplit=1)
    school_unit = parts[0] if parts else ""
    grade_class = parts[1] if len(parts) > 1 else ""

    if school_unit == "高中部":
        match = re.match(r"^([一二三])年(.+)$", grade_class)
        return {
            "department": "中學部",
            "schoolUnit": school_unit,
            "gradeNumber": HIGH_GRADE_NUMBERS.get(match.group(1), 0) if match else 0,
            "gradeLabel": f"高{match.group(1)}" if match else grade_class,
            "className": match.group(2) if match else "",
        }

    if school_unit == "國中部":
        match = re.match(r"^([一二三])年(.+)$", grade_class)
        return {
            "department": "中學部",
            "schoolUnit": school_unit,
            "gradeNumber": MIDDLE_GRADE_NUMBERS.get(match.group(1), 0) if match else 0,
            "gradeLabel": f"國{match.group(1)}" if match else grade_class,
            "className": match.group(2) if match else "",
        }

    if school_unit == "雙語部":
        match = re.match(r"^(七年|八年|九年|十年|十一年|十二年)(.+)$", grade_class)
        return {
            "department": "雙語部",
            "schoolUnit": school_unit,
            "gradeNumber": BILINGUAL_GRADE_NUMBERS.get(match.group(1), 0) if match else 0,
            "gradeLabel": match.group(1) if match else grade_class,
            "className": match.group(2) if match else "",
        }

    return {
        "department": "雙語部" if school_unit == "雙語部" else "中學部",
        "schoolUnit": school_unit,
        "gradeNumber": 0,
        "gradeLabel": grade_class,
        "className": "",
    }


def slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9\u3400-\u9fff]+", "-", value).strip("-").lower()
    return slug or "record"


def parse_records(source_html: str) -> list[dict[str, object]]:
    normalized = re.sub(r"(?i)<tr>\s*<td>", "\n<TR><TD>", source_html)
    rows = [
        line.strip()
        for line in normalized.splitlines()
        if re.match(r"^<tr>\s*<td>", line, flags=re.I)
        and "<TD>Event<TD>" not in line
    ]

    records: list[dict[str, object]] = []
    for index, line in enumerate(rows):
        line = re.sub(r"^<tr\b[^>]*>\s*", "", line, flags=re.I)
        cells = [clean_cell(cell) for cell in re.split(r"<td\b[^>]*>", line, flags=re.I)[1:]]
        if len(cells) < 8:
            continue

        padded = cells + [""] * (10 - len(cells))
        raw_event, raw_rank, raw_grade_class, name1, name2, name3, name4, score, note, entered_at = padded[:10]
        event = split_event(raw_event)
        rank = parse_rank(raw_rank)
        grade = parse_grade_class(raw_grade_class)
        people = [name for name in [name1, name2, name3, name4] if name]

        record: dict[str, object] = {
            "id": f"{slugify(event['eventName'])}-{rank['rank'] or 'rank'}-{slugify(raw_grade_class)}-{index + 1}",
            **grade,
            "rawName": " / ".join(people),
            "type": classify_type(event["eventName"]),
            **event,
            "group": (re.search(r"(男子組|女子組|混合組)", event["eventName"]) or [""])[0],
            **rank,
            "score": score,
        }
        if len(people) > 1:
            record["members"] = people
        if note:
            record["note"] = note
        if entered_at:
            record["enteredAt"] = entered_at
        records.append(record)

    return records


def fetch_html(url: str, timeout: int) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "NEHS-Awards-Updater/1.0",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def build_output(records: list[dict[str, object]], source_url: str) -> str:
    updated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    data = json.dumps(records, ensure_ascii=False, indent=2)
    return (
        f"// Generated from {source_url} at {updated_at}. Do not edit by hand.\n"
        f"window.AWARD_RECORDS_UPDATED_AT = {json.dumps(updated_at)};\n"
        f"window.AWARD_RECORDS_SOURCE_URL = {json.dumps(source_url, ensure_ascii=False)};\n"
        f"window.AWARD_RECORDS = {data};\n"
    )


def write_if_changed(output_path: Path, content: str, backup: bool) -> bool:
    old_content = output_path.read_text("utf-8") if output_path.exists() else None
    if old_content == content:
        return False

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if backup and old_content is not None:
        backup_path = output_path.with_suffix(output_path.suffix + ".bak")
        backup_path.write_text(old_content, "utf-8")

    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        delete=False,
        dir=output_path.parent,
        prefix=output_path.name + ".",
        suffix=".tmp",
    ) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    os.replace(tmp_path, output_path)
    return True


def update_once(args: argparse.Namespace) -> int:
    source_html = fetch_html(args.url, args.timeout)
    if args.html_cache:
        Path(args.html_cache).write_text(source_html, "utf-8")

    records = parse_records(source_html)
    if len(records) < args.min_records:
        raise RuntimeError(
            f"Only parsed {len(records)} records. Refusing to overwrite {args.output}."
        )

    content = build_output(records, args.url)
    changed = write_if_changed(Path(args.output), content, args.backup)
    status = "updated" if changed else "unchanged"
    print(f"{datetime.now().isoformat(timespec='seconds')} {status}: {len(records)} records -> {args.output}")
    return len(records)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Auto-update NEHS award records.")
    parser.add_argument("--url", default=DEFAULT_URL, help="Source award table URL.")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output awards-data.js path.")
    parser.add_argument("--html-cache", help="Optional path to save the fetched HTML.")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds.")
    parser.add_argument("--min-records", type=int, default=100, help="Safety threshold before overwriting.")
    parser.add_argument("--backup", action="store_true", help="Write awards-data.js.bak before changing.")
    parser.add_argument(
        "--watch-seconds",
        type=int,
        default=0,
        help="If set, keep running and update every N seconds.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.watch_seconds <= 0:
        update_once(args)
        return 0

    while True:
        try:
            update_once(args)
        except Exception as error:  # Keep the watcher alive during network hiccups.
            print(f"{datetime.now().isoformat(timespec='seconds')} update failed: {error}", file=sys.stderr)
        time.sleep(args.watch_seconds)


if __name__ == "__main__":
    raise SystemExit(main())
