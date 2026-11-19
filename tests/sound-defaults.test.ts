import {describe,it,expect} from 'vitest';
import {makeState} from '../src/model';
import {restoreSettings} from '../src/storage';
// 2026-11-19: sound starts on. A save from the time it started off is switched on once; after that the learner's switches are kept.
describe('소리 기본값과 한 번짜리 이행',()=>{
 it('새 학생은 효과음·목소리·배경 음악이 모두 켜져 있다',()=>{
  expect(makeState().settings).toMatchObject({sound:true,voice:true,bgm:true,bgmVolume:30,effectVolume:100,audioDefaults:2});
  expect(restoreSettings(undefined)).toEqual(makeState().settings);
 });
 it('표시가 없는 예전 저장은 한 번 켜고, 배경 음악 크기는 새 기본값을 넘지 않게 한다',()=>{
  const old={sound:false,voice:false,bgm:false,bgmVolume:100,villains:false,large:true,reduced:true,flat:true,admin:true};
  expect(restoreSettings(old)).toEqual({sound:true,voice:true,bgm:true,bgmVolume:30,effectVolume:100,audioDefaults:2,villains:false,large:true,reduced:true,flat:true,admin:false});
  expect(restoreSettings({bgm:true,bgmVolume:10}).bgmVolume).toBe(10);
  expect(restoreSettings({}).bgmVolume).toBe(30);
 });
 it('이행한 뒤에 학생이 끈 소리는 그대로 둔다',()=>{
  const saved={...makeState().settings,sound:false,voice:false,bgm:false,bgmVolume:85,effectVolume:35};
  expect(restoreSettings(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
  expect(restoreSettings({audioDefaults:2,sound:true,bgm:false})).toMatchObject({sound:true,voice:true,bgm:false});
  expect(restoreSettings({audioDefaults:2,sound:false,voice:true,bgm:true})).toMatchObject({sound:false,voice:true,bgm:true});
 });
 it('3차(2026-11-20) 저장 호환: 효과음 크기가 없으면 100%, 목소리가 없으면 그때의 효과음 스위치를 따른다',()=>{
  expect(restoreSettings({audioDefaults:2,sound:false,bgm:true})).toMatchObject({sound:false,voice:false,effectVolume:100,bgm:true});
  expect(restoreSettings({audioDefaults:2,sound:true,bgm:true})).toMatchObject({sound:true,voice:true,effectVolume:100});
  expect(restoreSettings({audioDefaults:2,bgm:true})).toMatchObject({sound:false,voice:false,effectVolume:100});
  expect(restoreSettings({audioDefaults:2,sound:true,voice:true,bgm:true,effectVolume:55}).effectVolume).toBe(55);
  expect(restoreSettings({audioDefaults:2,sound:true,effectVolume:250}).effectVolume).toBe(100);
  expect(restoreSettings({audioDefaults:2,sound:true,effectVolume:'x'}).effectVolume).toBe(100);
 });
});
