# NBG Design — build & verification scripts

Two zero-dependency Node scripts (any Node >= 16, no `npm install`) that make asset
embedding deterministic and add a browser-free quality gate. They exist because the
hand-pasting of large base64 data URIs is the step that silently breaks in headless /
SSH / Linux runs — the model "approximates" a photo with a gradient or substitutes a
text/box logo, and with no display to screenshot, the lapse ships.

Both scripts resolve the bundled assets **relative to the script's own location** (the
skill root), never the current working directory — so they work from any cwd and on any
machine, as long as the **whole skill folder** (including `NBG-Design/assets/`) was
copied, not just `SKILL.md`.

## 1. Embed assets — `embed-assets.mjs`

Author the deck with `{{TOKEN}}` placeholders instead of inline data URIs, then run:

```
node "<skill-root>/scripts/embed-assets.mjs" my-deck.html
```

- Tokens map to asset files by lower-casing and turning `_` into `-`:
  `{{PHOTO_STREET}}` → `photo-street.datauri.txt`, `{{LOGO_KNOCKOUT}}` → `logo-knockout.datauri.txt`.
- Available tokens: `{{LOGO_PRIMARY}}` `{{LOGO_KNOCKOUT}}` `{{LOGO_SMALL}}`
  `{{PHOTO_FIELDS}}` `{{PHOTO_HEART}}` `{{PHOTO_PARTHENON}}` `{{PHOTO_SKATE}}` `{{PHOTO_STREET}}`.
- Define each token **once** (e.g. a CSS `background-image: url("{{PHOTO_STREET}}")` class)
  and reuse the class, so the large URI appears only once in the file.
- Fails loudly if a token has no matching asset or the asset isn't a `data:image/` URI.
- `-o out.html` writes to a new file; default overwrites in place.

## 2. Verify the deck — `verify-deck.mjs`

Run this before delivering **any** deck. It needs no browser, so it works over SSH:

```
node "<skill-root>/scripts/verify-deck.mjs" my-deck.html --strict
```

Exit code 0 = pass, 1 = fail.

**Hard failures (always):** unresolved `{{TOKEN}}` placeholders; any image referenced by
`file://` / absolute / relative / `http(s)://` instead of a `data:` URI; zero embedded
images.

**`--strict` also fails on:** fewer than `--min-images` embedded images (default 2); file
smaller than `--min-bytes` (default 200000) — a photo-less deck is the classic tell; bare
`>NBG<` / `>NPG<` text nodes that may be a text/box substitute for the logo lockup.

## 3. Screenshot the deck — `screenshot-deck.mjs` (optional, needs a browser)

Visual check for hosts that have Chrome/Chromium/Edge. Writes one PNG per slide at the
required viewports so they can be read and inspected:

```
node "<skill-root>/scripts/screenshot-deck.mjs" my-deck.html [-o <dir>] [--viewports WxH,WxH] [--slides 1,2,5]
```

- Auto-detects a browser (override with `--browser <path>` or env `NBG_BROWSER` / `CHROME_BIN`).
- Navigates slides generically (injects a shim that drives `window.showSlide` / `window.gotoSlide`
  if present, else toggles `.active` on the Nth `.slide`) — works for both deck styles.
- Default viewports `1366x768,1440x900`; default output `test_scripts/screenshots/`.
- **Exit codes:** 0 = screenshots written, 1 = error, **3 = no browser found** (a soft signal — fall
  back to `verify-deck.mjs --strict`, which is the mandatory gate on headless hosts).

## Recommended workflow

```
# 1. author my-deck.html using {{TOKEN}} placeholders for every image
node "<skill-root>/scripts/embed-assets.mjs"    my-deck.html
node "<skill-root>/scripts/verify-deck.mjs"     my-deck.html --strict   # mandatory, headless-safe
node "<skill-root>/scripts/screenshot-deck.mjs" my-deck.html            # optional, when a browser exists
# then READ the PNGs and inspect them
```

`<skill-root>` is the directory that contains `SKILL.md`.
