(() => {
  const drawer = document.getElementById("drawer");
  const menu = document.getElementById("menu-button");
  const status = document.getElementById("native-status");
  const themeButton = document.getElementById("theme-button");
  const labels = {home:"Inicio",internal:"Almacenamiento interno",sd:"Tarjeta SD",favorites:"Destacados",safe:"Carpeta segura",documents:"Documentos",images:"Imágenes",audio:"Audio",archives:"Archivos ZIP"};
  function closeDrawer(){drawer.hidden=true;menu.setAttribute("aria-expanded","false");}
  menu.addEventListener("click",()=>{const open=drawer.hidden;drawer.hidden=!open;menu.setAttribute("aria-expanded",String(open));});
  themeButton.addEventListener("click",()=>{
    document.body.classList.toggle("light");
    const light=document.body.classList.contains("light");
    themeButton.setAttribute("aria-pressed",String(light));
    try{localStorage.setItem("wfm-theme",light?"light":"dark");}catch(_){}
    closeDrawer();
  });
  try{if(localStorage.getItem("wfm-theme")==="light")document.body.classList.add("light");}catch(_){}
  document.getElementById("choose-folder").addEventListener("click",()=>{
    if(window.WFileNative&&typeof window.WFileNative.requestFolderAccess==="function"){
      window.WFileNative.requestFolderAccess();
      status.textContent="Seleccioná una carpeta en el selector seguro de Android.";
    }else status.textContent="El selector de carpetas está disponible dentro de la aplicación Android.";
  });
  window.onFolderAccessResult=result=>{
    status.textContent=result.message|| (result.granted?"Acceso concedido.":"No se concedió acceso.");
    if(result.granted)document.getElementById("storage-note").textContent="Carpeta seleccionada. El listado real se conectará en la siguiente iteración.";
  };
  document.getElementById("more-button").addEventListener("click",()=>{status.textContent="Las opciones de archivo aparecerán aquí cuando el motor Kotlin esté conectado.";});
  document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{
    const view=button.dataset.view;closeDrawer();
    document.querySelectorAll(".nav-item").forEach(item=>{
      const active=item.dataset.view===view;item.classList.toggle("active",active);
      if(active)item.setAttribute("aria-current","page");else item.removeAttribute("aria-current");
    });
    status.textContent=view==="home"?"Inicio seleccionado. El contenido se actualizará con datos reales al conectar el motor Kotlin.":(labels[view]||button.textContent.trim())+": pantalla pendiente de conexión al motor Kotlin.";
  }));
  try{if(window.WFileNative){const info=JSON.parse(window.WFileNative.getAppInfo());status.textContent=info.name+" · motor nativo "+info.status;}}catch(_){status.textContent="Vista previa de la interfaz. Ejecuta la app Android para comprobar el puente nativo.";}
  const canvas=document.getElementById("ambient"),gl=canvas.getContext("webgl",{alpha:true,antialias:false});
  if(!gl)return;
  const vertex="attribute vec2 p; void main(){gl_Position=vec4(p,0.0,1.0);}";
  const fragment="precision mediump float; uniform vec2 r; void main(){vec2 uv=gl_FragCoord.xy/r; float gx=step(0.988,fract(uv.x*22.0)); float gy=step(0.988,fract(uv.y*34.0)); float glow=pow(max(0.0,1.0-distance(uv,vec2(0.72,0.75))),3.0); float a=min(0.12,(gx+gy)*0.018+glow*0.05); gl_FragColor=vec4(0.0,0.65,0.95,a);}";
  function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;}
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(program,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const resolution=gl.getUniformLocation(program,"r");
  function render(){const dpr=Math.min(window.devicePixelRatio||1,1.5),w=Math.floor(innerWidth*dpr),h=Math.floor(innerHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.uniform2f(resolution,w,h);gl.drawArrays(gl.TRIANGLES,0,6);}
  render();window.addEventListener("resize",render,{passive:true});
})();
