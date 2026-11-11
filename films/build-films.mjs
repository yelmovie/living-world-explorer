// Writes films/concept-<id>/ (index.html + assets) from films.data.mjs.
// Shared shot plan, 18 s each: question → the lab replayed (before → after) → zoom with labels → one-line answer → 토토 reacts.
// Run: node films/build-films.mjs   (then hyperframes check/snapshot/render inside each folder)
import {mkdir, copyFile, writeFile, readFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {films, DURATION, CUES} from './films.data.mjs';
import {execFileSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public', 'assets');
const W = 1920, H = 1080;
const INK = '#213f30', PAPER = '#fbf7ea', GRID = '#dbe5cf', GOLD = '#d9a93e';
const SFX = {open: 'page-turn', lens: 'capture', label: 'snap', answer: 'success', toto: 'hint', drop: 'pipette-drop'};

const lenCache = {};
const len = n => lenCache[n] ??= (+execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(pub, 'audio', n + '.wav')]).toString()).toFixed(2);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const arrowSvg = h => `<svg class="arrow" viewBox="0 0 64 32" width="${h * 1.6}" height="${h * .8}" aria-hidden="true"><path d="M4 16H50M38 5l14 11-14 11" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const rich = (s, h) => esc(s).split('→').join(arrowSvg(h));
const img = p => `assets/img/${p.split('/').pop()}.webp`;

function build(f) {
  const clips = [], tl = [], sounds = [];
  let z = 1;
  const clip = (id, start, dur, html, cls = '') => { clips.push(`<div id="${id}" class="clip ${cls}" data-start="${start}" data-duration="${+(dur).toFixed(2)}" data-track-index="${z}" style="z-index:${z++}">${html}</div>`); };
  const sound = (name, t) => sounds.push({name, t: +(t + 1 / 30).toFixed(3)}); // one frame after the picture moves

  // Ground and header run the whole film.
  clip('paper', 0, DURATION, '', 'full paper');
  clip('header', 0, DURATION, `<div id="header-tag" class="tag head">모아의 연구 노트 · ${esc(f.place)}</div>`, 'full');
  tl.push(`tl.fromTo('#header-tag',{opacity:0,y:-20},{opacity:1,y:0,duration:.5,ease:'expo.out'},.05);`);

  // 1. Question: 모아 walks in and asks.
  const [s1, s2, s3, s4] = CUES;
  clip('ask', s1, s2 - s1, `<img id="moa" src="assets/img/moa-full.webp" alt=""><div id="ask-bubble" class="bubble">${rich(f.question, 60)}</div>`, 'full');
  tl.push(`tl.fromTo('#moa',{x:-420},{x:0,duration:.55,ease:'expo.out'},.15);`,
    `tl.fromTo('#moa',{scaleY:1},{scaleY:.93,duration:.12,ease:'power2.out'},.7);tl.to('#moa',{scaleY:1,duration:.25,ease:'back.out(1.6)'},.82);`,
    `tl.fromTo('#ask-bubble',{opacity:0,scale:.82},{opacity:1,scale:1,duration:.4,ease:'back.out(1.7)'},.75);`,
    `tl.to('#moa',{x:-420,duration:.3,ease:'power3.in'},${s2 - .4});tl.to('#ask-bubble',{opacity:0,duration:.3,ease:'power3.in'},${s2 - .4});`);
  sound('open', .75);

  // 2. The lab replayed: each card shows the "before", then the tool reveals the "after".
  const cardX = [110, 1030], cardY = 250, cw = 780, ch = 440;
  f.pair.forEach((p, i) => {
    const id = 'card' + i, enter = s2 + .1 + i * .3, swap = s2 + 1.6 + i * 2.0;
    const toolMark = f.tool === 'time' ? `<div id="${id}-tool" class="tool-tag">시간이 흐른 뒤</div>`
      : f.tool === 'work' ? `<div id="${id}-tool" class="tool-tag">생물의 작용</div>`
      : `<div id="${id}-tool" class="lens-ring"></div>`;
    clip(id, s2, s3 - s2, `<div id="${id}-box" class="card" style="left:${cardX[i]}px;top:${cardY}px;width:${cw}px;height:${ch}px">
  <img id="${id}-before" class="fill" src="${img(p.before)}" alt="">
  <img id="${id}-after" class="fill" src="${img(p.after)}" alt="">
  ${p.move ? `<svg id="${id}-trail" class="trail" viewBox="0 0 ${cw} ${ch}"><path d="M150 330 C 300 380, 470 160, 640 210" fill="none" stroke="${GOLD}" stroke-width="8" stroke-dasharray="4 18" stroke-linecap="round"/></svg>` : ''}
  ${toolMark}
  <div id="${id}-name" class="tag name">${esc(p.name)}</div>
