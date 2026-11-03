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
      if(r.capture)return [];
      if(magnifyFor(task.organism,r.v===2)?.gate&&r.level<2){
        if(r.level===1)return [];
        return [
          {caption:'맨눈으로 표본이 있던 곳을 살펴봐요.',patch:{level:0}},
          {caption:'돋보기로 가까이 왔어요. 곧 갓 아래의 주름을 직접 찾아요.',patch:{level:1}},
        ];
      }
      return [
        {caption:'맨눈으로 표본이 있던 곳을 살펴봐요.',patch:{level:0,capture:false,zoom:1,pan:{x:0,y:0},marks:[]}},
        {caption:'돋보기로 가까이 다가가요.',patch:{level:1}},
        {caption:'현미경의 초점을 돌리면 흐릿하던 윤곽이 또렷해져요.',patch:{level:2,focus:38,light:65}},
        {caption:task.organism==='mold'?'조절 방법을 봤어요. 이제 내가 초점을 맞추고 촬영해요.':'선명해졌어요. 이제 내가 사진을 찍고 특징을 찾아요.',patch:{focus:65}},
      ];
    case 'sample':
      if(r.sequence===3)return [];
      return [
        {caption:'물가와 물풀을 살펴봐요. 두 곳 모두 물을 뜰 수 있어요.',patch:{assignments:{},sequence:0}},
        {caption:r.assignments.site?'내가 고른 장소에서 한 방울을 떠요.':'물풀 가까이에서 한 방울 뜨는 모습을 살펴봐요.',patch:{assignments:{site:r.assignments.site||'plant'},sequence:2}},
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
    if(magnifyFor(task.organism,r.v===2)?.gate&&r.level===0){r.level=1;return;}
    r.level=2;if(task.organism!=='mold')r.focus=65;r.light=65;
  }else if(task.kind==='sample'&&r.assignments.site)r.sequence=3;
}
