(() => {
  const drawer = document.getElementById("drawer");
  const menu = document.getElementById("menu-button");
  const status = document.getElementById("native-status");
  menu.addEventListener("click", () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    menu.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("theme-button").addEventListener("click", () => {
    document.body.classList.toggle("light");
    drawer.hidden = true;
    menu.setAttribute("aria-expanded", "false");
  });
  document.getElementById("more-button").addEventListener("click", () => {
    status.textContent = "Las opciones adicionales se incorporarán cuando estén conectadas las funciones nativas.";
  });
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    const view = button.dataset.view;
    drawer.hidden = true;
    menu.setAttribute("aria-expanded", "false");
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
    if (view === "home") status.textContent = "Estás en Inicio. Las funciones de archivos se conectarán en próximas fases.";
    else status.textContent = "Vista «" + button.textContent.trim() + "»: pendiente de conexión al motor Kotlin.";
  }));
  try {
    if (window.WFileNative) {
      const info = JSON.parse(window.WFileNative.getAppInfo());
      status.textContent = info.name + " · motor nativo " + info.status;
    }
  } catch (_) {
    status.textContent = "Modo de vista previa. Ejecuta la aplicación Android para conectar el motor nativo.";
  }
  // Fondo WebGL: shader ambiental sencillo, con degradación elegante si WebGL no está disponible.
  const canvas = document.getElementById("ambient");
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
  if (!gl) return;
  const vertex = "attribute vec2 p; void main(){gl_Position=vec4(p,0.0,1.0);}";
  const fragment = "precision mediump float; uniform vec2 r; uniform float t; void main(){vec2 uv=gl_FragCoord.xy/r; float grid=step(0.985,fract(uv.x*18.0))+step(0.985,fract(uv.y*28.0)); float glow=pow(max(0.0,1.0-distance(uv,vec2(0.72,0.75))),3.0); gl_FragColor=vec4(0.0,0.65,0.95,min(0.18,grid*0.035+glow*0.06));}";
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return;
  const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "r");
  function render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(innerWidth*dpr), h = Math.floor(innerHeight*dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); }
    gl.uniform2f(resolution, w, h); gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  render();
})();
