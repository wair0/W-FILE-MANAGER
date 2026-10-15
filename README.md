# W FILE MANAGER

Administrador de archivos para Android — **Kotlin + WebView offline** con interfaz HTML/CSS/JS de estilo *High-Tech corporativo / utopía futurista*.

## Funciones
- Header con botón hamburguesa y menú lateral con todas las secciones, menú contextual y barra inferior.
- Inicio con almacenamiento, accesos rápidos, herramientas, dispositivos, favoritos, recientes y estado de permisos.
- Explorador con lista/cuadrícula, migas de pan, ordenar, buscar, selección múltiple, copiar/mover/pegar, renombrar, eliminar, carpetas, propiedades, favoritos, compartir, abrir con y archivos ocultos.
- Visor y extractor ZIP, vista previa de texto/imágenes, extracción completa o selectiva con protección contra zip-slip y creación de ZIP.
- Visor/editor/creador TXT con números de línea, deshacer, buscar, ajuste de línea, tamaño de fuente y guardar/guardar como.
- Visor de imágenes con galería, zoom, cambio por deslizamiento, compartir y eliminar.
- Permisos de almacenamiento adaptados a la versión de Android.

## Identidad de la aplicación
- **Application ID / namespace:** `com.wfilemanager.app`
- **APK de entrega:** `WFILEMANAGER.APK`
- **Paquete de fuentes:** `WFILEMANAGER.zip`

## Obtener los artefactos desde GitHub
El workflow **Build W FILE MANAGER** compila las variantes debug y release en GitHub Actions y publica `WFILEMANAGER.APK` junto con `WFILEMANAGER.zip` como artefactos de la ejecución. Se ejecuta al hacer push a `main` o manualmente desde **Actions → Build W FILE MANAGER → Run workflow**.

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

## Permisos y límites de Android
- En Android 11+ el acceso total se concede desde **Ajustes → Acceso a todos los archivos**.
- Android restringe las carpetas `Android/data` y `Android/obb` de otras aplicaciones; no es una limitación específica de esta app.
- `MANAGE_EXTERNAL_STORAGE` es adecuado para instalación directa cuando el uso principal de la app justifica la administración de archivos; Google Play aplica requisitos específicos para publicarlo.

## Regenerar la vista previa
```bash
python3 preview/build_preview.py W_FILE_MANAGER_preview.html
```
