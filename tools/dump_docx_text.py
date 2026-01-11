from __future__ import annotations

import sys
from pathlib import Path

from docx import Document


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python tools/dump_docx_text.py <relative-path-to-docx>")
        raise SystemExit(2)

    docx_path = Path(sys.argv[1])
    doc = Document(docx_path)

    items = [(i, p.style.name, p.text.replace("\u00a0", " ").strip()) for i, p in enumerate(doc.paragraphs)]
    items = [(i, style, text) for i, style, text in items if text]

    print(f"non-empty: {len(items)}")
    for i, style, text in items:
        print(f"{i:03d} [{style}] {text}")


if __name__ == "__main__":
    main()
