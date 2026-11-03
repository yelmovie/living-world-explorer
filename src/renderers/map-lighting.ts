import {MAP_WIDTH,MAP_HEIGHT} from '../mapData';

type Pane = [number,number][];
type BuildingLight = {
  glow:[number,number,number,number];
  panes:Pane[];
};

// Points follow the panes and oven mouth on the 1280 × 720 village illustration.
const buildings:BuildingLight[]=[
  {glow:[307,137,74,45],panes:[
    [[314,104],[316,98],[321,95],[326,98],[325,106],[321,111],[315,111]],
    [[301,143],[301,133],[305,128],[310,128],[311,141]],
    [[328,144],[328,134],[333,129],[334,142]],[[338,141],[338,129],[343,134],[343,140]]
  ]},
  {glow:[954,128,87,49],panes:[
    [[862,132],[862,121],[866,118],[871,121],[872,134]],
    [[947,100],[955,102],[955,131],[947,128]],[[959,104],[974,104],[974,130],[959,134]],
    [[981,103],[990,99],[990,123],[981,129]]
  ]},
  {glow:[1097,350,87,48],panes:[
    [[1048,306],[1048,297],[1052,294],[1057,298],[1058,310]],
    [[1042,344],[1042,335],[1047,330],[1053,333],[1056,346]],
    [[1131,355],[1132,346],[1138,340],[1145,340],[1146,350]]
  ]},
  {glow:[980,535,76,47],panes:[
    [[866,495],[866,485],[871,480],[877,486],[877,499]],
    [[993,531],[993,517],[997,509],[1004,505],[1010,506],[1015,512],[1015,522]]
  ]},
  {glow:[209,457,105,65],panes:[
    [[145,425],[156,429],[156,449],[145,444]],[[160,431],[180,439],[180,457],[160,450]],
    [[185,441],[204,449],[204,467],[185,460]],[[209,451],[224,457],[224,475],[209,469]],
    [[254,455],[255,451],[260,447],[268,446],[274,448],[276,452],[264,451]],
    [[256,416],[267,408],[267,422],[256,427]],[[271,408],[281,416],[285,420],[271,422]]
  ]},
  {glow:[640,305,108,91],panes:[
    [[571,326],[571,315],[575,311],[580,315],[581,329]],
    [[698,329],[698,317],[703,312],[708,314],[708,325]],
    [[631,193],[630,184],[637,177],[645,177],[651,183],[654,192],[651,201],[643,207],[634,204]]
  ]}
];

export function drawBuildingLights(context:CanvasRenderingContext2D,completed:boolean[]){
  const repaired=completed.filter(Boolean).length;
  context.fillStyle=`rgba(34,53,61,${.18*(1-repaired/5)})`;
  context.fillRect(0,0,MAP_WIDTH,MAP_HEIGHT);
  buildings.forEach(({glow,panes},index)=>{
    const lit=index===5?repaired===5:completed[index];
    const [x,y,rx,ry]=glow;
    context.save();
    context.translate(x,y);
    context.scale(rx,ry);
    const wash=context.createRadialGradient(0,0,0,0,0,1);
    wash.addColorStop(0,lit?'rgba(255,198,76,.42)':'rgba(27,51,67,.22)');
    wash.addColorStop(.55,lit?'rgba(255,193,71,.22)':'rgba(27,51,67,.13)');
    wash.addColorStop(1,'transparent');
    context.fillStyle=wash;
    context.fillRect(-1,-1,2,2);
    context.restore();
    context.fillStyle=lit?'rgba(255,219,122,.47)':'rgba(26,45,58,.74)';
    context.shadowColor=lit?'#ffb64a':'transparent';
    context.shadowBlur=lit?12:0;
    for(const pane of panes){
      context.beginPath();
      context.moveTo(...pane[0]);
      for(const [px,py] of pane.slice(1))context.lineTo(px,py);
      context.closePath();
      context.fill();
    }
    context.shadowBlur=0;
  });
}
