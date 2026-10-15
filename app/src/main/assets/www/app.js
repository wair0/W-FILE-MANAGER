/* W FILE MANAGER — lógica de interfaz (WebView offline) */
(function(){
'use strict';

/* ================= Utilidades ================= */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bn=p=>p.slice(p.lastIndexOf('/')+1);
const dn=p=>p.slice(0,p.lastIndexOf('/'))||'/';
const ex=n=>n.includes('.')?n.split('.').pop().toLowerCase():'';
const fsz=b=>{b=+b||0;if(b<1024)return b+' B';const u=['KB','MB','GB','TB'];let i=-1;do{b/=1024;i++}while(b>=1024&&i<3);return b.toFixed(b<10?1:0)+' '+u[i]};
const fdt=t=>{if(!t)return '—';const d=new Date(t),p=n=>String(n).padStart(2,'0');return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`};
const store={get(k,d){try{const v=localStorage.getItem('wfm.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('wfm.'+k,JSON.stringify(v))}catch(e){}}};

const I={
 menu:'M4 6h16M4 12h16M4 18h16',search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
 grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
 more:'M12 5h.01M12 12h.01M12 19h.01',home:'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
 folder:'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
 file:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
 image:'M4 5h16v14H4zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 17l5-5 4 4 3-3 4 4',
 zip:'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10',text:'M4 6h16M4 10h16M4 14h10M4 18h7',
 plus:'M12 5v14M5 12h14',back:'M15 5l-7 7 7 7',x:'M6 6l12 12M18 6L6 18',check:'M5 12l5 5 9-10',
 copy:'M9 9h11v11H9zM5 15V4h11',cut:'M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8.5 8l11 10M8.5 16l11-10',
 trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',edit:'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
 share:'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
 info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',star:'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
 download:'M12 4v11M7 11l5 5 5-5M5 20h14',save:'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',undo:'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
 music:'M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',video:'M3 6h13v12H3zM16 10l5-3v10l-5-3',
 apk:'M7 8h10v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zM7 8a5 5 0 0 1 10 0M9 4L8 2M15 4l1-2',
 settings:'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
 shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',hdd:'M3 14h18v6H3zM3 14l3-9h12l3 9M7 17h.01',
 clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',refresh:'M20 11a8 8 0 1 0-2 5.5M20 4v7h-7',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',chev:'M9 5l7 7-7 7',
 wrap:'M3 6h18M3 12h14a3 3 0 0 1 0 6h-4M15 16l-2 2 2 2M3 18h6',zoomin:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3M11 8v6M8 11h6',
 up:'M12 19V5M6 11l6-6 6 6',sort:'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',doc:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6',
 ext:'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',sel:'M4 4h16v16H4zM8 12l3 3 5-6',
 plusf:'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 11v6M9 14h6',
 bolt:'M13 2L4 14h7l-1 8 9-12h-7z',minus:'M5 12h14',search2:'M4 6h16M4 12h10M4 18h6'
};
const ico=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${I[n]||I.file}"/></svg>`;

const EXT={image:['jpg','jpeg','png','gif','webp','bmp','heic','heif','avif','svg'],video:['mp4','mkv','avi','mov','webm','3gp','flv','wmv','m4v'],
 audio:['mp3','wav','flac','aac','ogg','m4a','opus','wma','amr'],zip:['zip','jar','apks','xapk'],apk:['apk'],doc:['pdf','doc','docx','xls','xlsx','ppt','pptx','odt','ods','rtf','epub'],
 text:['txt','log','md','json','xml','csv','ini','conf','cfg','properties','yml','yaml','html','htm','css','js','ts','kt','java','py','sh','sql','gradle','bat','smali']};
const kind=it=>{if(it.dir)return 'folder';const e=ex(it.name);for(const k in EXT)if(EXT[k].includes(e))return k;return 'file'};
const KI={folder:'folder',image:'image',video:'video',audio:'music',zip:'zip',apk:'apk',doc:'doc',text:'text',file:'file'};

/* ================= API (puente Kotlin) ================= */
let pendingN=0,busyN=0;const pend={};
window.WFM_CB=(id,json)=>{const p=pend[id];if(!p)return;delete pend[id];let r;try{r=JSON.parse(json)}catch(e){return p.rej(e)}r.ok?p.res(r.data):p.rej(new Error(r.error))};
function busy(d){busyN=Math.max(0,busyN+d);$('#busy').classList.toggle('on',busyN>0)}
function api(m,a){
  busy(1);
  const p=window.WFM_MOCK?window.WFM_MOCK.call(m,a||{}):new Promise((res,rej)=>{const id=++pendingN;pend[id]={res,rej};try{WBridge.call(id,m,JSON.stringify(a||{}))}catch(e){delete pend[id];rej(e)}});
  return p.finally(()=>busy(-1));
}
const furl=p=>window.WFM_MOCK?window.WFM_MOCK.url(p):'https://wfile.local/f?p='+encodeURIComponent(p);

/* ================= Estado ================= */
const S={sec:'home',path:null,items:[],mode:'dir',q:'',view:store.get('view','list'),sort:store.get('sort','name'),asc:store.get('asc',true),hidden:store.get('hidden',false),
 sel:new Set(),clip:null,favs:store.get('favs',[]),rec:store.get('rec',[]),roots:[],perm:{all:false},cat:null,zip:null,ed:null,storage:null,zips:null,txts:null,reload:null};
const SECS=[{id:'home',t:'Inicio',i:'home'},{id:'files',t:'Explorador',i:'folder'},{id:'images',t:'Imágenes',i:'image'},{id:'zip',t:'Visor ZIP',i:'zip'},{id:'txt',t:'Editor TXT',i:'text'},
 {id:'recent',t:'Recientes',i:'clock'},{id:'favs',t:'Favoritos',i:'star'},{id:'settings',t:'Ajustes',i:'settings'},{id:'about',t:'Acerca de',i:'info'}];
const CATS=[{t:'video',n:'Videos',i:'video'},{t:'audio',n:'Audio',i:'music'},{t:'doc',n:'Documentos',i:'doc'},{t:'apk',n:'APK',i:'apk'}];
const NAV=['home','files'];
const root=()=>(S.roots[0]&&S.roots[0].path)||'/storage/emulated/0';
const rootOf=p=>{const r=S.roots.filter(r=>p===r.path||p.startsWith(r.path+'/')).sort((a,b)=>b.path.length-a.path.length)[0];return r?r.path:root()};

/* ================= UI helpers ================= */
let tt;function toast(m,err){const t=$('#toast');t.textContent=m;t.className='on'+(err?' err':'');clearTimeout(tt);tt=setTimeout(()=>t.className='',2300)}
const fail=e=>toast((e&&e.message)||String(e),true);
function layerClose(){$('#layer').innerHTML='';}
function sheet(title,acts){
  const L=$('#layer');
  L.innerHTML=`<div class="ov" data-ov><div class="sheet"><div class="grab"></div><h3>${esc(title)}</h3>${acts.map((a,i)=>a?`<button class="sa ${a.d?'dng':''}" data-a="${i}">${ico(a.i)}<span>${esc(a.t)}</span></button>`:'').join('')}</div></div>`;
  L.firstChild.onclick=e=>{if(e.target.dataset.ov!==undefined)return layerClose();const b=e.target.closest('[data-a]');if(b){layerClose();acts[+b.dataset.a].f()}};
}
function menuPop(acts){
  const L=$('#layer');
  L.innerHTML=`<div class="ov" data-ov style="background:transparent;backdrop-filter:none"><div class="menu">${acts.map((a,i)=>`<button class="sa" data-a="${i}">${ico(a.i)}<span>${esc(a.t)}</span></button>`).join('')}</div></div>`;
  L.firstChild.onclick=e=>{if(e.target.dataset.ov!==undefined)return layerClose();const b=e.target.closest('[data-a]');if(b){layerClose();acts[+b.dataset.a].f()}};
}
function dialog(o){ /* {title,msg,input,ok,cancel,danger,html} → Promise */
  return new Promise(res=>{
    const L=$('#layer');
    L.innerHTML=`<div class="ov mid" data-ov><div class="dlg"><h3>${esc(o.title||'')}</h3>${o.msg?`<p>${esc(o.msg)}</p>`:''}${o.html||''}${o.input!==undefined?`<input id="dI" value="${esc(o.input)}" autocomplete="off" spellcheck="false">`:''}
    <div class="btns">${o.cancel===false?'':`<button class="btn" data-x="0">${esc(o.cancel||'Cancelar')}</button>`}<button class="btn ${o.danger?'dng':'solid'}" data-x="1">${esc(o.ok||'Aceptar')}</button></div></div></div>`;
    const inp=$('#dI');if(inp){setTimeout(()=>{inp.focus();const d=inp.value.lastIndexOf('.');inp.setSelectionRange(0,d>0&&o.selname?d:inp.value.length)},60)}
    const done=v=>{layerClose();res(v)};
    L.firstChild.onclick=e=>{if(e.target.dataset.ov!==undefined)return done(null);const b=e.target.closest('[data-x]');if(b)done(b.dataset.x==='1'?(inp?inp.value:true):null)};
    if(inp)inp.onkeydown=e=>{if(e.key==='Enter')done(inp.value)};
  });
}
function pickFolder(start,title){
  return new Promise(res=>{
    let cur=start||root();
    const L=$('#layer');
    const draw=async()=>{
      let d;try{d=await api('list',{path:cur,hidden:false,sort:'name',asc:true})}catch(e){fail(e);return}
      const dirs=d.items.filter(i=>i.dir);
      const rts=S.roots.length>1?`<div class="chips" style="margin-bottom:8px">${S.roots.map((r,i)=>`<button class="chip" data-r="${i}">${ico('hdd')}${esc(r.name)}</button>`).join('')}</div>`:'';
      L.innerHTML=`<div class="ov mid" data-ov><div class="dlg"><h3>${esc(title||'Elegir carpeta')}</h3>${rts}<div class="bcs">${esc(cur)}</div>
      <div class="pk">${cur!==rootOf(cur)?`<button class="row" data-up><div class="thumb">${ico('up','k-folder')}</div><div class="info"><div class="nm">..</div></div></button>`:''}
      ${dirs.map((f,i)=>`<button class="row" data-d="${i}"><div class="thumb">${ico('folder','k-folder')}</div><div class="info"><div class="nm">${esc(f.name)}</div></div>${ico('chev')}</button>`).join('')||'<div class="empty" style="padding:20px">Sin subcarpetas</div>'}</div>
      <div class="btns"><button class="btn" data-nf>${ico('plusf')}</button><button class="btn" data-x="0">Cancelar</button><button class="btn solid" data-x="1">Elegir aquí</button></div></div></div>`;
      L.firstChild.onclick=async e=>{const t=e.target;if(t.dataset.ov!==undefined){layerClose();return res(null)}
        const b=t.closest('button');if(!b)return;
        if(b.dataset.r!==undefined){cur=S.roots[+b.dataset.r].path;draw()}
        else if(b.dataset.d!==undefined){cur=dirs[+b.dataset.d].path;draw()}
        else if('up' in b.dataset){cur=dn(cur);draw()}
        else if('nf' in b.dataset){const n=await dialog({title:'Nueva carpeta',input:'Nueva carpeta'});if(n){try{await api('mkdir',{path:cur,name:n})}catch(er){fail(er)}}draw()}
        else if(b.dataset.x==='1'){layerClose();res(cur)}else if(b.dataset.x==='0'){layerClose();res(null)}};
    };
    draw();
  });
}
const layerOpen=()=>!!$('#layer').firstChild;

/* ================= Navegación ================= */
function go(sec,o){
  closeDrawer();layerClose();
  if(S.sec==='txt'&&S.ed&&sec!=='txt'&&S.ed.dirty){/* se conserva el editor en memoria */}
  S.sec=sec;S.sel.clear();
  if(sec==='files'){if(!S.path)S.path=root();S.mode='dir';S.reload=loadDir;loadDir();}
  else if(sec==='images'){S.sec='cat';S.cat={type:'image',title:'Imágenes',grid:true};S.reload=loadCat;loadCat()}
  else if(sec==='zip'){S.reload=null;if(!S.zips)loadZips();}
  else if(sec==='txt'){S.reload=null;if(!S.txts)loadTxts();}
  else if(sec==='home'){loadHome()}
  else if(sec==='favs'){S.items=[];S.reload=loadFavs;loadFavs()}
  else if(sec==='recent'){S.reload=null}
  render();$('#view').scrollTop=0;
}
function openPath(p){S.path=p;S.mode='dir';S.sec='files';S.sel.clear();S.reload=loadDir;closeDrawer();layerClose();loadDir();render();$('#view').scrollTop=0}
function openCat(type,title,grid){S.sec='cat';S.cat={type,title,grid:!!grid};S.sel.clear();S.reload=loadCat;closeDrawer();loadCat();render();$('#view').scrollTop=0}
async function loadDir(){
  try{
    if(S.mode==='search'){S.items=await api('search',{path:S.searchRoot,q:S.q,limit:500})}
    else{const d=await api('list',{path:S.path,hidden:S.hidden,sort:S.sort,asc:S.asc});S.items=d.items}
  }catch(e){S.items=[];fail(e)}
  if(S.sec==='files')render();
}
async function loadCat(){
  try{S.items=await api('category',{type:S.cat.type,limit:3000})}catch(e){S.items=[];fail(e)}
  if(S.sec==='cat')render();
}
async function loadZips(){try{S.zips=await api('category',{type:'zip'})}catch(e){S.zips=[];fail(e)}if(S.sec==='zip')render()}
async function loadTxts(){try{S.txts=(await api('category',{type:'text'})).slice(0,200)}catch(e){S.txts=[];fail(e)}if(S.sec==='txt')render()}
async function loadHome(){
  try{S.roots=await api('roots')}catch(e){}
  if(S.sec==='home')render();
}
function refreshAll(){S.zips=null;S.txts=null;if(S.reload)S.reload();else if(S.sec==='zip'){loadZips()}else if(S.sec==='txt'){loadTxts()}else render()}
function openDrawer(){renderDrawer();$('#scrim').hidden=false;$('#drawer').classList.add('open')}
function closeDrawer(){$('#scrim').hidden=true;$('#drawer').classList.remove('open')}

/* ================= Render ================= */
function titleNow(){
  switch(S.sec){
    case 'home':return 'W FILE MANAGER';
    case 'files':return S.mode==='search'?'Búsqueda':(S.path===rootOf(S.path)?((S.roots.find(r=>r.path===S.path)||{}).name||'Almacenamiento'):bn(S.path));
    case 'cat':return S.cat.title;
    case 'zip':return S.zip?bn(S.zip.path):'Visor ZIP';
    case 'txt':return S.ed?(S.ed.name):'Editor TXT';
    default:return(SECS.find(s=>s.id===S.sec)||{}).t||'';
  }
}
function render(){
  $('#bMenu').innerHTML=ico('menu');$('#bSearch').innerHTML=ico('search');$('#bMore').innerHTML=ico('more');
  $('#bView').innerHTML=ico((S.sec==='cat'?S.cat.grid:S.view==='grid')?'list':'grid');
  $('#title').textContent=titleNow();
  const listy=S.sec==='files'||S.sec==='cat';
  $('#bView').hidden=!listy;$('#bSearch').hidden=!(S.sec==='files'||S.sec==='home'||S.sec==='cat');
  const edit=S.sec==='txt'&&S.ed;
  $('#hdr').style.display=edit?'none':'';
  const nv=S.sec==='cat'&&S.cat.type==='image'?'images':S.sec;
  $('#nav').innerHTML=NAV.map(id=>{const s=SECS.find(x=>x.id===id);return `<button data-n="${id}" class="${nv===id?'on':''}">${ico(s.i)}<span>${esc(id==='zip'?'ZIP':id==='txt'?'TXT':id==='files'?'Archivos':s.t)}</span></button>`}).join('');
  $('#nav').style.display=edit?'none':'';
  const v=$('#view');
  const fn={home:vHome,files:vFiles,cat:vFiles,zip:vZip,txt:vTxt,recent:vRecent,favs:vFavs,settings:vSettings,about:vAbout}[S.sec];
  v.style.padding=edit?'0':'';v.style.overflow=edit?'hidden':'';const st=v.scrollTop;fn(v);v.scrollTop=st;
  if(!edit)hydrateThumbs();
  bars();
}
function bars(){
  const sb=$('#selbar'),cb=$('#clipbar');
  const inList=(S.sec==='files'||S.sec==='cat'||S.sec==='recent'||S.sec==='favs');
  const n=S.sel.size;
  sb.hidden=!(n&&inList);
  if(n&&inList){sb.innerHTML=`<button class="ib" data-s="clr">${ico('x')}</button><span class="cnt">${n}</span><span class="sp"></span>
   <button class="ib" data-s="all">${ico('sel')}</button><button class="ib" data-s="copy">${ico('copy')}</button><button class="ib" data-s="cut">${ico('cut')}</button>
   <button class="ib" data-s="zip">${ico('zip')}</button><button class="ib" data-s="share">${ico('share')}</button><button class="ib" data-s="del" style="color:var(--danger)">${ico('trash')}</button>`}
  cb.hidden=!(S.clip&&S.sec==='files'&&!n);
  if(S.clip&&S.sec==='files'&&!n){cb.innerHTML=`<span>${S.clip.paths.length} elemento(s) · ${S.clip.mode==='copy'?'copiar':'mover'}</span><button class="btn solid" data-c="paste">Pegar aquí</button><button class="ib" data-c="x">${ico('x')}</button>`}
}
const thumbCache=new Map();
function thumbOf(it,big){
  const k=kind(it),e=ex(it.name);
  if(k==='image'||k==='video'||(k==='doc'&&e==='pdf')){
    const t=k==='image'?'image':k==='video'?'video':'pdf';
    return `<img class="generated-thumb" loading="lazy" decoding="async" data-thumb-kind="${t}" data-thumb-path="${esc(it.path)}" alt="" hidden>${ico(KI[k],'k-'+k)}`;
  }
  return ico(KI[k],'k-'+k);
}
async function hydrateThumbs(){
  const nodes=[...document.querySelectorAll('#view [data-thumb-kind]:not([data-thumb-ready])')];
  await Promise.all(nodes.map(async node=>{
    const path=node.dataset.thumbPath,kind=node.dataset.thumbKind,key=kind+':'+path;
    node.dataset.thumbReady='1';
    try{
      let src=thumbCache.get(key);
      if(!src){
        const method=kind==='video'?'videoThumbnail':kind==='pdf'?'pdfThumbnail':'imageThumbnail';
        const r=await api(method,{path});
        if(!r||!r.b64)throw new Error('Miniatura vacía');
        src='data:image/jpeg;base64,'+r.b64;thumbCache.set(key,src);
      }
      if(!node.isConnected)return;
      node.src=src;node.hidden=false;
      const icon=node.nextElementSibling;if(icon&&icon.classList.contains('ic'))icon.style.display='none';
    }catch(_){/* El icono de tipo queda como alternativa para archivos no compatibles o dañados. */}
  }));
}
function rowHtml(it,i,o){
  o=o||{};const k=kind(it),sel=S.sel.has(it.path),fav=S.favs.includes(it.path);
  const sub=it.dir?`${it.count} elem. · ${fdt(it.mtime)}`:`${fsz(it.size)} · ${fdt(it.mtime)}`;
  return `<div class="row ${sel?'sel':''}" data-i="${i}">${S.sel.size?`<div class="ck">${ico('check')}</div>`:''}<div class="thumb">${thumbOf(it)}</div>
   <div class="info"><div class="nm">${esc(it.name)}</div><div class="sub">${o.path?esc(dn(it.path)):sub}</div></div>${fav?ico('star','star'):''}<button class="more" data-m="${i}">${ico('more')}</button></div>`;
}
function gridHtml(it,i){
  const k=kind(it),sel=S.sel.has(it.path);
  return `<div class="gi ${k==='image'?'img':''} ${sel?'sel':''}" data-i="${i}"><div class="ck">${ico('check')}</div>${thumbOf(it,1)}<div class="gn">${esc(it.name)}</div></div>`;
}
function listHtml(items,o){
  if(!items.length)return `<div class="empty">${ico('folder')}<div>SIN ELEMENTOS</div></div>`;
  const grid=(o&&o.grid!==undefined)?o.grid:S.view==='grid';
  return grid?`<div class="grid">${items.map(gridHtml).join('')}</div>`:`<div class="list">${items.map((it,i)=>rowHtml(it,i,o)).join('')}</div>`;
}

/* --- Inicio --- */
function ring(pct){const r=42,c=2*Math.PI*r,d=c*pct/100;return `<div class="ring"><svg viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e5ff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><circle class="bgc" cx="50" cy="50" r="${r}" fill="none" stroke-width="8"/><circle class="fg" cx="50" cy="50" r="${r}" fill="none" stroke-width="8" stroke-dasharray="${d.toFixed(1)} ${c.toFixed(1)}"/></svg><b>${Math.round(pct)}%</b></div>`}
function vHome(v){
  const r0=S.roots[0],used=r0?r0.total-r0.free:0,pct=r0&&r0.total?used/r0.total*100:0;
  const p=S.perm;
  const hero=`<div class="card hero">${ring(pct)}<div style="flex:1;min-width:0"><h2>Almacenamiento interno</h2><div class="big">${r0?fsz(used):'—'} <small>/ ${r0?fsz(r0.total):'—'}</small></div>
   <div class="bar"><i style="width:${pct}%"></i></div><div class="meta">LIBRE ${r0?fsz(r0.free):'—'} · ${p.all?'ACCESO TOTAL':'ACCESO LIMITADO'}</div></div></div>`;
  v.innerHTML=`
  <div class="stitle">Recientes<span class="sp"></span><button data-h="go:recent">VER TODO</button></div>
  ${S.rec.length?`<div class="list">${S.rec.slice(0,5).map((it,i)=>rowHtml(it,i,{path:1})).join('')}</div>`:'<div class="empty" style="padding:22px">SIN ACTIVIDAD RECIENTE</div>'}
  <div class="stitle">Acceso rápido</div>
  <div class="tiles">
   <button class="tile" data-h="cat:image">${ico('image','k-image')}Imágenes</button><button class="tile" data-h="cat:video">${ico('video','k-video')}Videos</button>
   <button class="tile" data-h="cat:audio">${ico('music','k-audio')}Audio</button><button class="tile" data-h="dir:Download">${ico('download','k-text')}Descargas</button></div>
  <div class="stitle">Dispositivos</div>
  <div class="list">${S.roots.map((r,i)=>`<div class="row" data-r="${i}"><div class="thumb">${ico('hdd','k-doc')}</div><div class="info"><div class="nm">${esc(r.name)}</div>
   <div class="sub">${fsz(r.total-r.free)} usados de ${fsz(r.total)}</div><div class="bar" style="margin-top:6px"><i style="width:${r.total?(r.total-r.free)/r.total*100:0}%"></i></div></div>${ico('chev')}</div>`).join('')||'<div class="empty">Cargando…</div>'}</div>
  ${S.favs.length?`<div class="stitle">Favoritos<span class="sp"></span><button data-h="go:favs">VER TODO</button></div><div class="chips">${S.favs.slice(0,10).map((f,i)=>`<button class="chip" data-f="${i}">${ico('star','star')}${esc(bn(f))}</button>`).join('')}</div>`:''}
  <div class="stitle">Almacenamiento</div>${hero}`;
  v.dataset.list='rec';
}
function permRows(){
  const p=S.perm,r=(t,ok)=>`<div class="pr">${ico('shield')}<span>${t}</span><span class="st ${ok?'ok':'no'}">${ok?'ACTIVO':'FALTA'}</span></div>`;
  return r('Acceso total a todos los archivos',p.all)+r('Administración de archivos',p.all)+r('Almacenamiento interno',p.all||p.legacy);
}

/* --- Explorador / categorías --- */
function vFiles(v){
  let head='';
  if(S.sec==='files'){
    if(S.mode==='search'){head=`<div class="card bc"><button data-sx>${ico('x')} Resultados de “${esc(S.q)}”</button></div>`}
    else{
      const r=rootOf(S.path),rel=S.path.slice(r.length).split('/').filter(Boolean);
      let acc=r;const rn=(S.roots.find(x=>x.path===r)||{}).name||'Raíz';
      head=`<div class="card bc"><button data-bc="${esc(r)}">${esc(rn)}</button>${rel.map(s=>{acc+='/'+s;return `${ico('chev')}<button data-bc="${esc(acc)}">${esc(s)}</button>`}).join('')}</div>`;
    }
  }else head=`<div class="stitle">${ico(KI[{image:'image',video:'video',audio:'audio',doc:'doc',apk:'apk'}[S.cat.type]]||'file')} ${esc(S.cat.title)} · ${S.items.length}</div>`;
  v.innerHTML=head+listHtml(S.items,{grid:S.sec==='cat'?S.cat.grid:undefined,path:S.sec==='cat'||S.mode==='search'});
  v.dataset.list='items';
}
function vRecent(v){S.items=S.rec;v.innerHTML=`<div class="stitle">Archivos recientes</div>${listHtml(S.items,{path:1})}`;v.dataset.list='items'}
async function loadFavs(){
  const out=[];
  for(const p of S.favs){try{const t=await api('stat',{path:p});out.push({name:t.name,path:p,dir:t.dir,size:t.size,mtime:t.mtime,count:0})}catch(e){}}
  S.items=out;if(S.sec==='favs')render();
}
function vFavs(v){
  v.innerHTML=`<div class="stitle">Favoritos</div>${S.items.length?listHtml(S.items,{path:1}):'<div class="empty">'+ico('star')+'<div>MARCA ARCHIVOS CON ★</div></div>'}`;v.dataset.list='items';
}

/* --- ZIP --- */
function vZip(v){
  if(S.zip)return vZipOpen(v);
  v.innerHTML=`<div class="card zhead"><div class="thumb">${ico('zip','k-zip')}</div><div style="flex:1"><div class="nm">VISOR Y EXTRACTOR ZIP</div><div class="sub">Abre, explora y extrae paquetes .zip</div></div></div>
  <div class="btns" style="margin-bottom:6px"><button class="btn solid" data-z="find">${ico('refresh')} Buscar ZIP</button><button class="btn vio" data-z="make">${ico('plus')} Crear ZIP</button></div>
  <div class="stitle">ZIP encontrados</div>${S.zips===null?'<div class="empty">ESCANEANDO…</div>':listHtml(S.zips||[],{path:1})}`;
  S.items=S.zips||[];v.dataset.list='items';
}
function zipView(){
  const z=S.zip,pre=z.cwd,m=new Map();
  z.entries.forEach(e=>{if(!e.name.startsWith(pre)||e.name===pre)return;const rel=e.name.slice(pre.length),i=rel.indexOf('/');
    if(i>=0){const n=rel.slice(0,i);if(!m.has(n+'/'))m.set(n+'/',{name:n,full:pre+n+'/',dir:true,size:0})}else m.set(rel,{name:rel,full:e.name,dir:e.dir,size:e.size,mtime:e.mtime,csize:e.csize})});
  const a=[...m.values()];a.sort((x,y)=>(y.dir-x.dir)||x.name.toLowerCase().localeCompare(y.name.toLowerCase()));return a;
}
function vZipOpen(v){
  const z=S.zip,list=zipView();z.list=list;
  const segs=z.cwd.split('/').filter(Boolean);let acc='';
  v.innerHTML=`<div class="card zhead"><div class="thumb">${ico('zip','k-zip')}</div><div style="flex:1;min-width:0"><div class="nm">${esc(bn(z.path))}</div><div class="sub">${z.entries.filter(e=>!e.dir).length} archivos · ${fsz(z.size)} · descomprimido ${fsz(z.total)}</div></div></div>
  <div class="btns" style="margin-bottom:12px"><button class="btn solid" data-z="ext">${ico('download')} Extraer todo</button><button class="btn" data-z="extsel" ${z.sel.size?'':'disabled style="opacity:.4"'}>Selección (${z.sel.size})</button><button class="btn vio" data-z="close">${ico('x')} Cerrar</button></div>
  <div class="card bc"><button data-zb="">${esc(bn(z.path))}</button>${segs.map(s=>{acc+=s+'/';return `${ico('chev')}<button data-zb="${esc(acc)}">${esc(s)}</button>`}).join('')}</div>
  <div class="list">${list.map((e,i)=>`<div class="row ${z.sel.has(e.full)?'sel':''}" data-zi="${i}"><div class="ck" data-zck="${i}" style="${z.sel.has(e.full)?'':'color:transparent'}">${ico('check')}</div><div class="thumb">${ico(e.dir?'folder':KI[kind({name:e.name})],'k-'+(e.dir?'folder':kind({name:e.name})))}</div>
   <div class="info"><div class="nm">${esc(e.name)}</div><div class="sub">${e.dir?'carpeta':fsz(e.size)+(e.csize>=0?' · comp. '+fsz(e.csize):'')}</div></div>${ico('chev')}</div>`).join('')||'<div class="empty">ZIP VACÍO</div>'}</div>`;
  v.dataset.list='';
}
async function openZip(path){
  try{const d=await api('zipList',{path});S.zip={path,entries:d.entries,total:d.total,size:d.size,cwd:'',sel:new Set()};pushRecent({name:bn(path),path,dir:false,size:d.size,mtime:Date.now()});S.sec='zip';S.sel.clear();layerClose();closeDrawer();render();$('#view').scrollTop=0}
  catch(e){fail(new Error('No se pudo abrir el ZIP: '+e.message))}
}
async function zipExtract(entries){
  const z=S.zip,base=bn(z.path).replace(/\.[^.]+$/,''),dirp=dn(z.path);
  sheet('Extraer a…',[
   {i:'folder',t:`Nueva carpeta «${base}»`,f:()=>doExtract(dirp+'/'+base,entries)},
   {i:'download',t:'Esta carpeta ('+bn(dirp)+')',f:()=>doExtract(dirp,entries)},
   {i:'folder',t:'Elegir otra carpeta…',f:async()=>{const d=await pickFolder(dirp,'Extraer en…');if(d)doExtract(d,entries)}}]);
}
async function doExtract(dest,entries){
  try{const n=await api('zipExtract',{path:S.zip.path,dest,entries:entries||[]});toast(`✔ ${n} archivo(s) extraídos`);S.zip.sel.clear();render();
    const ok=await dialog({title:'Extracción completa',msg:`${n} archivo(s) en\n${dest}`,ok:'Abrir carpeta',cancel:'Cerrar'});if(ok)openPath(dest)}
  catch(e){fail(e)}
}
async function zipInstallApk(e){
  const ok=await dialog({
    title:'Instalar aplicación',
    msg:'Se extraerá «'+e.name+'» del ZIP y Android abrirá el instalador del paquete. Solo continúa si confías en el origen del APK.',
    ok:'Continuar',
    cancel:'Cancelar'
  });
  if(!ok)return;
  try{
    await api('zipInstallApk',{path:S.zip.path,entry:e.full});
  }catch(err){fail(err)}
}
async function zipPreview(e){
  const ext=ex(e.name);
  try{
    const r=await api('zipRead',{path:S.zip.path,entry:e.full});
    if(r.b64!==undefined){openViewer([{name:e.name,src:`data:${r.mime||'image/png'};base64,${r.b64}`,size:e.size,mtime:e.mtime}],0)}
    else await dialog({title:e.name,html:`<pre class="pv">${esc(r.text.slice(0,20000))}</pre>`,ok:'Cerrar',cancel:false});
  }catch(er){fail(er)}
}

/* --- TXT --- */
function vTxt(v){
  if(S.ed)return vEditor(v);
  const rt=S.rec.filter(r=>kind(r)==='text').slice(0,5),tx=S.txts||[];
  S.items=rt.concat(tx);
  v.innerHTML=`<div class="card zhead"><div class="thumb">${ico('text','k-text')}</div><div style="flex:1"><div class="nm">EDITOR DE TEXTO</div><div class="sub">Visor, editor y creador de archivos .txt</div></div></div>
  <div class="btns" style="margin-bottom:6px"><button class="btn solid" data-t="new">${ico('plus')} Nuevo TXT</button><button class="btn vio" data-t="find">${ico('refresh')} Buscar</button></div>
  ${rt.length?`<div class="stitle">Recientes</div><div class="list">${rt.map((it,i)=>rowHtml(it,i,{path:1})).join('')}</div>`:''}
  <div class="stitle">Archivos de texto</div>${S.txts===null?'<div class="empty">ESCANEANDO…</div>':(tx.length?`<div class="list">${tx.map((it,i)=>rowHtml(it,i+rt.length,{path:1})).join('')}</div>`:'<div class="empty">SIN ARCHIVOS</div>')}`;
  v.dataset.list='items';
}
function vEditor(v){
  const e=S.ed;
  v.innerHTML=`<div class="edwrap"><div class="edbar" style="padding-top:calc(var(--sat) + 6px)"><button class="ib" data-e="back">${ico('back')}</button><span class="nm">${esc(e.name)}</span>${e.dirty?'<span class="dot"></span>':''}<span class="sp"></span>
   <button class="ib" data-e="undo">${ico('undo')}</button><button class="ib" data-e="find">${ico('search')}</button><button class="ib" data-e="wrap">${ico('wrap')}</button><button class="ib" data-e="fm">${ico('minus')}</button><button class="ib" data-e="fp">${ico('plus')}</button><button class="ib" data-e="save" style="color:var(--ok)">${ico('save')}</button></div>
   <div class="edmain"><div class="gut" id="gut"></div><textarea class="ta ${e.wrap?'':'nowrap'}" id="ta" spellcheck="false" autocapitalize="off" autocorrect="off" style="font-size:${e.fs}px"></textarea></div>
   <div class="edst"><span id="stL"></span><span id="stC"></span><span id="stP">${esc(e.path||'(sin guardar)')}</span></div></div>`;
  const ta=$('#ta');ta.value=e.text;
  const upd=()=>{e.text=ta.value;const n=ta.value.split('\n').length;let g='';for(let i=1;i<=n;i++)g+=i+'\n';const gt=$('#gut');gt.textContent=g;gt.scrollTop=ta.scrollTop;gt.style.fontSize=e.fs+'px';
    const pos=ta.value.slice(0,ta.selectionStart).split('\n');$('#stL').textContent=`LÍN ${pos.length}:${pos[pos.length-1].length+1}`;$('#stC').textContent=`${n} líneas · ${ta.value.length} car.`;
    const d=ta.value!==e.orig;if(d!==e.dirty){e.dirty=d;const dot=$('.edbar .dot');if(d&&!dot)$('.edbar .nm').insertAdjacentHTML('afterend','<span class="dot"></span>');else if(!d&&dot)dot.remove()}};
  ta.oninput=upd;ta.onkeyup=upd;ta.onclick=upd;ta.onscroll=()=>{$('#gut').scrollTop=ta.scrollTop};upd();v.dataset.list='';
}
async function openEditor(path,startDir){
  if(path){
    try{const r=await api('readText',{path});S.ed={path,name:bn(path),text:r.text,orig:r.text,dirty:false,wrap:true,fs:13};pushRecent({name:bn(path),path,dir:false,size:r.size,mtime:Date.now()})}catch(e){return fail(e)}
  }else S.ed={path:null,dir:startDir||S.path||root(),name:'nuevo.txt',text:'',orig:'',dirty:false,wrap:true,fs:13};
  S.sec='txt';S.sel.clear();layerClose();closeDrawer();render();$('#view').scrollTop=0;
}
async function saveEditor(){
  const e=S.ed;if(!e)return;
  try{
    if(!e.path){const n=await dialog({title:'Guardar como',msg:'Carpeta: '+e.dir,input:e.name,ok:'Guardar',selname:1});if(!n)return;
      const name=/\.[a-z0-9]+$/i.test(n)?n:n+'.txt';await api('newFile',{path:e.dir,name,content:e.text});e.path=e.dir+'/'+name;e.name=name;pushRecent({name,path:e.path,dir:false,size:e.text.length,mtime:Date.now()})}
    else await api('writeText',{path:e.path,text:e.text});
    e.orig=e.text;e.dirty=false;S.txts=null;toast('✔ Guardado');render();
  }catch(er){fail(er)}
}
async function closeEditor(){
  const e=S.ed;if(!e)return;
  if(e.dirty){const r=await dialog({title:'Cambios sin guardar',msg:'¿Descartar los cambios de '+e.name+'?',ok:'Descartar',danger:true});if(!r)return}
  S.ed=null;render();
}

/* --- Ajustes / Acerca --- */
function vSettings(v){
  v.innerHTML=`<div class="stitle">Preferencias</div><div class="card">
   <div class="sw"><div>Mostrar archivos ocultos<small>Archivos y carpetas que empiezan por «.»</small></div><div class="tg ${S.hidden?'on':''}" data-set="hidden"></div></div>
   <div class="sw"><div>Vista por defecto</div><div class="seg"><button data-set="view:list" class="${S.view==='list'?'on':''}">Lista</button><button data-set="view:grid" class="${S.view==='grid'?'on':''}">Cuadrícula</button></div></div>
   <div class="sw"><div>Ordenar por</div><div class="seg">${[['name','Nombre'],['date','Fecha'],['size','Tamaño'],['type','Tipo']].map(s=>`<button data-set="sort:${s[0]}" class="${S.sort===s[0]?'on':''}">${s[1]}</button>`).join('')}</div></div>
   <div class="sw"><div>Orden ascendente</div><div class="tg ${S.asc?'on':''}" data-set="asc"></div></div></div>
  <div class="stitle">Permisos de almacenamiento</div><div class="card" style="padding:6px 14px">${permRows()}<div style="padding:8px 0 10px"><button class="btn solid" data-h="perm">${S.perm.all?'Revisar permisos':'Conceder acceso total'}</button></div></div>
  <div class="stitle">Datos</div><div class="btns"><button class="btn" data-set="clrrec">Borrar recientes</button><button class="btn" data-set="clrfav">Borrar favoritos</button></div>`;
  v.dataset.list='';
}
function vAbout(v){
  v.innerHTML=`<div class="card about"><div class="logo">W</div><h2 style="letter-spacing:.2em">W FILE MANAGER</h2><p style="font-family:var(--mono);color:var(--cyan);margin:6px 0 12px">v1.0.0 · WebView Offline</p>
   <p>Administrador de archivos con interfaz corporativa de alta tecnología.<br>Explorador · Visor/Extractor ZIP · Editor TXT · Visor de imágenes.<br><br>Kotlin + WebView · HTML · CSS · JS<br>100% offline, sin conexión a internet.</p></div>`;v.dataset.list='';
}
function renderDrawer(){
  const nv=S.sec==='cat'&&S.cat.type==='image'?'images':S.sec;
  $('#drawer').innerHTML=`<div class="dh"><div class="logo">W</div><div><b>W FILE MANAGER</b><small>CORPORATE · v1.0</small></div></div>
  <div class="dgrp">Secciones</div>${SECS.slice(0,5).map(s=>`<button class="ditem ${nv===s.id?'on':''}" data-d="${s.id}">${ico(s.i)}<span>${s.t}</span></button>`).join('')}
  <div class="dgrp">Categorías</div>${CATS.map(c=>`<button class="ditem" data-dc="${c.t}">${ico(c.i)}<span>${c.n}</span></button>`).join('')}
  <div class="dgrp">Biblioteca</div>${SECS.slice(5,7).map(s=>`<button class="ditem ${nv===s.id?'on':''}" data-d="${s.id}">${ico(s.i)}<span>${s.t}</span></button>`).join('')}
  <div class="dgrp">Almacenamiento</div>${S.roots.map((r,i)=>`<button class="ditem" data-dr="${i}">${ico('hdd')}<span>${esc(r.name)}</span></button>`).join('')}
  <div class="dgrp">Sistema</div>${SECS.slice(7).map(s=>`<button class="ditem ${nv===s.id?'on':''}" data-d="${s.id}">${ico(s.i)}<span>${s.t}</span></button>`).join('')}`;
}

/* ================= Acciones sobre archivos ================= */
function pushRecent(it){S.rec=[Object.assign({},it,{count:0}),...S.rec.filter(r=>r.path!==it.path)].slice(0,30);store.set('rec',S.rec)}
function toggleFav(p){S.favs=S.favs.includes(p)?S.favs.filter(x=>x!==p):[p,...S.favs];store.set('favs',S.favs)}
const curItems=()=>S.items;
async function openItem(it,list){
  const k=kind(it);
  if(it.dir){return openPath(it.path)}
  pushRecent(it);
  if(k==='image'){const imgs=list.filter(x=>kind(x)==='image');return openViewer(imgs,imgs.findIndex(x=>x.path===it.path))}
  if(k==='video'||k==='audio')return openMedia(it,k,list);
  if(k==='zip'&&ex(it.name)!=='apk'&&['zip','jar'].includes(ex(it.name)))return openZip(it.path);
  if(k==='text')return openEditor(it.path);
  try{await api('open',{path:it.path})}catch(e){fail(e)}
}
function itemMenu(it){
  const k=kind(it),fav=S.favs.includes(it.path),a=[];
  if(!it.dir)a.push({i:'ext',t:'Abrir con…',f:()=>api('open',{path:it.path}).catch(fail)});
  if(k==='text')a.push({i:'edit',t:'Editar texto',f:()=>openEditor(it.path)});
  if(k==='zip'&&['zip','jar'].includes(ex(it.name))){a.push({i:'zip',t:'Ver contenido ZIP',f:()=>openZip(it.path)});a.push({i:'download',t:'Extraer aquí',f:async()=>{try{const b=dn(it.path),n=await api('zipExtract',{path:it.path,dest:b+'/'+it.name.replace(/\.[^.]+$/,'')});toast('✔ '+n+' archivo(s) extraídos');refreshAll()}catch(e){fail(e)}}})}
  a.push({i:'copy',t:'Copiar',f:()=>setClip('copy',[it.path])},{i:'cut',t:'Mover',f:()=>setClip('move',[it.path])},
   {i:'edit',t:'Renombrar',f:()=>doRename(it)},{i:'zip',t:'Comprimir en ZIP',f:()=>doZip([it.path])});
  if(!it.dir)a.push({i:'share',t:'Compartir',f:()=>api('share',{paths:[it.path]}).catch(fail)});
  a.push({i:'star',t:fav?'Quitar de favoritos':'Añadir a favoritos',f:()=>{toggleFav(it.path);render()}},{i:'info',t:'Propiedades',f:()=>doProps(it)},{i:'trash',t:'Eliminar',d:1,f:()=>doDelete([it.path])});
  sheet(it.name,a);
}
function setClip(mode,paths){S.clip={mode,paths};S.sel.clear();if(S.sec!=='files'&&S.path==null)S.path=root();toast(mode==='copy'?'Copiado — abre una carpeta y pulsa Pegar':'Listo para mover — abre una carpeta y pulsa Pegar');render()}
async function doPaste(){
  if(!S.clip)return;
  try{const n=await api(S.clip.mode==='copy'?'copy':'move',{paths:S.clip.paths,dest:S.path});toast(`✔ ${n} elemento(s)`);if(S.clip.mode==='move')S.clip=null;refreshAll()}catch(e){fail(e)}
}
async function doRename(it){
  const n=await dialog({title:'Renombrar',input:it.name,ok:'Renombrar',selname:!it.dir});if(!n||n===it.name)return;
  try{const np=await api('rename',{path:it.path,name:n});S.favs=S.favs.map(f=>f===it.path?np:f);store.set('favs',S.favs);S.sel.clear();refreshAll()}catch(e){fail(e)}
}
async function doDelete(paths){
  const ok=await dialog({title:'Eliminar',msg:paths.length===1?`¿Eliminar «${bn(paths[0])}» definitivamente?`:`¿Eliminar ${paths.length} elementos definitivamente?`,ok:'Eliminar',danger:true});if(!ok)return;
  try{await api('delete',{paths});S.favs=S.favs.filter(f=>!paths.includes(f));S.rec=S.rec.filter(f=>!paths.includes(f.path));store.set('favs',S.favs);store.set('rec',S.rec);S.sel.clear();toast('✔ Eliminado');refreshAll()}catch(e){fail(e)}
}
async function doZip(paths){
  const def=paths.length===1?bn(paths[0]).replace(/\.[^.]+$/,'')||bn(paths[0]):'archivo';
  const n=await dialog({title:'Crear ZIP',input:def+'.zip',ok:'Comprimir'});if(!n)return;
  try{const out=await api('zipCreate',{paths,dest:dn(paths[0]),name:n});S.sel.clear();toast('✔ Creado '+bn(out));refreshAll()}catch(e){fail(e)}
}
async function doProps(it){
  try{const s=await api('stat',{path:it.path});
   await dialog({title:'Propiedades',html:`<dl class="kv"><dt>Nombre</dt><dd>${esc(s.name)}</dd><dt>Ruta</dt><dd>${esc(s.path)}</dd><dt>Tipo</dt><dd>${esc(s.mime)}</dd><dt>Tamaño</dt><dd>${fsz(s.size)}${s.dir?` (${s.files} archivos, ${s.folders} carpetas)`:''}</dd>
   <dt>Modificado</dt><dd>${fdt(s.mtime)}</dd><dt>Permisos</dt><dd>${s.readable?'Lectura ':''}${s.writable?'Escritura':''}</dd></dl>`,ok:'Cerrar',cancel:false})}catch(e){fail(e)}
}
async function newFolder(){const n=await dialog({title:'Nueva carpeta',input:'Nueva carpeta',ok:'Crear'});if(!n)return;try{await api('mkdir',{path:S.path,name:n});refreshAll()}catch(e){fail(e)}}
async function doSearch(){
  const q=await dialog({title:'Buscar archivos',msg:S.sec==='files'?'En: '+S.path:'En todo el almacenamiento',input:'',ok:'Buscar'});if(!q||!q.trim())return;
  S.q=q.trim();S.searchRoot=S.sec==='files'&&S.path?S.path:root();S.mode='search';S.sec='files';S.reload=loadDir;S.sel.clear();loadDir();render();
}
function selectedItems(){return S.items.filter(i=>S.sel.has(i.path))}
function ctxMenu(){
  const a=[{i:'refresh',t:'Actualizar',f:refreshAll}];
  if(S.sec==='files'&&S.mode==='dir'){a.push({i:'plusf',t:'Nueva carpeta',f:newFolder},{i:'text',t:'Nuevo archivo TXT',f:()=>openEditor(null,S.path)});}
  if(S.sec==='files'||S.sec==='cat')a.push({i:'sel',t:'Seleccionar todo',f:()=>{S.items.forEach(i=>S.sel.add(i.path));render()}});
  if(S.sec==='files'||S.sec==='cat')a.push({i:'sort',t:'Ordenar: '+({name:'Nombre',date:'Fecha',size:'Tamaño',type:'Tipo'}[S.sort])+(S.asc?' ↑':' ↓'),f:sortMenu});
  a.push({i:'eye',t:(S.hidden?'Ocultar':'Mostrar')+' archivos ocultos',f:()=>{S.hidden=!S.hidden;store.set('hidden',S.hidden);refreshAll()}});
  a.push({i:'settings',t:'Ajustes',f:()=>go('settings')});
  menuPop(a);
}
function sortMenu(){sheet('Ordenar por',[['name','Nombre'],['date','Fecha'],['size','Tamaño'],['type','Tipo']].map(s=>({i:'sort',t:s[1]+(S.sort===s[0]?(S.asc?'  ↑':'  ↓'):''),f:()=>{if(S.sort===s[0])S.asc=!S.asc;else{S.sort=s[0];S.asc=true}store.set('sort',S.sort);store.set('asc',S.asc);refreshAll()}})))}

/* ================= Reproductor multimedia integrado ================= */
let audioQueue=[],audioQueueIndex=0;
function openMedia(it,type,list=[]){
  if(type==='video'){api('playVideo',{path:it.path}).catch(fail);return}
  audioQueue=(Array.isArray(list)?list:[]).filter(x=>!x.dir&&kind(x)==='audio');
  if(!audioQueue.some(x=>x.path===it.path))audioQueue.unshift(it);
  audioQueueIndex=Math.max(0,audioQueue.findIndex(x=>x.path===it.path));
  const el=$('#viewer'),video=false,src=furl(it.path);
  el.hidden=false;el.classList.remove('hide-ui');
  el.innerHTML=`<div class="vtop"><button class="ib" data-media="close">${ico('back')}</button><span class="nm">${esc(it.name)}</span><button class="ib" data-media="external">${ico('ext')}</button></div>
    <div class="media-stage ${video?'video-stage':'audio-stage'}">
      ${video?`<video id="media-element" controls playsinline preload="metadata"><source src="${src}" type="${({mp4:'video/mp4',m4v:'video/mp4',webm:'video/webm','3gp':'video/3gpp',mov:'video/quicktime',mkv:'video/x-matroska',avi:'video/x-msvideo',wmv:'video/x-ms-wmv',flv:'video/x-flv'}[ex(it.name)]||'video/mp4')}"></video>`:
      `<div class="audio-art">${ico('music')}</div><div class="audio-name">${esc(it.name)}</div><audio id="media-element" controls preload="metadata"><source src="${src}" type="${({mp3:'audio/mpeg',m4a:'audio/mp4',aac:'audio/aac',ogg:'audio/ogg',opus:'audio/ogg',wav:'audio/wav',flac:'audio/flac',amr:'audio/amr',wma:'audio/x-ms-wma'}[ex(it.name)]||'application/octet-stream')}"></audio>`}
      <p id="media-error" class="media-error" hidden>No se pudo reproducir este formato en el reproductor integrado. Puedes abrirlo con otra aplicación.</p>
    </div>`;
  const media=$('#media-element'),err=$('#media-error');
  const notify=playing=>{try{if(window.WBridge&&WBridge.mediaNotification)WBridge.mediaNotification(it.name,!!playing,media.duration&&isFinite(media.duration)?Math.round(media.duration*1000):0,media.currentTime?Math.round(media.currentTime*1000):0)}catch(_){}};
  media.addEventListener('error',()=>{err.hidden=false;notify(false)});
  media.addEventListener('loadedmetadata',()=>{err.hidden=true;notify(!media.paused)});
  media.addEventListener('play',()=>notify(true));
  media.addEventListener('pause',()=>notify(false));
  media.addEventListener('ended',()=>{notify(false);if(audioQueue.length>1)playQueueTrack(1);else try{if(window.WBridge)WBridge.dismissMediaNotification()}catch(_){}});
  media.addEventListener('timeupdate',()=>{if(Math.floor(media.currentTime)%5===0)notify(!media.paused)});
  media.play().catch(()=>{});
  el.querySelector('[data-media="close"]').onclick=closeViewer;
  el.querySelector('[data-media="external"]').onclick=()=>api('open',{path:it.path}).catch(fail);
}
/* ================= Visor de imágenes ================= */
const V={list:[],i:0,s:1,x:0,y:0,ui:true};
function openViewer(list,i){V.list=list;V.i=Math.max(0,i);V.s=1;V.x=0;V.y=0;V.ui=true;const el=$('#viewer');el.hidden=false;el.classList.remove('hide-ui');drawViewer()}
function closeViewer(){$('#viewer').hidden=true;$('#viewer').innerHTML=''}
function playQueueTrack(delta){
  if(!audioQueue.length)return;
  audioQueueIndex=(audioQueueIndex+delta+audioQueue.length)%audioQueue.length;
  openMedia(audioQueue[audioQueueIndex],'audio',audioQueue);
}
function vSrc(it){return it.src||furl(it.path)}
function drawViewer(){
  const it=V.list[V.i],el=$('#viewer');
  el.innerHTML=`<div class="vtop"><button class="ib" data-v="close">${ico('back')}</button><span class="nm">${esc(it.name)}</span><button class="ib" data-v="info">${ico('info')}</button></div>
  <div class="vstage" id="vst"><img id="vimg" src="${vSrc(it)}" alt="" draggable="false"></div>
  ${V.list.length>1?`<button class="vnav l" data-v="prev">${ico('back')}</button><button class="vnav r" data-v="next" style="transform:scaleX(-1)">${ico('back')}</button>`:''}
  <div class="vbot"><button class="ib" data-v="zin">${ico('zoomin')}</button><span class="vcnt">${V.i+1} / ${V.list.length}</span>${it.path?`<button class="ib" data-v="share">${ico('share')}</button><button class="ib" data-v="open">${ico('ext')}</button><button class="ib" data-v="del" style="color:var(--danger)">${ico('trash')}</button>`:''}</div>`;
  applyV();bindV();
}
function applyV(){const im=$('#vimg');if(im)im.style.transform=`translate(${V.x}px,${V.y}px) scale(${V.s})`}
function vStep(d){const n=V.list.length;V.i=(V.i+d+n)%n;V.s=1;V.x=0;V.y=0;drawViewer()}
function bindV(){
  const st=$('#vst'),im=$('#vimg');let t0=null,pd=0,ps=1,last=0,sx=0,sy=0,ox=0,oy=0,moved=false;
  const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  st.addEventListener('touchstart',e=>{moved=false;if(e.touches.length===2){pd=dist(e.touches);ps=V.s}else{sx=e.touches[0].clientX;sy=e.touches[0].clientY;ox=V.x;oy=V.y;t0=Date.now()}},{passive:true});
  st.addEventListener('touchmove',e=>{moved=true;if(e.touches.length===2){V.s=Math.min(6,Math.max(1,ps*dist(e.touches)/pd));applyV()}
    else{const dx=e.touches[0].clientX-sx,dy=e.touches[0].clientY-sy;if(V.s>1){V.x=ox+dx;V.y=oy+dy}else{V.x=dx;V.y=0}applyV()}},{passive:true});
  st.addEventListener('touchend',e=>{
    if(!moved){const n=Date.now();if(n-last<280){V.s=V.s>1?1:2.5;V.x=0;V.y=0;applyV()}else{$('#viewer').classList.toggle('hide-ui')}last=n;return}
    if(V.s<=1.02){V.s=1;if(Math.abs(V.x)>70&&V.list.length>1){vStep(V.x<0?1:-1);return}V.x=0;V.y=0;applyV()}});
  st.addEventListener('wheel',e=>{e.preventDefault();V.s=Math.min(6,Math.max(1,V.s*(e.deltaY<0?1.15:.87)));if(V.s===1){V.x=0;V.y=0}applyV()},{passive:false});
  let md=null;st.addEventListener('mousedown',e=>{md={x:e.clientX,y:e.clientY,ox:V.x,oy:V.y,m:false}});
  window.addEventListener('mousemove',e=>{if(md&&V.s>1){V.x=md.ox+e.clientX-md.x;V.y=md.oy+e.clientY-md.y;md.m=true;applyV()}});
  window.addEventListener('mouseup',()=>{md=null});
  st.addEventListener('dblclick',()=>{V.s=V.s>1?1:2.5;V.x=0;V.y=0;applyV()});
}
$('#viewer').addEventListener('click',async e=>{
  const b=e.target.closest('[data-v]');if(!b)return;const a=b.dataset.v,it=V.list[V.i];
  if(a==='close')closeViewer();else if(a==='prev')vStep(-1);else if(a==='next')vStep(1);
  else if(a==='zin'){V.s=V.s>=4?1:V.s*1.8;if(V.s===1){V.x=0;V.y=0}applyV()}
  else if(a==='share')api('share',{paths:[it.path]}).catch(fail);
  else if(a==='open')api('open',{path:it.path}).catch(fail);
  else if(a==='info'){it.path?doProps(it):dialog({title:'Imagen',html:`<dl class="kv"><dt>Nombre</dt><dd>${esc(it.name)}</dd><dt>Tamaño</dt><dd>${fsz(it.size)}</dd></dl>`,ok:'Cerrar',cancel:false})}
  else if(a==='del'){const ok=await dialog({title:'Eliminar imagen',msg:'¿Eliminar «'+it.name+'»?',ok:'Eliminar',danger:true});if(ok){try{await api('delete',{paths:[it.path]});V.list.splice(V.i,1);S.items=S.items.filter(x=>x.path!==it.path);if(!V.list.length){closeViewer();refreshAll()}else{V.i=Math.min(V.i,V.list.length-1);drawViewer();refreshAll()}}catch(er){fail(er)}}}
});

/* ================= Permisos ================= */
async function refreshPerm(){
  try{S.perm=await api('perm')}catch(e){S.perm={all:false}}
  const g=$('#gate');
  if(!S.perm.all){
    g.hidden=false;
    g.innerHTML=`<div class="card gcard"><div class="logo" style="width:46px;height:46px;font-size:22px;margin:0">W</div><h2>Acceso requerido</h2><p>W FILE MANAGER necesita acceso total a los archivos para explorar, editar y administrar todo el almacenamiento interno del dispositivo.</p>${permRows()}
    <div class="btns" style="margin-top:14px"><button class="btn solid" data-g="grant">Conceder acceso total</button><button class="btn" data-g="skip">Más tarde</button></div></div>`;
  }else g.hidden=true;
  return S.perm;
}

/* ================= Eventos ================= */
let lpT=null,lpFired=false;
const view=$('#view');
function itemFromEl(el){const r=el.closest('[data-i]');if(!r)return null;const i=+r.dataset.i;const src=view.dataset.list==='rec'?S.rec:(view.dataset.list==='txt'?S.items:S.items);return {it:src[i],i,src}}
view.addEventListener('pointerdown',e=>{
  const r=e.target.closest('[data-i]');
  if(!r||e.target.closest('[data-m]')||view.dataset.list!=='items')return;
  lpFired=false;
  clearTimeout(lpT);
  lpT=setTimeout(()=>{
    const x=itemFromEl(r);
    if(!x||!x.it)return;
    lpFired=true;
    itemMenu(x.it);
    if(navigator.vibrate)navigator.vibrate(18);
  },480);
});
['pointerup','pointercancel','pointerleave'].forEach(t=>view.addEventListener(t,()=>clearTimeout(lpT)));
view.addEventListener('scroll',()=>clearTimeout(lpT),{passive:true});
view.addEventListener('contextmenu',e=>{
  const r=e.target.closest('[data-i]');
  if(!r)return;
  e.preventDefault();
  if(!lpFired){
    const x=itemFromEl(r);
    if(x&&x.it)itemMenu(x.it);
  }
});

view.addEventListener('click',async e=>{
  const t=e.target;
  if(lpFired){lpFired=false;return}
  let b;
  if(b=t.closest('[data-m]')){const x=itemFromEl(b);const src=view.dataset.list==='rec'?S.rec:S.items;return itemMenu(src[+b.dataset.m])}
  if(b=t.closest('[data-bc]'))return openPath(b.dataset.bc);
  if(b=t.closest('[data-sx]')){S.mode='dir';S.reload=loadDir;loadDir();return render()}
  if(b=t.closest('[data-h]')){const h=b.dataset.h;
    if(h.startsWith('cat:')){const ty=h.slice(4);return openCat(ty,{image:'Imágenes',video:'Videos',audio:'Audio',doc:'Documentos',apk:'APK'}[ty],ty==='image')}
    if(h.startsWith('go:'))return go(h.slice(3));
    if(h.startsWith('dir:')){const p=root()+'/'+h.slice(4);return openPath(p)}
    if(h==='newtxt')return openEditor(null,root()+'/Documents');
    if(h==='perm'){await api('reqPerm');return setTimeout(async()=>{await refreshPerm();render()},600)}return}
  if(b=t.closest('[data-r]')){return openPath(S.roots[+b.dataset.r].path)}
  if(b=t.closest('[data-f]')){const p=S.favs[+b.dataset.f];return openFav(p)}
  if(b=t.closest('[data-z]')){const a=b.dataset.z;
    if(a==='find'){S.zips=null;render();return loadZips()}
    if(a==='make'){toast('Selecciona archivos en el Explorador y pulsa el icono ZIP');return go('files')}
    if(a==='close'){S.zip=null;return render()}
    if(a==='ext')return zipExtract(null);
    if(a==='extsel'&&S.zip.sel.size)return zipExtract([...S.zip.sel]);return}
  if(b=t.closest('[data-zb]')){S.zip.cwd=b.dataset.zb;return render()}
  if(b=t.closest('[data-zck]')){const e2=S.zip.list[+b.dataset.zck];S.zip.sel.has(e2.full)?S.zip.sel.delete(e2.full):S.zip.sel.add(e2.full);return render()}
  if(b=t.closest('[data-zi]')){const e2=S.zip.list[+b.dataset.zi];if(e2.dir){S.zip.cwd=e2.full;return render()}if(ex(e2.name)==='apk')return zipInstallApk(e2);return zipPreview(e2)}
  if(b=t.closest('[data-t]')){const a=b.dataset.t;if(a==='new')return openEditor(null,root()+'/Documents');if(a==='find'){S.txts=null;render();return loadTxts()}return}
  if(b=t.closest('[data-e]')){const a=b.dataset.e,ta=$('#ta');
    if(a==='back')return closeEditor();if(a==='save')return saveEditor();
    if(a==='undo'){ta.focus();document.execCommand('undo');return ta.dispatchEvent(new Event('input'))}
    if(a==='wrap'){S.ed.wrap=!S.ed.wrap;ta.classList.toggle('nowrap',!S.ed.wrap);return}
    if(a==='fm'||a==='fp'){S.ed.fs=Math.max(9,Math.min(26,S.ed.fs+(a==='fp'?1:-1)));ta.style.fontSize=S.ed.fs+'px';$('#gut').style.fontSize=S.ed.fs+'px';return}
    if(a==='find'){const q=await dialog({title:'Buscar en el texto',input:S.ed.lastQ||'',ok:'Buscar'});if(!q)return;S.ed.lastQ=q;
      let from=ta.selectionEnd,i=ta.value.toLowerCase().indexOf(q.toLowerCase(),from);if(i<0)i=ta.value.toLowerCase().indexOf(q.toLowerCase());
      if(i<0)return toast('Sin resultados',true);ta.focus();ta.setSelectionRange(i,i+q.length);
      const ln=ta.value.slice(0,i).split('\n').length;ta.scrollTop=Math.max(0,(ln-3)*S.ed.fs*1.55);return}return}
  if(b=t.closest('[data-set]')){const s=b.dataset.set;
    if(s==='hidden'){S.hidden=!S.hidden;store.set('hidden',S.hidden)}
    else if(s==='asc'){S.asc=!S.asc;store.set('asc',S.asc)}
    else if(s.startsWith('view:')){S.view=s.slice(5);store.set('view',S.view)}
    else if(s.startsWith('sort:')){S.sort=s.slice(5);store.set('sort',S.sort)}
    else if(s==='clrrec'){S.rec=[];store.set('rec',[]);toast('Recientes borrados')}
    else if(s==='clrfav'){S.favs=[];store.set('favs',[]);toast('Favoritos borrados')}
    return render()}
  const x=itemFromEl(t);
  if(x&&x.it){
    if(S.sel.size){const p=x.it.path;S.sel.has(p)?S.sel.delete(p):S.sel.add(p);return render()}
    if(S.sec==='favs')return openFav(x.it.path);
    return openItem(x.it,x.src);
  }
});
async function openFav(p){
  try{const s=await api('stat',{path:p});const it={name:s.name,path:p,dir:s.dir,size:s.size,mtime:s.mtime,count:0};if(it.dir)openPath(p);else openItem(it,[it])}catch(e){fail(e)}
}
$('#bMenu').onclick=openDrawer;$('#scrim').onclick=closeDrawer;
$('#bSearch').onclick=doSearch;$('#bMore').onclick=ctxMenu;
$('#bView').onclick=()=>{if(S.sec==='cat'){S.cat.grid=!S.cat.grid;return render()}S.view=S.view==='list'?'grid':'list';store.set('view',S.view);render()};
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;if(S.sec==='txt'&&b.dataset.n==='txt'&&S.ed)return;go(b.dataset.n)});
$('#drawer').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.d)return go(b.dataset.d);
  if(b.dataset.dc){const t=b.dataset.dc,c=CATS.find(c=>c.t===t);return openCat(t,c.n,false)}
  if(b.dataset.dr!==undefined)return openPath(S.roots[+b.dataset.dr].path);
});
$('#selbar').addEventListener('click',async e=>{
  const b=e.target.closest('[data-s]');if(!b)return;const a=b.dataset.s,paths=[...S.sel];
  if(a==='clr'){S.sel.clear();return render()}
  if(a==='all'){S.items.forEach(i=>S.sel.add(i.path));return render()}
  if(a==='copy')return setClip('copy',paths);if(a==='cut')return setClip('move',paths);
  if(a==='del')return doDelete(paths);if(a==='zip')return doZip(paths);
  if(a==='share')return api('share',{paths}).then(()=>{}).catch(fail);
});
$('#clipbar').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;if(b.dataset.c==='paste')doPaste();else{S.clip=null;render()}});
$('#gate').addEventListener('click',async e=>{
  const b=e.target.closest('[data-g]');if(!b)return;
  if(b.dataset.g==='skip'){$('#gate').hidden=true;return}
  await api('reqPerm');setTimeout(async()=>{await refreshPerm();render();refreshAll()},500);
});

