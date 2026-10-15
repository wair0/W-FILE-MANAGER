# W FILE MANAGER

Administrador de archivos para Android — **Kotlin + WebView offline** con interfaz HTML/CSS/JS de estilo *High-Tech corporativo / utopía futurista*.

## Funciones
- Header con botón hamburguesa y menú lateral con **todas las secciones**; menú contextual (⋮) y barra inferior.
- **Inicio**: almacenamiento (anillo + barras), acceso rápido por categorías, herramientas, dispositivos, favoritos, recientes y estado de permisos.
- **Explorador**: lista/cuadrícula, migas de pan, ordenar, buscar, selección múltiple (pulsación larga), copiar / mover / pegar, renombrar, eliminar, nueva carpeta, propiedades, favoritos, compartir, abrir con…, archivos ocultos.
- **Visor y extractor ZIP**: navegar dentro del ZIP, previsualizar texto/imágenes, extraer todo o selección (protección *zip-slip*), crear ZIP desde la selección.
- **Visor / editor / creador TXT**: números de línea, deshacer, buscar, ajuste de línea, tamaño de fuente, guardar / guardar como.
- **Visor de imágenes**: galería, pellizcar para zoom, doble toque, deslizar para cambiar, compartir y eliminar.
- Permisos: `MANAGE_EXTERNAL_STORAGE` (acceso total / administración de archivos), `READ/WRITE_EXTERNAL_STORAGE` y `READ_MEDIA_*` (almacenamiento interno).

## Compilar con GitHub (sin instalar nada)
1. Crea un repositorio vacío en GitHub y sube **todo el contenido de este ZIP en la raíz** (puedes hacerlo con el conector de GitHub de ChatGPT).
2. El workflow `.github/workflows/build.yml` se ejecuta solo en cada *push* (o manualmente en *Actions → Build W FILE MANAGER APK → Run workflow*).
3. Al terminar, descarga el artefacto **W-FILE-MANAGER-apk** (contiene `app-debug.apk` y `app-release.apk`, ambos instalables).

## Compilar en local
```
gradle assembleDebug          # requiere Gradle 8.7+, JDK 17 y Android SDK 34
```
(En Android Studio basta con abrir la carpeta; si quieres wrapper: `gradle wrapper --gradle-version 8.7`.)

## Estructura
```
app/src/main/java/com/wairo/wfilemanager/  MainActivity.kt (WebView + puente JS) · FileOps.kt (operaciones de archivos)
app/src/main/assets/www/                   index.html · css/app.css · js/app.js  (UI offline)
preview/                                   mock + script para generar el HTML de vista previa en navegador
```

## Notas importantes sobre permisos
- En Android 11+ el acceso total se concede en **Ajustes → Acceso a todos los archivos**; la app abre esa pantalla al pulsar *Conceder acceso total*.
- Android sigue bloqueando a cualquier app las carpetas `Android/data` y `Android/obb` de otras aplicaciones (Android 11+/13+); es una restricción del sistema, no de la app.
- `MANAGE_EXTERNAL_STORAGE` es válido para instalación directa (APK). Google Play exige una justificación para publicarlo.

## Regenerar la vista previa HTML
```
python3 preview/build_preview.py W_FILE_MANAGER_preview.html
```
