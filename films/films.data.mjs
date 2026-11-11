// One record per concept film. build-films.mjs turns each into films/concept-<id>/index.html.
// Every picture is an existing game illustration from public/assets; positions are % of that picture.
// captions: [start, end, sentence] — the same sentences feed src/concepts.ts, the VTT and manifest.json.
export const DURATION = 18;
export const CUES = [0, 3.6, 9.6, 13.4, DURATION];

export const films = [
  {
    id: 'M1', place: '버섯숲 표본실', accent: '#93603a', soft: '#f4e6d3',
    question: '버섯과 곰팡이는 무엇으로 되어 있을까?',
    tool: 'lens',
    pair: [
      { name: '버섯', before: 'study/mushroom', after: 'study/mushroom-spores', result: '주름에 붙은 포자' },
      { name: '곰팡이', before: 'study/mold-lens', after: 'study/mold', result: '가는 실, 균사' },
    ],
    focus: { img: 'study/mold', aspect: 793 / 496, labels: [
      { text: '균사(가는 실)', x: 17, y: 82, dx: 300, dy: 20 },
      { text: '포자가 든 둥근 부분', x: 39, y: 16, dx: 330, dy: 30 },
    ] },
    conclusion: ['버섯과 곰팡이는 ', { mark: '균사' }, '로 된 균류예요'],
    toto: '버섯도 곰팡이도 균류구나!',
    captions: [
      '버섯과 곰팡이는 무엇으로 되어 있을까요?',
      '현미경으로 확대하면 버섯 주름에는 포자가, 곰팡이에는 가는 실이 보여요.',
      '곰팡이의 가는 실을 균사라고 해요. 둥근 부분 안에는 포자가 들어 있어요.',
      '버섯과 곰팡이는 몸이 균사로 이루어진 균류예요.',
    ],
  },
  {
    id: 'M2', place: '연못 관찰소', accent: '#2f7f86', soft: '#dcefed',
    question: '연못 물 한 방울 속에는 무엇이 있을까?',
    tool: 'lens',
    pair: [
      { name: '초록 실 덩어리', before: 'study/spirogyra-lens', after: 'study/spirogyra', result: '해캄: 길게 이어져요' },
      { name: '물 한 방울', before: 'study/pond', after: 'study/paramecium', result: '짚신벌레: 움직여요', move: true },
    ],
    focus: { img: 'study/paramecium', aspect: 793 / 496, labels: [
      { text: '섬모(가는 털)', x: 22, y: 13, dx: -40, dy: -110 },
      { text: '짚신 모양의 몸', x: 62, y: 62, dx: 120, dy: 170 },
    ] },
    conclusion: ['물 한 방울에도 ', { mark: '작은 생물' }, '이 살아요'],
    toto: '해캄도 짚신벌레도 찾았어!',
    captions: [
      '연못 물 한 방울 속에는 무엇이 있을까요?',
      '현미경으로 보면 해캄은 초록 실처럼 길게 이어지고, 짚신벌레는 자리를 옮겨요.',
      '짚신벌레는 몸 둘레의 가는 털, 섬모를 움직여 헤엄쳐요.',
      '물 한 방울에도 해캄, 짚신벌레 같은 작은 생물이 살아요.',
    ],
  },
  {
    id: 'M3', place: '자료 연구실', accent: '#557a3f', soft: '#e4edd5',
    question: '세균은 어떻게 생겼고 어디에 살까?',
    tool: 'lens',
    pair: [
      { name: '흙', before: 'study/soil', after: 'study/bacteria-rod', result: '흙에서 찾은 세균' },
      { name: '이', before: 'study/tooth', after: 'study/bacteria-round', result: '이에서 찾은 세균' },
    ],
    focus: { img: 'study/bacteria', aspect: 960 / 537, labels: [
      { text: '공 모양', x: 10, y: 16, dx: 40, dy: -110 },
      { text: '막대 모양', x: 57, y: 18, dx: 60, dy: -120 },
      { text: '나선 모양', x: 29, y: 46, dx: -60, dy: 330 },
    ] },
    conclusion: ['세균은 ', { mark: '모양' }, '도 사는 곳도 여러 가지예요'],
    toto: '흙에도 이에도 있었네!',
    captions: [
      '세균은 어떻게 생겼고, 어디에 살까요?',
      '흙과 이(치아)처럼 여러 곳의 표본을 아주 크게 확대해야 세균이 보여요.',
      '세균은 아주 작고 공 모양, 막대 모양, 나선 모양 등이 있어요.',
      '모양 자료와 사는 곳 자료를 구별해 설명에 연결해요.',
    ],
  },
  {
    id: 'M4', place: '생활마을', accent: '#a55e3d', soft: '#f7e3d5',
    question: '곰팡이와 세균은 우리 생활에 어떤 영향을 줄까?',
    tool: 'time',
    pair: [
      { name: '빵', before: 'study/bread-0', after: 'study/bread-3', result: '음식이 상해요' },
      { name: '낙엽', before: 'study/leaf-0', after: 'study/leaf-3', result: '낙엽이 분해돼요' },
    ],
    focus: { img: 'study/leaf-3', aspect: 1024 / 576, labels: [
      { text: '분해되어 사라진 부분', x: 62, y: 38, dx: 120, dy: -150 },
    ] },
    conclusion: ['해로울 때도, ', { mark: '이로울 때도' }, ' 있어요'],
    toto: '상황을 먼저 살펴봐야겠다!',
    captions: [
      '곰팡이와 세균은 우리 생활에 어떤 영향을 줄까요?',
      '시간이 지나면 빵에는 곰팡이가 피어 음식 변질이 일어나고, 낙엽은 조금씩 분해돼요.',
      '균류와 세균은 낙엽의 물질을 분해하는 데 관여해요.',
      '이름만으로 판단하지 않고, 상황과 영향을 함께 살펴봐요.',
    ],
  },
  {
    id: 'M5', place: 'BIO 작업실', accent: '#5f5aa3', soft: '#e6e4f5',
    question: '생물의 작용을 생활에 어떻게 이용할까?',
    tool: 'work',
    pair: [
      { name: '우유', before: 'study/milk', after: 'study/yogurt', result: '유산균 → 요구르트' },
      { name: '빵 반죽', before: 'study/dough-before', after: 'study/dough-after', result: '효모 → 부풀어요' },
    ],
    focus: { img: 'study/yeast', aspect: 640 / 360, labels: [
      { text: '효모(균류)', x: 16, y: 27, dx: 60, dy: -120 },
    ] },
    conclusion: ['재료', { arrow: true }, { mark: '생물의 작용' }, { arrow: true }, '결과'],
    toto: '다음엔 내가 만들어 볼래!',
    captions: [
      '생물의 작용을 우리 생활에 어떻게 이용할까요?',
      '유산균이 우유를 요구르트로 바꾸고, 효모의 작용으로 빵 반죽이 부풀어요.',
      '효모는 균류예요. 아주 작아서 확대해야 보여요.',
      '재료 → 생물의 작용 → 결과를 연결해 설명해요.',
    ],
  },
];
