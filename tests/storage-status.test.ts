import {describe,it,expect} from 'vitest';
import {needsStorageWarning} from '../src/storage-status';
describe('저장 경고',()=>{
 it.each(['임시 저장 · 창을 닫으면 사라질 수 있어요','저장 실패 · 현재 작업은 이 창에 남아 있어요','다른 창에서 기록이 바뀌었어요','저장 원본을 보호하고 있어요','사진이 빠져 있어요. 다시 촬영해 주세요.'])('%s를 알린다',message=>expect(needsStorageWarning(message)).toBe(true));
 it.each(['기기에 저장 중','기기에 저장','기기에 저장됨'])('%s에는 경고하지 않는다',message=>expect(needsStorageWarning(message)).toBe(false));
});
