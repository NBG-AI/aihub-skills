#!/usr/bin/env node
// NBG Design — agent-browser quality inspector for HTML decks.
//
// This is the *active* visual-QA gate: it drives the agent-browser CLI to open the deck in a real
// 1920×1080 browser and run DOM-level measurements on every slide, catching the quality defects a
// static text check (verify-deck.mjs) cannot see — content overflowing the 1920×1080 frame, text
// clipped by its container, key regions overlapping (e.g. a too-long title colliding with the body),
// illegibly small fonts, and broken/unloaded <img> assets. It also captures one PNG per slide so the
// agent can READ them and judge the subjective quality bar (action titles, balance, brand).
//
// It complements, not replaces:
//   - verify-deck.mjs --strict : browser-free static gate (tokens, embedded assets, file size).
//   - this script              : browser-level layout/legibility/asset inspection via agent-browser.
//
// REQUIRES agent-browser (see the Preflight gate in SKILL.md). On a host without it, this exits 3 —
// install it (`brew install agent-browser` / `npm install -g agent-browser`) or ask the user.
// Assumes the skill's slide convention: each slide is an element with class `slide`, the visible one
// also carries `active`, and `.slide.active { display: … }` reveals it.
//
// Zero dependencies. Any Node >= 16. Exit: 0 = clean, 1 = issues found, 2 = usage, 3 = no agent-browser.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const USAGE = `NBG deck quality inspector (agent-browser)
Usage: node inspect-deck.mjs <deck.html> [-o <dir>] [--min-font N] [--screens] [--strict] [--json]

  -o, --out <dir>   Output dir for inspection-report.json (and screenshots) (default: test_scripts/inspect).
  --min-font N      Flag rendered text smaller than N px as a legibility warning (default 12).
  --screens         Also capture one PNG per slide via agent-browser for a subjective READ.
                    Off by default: it is one browser round-trip per slide (slow on big decks).
                    For fast batch capture use renderers/html/screenshot-deck.mjs instead.
  --strict          Promote warnings (tiny fonts) to failures.
  --json            Print the machine-readable report to stdout as well.

