import {mountCertificateWax} from './certificate-wax.js';
import {playEffect} from './audio';
import {active,type State} from './model';
import {completionDate,creditLine} from './export';
import {canDoLines} from './experience';
import {el,button,modal,notice,reducedMotion} from './ui';
import {saveCertificatePng} from './certificate-png';

/** Certificate information is drawn from the current attempt; no recipient data is collected. */
export function openCertificate(state:State){
 const a=active(state);
 if(!a.activated){notice('코어 복구를 마치면 인증서가 열려요.');return;}
 const paper=el('section','cert-paper'+(reducedMotion(state.settings.reduced)?' cert-reduced':''));
 paper.setAttribute('aria-label','생명 코드 연구소 탐구 인증서');
 paper.innerHTML=`<img class="cert-frame" src="assets/ui/certificate-frame-20261122.webp" alt="" aria-hidden="true"><div class="cert-content"><p class="cert-world">생명코드연구소 · 모아의 연구 탐험대</p><h2 class="cert-title">생명 코드 연구소 탐구 인증서</h2><div class="cert-recipient"><div class="cert-recipient-top"><span class="cert-blank cert-school" data-cert-blank="school"></span><span>학교</span><span class="cert-blank cert-short" data-cert-blank="grade"></span><span>학년</span><span class="cert-blank cert-short" data-cert-blank="class"></span><span>반</span><span class="cert-blank cert-short" data-cert-blank="number"></span><span>번</span></div><div class="cert-recipient-name"><b>이름</b><span class="cert-blank cert-name" data-cert-blank="name"></span></div></div><p class="cert-award">위 연구원은 균류·원생생물·세균의 특징과 사는 곳을 관찰·비교하고,<br>생활에 미치는 영향과 생명과학의 활용을 탐구하였으므로<br><strong>생명 코드 탐구 연구원</strong>으로 인정하여 이 인증서를 수여함.</p><div class="cert-can-do"></div><div class="cert-bottom"><p class="cert-date">완료일<br><b></b></p><div class="cert-stamp"><span aria-hidden="true">✦</span><strong>생명 코드<br>탐구 인증</strong></div><p class="cert-issuer">발급자<br><b>생명코드연구소 · 모아</b></p></div><small class="cert-credit"></small></div>`;
 paper.querySelector('.cert-date b')!.textContent=completionDate(a);
 paper.querySelector('.cert-credit')!.textContent=creditLine();
 // Formalize only the certificate's fixed sentence frame; preserve the saved reflection.
 const lines=canDoLines(a).map(line=>line.replace(/^나는 이제 /,'').replace(/ 수 있어요\.$/,' 수 있음.')),abilities=paper.querySelector('.cert-can-do')!;
 for(const line of lines)abilities.append(el('p','',line));
 if(state.settings.admin)abilities.append(el('p','cert-preview','교사용 시연 · 예시 탐구 기록'));
 const note=el('p','cert-note','인쇄한 뒤 학교·반·번호·이름을 직접 적어요.');
 const actions=el('div','cert-actions');
 const print=button('인증서 인쇄 / PDF 저장',()=>window.print(),'primary');print.dataset.certPrint='';
 const png=button('PNG 저장',()=>void saveCertificatePng(paper,'생명코드-탐구-인증서.png').catch(()=>notice('인증서를 다시 저장해 주세요.')),'primary');png.dataset.certPng='';
 const dialog=modal('생명 코드 연구소 탐구 인증서',[paper,note,actions],{showClose:false});
 dialog.classList.add('certificate-dialog');
 actions.append(print,png,button('닫기',()=>dialog.close(),'secondary'));
 mountCertificateWax(paper,{label:'생명 코드\n탐구 인증',reduced:reducedMotion(state.settings.reduced),onImpact:()=>playEffect('map-finish')});
}
