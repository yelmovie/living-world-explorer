import type {InquiryRecord,InquiryTask} from './inquiry-model';
import {magnifyFor} from './artAssets';
import {validTimelinePair,validTrackPair} from './inquiry-preparation';

export type ObservationFrame = {
  caption:string;
  patch:Partial<Pick<InquiryRecord,'level'|'focus'|'light'|'capture'|'marks'|'pan'|'zoom'|'time'|'pins'|'assignments'|'sequence'>>;
  moving?:boolean;
};

/** These frames only run on the renderer's temporary copy of the observation. */
export function observationFrames(task:InquiryTask,r:InquiryRecord):ObservationFrame[]{
  switch(task.kind){
    case 'microscope':
      return [
        {caption:'돋보기로 생김새를 자세히 살펴봐요.',patch:{level:1,capture:false,zoom:1,pan:{x:0,y:0},marks:[]}},
        {caption:'현미경으로 더 작은 구조를 확대해요.',patch:{level:2,focus:45,light:65}},
        {caption:task.organism==='mushroom'?'주름을 확대하면 표면에 붙은 작은 알갱이(포자)가 보여요.':task.organism==='mold'?'가는 균사와 포자가 들어 있는 둥근 포자주머니를 살펴봐요.':'해캄의 초록색 마디가 실처럼 이어져 있어요.',patch:{focus:65}},
      ];
    case 'sample':
      if(!r.assignments.site||r.sequence===3)return [];
      return [
        {caption:'내가 고른 장소에서 물 한 방울을 준비해요.',patch:{sequence:0}},
        {caption:'스포이드에 물 한 방울을 담아요.',patch:{sequence:2}},
        {caption:'유리판 위에 물 한 방울을 놓으면 관찰할 준비가 돼요.',patch:{sequence:3}},
      ];
    case 'track':
      if(validTrackPair(r)||r.level===2)return [];
      return [
        {caption:'첫 순간의 짚신벌레 위치를 기억해요.',patch:{time:0,level:0,pins:[],marks:[]}},
        {caption:'같은 시야에서 잠시 움직임을 따라가요.',patch:{time:1},moving:true},
        {caption:'두 순간을 나란히 놓고 위치가 어떻게 달라졌는지 살펴봐요.',patch:{pins:[0,5],time:5}},
      ];
    case 'timeline':
      if(validTimelinePair(r))return [];
      return [
        {caption:'첫 번째 모습을 눈에 담아요.',patch:{time:0,pins:[],marks:[]}},
        {caption:'두 번째 모습이에요. 같은 자리를 살펴봐요.',patch:{time:1}},
        {caption:'세 번째 모습이에요. 무엇이 달라지고 있나요?',patch:{time:2}},
        {caption:'처음과 마지막 모습이에요. 직접 탐구할 때 달라진 곳을 찾아요.',patch:{time:3,pins:[0,3]}},
      ];
    default:return [];
  }
}

/** Apply only equipment preparation. The learner chooses sites, comparison times and evidence. */
export function finishObservation(task:InquiryTask,r:InquiryRecord){
  if(task.kind==='microscope'&&!r.capture){
    r.level=2;r.focus=65;r.light=65;
  }else if(task.kind==='sample'&&r.assignments.site)r.sequence=3;
}