Exit: 0 = clean, 1 = issues found, 2 = usage, 3 = agent-browser not installed.`;

function parseArgs(argv) {
  const a = { _: [], out: null, minFont: 12, screens: false, strict: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '-o' || x === '--out') a.out = argv[++i];
    else if (x === '--min-font') a.minFont = parseInt(argv[++i], 10);
    else if (x === '--screens') a.screens = true;
    else if (x === '--strict') a.strict = true;
    else if (x === '--json') a.json = true;
    else if (x === '-h' || x === '--help') a.help = true;
    else a._.push(x);
  }
  return a;
}

// Run an agent-browser subcommand; returns { ok, stdout, stderr }.
function ab(args, { capture = false } = {}) {
  const r = spawnSync('agent-browser', args, { encoding: 'utf8', timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error && r.error.code === 'ENOENT') return { ok: false, missing: true };
  return { ok: r.status === 0, stdout: r.stdout || '', stderr: r.stderr || '', code: r.status };
}

// Run JavaScript in the page via agent-browser eval -b <base64> --json; returns the eval result value.
function evalInPage(js) {
  const b64 = Buffer.from(js, 'utf8').toString('base64');
  const r = ab(['eval', '-b', b64, '--json']);
  if (r.missing) return { missing: true };
  if (!r.ok) return { error: r.stderr.trim() || `eval exited ${r.code}` };
  let parsed;
  try { parsed = JSON.parse(r.stdout); } catch { return { error: `non-JSON eval output: ${r.stdout.slice(0, 200)}` }; }
  if (!parsed.success) return { error: (parsed.error && JSON.stringify(parsed.error)) || 'eval failed' };
  return { value: parsed.data ? parsed.data.result : undefined };
}

// The in-page measurement. Activates each slide in turn and reports objective layout/asset defects.
// `MIN_FONT` is interpolated by the caller. Returns [{ slide, index, issues:[{severity,type,...}] }].
function measurementJS(minFont) {
  return `(function(){
  var W=1920, H=1080, TOL=2, EDGE=4, MINF=${Number(minFont) || 12};
  var slides=[].slice.call(document.querySelectorAll('.slide'));
  function vis(el){var cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity||'1')===0) return false; var r=el.getBoundingClientRect(); return r.width>0&&r.height>0;}
  function desc(el){var c=(typeof el.className==='string'&&el.className.trim())?'.'+el.className.trim().split(/\\s+/).join('.'):''; return el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+c;}
  function rr(r){return {l:Math.round(r.left),t:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom)};}
  function txt(el){return (el.textContent||'').replace(/\\s+/g,' ').trim();}
  var out=[];
  for(var si=0; si<slides.length; si++){
    var slide=slides[si];
    slides.forEach(function(s,i){ s.classList.toggle('active', i===si); });
    void slide.getBoundingClientRect(); // force layout
    var issues=[];
    // 1 — whole-slide overflow (content exceeds the 1920×1080 frame)
    if(slide.scrollWidth>W+TOL || slide.scrollHeight>H+TOL){
      issues.push({severity:'error', type:'slide-overflow', overX:Math.max(0,slide.scrollWidth-W), overY:Math.max(0,slide.scrollHeight-H)});
    }
    var all=[].slice.call(slide.querySelectorAll('*')).filter(vis);
    // 2 — content (text leaves / images) pushed off the frame
    for(var i=0;i<all.length;i++){
      var el=all[i], r=el.getBoundingClientRect();
      var isImg=el.tagName==='IMG', isLeafText=el.children.length===0 && txt(el).length>0;
      if(!isImg && !isLeafText) continue;
      if(r.right>W+EDGE || r.bottom>H+EDGE || r.left<-EDGE || r.top<-EDGE){
        issues.push({severity:'error', type:'off-frame', el:desc(el), rect:rr(r), text:txt(el).slice(0,50)});
      }
    }
    // 3 — illegibly small rendered text
    for(var j=0;j<all.length;j++){
      var e2=all[j];
      if(e2.children.length===0 && txt(e2).length>0){
        var fs=parseFloat(getComputedStyle(e2).fontSize);
        if(fs && fs<MINF) issues.push({severity:'warn', type:'tiny-font', el:desc(e2), fontSize:Math.round(fs), text:txt(e2).slice(0,40)});
      }
    }
    // 4 — broken / unloaded images
    var imgs=[].slice.call(slide.querySelectorAll('img'));
    for(var k=0;k<imgs.length;k++){ var im=imgs[k]; if(!im.complete || im.naturalWidth===0) issues.push({severity:'error', type:'broken-image', src:(im.getAttribute('src')||'').slice(0,60)}); }
    // 5 — overlap between the slide's top-level regions (e.g. title colliding with the body).
    // Full-height wrappers (cover/divider/back layout shells, ~full slide height) are positioning
    // containers, not content blocks — their box overlaps footers/bars without a visual collision, so
    // skip any pair involving one. The real title-vs-body case survives (the body is only ~70% tall).
    var FULLH=H*0.92;
    var kids=[].slice.call(slide.children).filter(vis);
    for(var a=0;a<kids.length;a++) for(var b=a+1;b<kids.length;b++){
      var ra=kids[a].getBoundingClientRect(), rb=kids[b].getBoundingClientRect();
      if(ra.height>=FULLH || rb.height>=FULLH) continue; // full-height wrapper, not a collision
      var ox=Math.max(0, Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left));
      var oy=Math.max(0, Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top));
      if(ox<=8 || oy<=8) continue;
      var area=ox*oy, minA=Math.min(ra.width*ra.height, rb.width*rb.height);
      if(minA<=0 || area/minA<0.15) continue;
      var aCb=ra.left<=rb.left+TOL&&ra.top<=rb.top+TOL&&ra.right>=rb.right-TOL&&ra.bottom>=rb.bottom-TOL;
      var bCa=rb.left<=ra.left+TOL&&rb.top<=ra.top+TOL&&rb.right>=ra.right-TOL&&rb.bottom>=ra.bottom-TOL;
      if(aCb||bCa) continue; // intentional full-bleed layering, not a collision
      issues.push({severity:'error', type:'overlap', a:desc(kids[a]), b:desc(kids[b]), pct:Math.round(area/minA*100)});
    }
    out.push({index:si+1, slide:slide.id||('slide'+(si+1)), issues:issues});
  }
  // restore the first slide
  slides.forEach(function(s,i){ s.classList.toggle('active', i===0); });
  return out;
})()`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length !== 1) { console.log(USAGE); process.exit(args.help ? 0 : 2); }

  const deck = resolve(process.cwd(), args._[0]);
  if (!existsSync(deck)) { console.error('inspect ERROR: not found: ' + deck); process.exit(1); }

  // agent-browser presence (the Preflight gate, enforced here too).
  const probe = ab(['--version']);
  if (probe.missing) {
    console.error('agent-browser is not installed — this is the required browser tool for HTML visual QA.');
    console.error('  Install it: brew install agent-browser   (or: npm install -g agent-browser)');
    console.error('  Then re-run, or ask the user (see the Preflight gate in SKILL.md).');
    process.exit(3);
  }

  const outDir = resolve(process.cwd(), args.out || join('test_scripts', 'inspect'));
  mkdirSync(outDir, { recursive: true });
  const base = basename(deck).replace(/\.html?$/i, '');

  console.log(`Inspecting ${deck}`);
  // Open at native size so the deck renders at scale 1 (measurements == design coordinates).
  if (!ab(['set', 'viewport', '1920', '1080']).ok) console.log('  ! could not set viewport (continuing)');
  const opened = ab(['open', `file://${deck}`]);
  if (!opened.ok) { console.error('inspect ERROR: agent-browser could not open the deck.'); process.exit(1); }

  const res = evalInPage(measurementJS(args.minFont));
  if (res.missing) { console.error('agent-browser disappeared mid-run.'); process.exit(3); }
  if (res.error) { console.error('inspect ERROR: measurement failed — ' + res.error); process.exit(1); }
  const report = Array.isArray(res.value) ? res.value : [];

  // Per-slide screenshots via the deck's own keyboard nav (keeps the page chrome faithful).
  if (args.screens) {
    ab(['eval', '-b', Buffer.from('document.querySelectorAll(".slide").forEach((e,i)=>e.classList.toggle("active",i===0))', 'utf8').toString('base64')]);
    for (let i = 1; i <= report.length; i++) {
      if (i > 1) ab(['press', 'ArrowRight']);
      const out = join(outDir, `${base}-s${i}.png`);
      const shot = ab(['screenshot', out]);
      if (!shot.ok) console.log(`  ! screenshot slide ${i} failed`);
    }
  }

  // Aggregate + print.
  let errors = 0, warns = 0;
  for (const s of report) {
    for (const is of s.issues) (is.severity === 'error' ? errors++ : warns++);
  }
  console.log(`\nInspected ${report.length} slide(s) — ${errors} error(s), ${warns} warning(s)`);
  for (const s of report) {
    if (!s.issues.length) continue;
    console.log(`\n  slide ${s.index} (#${s.slide}):`);
    for (const is of s.issues) {
      const mark = is.severity === 'error' ? '✗' : '!';
      const { severity, type, ...rest } = is;
      console.log(`    ${mark} ${type} ${JSON.stringify(rest)}`);
    }
  }
  if (errors === 0 && warns === 0) console.log('  ✓ no objective layout/asset/legibility issues detected.');

  const reportPath = join(outDir, 'inspection-report.json');
  writeFileSync(reportPath, JSON.stringify({ deck, slides: report.length, errors, warnings: warns, report }, null, 2));
  console.log(`\nReport: ${reportPath}`);
  if (args.screens) console.log(`Screenshots: ${outDir}  — now READ each PNG for subjective quality (titles, balance, brand).`);
  if (args.json) console.log('\n' + JSON.stringify(report));

  const failures = errors + (args.strict ? warns : 0);
  process.exit(failures ? 1 : 0);
}

main();
