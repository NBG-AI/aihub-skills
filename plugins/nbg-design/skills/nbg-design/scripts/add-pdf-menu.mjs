#!/usr/bin/env node
// NBG Design — inline the right-click "Export to PDF" menu into an HTML deck.
//
// Injects ONE <script id="nbg-pdf-menu-script" data-nbg-pdf-menu="<version>"> before the last </body>,
// containing lib/print-layout.js (the print-layout shim shared with export-pdf.mjs) followed
// by lib/pdf-menu.js (the menu UI). The deck stays fully self-contained. Idempotent: an
// existing block is replaced, so re-running upgrades an older menu. Zero dependencies.
//
// Exit: 0 = menu present (added / upgraded / already current), 1 = error.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const USAGE = `NBG deck — add the right-click "Export to PDF" menu
Usage: node add-pdf-menu.mjs <deck.html> [-o <out.html>] [--remove]

  -o, --out   Write to a new file (default: overwrite in place).
  --remove    Strip the menu block instead of adding it.

Exit code 0 = done, 1 = error.`;

// The script block id must differ from the menu <div id="nbg-pdf-menu"> the UI creates at runtime.
export const MENU_SCRIPT_ID = 'nbg-pdf-menu-script';
const VERSION_RE = /<script id="nbg-pdf-menu(?:-script)?" data-nbg-pdf-menu="(\d+)">[\s\S]*?<\/script>\s*/;

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
  const menu = readFileSync(new URL('./lib/pdf-menu.js', import.meta.url), 'utf8');
  const version = (menu.match(/var VERSION = (\d+);/) || [])[1];
  if (!version) throw new Error('lib/pdf-menu.js has no VERSION marker');
  for (const src of [layout, menu]) {
    if (/<\/script/i.test(src)) throw new Error('menu sources must not contain "</script"');
  }
  return {
    version,
    block: `<script id="${MENU_SCRIPT_ID}" data-nbg-pdf-menu="${version}">\n/* NBG deck — right-click "Export to PDF" menu (nbg-design skill, add-pdf-menu.mjs). Do not edit by hand. */\n${layout}\n${menu}\n</script>\n`,
  };
}

export function addMenu(html) {
  const { block, version } = buildMenuBlock();
  const existing = html.match(VERSION_RE);
  let status;
  if (existing) {
    if (existing[1] === version && html.includes(block)) return { html, status: 'already current', version };
    html = html.replace(VERSION_RE, '');
    status = existing[1] === version ? 'refreshed' : `upgraded from v${existing[1]}`;
  } else status = 'added';
  const bodyEnd = html.lastIndexOf('</body>');
  const out = bodyEnd >= 0 ? html.slice(0, bodyEnd) + block + html.slice(bodyEnd) : html + block;
  return { html: out, status, version };
}

export function removeMenu(html) {
  const existing = html.match(VERSION_RE);
  return { html: existing ? html.replace(VERSION_RE, '') : html, status: existing ? 'removed' : 'not present' };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length !== 1) { console.log(USAGE); process.exit(args.help ? 0 : 2); }
  const file = resolve(process.cwd(), args._[0]);
  if (!existsSync(file)) { console.error('add-pdf-menu ERROR: not found: ' + file); process.exit(1); }
  const out = args.out ? resolve(process.cwd(), args.out) : file;
  try {
    const html = readFileSync(file, 'utf8');
    const r = args.remove ? removeMenu(html) : addMenu(html);
    writeFileSync(out, r.html, 'utf8');
    console.log(`${args.remove ? 'PDF menu' : `PDF menu v${r.version}`}: ${r.status} → ${out}`);
    process.exit(0);
  } catch (e) {
    console.error('add-pdf-menu ERROR: ' + e.message);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) main();
