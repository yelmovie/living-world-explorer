import './reward-cards.css';
import './reward-card-set.css';
import {createRewardCards,type RewardCards} from './reward-cards.js';
import {stageIds} from './model';
import {stages} from './content';
import {playEffect} from './audio';
import {icon} from './experience';

// One achievement card per map villain, in stage order (M1–M5). The star count rises with the stage.
const titles=['버섯 곰팡이 관찰왕','물방울 속 생물 탐정','세균 모양 명탐정','요구르트 사건 해결사','생명 코드 수호 영웅'];
type Hits=Record<string,number>|undefined;
/** A card is owned once its stage's villain has been driven off (three hits). Nothing extra is saved. */
export const ownedRewardCards=(hits:Hits)=>stageIds.map(id=>hits?.[id]===3);
/** Indexes of the cards a save patch has just won: the villain's count was below three and is three now. */
export const wonRewardCards=(before:Hits,patch:Hits)=>stageIds.flatMap((id,index)=>before?.[id]!==3&&patch?.[id]===3?[index]:[]);

// Built on first use: unit tests read the card rules without a browser.
let instance:RewardCards|undefined;
function rewards(){
 return instance??=createRewardCards({
  setName:'생명 코드 연구소 성취 카드',
  cards:stageIds.map((id,index)=>({id,title:titles[index],stage:stages[index].place,art:`assets/reward-cards/card-${index+1}-${id}.webp`,thumb:`assets/reward-cards/thumb-${index+1}-${id}.webp`})),
  theme:{accent:'#e8c979',accent2:'#315f46',glow:'#fff1c8',ink:'#213f30'},
  particles:['leaf','bubble','spark','circle'],
  colors:['#e8c979','#fff1c8','#315f46','#e1e9d7','#f6b7c6','#ffffff'],
  emblem:icon('flask').outerHTML,
  // The app's effects path: follows the sound switch and the effects level.
  sound:name=>playEffect(`card-${name}`),
  inertRoot:()=>document.querySelector<HTMLElement>('#app'),
 });
}

// A card on its way to the header keeps its slot empty until it lands.
const flying=new Set<number>();
const shown=(hits:Hits)=>ownedRewardCards(hits).map((owned,index)=>owned&&!flying.has(index));
/** The slot strip that sits just before the sound button. */
export function rewardSlots(hits:Hits){
 const holder=document.createElement('template');holder.innerHTML=rewards().slotsHtml(shown(hits));
 return holder.content.firstElementChild as HTMLElement;
}
// Cards whose villain has finished its exit and that have not been put away yet.
let due=0;
/** True from the moment a won card is ready to open until it sits in its slot. The map holds its villains (and the finale) meanwhile. */
export const rewardCardDue=()=>due>0;
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
/**
 * The villain for `index` has just taken its third hit. After `delay` (its exit) the card opens from `origin()`.
 * `state()` answers 'open', 'wait' (a dialog covers the map) or 'gone' (the learner left the map: the slot just fills).
 */
export async function winRewardCard(index:number,{delay,state,origin,hits}:{delay:number;state:()=>'open'|'wait'|'gone';origin:()=>{x:number;y:number}|undefined;hits:()=>Hits}){
 flying.add(index);
 let counted=false;
 try{
  await wait(delay);
  due++;counted=true;
  let now;
  while((now=state())==='wait')await wait(400);
  if(now==='open')await rewards().reveal(index,origin(),ownedRewardCards(hits()));
 }finally{
  if(counted)due--;
  flying.delete(index);rewards().syncSlots(shown(hits()));
 }
}
