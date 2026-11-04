import {active,makeAttempt,type State} from './model';
import {el,button,paragraph,notice} from './ui';
import {settingsContent as copy} from './settingsContent';
import {syncAudio,playEffect} from './audio';
import {inquiryReferences,referenceText} from './inquiry-sources';

export type SettingsHooks = {
  save: () => void;
  render: () => void;
  go: (route: string) => void;
  resetLearner: () => void;
  showStory: () => void;
  showIntro: () => void;
  showEnding?: () => void;
  printCertificate?: () => void;
  loadExample?: () => Promise<void>;
};
function details(title: string, content: Node[]) {
  const group = el('details','settings-details');
  const body = el('div','settings-disclosure-body');body.append(...content);
  group.append(el('summary','',title),body);
  return group;
}
function textRows(rows: string[]) {return rows.map(row => paragraph(row));}
function showDialog(dialog: HTMLDialogElement, previous: HTMLElement | null) {
  dialog.addEventListener('close',() => {dialog.remove();previous?.focus();},{once:true});
  document.body.append(dialog);dialog.showModal();
}
export function openSettings(state: State, hooks: SettingsHooks, showTeacherTools=false) {
  const previous = document.activeElement as HTMLElement | null;
  const dialog = el('dialog','modal settings-dialog');
  dialog.setAttribute('aria-labelledby','settings-title');
  const title = el('h2','settings-title',copy.title);title.id = 'settings-title';
  const header = el('div','settings-header');header.append(title);
  const body = el('div','settings-scroll');
  const prefs = state.settings as State['settings'] & {bgm?: boolean;bgmVolume?: number};
  const update = () => {hooks.save();syncAudio(prefs);hooks.render();};
  const volume = el('input');volume.type='range';volume.min='0';volume.max='100';volume.step='5';volume.value=String(prefs.bgmVolume ?? 35);volume.disabled=!prefs.bgm;volume.setAttribute('aria-label',copy.sound.volume);
  const value = el('output','settings-volume',`${volume.value}%`);
  volume.oninput = () => {prefs.bgmVolume=+volume.value;value.textContent=`${volume.value}%`;hooks.save();syncAudio(prefs);};
  const switchRow = (label: string, enabled: () => boolean, change: (on: boolean) => void) => {
    const row=el('label','setting settings-sound-row');
    const input=el('input');input.type='checkbox';input.checked=enabled();input.setAttribute('role','switch');input.onchange=() => {change(input.checked);update();if(label===copy.sound.effects&&input.checked)playEffect('click');};
    const control=el('span','settings-switch');control.append(input);
    row.append(el('span','',label),control);return row;
  };
  body.append(switchRow(copy.sound.music,()=>!!prefs.bgm,on=>{prefs.bgm=on;volume.disabled=!on;}),switchRow(copy.sound.effects,()=>prefs.sound,on=>prefs.sound=on));
  const volumeRow=el('label','field settings-volume-row');const volumeLabel=el('div','settings-sound-row');volumeLabel.append(el('span','',copy.sound.volume),value);volumeRow.append(volumeLabel,volume);body.append(volumeRow);

  body.append(button(copy.story,()=>{dialog.close();hooks.showStory();},'secondary settings-wide'),button(copy.intro,()=>{dialog.close();hooks.showIntro();},'secondary settings-wide'));
  const ending = hooks.showEnding && button(copy.ending,()=>{dialog.close();hooks.showEnding!();},'secondary settings-wide');
  const certificate = button(copy.certificate,()=>{dialog.close();hooks.printCertificate?.();},'secondary settings-wide');
  const lockNote = paragraph(copy.finishFirst,'muted settings-lock-note');
  if (ending) body.append(ending);
  body.append(certificate,lockNote);
  body.append(details(copy.appInfoTitle,[...textRows(copy.appInfo),paragraph(`${copy.appName} v${copy.version} · ${copy.producer}`,'muted'),switchRow(copy.large,()=>prefs.large,on=>prefs.large=on),switchRow(copy.reduced,()=>prefs.reduced,on=>prefs.reduced=on)]));
  body.append(details(copy.studentTitle,textRows(copy.student)));
  const curriculum = details(copy.curriculumTitle,[paragraph(copy.curriculumIntro),...copy.curriculum.map(row=>paragraph(`[${row.code}] ${row.text}`))]);
  const unlock = button(prefs.admin?copy.unlockOn:copy.unlock,()=>{
    prefs.admin=!prefs.admin;
    if (prefs.admin) state.preview=makeAttempt();
    refreshMode();
    hooks.save();
    hooks.go(prefs.admin?'nature-map':state.learner.route);
  },'secondary settings-wide');unlock.setAttribute('aria-pressed',String(prefs.admin));unlock.setAttribute('aria-label','관리자 전체 해금');
  const teacherTools:Node[]=[paragraph(copy.unlockInfo),unlock,paragraph(copy.previewInfo,'muted')];
  if (hooks.loadExample) teacherTools.push(button(copy.sample,()=>{
    const load=async()=>{await hooks.loadExample!();hooks.save();dialog.close();hooks.render();hooks.go('nature-map');};void load().catch(()=>notice('예시 기록을 열지 못했어요. 다시 시도해 주세요.'));
  },'secondary settings-wide'),paragraph(copy.sampleInfo,'muted'));
  const toolsGroup=details(copy.toolsTitle,teacherTools);
  const teacherGroup=details(copy.teacherTitle,[...textRows(copy.teacher),curriculum,toolsGroup]);
  toolsGroup.open=teacherGroup.open=showTeacherTools;
  body.append(teacherGroup);
  const sources = details(copy.sourcesTitle,[paragraph(copy.sourcesIntro),...copy.sources.map(source=>{const article=el('section','settings-source');article.append(el('h3','',source.title),paragraph(source.text));return article;})]);
  for(const reference of inquiryReferences)sources.append(paragraph(referenceText(reference),'muted'));
  body.append(details(copy.creditsTitle,[...textRows(copy.credits),sources,...textRows(copy.copyright)]));
  const footer=el('div','settings-footer');
  const reset=button(prefs.admin?copy.previewReset:copy.reset,()=>{
    const confirm=el('dialog','modal settings-confirm');confirm.setAttribute('aria-labelledby','reset-title');
    const h=el('h2','',prefs.admin?copy.previewResetTitle:copy.resetTitle);h.id='reset-title';
    const cancel=button(copy.cancel,()=>confirm.close(),'secondary');cancel.autofocus=true;
    const row=el('div','settings-footer');row.append(cancel,button(copy.erase,()=>{confirm.close();dialog.close();hooks.resetLearner();},'danger'));
    confirm.append(h,paragraph(prefs.admin?copy.previewResetInfo:copy.resetInfo),row);showDialog(confirm,reset);cancel.focus();
  },'secondary');
  function refreshMode(){
    const finished=active(state).activated;
    unlock.textContent=prefs.admin?copy.unlockOn:copy.unlock;
    unlock.setAttribute('aria-pressed',String(prefs.admin));
    reset.textContent=prefs.admin?copy.previewReset:copy.reset;
    if(ending)ending.disabled=!finished;
    certificate.disabled=!finished||!hooks.printCertificate;
    lockNote.hidden=finished;
  }
  refreshMode();
  footer.append(reset,button(copy.close,()=>dialog.close(),'primary'));
  dialog.append(header,body,footer);showDialog(dialog,previous);
  if(showTeacherTools)unlock.focus();
  return dialog;
}
