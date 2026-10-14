import ffmpeg from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
mkdirSync('output/asset-sources',{recursive:true});
for(const file of readdirSync('public/images').filter(f=>/^vassel-.*\.jpg$/.test(f))) {
  const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',`public/images/${file}`,'-c:v','libwebp','-quality','82','-compression_level','6',`public/images/${file.replace('.jpg','.webp')}`],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
  renameSync(`public/images/${file}`,`output/asset-sources/${file}`);
}
const logo=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i','public/brand/vassel-original.png','-c:v','libwebp','-lossless','1','-compression_level','6','public/brand/vassel-original.webp'],{stdio:'inherit'});
if(logo.status!==0)process.exit(logo.status||1);
// The favicon embeds the same artwork; the viewport frames the exact original monogram.
const icon=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-i','public/brand/vassel-original.png','-vf','scale=512:512','-c:v','libwebp','-quality','90','-f','image2pipe','-']);
if(icon.status!==0)process.exit(icon.status||1);
writeFileSync('public/brand/favicon.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="445 346 357 309"><image href="data:image/webp;base64,${icon.stdout.toString('base64')}" width="1254" height="1254"/></svg>`);
