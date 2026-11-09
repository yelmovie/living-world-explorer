import {
 ACESFilmicToneMapping, AdditiveBlending, BufferGeometry, DataTexture, DirectionalLight, HemisphereLight, Mesh,
 MeshBasicMaterial, OrthographicCamera, PlaneGeometry, PMREMGenerator, PointLight, Points, Scene,
 Sprite, SpriteMaterial, SRGBColorSpace, TextureLoader, Vector3, WebGLRenderer, type Material, type Texture
} from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {coreApparatus} from './core-apparatus';

export type CoreVisualState={linked:boolean[];power:'waiting'|'linking'|'ready'|'running'|'powered';active:number;fresh:number};

function shadow(){
 const size=32,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1);
  const fade=Math.max(0,Math.min(1,(1-r)/.48));
  pixels[i]=9;pixels[i+1]=15;pixels[i+2]=11;pixels[i+3]=Math.round(175*fade*fade*(3-2*fade));
 }
 const map=new DataTexture(pixels,size,size);map.needsUpdate=true;
 const material=new MeshBasicMaterial({map,transparent:true,depthWrite:false});
 const geometry=new PlaneGeometry(7.5,4.3),plane=new Mesh(geometry,material);
 plane.rotation.x=-Math.PI/2;plane.position.set(-.16,-.015,.16);
 return {plane,dispose(){geometry.dispose();material.dispose();map.dispose();}};
}

function chamberLight(){
 const size=48,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1);
  pixels[i]=233;pixels[i+1]=242;pixels[i+2]=156;pixels[i+3]=Math.round(255*Math.max(0,1-r*r)**3);
 }
 const map=new DataTexture(pixels,size,size);map.colorSpace=SRGBColorSpace;map.needsUpdate=true;
 const material=new SpriteMaterial({map,transparent:true,depthWrite:false,blending:AdditiveBlending,opacity:0});
 const halo=new Sprite(material);halo.position.set(0,1.92,-.81);halo.scale.set(1.65,2.22,1);
 return {halo,material,dispose(){map.dispose();material.dispose();}};
}

