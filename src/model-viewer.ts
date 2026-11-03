// three.js lives only in this lazily imported chunk (model-viewer-*.js), so the first screen never downloads it.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export const MAX_MODEL_ZOOM=3;
export type Viewer={rotate:(dx:number,dy:number)=>void;zoomBy:(steps:number)=>void;reset:()=>void;dispose:()=>void};
type Point={x:number;y:number};
const center={x:.5,y:.5};

/** Drag (or the buttons) turns the specimen; it idles with a slow spin unless motion is reduced. */
export async function mountViewer(host:HTMLElement,src:string,reduced:boolean,start:[number,number]=[0,0],onZoom:(zoom:number)=>void=()=>{}):Promise<Viewer>{
 // Models are meshopt-compressed (scripts/pack-models.mjs); the decoder is bundled into this chunk, so no extra files to fetch.
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(src);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xfffdf4,0x7d8a6a,1.3));const sun=new THREE.DirectionalLight(0xffffff,1.1);sun.position.set(2,3,4);scene.add(sun);
 const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),radius=size.length()/2;
 model.position.sub(box.getCenter(new THREE.Vector3()));
 // Meshy exports a metal/rough map; a matte look reads better as a specimen model under soft light.
 model.traverse(o=>{const material=(o as THREE.Mesh).material as THREE.MeshStandardMaterial|undefined;if(material&&'metalness' in material){material.metalness=0;material.roughness=Math.max(.7,material.roughness);}});
 const pivot=new THREE.Group();pivot.add(model);pivot.rotation.set(start[0],start[1],0);scene.add(pivot);
 const camera=new THREE.PerspectiveCamera(32,1,radius/100,radius*20);camera.position.set(0,radius*.35,radius*2.5);camera.lookAt(0,0,0);
 const canvas=renderer.domElement;canvas.style.touchAction='none';host.append(canvas);
 let zoom=1,origin:Point={x:0,y:0},spin=!reduced;
 const clamp=THREE.MathUtils.clamp;
 const project=()=>{
  const w=canvas.clientWidth||640,h=canvas.clientHeight||400;
  camera.setViewOffset(w,h,origin.x*w,origin.y*h,w/zoom,h/zoom);
 };
 const resize=()=>{renderer.setSize(host.clientWidth||640,host.clientHeight||400,false);project();};
 resize();const observer=new ResizeObserver(resize);observer.observe(host);
 // Keep the inspected point under the wheel or the midpoint of the two fingers.
 const setZoom=(requested:number,from:Point=center,to:Point=from)=>{
  const next=clamp(requested,1,MAX_MODEL_ZOOM),limit=1-1/next;
  origin={x:clamp(origin.x+from.x/zoom-to.x/next,0,limit),y:clamp(origin.y+from.y/zoom-to.y/next,0,limit)};
  spin=false;zoom=next;project();onZoom(zoom);
 };
 const pointAt=(p:Point)=>{const rect=canvas.getBoundingClientRect();return {x:(p.x-rect.left)/rect.width,y:(p.y-rect.top)/rect.height};};
 const wheel=(e:WheelEvent)=>{
  e.preventDefault();const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
  setZoom(zoom*Math.exp(clamp(-pixels*.002,-1,1)),pointAt({x:e.clientX,y:e.clientY}));
 };
 canvas.addEventListener('wheel',wheel,{passive:false});
 const pointers=new Map<number,Point>();
 const midpoint=(a:Point,b:Point)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const clampX=(x:number)=>clamp(x,-1.4,1.4);
 canvas.onpointerdown=e=>{
  if(e.button!==0||pointers.size>=2)return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);spin=false;
 };
 canvas.onpointermove=e=>{
  const prev=pointers.get(e.pointerId);if(!prev)return;
  const next={x:e.clientX,y:e.clientY};pointers.set(e.pointerId,next);
  const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];
  if(other){
   const distance=(p:Point)=>Math.hypot(p.x-other.x,p.y-other.y);
   setZoom(zoom*distance(next)/Math.max(1,distance(prev)),pointAt(midpoint(prev,other)),pointAt(midpoint(next,other)));
  }else{pivot.rotation.y+=(next.x-prev.x)*.01/zoom;pivot.rotation.x=clampX(pivot.rotation.x+(next.y-prev.y)*.01/zoom);}
 };
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{pointers.delete(e.pointerId);};
 let raf=0;const frame=()=>{if(spin&&!document.hidden)pivot.rotation.y+=.004;renderer.render(scene,camera);raf=requestAnimationFrame(frame);};frame();
 return {
  rotate:(dx,dy)=>{spin=false;pivot.rotation.y+=dx;pivot.rotation.x=clampX(pivot.rotation.x+dy);},
  zoomBy:steps=>setZoom((steps>0?Math.floor(zoom*2+.00001)+1:Math.ceil(zoom*2-.00001)-1)/2),
  reset:()=>{pivot.rotation.set(start[0],start[1],0);setZoom(1);},
  dispose:()=>{cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('wheel',wheel);pointers.clear();scene.traverse(o=>{const mesh=o as THREE.Mesh;mesh.geometry?.dispose();const materials=([] as THREE.Material[]).concat(mesh.material||[]);for(const m of materials){for(const value of Object.values(m))if(value instanceof THREE.Texture)value.dispose();m.dispose();}});renderer.dispose();canvas.remove();}
 };
}
