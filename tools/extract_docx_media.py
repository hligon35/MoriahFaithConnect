from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path


def safe_slug(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"\.(docx)$", "", name)
    name = re.sub(r"[^a-z0-9]+", "_", name).strip("_")
    return name or "doc"


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    src_dir = repo_root / "assets" / "webPages"
    out_dir = repo_root / "mmmbc" / "ConImg" / "webPages"
    out_dir.mkdir(parents=True, exist_ok=True)

    mapping: dict[str, list[str]] = {}

    for docx_path in sorted(src_dir.glob("*.docx")):
        slug = safe_slug(docx_path.name)
        saved: list[str] = []

        with zipfile.ZipFile(docx_path) as z:
            media_files = [n for n in z.namelist() if n.startswith("word/media/")]
            for media_name in media_files:
                data = z.read(media_name)
                ext = Path(media_name).suffix.lower() or ".bin"
                out_name = f"{slug}_{Path(media_name).name}"
                out_path = out_dir / out_name
                out_path.write_bytes(data)
                saved.append(out_name)

        mapping[docx_path.name] = saved

    (repo_root / "assets" / "webPages" / "_extracted_images.json").write_text(
        json.dumps(mapping, indent=2), encoding="utf-8"
    )

    total = sum(len(v) for v in mapping.values())
    print(f"Extracted {total} image(s) into: {out_dir}")
    for k, v in mapping.items():
        if v:
            print(f"- {k}: {len(v)}")


if __name__ == "__main__":
    main()
