export type Direction='up'|'down'|'left'|'right';

// Atlas rows: down, right (also reflected for left), up. The art occupies 160px
// of each cell and the boot baseline stays at the same row in every frame.
export const walkCells={width:128,height:176,bodyHeight:160,feet:170,frames:4};
export type Gait={direction:Direction;distance:number};

export function advanceGait(gait:Gait,dx:number,dy:number,frameDistance:number){
 const distance=Math.hypot(dx,dy);
 if(distance<=.01){gait.distance=0;return;}
 const vertical=gait.direction==='down'||gait.direction==='up';
 const x=Math.abs(dx),y=Math.abs(dy);
 // Keep the last axis on near-diagonal road segments instead of flickering at 45°.
 const faceX=vertical?x>y*1.18:x*1.18>=y;
 gait.direction=faceX?(dx>0?'right':'left'):(dy>0?'down':'up');
 gait.distance=(gait.distance+distance)%(frameDistance*walkCells.frames);
}

export function walkFrame(gait:Gait,frameDistance:number){
 const row=gait.direction==='down'?0:gait.direction==='up'?2:1;
 return row*walkCells.frames+Math.floor(gait.distance/frameDistance);
}

// Footsteps: the first one lands just after the hero sets off, then one each STEP_MS (plus at most one frame) while the hero
// really moves. Standing still, a blocked road or a held map resets the clock, so nothing sounds until the next real step.
export const STEP_MS=290,STEP_LEAD=70;
export type Stride={next:number};
export function footfall(stride:Stride,moving:boolean,now:number){
 if(!moving){stride.next=0;return false;}
 if(!stride.next){stride.next=now+STEP_LEAD;return false;}
 if(now<stride.next)return false;
 stride.next=now+STEP_MS;return true;
}