export function mountCore3d(host:HTMLElement,labels:HTMLElement[],reduce:boolean,onLost:()=>void){
 const canvas=document.createElement('canvas');
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!gl)return;
 const context:WebGL2RenderingContext=gl;
 let renderer:WebGLRenderer;
 try{renderer=new WebGLRenderer({canvas,context,alpha:true,antialias:true});}
 catch{context.getExtension('WEBGL_lose_context')?.loseContext();return;}
 renderer.setPixelRatio(Math.min(1.25,devicePixelRatio||1));renderer.setClearColor(0,0);
 renderer.transmissionResolutionScale=.5;
 renderer.outputColorSpace=SRGBColorSpace;renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 const scene=new Scene(),env=new RoomEnvironment(),pmrem=new PMREMGenerator(renderer);
 let environment:ReturnType<PMREMGenerator['fromScene']>;
 try{environment=pmrem.fromScene(env,.02);}
 catch{renderer.dispose();if(!context.isContextLost())renderer.forceContextLoss();return;}
 finally{env.dispose();pmrem.dispose();}
 scene.environment=environment.texture;scene.environmentIntensity=.92;
 const light=(color:number,intensity:number,x:number,y:number,z:number)=>{
  const source=new DirectionalLight(color,intensity);source.position.set(x,y,z);scene.add(source);
 };
 scene.add(new HemisphereLight(0xe5efdf,0x493823,1.0));
 light(0xffe1a5,2.7,4,6,3.6);light(0xc3e6da,1.5,-4,3,-4);
 const crystalLight=new PointLight(0x8ff5a7,0,2.8,2);crystalLight.position.set(0,1.63,-.04);scene.add(crystalLight);
 const model=coreApparatus(),floor=shadow(),radiance=chamberLight();scene.add(floor.plane,model.body,radiance.halo);
 const camera=new OrthographicCamera(-4,4,2.5,-2.5,.1,40);
 camera.position.set(1.05,4.32,10);camera.lookAt(0,1.92,0);camera.updateMatrixWorld();
 const extent={left:Infinity,right:-Infinity,low:Infinity,high:-Infinity};
 const projected=new Vector3();
 const include=(p:Vector3)=>{
  p.applyMatrix4(camera.matrixWorldInverse);
  extent.left=Math.min(extent.left,p.x);extent.right=Math.max(extent.right,p.x);
  extent.low=Math.min(extent.low,p.y);extent.high=Math.max(extent.high,p.y);
 };
 model.body.updateMatrixWorld(true);
 model.body.traverse(obj=>{
  if(!(obj instanceof Mesh))return;
  obj.geometry.computeBoundingBox();
  const bounds=obj.geometry.boundingBox!;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   include(projected.set(x,y,z).applyMatrix4(obj.matrixWorld));
  }
 });
 model.ports.forEach(port=>include(projected.copy(port.number).add(new Vector3(0,-.14,0))));
 let width=0,height=0,raf=0,lastDraw=-Infinity,disposed=false;
 let backdrop:Texture|undefined;
 let lastPower:CoreVisualState['power']='waiting',started=0,pulse=0,fresh=-1;
 let state:CoreVisualState={linked:[],power:'waiting',active:-1,fresh:-1};
 function size(){
  width=host.clientWidth;height=host.clientHeight;if(!width||!height)return;
  const aspect=width/height;
  const centerX=(extent.left+extent.right)/2,centerY=(extent.low+extent.high)/2-.045;
  const h=Math.max((extent.high-extent.low)*1.13,(extent.right-extent.left)*1.10/aspect);
  const w=h*aspect;
  camera.left=centerX-w/2;camera.right=centerX+w/2;camera.top=centerY+h/2;camera.bottom=centerY-h/2;
  camera.updateProjectionMatrix();renderer.setSize(width,height,false);
  if(backdrop){
   const cropHeight=Math.min(1,.435*(1280/720)/aspect);
   backdrop.repeat.set(.435,cropHeight);backdrop.offset.set(.565,(1-cropHeight)*.45);
  }
  labels.forEach((label,i)=>{
   projected.copy(model.ports[i].number).project(camera);
   label.style.left=`${(projected.x+1)*50}%`;label.style.top=`${(1-projected.y)*50}%`;
  });
  requestDraw();
 }
 function draw(now:number){
  raf=0;if(disposed||document.hidden||!width||!height)return;
  const elapsed=(now-started)/1000;
  const spin=!reduce&&state.power==='running'&&elapsed<5.1;
  const pulseTime=(now-pulse)/570,pulsing=!reduce&&fresh>=0&&pulseTime<1;
  if((spin||pulsing)&&now-lastDraw<1000/31){requestDraw();return;}
  const charged=state.power==='running'||state.power==='powered';
  const charge=charged?state.power==='powered'||reduce?1:1-Math.exp(-elapsed*2.5):state.power==='ready'?.33:0;
  model.gem.emissiveIntensity=.013+.11*charge;
  model.crystalEnergy.value=charge;
  model.glass.uniforms.energy.value=charge;
  model.pollen.uniforms.energy.value=.6*charge;
  radiance.material.opacity=charge*.47;
  crystalLight.intensity=charge*10;
  if(spin){
   model.crystal.rotation.y=elapsed*.42;model.crystal.position.y=1.89+.13*charge+.035*Math.sin(elapsed*1.8);
   model.rotor.rotation.y=elapsed*.53;model.rotor.position.y=2.11+.12*Math.sin(elapsed*1.18);
  }else if(!charged){
   model.crystal.rotation.y=0;model.crystal.position.y=1.89;model.rotor.rotation.y=0;model.rotor.position.y=2.11;
  }
  model.ports.forEach((port,i)=>{
   const linked=state.linked[i],active=state.active===i,boost=pulsing&&i===fresh?Math.sin(Math.max(0,pulseTime)*Math.PI):0;
   port.bulb.color.setHex(linked?port.color:0x354238);
   if(linked)port.bulb.color.multiplyScalar(.42);
   port.bulb.emissiveIntensity=linked?.29+boost*.47+(active?.34:0):0;
   port.cable.emissiveIntensity=linked?.06+boost*.26+(active?.26:0):0;
  });
  renderer.render(scene,camera);lastDraw=now;
  if(spin||pulsing)requestDraw();
 }
 function requestDraw(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(draw);}
 function show(next:CoreVisualState){
  if(next.power==='running'&&lastPower!=='running')started=performance.now();
  if(next.fresh>=0&&next.fresh!==state.fresh){pulse=performance.now();fresh=next.fresh;}
  state=next;lastPower=next.power;requestDraw();
 }
 function visibility(){if(document.hidden){cancelAnimationFrame(raf);raf=0;}else requestDraw();}
 const lost=(event:Event)=>{event.preventDefault();dispose();onLost();};
 function dispose(){
  if(disposed)return;disposed=true;
  cancelAnimationFrame(raf);observer.disconnect();
  document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);
  const geometries=new Set<BufferGeometry>(),materials=new Set<Material>();
  model.body.traverse(obj=>{if(obj instanceof Mesh||obj instanceof Points){geometries.add(obj.geometry);materials.add(obj.material);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  model.textures.forEach(t=>t.dispose());backdrop?.dispose();floor.dispose();radiance.dispose();
  environment.dispose();renderer.dispose();if(!context.isContextLost())renderer.forceContextLoss();canvas.remove();
 }
 canvas.className='core-live-canvas';canvas.setAttribute('aria-hidden','true');
 host.prepend(canvas);
 const observer=new ResizeObserver(size);observer.observe(host);
 canvas.addEventListener('webglcontextlost',lost);
 document.addEventListener('visibilitychange',visibility);
 size();
 // Use the existing conservatory art in the transmission pass so emerald facets refract the room.
 new TextureLoader().load('assets/places/core.webp',texture=>{
  if(disposed){texture.dispose();return;}
  backdrop=texture;texture.colorSpace=SRGBColorSpace;
  scene.background=texture;scene.backgroundIntensity=.43;
  size();
 });
 return {show,dispose};
}
