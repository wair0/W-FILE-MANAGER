# W FILE MANAGER

Administrador de archivos para Android — **Kotlin + WebView offline** con interfaz HTML/CSS/JS de estilo *High-Tech corporativo / utopía futurista*.

## Funciones

- Header con botón hamburguesa, menú lateral, menú contextual y barra inferior.
- Inicio simplificado con recientes horizontales, accesos rápidos, dispositivos y favoritos.
- Explorador con lista/cuadrícula, migas de pan, ordenar, buscar, selección múltiple, copiar/mover/pegar, renombrar, eliminar, carpetas, propiedades, favoritos, compartir, abrir con y archivos ocultos.
- Visor y extractor ZIP, vista previa de texto/imágenes, extracción completa o selectiva con protección contra zip-slip y contra sobrescritura accidental de archivos existentes, y creación de ZIP.
- Visor/editor/creador TXT con números de línea, deshacer, buscar, ajuste de línea, tamaño de fuente y guardar/guardar como.
- Visor de imágenes con galería, zoom, cambio por deslizamiento, compartir y eliminar.
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

- La WebView bloquea solicitudes de recursos HTTP/HTTPS; la interfaz y sus recursos se cargan localmente.
- La extracción ZIP valida rutas canónicas para evitar zip-slip y no sobrescribe archivos existentes en el destino.
- La vista previa de entradas ZIP limita la lectura de datos cuyo tamaño no está declarado.
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
- Verificar los nombres, el contenido y la instalación del APK descargado desde Actions.

No declarar pruebas en dispositivo físico si no se realizaron.

## Regenerar la vista previa

```bash
python3 preview/build_preview.py W_FILE_MANAGER_preview.html
```
