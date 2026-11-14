// Renders the intro/final films: grades the source clip, burns in NanumSquare Neo captions and motion graphics
// drawn frame by frame in a headless browser, mixes project sound effects, and writes public/assets/film/.
// Usage: node scripts/render-film.mjs [intro|final]   (FFMPEG_PATH overrides the ffmpeg binary)
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
import {launchBrowser} from '../tests/browser.mjs';

const ffmpeg=process.env.FFMPEG_PATH||(existsSync('D:/DevCaches/tools/ffmpeg/bin/ffmpeg.exe')?'D:/DevCaches/tools/ffmpeg/bin/ffmpeg.exe':'ffmpeg');
const FPS=30,SOURCE='assets/generated/film-20261104',OUT='public/assets/film';
const GRADE='eq=contrast=1.05:saturation=1.1,vignette=angle=PI/5';
const films={
 intro:{
  // The source fades to black by 20.6s, then flashes a bright frame; everything after the fade is cut.
  srcEnd:20.6,total:24.8,poster:2.2,
  glitch:[[4.85,5.05],[5.3,5.42],[6.1,6.2]],
  cues:[
   [1.3,4.4,'숲과 연못, 작은 생물의 마을에 온 걸 환영해!'],
   [4.6,7.7,'그런데 [연구 기록]이 뒤섞여 버렸어!'],
   [8,11,'[빵의 곰팡이], [요구르트를 만드는 세균]…'],
   [11.2,13.8,'우리 생활에 어떤 일을 할까?'],
   [14,16.8,'숲과 연못에서 [관찰]하고, [근거]를 모아'],
   [17,19.6,'[다섯 기록]으로 연구소를 깨워 줘!'],
   [21.3,23,'다섯 기록을 모아 BIO CORE를 깨워요'],
   [23,24.8,'탐험 시작!']
  ],
  sfx:[['retry',4.85,.2],...[0,1,2,3,4].map(i=>['snap',21.7+i*.18,.22]),['success',23,.3]]
 },
 final:{
  // The source closes on an iris and a bright flash frame; the film holds Toto's jump (20.95s) instead.
  srcEnd:20.95,total:26.4,poster:20.95,glitch:[],hold:true,
  cues:[
   [.9,4,'균류·원생생물·세균의 특징을 찾고,'],
   [4.2,7.6,'도움과 피해를 [근거]로 설명했어!'],
   [8.2,12,'관찰하고, 비교하고, [근거]를 모아'],
   [16.7,19.3,'내 기록으로 [BIO CORE] 복구 성공!'],
   [19.7,22.7,'내 발견을 [소개 카드]로 남겨 볼까?'],
   [23,26.4,'이제 나도 생물 연구자!']
  ],
  sfx:[...[0,1,2,3,4].map(i=>['snap',14.7+i*.3,.2]),['core-wake',16.2,.35],['success',21.4,.3],...[0,1,2,3,4].map(i=>['snap',23.5+i*.14,.2])]
 }
};

const dataUrl=(path,type)=>`data:${type};base64,${readFileSync(path).toString('base64')}`;
function freezeFrame(film,t){
 const r=spawnSync(ffmpeg,['-v','error','-ss',String(t),'-i',`${SOURCE}/${film}.mp4`,'-frames:v','1','-vf',GRADE,'-f','image2pipe','-c:v','png','pipe:1'],{maxBuffer:1<<26});
 if(r.status)throw Error(String(r.stderr));
 return `data:image/png;base64,${r.stdout.toString('base64')}`;
}

