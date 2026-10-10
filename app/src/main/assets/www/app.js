(() => {
  const drawer=document.getElementById("drawer");
  const menu=document.getElementById("menu-button");
  const status=document.getElementById("native-status");
  const themeButton=document.getElementById("theme-button");
  const labels={home:"Inicio",internal:"Almacenamiento interno",sd:"Tarjeta SD",favorites:"Destacados",safe:"Carpeta segura",documents:"Documentos",images:"Imágenes",audio:"Audio",archives:"Archivos ZIP"};
  function closeDrawer(){drawer.hidden=true;menu.setAttribute("aria-expanded","false");}
  menu.addEventListener("click",()=>{const open=drawer.hidden;drawer.hidden=!open;menu.setAttribute("aria-expanded",String(open));});
  themeButton.addEventListener("click",()=>{document.body.classList.toggle("light");const light=document.body.classList.contains("light");themeButton.setAttribute("aria-pressed",String(light));try{localStorage.setItem("wfm-theme",light?"light":"dark");}catch(_){}closeDrawer();});
  try{if(localStorage.getItem("wfm-theme")==="light")document.body.classList.add("light");}catch(_){}
  const fileList=document.getElementById("file-list");
  const filePanel=document.getElementById("file-panel");
  const searchInput=document.getElementById("file-search");
  const pathLabel=document.getElementById("current-path");
  const sortSelect=document.getElementById("sort-select");
  let allItems=[];let activeFilter="all";let sortKey="name";let viewMode="list";let editorDocId=null;
  function renderFiles(payload){filePanel.hidden=false;fileList.replaceChildren();if(payload.error){status.textContent=payload.error;return;}allItems=Array.isArray(payload.items)?payload.items:[];updateHomeStats(allItems);pathLabel.textContent=payload.pathDepth?"Subcarpeta · "+payload.pathDepth+" nivel(es)":"Carpeta inicial";document.getElementById("go-up").disabled=!payload.canGoUp;drawFilteredFiles();}
  function sortItems(items){return items.slice().sort((a,b)=>{if(a.directory!==b.directory)return Number(b.directory)-Number(a.directory);if(sortKey==="size")return (b.size||0)-(a.size||0);if(sortKey==="modified")return (b.modified||0)-(a.modified||0);return a.name.localeCompare(b.name,undefined,{sensitivity:"base"});});}
  function drawFilteredFiles(){
    fileList.replaceChildren();fileList.classList.toggle("grid",viewMode==="grid");
    const query=(searchInput.value||"").trim().toLocaleLowerCase();
    const items=sortItems(allItems.filter(item=>{const mime=(item.mimeType||"").toLowerCase(),name=(item.name||"").toLowerCase();const queryMatch=name.includes(query);const filterMatch=activeFilter==="all"||(activeFilter==="documents"&&(mime.includes("pdf")||mime.startsWith("text/")||/\.(docx?|xlsx?|pptx?)$/i.test(name)))||(activeFilter==="images"&&mime.startsWith("image/"))||(activeFilter==="audio"&&(mime.startsWith("audio/")||mime.startsWith("video/")))||(activeFilter==="archives"&&(mime.includes("zip")||/\.(zip|rar|7z|tar|gz)$/i.test(name)));return queryMatch&&filterMatch;}));
    if(!items.length){const empty=document.createElement("li");empty.className="empty-files";empty.textContent=allItems.length?"No hay coincidencias.":"Carpeta vacía.";fileList.append(empty);return;}
    for(const item of items){
      const li=document.createElement("li");li.className="file-row file-row-openable";li.tabIndex=0;
      const icon=document.createElement("span");icon.className="file-kind";icon.textContent=item.directory?"▱":(item.mimeType||"").startsWith("image/")?"▧":"▤";
      const details=document.createElement("span");details.className="file-details";
      const name=document.createElement("span");name.className="file-name";name.textContent=item.name;
      const meta=document.createElement("small");meta.textContent=item.directory?"Carpeta":(item.mimeType||"Archivo")+(Number.isFinite(item.size)?" · "+formatSize(item.size):"");
      details.append(name,meta);li.append(icon,details);
      const open=()=>{try{if(item.favorite){if(!window.WFileNative.openFavorite(item.id,item.treeUri))status.textContent="No se pudo abrir.";}else if(item.directory)renderFiles(JSON.parse(window.WFileNative.openDirectory(item.id)));else if(!window.WFileNative.openFile(item.id))status.textContent="Sin app para abrir.";}catch(_){status.textContent="Error al abrir.";}};
      li.addEventListener("click",open);
      if(!item.favorite){
        const actions=document.createElement("span");actions.className="file-actions";
        const addBtn=(label,aria,fn)=>{const b=document.createElement("button");b.className="action-btn";b.type="button";b.textContent=label;b.setAttribute("aria-label",aria);b.addEventListener("click",e=>{e.stopPropagation();fn();});actions.append(b);};
        addBtn("✎","Renombrar",()=>{const nn=prompt("Nuevo nombre:",item.name);if(nn&&nn!==item.name){const r=JSON.parse(window.WFileNative.renameDocument(item.id,nn));status.textContent=r.message||"";if(r.ok)refreshFiles();}});
        addBtn("⎘","Copiar",()=>{if(confirm("¿Copiar?")){const r=JSON.parse(window.WFileNative.copyDocument(item.id));status.textContent=r.message||"";if(r.ok)refreshFiles();}});
        const isText=/^text\//i.test(item.mimeType||"")||/\.(txt|md|json|xml|csv|log|kt|java|js|css|html|py|sh)$/i.test(item.name||"");
        if(isText) addBtn("Aa","Editar",()=>openTextEditor(item.id));
        if(!item.directory){
          addBtn("Z","ZIP",()=>{const zn=prompt("Nombre ZIP:",(item.name||"a").replace(/\.[^.]+$/,"")+".zip");if(!zn)return;const r=JSON.parse(window.WFileNative.createZip(item.id,zn));status.textContent=r.message||"";if(r.ok)refreshFiles();});
          addBtn("🔒","Cifrar",()=>{if(!window.WFileNative.isSecureUnlocked()){status.textContent="Desbloqueá la carpeta segura primero.";return;}if(!confirm("¿Cifrar? Se crea .wfm y se conserva original."))return;const r=JSON.parse(window.WFileNative.encryptDocument(item.id));status.textContent=r.message||"";if(r.ok)refreshFiles();});
          addBtn("🔓","Descifrar",()=>{if(!window.WFileNative.isSecureUnlocked()){status.textContent="Desbloqueá la carpeta segura primero.";return;}if(!confirm("¿Descifrar?"))return;const r=JSON.parse(window.WFileNative.decryptDocument(item.id));status.textContent=r.message||"";if(r.ok)refreshFiles();});
        }
        if(/\.zip$/i.test(item.name||"")||(item.mimeType||"").includes("zip")) addBtn("⇓","Extraer",()=>{if(!confirm("¿Extraer?"))return;const r=JSON.parse(window.WFileNative.extractZip(item.id));status.textContent=r.message||"";if(r.ok)refreshFiles();});
        addBtn("✕","Eliminar",()=>{if(confirm("¿Eliminar?")){const r=JSON.parse(window.WFileNative.deleteDocument(item.id));status.textContent=r.message||"";if(r.ok)refreshFiles();}});
        li.append(actions);
      }
      if(!item.directory&&!item.favorite){const star=document.createElement("button");star.className="favorite-toggle";star.type="button";star.textContent="☆";star.addEventListener("click",e=>{e.stopPropagation();const result=JSON.parse(window.WFileNative.toggleFavorite(item.id));status.textContent=result.message||"";star.textContent=result.favorite?"★":"☆";});li.append(star);}
      fileList.append(li);
    }
    status.textContent="Se muestran "+items.length+" de "+allItems.length+" elementos.";
  }
  searchInput.addEventListener("input",drawFilteredFiles);
  if(sortSelect)sortSelect.addEventListener("change",()=>{sortKey=sortSelect.value;drawFilteredFiles();});
  const viewToggle=document.getElementById("view-toggle");
  if(viewToggle)viewToggle.addEventListener("click",()=>{viewMode=viewMode==="list"?"grid":"list";viewToggle.textContent=viewMode==="grid"?"Cuadrícula":"Lista";drawFilteredFiles();});
  document.querySelectorAll("[data-filter]").forEach(button=>button.addEventListener("click",()=>{activeFilter=button.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));drawFilteredFiles();}));
  document.getElementById("go-up").addEventListener("click",()=>{try{renderFiles(JSON.parse(window.WFileNative.goUp()));}catch(_){}});
  function updateHomeStats(items){const list=Array.isArray(items)?items:[];const dirs=list.filter(i=>i.directory).length;const row=document.getElementById("stat-row");if(row){row.hidden=!list.length;document.getElementById("stat-total").textContent=String(list.length);document.getElementById("stat-dirs").textContent=String(dirs);document.getElementById("stat-files").textContent=String(list.length-dirs);}const counts={documents:0,images:0,audio:0,archives:0};for(const item of list){if(item.directory)continue;const mime=(item.mimeType||"").toLowerCase(),name=(item.name||"").toLowerCase();if(mime.includes("pdf")||mime.startsWith("text/"))counts.documents++;else if(mime.startsWith("image/"))counts.images++;else if(mime.startsWith("audio/")||mime.startsWith("video/"))counts.audio++;else if(mime.includes("zip")||/\.zip$/i.test(name))counts.archives++;}const set=(id,n,f)=>{const el=document.getElementById(id);if(el)el.textContent=list.length?(n+" en carpeta"):f;};set("count-documents",counts.documents,"PDF, TXT");set("count-images",counts.images,"Fotos");set("count-audio",counts.audio,"Audio");set("count-archives",counts.archives,"ZIP");const dot=document.getElementById("access-dot"),pill=document.getElementById("access-pill");if(dot&&pill&&(list.length||(window.WFileNative&&window.WFileNative.hasFolderAccess&&window.WFileNative.hasFolderAccess()))){dot.classList.add("on");pill.textContent="CONECTADO";}}
  function formatSize(bytes){if(bytes<1024)return bytes+" B";const u=["KB","MB","GB"];let v=bytes/1024,i=0;while(v>=1024&&i<u.length-1){v/=1024;i++;}return v.toFixed(v>=10?0:1)+" "+u[i];}
  function refreshFiles(){try{renderFiles(JSON.parse(window.WFileNative.listFiles()));}catch(_){status.textContent="Error al listar.";}}
  function openTextEditor(documentId){try{const r=JSON.parse(window.WFileNative.readTextFile(documentId));if(!r.ok){status.textContent=r.message||"";return;}editorDocId=documentId;const panel=document.getElementById("editor-panel");const area=document.getElementById("editor-area");const title=document.getElementById("editor-title");if(panel)panel.hidden=false;if(area)area.value=r.content||"";if(title)title.textContent=r.name||"Texto";if(filePanel)filePanel.hidden=true;}catch(_){status.textContent="Error editor.";}}
  const editorSave=document.getElementById("editor-save");if(editorSave)editorSave.addEventListener("click",()=>{if(!editorDocId)return;const r=JSON.parse(window.WFileNative.writeTextFile(editorDocId,document.getElementById("editor-area").value));status.textContent=r.message||"";});
  const editorClose=document.getElementById("editor-close");if(editorClose)editorClose.addEventListener("click",()=>{editorDocId=null;const panel=document.getElementById("editor-panel");if(panel)panel.hidden=true;if(filePanel)filePanel.hidden=false;});
  document.getElementById("choose-folder").addEventListener("click",()=>{if(window.WFileNative&&window.WFileNative.requestFolderAccess)window.WFileNative.requestFolderAccess();});
  window.onFolderAccessResult=r=>{status.textContent=r.message||"";if(r.granted)refreshFiles();};
  window.onDirectoryResult=renderFiles;
  document.getElementById("more-button").addEventListener("click",refreshFiles);
  function refreshSafeStatus(){const el=document.getElementById("safe-status");if(!el||!window.WFileNative)return;try{el.textContent=window.WFileNative.isSecureUnlocked()?"Estado: desbloqueada":"Estado: bloqueada";}catch(_){}}
  const safeUnlock=document.getElementById("safe-unlock");if(safeUnlock)safeUnlock.addEventListener("click",()=>{const pw=(document.getElementById("safe-password")||{}).value||"";try{const r=JSON.parse(window.WFileNative.unlockSecure(pw));status.textContent=r.message||"";refreshSafeStatus();if(r.ok){const inp=document.getElementById("safe-password");if(inp)inp.value="";}}catch(_){status.textContent="Error al desbloquear.";}});
  const safeLockBtn=document.getElementById("safe-lock");if(safeLockBtn)safeLockBtn.addEventListener("click",()=>{try{const r=JSON.parse(window.WFileNative.lockSecure());status.textContent=r.message||"";refreshSafeStatus();}catch(_){}});
  const safeBack=document.getElementById("safe-back");if(safeBack)safeBack.addEventListener("click",()=>{document.querySelector('[data-view="home"]').click();});
  function showHomeChrome(show){const hs=document.getElementById("home-section"),ch=document.getElementById("cat-heading"),cg=document.querySelector(".category-grid"),sp=document.getElementById("safe-panel");if(hs)hs.hidden=!show;if(ch)ch.hidden=!show;if(cg)cg.hidden=!show;if(sp)sp.hidden=true;}
  document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{const view=button.dataset.view;closeDrawer();document.querySelectorAll(".nav-item").forEach(item=>{const active=item.dataset.view===view;item.classList.toggle("active",active);if(active)item.setAttribute("aria-current","page");else item.removeAttribute("aria-current");});if(view==="favorites"){showHomeChrome(true);try{renderFiles(JSON.parse(window.WFileNative.listFavorites()));}catch(_){}return;}if(["documents","images","audio","archives"].includes(view)){activeFilter=view;filePanel.hidden=false;drawFilteredFiles();}else if(view==="home"){activeFilter="all";filePanel.hidden=allItems.length===0;showHomeChrome(true);updateHomeStats(allItems);}else if(["internal","sd"].includes(view)){status.textContent="Usá el selector SAF.";filePanel.hidden=true;}else if(view==="safe"){status.textContent="Carpeta segura: AES-GCM.";filePanel.hidden=true;refreshSafeStatus();const sp=document.getElementById("safe-panel");if(sp)sp.hidden=false;const hs=document.getElementById("home-section"),ch=document.getElementById("cat-heading"),cg=document.querySelector(".category-grid");if(hs)hs.hidden=true;if(ch)ch.hidden=true;if(cg)cg.hidden=true;}}));
  try{if(window.WFileNative){const info=JSON.parse(window.WFileNative.getAppInfo());status.textContent=info.name+" · "+info.version;if(window.WFileNative.hasFolderAccess())refreshFiles();}}catch(_){}
})();
