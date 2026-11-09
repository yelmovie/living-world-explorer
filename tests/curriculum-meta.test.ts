import {describe,it,expect} from 'vitest';
import {inquiryTasks,stageObjectives,contentReview} from '../src/curriculum';
import {settingsContent} from '../src/settingsContent';

describe('성취기준·학습목표·검수 메타데이터',()=>{
 const codes=settingsContent.curriculum.map(c=>c.code);
 it('모든 탐구가 실재하는 성취기준 코드를 가진다',()=>{expect(inquiryTasks).toHaveLength(20);for(const t of inquiryTasks)expect(codes).toContain(t.standard);});
 it('연구소마다 비어 있지 않은 학습목표가 있고 탐구 코드와 같다',()=>{for(const [stage,goal] of Object.entries(stageObjectives)){expect(goal.objectives.length).toBeGreaterThan(0);for(const o of goal.objectives)expect(o.trim().length).toBeGreaterThan(10);for(const t of inquiryTasks.filter(t=>t.stage===stage))expect(t.standard).toBe(goal.standard);}});
 it('교사 검수 전에는 needsReview가 남아 있고 출처가 적혀 있다',()=>{expect(typeof contentReview.needsReview).toBe('boolean');expect(contentReview.source).toMatch(/4과12/);if(contentReview.needsReview)expect(contentReview.reviewer).toBeNull();});
});
