# W FILE MANAGER

Gestor de archivos para Android.

## Arquitectura obligatoria

- **HTML/CSS:** estructura, diseño adaptable, temas, iconos y animaciones de interfaz.
- **JavaScript:** interacción de interfaz y llamadas al puente nativo.
- **GLSL/WebGL:** efectos gráficos opcionales (con degradación si no hay WebGL).
- **Kotlin:** lógica de negocio, operaciones de archivos, permisos, cifrado, persistencia e integración con Android.
- **WebView:** contenedor de la UI web empaquetada localmente. **No** se implementan pantallas con Jetpack Compose.

## Acceso a almacenamiento (Fase 3)

Se usa **Storage Access Framework (SAF)** únicamente:

- El usuario elige una carpeta con `ACTION_OPEN_DOCUMENT_TREE`.
- Los permisos se hacen persistentes con `takePersistableUriPermission`.
- No se solicita `MANAGE_EXTERNAL_STORAGE` ni acceso global al almacenamiento.
- Lectura/escritura de hijos con `DocumentsContract`.

Matriz resumida:

| Android | Enfoque |
|---------|---------|
| 8.0+ (minSdk 26) | SAF + URI persistente |
| Denegación / revocación | Mensaje en UI y estado limpio |
| SD externa | Solo si el selector del sistema la ofrece |

## Plan maestro (estado)

1. Base Android compilable y puente WebView/Kotlin — **COMPLETA** (CI genera APK debug).
2. Identidad visual, temas y navegación — **COMPLETA** (tema claro/oscuro, drawer, bottom nav, lista/cuadrícula).
3. Permisos y acceso SAF — **COMPLETA**.
4. Explorador real (búsqueda, orden, rename/delete/copy/move, abrir) — **COMPLETA**.
5. Inicio, categorías, destacados y carpeta segura (flujo) — **COMPLETA** (cifrado real = Fase 7).
6. ZIP, editor de texto y apertura multimedia — pendiente.
7. Cifrado robusto y protección de la carpeta segura — pendiente.
8. Persistencia avanzada (Room/DataStore) — pendiente (favoritos ya usan SharedPreferences).
9. Pruebas, accesibilidad, seguridad y release — pendiente.

## Compilación

- AGP 8.7.3 · Kotlin 2.0.21 · compileSdk/targetSdk 35 · minSdk 26 · JDK 17
- CI: GitHub Actions (`android-ci.yml`) con Gradle 8.9 y artifact APK debug.
- Local: abrir el proyecto en Android Studio o usar Gradle compatible con las versiones anteriores.

## Versión

`0.5.0` — explorador operativo + inicio/categorías/segura (UI).
