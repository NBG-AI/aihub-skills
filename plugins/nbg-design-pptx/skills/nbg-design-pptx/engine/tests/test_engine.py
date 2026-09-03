"""Engine tests: build the showcase in all three languages, validate it, and confirm the
spec errors the no-fallback rule requires. Run: .venv/bin/python -m pytest tests -q"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest
import yaml

ENGINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ENGINE))
from nbg_pptx.build import build  # noqa: E402
from nbg_pptx.text import SpecError, parse_markup  # noqa: E402
from validate_deck import validate  # noqa: E402

SHOWCASE = ENGINE.parent / "spec" / "examples" / "design-system-showcase.yaml"


def _spec():
    return yaml.safe_load(SHOWCASE.read_text())


def _write(tmp_path, spec, name="deck.yaml"):
    p = tmp_path / name
    p.write_text(yaml.safe_dump(spec, allow_unicode=True))
    return p


@pytest.mark.parametrize("lang", ["en", "gr", "bi"])
def test_showcase_builds_and_validates(tmp_path, lang):
    spec = _spec()
    spec["deck"]["language"] = lang
    if lang != "en":
        for s in spec["slides"]:
            for key in ("title", "subtitle", "caption", "eyebrow"):
                if isinstance(s.get(key), str):
                    s[key] = {"en": s[key], "gr": "Ελληνικά"}
            if isinstance(s.get("body"), list):
                s["body"] = [{"en": b, "gr": "Ελληνικά: " + b[:40]} for b in s["body"]]
            for c in s.get("columns", []) or []:
                c["heading"] = {"en": c["heading"], "gr": "Επικεφαλίδα"}
                c["body"] = {"en": c["body"], "gr": "Ελληνικό σώμα κειμένου."}
            if s.get("stat"):
                s["stat"]["caption"] = {"en": s["stat"]["caption"], "gr": "Ετήσια αύξηση"}
            for r in s.get("rows", []) or []:
                r["label"] = {"en": r["label"], "gr": "Δείκτης"}
            if s.get("meta"):
                s["meta"] = [{"en": m, "gr": "Αθήνα"} for m in s["meta"]]
            if s.get("footer_label"):
                s["footer_label"] = {"en": s["footer_label"], "gr": "Ενότητα"}
    out = tmp_path / f"showcase-{lang}.pptx"
    warnings = build(_write(tmp_path, spec), out)
    assert out.exists()
    report = validate(out)
    assert report.ok, report.render()
    if lang == "en":
        assert not report.warns, report.render()


def test_bilingual_overflow_fails_loudly(tmp_path):
    spec = _spec()
    spec["deck"]["language"] = "bi"
    for s in spec["slides"]:
        if s["template"] == "divider_dark":
            s["title"] = {"en": "A long section title that wraps twice", "gr": "Ένας μακρύς τίτλος ενότητας που τυλίγεται δύο φορές"}
    out = tmp_path / "bi.pptx"
    build(_write(tmp_path, spec), out)
    report = validate(out)
    assert not report.ok and any("cannot fit" in f for f in report.fails), report.render()


def test_missing_title_is_an_error(tmp_path):
    spec = _spec()
    del spec["slides"][0]["title"]
    with pytest.raises(SpecError, match="`title` is required"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_pie_chart_is_rejected(tmp_path):
    spec = _spec()
    chart_slide = next(s for s in spec["slides"] if s["template"] == "content_chart")
    chart_slide["chart"]["type"] = "pie"
    with pytest.raises(SpecError, match="doughnut"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_invisible_accent_is_rejected(tmp_path):
    spec = _spec()
    dark = next(s for s in spec["slides"] if s["template"] == "divider_dark")
    dark["accent"] = "#003841"
    with pytest.raises(SpecError, match="invisible"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_off_palette_accent_is_rejected(tmp_path):
    spec = _spec()
    spec["deck"]["accent"] = "#FF0000"
    with pytest.raises(SpecError, match="allowed accents"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_first_slide_must_be_a_cover(tmp_path):
    spec = _spec()
    spec["slides"] = spec["slides"][3:]
    with pytest.raises(SpecError, match="cover"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_bilingual_requires_both_variants(tmp_path):
    spec = _spec()
    spec["deck"]["language"] = "bi"
    spec["slides"][0]["title"] = {"en": "Only English"}  # plain strings are language-neutral; a mapping must carry both
    with pytest.raises(SpecError, match="both `en` and `gr`"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_markup():
    spans = parse_markup("A clear voice\n~*in changing times.*~ \\*literal\\*")
    assert spans[0] == {"text": "A clear voice", "italic": False, "accent": False, "strong": False}
    assert spans[1] == {"br": True}
    assert spans[2] == {"text": "in changing times.", "italic": True, "accent": True, "strong": False}
    assert spans[3]["text"] == " *literal*"
    strong = parse_markup("plain **strong** plain")
    assert [(s["text"], s["strong"]) for s in strong] == [("plain ", False), ("strong", True), (" plain", False)]


# ---------------------------------------------------------------------------
# briefing style (the default)
# ---------------------------------------------------------------------------

BRIEFING = ENGINE.parent / "spec" / "examples" / "briefing-showcase.yaml"


def _brief():
    return yaml.safe_load(BRIEFING.read_text())


def test_briefing_showcase_builds_and_validates(tmp_path):
    out = tmp_path / "briefing.pptx"
    warnings = build(_write(tmp_path, _brief()), out)
    assert not warnings, warnings
    report = validate(out)
    assert report.ok and not report.warns, report.render()
    assert any("style: briefing" in p for p in report.passes)


def test_briefing_is_the_default_style(tmp_path):
    spec = _brief()
    del spec["deck"]["style"]
    out = tmp_path / "default.pptx"
    build(_write(tmp_path, spec), out)
    assert validate(out).ok


def test_briefing_rejects_design_system_templates(tmp_path):
    spec = _brief()
    spec["slides"].append({"template": "back_cover"})
    with pytest.raises(SpecError, match="belongs to the other style"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_briefing_accent_is_fixed(tmp_path):
    spec = _brief()
    spec["deck"]["accent"] = "#003841"
    with pytest.raises(SpecError, match="not configurable"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_briefing_refuses_overflowing_table(tmp_path):
    spec = _brief()
    table_slide = next(s for s in spec["slides"] if s["template"] == "brief_table")
    table_slide["table"]["rows"] = table_slide["table"]["rows"] * 3
    with pytest.raises(SpecError, match="rows"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")


def test_briefing_lean_limit_fails_validation(tmp_path):
    spec = _brief()
    filler = next(s for s in spec["slides"] if s["template"] == "brief_cards")
    spec["slides"] = spec["slides"] + [dict(filler) for _ in range(9)]  # 14 slides
    out = tmp_path / "long.pptx"
    warnings = build(_write(tmp_path, spec), out)
    assert any("lean" in w for w in warnings)
    report = validate(out)
    assert not report.ok and any("lean" in f for f in report.fails), report.render()


def test_briefing_unknown_tone_is_an_error(tmp_path):
    spec = _brief()
    table_slide = next(s for s in spec["slides"] if s["template"] == "brief_table")
    table_slide["rail"]["items"][0]["tone"] = "purple"
    with pytest.raises(SpecError, match="tone"):
        build(_write(tmp_path, spec), tmp_path / "x.pptx")
