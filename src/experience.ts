import {el,button,heading,paragraph,modal,type Context} from './ui';
import {stages} from './content';
import {validEvidence} from './model';

export const missions=[
 {icon:'lens',quest:'숲의 관찰 기록이 사라졌어. 표본의 특징을 다시 찾아줘.',reward:'표본실 조명 복구',kit:'균류 관찰 패킷',action:'초점 조절 · 촬영 · 특징 표시'},
 {icon:'drop',quest:'연못의 움직임 기록이 끊겼어. 같은 생물의 두 순간을 비교해줘.',reward:'연못 관찰소 복구',kit:'한 방울 비교 기록',action:'채집 · 멈추기 · 두 시점 비교'},
 {icon:'link',quest:'관찰과 추측이 뒤섞였어. 설명을 뒷받침하는 원문을 연결해줘.',reward:'자료 통신망 복구',kit:'세균 증거 프로필',action:'원문 열기 · 연결 · 다시 판단'},
 {icon:'clock',quest:'생물은 늘 해로울까? 시간을 되돌려 서로 다른 상황을 조사해줘.',reward:'생활마을 연구등 복구',kit:'생활 영향 사건 보고서',action:'시간 탐색 · 변화 표시 · 맥락 비교'},
 {icon:'flask',quest:'작업실이 멈췄어. 모은 발효 기록으로 설계하고 시험해줘.',reward:'BIO 작업실 전원 복구',kit:'나만의 BIO 설계도',action:'배치 · 연결 · 예상 · 실행'}
];
const paths:Record<string,string>={home:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',back:'m15 5-7 7 7 7',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',sound:'m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',mute:'m11 4-6 5H2v6h3l6 5Zm5 5 6 6m0-6-6 6',settings:'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2ZM9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',bag:'M5 7h14v14H5ZM9 7V3h6v4M5 12h14',lens:'M15 15l6 6M3 10a7 7 0 1 0 14 0 7 7 0 1 0-14 0',drop:'M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13Z',link:'m9 15 6-6M7 13 4 16a3 3 0 0 0 4 4l5-5m-2-6 5-5a3 3 0 0 1 4 4l-3 3',clock:'M12 7v6l4 2M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0',flask:'M9 3h6m-5 0v7L4 20h16l-6-10V3M7 15h10',star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',check:'m4 12 5 5L20 6',help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3v1M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0'};
export function icon(name:string){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('ui-icon');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]||paths.star);svg.append(path);return svg;}
export function iconButton(name:string,label:string,fn:()=>void,cls='icon-button',disabled=false){const b=button('',fn,cls,disabled);b.append(icon(name),el('span','',label));b.setAttribute('aria-label',label);b.title=label;return b;}
export function reward(ctx:Context,index:number){const m=missions[index];const card=el('div','reward-body');const art=el('img','reward-image');art.src=`assets/facility-${['fungi','water','archive','village','workshop'][index]}.webp`;art.alt=stages[index].place+'의 복구된 모습';const label=el('span','reward-check');label.append(icon('check'),document.createTextNode('발견 기록 연결 완료'));card.append(art,label,heading(m.kit),el('strong','reward-world',m.reward));const dialog=modal('발견이 연구소를 바꿨어!',[card,button('다음 장소 탐험',()=>dialog.close(),'primary')],{showClose:false});dialog.classList.add('reward-modal');}
export function progress(ctx:Context){const row=el('div','repair-progress');row.setAttribute('aria-label','연구소 복구 진행');stages.forEach((s,i)=>{const done=validEvidence(ctx.attempt,s.id,ctx.state.settings.admin);const b=iconButton(done?'check':missions[i].icon,`${i+1}. ${s.title}${done?' 복구 완료':''}`,()=>modal(missions[i].kit,[paragraph(done?s.summary:missions[i].quest),paragraph(`완료 보상: ${missions[i].reward}`)]),done?'repair done':'repair');row.append(b);});return row;}
const toolSelection=new Map<string,string>();
export function toolTabs(ctx:Context,side:HTMLElement,groups:{name:string;nodes:Node[]}[],initial?:string){
 const tabs=el('div','tool-tabs');const body=el('div','tool-tab-body');const key=ctx.attempt.id+ctx.attempt.route;let current=initial||toolSelection.get(key)||groups[0].name;if(!groups.some(g=>g.name===current))current=groups[0].name;
 const show=(name:string)=>{toolSelection.set(key,name);body.replaceChildren(...groups.find(g=>g.name===name)!.nodes);tabs.replaceChildren(...groups.map(g=>{const b=button(g.name,()=>show(g.name),name===g.name?'selected':'secondary');b.setAttribute('aria-pressed',String(name===g.name));return b;}));};side.replaceChildren(tabs,body);show(current);
}
export function compactTools(ctx:Context){const side=ctx.host.querySelector<HTMLElement>('.tool-panel');if(!side)return;const nodes=Array.from(side.children);const route=ctx.attempt.route;
 if(route==='fungi-microscope'){
  const split=nodes.findIndex(n=>n.classList.contains('field')&&n.textContent?.includes('관찰로 알게 된 점'));
  if(split>=0)toolTabs(ctx,side,[{name:'관찰 도구',nodes:nodes.slice(0,split)},{name:'기록 정리',nodes:nodes.slice(split)}],ctx.attempt.draft.m1.selected?'관찰 도구':undefined);
 }else if(route==='protist-observation'){
  const split=nodes.findIndex(n=>n.classList.contains('field')&&n.textContent?.startsWith('모양'));
  if(split>=0)toolTabs(ctx,side,[{name:'관찰 도구',nodes:nodes.slice(0,split)},{name:'비교 기록',nodes:nodes.slice(split)}]);
 }
 const stage=stages.findIndex(s=>s.entry===route||s.exit===route);if(stage>=0){const h=ctx.host.querySelector('.activity-heading');if(h){h.classList.add('mission-heading');const actions=el('div','heading-actions');const phase=el('div','phase-track');for(const [i,label] of ['탐색','발견 기록'].entries()){const b=button(label,()=>ctx.go(i?stages[stage].exit:stages[stage].entry),route===(i?stages[stage].exit:stages[stage].entry)?'selected':'secondary');phase.append(b);}actions.append(phase,iconButton('help','도움',()=>modal('모아의 의뢰',[paragraph(missions[stage].quest),paragraph(missions[stage].action),paragraph(`보상 · ${missions[stage].reward}`)])));h.append(actions);}}
}
