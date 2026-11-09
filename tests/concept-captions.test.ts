import {describe,it,expect} from 'vitest';
import manifestJson from '../public/assets/concepts/manifest.json';
const vtts=import.meta.glob('../public/assets/concepts/*.vtt',{query:'?raw',import:'default',eager:true}) as Record<string,string>;
import {conceptCaptions,captionAt} from '../src/concepts';

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
