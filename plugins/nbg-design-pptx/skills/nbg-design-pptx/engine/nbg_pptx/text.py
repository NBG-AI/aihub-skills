"""Copy handling: language resolution (en / gr / bi) and the tiny inline markup
used in deck specs.

Markup (inside any copy string):
  `\\n`        semantic line break (the JSX <br/>)
  `*text*`    emphasis span - italic at Regular weight (the "tomorrow" treatment)
  `~text~`    accent span - rendered in the template's accent colour
  `\\*`, `\\~`  literal asterisk / tilde

A copy field is either a plain string or a mapping {en: "...", gr: "..."}.
In `bi` mode the Greek variant follows the English one at 55% opacity and Regular
weight, exactly like the `<T>` helper in slide-templates.jsx.
"""

from __future__ import annotations

from typing import Any

BI_SECONDARY_ALPHA = 0.55


class SpecError(ValueError):
    """Raised for an invalid or incomplete deck spec (never silently defaulted)."""


def resolve_copy(field: Any, lang: str, *, path: str) -> list[tuple[str, bool]]:
    """Return [(text, is_secondary)] for a copy field in the requested language."""
    if field is None:
        return []
    if isinstance(field, str):
        return [(field, False)]
    if isinstance(field, dict):
        en, gr = field.get("en"), field.get("gr")
        if lang == "en":
            if en is None:
                raise SpecError(f"{path}: language is 'en' but no `en` copy was given")
            return [(en, False)]
        if lang == "gr":
            if gr is None:
                raise SpecError(f"{path}: language is 'gr' but no `gr` copy was given")
            return [(gr, False)]
        if lang == "bi":
            if en is None or gr is None:
                raise SpecError(f"{path}: language is 'bi' but both `en` and `gr` copy are required")
            return [(en, False), (gr, True)]
        raise SpecError(f"deck.language must be en | gr | bi, got {lang!r}")
    raise SpecError(f"{path}: copy must be a string or {{en, gr}} mapping, got {type(field).__name__}")


def parse_markup(text: str) -> list[dict]:
    """Split a copy string into span dicts {text, italic, accent, strong} and {br: True}.
    `*x*` italic emphasis, `~x~` accent colour, `**x**` strong (SemiBold, ink)."""
    spans: list[dict] = []
    buf: list[str] = []
    italic = accent = strong = False

    def flush() -> None:
        if buf:
            spans.append({"text": "".join(buf), "italic": italic, "accent": accent, "strong": strong})
            buf.clear()

    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "\\" and i + 1 < len(text) and text[i + 1] in "*~\\":
            buf.append(text[i + 1])
            i += 2
            continue
        if ch == "\n":
            flush()
            spans.append({"br": True})
        elif ch == "*" and i + 1 < len(text) and text[i + 1] == "*":
            flush()
            strong = not strong
            i += 1
        elif ch == "*":
            flush()
            italic = not italic
        elif ch == "~":
            flush()
            accent = not accent
        else:
            buf.append(ch)
        i += 1
    flush()
    return spans


def plain(text: str) -> str:
    """Markup-free version of a copy string (for estimation / validation)."""
    return "".join(s.get("text", "\n" if s.get("br") else "") for s in parse_markup(text))


def spans_for(
    variants: list[tuple[str, bool]],
    *,
    base_color: str,
    accent_color: str,
    base_weight: int,
    base_alpha: float | None,
    emphasis_weight: int = 400,
    accent_italic: bool = False,
    accent_weight: int | None = None,
    secondary_size: float | None = None,
    lang_hint: str = "en",
    strong_color: str | None = None,
    strong_weight: int = 600,
) -> list[list[dict]]:
    """Turn resolved copy variants into `add_text` paragraphs."""
    paragraphs: list[list[dict]] = []
    for text, secondary in variants:
        para: list[dict] = []
        for s in parse_markup(text):
            if s.get("br"):
                para.append({"br": True})
                continue
            span: dict = {"text": s["text"]}
            if s["italic"]:
                span["italic"] = True
                span["weight"] = emphasis_weight
            if s.get("strong"):
                span["weight"] = strong_weight
                if strong_color:
                    span["color"] = strong_color
                    span["alpha"] = 1.0
            if s["accent"]:
                span["color"] = accent_color
                if accent_italic:
                    span["italic"] = True
                if accent_weight is not None:
                    span["weight"] = accent_weight
            span["lang"] = "el-GR" if (secondary or lang_hint == "gr") else "en-GB"
            if secondary:
                span["weight"] = 400
                a = base_alpha if base_alpha is not None else 1.0
                span["alpha"] = a * BI_SECONDARY_ALPHA
                if secondary_size is not None:
                    span["size"] = secondary_size
            para.append(span)
        paragraphs.append(para)
    return paragraphs


def joined_plain(variants: list[tuple[str, bool]]) -> str:
    return "\n".join(plain(t) for t, _ in variants)
