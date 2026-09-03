"""NBG Presentation Design System tokens, mapped 1:1 from the HTML design system.

Source of truth: `NBG-Design/NBG Design System.html` + `slide-templates.jsx` in the
`nbg-design` plugin. Geometry is authored on a 1920x1080 artboard; PowerPoint uses a
13.333in x 7.5in (16:9) slide, so 1 artboard px == 6350 EMU and 1 px == 0.5 pt.
"""

from __future__ import annotations

from pathlib import Path

# ---------------------------------------------------------------------------
# Artboard <-> PowerPoint geometry
# ---------------------------------------------------------------------------
ARTBOARD_W = 1920
ARTBOARD_H = 1080
SLIDE_W_EMU = 12_192_000  # 13.333 in
SLIDE_H_EMU = 6_858_000  # 7.5 in
EMU_PER_PX = SLIDE_W_EMU // ARTBOARD_W  # 6350 exactly
PT_PER_PX = 0.5  # 1920 px over 13.333 in -> 144 px/in -> 1 px = 0.5 pt


def px(v: float) -> int:
    """Artboard pixels -> EMU."""
    return int(round(v * EMU_PER_PX))


def pt(v_px: float) -> float:
    """Artboard pixel font size -> points."""
    return v_px * PT_PER_PX


# ---------------------------------------------------------------------------
# Palette ("NBG Colors 2" - the six brand tokens + neutrals)
# ---------------------------------------------------------------------------
INK = "003841"  # Deep Teal - accent 1, primary ink on light
TEAL = "007B85"  # accent 2
BRIGHT = "00ADBF"  # Bright Cyan - accent 3
CYAN = "00CFE7"  # Electric Cyan - accent 4
GREY_1 = "BEC1BE"  # accent 5
GREY_2 = "939793"  # accent 6
CREAM = "F5F8F6"  # lt2 - section / cover surface
PAPER = "FFFFFF"
BLACK = "0A1416"  # deep black - dark cover surface
BODY = "1A1F22"  # body ink on content pages (from slide-templates.jsx)
DEEP_GRADIENT_END = "001A1F"  # Cover1 photo-card gradient end

ACCENTS = (INK, TEAL, BRIGHT, CYAN)  # the four allowed accents (tweaks panel)
SURFACES = (PAPER, CREAM, BLACK, INK)
DARK_SURFACES = (BLACK, INK)
NEUTRALS = (GREY_1, GREY_2, BODY, "5A5F5A")

# Chart series order: teal tints only ("even for charts, stick to teal tints")
CHART_SERIES = (BRIGHT, INK, TEAL, GREY_2, GREY_1, CYAN)
# Semantic deltas are allowed inside charts only.
CHART_SEMANTIC = {"positive": "73AF3C", "negative": "AA0028", "neutral": GREY_2}

PALETTE = set(ACCENTS) | set(SURFACES) | set(NEUTRALS) | {DEEP_GRADIENT_END}
PALETTE_CHART_EXTRA = set(CHART_SEMANTIC.values())

# ---------------------------------------------------------------------------
# Typography - Aptos at three weights (Light / Regular / SemiBold) + Bold
# ---------------------------------------------------------------------------
FONT_FAMILY = "Aptos"


def font_for_weight(weight: int) -> tuple[str, bool]:
    """CSS font-weight -> (PowerPoint font face, bold flag)."""
    if weight <= 300:
        return "Aptos Light", False
    if weight < 500:
        return "Aptos", False
    if weight < 700:
        return "Aptos SemiBold", False
    return "Aptos", True


ALLOWED_FONTS = {"Aptos", "Aptos Light", "Aptos SemiBold", "Aptos Display"}

# ---------------------------------------------------------------------------
# Assets bundled with the skill
# ---------------------------------------------------------------------------
SKILL_ROOT = Path(__file__).resolve().parent.parent.parent
ASSETS_DIR = SKILL_ROOT / "assets"
LOGOS = {
    "primary": ASSETS_DIR / "logos" / "logo-primary.png",  # full colour, light surfaces
    "knockout": ASSETS_DIR / "logos" / "logo-knockout.png",  # white, dark surfaces
    "small": ASSETS_DIR / "logos" / "logo-small.png",  # compact footer lockup (light)
}
PHOTOS = {
    "fields": ASSETS_DIR / "photos" / "photo-fields.jpeg",
    "heart": ASSETS_DIR / "photos" / "photo-heart.jpeg",
    "parthenon": ASSETS_DIR / "photos" / "photo-parthenon.jpeg",
    "skate": ASSETS_DIR / "photos" / "photo-skate.jpeg",
    "street": ASSETS_DIR / "photos" / "photo-street.jpeg",
}

