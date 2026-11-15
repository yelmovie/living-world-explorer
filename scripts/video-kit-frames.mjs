import sharp from 'sharp';
const out='output/video-kit-20261115/frames/';
const W=1920,H=1080;
// Specimen art is not 16:9: extend its own paper colour instead of stretching the organism.
async function specimen(src,name){
 const img=sharp(src);const {data,info}=await img.clone().extract({left:2,top:2,width:8,height:8}).raw().toBuffer({resolveWithObject:true});
 let r=0,g=0,b=0;const n=info.width*info.height;for(let i=0;i<n;i++){r+=data[i*info.channels];g+=data[i*info.channels+1];b+=data[i*info.channels+2];}
 const background={r:Math.round(r/n),g:Math.round(g/n),b:Math.round(b/n)};
 await img.resize(W,H,{fit:'contain',background,kernel:'lanczos3'}).jpeg({quality:93}).toFile(out+name);
 return background;
}
const cover=(src,name)=>sharp(src).resize(W,H,{fit:'cover',kernel:'lanczos3'}).jpeg({quality:93}).toFile(out+name);
// "Before" frame of a restoration clip: the same lab at dusk with the lamps off (darker and cooler, colours kept).
const dark=(src,name)=>sharp(src).resize(W,H,{fit:'cover',kernel:'lanczos3'}).modulate({brightness:.46,saturation:.72}).linear([.82,.92,1.16],[0,0,4]).jpeg({quality:93}).toFile(out+name);
const S='public/assets/study/',P='public/assets/places/';
console.log('paramecium bg',await specimen(S+'paramecium.webp','A1-paramecium-start.jpg'));
await cover(S+'spirogyra.webp','A2-spirogyra-start.jpg'); // filaments already run edge to edge
await cover(S+'milk.webp','A3-yogurt-start.jpg');await cover(S+'yogurt.webp','A3-yogurt-end.jpg');
await cover(S+'dough-before.webp','A4-dough-start.jpg');await cover(S+'dough-after.webp','A4-dough-end.jpg');
await cover(S+'bread-0.webp','A5-bread-start.jpg');await cover(S+'bread-3.webp','A5-bread-end.jpg');
await cover(S+'leaf-0.webp','A6-leaf-start.jpg');await cover(S+'leaf-3.webp','A6-leaf-end.jpg');
for(const [i,p] of ['fungi','water','archive','village','workshop'].entries()){await dark(P+p+'.webp',`B${i+1}-${p}-start-dark.jpg`);await cover(P+p+'.webp',`B${i+1}-${p}-end-lit.jpg`);}
