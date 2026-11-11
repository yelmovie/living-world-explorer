import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8').replace("const VERSION='dev',FILES=[]", "const VERSION='test',FILES=[['assets/specimen.glb','hash',true]]");
async function scenario({quota=false,status=200,range=false}={}){
 const entries=new Map(),handlers={};let online=true,fetches=0;
 const cache={match:async key=>entries.get(key)?.clone(),put:async(key,response)=>{if(quota)throw Error('quota');entries.set(key,response.clone());}};
 const context={URL,Response,setTimeout,location:new URL('https://class.test/'),self:{addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>cache},fetch:async()=>{fetches++;if(!online)throw Error('offline');return new Response('model',{status});}};
 vm.runInNewContext(source,context);
 const request=new Request('https://class.test/assets/specimen.glb',range?{headers:{Range:'bytes=1-3'}}:undefined);
 const get=()=>{let result;handlers.fetch({request,respondWith:p=>result=p});return result;};
 const response=await get();
 assert.equal(response.status,range&&status===200?206:status);
 if(status===200)assert.equal(await response.text(),range?'ode':'model');
 if(status===200&&!quota){assert.equal(entries.size,1);online=false;assert.equal(await (await get()).text(),range?'ode':'model');assert.equal(fetches,1);}
 else assert.equal(entries.size,0);
}
await scenario();await scenario({quota:true});await scenario({status:404});
await scenario({range:true});await scenario({range:true,quota:true});await scenario({range:true,status:404});
console.log('PASS: ordinary GET and media Range cached, offline replay, quota fallback, failed response not cached');