# Template defaults - each JSX template ships its own tuned accent.
TEMPLATE_DEFAULT_ACCENT = {
    "cover1": INK,
    "cover2": TEAL,
    "cover3": BRIGHT,
    "divider_image": CYAN,
    "divider_dark": CYAN,
    "divider_bright": BRIGHT,
    "content_image_right": INK,
    "content_columns": TEAL,
    "content_stat": BRIGHT,
    "content_chart": TEAL,
    "content_table": TEAL,
    "back_cover": INK,
}
TEMPLATE_DEFAULT_PHOTO = {
    "cover1": "street",
    "cover2": "parthenon",
    "divider_image": "fields",
    "content_image_right": "skate",
}
TEMPLATE_SURFACE = {
    "cover1": BLACK,
    "cover2": CREAM,
    "cover3": INK,
    "divider_image": INK,
    "divider_dark": INK,
    "divider_bright": CREAM,
    "content_image_right": PAPER,
    "content_columns": PAPER,
    "content_stat": CREAM,
    "content_chart": PAPER,
    "content_table": PAPER,
    "back_cover": CREAM,
}

# Footer geometry (PageFooter in slide-templates.jsx)
FOOTER = {"left": 54, "right": 54, "bottom": 36, "logo_h": 28, "gap": 18, "font": 18}
FOOTER_CLEARANCE = 72  # minimum clearance above the footer band (nbg-design guardrail)
GROUP_GAP = 32  # minimum spacing between adjacent content groups


def normalize_hex(value: str) -> str:
    v = value.strip().lstrip("#").upper()
    if len(v) != 6 or any(c not in "0123456789ABCDEF" for c in v):
        raise ValueError(f"Invalid colour: {value!r}")
    return v


def relative_luminance(hex6: str) -> float:
    r, g, b = (int(hex6[i : i + 2], 16) / 255 for i in (0, 2, 4))

    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def contrast_ratio(a: str, b: str) -> float:
    la, lb = relative_luminance(a), relative_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def is_dark(hex6: str) -> bool:
    return relative_luminance(hex6) < 0.25


# ---------------------------------------------------------------------------
# Briefing style ("index 1.html" reference): pure white ground, one accent used only
# for highlights / lines / design details, grey ink hierarchy, semantic status pills.
# ---------------------------------------------------------------------------
STYLES = ("briefing", "design-system")
DEFAULT_STYLE = "briefing"

BRIEF = {
    "accent": "007B85",
    "accent_dk": "005A61",
    "accent_mid": "66B0B6",  # chart tint only
    "accent_lt": "E6F2F3",
    "accent_xlt": "F4FAFA",
    "ink": "0E1B1D",
    "muted": "5B6B6D",
    "faint": "8A9A9C",
    "line": "E2E8E9",
    "line_soft": "EFF3F3",
    "white": "FFFFFF",
}
BRIEF_TONES = {
    # semantic status tones - pills, dots, callout bands only
    "ok": {"fg": "1F8A5F", "bg": "EAF6F0", "text": "1F8A5F"},
    "warn": {"fg": "C07A08", "bg": "FCF3E2", "text": "7A4E05"},
    "stop": {"fg": "B33A2B", "bg": "FBEDEB", "text": "7A2E23"},
    "wait": {"fg": "6B7A7C", "bg": "F1F4F4", "text": "4F5C5E"},
    "accent": {"fg": "007B85", "bg": "E6F2F3", "text": "005A61"},
}
BRIEF_PALETTE = set(BRIEF.values()) | {t[k] for t in BRIEF_TONES.values() for k in ("fg", "bg", "text")}
BRIEF_CHART_SERIES = (BRIEF["accent"], BRIEF["faint"], BRIEF["accent_dk"], BRIEF["accent_mid"], BRIEF["line"], BRIEF["ink"])  # first series = the highlight
BRIEF_FOOTER_CLEARANCE = 40  # the briefing footer is a 28px band; 40px clear above it
BRIEF_LEAN_WARN = 8  # slides: above this the validator warns
BRIEF_LEAN_FAIL = 12  # slides: above this a briefing deck fails ("lean" is a hard requirement)
