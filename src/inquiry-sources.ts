import {el,paragraph} from './ui';
import type {InquiryTask} from './inquiry-model';
export const inquiryReferences=[
 {title:'OpenStax Biology 2e · 균류의 구조·효모·분해',url:'https://openstax.org/books/biology-2e/pages/24-1-characteristics-of-fungi'},
 {title:'OpenStax Biology 2e · 세균의 여러 모양',url:'https://openstax.org/books/biology-2e/pages/22-2-structure-of-prokaryotes-bacteria-and-archaea'},
 {title:'OpenStax Biology 2e · 해캄과 짚신벌레',url:'https://openstax.org/books/biology-2e/pages/23-3-groups-of-protists'},
 {title:'FAO · 발효유와 요구르트의 특정 세균 (부록 VII 자료)',url:'https://www.fao.org/4/x4888e/x4888e0h.htm'}
];
export function sourceNotes(task:Pick<InquiryTask,'stage'>){
 const box=el('details','source-notes');box.append(el('summary','','생성 모형·관찰 조건·참고 자료'));
 box.append(paragraph('그림은 학습용 생성 모형이며 실제 현미경 사진이 아니에요. 채집·발견 장소와 조사 메모도 수업용 가상 사례예요. 아래 문헌은 생물의 특징과 작용을 설명할 때 참고했어요.'));
 box.append(paragraph('비교는 같은 표본·시야·크기에서 관찰 순서 1~4를 보여 줘요. 실제 날짜·온도·배율을 측정한 자료는 아니에요. 전후 변화만으로 관여 생물을 모두 알아낼 수는 없어요.'));
 const indexes=task.stage==='M1'?[0]:task.stage==='M2'?[2]:task.stage==='M3'?[1,3]:[0,3];
 for(const i of indexes){const reference=inquiryReferences[i],link=el('a','',reference.title);link.href=reference.url;link.target='_blank';link.rel='noopener noreferrer';box.append(link);}
 return box;
}