// Everything below this function runs in the page. t is seconds on the output timeline.
function overlayProgram(name,cues,total,freezeAt){
 const W=1920,H=1080,BAR=96;
 const canvas=document.querySelector('canvas'),g=canvas.getContext('2d');
 const img=id=>document.getElementById(id);
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const span=(t,a,b)=>clamp((t-a)/(b-a));
 const out=v=>1-Math.pow(1-v,3);
 const back=v=>{const c=1.70158;return 1+(c+1)*Math.pow(v-1,3)+c*Math.pow(v-1,2);};
 const rand=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const font=size=>`700 ${size}px NanumSquareNeo,"Malgun Gothic",sans-serif`;
 const bars=h=>{if(h<=0)return;g.fillStyle='#000';g.fillRect(0,0,W,h);g.fillRect(0,H-h,W,h);};
 function caption(t,a,b,text,y=H-BAR/2,size=50){
  const alpha=Math.min(span(t,a,a+.25),1-span(t,b-.25,b));if(alpha<=0)return;
  const parts=text.split(/(\[[^\]]+\])/).filter(Boolean).map(p=>p[0]==='['?[p.slice(1,-1),true]:[p,false]);
  g.save();g.globalAlpha=alpha;g.font=font(size);g.textBaseline='middle';
  const width=parts.reduce((s,[p])=>s+g.measureText(p).width,0);
  const lift=(1-out(span(t,a,a+.3)))*12,x0=(W-width)/2;
  g.fillStyle='rgba(6,20,18,.66)';g.beginPath();g.roundRect(x0-36,y-44+lift,width+72,84,42);g.fill();
  let x=x0;for(const [p,hot] of parts){g.fillStyle=hot?'#ffd35c':'#fff8e7';g.fillText(p,x,y+2+lift);x+=g.measureText(p).width;}
  g.restore();
 }
 function chip(t,a,b,text,color,blink=false){
  const alpha=Math.min(span(t,a,a+.2),1-span(t,b-.2,b));if(alpha<=0)return;
  g.save();g.globalAlpha=alpha;g.font=font(36);g.textBaseline='middle';
  const w=g.measureText(text).width+92,x=(W-w)/2,y=BAR/2;
  g.fillStyle='rgba(6,20,18,.78)';g.strokeStyle=color;g.lineWidth=3;g.beginPath();g.roundRect(x,y-34,w,68,34);g.fill();g.stroke();
  if(!blink||Math.floor(t*5)%2===0){g.fillStyle=color;g.beginPath();g.arc(x+36,y,10,0,7);g.fill();}
  g.fillStyle='#fff8e7';g.fillText(text,x+60,y+2);g.restore();
 }
 function centered(text,y,size,color,alpha=1,scale=1,stroke){
  g.save();g.globalAlpha=alpha;g.translate(W/2,y);g.scale(scale,scale);g.font=font(size);g.textAlign='center';g.textBaseline='middle';
  if(stroke){g.lineJoin='round';g.lineWidth=size*.2;g.strokeStyle=stroke;g.strokeText(text,0,0);}
  g.fillStyle=color;g.fillText(text,0,0);g.restore();
 }
 function badges(t,start,step,y,size,gap){
  const row=5*size+4*gap;
  for(let i=0;i<5;i++){
   const at=start+i*step,v=span(t,at,at+.35);if(v<=0)continue;
   const cx=(W-row)/2+i*(size+gap)+size/2,s=back(v)*size;
   const ring=span(t,at,at+.55);
   if(ring<1){g.save();g.globalAlpha=(1-ring)*.8;g.strokeStyle='#ffd35c';g.lineWidth=6;g.beginPath();g.arc(cx,y,size*(.5+ring*.65),0,7);g.stroke();g.restore();}
   g.drawImage(img(`badge${i}`),cx-s/2,y-s/2,s,s);
  }
 }
 const spores=[...Array(46)].map((_,i)=>{const r=rand(i*97+11);return {x:r()*W,y:r()*H,s:2+r()*5,v:18+r()*42,p:r()*7};});
 function intro(t){
  const opening=1-span(t,0,.7);
  bars(BAR*out(span(t,.2,1.3)));
  if(t>4.8&&t<5.5){const r=rand(Math.floor(t*30)*31+7);for(let i=0;i<7;i++){g.fillStyle=['rgba(255,70,90,.2)','rgba(70,235,220,.2)','rgba(255,255,255,.14)'][i%3];g.fillRect(0,BAR+r()*(H-BAR*2),W,6+r()*34);}}
  chip(t,4.8,7.7,'연구 기록 연결 오류','#ff7a59',true);
  for(const [a,b,text] of cues.slice(0,6))caption(t,a,b,text);
  const card=span(t,20.1,20.7);
  if(card>0){
   g.save();g.globalAlpha=card;g.fillStyle='#04201b';g.fillRect(0,0,W,H);
   const pulse=.5+.5*Math.sin(t*2.2),glow=g.createRadialGradient(W/2,470,40,W/2,470,820);
   glow.addColorStop(0,`rgba(112,235,140,${.26+pulse*.12})`);glow.addColorStop(1,'rgba(4,32,27,0)');g.fillStyle=glow;g.fillRect(0,0,W,H);
   for(const p of spores){const y=((p.y-t*p.v)%H+H)%H;g.globalAlpha=card*(.25+.45*Math.abs(Math.sin(t+p.p)));g.fillStyle='#bff5c9';g.beginPath();g.arc(p.x,y,p.s,0,7);g.fill();}
   g.restore();
   const logo=img('logo'),v=span(t,20.7,21.25);
   if(v>0){const h=330*back(v),w=h*logo.naturalWidth/logo.naturalHeight;g.save();g.globalAlpha=clamp(v*2);g.drawImage(logo,(W-w)/2,235-h/2,w,h);g.restore();}
   const [a,b,text]=cues[6];centered(text,505,62,'#fff8e7',span(t,21.3,21.6));void a;void b;
   badges(t,21.7,.18,690,150,44);
   const go=span(t,23,23.4);if(go>0)centered(cues[7][2],900,112,'#ffd35c',clamp(go*2),back(go)*(1+.025*Math.sin((t-23)*5)),'#0a3a30');
  }
  const closing=span(t,total-.4,total),black=Math.max(opening,closing);
  if(black>0){g.fillStyle=`rgba(0,0,0,${black})`;g.fillRect(0,0,W,H);}
 }
 const CORE=[730,345];
 const motes=[...Array(90)].map((_,i)=>{const r=rand(i*131+3);return {a:r()*6.28,v:90+r()*240,s:2+r()*6,d:r()*1.6,l:1.2+r()*1.4};});
 const confetti=[...Array(190)].map((_,i)=>{const r=rand(i*173+5);return {x:r()*W,vx:(r()-.5)*170,y:-40-r()*560,v:230+r()*260,w:10+r()*12,h:6+r()*9,spin:(r()-.5)*11,p:r()*7,c:['#ffd35c','#ff8fa3','#7ce0a8','#6fc7f2','#fff3c4'][i%5],at:21.4+r()*1.1};});
 function final(t){
  const opening=1-span(t,0,.6);
  if(t>=freezeAt){
   // The clone-padded source sits underneath; dissolving in hides the RGB round trip's slight brightness change.
   const still=img('freeze'),z=1+.055*span(t,freezeAt+.6,total),w=W*z,h=H*z;
   g.globalAlpha=span(t,freezeAt,freezeAt+.6);g.drawImage(still,(W-w)/2,(H-h)*.42,w,h);g.globalAlpha=1;
   const warm=g.createRadialGradient(W/2,120,60,W/2,120,1100);warm.addColorStop(0,`rgba(255,226,150,${.3*span(t,21.4,22.2)})`);warm.addColorStop(1,'rgba(255,226,150,0)');g.fillStyle=warm;g.fillRect(0,0,W,H);
  }
  bars(BAR*(1-out(span(t,16.25,17.1))));
  if(t>14.6&&t<16.4){const n=clamp(Math.floor((t-14.7)/.3)+1,1,5);chip(t,14.6,16.4,`기록 연결 ${n}/5`,'#7ce0a8');}
  if(t>16.1&&t<17.8){
   const v=span(t,16.2,16.45),decay=1-span(t,16.45,17.7),power=Math.min(v,decay);
   const flash=g.createRadialGradient(CORE[0],CORE[1],20,CORE[0],CORE[1],1250);
   flash.addColorStop(0,`rgba(255,255,235,${.95*power})`);flash.addColorStop(.35,`rgba(180,255,170,${.55*power})`);flash.addColorStop(1,'rgba(150,255,160,0)');
   g.fillStyle=flash;g.fillRect(0,0,W,H);
   for(const delay of [0,.22]){const r=span(t,16.3+delay,17.3+delay);if(r>0&&r<1){g.save();g.globalAlpha=(1-r)*.75;g.strokeStyle='#eaffc9';g.lineWidth=14*(1-r)+2;g.beginPath();g.arc(CORE[0],CORE[1],90+r*900,0,7);g.stroke();g.restore();}}
  }
  if(t>16.3&&t<19.6)for(const m of motes){const age=t-16.3-m.d;if(age<0||age>m.l)continue;const k=age/m.l,d=m.v*age;g.globalAlpha=(1-k)*.9;g.fillStyle='#e9ffb8';g.beginPath();g.arc(CORE[0]+Math.cos(m.a)*d,CORE[1]+Math.sin(m.a)*d-age*age*30,m.s,0,7);g.fill();}
  g.globalAlpha=1;
  for(const [a,b,text] of cues.slice(0,5))caption(t,a,b,text,t>17?H-74:H-BAR/2);
  if(t>=21.4){
   for(const c of confetti){const age=t-c.at;if(age<0)continue;const y=c.y+c.v*age,x=c.x+c.vx*age+Math.sin(age*2+c.p)*34;if(y>H+30)continue;g.save();g.translate(x,y);g.rotate(c.p+age*c.spin);g.fillStyle=c.c;g.fillRect(-c.w/2,-c.h/2,c.w,c.h);g.restore();}
   const hit=span(t,21.4,21.62);
   g.save();g.translate(1560,205);g.rotate(-.1);const s=1+(1-out(hit))*1.5;g.scale(s,s);g.globalAlpha=clamp(hit*2.4);
   g.fillStyle='rgba(255,250,232,.96)';g.strokeStyle='#b5482f';g.lineWidth=9;g.beginPath();g.roundRect(-225,-68,450,136,26);g.fill();g.stroke();
   g.lineWidth=3;g.beginPath();g.roundRect(-211,-54,422,108,18);g.stroke();
   g.font=font(52);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#b5482f';g.fillText('연구소 복구 완료',0,3);g.restore();
  }
  const finale=span(t,22.9,23.4);
  if(finale>0){
   const scrim=g.createLinearGradient(0,690,0,H);scrim.addColorStop(0,'rgba(10,40,33,0)');scrim.addColorStop(.45,`rgba(10,40,33,${.82*finale})`);scrim.addColorStop(1,`rgba(10,40,33,${.92*finale})`);g.fillStyle=scrim;g.fillRect(0,690,W,H-690);
   centered(cues[5][2],862,100,'#ffd35c',clamp(finale*2),back(finale),'#0a3a30');
   badges(t,23.5,.14,985,104,36);
  }
  if(opening>0){g.fillStyle=`rgba(0,0,0,${opening})`;g.fillRect(0,0,W,H);}
  const closing=span(t,total-.5,total);if(closing>0){g.fillStyle=`rgba(255,250,235,${closing})`;g.fillRect(0,0,W,H);}
 }
 window.drawFrame=t=>{g.clearRect(0,0,W,H);(name==='intro'?intro:final)(t);return canvas.toDataURL('image/png').slice(22);};
}

