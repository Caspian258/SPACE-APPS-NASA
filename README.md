Asteroid Impact Simulator (Versión Hackathon)
Este proyecto es un simulador interactivo que permite visualizar los efectos del impacto de un asteroide en la Tierra. Fue desarrollado como un prototipo frontend standalone, lo que significa que funciona directamente en un navegador sin necesidad de un servidor backend.

Características Principales
Simulación Visual: Incluye un globo terráqueo 3D y un mapa 2D para seleccionar puntos de impacto y visualizar los efectos.

Visor de Asteroides: Una sección dedicada a visualizar un asteroide en 3D y ajustar sus parámetros (velocidad, densidad, rotación) de forma manual o seleccionando un ejemplo.

Plantillas para Lógica: El archivo script.js contiene funciones plantilla vacías y bien documentadas, diseñadas para que el equipo del hackathon pueda integrar fácilmente su propio modelo matemático.

Accesibilidad: Cuenta con un modo de color de alto contraste, amigable para personas con daltonismo.

Cómo Ejecutar
Simplemente abre el archivo index.html en cualquier navegador web moderno.

Guía de Archivos de Imagen (/static/)
Para que la interfaz funcione correctamente, asegúrate de que los siguientes archivos de imagen estén en las carpetas correctas y con los nombres especificados.

Iconos de la Interfaz
Ubicación: /static/img/

asteroid-icon.png

Descripción: Ícono principal que se muestra en la esquina superior derecha. Sirve para abrir el 'Visor de Asteroides'.

planet-icon.png

Descripción: Reemplaza al ícono del asteroide cuando el visor está activo. Sirve para cerrar el visor y regresar a la simulación principal.

accessibility-icon.png

Descripción: Ícono ubicado en el pie de página. Sirve para activar y desactivar la paleta de colores de alto contraste para daltónicos.

Texturas 3D
Ubicación: /static/textures/

asteroid-texture.jpg

Descripción: La imagen que se usa como la "piel" de la esfera 3D para darle apariencia de asteroide en el visor.