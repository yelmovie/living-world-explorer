import {storageMessage} from './storage';
import {active,makeAttempt,type State} from './model';
import {el,button,paragraph,notice} from './ui';
import {settingsContent as copy} from './settingsContent';
import {syncAudio,playEffect} from './audio';
import {inquiryReferences,referenceText} from './inquiry-sources';

export type SettingsHooks = {
  save: () => void;
  render: () => void;
  updateSound: () => void;
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
  dialog.setAttribute('aria-labelledby','settings-title');dialog.dataset.scienceSettings='';
  const title = el('h2','settings-title','설정');title.id = 'settings-title';
  const header = el('div','settings-header');header.append(title);
  const body = el('div','settings-scroll science-settings-body');
  const storageStatus=paragraph('기록 상태: '+storageMessage,'storage-status');storageStatus.setAttribute('role','status');
  const prefs = state.settings;
  const update = () => {hooks.save();syncAudio(prefs);hooks.updateSound();};
  const volume = el('input');volume.type='range';volume.min='0';volume.max='100';volume.step='5';volume.value=String(prefs.bgmVolume ?? 35);volume.disabled=!prefs.bgm;volume.setAttribute('aria-label',copy.sound.volume);
  const value = el('output','settings-volume',`${volume.value}%`);
  volume.oninput = () => {prefs.bgmVolume=+volume.value;value.textContent=`${volume.value}%`;hooks.save();syncAudio(prefs);};
  // 2026-11-20: effect volume, same row and step as the music slider. 100% is the level the effects always had.
  const effectVolume = el('input');effectVolume.type='range';effectVolume.min='0';effectVolume.max='100';effectVolume.step='5';effectVolume.value=String(prefs.effectVolume ?? 100);effectVolume.disabled=!prefs.sound;effectVolume.setAttribute('aria-label',copy.sound.effectVolume);
  const effectValue = el('output','settings-volume',`${effectVolume.value}%`);
  effectVolume.oninput = () => {prefs.effectVolume=+effectVolume.value;effectValue.textContent=`${effectVolume.value}%`;hooks.save();syncAudio(prefs);};
  effectVolume.onchange = () => playEffect('click');
  const switchRow = (label: string, enabled: () => boolean, change: (on: boolean) => void) => {
    const row=el('label','setting settings-sound-row');
    const input=el('input');input.type='checkbox';input.checked=enabled();input.setAttribute('role','switch');input.onchange=() => {change(input.checked);update();if(label===copy.sound.effects&&input.checked)playEffect('click');};
    const control=el('span','settings-switch');control.append(input);
    row.append(el('span','',label),control);return row;
  };
  const soundRows=el('div','science-settings-audio');body.append(soundRows);
  // Two columns: each switch sits next to its own volume slider (effects, music), the character voice switch below.
  const effectVolumeRow=el('label','field settings-volume-row');const effectVolumeLabel=el('div','settings-sound-row');effectVolumeLabel.append(el('span','',copy.sound.effectVolume),effectValue);effectVolumeRow.append(effectVolumeLabel,effectVolume);
  const volumeRow=el('label','field settings-volume-row');const volumeLabel=el('div','settings-sound-row');volumeLabel.append(el('span','',copy.sound.volume),value);volumeRow.append(volumeLabel,volume);
  soundRows.append(el('h3','science-settings-label','소리'),
    switchRow(copy.sound.effects,()=>prefs.sound,on=>{prefs.sound=on;effectVolume.disabled=!on;}),effectVolumeRow,
    switchRow(copy.sound.music,()=>prefs.bgm,on=>{prefs.bgm=on;volume.disabled=!on;}),volumeRow,
    switchRow(copy.sound.voice,()=>prefs.voice,on=>prefs.voice=on));

  const actions=el('div','science-settings-actions');body.append(actions);
  actions.append(el('h3','science-settings-label','이야기와 영상'),button(copy.story,()=>{dialog.close();hooks.showStory();}),button(copy.intro,()=>{dialog.close();hooks.showIntro();}));
  const ending = hooks.showEnding && button(copy.ending,()=>{dialog.close();hooks.showEnding!();});
  const certificate = button(copy.certificate,()=>{dialog.close();hooks.printCertificate?.();});
  const lockNote = paragraph(copy.finishFirst,'muted settings-lock-note');
  if (ending) actions.append(ending);
  actions.append(certificate,lockNote);
  body.append(details('앱 정보 · 배움과 보상',[...textRows(copy.appInfo),paragraph(`${copy.appName} v${copy.version} · ${copy.producer}`,'muted'),storageStatus]));
  body.append(details('학생용 가이드',textRows(copy.student)));
  const curriculum = details(copy.curriculumTitle,copy.curriculum.map(row=>paragraph(`[${row.code}] ${row.text}`)));
  const unlock = button(prefs.admin?copy.unlockOn:copy.unlock,()=>{
    prefs.admin=!prefs.admin;
    if (prefs.admin) state.preview=makeAttempt();
    refreshMode();
    hooks.save();
    hooks.go(prefs.admin?'nature-map':state.learner.route);
  },'secondary settings-wide');unlock.setAttribute('aria-pressed',String(prefs.admin));unlock.setAttribute('aria-label','관리자 전체 해금');
  const teacherTools:Node[]=[unlock];
  if (hooks.loadExample) teacherTools.push(button(copy.sample,()=>{
    const load=async()=>{await hooks.loadExample!();hooks.save();dialog.close();hooks.render();hooks.go('nature-map');};void load().catch(()=>notice('예시 기록을 열지 못했어요. 다시 시도해 주세요.'));
  },'secondary settings-wide'));
  const toolsGroup=details(copy.toolsTitle,teacherTools);
  const teacherGroup=details(copy.teacherTitle,[curriculum,toolsGroup]);
  toolsGroup.open=teacherGroup.open=showTeacherTools;
  body.append(teacherGroup);
  const sources = details(copy.sourcesTitle,[paragraph(copy.sourcesIntro),...copy.sources.map(source=>{const article=el('section','settings-source');article.append(el('h3','',source.title),paragraph(source.text));return article;})]);
  for(const reference of inquiryReferences)sources.append(paragraph(referenceText(reference),'muted'));
  body.append(details('이미지·소리·저작권 고지',[...textRows(copy.credits),sources,...textRows(copy.copyright)]));
  const footer=el('div','settings-footer science-settings-footer');
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
