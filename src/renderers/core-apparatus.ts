import {
 AdditiveBlending, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, DataTexture, DoubleSide,
 Float32BufferAttribute, Group, LatheGeometry, LinearFilter, LinearMipmapLinearFilter, Mesh,
 MeshPhysicalMaterial, MeshStandardMaterial, Points, RepeatWrapping, ShaderMaterial, SphereGeometry,
 SRGBColorSpace, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material, type Object3D
} from 'three';

const portColors=[0xffbe69,0x74dce6,0xa8e779,0xe79a75,0xb7a2ed];
const point=(x:number,y:number,z:number)=>new Vector3(x,y,z);

/** Small, deterministic textures: oxidation in the bronze and lengthwise walnut grain. */
function finishTexture(wood:boolean){
 const n=128,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=(y*n+x)*4,u=x/n*Math.PI*2,v=y/n*Math.PI*2;
  const noise=((x*2654435761^y*1597334677)>>>25)/128;
  const w=Math.sin(11*v+1.1*Math.sin(2*u+.3*v))*.14+Math.sin(27*v+1.7*Math.sin(3*u))*.07;
  const grain=wood?.68+w+noise*.16:.79+.075*Math.sin(5*u+3*v)*Math.sin(4*v-2*u)+noise*.12;
  const base=wood?[101,65,38]:[166,128,79];
  base.forEach((c,k)=>data[i+k]=Math.round(c*grain));data[i+3]=255;
 }
 const tex=new DataTexture(data,n,n);tex.colorSpace=SRGBColorSpace;
 tex.wrapS=tex.wrapT=RepeatWrapping;tex.magFilter=LinearFilter;tex.minFilter=LinearMipmapLinearFilter;
 tex.generateMipmaps=true;tex.needsUpdate=true;
 return tex;
}

