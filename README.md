# W FILE MANAGER

Administrador de archivos para Android — **Kotlin + WebView offline** con interfaz HTML/CSS/JS de estilo *High-Tech corporativo / utopía futurista*.

## Funciones

- Header con botón hamburguesa, menú lateral, menú contextual y barra inferior.
- Inicio simplificado con recientes horizontales, accesos rápidos, dispositivos y favoritos.
- Explorador con lista/cuadrícula, migas de pan, ordenar, buscar, selección múltiple, copiar/mover/pegar, renombrar, eliminar, carpetas, propiedades, favoritos, compartir, abrir con y archivos ocultos.
- Visor y extractor ZIP, vista previa de entradas, extracción completa o selectiva con protección contra zip-slip y contra sobrescritura accidental de archivos existentes, y creación de ZIP. W FILE MANAGER puede elegirse en «Abrir con» para abrir ZIP recibidos desde Chrome u otras aplicaciones.
- Instalación de APK directamente desde dentro de un ZIP: al tocar una entrada `.apk`, se prepara una copia temporal privada y se abre el instalador de Android, sin extraerla manualmente a una carpeta visible. Android puede pedir autorización para instalar desde esta fuente.
- Miniaturas de video generadas localmente a partir de un fotograma del archivo; si el video o su códec no permite decodificar un fotograma, se conserva el icono de video.
- Visor/editor/creador TXT con números de línea, deshacer, buscar, ajuste de línea, tamaño de fuente y guardar/guardar como.
- Visor de imágenes con galería, zoom, cambio por deslizamiento, compartir y eliminar.
- Reproductores integrados de audio y vídeo desde el almacenamiento local, con controles nativos, búsqueda dentro del archivo y apertura/compartición externa.
- Pantalla Inicio con resumen de almacenamiento, accesos rápidos, herramientas, dispositivos, favoritos, recientes y permisos.
- Permisos de almacenamiento adaptados a la versión de Android.

## Identidad y entregables

- **Application ID / namespace:** `com.wfilemanager.app`
- **APK:** `WFILEMANAGER.APK`
- **Artefacto instalable de GitHub Actions:** `WFILEMANAGER` (contiene solo `WFILEMANAGER.APK`).

## Descargar los artefactos

