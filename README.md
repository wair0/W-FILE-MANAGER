# W FILE MANAGER

Gestor de archivos Android con arquitectura separada:
- **HTML/CSS**: estructura, diseño adaptable, temas, iconos y animaciones.
- **JavaScript**: interacción de la interfaz y comunicación mediante una API limitada.
- **GLSL/WebGL**: efectos gráficos opcionales.
- **Kotlin**: lógica de negocio e integración nativa con Android.

## Estado
Fase 1: base Android con WebView local y puente JavaScript-Kotlin.
Las operaciones reales de archivos se incorporarán en fases posteriores. No se debe exponer acceso arbitrario al sistema de archivos a JavaScript.

## Estructura
- `app/src/main/assets/www/`: interfaz web local.
- `app/src/main/java/com/w/files/`: aplicación nativa Kotlin.
