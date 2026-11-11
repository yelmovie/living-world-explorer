import {el} from './ui';

/** Short explanations use the specimens and situations learners meet in this game. */
export const scienceTerms:Record<string,string>={
 '균류':'버섯과 곰팡이가 속한 생물 무리예요. 여기서 관찰한 두 표본의 몸은 가는 실인 균사로 이루어져 있어요.',
 '균사':'버섯과 곰팡이의 몸을 이루는 가는 실 모양 부분이에요.',
 '주름':'이번 버섯의 갓 아래에 나란히 있는 얇은 부분이에요. 이 버섯은 주름 표면에서 포자를 만들어요.',
 '포자주머니':'이번 곰팡이에서 실 끝에 보인 둥근 부분이에요. 그 안에 포자가 들어 있어요.',
 '포자':'균류가 퍼지고 자라는 데 쓰이는 작은 부분이에요. 알맞은 조건에서 새로운 균사로 자랄 수 있어요.',
 '원생생물':'해캄과 짚신벌레처럼 여러 가지 생물이 속한 무리예요. 두 표본은 물에서 살지만 모양과 움직임이 달라요.',
 '섬모':'짚신벌레의 몸 둘레에 난 가는 털 같은 부분이에요. 섬모를 움직여 물속에서 이동해요.',
 '세균':'매우 작은 생물이에요. 모양과 사는 곳이 다양하며, 우리 생활에 도움이 되는 경우도 있어요.',
 '분해':'낙엽 속 물질이 더 단순한 물질로 바뀌는 과정이에요. 균류와 세균 등이 이 과정에 관여해요.',
 '변질':'음식의 냄새나 색, 맛 등이 달라져 먹기 어려워지는 일이에요. 상한 음식은 맛보지 않아요.',
 '충치':'입속의 일부 세균이 당을 이용하며 만든 산 때문에 치아가 손상되는 일이에요.',
 '유산균':'당을 이용해 젖산을 만드는 세균이에요. 요구르트를 만들 때는 알맞은 종류의 식품용 유산균을 써요.',
 '효모':'작은 균류예요. 빵을 만들 때 효모가 만든 기체가 반죽을 부풀게 해요.',
 '발효':'이 활동에서는 미생물이 재료를 바꾸는 작용을 음식 만들기에 이용해요. 유산균으로 요구르트를 만들고, 효모로 빵 반죽을 부풀려요.'
};
const keyTerms=new RegExp('('+Object.keys(scienceTerms).sort((a,b)=>b.length-a.length).join('|')+')','g');

export function emphasizeScience<T extends HTMLElement>(node:T):T{
 const text=node.textContent||'';
 node.replaceChildren(...text.split(keyTerms).map(part=>scienceTerms[part]?el('strong','science-keyword',part):document.createTextNode(part)));
 return node;
}
