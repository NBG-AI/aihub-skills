#!/usr/bin/env python3
"""Render a .pptx to one PNG per slide for visual QA.

Engines:
  soffice     LibreOffice headless (default). Uses a throw-away profile into which the
              Aptos faces bundled with Microsoft Office (if installed on this Mac) are
              copied, so previews use the real typeface instead of a substitute.
  powerpoint  Microsoft PowerPoint via AppleScript (macOS only; opens the app). The
              most faithful renderer - use it for the final check when available.

Usage:
    source .venv/bin/activate
    python preview_deck.py <deck>.pptx [--out DIR] [--engine soffice|powerpoint] [--dpi 96]
Prints the absolute path of every PNG written.
"""

from __future__ import annotations

import argparse
import glob
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

APTOS_DIRS = [
    "/Applications/Microsoft PowerPoint.app/Contents/Resources/DFonts",
    "/Applications/Microsoft Word.app/Contents/Resources/DFonts",
    os.path.expanduser("~/Library/Fonts"),
    "/Library/Fonts",
]


def _find_aptos() -> list[Path]:
    """The core Aptos family only (Light / Regular / SemiBold / Bold + italics). Serif,
    Mono, Narrow and Display faces are excluded so LibreOffice's style matching cannot
    pick a serif italic for `Aptos` italic."""
    out: dict[str, Path] = {}
    for d in APTOS_DIRS:
        for f in glob.glob(os.path.join(d, "Aptos*.ttf")):
            name = Path(f).name
            if any(k in name for k in ("Serif", "Mono", "Narrow", "Display")):
                continue
            out.setdefault(name, Path(f))
    return list(out.values())


def render_soffice(deck: Path, out_dir: Path) -> Path:
    soffice = shutil.which("soffice") or "/Applications/LibreOffice.app/Contents/MacOS/soffice"
    if not Path(soffice).exists():
        raise SystemExit("LibreOffice (soffice) not found; install it or use --engine powerpoint")
    profile = Path(tempfile.mkdtemp(prefix="nbg-lo-profile-"))
    fonts = _find_aptos()
    if fonts:
        fdir = profile / "user" / "fonts"
        fdir.mkdir(parents=True)
        for f in fonts:
            shutil.copy(f, fdir / f.name)
        print(f"preview: {len(fonts)} Aptos faces loaded into the temporary LibreOffice profile")
    else:
        print("preview: WARNING - no Aptos faces found on this machine; LibreOffice will substitute a fallback font, so text widths are approximate", file=sys.stderr)
    cmd = [soffice, "--headless", f"-env:UserInstallation={profile.as_uri()}", "--convert-to", "pdf", "--outdir", str(out_dir), str(deck)]
    subprocess.run(cmd, check=True, capture_output=True, timeout=300)
    pdf = out_dir / (deck.stem + ".pdf")
    if not pdf.exists():
        raise SystemExit("LibreOffice did not produce a PDF")
    shutil.rmtree(profile, ignore_errors=True)
    return pdf


def render_powerpoint(deck: Path, out_dir: Path) -> Path:
    if sys.platform != "darwin":
        raise SystemExit("--engine powerpoint is macOS only")
    pdf = out_dir / (deck.stem + ".pdf")
    script = f'''
    tell application "Microsoft PowerPoint"
        open POSIX file "{deck}"
        set p to active presentation
        save p in POSIX file "{pdf}" as save as PDF
        close p saving no
    end tell
    '''
    res = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=300)
    if res.returncode != 0 or not pdf.exists():
        raise SystemExit(
            "PowerPoint export failed: " + (res.stderr.strip() or "no PDF written") + "\n"
            "Common causes: the deck is already open in PowerPoint, or a dialog (e.g. a sensitivity-label prompt) is waiting in the PowerPoint window. "
            "Close it and retry, or use --engine soffice."
        )
    return pdf


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("deck", type=Path)
    ap.add_argument("--out", type=Path, default=None, help="output directory (default: <deck-dir>/previews/<deck-stem>)")
    ap.add_argument("--engine", choices=["soffice", "powerpoint"], default="soffice")
    ap.add_argument("--dpi", type=int, default=96)
    args = ap.parse_args()
    deck = args.deck.resolve()
    if not deck.exists():
        raise SystemExit(f"no such deck: {deck}")
    out_dir = (args.out or deck.parent / "previews" / deck.stem).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("slide-*.png"):
        old.unlink()
    pdf = render_powerpoint(deck, out_dir) if args.engine == "powerpoint" else render_soffice(deck, out_dir)
    if not shutil.which("pdftoppm"):
        raise SystemExit("pdftoppm (poppler) not found; install poppler")
    subprocess.run(["pdftoppm", "-r", str(args.dpi), "-png", str(pdf), str(out_dir / "slide")], check=True)
    pngs = sorted(out_dir.glob("slide-*.png"))
    for p in pngs:
        print(p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