async function render(name){
 const film=films[name];mkdirSync(OUT,{recursive:true});
 const extra=film.total-film.srcEnd,frames=Math.round(film.total*FPS);
 const freeze=name==='final'?`<img id="freeze" src="${freezeFrame(name,film.srcEnd)}">`:'';
 const html=`<!doctype html><style>
 @font-face{font-family:NanumSquareNeo;src:url(${dataUrl('public/assets/fonts/NanumSquareNeoTTF-cBd.woff2','font/woff2')}) format('woff2');font-weight:700}
 img{display:none}</style><canvas width="1920" height="1080"></canvas>
 <img id="logo" src="${dataUrl('public/assets/ui/logo.webp','image/webp')}">
 ${[1,2,3,4,5].map((n,i)=>`<img id="badge${i}" src="${dataUrl(`public/assets/ui/badge-M${n}.webp`,'image/webp')}">`).join('')}${freeze}`;
 const browser=await launchBrowser();const page=await browser.newPage();
 await page.setContent(html,{waitUntil:'load'});
 await page.evaluate(async()=>{await Promise.all([document.fonts.load('700 50px NanumSquareNeo','연구 BIO 1/5'),...[...document.images].map(i=>i.decode())]);});
 await page.evaluate(`(${overlayProgram})(${JSON.stringify(name)},${JSON.stringify(film.cues)},${film.total},${film.srcEnd})`);

 const glitch=film.glitch.length?`,rgbashift=rh=-16:bh=16:enable='${film.glitch.map(([a,b])=>`between(t,${a},${b})`).join('+')}'`:'';
 const sounds=film.sfx.map(([file])=>['-i',`public/assets/audio/${file}.wav`]).flat();
 const mix=film.sfx.map(([,at,gain],i)=>`[${i+2}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=${Math.round(at*1000)}:all=1,volume=${gain}[s${i}]`);
 const graph=[
  `[0:v]trim=end=${film.srcEnd},setpts=PTS-STARTPTS,fps=${FPS},${GRADE}${glitch},tpad=stop_mode=${film.hold?'clone':'add'}:stop_duration=${extra}:color=black[base]`,
  `[1:v]scale=out_color_matrix=bt709,format=yuva420p[ui]`,
  `[base][ui]overlay=0:0:eof_action=endall,scale=1280:720:flags=lanczos,format=yuv420p[v]`,
  `[0:a]atrim=end=${film.srcEnd},asetpts=PTS-STARTPTS,volume=7dB[amb]`,
  ...mix,
  `[amb]${film.sfx.map((_,i)=>`[s${i}]`).join('')}amix=inputs=${film.sfx.length+1}:normalize=0:duration=longest,alimiter=limit=0.7:level=0,apad,atrim=end=${film.total},afade=t=out:st=${film.total-.5}:d=0.5[a]`
 ].join(';');
 const encoder=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',`${SOURCE}/${name}.mp4`,'-f','image2pipe','-framerate',String(FPS),'-c:v','png','-i','pipe:0',...sounds,'-filter_complex',graph,'-map','[v]','-map','[a]','-filter_threads','2','-c:v','libx264','-preset','slow','-crf','24','-profile:v','high','-level','4.1','-pix_fmt','yuv420p','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','128k','-map_metadata','-1','-movflags','+faststart',`${OUT}/${name}.mp4`],{stdio:['pipe','inherit','inherit']});
 const done=new Promise((ok,fail)=>encoder.on('close',code=>code?fail(Error(`ffmpeg exited ${code}`)):ok()));
 for(let frame=0;frame<frames;frame++){
  const png=Buffer.from(await page.evaluate(t=>window.drawFrame(t),frame/FPS),'base64');
  if(!encoder.stdin.write(png))await new Promise(ok=>encoder.stdin.once('drain',ok));
  if(frame%150===0)console.log(`${name} ${frame}/${frames}`);
 }
 encoder.stdin.end();await done;await browser.close();

 const stamp=s=>{const m=Math.floor(s/60),r=(s%60).toFixed(3).padStart(6,'0');return `00:${String(m).padStart(2,'0')}:${r}`;};
 writeFileSync(`${OUT}/${name}.vtt`,`WEBVTT\n\n${film.cues.map(([a,b,text])=>`${stamp(a)} --> ${stamp(b)}\n${text.replace(/[[\]]/g,'')}`).join('\n\n')}\n`);
 const poster=spawnSync(ffmpeg,['-v','error','-ss',String(film.poster),'-i',`${OUT}/${name}.mp4`,'-frames:v','1','-vf','scale=1280:-2','-f','image2pipe','-c:v','png','pipe:1'],{maxBuffer:1<<24});
 if(poster.status)throw Error(String(poster.stderr));
 await sharp(poster.stdout).webp({quality:80}).toFile(`${OUT}/${name}.webp`);
}

for(const name of process.argv[2]?[process.argv[2]]:Object.keys(films))await render(name);
