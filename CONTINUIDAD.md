# W FILE MANAGER — CONTINUIDAD DEL PROYECTO

Fecha de actualización: 2026-10-15
Rama de trabajo: `main`
Repositorio: https://github.com/wair0/W-FILE-MANAGER/

## Objetivos obligatorios

- Android applicationId y namespace: `com.wfilemanager.app`.
- Nombre del APK: `WFILEMANAGER.APK`.
- Nombre del ZIP de fuentes: `WFILEMANAGER.zip`.
- Artefacto instalable de GitHub Actions: `WFILEMANAGER`, debe contener solo `WFILEMANAGER.APK`.
- Artefacto opcional de fuentes: `WFILEMANAGER-SOURCE`, contiene `WFILEMANAGER.zip` por separado.
- Trabajar directamente en `main`.
- No crear ramas alternativas, commits de validación ni workflows dedicados exclusivamente a validar cambios.
- Usar GitHub Actions para compilar; no exigir una compilación local como parte del flujo de entrega.
- Distinguir las comprobaciones de CI de las pruebas funcionales en un dispositivo Android real.

## Estado y cambios registrados

### Base del proyecto

- Aplicación Android nativa en Kotlin con interfaz HTML/CSS/JavaScript dentro de WebView y recursos locales para funcionamiento offline.
- Los recursos web se encuentran bajo `app/src/main/assets/www/`.
- Los componentes Kotlin principales incluyen `MainActivity.kt` y `FileOps.kt`.
- Se inspeccionó el ZIP de iconos adjunto. Sus recursos vectoriales adaptativos se compararon con los del repositorio y resultaron semánticamente equivalentes; evitar reemplazarlos sin una diferencia comprobada.

### Cambios recientes registrados en la conversación

- Se bloquean solicitudes de recursos HTTP/HTTPS en la WebView para mantener el contenido de la interfaz local/offline.
- Se ajustó el flujo de permisos de almacenamiento para Android 11+ para solicitar el acceso especial a todos los archivos sin depender primero de permisos multimedia.
- La extracción ZIP valida rutas para prevenir zip-slip, rechaza sobrescribir archivos existentes y verifica la creación del directorio de destino.
- La vista previa de entradas ZIP incorpora un límite de lectura para datos cuyo tamaño no está declarado.
- Se ajustó el tipo MIME en el flujo de compartir para evitar que una selección previa de carpeta determine incorrectamente el MIME del archivo.
- Se añadió una comprobación de sintaxis JavaScript al proceso de CI.
- README actualizado para reflejar el estado técnico, la seguridad y los nombres correctos de los entregables.

## Commits de referencia

- `7b94465` — `FIX ANDROID SDK SETUP AND FILE SHARING PATHS`
- `bb805d6` — `FIX ANDROID VALUES RESOURCE DIRECTORY`
- `4401d57` — bloqueo de solicitudes de red en WebView.
- `b5eac34` — ajuste del flujo de permisos Android.
- `d801457` — protecciones de extracción ZIP.
- `aacdb88` — revisión de artefactos y cambios de seguridad/CI referidos en el seguimiento.
- `4fdae52` — actualización del README y documentación de los nombres de artefactos.

Enlaces de referencia:
- https://github.com/wair0/W-FILE-MANAGER/commit/7b94465dd7b95f13096c2d4a61864d314189ac3a
- https://github.com/wair0/W-FILE-MANAGER/commit/bb805d65f4712c2b6d2c3ecd1c113f35579be93d
- https://github.com/wair0/W-FILE-MANAGER/commit/4401d579603b15dee7078e8bce36563414eb3e42
- https://github.com/wair0/W-FILE-MANAGER/commit/b5eac34e7e3e796f2ff0ba45484385b7642fc016
- https://github.com/wair0/W-FILE-MANAGER/commit/d801457611d190e37b27d71f748d5f88c02bb298
- https://github.com/wair0/W-FILE-MANAGER/commit/aacdb885822024b019bb9a5b23dd22112b7c63f0
- https://github.com/wair0/W-FILE-MANAGER/commit/4fdae52e7e8daf0c72141bf7ef427cbe29f73554

## Compilación y artefactos

Las ejecuciones citadas durante el seguimiento incluyen:
- https://github.com/wair0/W-FILE-MANAGER/actions/runs/38697438430
- https://github.com/wair0/W-FILE-MANAGER/actions/runs/38698423720
- https://github.com/wair0/W-FILE-MANAGER/actions/runs/38698751177
- https://github.com/wair0/W-FILE-MANAGER/actions/runs/38699201417

Consultar https://github.com/wair0/W-FILE-MANAGER/actions para conocer el estado real de la ejecución más reciente. No asumir que una ejecución terminó bien por haber terminado una anterior. Verificar los logs y el listado de artefactos de la ejecución actual.