Abre [GitHub Actions](https://github.com/wair0/W-FILE-MANAGER/actions) y entra en la ejecución más reciente de **Build W FILE MANAGER**. Descarga el único artefacto `WFILEMANAGER` para instalar la app: al extraerlo encontrarás directamente `WFILEMANAGER.APK`, sin otro ZIP dentro.

El workflow compila las variantes debug y release y se ejecuta al hacer push a `main` o manualmente desde **Actions → Build W FILE MANAGER → Run workflow**. Comprueba el estado y los logs de cada ejecución antes de considerar una entrega válida.

## Compilación local opcional

Requisitos: JDK 17, Android SDK 34 y Gradle 8.7.

```bash
gradle assembleDebug assembleRelease
```

## Estructura principal

```
app/src/main/java/com/wfilemanager/app/  MainActivity.kt · FileOps.kt
app/src/main/assets/www/                index.html · app.css · app.js (interfaz offline)
app/src/main/res/                       tema, FileProvider e icono adaptativo
preview/                                mock + script para vista previa HTML
```

## Seguridad y funcionamiento offline

- La interfaz, CSS y JavaScript se cargan desde assets locales. La URL interna `wfile.local` solo sirve archivos del almacenamiento local; no habilita navegación web externa.
- El endpoint local de archivos admite solicitudes HTTP Range (206 Partial Content). El reproductor integrado de audio/vídeo lee ahora el archivo local mediante URI `file://` para evitar bloqueos del pipeline multimedia de WebView.
- La extracción ZIP valida rutas canónicas para evitar zip-slip y no sobrescribe archivos existentes en el destino.
- La vista previa de entradas ZIP limita la lectura de datos cuyo tamaño no está declarado.
- Para instalar un APK contenido en un ZIP, se copia temporalmente a `cacheDir/zip-apk` y se comparte con el instalador mediante `FileProvider`; el flujo limita la copia a 700 MB. Android conserva el control final de la instalación.
- Las miniaturas de video se obtienen en el dispositivo con `MediaMetadataRetriever`; no requieren API ni conexión a Internet.
- La comprobación de sintaxis JavaScript forma parte del proceso de CI.
- El APK de entrega se firma con la clave debug para facilitar pruebas e instalación directa. Para distribución pública o actualizaciones consistentes, debe configurarse una clave release propia y protegida.

## Permisos y límites de Android

- En Android 11+ el acceso total se concede desde **Ajustes → Acceso a todos los archivos**.
- Android restringe las carpetas `Android/data` y `Android/obb` de otras aplicaciones; no es una limitación específica de esta app.
- `MANAGE_EXTERNAL_STORAGE` es adecuado para instalación directa cuando el uso principal de la app justifica la administración de archivos; Google Play aplica requisitos específicos para publicarlo.

## Pruebas pendientes antes de considerar el proyecto terminado

La compilación correcta no sustituye las pruebas funcionales. Validar en un dispositivo Android o emulador, según corresponda:

- Instalación, primer inicio y concesión/revocación de permisos.
- Navegación WebView offline y ausencia de solicitudes de red no deseadas.
- Crear, copiar, mover, renombrar, eliminar, compartir y abrir archivos.
- Editor TXT y visor de imágenes.
- Crear, previsualizar y extraer ZIP, incluidos archivos existentes y entradas malformadas.
- Abrir un ZIP con un APK, tocar la entrada, confirmar que aparece el instalador de Android y probar tanto la instalación como la cancelación.
- Comprobar miniaturas de video en listas/cuadrículas con distintos formatos, y el icono alternativo para videos dañados o códecs no compatibles.
- Verificar los nombres, el contenido y la instalación del APK descargado desde Actions.

No declarar pruebas en dispositivo físico si no se realizaron.

## Regenerar la vista previa

```bash
python3 preview/build_preview.py W_FILE_MANAGER_preview.html
```


## Cambios recientes (2026-10-15)

- Se añadió la acción para abrir el instalador de Android desde una entrada APK dentro del visor ZIP, usando un archivo temporal en caché privada y `FileProvider`.
- Se añadieron miniaturas locales de video con `MediaMetadataRetriever` y carga bajo demanda en la interfaz.
- Estos cambios están registrados en los commits [a0289cc](https://github.com/wair0/W-FILE-MANAGER/commit/a0289cc8d279887ec92dd67ef33831ba9734e47a), [44ed4c8](https://github.com/wair0/W-FILE-MANAGER/commit/44ed4c861445f91159a904fba427f8124fd8b7a0) y [cfe990e](https://github.com/wair0/W-FILE-MANAGER/commit/cfe990e9f9d8e4818018054e16cb9bb3660992fc).
- La compilación de esos cambios y las pruebas en dispositivo deben confirmarse antes de considerar validada la entrega.

## Menú contextual por pulsación larga (2026-10-15)

- Mantener presionado un archivo o carpeta en listas y cuadrículas abre el menú contextual del elemento.
- El menú ofrece acciones según el tipo: abrir, editar texto, ver contenido ZIP, extraer, copiar, mover, renombrar, comprimir, compartir, favoritos, propiedades y eliminar.
- En escritorio, el clic secundario sobre un elemento también abre el menú contextual.
- Pendiente de validar en dispositivo: pulsación larga, cancelación del gesto y acciones para ZIP y otros tipos de archivo.


## Reproducción multimedia y miniaturas

- Los archivos de audio y vídeo compatibles con Android WebView se abren en un reproductor integrado con controles.
- Si el códec o contenedor no es compatible, el reproductor muestra un aviso y permite abrir el archivo con otra aplicación.
- Las imágenes usan miniaturas JPEG nativas; los vídeos generan miniaturas con `MediaMetadataRetriever` y los PDF muestran la primera página mediante `PdfRenderer`.
- La generación de miniaturas se realiza a demanda y se conserva en memoria durante la sesión. Los formatos dañados o no compatibles mantienen el icono de tipo como alternativa.
- Pendiente: confirmar reproducción y miniaturas en un dispositivo Android real; el soporte de códecs depende de la versión de Android y del archivo.


## Reproductor de vídeo y notificación de audio

- Los vídeos se reproducen con el reproductor nativo de Android `VideoView`, con controles integrados; los formatos/códecs que Android no soporte pueden mostrar un error y requerir otra app.
- La reproducción de audio integrada informa el título y el estado a una notificación con controles de anterior, reproducir/pausar, siguiente y cerrar. Anterior/siguiente recorren los archivos de audio de la lista desde la que se abrió la pista; en la vista expandida de la notificación pueden aparecer todos los controles. En Android 13 o superior, el usuario debe conceder el permiso de notificaciones.
- Pendiente de prueba en dispositivo real; los flujos dependen de la versión de Android y los códecs disponibles.


### Controles de audio en segundo plano (2026-10-15)

- La notificación de audio ahora incluye **Anterior**, **Reproducir/Pausar**, **Siguiente** y **Cerrar**.
- Anterior/siguiente recorren la lista de archivos de audio disponible en la vista desde la que se abrió la pista; al finalizar una pista, la reproducción avanza a la siguiente cuando existe.
- Se mantiene la notificación al pausar al inicio de una pista. Solo la acción explícita **Cerrar** elimina la notificación y cierra el reproductor integrado.
- Pendiente: validar los botones en Android real y confirmar el comportamiento de notificaciones en Android 13+ con permiso concedido y denegado.


### Reproductor de vídeo interno y pantalla completa (2026-10-15)

- Se reemplazó el reproductor basado en `VideoView` por **AndroidX Media3 / ExoPlayer**, que reproduce el archivo local directamente y utiliza los decodificadores de Android. Esto evita depender del reproductor externo y del pipeline de vídeo HTML de WebView.
- El reproductor conserva controles integrados y agrega un botón **⛶** para alternar pantalla completa apaisada, ocultando las barras del sistema; al salir o cerrar se restaura la orientación anterior y se libera el decodificador.
- La app muestra un error de decodificación si el dispositivo no admite el códec del archivo; ningún reproductor puede garantizar formatos/códecs que el dispositivo no soporte.
- La compilación de CI debe confirmar la integración de Media3. Falta validar reproducción real en el dispositivo donde se observó la pantalla negra.


### Abrir ZIP descargados desde Chrome (2026-10-15)

- Se registraron filtros Android `ACTION_VIEW` para los MIME habituales de ZIP, de modo que W FILE MANAGER pueda aparecer en el selector «Abrir con» junto a Google Files.
- Al seleccionar la app, el archivo recibido se copia con un nombre seguro y sin sobrescribir descargas existentes; si está disponible el acceso a todos los archivos, queda en Descargas. Después se abre directamente en el visor ZIP integrado.
- Si todavía no se concedió acceso a todos los archivos, la copia temporal queda en el almacenamiento privado de la app; la extracción debe dirigirse a una carpeta accesible.
- Pendiente de validar con un ZIP descargado desde Chrome en un dispositivo Android real, incluyendo «Solo una vez» y «Siempre».