</div>
<div id="${id}-lead" class="lead" style="left:${cardX[i] + cw / 2 - 2}px;top:${cardY + ch - 30}px"></div>
<div id="${id}-result" class="tag result" style="left:${cardX[i] + cw / 2}px;top:${cardY + ch + 44}px">${rich(p.result, 44)}</div>`, 'full');
    tl.push(`tl.fromTo('#${id}-box',{opacity:0,y:60},{opacity:1,y:0,duration:.5,ease:'expo.out'},${enter});`,
      `tl.fromTo('#${id}-after',{clipPath:'circle(0% at 50% 50%)'},{clipPath:'circle(75% at 50% 50%)',duration:.7,ease:'power2.inOut'},${swap + .25});`);
    if (f.tool === 'lens') tl.push(`tl.fromTo('#${id}-tool',{opacity:0,scale:.3},{opacity:1,scale:1,duration:.35,ease:'back.out(1.5)'},${swap});tl.to('#${id}-tool',{opacity:0,scale:1.25,duration:.3,ease:'power3.in'},${swap + .9});`);
    else tl.push(`tl.fromTo('#${id}-tool',{opacity:0,y:-16},{opacity:1,y:0,duration:.35,ease:'expo.out'},${swap});tl.to('#${id}-tool',{opacity:0,duration:.3,ease:'power3.in'},${swap + 1.3});`);
    if (p.move) tl.push(`tl.fromTo('#${id}-after',{x:-45,y:15,rotation:-3,scale:1.2},{x:45,y:-15,rotation:3,scale:1.2,duration:1.6,ease:'power1.inOut'},${swap + .5});`,
      `tl.fromTo('#${id}-trail path',{strokeDashoffset:0,opacity:0},{opacity:1,duration:.3},${swap + .5});`);
    tl.push(`tl.fromTo('#${id}-lead',{scaleY:0},{scaleY:1,duration:.2,ease:'power2.out'},${swap + 1.0});`,
      `tl.fromTo('#${id}-result',{opacity:0,scale:.7,xPercent:-50},{opacity:1,scale:1,xPercent:-50,duration:.3,ease:'back.out(1.8)'},${swap + 1.15});`);
    tl.push(`tl.to(['#${id}-box','#${id}-lead','#${id}-result'],{opacity:0,y:-30,duration:.3,ease:'power3.in'},${s3 - .35 + i * .05});`);
    sound(f.tool === 'lens' ? 'lens' : 'label', swap);
    sound('label', swap + 1.15);
  });

  // 3. Zoom on the part that changed; each label lands on the part it names.
  const fh = 760, fw = Math.round(fh * f.focus.aspect), fx = Math.round((W - fw) / 2), fy = 210;
  const labelHtml = f.focus.labels.map((l, j) => {
    const px = fx + fw * l.x / 100, py = fy + fh * l.y / 100, tx = px + l.dx, ty = py + l.dy;
    return `<svg id="lab${j}-line" class="leader" viewBox="0 0 ${W} ${H}"><line x1="${px}" y1="${py}" x2="${tx}" y2="${ty}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="${px}" cy="${py}" r="13" fill="${GOLD}" stroke="${INK}" stroke-width="4"/></svg>
<div id="lab${j}" class="tag label" style="left:${tx}px;top:${ty}px">${rich(l.text, 44)}</div>`;
  }).join('\n');
  clip('focus', s3, s4 - s3, `<div id="focus-box" class="card focus" style="left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px"><img id="focus-img" class="fill" src="${img(f.focus.img)}" alt=""></div>
${labelHtml}`, 'full');
  tl.push(`tl.fromTo('#focus-box',{opacity:0,scale:.92},{opacity:1,scale:1,duration:.5,ease:'expo.out'},${s3 + .05});`,
    `tl.fromTo('#focus-img',{scale:1},{scale:1.05,duration:${(s4 - s3 - .4).toFixed(2)},ease:'none'},${s3 + .2});`);
  f.focus.labels.forEach((l, j) => {
    const t = f.focus.labels.length > 2 ? s3 + .6 + j * .6 : s3 + .7 + j * .75;
    tl.push(`tl.fromTo('#lab${j}-line line',{attr:{x2:${fx + fw * l.x / 100},y2:${fy + fh * l.y / 100}}},{attr:{x2:${fx + fw * l.x / 100 + l.dx},y2:${fy + fh * l.y / 100 + l.dy}},duration:.2,ease:'power2.out'},${t});`,
      `tl.fromTo('#lab${j}-line circle',{opacity:0,scale:0,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:.2,ease:'back.out(2)'},${t - .05});`,
      `tl.fromTo('#lab${j}',{opacity:0,scale:.7,xPercent:-50,yPercent:-50},{opacity:1,scale:1,xPercent:-50,yPercent:-50,duration:.3,ease:'back.out(1.8)'},${t + .2});`);
    sound('label', t + .2);
  });
  tl.push(`tl.to(['#focus-box',${f.focus.labels.map((_, j) => `'#lab${j}','#lab${j}-line'`).join(',')}],{opacity:0,duration:.3,ease:'power3.in'},${s4 - .3});`);

  // 4. One-line answer with the two results kept as evidence, then 토토 reacts.
  const answer = f.conclusion.map(part => typeof part === 'string' ? esc(part) : part.arrow ? arrowSvg(72) : `<span class="mark">${esc(part.mark)}<span id="answer-line" class="underline"></span></span>`).join('');
  clip('answer', s4, DURATION - s4, `<div id="answer-text" class="answer">${answer}</div>
