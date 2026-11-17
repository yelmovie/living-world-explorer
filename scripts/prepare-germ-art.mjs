// 2026-11-17: converts the M3 redesign art (assets/generated/m3-20261117) into web assets.
import sharp from 'sharp';
import {existsSync} from 'node:fs';
const src='assets/generated/m3-20261117',out='public/assets/study/germ';
const webp=(file,name,width,q=78)=>existsSync(`${src}/${file}`)?sharp(`${src}/${file}`).resize({width,withoutEnlargement:true}).webp({quality:q,alphaQuality:90}).toFile(`${out}/${name}.webp`):null;
await webp('zoom-1-slide.png','zoom-slide',1280);
await webp('zoom-4-bacteria.png','zoom-bacteria',1280);
await webp('petri-empty.png','petri',720,80);
await webp('swab.png','swab',360,80);
await webp('sample-hand.png','sample-hand',560);
await webp('sample-doorknob.png','sample-doorknob',560);
// Slice the bacteria sheet into one sprite per column of opaque pixels.
const sheet=sharp(`${src}/bacteria-sprites.png`).ensureAlpha();const {data,info}=await sheet.raw().toBuffer({resolveWithObject:true});
const used=x=>{for(let y=0;y<info.height;y++)if(data[(y*info.width+x)*4+3]>24)return true;return false;};
const runs=[];let start=-1;for(let x=0;x<info.width;x++){const u=used(x);if(u&&start<0)start=x;if(!u&&start>=0){if(x-start>20)runs.push([start,x]);start=-1;}}if(start>=0)runs.push([start,info.width]);
const names=['round','chain','rod','tail','spiral'];
if(runs.length!==names.length)throw Error('expected 5 sprites, found '+runs.length);
for(const [i,[a,b]] of runs.entries()){const cut=await sharp(`${src}/bacteria-sprites.png`).extract({left:a,top:0,width:b-a,height:info.height}).png().toBuffer();const piece=await sharp(cut).trim({threshold:1}).png().toBuffer();await sharp(piece).resize({height:160,withoutEnlargement:true}).webp({quality:82,alphaQuality:90}).toFile(`${out}/bug-${names[i]}.webp`);}
console.log('germ art ready');
