import {describe,it,expect} from 'vitest';
import manifestJson from '../public/assets/concepts/manifest.json';
const vtts=import.meta.glob('../public/assets/concepts/*.vtt',{query:'?raw',import:'default',eager:true}) as Record<string,string>;
import {conceptCaptions,captionAt,cueIndexAt,conceptChapters,conceptTerms} from '../src/concepts';

const vttTimes=(text:string)=>[...text.matchAll(/(\d\d):(\d\d):(\d\d)\.(\d{3}) --> (\d\d):(\d\d):(\d\d)\.(\d{3})\n(.+)/g)].map(m=>[+m[2]*60+ +m[3]+ +m[4]/1000,+m[6]*60+ +m[7]+ +m[8]/1000,m[9].trim()]);

describe('개념 영상 자막',()=>{
 for(const [stage,{duration,cues}] of Object.entries(conceptCaptions)){
  it(`${stage}: 화면 자막·VTT·manifest가 같은 문장과 시각을 쓴다`,()=>{
   expect(cues[0][0]).toBe(0);expect(cues.at(-1)![1]).toBe(duration);
   for(let i=1;i<cues.length;i++)expect(cues[i][0]).toBe(cues[i-1][1]);
   expect(vttTimes(vtts[`../public/assets/concepts/${stage}.vtt`])).toEqual(cues);
   const manifest=(manifestJson as Record<string,{duration:number;captions:string[]}>)[stage];
   expect(manifest.duration).toBe(duration);expect(manifest.captions).toEqual(cues.map(c=>c[2]));
   expect(captionAt(stage as 'M1',duration)).toBe(cues.at(-1)![2]);
  });
 }
});

describe('개념 영상 장면 버튼·기억할 낱말',()=>{
 for(const [stage,{duration,cues}] of Object.entries(conceptCaptions)){
  it(`${stage}: 장면 버튼은 자막 장면 경계로 이동하고 순서대로 뒤로 간다`,()=>{
   const starts=conceptChapters.map(c=>cues[c.cue][0]);
   expect(starts).toEqual([...starts].sort((a,b)=>a-b));
   for(const s of starts){expect(cues.map(c=>c[0])).toContain(s);expect(s).toBeGreaterThan(0);expect(s).toBeLessThan(duration);}
   expect(conceptChapters.at(-1)!.cue).toBe(cues.length-1);
   conceptChapters.forEach(c=>expect(cueIndexAt(stage as 'M1',cues[c.cue][0])).toBe(c.cue));
  });
  it(`${stage}: 기억할 낱말이 모두 자막 문장에 실제로 나온다`,()=>{
   const text=cues.map(c=>c[2]).join(' ');for(const term of conceptTerms[stage as 'M1'])expect(text).toContain(term);
  });
 }
});