/* ================= API pública para Kotlin ================= */
window.WFM={
  openExternalZip(path){openZip(path);},
  back(){
    if(!$('#viewer').hidden){closeViewer();return true}
    if(layerOpen()){layerClose();return true}
    if($('#drawer').classList.contains('open')){closeDrawer();return true}
    if(!$('#gate').hidden){return false}
    if(S.sel.size){S.sel.clear();render();return true}
    if(S.sec==='txt'&&S.ed){closeEditor();return true}
    if(S.sec==='zip'&&S.zip){if(S.zip.cwd){S.zip.cwd=S.zip.cwd.replace(/[^/]+\/$/,'');render()}else{S.zip=null;render()}return true}
    if(S.sec==='files'){
      if(S.mode==='search'){S.mode='dir';S.reload=loadDir;loadDir();render();return true}
      if(S.path&&S.path!==rootOf(S.path)){S.path=dn(S.path);loadDir();render();return true}
    }
    if(S.sec!=='home'){go('home');return true}
    return false;
  },
  async onResume(){await refreshPerm();if(S.perm.all){if(S.sec==='home')loadHome();else if(S.reload)S.reload()}},
  mediaCommand(command){
    const media=$('#media-element');
    if(command==='close'){
      closeViewer();
      try{if(window.WBridge&&WBridge.dismissMediaNotification)WBridge.dismissMediaNotification()}catch(_){}
      audioQueue=[];audioQueueIndex=0;
      return;
    }
    if(command==='next'){playQueueTrack(1);return}
    if(command==='previous'){playQueueTrack(-1);return}
    if(!media)return;
    if(command==='pause')media.pause();
    else if(command==='play')media.play().catch(()=>{});
  },
};

/* ================= Arranque ================= */
(async function init(){
  render();
  try{S.roots=await api('roots')}catch(e){}
  await refreshPerm();
  render();
})();
})();
