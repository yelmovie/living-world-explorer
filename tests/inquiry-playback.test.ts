import {describe,it,expect} from 'vitest';
import {inquiryTasks} from '../src/curriculum';
import {prepareInquiry} from '../src/inquiry-preparation';
import {observationFrames,finishObservation} from '../src/inquiry-playback';

describe('automatic observation handoff',()=>{
 it('waits for the learner to choose a sampling site',()=>{
  const task=inquiryTasks.find(t=>t.kind==='sample')!,record=prepareInquiry(task);
  expect(observationFrames(task,record)).toEqual([]);
  finishObservation(task,record);
  expect(record.assignments).toEqual({});
  expect(record.sequence).toBe(0);
  record.assignments.site='edge';
  const frames=observationFrames(task,record);
  expect(frames.length).toBeGreaterThan(0);
  expect(frames.every(frame=>!frame.patch.assignments||frame.patch.assignments.site==='edge')).toBe(true);
  finishObservation(task,record);
  expect(record.assignments.site).toBe('edge');
  expect(record.sequence).toBe(3);
 });
 it('never submits answers, marks evidence or replaces the learner’s choices',()=>{
  for(const task of inquiryTasks){
   const record=prepareInquiry(task),before=structuredClone(record);
   observationFrames(task,record);
   expect(record).toEqual(before);
   finishObservation(task,record);
   for(const key of ['assignments','pins','marks','opened','prediction','reflection','runs','completedAt'] as const)
    expect(record[key]).toEqual(before[key]);
  }
 });
});
