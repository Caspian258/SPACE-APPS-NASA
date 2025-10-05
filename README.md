# 🌍 **Asteroid Impact Simulator**

**Asteroid Impact Simulator** es un simulador interactivo que permite visualizar los efectos del impacto de un asteroide en el planeta Tierra. El proyecto permite que los usuarios puedan experimentar con variables ya sea el tamaño, velocidad, densidad y punto de impacto de un asteroide, así como probar medidads de deflexión de impacto de un asteroide, así como probar medidas de deflexión inspiradas en técnicas reales de mitigación. Fue desarrollado como un prototipo frontend standalone, lo que significa que funciona directamente en un navegador sin necesidad de un servidor backend.

---

## 🌌 **Características principales**

* **Simulación Visual:** Incluye un globo terráqueo 3D y un mapa 2D para seleccionar puntos de impacto y visualizar los efectos.

* **Visor de Asteroides:** Una sección dedicada a visualizar un asteroide en 3D y ajustar sus parámetros (velocidad, densidad, rotación) de forma manual o seleccionando un ejemplo.

* **Plantillas para Lógica:** El archivo `script.js` contiene funciones plantilla vacías y bien documentadas, diseñadas para que el equipo del hackathon pueda integrar fácilmente su propio modelo matemático.

* **Accesibilidad**: Cuenta con un modo de color de alto contraste, amigable para personas con daltonismo.

* **¿Cómo Ejecutar?**
    Simplemente abre el archivo index.html en cualquier navegador web moderno.

* **Guía de Archivos de Imagen `/static/`:**
    Para que la interfaz funcione correctamente, asegúrate de que los siguientes archivos de imagen estén en las carpetas correctas y con los nombres especificados.

### Iconos de la Interfaz
#### Ubicación: `/static/img/`

* **asteroid-icon.png**
 Ícono principal que se muestra en la esquina superior derecha. Sirve para abrir el 'Visor de Asteroides'.

* **planet-icon.png**
    Reemplaza al ícono del asteroide cuando el visor está activo. Sirve para cerrar el visor y regresar a la simulación principal.

* **accessibility-icon.png**
    Ícono ubicado en el pie de página. Sirve para activar y desactivar la paleta de colores de alto contraste para daltónicos.

### Texturas 3D
#### Ubicación: `/static/textures/`

* **asteroid-texture.jpg:**
    La imagen que se usa como la "piel" de la esfera 3D para darle apariencia de asteroide en el visor.

---

## 📚 **Fuentes y referencias**

* **NASA NeoWs (Near Earth Object Web Service)** – para datos de asteroides cercanos.
* **USGS Earthquake Data (simulado)** – para referencia de zonas sísmicas.
* Cálculos de energía y cráter basados en modelos simplificados de impacto.

---

## ⚠️ **Aviso**

Este simulador tiene **fines educativos y divulgativos**.
Los resultados son **estimaciones simplificadas** y no deben considerarse como predicciones científicas precisas.

---

## Contribuciones

Este proyecto fue desarrollado como parte de la 4ta edición del Hackathon **NASA International Space Apps Challenge**. No ha existido contribución por parte de terceros para la elaboración de este proyecto.