<div id="proof0" class="card proof" style="left:250px;top:330px"><img class="fill" src="${img(f.pair[0].after)}" alt=""><div class="tag mini">${rich(f.pair[0].result, 36)}</div></div>
<div id="proof1" class="card proof" style="left:870px;top:330px"><img class="fill" src="${img(f.pair[1].after)}" alt=""><div class="tag mini">${rich(f.pair[1].result, 36)}</div></div>
<img id="toto" src="assets/img/companion-full.webp" alt="">
<div id="toto-bubble" class="bubble small">${rich(f.toto, 44)}</div>`, 'full');
  tl.push(`tl.fromTo('#answer-text',{opacity:0,y:40},{opacity:1,y:0,duration:.5,ease:'expo.out'},${s4 + .1});`,
    `tl.fromTo('#answer-line',{scaleX:0},{scaleX:1,duration:.5,ease:'power2.inOut'},${s4 + .55});`,
    `tl.fromTo('#proof0',{opacity:0,y:50},{opacity:1,y:0,duration:.5,ease:'expo.out'},${s4 + .9});`,
    `tl.fromTo('#proof1',{opacity:0,y:50},{opacity:1,y:0,duration:.5,ease:'expo.out'},${s4 + 1.15});`,
    `tl.fromTo('#toto',{y:700},{y:0,duration:.55,ease:'back.out(1.4)'},${s4 + 1.3});`,
    `tl.fromTo('#toto',{scaleY:1},{scaleY:.92,duration:.12,ease:'power2.out'},${s4 + 1.85});tl.to('#toto',{scaleY:1,duration:.25,ease:'back.out(1.6)'},${s4 + 1.97});`,
    `tl.fromTo('#toto-bubble',{opacity:0,scale:.8},{opacity:1,scale:1,duration:.4,ease:'back.out(1.7)'},${s4 + 1.95});`);
  sound('answer', s4 + .1);
  sound('toto', s4 + 1.95);

  const audio = sounds.map((s, k) => `<audio id="sfx${k}" class="clip" src="assets/sfx/${SFX[s.name]}.wav" data-start="${s.t}" data-duration="${len(SFX[s.name])}" data-track-index="${50 + k}" data-volume="0.7"></audio>`).join('\n      ');
  return {html: `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${f.id} 개념 영상 · ${esc(f.place)}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      @font-face{font-family:"Lab Display";src:url('assets/fonts/jua-korean-400.woff2') format('woff2');font-weight:400;unicode-range:U+1100-11FF,U+3130-318F,U+A960-A97F,U+AC00-D7AF,U+D7B0-D7FF}
      @font-face{font-family:"Lab Display";src:url('assets/fonts/jua-latin-400.woff2') format('woff2');font-weight:400;unicode-range:U+0000-00FF,U+2000-206F}
      :root{--ink:${INK};--paper:${PAPER};--grid:${GRID};--gold:${GOLD};--accent:${f.accent};--soft:${f.soft}}
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--paper)}
      #root{position:relative;width:100%;height:100%;font-family:"Lab Display",sans-serif;color:var(--ink)}
      .full{position:absolute;inset:0}
      .paper{background-color:var(--paper);background-image:linear-gradient(var(--grid) 2px,transparent 2px),linear-gradient(90deg,var(--grid) 2px,transparent 2px);background-size:60px 60px;background-position:-2px -2px}
      .tag{position:absolute;background:#fff;border:4px solid var(--ink);border-radius:18px;padding:10px 24px;font-size:44px;line-height:1.15;white-space:nowrap;box-shadow:0 8px 0 rgba(33,63,48,.16)}
      .tag .arrow,.answer .arrow{display:inline-block;vertical-align:middle;margin:0 .15em;color:var(--accent)}
      .head{left:60px;top:44px;font-size:36px;background:var(--soft);border-color:var(--accent)}
      #moa{position:absolute;left:120px;top:250px;height:780px;transform-origin:50% 100%}
      .bubble{position:absolute;left:560px;top:330px;max-width:1220px;background:#fff;border:5px solid var(--ink);border-radius:36px;padding:44px 56px;font-size:68px;line-height:1.25;box-shadow:0 10px 0 rgba(33,63,48,.16)}
      .bubble::before{content:"";position:absolute;left:-42px;top:120px;border:22px solid transparent;border-right:24px solid var(--ink)}
      .bubble.small{left:auto;right:410px;top:auto;bottom:250px;font-size:44px;padding:24px 34px;border-radius:28px}
      .bubble.small::before{left:auto;right:-42px;top:44px;border:20px solid transparent;border-left:24px solid var(--ink)}
      .card{position:absolute;overflow:hidden;background:#fff;border:6px solid var(--ink);border-radius:24px;box-shadow:0 12px 0 rgba(33,63,48,.14)}
      .card .fill{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .card.focus .fill{object-fit:fill}
      .trail{position:absolute;inset:0;width:100%;height:100%}
      .name{left:20px;top:18px;background:var(--soft);border-color:var(--accent)}
      .lens-ring{position:absolute;left:50%;top:50%;width:360px;height:360px;margin:-180px 0 0 -180px;border:14px solid var(--gold);border-radius:50%;box-shadow:0 0 0 6px var(--ink)}
      .tool-tag{position:absolute;right:20px;top:18px;background:var(--gold);color:var(--ink);border:4px solid var(--ink);border-radius:18px;padding:8px 22px;font-size:40px}
      .lead{position:absolute;width:5px;height:76px;background:var(--ink);transform-origin:50% 0}
      .result{transform-origin:50% 0}
      .leader{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:visible}
      .label{border-color:var(--ink)}
      .answer{position:absolute;left:0;right:0;top:150px;text-align:center;font-size:84px;line-height:1.2;white-space:nowrap}
      .mark{position:relative;display:inline-block;color:var(--accent);isolation:isolate}
      .underline{position:absolute;left:-4px;right:-4px;bottom:-6px;height:14px;border-radius:7px;background:var(--gold);transform-origin:0 50%;z-index:-1}
      .proof{width:560px;height:330px}
      .tag.mini{left:50%;bottom:16px;transform:translateX(-50%);font-size:36px;padding:6px 18px;border-width:3px}
      #toto{position:absolute;right:90px;bottom:-30px;height:620px;transform-origin:50% 100%}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
      ${clips.join('\n      ')}
      ${audio}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${tl.join('\n      ')}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`, images: [...new Set([...f.pair.flatMap(p => [p.before, p.after]), f.focus.img, 'characters/moa-full', 'characters/companion-full'])], sounds: [...new Set(sounds.map(s => SFX[s.name]))]};
}

for (const f of films) {
  const dir = join(here, 'concept-' + f.id);
  for (const sub of ['assets/img', 'assets/sfx', 'assets/fonts']) await mkdir(join(dir, sub), {recursive: true});
  const out = build(f);
  await writeFile(join(dir, 'index.html'), out.html);
  for (const p of out.images) await copyFile(join(pub, p + '.webp'), join(dir, 'assets/img', p.split('/').pop() + '.webp'));
  for (const s of out.sounds) await copyFile(join(pub, 'audio', s + '.wav'), join(dir, 'assets/sfx', s + '.wav'));
  for (const font of ['jua-korean-400.woff2', 'jua-latin-400.woff2', 'Jua-OFL.txt']) await copyFile(join(here, 'fonts', font), join(dir, 'assets/fonts', font));
  await writeFile(join(dir, 'hyperframes.json'), JSON.stringify({$schema: 'https://hyperframes.heygen.com/schema/hyperframes.json', paths: {blocks: 'compositions', components: 'compositions/components', assets: 'assets'}, media: {autoProxy: true}, authoringSkill: 'hyperframes'}, null, 2) + '\n');
  await writeFile(join(dir, 'meta.json'), JSON.stringify({id: 'concept-' + f.id, name: `${f.id} 개념 영상 · ${f.place}`}, null, 2) + '\n');
  console.log('built', dir);
}
// Caption sentences shared with the app: src/concepts.ts, the VTT files and manifest.json all read src/concept-captions.json.
await writeFile(join(here, '..', 'src', 'concept-captions.json'), JSON.stringify(Object.fromEntries(films.map(f => [f.id, {duration: DURATION, cues: CUES.slice(0, -1).map((t, i) => [t, CUES[i + 1], f.captions[i]])}])), null, 1) + '\n');
