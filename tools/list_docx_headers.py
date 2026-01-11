from __future__ import annotations

import re
import sys
from pathlib import Path

from docx import Document


HEADER_RE = re.compile(r"^(Rev\.|Reverend|Pastor|Elder|Evangelist|Minister)\b", re.IGNORECASE)


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python tools/list_docx_headers.py <docx>")
        raise SystemExit(2)

    docx_path = Path(sys.argv[1])
    doc = Document(docx_path)

    for i, p in enumerate(doc.paragraphs):
        text = p.text.replace("\u00a0", " ").strip()
        if not text:
            continue
        if len(text) <= 60 and HEADER_RE.search(text):
            print(f"{i:03d} {text}")


if __name__ == "__main__":
    main()
