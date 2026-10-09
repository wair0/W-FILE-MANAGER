# W FILE MANAGER

Gestor de archivos para Android.

## Arquitectura obligatoria
- **HTML/CSS:** estructura, diseño adaptable, temas, iconos y animaciones de interfaz.
- **JavaScript:** interacción de interfaz y llamadas al puente nativo.
- **GLSL/WebGL:** efectos gráficos opcionales.
- **Kotlin:** lógica de negocio, operaciones de archivos, permisos, cifrado, persistencia e integración con Android.
- **WebView:** contenedor de la UI web empaquetada localmente. No se deben implementar pantallas con Jetpack Compose.

## Plan maestro
1. Base Android compilable y puente WebView/Kotlin.
2. Identidad visual, icono, temas y navegación.
3. Permisos y acceso a almacenamiento interno/externo.
4. Explorador real, búsqueda, selección y operaciones.
5. Inicio, categorías, destacados y carpeta segura.
6. ZIP, editor de texto y apertura externa de medios.
7. Cifrado robusto y protección de la carpeta segura.
8. Persistencia de favoritos y preferencias.
9. Pruebas, accesibilidad, revisión de seguridad y release.

Cada fase tendrá uno o dos commits y criterios verificables. Una fase no se considera terminada sin validación; la APK y las pruebas de Android deben ejecutarse en un entorno con Android SDK/Gradle disponibles.

## Estado actual
La base inicial de WebView y los recursos HTML/CSS/JavaScript están publicados. Las operaciones reales de archivos todavía no están implementadas.
