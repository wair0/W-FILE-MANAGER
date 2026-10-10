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
  let allItems=[];
  let activeFilter="all";
  let sortKey="name";
  let viewMode="list";
  let editorDocId=null;
  function renderFiles(payload){
    filePanel.hidden=false;fileList.replaceChildren();
    if(payload.error){status.textContent=payload.error;return;}
    allItems=Array.isArray(payload.items)?payload.items:[];
    updateHomeStats(allItems);
    pathLabel.textContent=payload.pathDepth?"Subcarpeta · "+payload.pathDepth+" nivel(es)":"Carpeta inicial";
    document.getElementById("go-up").disabled=!payload.canGoUp;
    drawFilteredFiles();
  }
  function sortItems(items){
    return items.slice().sort((a,b)=>{
      if(a.directory!==b.directory) return Number(b.directory)-Number(a.directory);
      if(sortKey==="size") return (b.size||0)-(a.size||0);
      if(sortKey==="modified") return (b.modified||0)-(a.modified||0);
      return a.name.localeCompare(b.name,undefined,{sensitivity:"base"});
    });
  }
  function drawFilteredFiles(){
    fileList.replaceChildren();
    fileList.classList.toggle("grid", viewMode==="grid");
    const query=(searchInput.value||"").trim().toLocaleLowerCase();
    const items=sortItems(allItems.filter(item=>{
      const mime=(item.mimeType||"").toLowerCase(),name=(item.name||"").toLowerCase();
      const queryMatch=name.includes(query);
      const filterMatch=activeFilter==="all"||
        (activeFilter==="documents"&&(mime.includes("pdf")||mime.startsWith("text/")||/\.(docx?|xlsx?|pptx?)$/i.test(name)))||
        (activeFilter==="images"&&mime.startsWith("image/"))||
        (activeFilter==="audio"&&(mime.startsWith("audio/")||mime.startsWith("video/")))||
        (activeFilter==="archives"&&(mime.includes("zip")||/\.(zip|rar|7z|tar|gz)$/i.test(name)));
      return queryMatch&&filterMatch;
    }));
    if(!items.length){const empty=document.createElement("li");empty.className="empty-files";empty.textContent=allItems.length?"No hay coincidencias para este filtro.":"Esta carpeta está vacía.";fileList.append(empty);status.textContent=allItems.length?"No se encontraron coincidencias.":"Carpeta leída correctamente: no contiene elementos.";return;}
    for(const item of items){
      const li=document.createElement("li");li.className="file-row file-row-openable";li.tabIndex=0;li.setAttribute("role","button");
      const icon=document.createElement("span");icon.className="file-kind";icon.textContent=item.directory?"▱":(item.mimeType||"").startsWith("image/")?"▧":(item.mimeType||"").startsWith("audio/")?"♫":"▤";icon.setAttribute("aria-hidden","true");
      const details=document.createElement("span");details.className="file-details";
      const name=document.createElement("span");name.className="file-name";name.textContent=item.name;
      const meta=document.createElement("small");meta.textContent=item.directory?"Carpeta":(item.mimeType||"Archivo")+(Number.isFinite(item.size)?" · "+formatSize(item.size):"");
      details.append(name,meta);li.append(icon,details);
      const open=()=>{try{if(item.favorite){if(!window.WFileNative.openFavorite(item.id,item.treeUri))status.textContent="No se pudo abrir el destacado; revisá el permiso de la carpeta.";}else if(item.directory)renderFiles(JSON.parse(window.WFileNative.openDirectory(item.id)));else if(!window.WFileNative.openFile(item.id))status.textContent="No hay una aplicación disponible para abrir este archivo.";}catch(_){status.textContent="No se pudo abrir el elemento.";}};
      li.addEventListener("click",open);li.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open();}});
      if(!item.favorite){
        const actions=document.createElement("span");actions.className="file-actions";
        const renameBtn=document.createElement("button");renameBtn.className="action-btn";renameBtn.type="button";renameBtn.textContent="✎";renameBtn.setAttribute("aria-label","Renombrar");
        renameBtn.addEventListener("click",e=>{e.stopPropagation();const nn=prompt("Nuevo nombre:",item.name);if(nn&&nn!==item.name){try{const r=JSON.parse(window.WFileNative.renameDocument(item.id,nn));status.textContent=r.message||"";if(r.ok)refreshFiles();}catch(_){status.textContent="Error al renombrar.";}}});
        const copyBtn=document.createElement("button");copyBtn.className="action-btn";copyBtn.type="button";copyBtn.textContent="⎘";copyBtn.setAttribute("aria-label","Copiar aquí");
        copyBtn.addEventListener("click",e=>{e.stopPropagation();if(confirm("¿Copiar \""+item.name+"\" en esta misma carpeta?")){try{const r=JSON.parse(window.WFileNative.copyDocument(item.id));status.textContent=r.message||"";if(r.ok)refreshFiles();}catch(_){status.textContent="Error al copiar.";}}});
        const moveBtn=document.createElement("button");moveBtn.className="action-btn";moveBtn.type="button";moveBtn.textContent="↪";moveBtn.setAttribute("aria-label","Mover");
        moveBtn.addEventListener("click",e=>{e.stopPropagation();try{const folders=JSON.parse(window.WFileNative.listSubfolders());const opts=(folders.items||[]).map((f,i)=> (i+1)+") "+f.name).join("\n");if(!opts){status.textContent="No hay subcarpetas en este nivel para mover.";return;}const pick=prompt("Mover \""+item.name+"\" a (número):\n"+opts);const n=parseInt(pick,10);if(!n||n<1||n>folders.items.length){status.textContent="Movimiento cancelado.";return;}const target=folders.items[n-1];if(!confirm("¿Mover a \""+target.name+"\"?"))return;const r=JSON.parse(window.WFileNative.moveDocument(item.id,target.id));status.textContent=r.message||"";if(r.ok)refreshFiles();}catch(_){status.textContent="Error al mover.";}});
        const isZip=/\.zip$/i.test(item.name||"")||(item.mimeType||"").includes("zip");
        const isText=/^text\//i.test(item.mimeType||"")||/\.(txt|md|json|xml|csv|log|kt|java|js|css|html|py|sh)$/i.test(item.name||"");
        if(isText){const editBtn=document.createElement("button");editBtn.className="action-btn";editBtn.type="button";editBtn.textContent="Aa";editBtn.setAttribute("aria-label","Editar texto");editBtn.addEventListener("click",e=>{e.stopPropagation();openTextEditor(item.id);});actions.append(editBtn);}
        if(!item.directory){const zipBtn=document.createElement("button");zipBtn.className="action-btn";zipBtn.type="button";zipBtn.textContent="Z";zipBtn.setAttribute("aria-label","Crear ZIP");zipBtn.addEventListener("click",e=>{e.stopPropagation();const zn=prompt("Nombre del ZIP:",(item.name||"archivo").replace(/\.[^.]+$/,"")+".zip");if(!zn)return;try{const r=JSON.parse(window.WFileNative.createZip(item.id,zn));status.textContent=r.message||"";if(r.ok)refreshFiles();}catch(_){status.textContent="Error al crear ZIP.";}});actions.append(zipBtn);}
        if(isZip){const unzipBtn=document.createElement("button");unzipBtn.className="action-btn";unzipBtn.type="button";unzipBtn.textContent="\u21D3";unzipBtn.setAttribute("aria-label","Extraer ZIP");unzipBtn.addEventListener("click",e=>{e.stopPropagation();if(!confirm("¿Extraer \""+item.name+"\" en esta carpeta?"))return;try{const r=JSON.parse(window.WFileNative.extractZip(item.id));status.textContent=r.message||"";if(r.ok)refreshFiles();}catch(_){status.textContent="Error al extraer ZIP.";}});actions.append(unzipBtn);}
        const delBtn=document.createElement("button");delBtn.className="action-btn danger";delBtn.type="button";delBtn.textContent="\u2715";delBtn.setAttribute("aria-label","Eliminar");
        delBtn.addEventListener("click",e=>{e.stopPropagation();if(confirm("¿Eliminar \""+item.name+"\" de forma permanente?")){try{const r=JSON.parse(window.WFileNative.deleteDocument(item.id));status.textContent=r.message||"";if(r.ok)refreshFiles();}catch(_){status.textContent="Error al eliminar.";}}});
        actions.append(renameBtn,copyBtn,moveBtn,delBtn);li.append(actions);
      }
      if(!item.directory&&!item.favorite&&window.WFileNative&&typeof window.WFileNative.toggleFavorite==="function"){const star=document.createElement("button");star.className="favorite-toggle";star.type="button";star.textContent="\u2606";star.setAttribute("aria-label","Añadir a Destacados");star.addEventListener("click",event=>{event.stopPropagation();try{const result=JSON.parse(window.WFileNative.toggleFavorite(item.id));status.textContent=result.message||"Destacados actualizado.";star.textContent=result.favorite?"\u2605":"\u2606";}catch(_){status.textContent="No se pudo actualizar Destacados.";}});li.append(star);}
      fileList.append(li);
    }
    status.textContent="Se muestran "+items.length+" de "+allItems.length+" elementos.";
  }
  searchInput.addEventListener("input",drawFilteredFiles);
  if(sortSelect) sortSelect.addEventListener("change",()=>{sortKey=sortSelect.value;drawFilteredFiles();});
  const viewToggle=document.getElementById("view-toggle");
  if(viewToggle) viewToggle.addEventListener("click",()=>{viewMode=viewMode==="list"?"grid":"list";viewToggle.textContent=viewMode==="grid"?"Cuadrícula":"Lista";drawFilteredFiles();});
  document.querySelectorAll("[data-filter]").forEach(button=>button.addEventListener("click",()=>{activeFilter=button.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));drawFilteredFiles();}));
  document.getElementById("go-up").addEventListener("click",()=>{try{renderFiles(JSON.parse(window.WFileNative.goUp()));}catch(_){status.textContent="No se pudo volver a la carpeta anterior.";}});
  function updateHomeStats(items){
    const list=Array.isArray(items)?items:[];
    const dirs=list.filter(i=>i.directory).length;
    const files=list.length-dirs;
    const row=document.getElementById("stat-row");
    if(row){row.hidden=!list.length;document.getElementById("stat-total").textContent=String(list.length);document.getElementById("stat-dirs").textContent=String(dirs);document.getElementById("stat-files").textContent=String(files);}
    const counts={documents:0,images:0,audio:0,archives:0};
    for(const item of list){
      if(item.directory) continue;
      const mime=(item.mimeType||"").toLowerCase(),name=(item.name||"").toLowerCase();
      if(mime.includes("pdf")||mime.startsWith("text/")||/\.(docx?|xlsx?|pptx?)$/i.test(name)) counts.documents++;
      else if(mime.startsWith("image/")) counts.images++;
      else if(mime.startsWith("audio/")||mime.startsWith("video/")) counts.audio++;
      else if(mime.includes("zip")||/\.(zip|rar|7z|tar|gz)$/i.test(name)) counts.archives++;
    }
    const set=(id,n,fallback)=>{const el=document.getElementById(id);if(el)el.textContent=list.length?(n+" en carpeta"):fallback;};
    set("count-documents",counts.documents,"PDF, TXT y más");
    set("count-images",counts.images,"Fotos y gráficos");
    set("count-audio",counts.audio,"Música y clips");
    set("count-archives",counts.archives,"Comprimidos");
    const dot=document.getElementById("access-dot"),pill=document.getElementById("access-pill");
    if(dot&&pill){if(list.length||(window.WFileNative&&window.WFileNative.hasFolderAccess&&window.WFileNative.hasFolderAccess())){dot.classList.add("on");pill.textContent="CONECTADO";}}
  }
  function formatSize(bytes){if(bytes<1024)return bytes+" B";const units=["KB","MB","GB","TB"];let value=bytes/1024,index=0;while(value>=1024&&index<units.length-1){value/=1024;index++;}return value.toFixed(value>=10?0:1)+" "+units[index];}
  function refreshFiles(){
    if(!window.WFileNative||typeof window.WFileNative.listFiles!=="function"){status.textContent="La lectura de archivos requiere ejecutar la aplicación Android.";return;}
    try{renderFiles(JSON.parse(window.WFileNative.listFiles()));}catch(_){status.textContent="No se pudo procesar la respuesta del almacenamiento.";}
  }
  function openTextEditor(documentId){
    try{
      const r=JSON.parse(window.WFileNative.readTextFile(documentId));
      if(!r.ok){status.textContent=r.message||"No se pudo abrir el editor.";return;}
      editorDocId=documentId;
      const panel=document.getElementById("editor-panel");
      const area=document.getElementById("editor-area");
      const title=document.getElementById("editor-title");
      if(panel) panel.hidden=false;
      if(area) area.value=r.content||"";
      if(title) title.textContent=r.name||"Texto";
      if(filePanel) filePanel.hidden=true;
      status.textContent="Editor: "+(r.name||"");
    }catch(_){status.textContent="Error al abrir el editor.";}
  }
  const editorSave=document.getElementById("editor-save");
  if(editorSave) editorSave.addEventListener("click",()=>{
    if(!editorDocId){status.textContent="No hay archivo abierto.";return;}
    try{
      const content=document.getElementById("editor-area").value;
      const r=JSON.parse(window.WFileNative.writeTextFile(editorDocId,content));
      status.textContent=r.message||"";
    }catch(_){status.textContent="Error al guardar.";}
  });
  const editorClose=document.getElementById("editor-close");
  if(editorClose) editorClose.addEventListener("click",()=>{
    editorDocId=null;
    const panel=document.getElementById("editor-panel");
    if(panel) panel.hidden=true;
    if(filePanel) filePanel.hidden=false;
    status.textContent="Editor cerrado.";
  });
  document.getElementById("choose-folder").addEventListener("click",()=>{if(window.WFileNative&&typeof window.WFileNative.requestFolderAccess==="function"){window.WFileNative.requestFolderAccess();status.textContent="Seleccioná una carpeta en el selector seguro de Android.";}else status.textContent="El selector de carpetas está disponible dentro de la aplicación Android.";});
  window.onFolderAccessResult=result=>{status.textContent=result.message||(result.granted?"Acceso concedido.":"No se concedió acceso.");if(result.granted){document.getElementById("storage-note").textContent="Acceso autorizado mediante el selector seguro de Android.";refreshFiles();}};
  window.onDirectoryResult=renderFiles;
  document.getElementById("more-button").addEventListener("click",refreshFiles);
  const safeBack=document.getElementById("safe-back");
  if(safeBack) safeBack.addEventListener("click",()=>{document.querySelector('[data-view="home"]').click();});
  function showHomeChrome(show){
    const hs=document.getElementById("home-section"), ch=document.getElementById("cat-heading"), cg=document.querySelector(".category-grid"), sp=document.getElementById("safe-panel");
    if(hs) hs.hidden=!show;
    if(ch) ch.hidden=!show;
    if(cg) cg.hidden=!show;
    if(sp) sp.hidden=true;
  }
  document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{const view=button.dataset.view;closeDrawer();document.querySelectorAll(".nav-item").forEach(item=>{const active=item.dataset.view===view;item.classList.toggle("active",active);if(active)item.setAttribute("aria-current","page");else item.removeAttribute("aria-current");});if(view==="favorites"){const sp=document.getElementById("safe-panel");if(sp)sp.hidden=true;showHomeChrome(true);try{renderFiles(JSON.parse(window.WFileNative.listFavorites()));status.textContent="Tus archivos destacados guardados en este dispositivo.";}catch(_){status.textContent="Destacados requiere la aplicación Android.";}return;}if(["documents","images","audio","archives"].includes(view)){activeFilter=view;document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filter===view)));filePanel.hidden=false;drawFilteredFiles();status.textContent="Categoría aplicada al contenido de la carpeta actual.";}else if(view==="home"){activeFilter="all";document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filter==="all")));status.textContent="Inicio seleccionado.";filePanel.hidden=allItems.length===0;showHomeChrome(true);updateHomeStats(allItems);}else if(["internal","sd"].includes(view)){status.textContent="Seleccioná una carpeta desde el selector seguro de Android. La tarjeta SD aparece solo si Android la ofrece.";filePanel.hidden=true;}else if(view==="safe"){status.textContent="Carpeta segura (flujo diferenciado). Cifrado AES-GCM en Fase 7.";filePanel.hidden=true;const sp=document.getElementById("safe-panel");if(sp)sp.hidden=false;const hs=document.getElementById("home-section"),ch=document.getElementById("cat-heading"),cg=document.querySelector(".category-grid");if(hs)hs.hidden=true;if(ch)ch.hidden=true;if(cg)cg.hidden=true;}else{status.textContent=(labels[view]||button.textContent.trim())+": esta función todavía no está implementada.";filePanel.hidden=true;}}));
  try{if(window.WFileNative){const info=JSON.parse(window.WFileNative.getAppInfo());status.textContent=info.name+" · motor nativo "+info.status;if(window.WFileNative.hasFolderAccess())refreshFiles();}}catch(_){status.textContent="Vista previa de la interfaz. Ejecuta la app Android para comprobar el puente nativo.";}
  const canvas=document.getElementById("ambient"),gl=canvas.getContext("webgl",{alpha:true,antialias:false});
  if(gl&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    const vertex="attribute vec2 p; void main(){gl_Position=vec4(p,0.0,1.0);}";
    const fragment="precision mediump float; uniform vec2 r; void main(){vec2 uv=gl_FragCoord.xy/r; float gx=step(0.988,fract(uv.x*22.0)); float gy=step(0.988,fract(uv.y*34.0)); float glow=pow(max(0.0,1.0-distance(uv,vec2(0.72,0.75))),3.0); float a=min(0.12,(gx+gy)*0.018+glow*0.05); gl_FragColor=vec4(0.0,0.65,0.95,a);}";
    function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}return shader;}
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    if(vs&&fs){const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(gl.getProgramParameter(program,gl.LINK_STATUS)){gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);const resolution=gl.getUniformLocation(program,"r");function render(){const dpr=Math.min(window.devicePixelRatio||1,1.5),w=Math.floor(innerWidth*dpr),h=Math.floor(innerHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.uniform2f(resolution,w,h);gl.drawArrays(gl.TRIANGLES,0,6);}render();window.addEventListener("resize",render,{passive:true});}}
  }
})();
