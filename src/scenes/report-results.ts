import {stageIds,validEvidence,type Stage} from '../model';
import {stages} from '../content';
import {el,button,heading,paragraph,modal,notice,type Context} from '../ui';
import {core} from './solution';
import {inquiryEvidenceView} from './inquiry-evidence';
import {inquiryTasks,tasksFor} from '../curriculum';
import {downloadCard} from '../export';
import {stageBadge,habits,habitEarned,canDoLines} from '../experience';
import {playEffect,playNarration,stopNarration} from '../audio';
import {acceptedRecord} from '../inquiry-records';
// 2026-11-21: moved unchanged from main.ts (final report and results screens). Uses ctx.go / ctx.save / ctx.state, which main.ts sets to go / persist / state.
/** Set once by main.ts: the settings dialog and the discovery records (they need main.ts state). */
let main:{settings:(showTeacherTools?:boolean)=>void;records:()=>void};
export function bindMainScreens(hooks:typeof main){main=hooks;}
export function report(ctx:Context){const a=ctx.attempt;
const head=el('div','activity-heading');
head.append(heading('우리의 발견을 모아 소개해요'));
ctx.host.append(head);
const grid=el('div','workspace');
const work=el('section','workbench');
const side=el('aside','tool-panel');
grid.append(work,side);
ctx.host.append(grid);
const tabs=el('div','report-tabs');
tabs.setAttribute('aria-label','확인할 연구 기록');
ctx.host.insertBefore(tabs,grid);
 const hasRecord=(id:Stage)=>validEvidence(a,id,ctx.state.settings.admin);
 // 2026-11-15: every restored lab's record counts as presented when the report opens. The five "이 기록 확인" taps repeated the core ports.
 const unread=stageIds.filter(id=>hasRecord(id)&&!a.report.includes(id));if(unread.length){a.report.push(...unread);ctx.save();}
 const show=(id:Stage)=>{tabs.replaceChildren(...stages.map((s,i)=>{const b=button(s.title,()=>show(s.id),id===s.id?'selected':'secondary');
 b.prepend(stageBadge(i));
 b.setAttribute('aria-pressed',String(id===s.id));
 return b;}));
 work.scrollTop=0;
 work.replaceChildren(inquiryEvidenceView(a.evidence[id]));
  if(ctx.state.settings.admin&&!hasRecord(id))work.append(paragraph('아직 시연 기록이 없어요. 교사용 도구에서 예시를 불러오거나 지도에서 이 연구소를 탐험해요.'),button('교사용 도구 열기',()=>main.settings(true),'secondary'));
 };show(stageIds.find(id=>hasRecord(id))||'M1');
 const presentation=()=>{
  const form=el('div','presentation-form');
  const items=tasksFor('M4').flatMap(task=>{
   const record=a.evidence.M4?.inquiry?.records[task.id];
   return record?.completedAt?task.items.filter(it=>record.opened.includes(it.id)):[];
  });
  const saved=a.presentation;
  const pick=el('select');pick.setAttribute('aria-label','발표할 생활 사건');
  if(saved)pick.append(new Option('내가 저장한 발표',''));
  for(const item of items)pick.append(new Option(item.label,item.id));
  const prompt=el('label','field');prompt.append(el('span','field-label','발표할 생활 사건'),pick);if(items.length)form.append(prompt);
  const fields={observation:el('textarea'),evidence:el('textarea'),life:el('textarea')};
  const draw=()=>{
   const item=items.find(it=>it.id===pick.value);
   fields.observation.value=item?.label??saved?.observation??'';
   fields.evidence.value=item?.detail??saved?.evidence??'';
   fields.life.value=item?'':saved?.life??'';
  };
  for(const [key,label] of [['observation','조사한 사건'],['evidence','그렇게 생각한 근거'],['life','우리 생활과의 연결']] as const){
   const wrap=el('label','field'),input=fields[key];input.maxLength=140;input.setAttribute('aria-label',label);
   wrap.append(el('span','field-label',label),input);form.append(wrap);
  }
  fields.life.placeholder='누구에게 어떤 도움이나 문제가 되었나요?';pick.onchange=draw;draw();
  const album=el('details','evidence-details');album.append(el('summary','','내 조사 기록 펼치기'),inquiryEvidenceView(a.evidence.M4));
  const dialog=modal('우리 생활 속 생물',[form,button('발표 문장 저장',()=>{
   a.presentation={observation:fields.observation.value,evidence:fields.evidence.value,life:fields.life.value};ctx.save();dialog.close();
  },'primary'),album]);
 };
 const gathered=stageIds.filter(id=>hasRecord(id)).length;
 const reportStatus=paragraph(gathered===5?'다섯 연구소의 발견이 모였어요. 위에서 연구소를 눌러 다시 읽어 보고, 코어에 연결해요.':`발견 ${gathered}/5 · 지도에서 남은 연구소를 탐험해요.`,'report-status');
 const mentor=el('img','report-mentor');mentor.src='assets/characters/moa-portrait.webp';mentor.alt='모아 연구원';side.append(reportStatus,mentor,heading('내 말로 소개해요'),paragraph('관찰한 것 / 그렇게 생각한 근거 / 우리 생활과의 연결'),button('생활 사건 발표',presentation,'secondary',!hasRecord('M4')));
 const f=el('div','action-bar');f.append(button('발견을 코어에 연결',()=>ctx.go('core-restoration'),'primary',!stageIds.every(id=>hasRecord(id)&&a.report.includes(id))));ctx.host.append(f);
}
/** Moa's line plays once per visit of the session, not on every re-render. */
let resultsVoiced=false;
export function results(ctx:Context){const a=ctx.attempt;
ctx.host.classList.add('results');
const publish=acceptedRecord(a,'M5-4');
const choice=inquiryTasks.find(t=>t.id==='M5-4')!.items.find(i=>i.id===publish?.assignments.case);
const layout=el('div','results-layout');
const celebration=el('section','result-celebration');
const stamp=el('span','completion-seal',a.activated?'연구소 복구 완료':ctx.state.settings.admin?'결과 미리보기':'교사용 시연 · 결과 미리보기');
celebration.append(stamp,el('h1','','작은 생물,\n우리 생활의 큰 발견'),paragraph(a.activated?'너의 발견으로 연구소가 다시 깨어났어요.':'탐구 기록을 모아 코어를 가동하면 여기에 결과가 나타나요.'));
if(a.activated&&!resultsVoiced){resultsVoiced=true;
playNarration('results-1');
ctx.cleanup(stopNarration);}
const earned=el('div','result-badges');
earned.setAttribute('aria-label',`복구한 연구 구역 ${stageIds.filter(id=>a.evidence[id]).length}개`);
stages.forEach((s,i)=>{if(!a.evidence[s.id])return;
const b=stageBadge(i,`result-badge${habitEarned(a,s.id)?' habit':''}`);
b.title=habitEarned(a,s.id)?habits[i].name+' 배지':'';
earned.append(b);});
const habitCount=stageIds.filter(id=>habitEarned(a,id)).length;
if(earned.childElementCount)celebration.append(earned);
celebration.append(paragraph(`탐구 습관 배지 ${habitCount}/5${habitCount<5?' · 발견 도감에서 다시 도전할 수 있어요':' · 모두 모았어요'}`,'habit-summary'));
const companions=el('div','result-companions');
for(const [name,alt] of [['moa','모아 연구원'],['companion','길잡이 토토']]){const pic=el('img');
pic.src=`assets/characters/${name}-full.webp`;
pic.alt=alt;
companions.append(pic);}
celebration.append(companions);
const card=el('section','result-card');
card.append(el('span','eyebrow','짝에게 카드를 보여 주고 설명해요'),heading('나만의 생물 소개 카드'));
const title=el('input');
title.id='result-title';
title.maxLength=36;
title.value=a.cardTitle;
title.setAttribute('aria-label','소개 카드 제목');
title.oninput=()=>{a.cardTitle=title.value;
ctx.save();};
const titleLabel=el('label','field-label','소개 카드 제목');
titleLabel.htmlFor=title.id;
const note=el('textarea');
note.id='result-note';
note.maxLength=100;
note.value=a.cardNote||publish?.note||'';
note.setAttribute('aria-label','소개 문장');
note.oninput=()=>{a.cardNote=note.value;
ctx.save();};
const noteLabel=el('label','field-label','친구에게 전할 발견');
noteLabel.htmlFor=note.id;
card.append(titleLabel,title,paragraph(choice?`소개할 사례: ${choice.label}\n${choice.detail}`:'내가 만든 연구 기록을 친구에게 소개해요.','result-case'),noteLabel,note);
 const canDo=el('div','can-do');const canDoText=paragraph('','can-do-lines');const certificate=el('section','print-certificate');
 const drawCertificate=()=>{const lines=canDoLines(a);
 canDoText.textContent=lines.length?lines.join('\n'):'인증서에 넣을 "나는 이제 … 할 수 있어요" 문장을 골라요.';
 canDoText.classList.toggle('empty',!lines.length);
 certificate.replaceChildren(heading('생명 코드 연구소 탐구 인증서'),paragraph('관찰 · 비교 · 근거 조사 · 생활 영향 · 활용 설계'),paragraph(a.cardTitle),...lines.map(line=>paragraph(line,'certificate-can')),
   paragraph(a.cardNote),paragraph(`20개 탐구 활동과 다섯 연구 패킷을 완성했어요. 탐구 습관 배지 ${stageIds.filter(id=>habitEarned(a,id)).length}/5`));};
 const pickCanDo=()=>{const chosen=new Set(a.canDo||[]);
 const list=el('div','can-do-choices');
 stages.forEach((s,i)=>{const b=button(habits[i].can,()=>{if(chosen.has(s.id))chosen.delete(s.id);else chosen.add(s.id);
 b.classList.toggle('selected',chosen.has(s.id));
 b.setAttribute('aria-pressed',String(chosen.has(s.id)));},chosen.has(s.id)?'secondary selected':'secondary');
 b.prepend(stageBadge(i));
 b.setAttribute('aria-pressed',String(chosen.has(s.id)));
 list.append(b);});
 const own=el('input');
 own.id='can-do-own';
 own.maxLength=40;
 own.value=a.canDoNote||'';
 own.placeholder='예) 집에서 곰팡이가 생기는 곳을 찾아 설명할';
 const ownLabel=el('label','field can-do-own');
 ownLabel.htmlFor=own.id;
 ownLabel.append(el('span','field-label','내 말로 쓰기'),el('span','can-do-frame','나는 이제'),own,el('span','can-do-frame','수 있어요.'));
 const dialog=modal('나는 이제 이런 것을 할 수 있어요',[paragraph('해 보니 할 수 있게 된 것을 골라요. 여러 개 골라도 되고, 내 말로 써도 돼요.'),list,ownLabel,button('인증서에 넣기',()=>{a.canDo=stageIds.filter(id=>chosen.has(id));
 a.canDoNote=own.value.trim();
 ctx.save();
 drawCertificate();
 dialog.close();},'primary')]);
 dialog.classList.add('can-do-dialog');};
 canDo.append(el('span','field-label','나는 이제 이런 것을 할 수 있어요'),canDoText,button('할 수 있게 된 것 고르기',pickCanDo));
 card.append(canDo);
 drawCertificate();
 const row=el('div','hero-actions');
 row.append(button('내 카드 저장',()=>void downloadCard(ctx.state).then(()=>playEffect('success'),()=>notice('카드를 다시 저장해 주세요.')),'primary'),button('인증서 인쇄',()=>window.print(),'secondary',!a.activated),button('발견 도감',main.records));
 card.append(row);
 layout.append(celebration,card);
 ctx.host.append(layout);
 if(a.activated)ctx.host.append(certificate);}