El artefacto instalable `WFILEMANAGER` debe contener únicamente `WFILEMANAGER.APK`. El ZIP de fuentes `WFILEMANAGER.zip` se publica por separado en el artefacto `WFILEMANAGER-SOURCE`, para evitar un ZIP dentro del ZIP que descarga GitHub Actions.

## Próximas tareas

1. Confirmar que el workflow más reciente termina correctamente tras los cambios de nombre y CI.
2. Comprobar en la nueva ejecución que `WFILEMANAGER` contiene solo `WFILEMANAGER.APK` y que `WFILEMANAGER-SOURCE` contiene por separado `WFILEMANAGER.zip`.
3. Inspeccionar el APK generado: integridad del archivo, applicationId `com.wfilemanager.app`, firma y recursos web.
4. Probar instalación y arranque en Android; no afirmar pruebas físicas si no se han realizado.
5. Probar permisos concedidos/denegados/revocados y acceso al almacenamiento.
6. Probar crear/copiar/mover/renombrar/eliminar/compartir/abrir archivos, editor TXT, visor de imágenes y ZIP.
7. Probar ZIP con rutas maliciosas, nombres duplicados y entradas grandes o malformadas.
8. Revisar y corregir cualquier fallo reproducible encontrado; mantener la compilación de GitHub Actions como verificación continua.
9. Antes de una distribución pública, evaluar una clave de firma release propia y protegida. La configuración de debug sirve para pruebas, no para una identidad de actualización estable.

## Criterios de entrega

- APK llamado exactamente `WFILEMANAGER.APK`.
- ZIP de fuentes llamado exactamente `WFILEMANAGER.zip`.
- Artefacto de Actions llamado `WFILEMANAGER`.
- Identificador `com.wfilemanager.app`.
- Recursos Android ubicados en los directorios correctos.
- Compilación confirmada en la ejecución más reciente de GitHub Actions y artefactos descargables.
- Pruebas funcionales documentadas, indicando qué se verificó en CI, emulador y dispositivo real.


## Verificación de entrega — 2026-10-15

