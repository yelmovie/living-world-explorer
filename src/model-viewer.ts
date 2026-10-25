// three.js lives only in this lazily imported chunk (model-viewer-*.js), so the first screen never downloads it.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';

export type Viewer={rotate:(dx:number,dy:number)=>void;reset:()=>void;dispose:()=>void};

/** Drag (or the buttons) turns the specimen; it idles with a slow spin unless motion is reduced. */
export async function mountViewer(host:HTMLElement,src:string,reduced:boolean,start:[number,number]=[0,0]):Promise<Viewer>{
 // Models are Draco-compressed (scripts/pack-glb.py); the decoder ships with the app so it also works offline once cached.
 const draco=new DRACOLoader().setDecoderPath('assets/libs/draco/');
 const gltf=await new GLTFLoader().setDRACOLoader(draco).loadAsync(src).finally(()=>draco.dispose());
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xfffdf4,0x7d8a6a,1.3));const sun=new THREE.DirectionalLight(0xffffff,1.1);sun.position.set(2,3,4);scene.add(sun);
 const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),radius=size.length()/2;
 model.position.sub(box.getCenter(new THREE.Vector3()));
 // Meshy exports a metal/rough map; a matte look reads better as a specimen model under soft light.
 model.traverse(o=>{const material=(o as THREE.Mesh).material as THREE.MeshStandardMaterial|undefined;if(material&&'metalness' in material){material.metalness=0;material.roughness=Math.max(.7,material.roughness);}});
 const pivot=new THREE.Group();pivot.add(model);pivot.rotation.set(start[0],start[1],0);scene.add(pivot);
 const camera=new THREE.PerspectiveCamera(32,1,radius/100,radius*20);camera.position.set(0,radius*.35,radius*2.5);camera.lookAt(0,0,0);
 const canvas=renderer.domElement;canvas.style.touchAction='none';host.append(canvas);
 const resize=()=>{const w=host.clientWidth||640,h=host.clientHeight||400;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};resize();
 const observer=new ResizeObserver(resize);observer.observe(host);
 let spin=!reduced,drag:{x:number;y:number;rx:number;ry:number}|undefined;
 const clampX=(x:number)=>Math.max(-1.4,Math.min(1.4,x));
 canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,rx:pivot.rotation.x,ry:pivot.rotation.y};spin=false;};
 canvas.onpointermove=e=>{if(!drag)return;pivot.rotation.y=drag.ry+(e.clientX-drag.x)*.01;pivot.rotation.x=clampX(drag.rx+(e.clientY-drag.y)*.01);};
 canvas.onpointerup=canvas.onpointercancel=()=>{drag=undefined;};
 let raf=0;const frame=()=>{if(spin&&!document.hidden)pivot.rotation.y+=.004;renderer.render(scene,camera);raf=requestAnimationFrame(frame);};frame();
 return {
  rotate:(dx,dy)=>{spin=false;pivot.rotation.y+=dx;pivot.rotation.x=clampX(pivot.rotation.x+dy);},
  reset:()=>{pivot.rotation.set(start[0],start[1],0);},
  dispose:()=>{cancelAnimationFrame(raf);observer.disconnect();scene.traverse(o=>{const mesh=o as THREE.Mesh;mesh.geometry?.dispose();const materials=([] as THREE.Material[]).concat(mesh.material||[]);for(const m of materials){for(const value of Object.values(m))if(value instanceof THREE.Texture)value.dispose();m.dispose();}});renderer.dispose();canvas.remove();}
 };
}
