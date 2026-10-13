"""Render every page of a dashboard PDF to page-N.jpg next to the PDF.

The website shows these images in a swipeable viewer and links the PDF for download.

Usage:
    python scripts/render-dashboard-pdf-pages.py public/dashboard-files/<slug>/report.pdf

Requires: pip install pymupdf
"""

import sys
from pathlib import Path

TARGET_WIDTH_PX = 1800  # sharp on retina laptops, still light on phones
JPEG_QUALITY = 80


def render(pdf_path: Path) -> int:
    import pymupdf

    out_dir = pdf_path.parent
    for old in out_dir.glob("page-*.jpg"):
        old.unlink()

    with pymupdf.open(pdf_path) as doc:
        for index, page in enumerate(doc, start=1):
            zoom = TARGET_WIDTH_PX / page.rect.width
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
            pixmap.save(out_dir / f"page-{index}.jpg", jpg_quality=JPEG_QUALITY)
        return doc.page_count


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    pdf_path = Path(sys.argv[1])
    if pdf_path.suffix.lower() != ".pdf" or not pdf_path.is_file():
        sys.exit(f"Not a PDF file: {pdf_path}")
    try:
        count = render(pdf_path)
    except ImportError:
        sys.exit("pymupdf is missing. Run: pip install pymupdf")
    print(f"Rendered {count} page(s) into {pdf_path.parent}")


if __name__ == "__main__":
    main()
