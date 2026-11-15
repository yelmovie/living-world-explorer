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
