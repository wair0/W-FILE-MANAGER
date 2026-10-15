# W FILE MANAGER — CONTINUIDAD DEL PROYECTO

Fecha de actualización: 2026-10-15
Rama de trabajo: `main`
Repositorio: https://github.com/wair0/W-FILE-MANAGER/

## Objetivos obligatorios

- Android applicationId y namespace: `com.wfilemanager.app`.
- Nombre del APK: `WFILEMANAGER.APK`.
- Nombre del ZIP de fuentes: `WFILEMANAGER.zip`.
- Nombre del artefacto descargable de GitHub Actions: `WFILEMANAGER` (quitar `DELIVERABLES` del nombre del artefacto).
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

El artefacto descargable debe llamarse `WFILEMANAGER` y contener exactamente los entregables esperados:
- `WFILEMANAGER.APK`
- `WFILEMANAGER.zip`

## Próximas tareas

1. Confirmar que el workflow más reciente termina correctamente tras los cambios de nombre y CI.
2. Comprobar que el artefacto se publica como `WFILEMANAGER`, sin `DELIVERABLES`, y que incluye los dos archivos con sus nombres exactos.
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

- Se inspeccionó el workflow `.github/workflows/build.yml`: compila debug y release, ejecuta `node --check app/src/main/assets/www/app.js` y sube los dos entregables con `if-no-files-found: error`.
- La ejecución `38699201417` terminó con conclusión `success`; el job `Build APK and source package` y sus pasos de validación JS, compilación, preparación y subida finalizaron correctamente.
- El artefacto publicado se llama exactamente `WFILEMANAGER` y está asociado al commit `9ed3bac4448b3872de8ad12de08ea1496d414dec`, que incluye el cambio de nombre de artefacto `550da9c6b34e0f26f2f36f01660e9dc1b54a3815`.
- Se descargó e inspeccionó el ZIP del artefacto: contiene directamente `WFILEMANAGER.APK` (2.546.604 bytes) y `WFILEMANAGER.zip` (252.683 bytes). No hay un ZIP adicional envolviendo los entregables.
- Las comprobaciones de integridad ZIP finalizaron sin errores para el artefacto, el APK y el ZIP de fuentes. El APK contiene `AndroidManifest.xml`, archivos DEX y recursos `assets/www/`; el ZIP de fuentes contiene archivos Gradle y la interfaz web.
- SHA-256 del APK inspeccionado: `5f71da0712947dd397101df38989874fd2e86fb8f15e3837623955263c408a11`.
- El artefacto expira el 2026-10-29. Descarga desde [GitHub Actions](https://github.com/wair0/W-FILE-MANAGER/actions) antes de esa fecha.
- **Pendiente:** todavía no se ha confirmado por estas comprobaciones el `applicationId` extraído del manifiesto ni la firma mediante herramientas Android; tampoco se han realizado pruebas de instalación o uso en un dispositivo físico. La integridad del paquete y el éxito de CI no sustituyen esas pruebas.

## Siguiente avance recomendado

1. Validar `applicationId` y certificado de firma del APK generado con herramientas Android y registrar sus resultados.
2. Ejecutar pruebas funcionales de instalación, permisos y operaciones de archivos en un dispositivo o emulador disponible; documentar por separado cada resultado.
3. Revisar con pruebas específicas la extracción ZIP (entradas duplicadas, rutas maliciosas, archivos grandes y fallos parciales) y las operaciones de mover/copiar en destinos con permisos limitados.
