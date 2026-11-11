import {describe,it,expect} from 'vitest';
import {researchCases,caseReady} from '../src/detective-cases';
import {recoverInquiry,emptyRecord} from '../src/inquiry-model';
describe('research case reasoning',()=>{
 for(const [stage,c] of Object.entries(researchCases))it(stage+' requires evidence and inference limits',()=>{const p=Object.fromEntries(c.clues.map(clue=>[clue.id,clue.role]));expect(caseReady(stage as keyof typeof researchCases,p)).toBe(true);expect(caseReady(stage as keyof typeof researchCases,{})).toBe(false);p[c.clues[2].id]='supports';expect(caseReady(stage as keyof typeof researchCases,p)).toBe(false);});
 it('preserves existing progress and case choices on recovery',()=>{const r=emptyRecord();r.assignments.case_threads='supports';r.completedAt='2026-11-11';const p=recoverInquiry({version:1,current:{M1:3},records:{'M1-4':r},rewards:['M1-4']});expect(p.records['M1-4'].assignments.case_threads).toBe('supports');expect(p.records['M1-4'].completedAt).toBe(r.completedAt);});
});
