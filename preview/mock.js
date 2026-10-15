/* Sistema de archivos simulado: SOLO para la vista previa en navegador (no se incluye en el APK). */
(function(){
if(window.WBridge) return;
const R='/storage/emulated/0', SD='/storage/ABCD-1234', now=Date.now(), D=864e5;
const FS={};
const bn=p=>p.slice(p.lastIndexOf('/')+1), dn=p=>p.slice(0,p.lastIndexOf('/'))||'/';
const ext=n=>n.includes('.')?n.split('.').pop().toLowerCase():'';
function dir(p,age){FS[p]={dir:true,size:0,mtime:now-(age||5)*D}}
function file(p,size,age,o){FS[p]=Object.assign({dir:false,size,mtime:now-(age==null?3:age)*D},o||{})}
[R,SD,R+'/Download',R+'/DCIM',R+'/DCIM/Camera',R+'/Pictures',R+'/Pictures/Screenshots',R+'/Documents',R+'/Music',R+'/Movies',R+'/Android',R+'/Projects',R+'/Projects/w-core',SD+'/Backup'].forEach((p,i)=>dir(p,i+1));
const readme='# W FILE MANAGER\n\nGestor de archivos con interfaz WebView offline.\n\n- Explorador\n- Visor y extractor ZIP\n- Editor TXT\n- Visor de imágenes\n';
const zipEntries=[
 {name:'src/',dir:true},{name:'src/Main.kt',size:1840,text:'package com.wairo.core\n\nfun main() {\n    println("W CORE online")\n}\n'},
 {name:'src/util/',dir:true},{name:'src/util/Helpers.kt',size:920,text:'object Helpers {\n    fun fmt(b: Long) = "$b B"\n}\n'},
 {name:'assets/',dir:true},{name:'assets/logo.png',size:5200,img:true},
 {name:'README.md',size:640,text:readme},{name:'build.gradle.kts',size:410,text:'plugins { kotlin("jvm") }\n'},
 {name:'docs/',dir:true},{name:'docs/manual.txt',size:2100,text:'Manual de usuario\n=================\nPaso 1: abrir.\nPaso 2: extraer.\n'}];
file(R+'/Download/proyecto_w.zip',48213,1,{zip:zipEntries});
file(R+'/Download/backup_fotos.zip',2180422,6,{zip:zipEntries.slice(4,6)});
file(R+'/Download/informe_Q3.pdf',1320100,2);
file(R+'/Download/instalador.apk',18340211,4);
file(R+'/Download/notas.txt',380,0,{text:'Notas rápidas\n-------------\n* Revisar permisos de almacenamiento\n* Probar extractor ZIP\n* Publicar build en GitHub\n'});
file(R+'/Download/config.json',212,8,{text:'{\n  "theme": "neon",\n  "offline": true\n}\n'});
file(R+'/Documents/README.txt',paraLen(readme),1,{text:readme});
file(R+'/Documents/plan_2026.txt',640,12,{text:'PLAN 2026\n\nQ1: base\nQ2: sync\nQ3: IA\nQ4: expansión\n'});
file(R+'/Documents/presupuesto.xlsx',48200,20);
file(R+'/Projects/w-core/Main.kt',900,2,{text:'fun main() = println("hola")\n'});
for(let i=1;i<=9;i++) file(R+'/DCIM/Camera/IMG_'+String(i).padStart(4,'0')+'.jpg',2100000+i*91234,i,{img:true});
['wallpaper_neon.png','arquitectura_futura.png','circuito.png','ciudad_orbital.png'].forEach((n,i)=>file(R+'/Pictures/'+n,820000+i*50000,i*3+1,{img:true}));
file(R+'/Pictures/Screenshots/Screenshot_001.png',410000,2,{img:true});
['tema_01.mp3','tema_02.mp3','ambient.flac'].forEach((n,i)=>file(R+'/Music/'+n,4200000+i*900000,i+2));
file(R+'/Movies/demo.mp4',84000000,9);
file(SD+'/Backup/contactos.csv',4300,15,{text:'nombre,tel\nAna,555-1\n'});
file(SD+'/foto_sd.jpg',1900000,5,{img:true});
function paraLen(s){return s.length}
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
function svg(name,w,h){const a=hue(name),b=(a+70)%360;return 'data:image/svg+xml;utf8,'+encodeURIComponent(
`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a},80%,35%)"/><stop offset="1" stop-color="hsl(${b},85%,18%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><g stroke="rgba(255,255,255,.12)" fill="none"><circle cx="${w*.7}" cy="${h*.4}" r="${h*.28}"/><circle cx="${w*.7}" cy="${h*.4}" r="${h*.18}"/><path d="M0 ${h*.8}L${w} ${h*.55}"/></g><text x="${w*.06}" y="${h*.9}" fill="#fff" fill-opacity=".8" font-family="monospace" font-size="${h*.06}">${name}</text></svg>`)}
const clone=o=>JSON.parse(JSON.stringify(o));
const item=p=>{const f=FS[p];return{name:bn(p),path:p,dir:f.dir,size:f.size,mtime:f.mtime,count:f.dir?kids(p).length:0}};
const kids=p=>Object.keys(FS).filter(k=>k!==p&&dn(k)===p);
const desc=p=>Object.keys(FS).filter(k=>k.startsWith(p+'/'));
const SETS={image:['jpg','jpeg','png','gif','webp','bmp'],video:['mp4','mkv','avi','mov','webm'],audio:['mp3','wav','flac','aac','ogg'],doc:['pdf','doc','docx','xls','xlsx','ppt','pptx'],zip:['zip','jar'],apk:['apk'],text:['txt','log','md','json','xml','csv','ini','kt','js','html']};
function uniq(d,n){let p=d+'/'+n;if(!FS[p])return p;const b=n.includes('.')?n.slice(0,n.lastIndexOf('.')):n,e=n.includes('.')?n.slice(n.lastIndexOf('.')):'';let i=1;while(FS[d+'/'+b+' ('+i+')'+e])i++;return d+'/'+b+' ('+i+')'+e}
function cmpf(sort,asc){const k={name:p=>p.name.toLowerCase(),size:p=>p.size,date:p=>p.mtime,type:p=>ext(p.name)+p.name.toLowerCase()}[sort]||(p=>p.name.toLowerCase());return(a,b)=>{const x=k(a),y=k(b);return(x<y?-1:x>y?1:0)*(asc?1:-1)}}
let granted=false;
const H={
 perm:()=>({all:granted,legacy:granted,media:granted,sdk:34}),
 reqPerm:()=>{granted=true;return true},
 roots:()=>[{name:'Almacenamiento interno',path:R,primary:true,total:128e9,free:53.4e9},{name:'Tarjeta SD',path:SD,primary:false,total:64e9,free:41e9}],
 list:a=>{let it=kids(a.path).map(item).filter(i=>a.hidden||!i.name.startsWith('.'));const c=cmpf(a.sort,a.asc);return{path:a.path,parent:dn(a.path),items:it.filter(i=>i.dir).sort(c).concat(it.filter(i=>!i.dir).sort(c))}},
 stat:a=>{const f=FS[a.path],d=desc(a.path);return{name:bn(a.path),path:a.path,dir:f.dir,size:f.dir?d.reduce((s,k)=>s+FS[k].size,0):f.size,files:d.filter(k=>!FS[k].dir).length,folders:d.filter(k=>FS[k].dir).length,mtime:f.mtime,readable:true,writable:true,hidden:false,mime:f.dir?'carpeta':(ext(a.path)||'application/octet-stream')}},
 mkdir:a=>{const p=a.path+'/'+a.name;if(FS[p])throw new Error('Ya existe');dir(p,0);return p},
 newFile:a=>{const p=a.path+'/'+a.name;if(FS[p])throw new Error('Ya existe');file(p,(a.content||'').length,0,{text:a.content||''});return p},
 rename:a=>{const n=dn(a.path)+'/'+a.name;if(FS[n])throw new Error('Ya existe un elemento con ese nombre');[a.path,...desc(a.path)].forEach(k=>{FS[n+k.slice(a.path.length)]=FS[k];delete FS[k]});return n},
 delete:a=>{a.paths.forEach(p=>{desc(p).forEach(k=>delete FS[k]);delete FS[p]});return a.paths.length},
 copy:a=>cp(a,false),move:a=>cp(a,true),
 readText:a=>{const f=FS[a.path];if(!f||f.dir)throw new Error('No es un archivo');return{text:f.text||'',size:f.size}},
 writeText:a=>{const f=FS[a.path]||(FS[a.path]={dir:false});f.text=a.text;f.size=a.text.length;f.mtime=Date.now();return true},
 search:a=>Object.keys(FS).filter(k=>k.startsWith(a.path+'/')&&bn(k).toLowerCase().includes(a.q.toLowerCase())).map(item),
 category:a=>Object.keys(FS).filter(k=>!FS[k].dir&&(SETS[a.type]||[]).includes(ext(k))).map(item).sort((x,y)=>y.mtime-x.mtime),
 zipList:a=>{const z=FS[a.path].zip;if(!z)throw new Error('ZIP no válido');return{entries:z.map(e=>({name:e.name,dir:!!e.dir,size:e.size||0,csize:Math.round((e.size||0)*.55),mtime:FS[a.path].mtime})),total:z.reduce((s,e)=>s+(e.size||0),0),size:FS[a.path].size}},
 zipRead:a=>{const e=FS[a.path].zip.find(x=>x.name===a.entry);if(e.img)return{b64:btoa(unescape(encodeURIComponent(decodeURIComponent(svg('logo.png',600,400).split(',')[1])))),mime:'image/svg+xml'};return{text:e.text||''}},
 zipExtract:a=>{const z=FS[a.path].zip;let n=0;dir(a.dest,0);z.forEach(e=>{if(a.entries&&a.entries.length&&!a.entries.some(f=>e.name===f||(f.endsWith('/')&&e.name.startsWith(f))))return;const p=a.dest+'/'+e.name.replace(/\/$/,'');let d=dn(p);while(!FS[d]&&d.length>1){dir(d,0);d=dn(d)}if(e.dir)dir(p,0);else{file(p,e.size,0,{text:e.text,img:e.img});n++}});return n},
 zipCreate:a=>{const p=uniq(a.dest,a.name.toLowerCase().endsWith('.zip')?a.name:a.name+'.zip');const es=[];a.paths.forEach(s=>{[s,...desc(s)].forEach(k=>{const r=bn(dn(s))&&k.slice(dn(s).length+1);es.push({name:FS[k].dir?r+'/':r,dir:FS[k].dir,size:FS[k].size,text:FS[k].text})})});file(p,es.reduce((s,e)=>s+(e.size||0),0)*.6+200,0,{zip:es});return p},
 open:a=>{toast('Abrir con app externa: '+bn(a.path));return true},
 share:a=>{toast('Compartir: '+a.paths.length+' archivo(s)');return true}
};
function toast(m){const t=document.getElementById('toast');if(t){t.textContent='[Vista previa] '+m;t.className='on';setTimeout(()=>t.className='',1800)}}
function cp(a,mv){if(!FS[a.dest]||!FS[a.dest].dir)throw new Error('Destino no válido');let n=0;a.paths.forEach(s=>{if(FS[s].dir&&(a.dest===s||a.dest.startsWith(s+'/')))throw new Error('No se puede copiar una carpeta dentro de sí misma');if(mv&&dn(s)===a.dest)return;const t=uniq(a.dest,bn(s));[s,...desc(s)].forEach(k=>{FS[t+k.slice(s.length)]=Object.assign({},FS[k])});if(mv){desc(s).forEach(k=>delete FS[k]);delete FS[s]}n++});return n}
window.WFM_MOCK={call:(m,a)=>new Promise((res,rej)=>setTimeout(()=>{try{if(!H[m])throw new Error('Método desconocido: '+m);res(clone(H[m](a||{})))}catch(e){rej(e)}},70)),
 url:p=>{const f=FS[p];if(f&&f.img)return svg(bn(p),480,320);return ''}};
})();