- Se inspeccionó el workflow `.github/workflows/build.yml`: compila debug y release, ejecuta `node --check app/src/main/assets/www/app.js` y publica los entregables con `if-no-files-found: error`.
- La ejecución `38699201417` terminó con conclusión `success`; el job `Build APK and source package` y sus pasos de validación JS, compilación, preparación y subida finalizaron correctamente.
- El artefacto publicado se llama exactamente `WFILEMANAGER` y está asociado al commit `9ed3bac4448b3872de8ad12de08ea1496d414dec`, que incluye el cambio de nombre de artefacto `550da9c6b34e0f26f2f36f01660e9dc1b54a3815`.
- La inspección anterior encontró `WFILEMANAGER.APK` (2.546.604 bytes) y `WFILEMANAGER.zip` (252.683 bytes) juntos en el artefacto. Aunque no había otro nivel adicional de ZIP, incluir el ZIP de fuentes dentro del paquete de descarga de GitHub Actions resulta confuso. Se corrigió el workflow para publicar el APK y el ZIP de fuentes como artefactos separados; falta comprobar el resultado de la nueva ejecución.
- Las comprobaciones de integridad ZIP finalizaron sin errores para el artefacto, el APK y el ZIP de fuentes. El APK contiene `AndroidManifest.xml`, archivos DEX y recursos `assets/www/`; el ZIP de fuentes contiene archivos Gradle y la interfaz web.
- SHA-256 del APK inspeccionado: `5f71da0712947dd397101df38989874fd2e86fb8f15e3837623955263c408a11`.
- El artefacto expira el 2026-10-29. Descarga desde [GitHub Actions](https://github.com/wair0/W-FILE-MANAGER/actions) antes de esa fecha.
- **Pendiente:** todavía no se ha confirmado por estas comprobaciones el `applicationId` extraído del manifiesto ni la firma mediante herramientas Android; tampoco se han realizado pruebas de instalación o uso en un dispositivo físico. La integridad del paquete y el éxito de CI no sustituyen esas pruebas.

## Siguiente avance recomendado

1. Validar `applicationId` y certificado de firma del APK generado con herramientas Android y registrar sus resultados.
2. Ejecutar pruebas funcionales de instalación, permisos y operaciones de archivos en un dispositivo o emulador disponible; documentar por separado cada resultado.
3. Revisar con pruebas específicas la extracción ZIP (entradas duplicadas, rutas maliciosas, archivos grandes y fallos parciales) y las operaciones de mover/copiar en destinos con permisos limitados.


## Incidencia y correcciones — 2026-10-15

### Inicio roto
- Se endureció `vHome()` frente a datos persistidos antiguos o incompletos: el historial reciente, los dispositivos y los favoritos se filtran antes de renderizar.
- Se validan los valores numéricos del almacenamiento antes de calcular porcentajes y barras; el estado de una entrada no válida ya no debería interrumpir el renderizado completo de Inicio.
- Se conservó el carrusel horizontal de Recientes y los accesos rápidos actuales.

### Audio y vídeo
- Causa técnica probable identificada: el endpoint local de WebView servía archivos como una respuesta completa sin atender la cabecera `Range`. Chromium usa solicitudes de bytes parciales para iniciar algunos medios y permitir el desplazamiento temporal.
- `MainActivity.kt` ahora procesa solicitudes `Range: bytes=...`, posiciona el flujo en el byte solicitado y responde con estado HTTP 206, `Content-Range`, `Content-Length` y `Accept-Ranges: bytes`; las solicitudes normales continúan respondiendo 200.
- Los archivos siguen sirviéndose desde el almacenamiento local; no se habilitó acceso a recursos web externos.
- Pendiente validar con un build nuevo y pruebas funcionales en dispositivo/emulador con varios archivos MP4/MP3, reproducción, pausa, avance y retroceso. La causa indicada es la explicación técnica más probable basada en el código; todavía no se ha confirmado en un dispositivo.

### Commits de corrección
- `4b20386` — `FIX LOCAL MEDIA STREAMING WITH HTTP RANGE SUPPORT`
- `ab16af2` — `FIX HOME SCREEN RENDERING WITH SAFE STORED DATA`

### Verificación pendiente
1. Revisar la ejecución de GitHub Actions activada por los cambios y confirmar que compila Kotlin y pasa `node --check`.
2. Instalar el APK recién generado y comprobar Inicio con historial vacío, normal y con datos guardados antiguos.
3. Probar reproducción y seek de audio/vídeo local; si falla, revisar el MIME de cada extensión en `FileOps.mime()` y los logs de WebView.
4. No considerar corregido el problema en dispositivo hasta completar esas pruebas.


## Seguimiento adicional — 2026-10-15

### Restauración de Inicio
- Se restauró `vHome()` íntegramente desde la versión anterior a la modificación que intentó endurecer la pantalla (`4b20386`), para volver al renderizado original en vez de seguir alterándolo.

### Medios que quedaban cargando
- El endpoint `wfile.local` con `shouldInterceptRequest` no estaba dando un resultado funcional en el reproductor de la WebView, incluso tras añadir respuesta parcial.
- El reproductor de audio/vídeo ahora usa una URI `file://` local para que Chromium acceda directamente al archivo con `allowFileAccess=true`, evitando el interceptor HTTP en el pipeline multimedia.
- Se añadió un manejador de error multimedia que muestra mensajes distintos para error de lectura, formato y códec no compatible.
- Commit: `caacfbd` — `RESTORE ORIGINAL HOME AND FIX LOCAL MEDIA SOURCE`.

### Validación pendiente
- Confirmar en el dispositivo que Inicio vuelve a su aspecto y comportamiento original.
- Probar MP4 y MP3 locales. Algunos archivos MKV/AVI u otros contenedores pueden depender de códecs que Android/WebView no incluye; en esos casos el mensaje debe indicar incompatibilidad y se puede usar «Abrir con…».


## Actualización de continuidad — 2026-10-15

### Instalar APK desde dentro de un ZIP
- En el visor ZIP, tocar una entrada con extensión `.apk` invoca la acción nativa `zipInstallApk`.
- `MainActivity.kt` localiza la entrada en el ZIP y copia el contenido a un archivo temporal dentro de `cacheDir/zip-apk`; no lo extrae a una carpeta visible del almacenamiento del usuario.
- Se rechazan entradas que no sean archivos APK y se limita la copia a 700 MB.
- El archivo temporal se comparte con el instalador de Android mediante `FileProvider`, MIME `application/vnd.android.package-archive` y permiso de lectura URI.
- Android sigue controlando la instalación y puede pedir que el usuario autorice instalaciones desde esta fuente.
- Pendiente: probar en dispositivo/emulador APK válido, APK inválido, entrada en subcarpeta, archivo grande, cancelación y limpieza de archivos temporales. Abrir el instalador no equivale a confirmar que la instalación finalizó correctamente.

### Miniaturas de video
- Se añadió el puente nativo `videoThumbnail` en `MainActivity.kt`, basado en `MediaMetadataRetriever`, para extraer un fotograma local y devolverlo como JPEG Base64.
- En `app.js`, `thumbOf()` crea la imagen `data-video` para archivos de tipo video y `hydrateVideoThumbs()` carga la miniatura bajo demanda en las vistas que usan este componente.
- Si no se puede decodificar un fotograma, se conserva el icono de video. La generación es local y no depende de API externas.
- Pendiente: probar distintos formatos y tamaños, archivos dañados y códecs no compatibles; confirmar que la interfaz sigue fluida y que el fallback se ve correctamente.

### Commits de esta actualización
- `a0289cc` — `ADD VIDEO THUMBNAILS AND INSTALL APK FROM ZIP` (interfaz JavaScript).
- `44ed4c8` — `ADD ZIP APK INSTALLER AND VIDEO THUMBNAIL BRIDGE` (funciones Kotlin).
- `cfe990e` — `ALLOW FILE PROVIDER TO SHARE TEMP APK CACHE` (ruta de caché en FileProvider).

Enlaces:
- https://github.com/wair0/W-FILE-MANAGER/commit/a0289cc8d279887ec92dd67ef33831ba9734e47a
- https://github.com/wair0/W-FILE-MANAGER/commit/44ed4c861445f91159a904fba427f8124fd8b7a0
- https://github.com/wair0/W-FILE-MANAGER/commit/cfe990e9f9d8e4818018054e16cb9bb3660992fc

### Estado de CI y entregables
- En la última consulta, las ejecuciones 35, 36 y 37 seguían en curso; la ejecución 37 era la más reciente y estaba `in_progress`.
- No afirmar que el APK de estos cambios está compilado hasta volver a consultar [GitHub Actions](https://github.com/wair0/W-FILE-MANAGER/actions) y verificar la ejecución más reciente, sus logs y artefactos.
- Confirmar que el artefacto `WFILEMANAGER` contiene solo `WFILEMANAGER.APK` y que `WFILEMANAGER-SOURCE` contiene por separado `WFILEMANAGER.zip`.

### Próximas pruebas
1. Verificar compilación Kotlin y `node --check app/src/main/assets/www/app.js` en la ejecución más reciente.
2. Instalar y abrir el APK en un dispositivo o emulador.
3. Probar instalación desde ZIP y la autorización de Android; revisar el comportamiento al cancelar o si el APK está dañado.
4. Probar miniaturas con varios formatos de video, y el fallback para formatos no compatibles.
5. Verificar que los archivos temporales de instalación no se acumulen indefinidamente; si se detecta acumulación, añadir limpieza segura de temporales antiguos.
6. Documentar por separado los resultados de CI y las pruebas reales en dispositivo; no declarar pruebas físicas que no se hayan realizado.


## Actualización: menú contextual por pulsación larga (2026-10-15)

- Commit `8321f16` — `ADD LONG-PRESS CONTEXT MENU FOR FILES`.
- En `app/src/main/assets/www/app.js`, la pulsación larga (480 ms) sobre un elemento de lista/cuadrícula abre `itemMenu(it)` en vez de activar únicamente la selección múltiple.
- El evento `contextmenu` evita el menú nativo y abre el mismo menú contextual en escritorio. Se conserva el menú del botón de tres puntos.
- Para ZIP/JAR, el menú ya incluye **Ver contenido ZIP** y **Extraer aquí**; para archivos compatibles incluye **Compartir**. También mantiene copiar/mover, renombrar, comprimir, favoritos, propiedades y eliminar.
- CI y prueba en dispositivo no confirmados todavía. Verificar especialmente que el gesto no interfiera con el toque normal para abrir, con selección múltiple, cuadrícula y listas de Recientes/Favoritos.
- Commit: https://github.com/wair0/W-FILE-MANAGER/commit/8321f16415c51dc0e54a3944d9324d9c1ecb00ad


## Corrección multimedia — 2026-10-15

- Se añadió un reproductor integrado para vídeo y audio, con controles nativos, indicador de error y acción para abrir con otra aplicación si el formato no es compatible.
- Se conectaron las funciones Kotlin existentes `videoThumbnail` y `pdfThumbnail` con la interfaz: vídeos con fotograma, PDF con imagen de la primera página e imágenes convertidas a miniaturas JPEG mediante Android nativo.
- Se añadió caché de miniaturas en memoria y fallback a iconos cuando el archivo no se puede decodificar.
- Se conservaron la pantalla Inicio y los cambios de navegación actuales.
- Pendiente de validar: compilación de GitHub Actions y prueba real en Android, especialmente MP4/MP3, formatos menos comunes y PDFs protegidos o dañados.


## Correcciones de multimedia y rol de archivos — 2026-10-15

- Se cambió la apertura de vídeo a un reproductor nativo Android `VideoView` a pantalla completa, con controles y aviso visible si el contenedor/códec falla.
- Se conectó el reproductor de audio a una notificación persistente con título y acción reproducir/pausar; se añadió el permiso `POST_NOTIFICATIONS` para Android 13+.
- Se añadieron filtros de intención para raíz/directorio de documentos, categoría `APP_FILES` y una opción en Ajustes para solicitar `RoleManager.ROLE_FILES`.
- Pendiente: comprobar compilación y probar reproducción, permiso de notificación y solicitud del rol predeterminado en el dispositivo.
