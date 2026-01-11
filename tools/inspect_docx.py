from __future__ import annotations

from pathlib import Path
import sys

from docx import Document


def main() -> None:
    base = Path(__file__).resolve().parents[1] / "assets" / "webPages"
    default_files = [
        "CHURCH HISTORY.docx",
        "DEACONESSES.docx",
        "DEACONS.docx",
        "FACILITY RENTAL.docx",
        "GET IN TOUCH.docx",
        "LEADERSHIP & STAFF.docx",
        "ministries.docx",
        "OFFICIAL TEAM.docx",
    ]

    args = sys.argv[1:]
    if args:
        files = args
    else:
        files = default_files

    for name in files:
        path = base / name
        doc = Document(path)

        print(f"\n=== {name} ===")
        shown = 0
        for i, p in enumerate(doc.paragraphs):
            txt = p.text.strip()
            if not txt:
                continue
            print(f"{i:03d} [{p.style.name}] {txt[:160]}")
            shown += 1
            if shown >= 40:
                break


if __name__ == "__main__":
    main()