export function coreApparatus(){
 const body=new Group(),walnut=finishTexture(true),patina=finishTexture(false);
 const material=(color:number,metalness=0,roughness=.42)=>new MeshStandardMaterial({color,metalness,roughness});
 const brass=material(0xffffff,.68,.36);brass.map=patina;brass.bumpMap=patina;brass.bumpScale=.026;
 const fillet=material(0xc89c5e,.72,.26);
 const dark=material(0x473629,.62,.43),enamel=material(0x253f33,.46,.36);
 const wood=material(0xffffff,.04,.55);wood.map=walnut;
 const porcelain=material(0x867854,.22,.57);
 const foliage=material(0x435344,.67,.44),vein=material(0xb49459,.66,.38);
 const place=(geometry:BufferGeometry,mat:Material,x=0,y=0,z=0,parent:Object3D=body)=>{
  const obj=new Mesh(geometry,mat);obj.position.set(x,y,z);parent.add(obj);return obj;
 };
 const lathe=(profile:number[][],mat:Material,x=0,y=0,z=0,segments=56)=>{
  return place(new LatheGeometry(profile.map(([r,h])=>new Vector2(r,h)),segments),mat,x,y,z);
 };
 const disc=(radius:number,h:number,mat:Material,x:number,y:number,z:number)=>{
  return place(new CylinderGeometry(radius,radius,h,28),mat,x,y,z);
 };
 const ring=(radius:number,depth:number,mat:Material,x:number,y:number,z:number,zScale=1)=>{
  const mesh=place(new TorusGeometry(radius,depth,8,56),mat,x,y,z);
  mesh.rotation.x=Math.PI/2;mesh.scale.y=zScale;return mesh;
 };
 const path=(pts:Vector3[],width:number,mat:Material,parent=body)=>{
  return place(new TubeGeometry(new CatmullRomCurve3(pts),24,width,7,false),mat,0,0,0,parent);
 };
 const center=-.18;

 // Turned walnut plinth and a dark enamel apron, with brass exposed only on trim and fittings.
 lathe([[0,.025],[2.48,.025],[2.54,.07],[2.53,.13],[2.46,.17],[2.39,.17],[2.36,.31],[2.43,.37],[2.41,.42],[2.32,.46],[0,.46]],wood,0,0,center).scale.z=.70;
 ring(2.51,.027,brass,0,.093,center,.70);
 ring(2.40,.020,fillet,0,.387,center,.70);
 lathe([[0,.438],[2.31,.438],[2.33,.465],[2.28,.51],[2.16,.53],[0,.53]],dark,0,0,center).scale.z=.70;
 ring(2.19,.018,brass,0,.519,center,.70);
 lathe([[0,.52],[1.35,.52],[1.37,.59],[1.29,.65],[1.20,.68],[1.19,.89],[1.27,.93],[1.26,1.01],[1.16,1.10],[0,1.10]],enamel,0,0,center);
 ring(1.31,.033,brass,0,.606,center);ring(1.23,.034,fillet,0,.984,center);
 lathe([[0,1.05],[1.17,1.05],[1.21,1.09],[1.19,1.17],[1.09,1.20],[0,1.20]],brass,0,0,center);
 ring(1.06,.026,fillet,0,1.179,center);disc(.84,.03,porcelain,0,1.199,center);

 // Curved ribs and retaining clips give the real glass envelope a readable edge.
 const cageProfile=[[1.05,1.17],[1.15,1.41],[1.19,1.79],[1.15,2.27],[1.03,2.69],[.81,3.06],[.51,3.32],[.22,3.46]];
 for(const angle of [.44,Math.PI-.44,Math.PI*1.5]){
  const x=Math.cos(angle),z=Math.sin(angle);
  path(cageProfile.map(([r,y])=>point(x*r,y,center+z*r)),.033,brass);
  for(const [r,y] of [cageProfile[1],cageProfile[3],cageProfile[5]]){
   const clip=place(new CylinderGeometry(.068,.085,.038,12),fillet,x*r,y,center+z*r);
   clip.rotation.z=.48*x;
  }
 }
 lathe([[0,3.36],[.26,3.36],[.29,3.40],[.26,3.47],[.18,3.49],[.16,3.57],[.105,3.62],[0,3.62]],brass,0,0,center);
 ring(.21,.019,fillet,0,3.477,center);

 // A tiny folded leaf mesh has a central ridge and two shaded sides, like an engraved botanical ornament.
 const leafGeom=new BufferGeometry();
 leafGeom.setAttribute('position',new Float32BufferAttribute([
  0,0,0, -.22,.37,0, 0,.43,.075,
  -.22,.37,0, 0,1,0, 0,.43,.075,
  0,1,0, .19,.46,0, 0,.43,.075,
  .19,.46,0, 0,0,0, 0,.43,.075,
 ],3));leafGeom.computeVertexNormals();foliage.side=DoubleSide;vein.side=DoubleSide;
 function leaf(x:number,y:number,z:number,size:number,turn:number,mat:Material,roll=0){
  const node=place(leafGeom,mat,x,y,z);
  node.scale.setScalar(size);node.rotation.set(roll,.19,turn);return node;
 }
 const top=3.59;
 path([point(0,top,center),point(.01,3.74,center),point(.015,3.89,center)],.018,vein);
 leaf(0,top,center,.31,.77,vein,-.12);leaf(0,top,center,.32,-.72,vein,-.10);leaf(.012,top+.08,center,.34,-.12,foliage);
 // Metal sprigs cradle the crystal; there is no large foreground ring across it.
 for(const sign of [-1,1]){
  path([point(0,1.23,.19),point(sign*.35,1.35,.33),point(sign*.55,1.57,.36),point(sign*.70,1.84,.31)],.018,vein);
  leaf(sign*.32,1.36,.33,.32,-sign*.84,vein);
  leaf(sign*.50,1.51,.35,.33,-sign*.91,foliage);
  leaf(sign*.61,1.66,.32,.31,-sign*.52,vein);
 }
 leaf(0,.70,1.002,.18,.06,vein,.05);leaf(-.015,.72,1.003,.145,.91,vein);leaf(.015,.72,1.003,.15,-.91,vein);

 const crystal=new Group();crystal.position.set(0,1.89,center+.03);body.add(crystal);
 const gem=new MeshPhysicalMaterial({color:0x379b68,vertexColors:true,roughness:.15,metalness:.05,
  transmission:.61,thickness:.70,ior:1.54,attenuationDistance:1.2,attenuationColor:0x4fcf88,
  clearcoat:.65,clearcoatRoughness:.18,emissive:0x2adc79});
 const crystalEnergy={value:0};
 // Strata and fractures run through the volume, so the detail follows the stone when it turns.
 gem.onBeforeCompile=shader=>{
  shader.uniforms.crystalEnergy=crystalEnergy;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 rockPoint;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`
   #include <common>
   varying vec3 rockPoint;
   uniform float crystalEnergy;
   float rockHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float rockNoise(vec3 p){
    vec3 f=fract(p),i=floor(p);
    f=f*f*(3.-2.*f);
    return mix(
     mix(mix(rockHash(i),rockHash(i+vec3(1,0,0)),f.x),
         mix(rockHash(i+vec3(0,1,0)),rockHash(i+vec3(1,1,0)),f.x),f.y),
     mix(mix(rockHash(i+vec3(0,0,1)),rockHash(i+vec3(1,0,1)),f.x),
         mix(rockHash(i+vec3(0,1,1)),rockHash(i+vec3(1,1,1)),f.x),f.y),f.z);
   }
  `).replace('#include <color_fragment>',`
   #include <color_fragment>
   float inclusions=rockNoise(rockPoint*vec3(7.,12.,7.))*.7+rockNoise(rockPoint*33.)*.3;
   float strat=sin(dot(rockPoint,vec3(27.,54.,-16.))+inclusions*6.5)*.5+.5;
   float vein=pow(max(0.,1.-abs(sin(dot(rockPoint,vec3(8.,13.,-6.))+inclusions*4.2))),22.);
   diffuseColor.rgb *= .70+inclusions*.37+strat*.16;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.40,.67,.43),vein*.14);
  `).replace('#include <emissivemap_fragment>',`
   #include <emissivemap_fragment>
   totalEmissiveRadiance += crystalEnergy*(vein*.30+strat*inclusions*.023)*vec3(.48,1.,.35);
  `);
 };
 const shades=[[.64,.82,.71],[.80,.92,.80],[.55,.73,.66],[.86,.97,.86],[.70,.85,.74]];
 function shard(scale:number,x:number,y:number,z:number,tilt:number,spin:number){
  const verts:Vector3[]=[],p:number[]=[],c:number[]=[],n=5;
  for(const [h,r,twist] of [[-.48,.13,0],[-.18,.48,.1],[.34,.39,.26]]){
   for(let i=0;i<n;i++){
    const a=i*2*Math.PI/n+twist;
    verts.push(point(Math.cos(a)*r,h+.055*Math.sin(i*1.8),Math.sin(a)*r));
   }
  }
  verts.push(point(.06,.91,-.028),point(-.045,-.63,.034));
  function facet(a:number,b:number,d:number,tone:number){
   const tint=shades[tone%shades.length];
   for(const i of [a,b,d]){p.push(...verts[i].toArray());c.push(...tint);}
  }
  for(let i=0;i<n;i++){
   const j=(i+1)%n;
   for(let row=0;row<2;row++){
    const a=row*n+i,b=row*n+j;
    facet(a,b+n,b,i+row);facet(a,a+n,b+n,i+row+1);
   }
   facet(2*n+i,3*n,2*n+j,i+1);facet(j,3*n+1,i,i+2);
  }
  const geo=new BufferGeometry();
  geo.setAttribute('position',new Float32BufferAttribute(p,3));
  geo.setAttribute('color',new Float32BufferAttribute(c,3));geo.computeVertexNormals();
  const mesh=place(geo,gem,x,y,z,crystal);
  mesh.scale.setScalar(scale);mesh.rotation.set(0,spin,tilt);
 }
 shard(1.17,.01,.12,0,.16,-.1);
 shard(.70,-.40,-.26,.07,.42,.43);shard(.62,.37,-.19,.10,-.46,.25);
 shard(.45,.06,-.33,.32,-.14,.45);

 // This glass is a single light shell; the translucent highlight shader avoids a second render pass.
 const glass=new ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{energy:{value:0}},
  vertexShader:`
   varying vec3 n;
   varying vec3 v;
   void main(){
    vec4 view=modelViewMatrix*vec4(position,1.0);
    n=normalize(normalMatrix*normal);v=-view.xyz;
    gl_Position=projectionMatrix*view;
   }`,
  fragmentShader:`
   varying vec3 n;
   varying vec3 v;
   uniform float energy;
   void main(){
    vec3 N=normalize(n);
    float rim=pow(1.0-max(dot(N,normalize(v)),0.0),3.4);
    float gold=pow(max(dot(N,normalize(vec3(.69,.23,.70))),0.0),42.0);
    float soft=pow(max(dot(N,normalize(vec3(-.66,.18,.66))),0.0),19.0);
    float reflectionDistance=(N.x+.57-N.y*.12)*31.;
    float windowReflection=exp(-reflectionDistance*reflectionDistance)*
     smoothstep(.15,.6,N.z)*(1.-smoothstep(.31,.68,abs(N.y-.1)));
    vec3 tone=mix(vec3(.50,.73,.63),vec3(1.,.91,.72),max(gold,windowReflection));
    gl_FragColor=vec4(tone, .018+rim*.23+gold*.29+soft*.12+windowReflection*.28+energy*rim*.08);
    #include <colorspace_fragment>
   }`});
 const shell=lathe([[1.03,1.17],[1.08,1.22],[1.12,1.38],[1.15,1.64],[1.16,1.92],
  [1.13,2.19],[1.07,2.47],[.96,2.73],[.80,2.98],[.59,3.17],[.37,3.30],[.17,3.36],[0,3.37]],glass,0,0,center,64);
 shell.renderOrder=5;

 const rotor=new Group();rotor.position.set(0,2.11,center);body.add(rotor);
 const pollenGeo=new BufferGeometry(),grains:number[]=[];
 for(let i=0;i<30;i++){
  const a=i*2.39996,r=.40+(i%7)*.077;
  grains.push(Math.cos(a)*r,((i*17)%31)/31*1.63-.80,Math.sin(a)*r);
 }
 pollenGeo.setAttribute('position',new Float32BufferAttribute(grains,3));
 const pollen=new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,
  uniforms:{energy:{value:0}},
  vertexShader:`void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=2.8;}`,
  fragmentShader:`uniform float energy;void main(){
   float r=length(gl_PointCoord-.5);
   gl_FragColor=vec4(1.,.86,.48,energy*(1.-smoothstep(0.,.5,r)));
  }`});
 rotor.add(new Points(pollenGeo,pollen));

 const lens=new SphereGeometry(.156,24,14);
 const ports=portColors.map((color,i)=>{
  const x=(i-2)*.87,z=1.27-Math.abs(i-2)*.15;
  lathe([[0,.51],[.22,.51],[.24,.56],[.21,.61],[.173,.62],[.17,.86],[.20,.88],[.21,.935],[.16,.97],[0,.97]],brass,x,0,z,28);
  ring(.18,.014,fillet,x,.885,z);
  const bulb=material(0x354238,.15,.24);bulb.emissive=new Color(color);bulb.envMapIntensity=.45;
  place(lens,bulb,x,.962,z).scale.y=.56;
  const cable=material(0x766042,.63,.33);cable.emissive.setHex(color);
  path([point(x,.91,z-.16),point(x,.82,z-.34),point(x*.65,.64,z-.54),point(x*.49,.69,z-.64)],.022,cable);
  return {bulb,cable,color,number:point(x,.49,z+.29)};
 });
 return {body,crystal,gem,crystalEnergy,ports,rotor,glass,pollen,textures:[walnut,patina]};
}
