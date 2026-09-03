#!/usr/bin/env python3
"""Build an NBG-design PPTX from a deck spec and run the design-guideline validator.

Usage:
    source .venv/bin/activate
    python build_deck.py <spec>.yaml <out>.pptx [--no-validate]

Exit codes: 0 built (and validated) - 1 spec error - 2 validation FAIL.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from nbg_pptx.build import build  # noqa: E402
from nbg_pptx.text import SpecError  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--no-validate", action="store_true", help="skip the validator (not for delivery)")
    args = ap.parse_args()

    try:
        warnings = build(args.spec, args.out)
    except SpecError as e:
        print(f"SPEC ERROR: {e}", file=sys.stderr)
        return 1
    print(f"Built {args.out}")
    for w in warnings:
        print(f"  build warning: {w}")
    if args.no_validate:
        return 0
    from validate_deck import validate  # noqa: E402

    report = validate(args.out)
    print(report.render())
    return 0 if report.ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
