#!/usr/bin/env node
// NBG Design — inline the in-deck right-click menu ("Edit text", "Export to PDF", "Save edited
// copy") into an HTML deck.
//
// Injects ONE <script id="nbg-deck-menu-script" data-nbg-deck-menu="<version>"> before the last
// </body>, containing lib/print-layout.js (the print-layout shim shared with export-pdf.mjs)
// followed by lib/deck-menu.js (the menu UI, in-place text editing, print orchestration). The
// deck stays fully self-contained. Idempotent: an existing block (including the v1
// "nbg-pdf-menu-script" block) is replaced, so re-running upgrades an older menu. Zero deps.
//
// Exit: 0 = menu present (added / upgraded / already current), 1 = error.

import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = `NBG deck — add the right-click menu (Edit text / Export to PDF / Save edited copy)
Usage: node add-deck-menu.mjs <deck.html> [-o <out.html>] [--remove]

  -o, --out   Write to a new file (default: overwrite in place).
  --remove    Strip the menu block instead of adding it.

Exit code 0 = done, 1 = error.`;

// The script block id must differ from the runtime elements the UI creates (#nbg-deck-menu, #nbg-deck-toast).
export const MENU_SCRIPT_ID = 'nbg-deck-menu-script';
const BLOCK_RE = /<script id="nbg-(?:pdf|deck)-menu(?:-script)?" data-nbg-(?:pdf|deck)-menu="(\d+)">[\s\S]*?<\/script>\s*/;

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '-o' || x === '--out') a.out = argv[++i];
    else if (x === '--remove') a.remove = true;
    else if (x === '-h' || x === '--help') a.help = true;
    else a._.push(x);
  }
  return a;
}

export function buildMenuBlock() {
  const layout = readFileSync(new URL('./lib/print-layout.js', import.meta.url), 'utf8');
  const menu = readFileSync(new URL('./lib/deck-menu.js', import.meta.url), 'utf8');
  const version = (menu.match(/var VERSION = (\d+);/) || [])[1];
  if (!version) throw new Error('lib/deck-menu.js has no VERSION marker');
  for (const src of [layout, menu]) {
    if (/<\/script/i.test(src)) throw new Error('menu sources must not contain "</script"');
  }
  return {
    version,
    block: `<script id="${MENU_SCRIPT_ID}" data-nbg-deck-menu="${version}">\n/* NBG deck — right-click menu: Edit text / Export to PDF / Save edited copy (nbg-design skill, add-deck-menu.mjs). Do not edit by hand. */\n${layout}\n${menu}\n</script>\n`,
  };
}

export function addMenu(html) {
  const { block, version } = buildMenuBlock();
  const existing = html.match(BLOCK_RE);
  let status;
  if (existing) {
    if (existing[1] === version && html.includes(block)) return { html, status: 'already current', version };
    html = html.replace(BLOCK_RE, '');
    status = existing[1] === version ? 'refreshed' : `upgraded from v${existing[1]}`;
  } else status = 'added';
  const bodyEnd = html.lastIndexOf('</body>');
  const out = bodyEnd >= 0 ? html.slice(0, bodyEnd) + block + html.slice(bodyEnd) : html + block;
  return { html: out, status, version };
}

export function removeMenu(html) {
  const existing = html.match(BLOCK_RE);
  return { html: existing ? html.replace(BLOCK_RE, '') : html, status: existing ? 'removed' : 'not present' };
}

export function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length !== 1) { console.log(USAGE); process.exit(args.help ? 0 : 2); }
  const file = resolve(process.cwd(), args._[0]);
  if (!existsSync(file)) { console.error('add-deck-menu ERROR: not found: ' + file); process.exit(1); }
  const out = args.out ? resolve(process.cwd(), args.out) : file;
  try {
    const html = readFileSync(file, 'utf8');
    const r = args.remove ? removeMenu(html) : addMenu(html);
    writeFileSync(out, r.html, 'utf8');
    console.log(`${args.remove ? 'deck menu' : `deck menu v${r.version}`}: ${r.status} → ${out}`);
    process.exit(0);
  } catch (e) {
    console.error('add-deck-menu ERROR: ' + e.message);
    process.exit(1);
  }
}

// Run as a CLI only when invoked directly. Compare REAL paths: skills are commonly reached through a
// symlink (e.g. <project>/.claude/skills/nbg-design -> the plugin checkout), and then process.argv[1]
// is the symlinked path while import.meta.url is the resolved one — a plain comparison silently
// skips main() and the deck gets no menu.
function isMainModule() {
  if (!process.argv[1]) return false;
  const here = fileURLToPath(import.meta.url);
  const invoked = resolve(process.argv[1]);
  try { return realpathSync(invoked) === realpathSync(here); } catch { return invoked === here; }
}
if (isMainModule()) main();
