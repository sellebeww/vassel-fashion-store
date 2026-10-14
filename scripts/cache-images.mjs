import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function files(dir) { const entries = await readdir(dir,{withFileTypes:true}); return (await Promise.all(entries.map(e=>e.isDirectory()?files(`${dir}/${e.name}`):`${dir}/${e.name}`))).flat(); }
const sources=await Promise.all((await files('src')).filter(f=>/\.tsx?$/.test(f)).map(async path=>({path,text:await readFile(path,'utf8')})));
const urls=[...new Set(sources.flatMap(s=>s.text.match(/https:\/\/images\.unsplash\.com\/[^'"\s]+/g)||[]))];
await mkdir('public/images/catalog',{recursive:true});
let map={}; try { map=JSON.parse(await readFile('scripts/image-sources.json','utf8')).downloaded||{}; } catch {}
const failures=[];
for(let i=0;i<urls.length;i+=4) await Promise.all(urls.slice(i,i+4).map(async url=>{
 try { const response=await fetch(url,{signal:AbortSignal.timeout(25000)}); if(!response.ok) throw Error(String(response.status)); const name=createHash('sha1').update(url).digest('hex').slice(0,12)+'.jpg'; await writeFile(`public/images/catalog/${name}`,Buffer.from(await response.arrayBuffer())); map[url]=`/images/catalog/${name}`; }
 catch(e){failures.push({url,error:String(e)});}
}));
for(const source of sources) {let text=source.text; for(const [url,path] of Object.entries(map)) text=text.replaceAll(url,path); if(text!==source.text) await writeFile(source.path,text);}
await writeFile('scripts/image-sources.json',JSON.stringify({downloaded:map,failures},null,2));
console.log(JSON.stringify({downloaded:Object.keys(map).length,failures},null,2));
