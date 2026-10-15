import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import re,sys
W=os.path.join(ROOT,'app/src/main/assets/www')+'/'
h=open(W+'index.html',encoding='utf-8').read()
css=open(W+'css/app.css',encoding='utf-8').read()
js=open(W+'js/app.js',encoding='utf-8').read()
mock=open(os.path.join(ROOT,'preview/mock.js'),encoding='utf-8').read()
frame='''
/* Marco de teléfono (solo vista previa) */
@media (min-width:640px){
 html,body{overflow:auto}
 body{display:flex;align-items:center;justify-content:center;min-height:100vh;
  background:radial-gradient(800px 500px at 20% 10%,rgba(139,92,246,.25),transparent 60%),radial-gradient(800px 500px at 90% 90%,rgba(0,229,255,.18),transparent 60%),#02050d}
 #app{width:392px;height:820px;max-height:94vh;flex:none;border-radius:38px;border:10px solid #101a33;box-shadow:0 0 0 1px rgba(0,229,255,.4),0 30px 80px rgba(0,0,0,.7),0 0 60px rgba(0,229,255,.18)}
 #hdr{padding-top:6px;height:58px}
}
.pvnote{position:fixed;left:16px;bottom:12px;font-family:ui-monospace,monospace;font-size:11px;color:#7f93b8;letter-spacing:.08em;z-index:99;max-width:300px;line-height:1.5}
@media (max-width:639px){.pvnote{display:none}}
'''
h=h.replace('<link rel="stylesheet" href="css/app.css">','<style>'+css+frame+'</style>')
note='<div class="pvnote">VISTA PREVIA · W FILE MANAGER<br>Sistema de archivos simulado.<br>Pulsa «Conceder acceso total» para empezar.<br>Mantén pulsado un elemento para seleccionar.</div>'
h=h.replace('<script src="js/app.js"></script>',note+'<script>'+mock+'</script>\n<script>'+js+'</script>')
open(sys.argv[1],'w',encoding='utf-8').write(h)
print(len(h))
