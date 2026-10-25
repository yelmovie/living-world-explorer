import {el,heading,paragraph} from './ui';
import {canvas,draw} from './draw';
import {sources,cases,modules,organisms,stages} from './content';
import {captureValid,featurePoint,type Evidence} from './model';
export function evidenceView(e:Evidence|undefined){
 const box=el('div','evidence-view');if(!e){box.append(paragraph('아직 기록이 없어요. 예시 공간에서 앞선 탐구를 해볼 수 있어요.'));return box;}
 const d=e.draft;box.append(el('span','eyebrow',e.origin==='demo'?'예시 연구 기록':'내가 만든 연구 기록'));
 if(e.stage==='M1'){const pair=el('div','comparison-pair');for(const kind of ['mushroom','mold']){const c=d.m1.captures.find(c=>c.organism===kind&&captureValid(c)&&c.marks.some(p=>featurePoint(kind,p)));if(!c)continue;const v=canvas(360,220);draw(v,c.organism,{...c,marks:c.marks.map(p=>({x:(p.x+c.pan.x-.5)*c.zoom+.5,y:(p.y+c.pan.y-.5)*c.zoom+.5}))});const p=el('div');p.append(paragraph(organisms[c.organism]),v);pair.append(p);}box.append(pair,paragraph('내가 표시한 특징과 발견 환경을 연결했어요.'));}
 if(e.stage==='M2'){const pair=el('div','comparison-pair');for(const t of [d.m2.a,d.m2.b]){const c=canvas(360,220);draw(c,'paramecium',{time:t??0,trail:true});pair.append(c);}box.append(pair,paragraph(`고정한 시점 ${d.m2.a} → ${d.m2.b} · 채집: ${d.m2.site==='edge'?'물가':'물풀'} 가까이`));}
 if(e.stage==='M3'){for(const claim of ['trait','habitat'])box.append(paragraph(`${claim==='trait'?'특징':'사는 곳'} ← ${(d.m3.bindings[claim]||[]).map(id=>sources.find(s=>s.id===id)?.title).join(', ')}`));}
 if(e.stage==='M4'){const pair=el('div','comparison-pair');for(const [i,t] of [d.m4.a,d.m4.b].entries()){const c=canvas(360,220);draw(c,'bread',{time:t??0,marks:i?d.m4.marks:[]});pair.append(c);}box.append(pair);for(const c of cases)box.append(paragraph(`${c.name}: ${d.m4.answers[c.id]==='help'?'도움':'문제'} · ${c.explain}`));}
 if(e.stage==='M5'){const run=d.m5.runs.findLast(r=>r.passed&&r.revision===d.m5.revision);if(run)box.append(paragraph(run.choices.map(id=>modules.find(m=>m.id===id)?.label).join(' → ')),paragraph(`예상: ${run.prediction==='yogurt'?'요구르트로 이어짐':'이어지지 않음'} / 관찰: 요구르트로 이어짐`),paragraph(`설계 ${run.revision+1} · ${d.m5.runs.length}번 실행 후 기록`));}
 return box;
}
