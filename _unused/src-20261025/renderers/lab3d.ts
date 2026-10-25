import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {el,paragraph} from '../ui';
export type LabOptions={core?:boolean;labels:string[];active:boolean[];edges?:boolean[];reduced:boolean;onPick:(index:number)=>void;onFailure:()=>void};
export function mountLab(host:HTMLElement,options:LabOptions){
 const scene=new T.Scene();scene.background=new T.Color('#dce9e2');
 const camera=new T.PerspectiveCamera(38,1,.1,100);camera.position.set(7,6,9);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=false;host.append(renderer.domElement);
 renderer.domElement.setAttribute('aria-label',options.core?'복구할 생명 코어 3D 모형':'생명과학 작업대 3D 모형');
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enablePan=false;controls.minDistance=7;controls.maxDistance=15;controls.maxPolarAngle=1.4;controls.enableRotate=false;controls.update();
 const mat=(color:string,metalness=.15)=>new T.MeshStandardMaterial({color,metalness,roughness:.55});
 scene.add(new T.HemisphereLight(0xffffff,0x597366,3));const light=new T.DirectionalLight(0xffeed0,4);light.position.set(5,9,4);scene.add(light);
 const mesh=(geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);scene.add(m);return m;};
 mesh(new T.CylinderGeometry(4.2,4.4,.4,64),mat('#244f48',.6),0,-.15,0);
 mesh(new T.CylinderGeometry(4,4,.15,64),mat('#b8cbc0'),0,.12,0);
 const picks:T.Object3D[]=[];const glow:T.Mesh[]=[];const windows:T.Mesh[]=[];const count=options.core?5:3;
 if(options.core){mesh(new T.CylinderGeometry(1,1.3,2.7,8),mat('#366f65',.7),0,1.5,0);const center=mesh(new T.IcosahedronGeometry(.7,1),new T.MeshStandardMaterial({color:'#bce9b4',emissive:'#72a67b',emissiveIntensity:.6}),0,3.2,0);glow.push(center);}
 for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2;const x=options.core?Math.sin(angle)*2.4:(i-1)*2.4,z=options.core?Math.cos(angle)*2.4:0;
  const dock=mesh(new T.CylinderGeometry(.9,.95,.22,32),mat('#789a89'),x,.3,z);dock.userData.index=i;picks.push(dock);
  const m=mesh(new T.BoxGeometry(1.3,1.6,1.15),mat(options.active[i]?'#347d69':'#c5cdbd',.5),x,1.2,z);m.userData.index=i;picks.push(m);
  const window=mesh(new T.BoxGeometry(.95,.85,.04),new T.MeshStandardMaterial({color:options.active[i]?'#c8e8a0':'#e7eee3',emissive:options.active[i]?'#478652':'#000000',emissiveIntensity:.35}),x,1.3,z+.6);window.userData.index=i;picks.push(window);
  const label=document.createElement('canvas');label.width=512;label.height=160;const g=label.getContext('2d')!;g.fillStyle='#f7f5e9';g.fillRect(0,0,512,160);g.fillStyle='#184b40';g.font='bold 34px sans-serif';g.textAlign='center';const text=options.labels[i]||'빈 자리';g.fillText(text,256,94,480);const texture=new T.CanvasTexture(label);mesh(new T.PlaneGeometry(1.4,.44),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}),x,.65,z+.64);
  windows.push(window);if(options.active[i])glow.push(window);
 }
 const pipes:T.Mesh[]=[];if(!options.core)for(let i=0;i<2;i++){const pipe=mesh(new T.CylinderGeometry(.06,.06,1.15,12),mat('#d7b96b'),-1.2+i*2.4,.5,0);pipe.rotation.z=Math.PI/2;pipe.visible=options.edges?.[i]??false;pipes.push(pipe);}
 const lever=mesh(new T.CylinderGeometry(.09,.09,1,12),mat('#5f7f70',.8),3,.8,2.3);lever.rotation.z=-.4;mesh(new T.SphereGeometry(.25,20,20),mat('#d6a45e'),3.2,1.3,2.3);
 const ray=new T.Raycaster();const pointer=new T.Vector2();let down:{x:number;y:number}|null=null;
 const hit=(e:PointerEvent)=>{const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(picks,false)[0]?.object.userData.index as number|undefined;};
 renderer.domElement.onpointerdown=e=>{down={x:e.clientX,y:e.clientY};};renderer.domElement.onpointerup=e=>{if(down&&!controls.enableRotate){const index=hit(e);if(index!==undefined)options.onPick(index);}down=null;};renderer.domElement.onpointercancel=()=>down=null;
 const resize=new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(Math.max(1,width),Math.max(1,height));camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();});resize.observe(host);
 const failed=(e:Event)=>{e.preventDefault();options.onFailure();};renderer.domElement.addEventListener('webglcontextlost',failed);
 let paused=false;renderer.setAnimationLoop(time=>{if(document.hidden||document.querySelector('dialog[open]'))return;if(!options.reduced&&!paused)glow.forEach(m=>{if(m.material instanceof T.MeshStandardMaterial)m.material.emissiveIntensity=.35+Math.sin(time/900)*.1;});renderer.render(scene,camera);});
 return {progress:(step:number,failed:boolean)=>{paused=true;windows.forEach((m,i)=>{const material=m.material as T.MeshStandardMaterial;material.color.set(i===step?(failed?'#d68452':'#efce78'):i<step?'#86ba78':'#dce7da');material.emissive.set(i===step?(failed?'#9c3415':'#947817'):'#000000');material.emissiveIntensity=.5;});pipes.forEach((p,i)=>{(p.material as T.MeshStandardMaterial).color.set(i<step?'#e9ba48':'#8ea28f');});},view:(enabled:boolean)=>{controls.enableRotate=enabled;},pause:(value:boolean)=>paused=value,dispose:()=>{resize.disconnect();renderer.setAnimationLoop(null);controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',failed);scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if('map' in m)(m.map as T.Texture|null)?.dispose();m.dispose();});}});renderer.dispose();renderer.domElement.remove();}};
}
