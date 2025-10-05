// Versión Hackathon (frontend standalone)
// - No hay llamadas al backend. Todo sucede en el navegador.
// - Las funciones marcadas con // TODO: son plantillas para que el equipo inserte su modelo matemático.

// Paleta de colores para zonas
const zoneColors = {
  crater: '#ffcc00',
  total: '#ff4d4d',
  severe: '#ff784d',
};

// Estado básico
let selectedLat = null;
let selectedLon = null;
let impactMarker = null;
let effectLayers = [];
let seismicLayer = null;
let populationLayer = null;
let moonAngle = 0;
let moonOrbitRadius = 0.75;
let moonOrbitSpeed = 0.01;
let orbitControls = null;
let avDragging = false;
let avPreviousMouseX = 0;
let avPreviousMouseY = 0;
let avRotSpeed = 0.01;
let casualtyCircles = [];
let seismicCircles = [];
let currentVisualization = 'crater'; // Default view
let craterCircle = null;

// UI
const diameterInput = document.getElementById('diameter'); 
const velocityInput = document.getElementById('velocity');
const densityInput = document.getElementById('density');
const mitigationInput = document.getElementById('mitigation');
const simulateBtn = document.getElementById('simulateBtn');
const diameterValue = document.getElementById('diameterValue');
const velocityValue = document.getElementById('velocityValue');
const mitigationValue = document.getElementById('mitigationValue');
const energyOut = document.getElementById('energy');
const craterOut = document.getElementById('crater');
const magnitudeOut = document.getElementById('magnitude');
const impactCoords = document.getElementById('impactCoords');
const probabilityDebugOut = document.getElementById('probability-result');
const calculateProbBtn = document.getElementById('calculate-prob-btn');



const loadNeoBtn = document.getElementById('loadNeoBtn');
const neoPicker = document.getElementById('neoPicker');
const neoSelect = document.getElementById('neoSelect');
const neoDetails = document.getElementById('neoDetails');
const applyNeo = document.getElementById('applyNeo');
const closeNeo = document.getElementById('closeNeo');
const neoStart = document.getElementById('neoStart');
const neoEnd = document.getElementById('neoEnd');
const neoMinDiameter = document.getElementById('neoMinDiameter');
const neoHistoryEl = document.getElementById('neoHistory');
const neoMinVel = document.getElementById('neoMinVel');
const neoMaxVel = document.getElementById('neoMaxVel');
const neoSearch = document.getElementById('neoSearch');

const translations = {
  es: {
    title: 'Asteroid Impact Simulator',
    subtitle: 'Explora el impacto de asteroides y estrategias de mitigación.',
    'mode.primaryAria': 'Selecciona el modo principal',
    'mode.impact': 'Simulación de Impacto',
    'mode.orbit': 'Simulación de Órbita',
    'orbit.placeholderTitle': 'Simulación de Órbita',
    'orbit.placeholderDescription': 'Interactúa con la vista 3D para seguir la órbita seleccionada y revisa los detalles del objeto en el panel derecho.',
    controlPanelHeading: 'Panel de Control',
    'label.diameter': 'Diámetro del Asteroide (m)',
    'label.velocity': 'Velocidad del Asteroide (km/s)',
    'label.density': 'Densidad (kg/m³)',
    'label.selectImpact': 'Selecciona el punto de impacto',
    'label.mitigation': 'Ángulo de impacto (°)',
    'button.simulate': '¡Simular Impacto!',
    'button.view3D': 'Mostrar globo 3D',
    'button.view2D': 'Mostrar mapa 2D',
    'label.catalogHeading': 'Catálogo de objetos',
    'radio.asteroids': 'Asteroides',
    'radio.comets': 'Cometas',
    'label.selectObject': 'Selecciona un objeto',
    'label.filterName': 'Buscar por nombre',
    'placeholder.filterName': 'ej. Apophis',
    'label.filterMinDiameter': 'Diámetro mínimo (km)',
    'label.filterMinVelocity': 'Velocidad mínima (km/s)',
    'placeholder.numeric': '0.0',
    'label.discoveryRange': 'Rango de descubrimiento',
    'button.calculateProbability': 'Calcular probabilidad de impacto',
    'option.loadingCatalog': 'Cargando catálogo...',
    'option.emptyCatalog': 'No hay datos disponibles',
    'message.noDataAvailable': 'No hay datos disponibles',
    'message.selectFromCatalog': 'Elige un objeto del catálogo',
    'summary.type.asteroid': 'Asteroide',
    'summary.type.comet': 'Cometa',
    'summary.diameter': 'Diámetro',
    'summary.semiMajor': 'a',
    'summary.eccentricity': 'e',
    'details.name': 'Nombre',
    'details.type': 'Tipo',
    'details.type.asteroid': 'Asteroide',
    'details.type.comet': 'Cometa',
    'details.estimatedDiameter': 'Diámetro estimado',
    'details.modelDensity': 'Densidad del modelo',
    'details.rotationPeriod': 'Periodo de rotación aprox.',
    'details.velocity': 'Velocidad estimada',
    'details.semiMajor': 'Semieje mayor (a)',
    'details.eccentricity': 'Excentricidad (e)',
    'details.inclination': 'Inclinación (i)',
    'details.ascendingNode': 'Nodo ascendente (Ω)',
    'details.argPeriapsis': 'Argumento del perihelio (ω)',
    'details.orbitalPeriod': 'Periodo orbital',
    'details.discovery': 'Descubierto',
    'details.rotationHours': 'h',
    'units.years': 'años',
    resultsHeading: 'Resultados',
    'results.energy': 'Energía del impacto:',
    'results.craterType': 'Tipo de cráter:',
    'results.initialDiameter': 'Diámetro inicial:',
    'results.finalDiameter': 'Diámetro final:',
    'results.finalDepth': 'Profundidad final:',
    'results.rimHeight': 'Altura del borde:',
    'results.probability': 'Probabilidad de impacto orbital (debug):',
    'units.megatons': 'Megatones',
    'units.meters': 'm',
    'neo.heading': 'Elige un NEO',
    'neo.source': 'Fuente: NASA NeoWs (demo)',
    'button.apply': 'Aplicar',
    'button.close': 'Cerrar',
    'viewer.heading': 'Visor de asteroides',
    'viewer.modeLabel': 'Modo',
    'viewer.modeManual': 'Modo manual',
    'viewer.modeApi': 'Modo API',
    'viewer.modeHint': 'Toca para alternar entre Manual y API',
    'viewer.manual.diameter': 'Diámetro (km)',
    'viewer.manual.speed': 'Velocidad (unidades)',
    'viewer.manual.density': 'Densidad (kg/m³)',
    'viewer.manual.rotation': 'Rotación (°/s)',
    'viewer.api.sourceLabel': 'Fuente de datos',
    'viewer.api.listLabel': 'Lista del catálogo',
    'viewer.api.detailsLabel': 'Detalles',
    'footer.disclaimer': 'Datos: APIs de la NASA y USGS (simulado). Este simulador es educativo y simplificado. (Frontend independiente)',
    'menu.accessibility': 'Accesibilidad y ayuda',
    'menu.colorToggle': 'Modo daltonismo',
    'menu.faq': 'Preguntas frecuentes',
    'menu.languageLabel': 'Idioma',
    'menu.lang.es': 'Español',
    'menu.lang.en': 'Inglés',
    'faq.title': 'Preguntas frecuentes',
    'faq.q1': '¿Cómo elijo un punto de impacto?',
    'faq.a1': 'Usa el mapa de selección en el panel izquierdo y haz clic en la ubicación deseada. El marcador muestra las coordenadas exactas.',
    'faq.q2': '¿Qué hace el modo daltonismo?',
    'faq.a2': 'Activa una paleta de alto contraste diseñada para usuarios con deficiencia de visión cromática y condiciones de baja visibilidad.',
    'faq.q3': '¿Cómo cambio entre asteroides y cometas?',
    'faq.a3': 'Utiliza los botones de radio en el catálogo o en el visor 3D para alternar entre los conjuntos de datos disponibles.',
    'faq.closeAria': 'Cerrar'
  },
  en: {
    title: 'Asteroid Impact Simulator',
    subtitle: 'Explore asteroid impacts and mitigation strategies.',
    'mode.primaryAria': 'Select the primary mode',
    'mode.impact': 'Impact Simulation',
    'mode.orbit': 'Orbit Simulation',
    'orbit.placeholderTitle': 'Orbit Simulation',
    'orbit.placeholderDescription': 'Use the 3D view to explore the selected orbit and review the object details in the right-hand panel.',
    controlPanelHeading: 'Control Panel',
    'label.diameter': 'Asteroid Diameter (m)',
    'label.velocity': 'Asteroid Velocity (km/s)',
    'label.density': 'Density (kg/m³)',
    'label.selectImpact': 'Select the impact point',
    'label.mitigation': 'Impact angle (°)',
    'button.simulate': 'Run Impact Simulation',
    'button.view3D': 'Show 3D Globe',
    'button.view2D': 'Show 2D Map',
    'label.catalogHeading': 'Object Catalog',
    'radio.asteroids': 'Asteroids',
    'radio.comets': 'Comets',
    'label.selectObject': 'Select object',
    'label.filterName': 'Search by name',
    'placeholder.filterName': 'e.g., Apophis',
    'label.filterMinDiameter': 'Minimum diameter (km)',
    'label.filterMinVelocity': 'Minimum velocity (km/s)',
    'placeholder.numeric': '0.0',
    'label.discoveryRange': 'Discovery date range',
    'button.calculateProbability': 'Compute Impact Probability',
    'option.loadingCatalog': 'Loading catalog...',
    'option.emptyCatalog': 'No data available',
    'message.noDataAvailable': 'No data available',
    'message.selectFromCatalog': 'Pick an object from the catalog',
    'summary.type.asteroid': 'Asteroid',
    'summary.type.comet': 'Comet',
    'summary.diameter': 'Diameter',
    'summary.semiMajor': 'a',
    'summary.eccentricity': 'e',
    'details.name': 'Name',
    'details.type': 'Type',
    'details.type.asteroid': 'Asteroid',
    'details.type.comet': 'Comet',
    'details.estimatedDiameter': 'Estimated diameter',
    'details.modelDensity': 'Model density',
    'details.rotationPeriod': 'Approx. rotation period',
    'details.velocity': 'Estimated velocity',
    'details.semiMajor': 'Semi-major axis (a)',
    'details.eccentricity': 'Eccentricity (e)',
    'details.inclination': 'Inclination (i)',
    'details.ascendingNode': 'Ascending node (Ω)',
    'details.argPeriapsis': 'Argument of perihelion (ω)',
    'details.orbitalPeriod': 'Orbital period',
    'details.discovery': 'Discovered',
    'details.rotationHours': 'h',
    'units.years': 'years',
    resultsHeading: 'Results',
    'results.energy': 'Impact Energy:',
    'results.craterType': 'Crater type:',
    'results.initialDiameter': 'Initial diameter:',
    'results.finalDiameter': 'Final diameter:',
    'results.finalDepth': 'Final depth:',
    'results.rimHeight': 'Rim height:',
    'results.probability': 'Orbit Impact Probability (debug):',
    'units.megatons': 'Megatons',
    'units.meters': 'm',
    'neo.heading': 'Choose a NEO',
    'neo.source': 'Source: NASA NeoWs (demo)',
    'button.apply': 'Apply',
    'button.close': 'Close',
    'viewer.heading': 'Asteroid Viewer',
    'viewer.modeLabel': 'Mode',
    'viewer.modeManual': 'Manual Mode',
    'viewer.modeApi': 'API Mode',
    'viewer.modeHint': 'Tap to switch between Manual and API',
    'viewer.manual.diameter': 'Diameter (km)',
    'viewer.manual.speed': 'Speed (units)',
    'viewer.manual.density': 'Density (kg/m³)',
    'viewer.manual.rotation': 'Rotation (°/s)',
    'viewer.api.sourceLabel': 'Data source',
    'viewer.api.listLabel': 'Catalog list',
    'viewer.api.detailsLabel': 'Details',
    'footer.disclaimer': 'Data: NASA APIs and USGS (simulated). This simulator is educational and simplified. (Standalone front-end)',
    'menu.accessibility': 'Accessibility & help',
    'menu.colorToggle': 'Colorblind mode',
    'menu.faq': 'Frequently Asked Questions',
    'menu.languageLabel': 'Language',
    'menu.lang.es': 'Spanish',
    'menu.lang.en': 'English',
    'faq.title': 'Frequently Asked Questions',
    'faq.q1': 'How do I choose an impact point?',
    'faq.a1': 'Use the selection map in the left panel and click the desired location. The marker shows the exact coordinates.',
    'faq.q2': 'What does colorblind mode do?',
    'faq.a2': 'Enables a high-contrast palette designed for users with color vision deficiency and low-visibility conditions.',
    'faq.q3': 'How do I switch between asteroids and comets?',
    'faq.a3': 'Use the radio buttons in the catalog or in the 3D viewer to swap between the available datasets.',
    'faq.closeAria': 'Close'
  }
};

const LANGUAGE_STORAGE_KEY = 'simulator-language';
let currentLanguage = 'es';

function applyTextTranslation(elements, dict, attribute, callback) {
  elements.forEach((el) => {
    const key = el.getAttribute(attribute);
    if (!key) return;
    const value = dict[key];
    if (typeof value === 'undefined') return;
    callback(el, value);
  });
}

function translate(key) {
  if (!key) return '';
  const dict = translations[currentLanguage] || translations.es;
  if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
  const fallback = translations.es;
  if (fallback && Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
  return '';
}

function setLanguage(lang) {
  if (!translations[lang]) {
    lang = 'es';
  }
  currentLanguage = lang;
  const dict = translations[lang];
  document.documentElement.setAttribute('lang', lang);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (_) {}

  applyTextTranslation(document.querySelectorAll('[data-i18n]'), dict, 'data-i18n', (el, value) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = value;
    } else {
      el.textContent = value;
    }
  });

  applyTextTranslation(document.querySelectorAll('[data-i18n-placeholder]'), dict, 'data-i18n-placeholder', (el, value) => {
    el.setAttribute('placeholder', value);
  });

  applyTextTranslation(document.querySelectorAll('[data-i18n-aria-label]'), dict, 'data-i18n-aria-label', (el, value) => {
    el.setAttribute('aria-label', value);
  });

  const menuButton = document.getElementById('accessibilityMenuButton');
  if (menuButton) {
    const label = dict['menu.accessibility'];
    if (label) {
      menuButton.title = label;
      const icon = menuButton.querySelector('img');
      if (icon) icon.alt = label;
    }
  }

  document.querySelectorAll('.lang-option').forEach((btn) => {
    const option = btn.getAttribute('data-lang-option');
    btn.classList.toggle('active', option === lang);
  });

  updateSliderDisplays();
  updateObjectSummary(getCurrentSelectedItem());
  refreshOrbitDetails();
}

// Vistas
const map2D = document.getElementById('map2D');
const globe3DContainer = document.getElementById('globe3D');
const objectSelect = document.getElementById('objectSelect');
const objectSummary = document.getElementById('objectSummary');
const datasetMainRadios = document.querySelectorAll('input[name="datasetMain"]');
const filterNameInput = document.getElementById('filterName');
const filterMinDiameterInput = document.getElementById('filterMinDiameter');
const filterMinVelocityInput = document.getElementById('filterMinVelocity');
const filterDateStartInput = document.getElementById('filterDateStart');
const filterDateEndInput = document.getElementById('filterDateEnd');
const primaryModeRadios = document.querySelectorAll('input[name="primaryMode"]');
const impactModeContainer = document.getElementById('impactModeContainer');
const orbitModeContainer = document.getElementById('orbitModeContainer');
const craterImageWrapper = document.getElementById('craterImageWrapper');
const craterImage = document.getElementById('crater-image');
const IMPACT_HIDE_CLASS = 'impact-mode-hide';
let currentPrimaryMode = 'impact';

function initializeImpactModeVisibility() {
  if (!impactModeContainer) return;

  const controlPanel = impactModeContainer.querySelector('.panel.control');
  if (controlPanel) {
    const allowedElements = new Set();
    const heading = controlPanel.querySelector('h2');
    if (heading) allowedElements.add(heading);
    const diameterGroup = diameterInput?.closest('.control-group');
    const velocityGroup = velocityInput?.closest('.control-group');
    const densityGroup = densityInput?.closest('.control-group');
    const mapGroup = document.getElementById('selectMap')?.closest('.control-group');
    [diameterGroup, velocityGroup, densityGroup, mapGroup].forEach((el) => {
      if (el) allowedElements.add(el);
    });
    if (simulateBtn) {
      allowedElements.add(simulateBtn);
    }

    Array.from(controlPanel.children).forEach((child) => {
      if (!allowedElements.has(child)) {
        child.classList.add(IMPACT_HIDE_CLASS);
      }
    });
  }

  const probabilityItem = document.getElementById('probability-result')?.closest('li');
  if (probabilityItem) {
    probabilityItem.classList.add(IMPACT_HIDE_CLASS);
  }

  const neoPicker = document.getElementById('neoPicker');
  if (neoPicker) {
    neoPicker.classList.add(IMPACT_HIDE_CLASS);
  }
}

function updateCraterImageDisplay(craterTypeValue) {
  if (!craterImageWrapper || !craterImage) return;

  const normalized = (craterTypeValue || '').toLowerCase();
  let src = '';

  if (normalized.includes('simple')) {
    src = './static/img/crater_simple.jpeg';
  } else if (normalized.includes('complejo') || normalized.includes('complex')) {
    src = './static/img/crater_complejo.jpeg';
  }

  if (src) {
    if (craterImage.getAttribute('src') !== src) {
      craterImage.setAttribute('src', src);
    }
    craterImageWrapper.classList.remove('hidden');
  } else {
    craterImage.removeAttribute('src');
    craterImageWrapper.classList.add('hidden');
  }
}

function setPrimaryMode(mode) {
  const nextMode = mode === 'orbit' ? 'orbit' : 'impact';
  currentPrimaryMode = nextMode;

  if (impactModeContainer) {
    impactModeContainer.classList.remove('hidden');
  }

  if (orbitModeContainer) {
    orbitModeContainer.classList.toggle('hidden', nextMode !== 'orbit');
  }

  if (nextMode === 'impact') {
    if (globe3DContainer) {
      globe3DContainer.classList.add('hidden');
    }
    if (map2D) {
      map2D.classList.remove('hidden');
      try {
        map.invalidateSize();
      } catch (err) {
        // Map may not be initialized yet; ignore.
      }
    }
  } else {
    if (map2D) {
      map2D.classList.add('hidden');
    }
    if (globe3DContainer) {
      globe3DContainer.classList.remove('hidden');
      requestAnimationFrame(() => {
        if (typeof onResize === 'function') {
          onResize();
        }
        if (typeof resizeAsteroidViewer === 'function') {
          resizeAsteroidViewer();
        }
      });
    }
  }

  primaryModeRadios.forEach((radio) => {
    const isActive = radio.value === nextMode;
    if (radio.checked !== isActive) {
      radio.checked = isActive;
    }
    radio.closest('.mode-option')?.classList.toggle('mode-option--active', isActive);
  });

  document.body.classList.toggle('impact-mode-active', nextMode === 'impact');
  document.body.classList.toggle('orbit-mode-active', nextMode === 'orbit');
}

if (primaryModeRadios.length) {
  initializeImpactModeVisibility();
  primaryModeRadios.forEach((radio) => {
    radio.addEventListener('change', (event) => {
      setPrimaryMode(event.target.value);
    });
  });
}

// Visor de Asteroides UI refs
const apiAsteroidDetails = document.getElementById('apiAsteroidDetails');
const asteroidCanvas = document.getElementById('asteroidCanvas');




// Mostrar valores de sliders
function updateSliderDisplays() {
  diameterValue.textContent = `${diameterInput.value} m`;
  velocityValue.textContent = `${Number(velocityInput.value).toFixed(1)} km/s`;
  mitigationValue.textContent = `${Number(mitigationInput.value).toFixed(0)}°`;
}
[diameterInput, velocityInput, mitigationInput].forEach(el => el && el.addEventListener('input', updateSliderDisplays));
updateSliderDisplays();

if (calculateProbBtn) {
  calculateProbBtn.addEventListener('click', () => {
    const selectedObject = getCurrentSelectedItem();
    computeAndDisplayImpactProbability(selectedObject, { source: 'button' });
  });
}

// Leaflet: mapa de selección (pequeño)
const selectionMap = L.map('selectMap', {
  worldCopyJump: true,
  attributionControl: false,
  zoomControl: false
}).setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 13 }).addTo(selectionMap);
selectionMap.on('click', (e) => {
  selectedLat = e.latlng.lat;
  selectedLon = e.latlng.lng;
  impactCoords.textContent = `Lat: ${selectedLat.toFixed(3)}, Lon: ${selectedLon.toFixed(3)}`;
  if (impactMarker) selectionMap.removeLayer(impactMarker);
  impactMarker = L.marker([selectedLat, selectedLon]).addTo(selectionMap);
});

// Leaflet: mapa principal
const map = L.map('map2D').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 13 }).addTo(map);

if (primaryModeRadios.length) {
  setPrimaryMode('impact');
}


// Vistas 2D/3D
// --- Variables globales ---
const THREE_NS = window.THREE;
let renderer, scene, camera;
let earthMesh, moonMesh, sunMesh, starSphere;
let earthGroup, sunGroup, sunLight;
let isDragging = false;

let rotVelX = 0, rotVelY = 0; 
const rotationDamping = 0.95; 
const rotationSpeedFactor = 0.005; 
// Contenedor para el Sol
let sunAngle = 0; 
const sunOrbitRadius = 5; 
const sunOrbitSpeed = 0.002; 
let isPaused = false;


// Variable para controlar el seguimiento de la Tierra
let isFollowingEarth = false; 

// Contenedor del DOM (USANDO NOMBRE ALTERNATIVO: threeContainer)
const threeContainer = globe3DContainer || { 
    clientWidth: 600, 
    clientHeight: 400, 
    innerHTML: '', 
    appendChild: () => {} 
};
// --- Función genérica para crear planetas -__
function createPlanet({
    name,
    texturePath,
    radius = 1,
    segments = 64,
    shininess = 5,
    specular = 0x333333,
    transparent = false,
    opacity = 1,
    emissive = 0x000000
}) {
    const textureLoader = new THREE_NS.TextureLoader();
    const texture = textureLoader.load(
        texturePath,
        () => console.log(`🪐 Textura de ${name} cargada`),
        undefined,
        (err) => console.warn(`⚠️ Error al cargar textura de ${name}:`, err)
    );

    // MeshPhongMaterial es esencial para que la luz y las sombras funcionen.
    const material = new THREE_NS.MeshPhongMaterial({
        map: texture,
        shininess,
        specular,
        transparent,
        opacity,
        emissive
    });
    
    const mesh = new THREE_NS.Mesh(
        new THREE_NS.SphereGeometry(radius, segments, segments),
        material
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}


// --- Inicialización principal ---
function initThree() {
    if (!THREE_NS) {
        threeContainer.innerHTML = '<div style="padding:10px;color:#9fb0c7;">Vista 3D desactivada (no se pudo cargar Three.js).</div>';
        return;
    }

    // --- Configuración básica del render ---
    const width = threeContainer.clientWidth || 600;
    const height = threeContainer.clientHeight || 400;

    renderer = new THREE_NS.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE_NS.PCFSoftShadowMap;
    threeContainer.innerHTML = '';
    threeContainer.appendChild(renderer.domElement);

    scene = new THREE_NS.Scene();

    // --- Cámara ---
    camera = new THREE_NS.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 0, 5); 
    scene.add(camera);

    // --- Fondo estelar ---
    const textureLoader = new THREE_NS.TextureLoader();
    const starTexture = textureLoader.load('static/textures/nocheHD.jpg', 
        () => console.log('✨ Fondo de estrellas cargado'),
        undefined, 
        (err) => console.warn('⚠️ Error al cargar fondo estelar:', err)
    );
    const starGeometry = new THREE_NS.SphereGeometry(900, 64, 64);
    const starMaterial = new THREE_NS.MeshBasicMaterial({
        map: starTexture,
        side: THREE_NS.BackSide
    });
    starSphere = new THREE_NS.Mesh(starGeometry, starMaterial);
    scene.add(starSphere);

    // --- Grupo principal del sistema solar ---
    solarSystemGroup = new THREE_NS.Group();
    scene.add(solarSystemGroup);

    // --- Grupo para el Sol ---
    sunGroup = new THREE_NS.Group();
    solarSystemGroup.add(sunGroup);

    // ☀️ Sol (emite luz propia)
    const sunGeometry = new THREE_NS.SphereGeometry(.2, 64, 64);
    const sunTexture = new THREE_NS.TextureLoader().load(
        'static/textures/sol.jpg',
        () => console.log('🪐 Textura de Sol cargada'),
        undefined,
        (err) => console.warn('⚠️ Error al cargar textura del Sol:', err)
    );
    const sunMaterial = new THREE_NS.MeshBasicMaterial({
        map: sunTexture,
        toneMapped: false
    });
    sunMesh = new THREE_NS.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.set(0, 0, 0);
    sunGroup.add(sunMesh);

    // 💡 Luz solar que ilumina la Tierra
    sunLight = new THREE_NS.PointLight(0xffffff, 1.6, 100);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunGroup.add(sunLight);

    sunLight.shadow.mapSize.width = 4096; 
    sunLight.shadow.mapSize.height = 4096;
    const d = 8; 
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 20; 
    sunLight.shadow.bias = -0.0001; 

    // --- Grupo para la Tierra ---
    earthGroup = new THREE_NS.Group();
    earthGroup.position.set(sunOrbitRadius, 0, 0); 
    sunGroup.add(earthGroup);

    // 🌍 Tierra
    earthMesh = createPlanet({
        name: 'Tierra',
        radius: 0.1,
        texturePath: 'static/textures/planeta.jpg'
    });
    earthGroup.add(earthMesh);

    // ☁️ Nubes
    const cloudsMesh = createPlanet({
        name: 'Nubes',
        texturePath: 'static/textures/fair_clouds_4k.png',
        radius: 0.102,
        shininess: 0,
        specular: 0,
        transparent: true,
        opacity: 0.4
    });
    cloudsMesh.castShadow = false; 
    cloudsMesh.receiveShadow = false;
    earthMesh.add(cloudsMesh);

    // 🌕 Luna
    moonMesh = createPlanet({
        name: 'Luna',
        texturePath: 'static/textures/luna.jpg',
        radius: 0.05,
        segments: 32,
        shininess: 5,
        specular: 0x111111
    });
    moonMesh.position.set(moonOrbitRadius, 0.5, 0);
    earthMesh.add(moonMesh);

    // --- Luz ambiental ---
    scene.add(new THREE_NS.AmbientLight(0x888888, 1.5)); 

    // --- Ajuste inicial de la vista ---
    solarSystemGroup.rotation.x = 0.3;
    solarSystemGroup.rotation.y = 0.8;

    // --- Controles y animación ---
    add3DControls(); 
    setupFollowButton();
    setupResetSystemButton();
    animate();
}


// --- Crear la órbita de un asteroide o cometa ---
let currentOrbitLine = null;
let orbitalMeteorite = null;
let orbitalAnimationId = null;
let orbitalTime = 0;

function createOrbitFromElements(objectData) {
    // Limpiar órbitas y meteoritos anteriores
    if (currentOrbitLine) {
        solarSystemGroup.remove(currentOrbitLine);
        currentOrbitLine.geometry.dispose();
        currentOrbitLine.material.dispose();
        currentOrbitLine = null;
    }
    
    if (orbitalMeteorite) {
        solarSystemGroup.remove(orbitalMeteorite);
        orbitalMeteorite.geometry.dispose();
        orbitalMeteorite.material.dispose();
        orbitalMeteorite = null;
    }
    
    if (orbitalAnimationId) {
        cancelAnimationFrame(orbitalAnimationId);
        orbitalAnimationId = null;
    }

    if (!objectData || !objectData.a || !objectData.e) {
        console.warn('❌ No hay datos suficientes para crear órbita.');
        return null;
    }

    const a = objectData.a; // semieje mayor (UA)
    const e = objectData.e; // excentricidad
    const i = THREE.MathUtils.degToRad(objectData.i || 0); // inclinación
    const omega = THREE.MathUtils.degToRad(objectData.omega || 0); // nodo ascendente (Ω)
    const argPeriapsis = THREE.MathUtils.degToRad(objectData.argPeriapsis || 0); // argumento del perihelio (ω)

    const numPoints = 360; // resolución de la elipse
    const curvePoints = [];

    for (let θ = 0; θ < 2 * Math.PI; θ += (2 * Math.PI / numPoints)) {
        // Ecuación de una elipse (en el plano orbital)
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(θ));
        const x = r * Math.cos(θ);
        const y = r * Math.sin(θ);
        curvePoints.push(new THREE.Vector3(x, y, 0));
    }

    // Aplicar rotaciones orbitales
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({
        color: 0xffa500, // naranja brillante
        linewidth: 2
    });

    const orbitLine = new THREE.LineLoop(curveGeometry, curveMaterial);

    // Crear matriz de rotación (ω, i, Ω)
    const orbitMatrix = new THREE.Matrix4();
    orbitMatrix.makeRotationZ(argPeriapsis); // rotación del perihelio
    orbitMatrix.multiply(new THREE.Matrix4().makeRotationX(i)); // inclinación
    orbitMatrix.multiply(new THREE.Matrix4().makeRotationZ(omega)); // nodo ascendente

    orbitLine.applyMatrix4(orbitMatrix);

    // Escalar a una distancia visible
    const AU_SCALE = 3;
    orbitLine.scale.set(AU_SCALE, AU_SCALE, AU_SCALE);

    // Agregar la órbita al sistema solar
    currentOrbitLine = orbitLine;
    solarSystemGroup.add(orbitLine);

    // 🪨 Crear el meteorito (pequeña esfera) y animarlo en la órbita
    const asteroidGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4500, // naranja/rojo
        emissive: 0xff4500,
        emissiveIntensity: 0.4
    });
    orbitalMeteorite = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    solarSystemGroup.add(orbitalMeteorite);

    // Función para calcular la posición en la órbita en función del tiempo
    function calculateOrbitalPosition(time) {
        // Calcular la anomalía media (simulando movimiento orbital)
        const meanAnomaly = (time * 0.5) % (2 * Math.PI);
        
        // Resolver la ecuación de Kepler para la anomalía excéntrica (aproximación simple)
        let eccentricAnomaly = meanAnomaly;
        for (let j = 0; j < 3; j++) {
            eccentricAnomaly = meanAnomaly + e * Math.sin(eccentricAnomaly);
        }
        
        // Calcular la anomalía verdadera
        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + e) * Math.sin(eccentricAnomaly / 2),
            Math.sqrt(1 - e) * Math.cos(eccentricAnomaly / 2)
        );
        
        // Calcular la distancia radial
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));
        
        // Posición en el plano orbital
        const x = r * Math.cos(trueAnomaly);
        const y = r * Math.sin(trueAnomaly);
        
        return new THREE.Vector3(x, y, 0);
    }

    // Función de animación del meteorito orbital
    function animateOrbitalMeteorite() {
        if (!orbitalMeteorite) return;
        
        orbitalTime += 0.016; // Aproximadamente 60 FPS
        
        // Calcular posición orbital
        const orbitalPos = calculateOrbitalPosition(orbitalTime);
        
        // Aplicar las mismas transformaciones orbitales que a la línea
        orbitalPos.applyMatrix4(orbitMatrix);
        orbitalPos.multiplyScalar(AU_SCALE);
        
        // Actualizar posición del meteorito
        orbitalMeteorite.position.copy(orbitalPos);
        
        // Rotación del meteorito sobre su eje
        orbitalMeteorite.rotation.x += 0.01;
        orbitalMeteorite.rotation.y += 0.02;
        
        orbitalAnimationId = requestAnimationFrame(animateOrbitalMeteorite);
    }

    // Iniciar animación
    animateOrbitalMeteorite();

    console.log(`🌀 Órbita y meteorito añadidos para ${objectData.name}`);
    return orbitLine;
}

let zoomLevel = 0;


// --- Botón de seguimiento ---
function setupFollowButton() {
    const button = document.createElement('button');
    button.textContent = 'Vista general 🌌';
    button.id = 'zoomCycleButton';

    Object.assign(button.style, {
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        padding: '8px 15px',
        zIndex: '1000',
        backgroundColor: 'rgba(60, 179, 113, 0.8)',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    });

    document.body.appendChild(button);

    const scaleGeneral = new THREE.Vector3(1, 1, 1);
    const scaleSunView = new THREE.Vector3(5, 5, 5);
    const scaleEarthView = new THREE.Vector3(10, 10, 10);

    button.addEventListener('click', () => {
        zoomLevel = (zoomLevel + 1) % 3;

        if (zoomLevel === 0) {
            // 🌌 Vista general
            button.textContent = 'Vista general 🌌';
            isFollowingEarth = false;
            solarSystemGroup.scale.copy(scaleGeneral);
            camera.position.set(0, 0, 5);
            camera.lookAt(new THREE.Vector3(0, 0, 0));

        } else if (zoomLevel === 1) {
            // ☀️ Centrar en Sol
            button.textContent = 'Centrar en Sol ☀️';
            isFollowingEarth = false;
            solarSystemGroup.scale.copy(scaleSunView);
            
            const sunPos = new THREE.Vector3();
            sunMesh.getWorldPosition(sunPos);
            camera.position.copy(sunPos).add(new THREE.Vector3(0, 0, 5));
            camera.lookAt(sunPos);

        } else if (zoomLevel === 2) {
            // 🌍 Centrar en Tierra
            button.textContent = 'Centrar en Tierra 🌍';
            isFollowingEarth = true; // 🔥 Activar seguimiento automático
            solarSystemGroup.scale.copy(scaleEarthView);
        }
    });
}

// --- Botón para reiniciar el Sistema Solar ---

function setupResetSystemButton() {
    const button = document.createElement('button');
    button.textContent = 'Reiniciar Sistema Solar 🔄';
    button.id = 'resetSystemButton';

    // Estilo (junto al botón de seguir Tierra)
    button.style.position = 'absolute';
    button.style.bottom = '10px';
    button.style.left = '180px';
    button.style.padding = '8px 15px';
    button.style.zIndex = '1000';
    button.style.backgroundColor = 'rgba(70, 130, 180, 0.8)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    document.body.appendChild(button);

    button.addEventListener('click', () => {
        if (!solarSystemGroup) return;

        // 🔄 Reiniciar el sistema solar completo
        solarSystemGroup.rotation.set(0, 0, 0);

        // 🔄 Reiniciar variables globales de movimiento
        sunAngle = 0;
        moonAngle = 0;
        rotVelX = 0;
        rotVelY = 0;

        // 🔄 Reiniciar también la rotación local de la Tierra
        if (earthGroup) {
            earthGroup.rotation.set(0, 0, 0);
        }

        // 🔄 Reiniciar la posición de la Luna (por seguridad)
        if (moonMesh) {
            moonMesh.position.set(moonOrbitRadius, 0.5, 0);
        }

        // Si estamos siguiendo la Tierra 🌍
        if (isFollowingEarth) {
            const followButton = document.getElementById('followEarthButton');
            if (followButton) followButton.textContent = 'Dejar de Seguir';

            // Mantener cámara centrada en la Tierra
            const earthPosition = new THREE_NS.Vector3();
            earthGroup.getWorldPosition(earthPosition);

            // Definir el punto relativo de cámara (1 unidad arriba y 4 atrás)
            const relativeOffset = new THREE_NS.Vector3(0, 1, 4);

            // Calcular rotación actual del sistema solar
            const matrix = new THREE_NS.Matrix4().extractRotation(solarSystemGroup.matrixWorld);
            relativeOffset.applyMatrix4(matrix);

            // Reposicionar la cámara manteniendo el enfoque
            camera.position.copy(earthPosition).add(relativeOffset);
            camera.lookAt(earthPosition);
        } else {
            // Si no estamos centrados en la Tierra, volver a vista general
            const followButton = document.getElementById('followEarthButton');
            if (followButton) followButton.textContent = 'Centrar en Tierra 🌍';
            camera.position.set(0, 0, 5);
            camera.lookAt(new THREE_NS.Vector3(0, 0, 0));
        }

        console.log('🌞 Sistema Solar y Tierra reiniciados.');
    });
}


// --- Animación ---
function animate() {
    requestAnimationFrame(animate);
    if (isPaused) {
        renderer.render(scene, camera);
        return;
    }

    // 🌕 Revolución de la Luna
    moonAngle += moonOrbitSpeed;
    moonMesh.position.x = Math.cos(moonAngle) * moonOrbitRadius;
    moonMesh.position.z = Math.sin(moonAngle) * moonOrbitRadius;
    moonMesh.position.y = Math.sin(moonAngle) * 0.2; 
    
    // 🌍 Revolución de la Tierra alrededor del Sol
    sunAngle += sunOrbitSpeed;
    sunGroup.rotation.y = sunAngle; 
    
    // 🔄 Rotación manual/automática del sistema solar
    if (isDragging) {
        solarSystemGroup.rotation.x += rotVelX;
        solarSystemGroup.rotation.y += rotVelY;
    } else {
        solarSystemGroup.rotation.x += rotVelX;
        solarSystemGroup.rotation.y += rotVelY;

        rotVelX *= rotationDamping; 
        rotVelY *= rotationDamping;

        if (Math.abs(rotVelY) < 0.0001) {
            solarSystemGroup.rotation.y += 0.0005; 
        }
    }

    if (orbitControls && typeof orbitControls.update === 'function') {
        orbitControls.update();
    }

    // 🚀 Seguimiento de la Tierra
    if (isFollowingEarth && earthGroup) {
        const earthPosition = new THREE_NS.Vector3();
        earthGroup.getWorldPosition(earthPosition);

        // Offset fijo
        const desiredOffset = new THREE_NS.Vector3(0, 0.5, 3); 
        camera.position.copy(earthPosition).add(desiredOffset);
        camera.lookAt(earthPosition);
    }

    

    // 🌌 Movimiento lento del fondo
    starSphere.rotation.y += 0.00005;

    // ☀️ Rotación del Sol
    if (sunMesh) sunMesh.rotation.y += 0.0005;

    renderer.render(scene, camera);
}

// Simulación Choque asteroide
function latLonToVector3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE_NS.Vector3(x, y, z);
}

// TODO: Modelo matemático principal de simulación
// Entradas esperadas:
// - diameter (m), velocity (km/s), density (kg/m3, por defecto 3000),
// - impactLat, impactLon (grados), mitigationVelocity (km/s, p.ej. 0 a 0.1)
// Qué cálculos van aquí:
// - Masa ~ densidad * (4/3)*pi*(radio^3)
// - Energía cinética ~ 0.5*m*(v_total^2) donde v_total = (velocity + mitigationVelocity) * 1000
// - Convertir energía a Megatones (1 MT ~ 4.184e15 J)
// - Diámetro de cráter aproximado (usar ley de escala que el equipo decida)
// - Magnitud sísmica aproximada (relación logarítmica según energía)
// - Zonas de efecto: crear radios en km (p.ej. 2x y 5x diámetro de cráter)
// Formato JSON de salida requerido por la visualización:
// {
//   impactEnergyMT: number,
//   craterDiameterKM: number,
//   seismicMagnitude: number,
//   effectZones: [
//     { radiusKM: number, label: string },
//     { radiusKM: number, label: string }
//   ],
//   impactLat: number,
//   impactLon: number
// }
function runSimulationTemplate({ diameter, velocity, density, impactLat, impactLon, mitigationVelocity }) {
  // TODO: Implementa aquí tu modelo. De momento devolvemos valores mock para probar la UI.
  const craterDiameterKM = Math.max(0.5, (diameter / 1000) * 8); // mock: escala simple
  const impactEnergyMT = Math.max(0.1, diameter * velocity * 0.05); // mock
  const seismicMagnitude = Math.min(9.5, 4 + Math.log10(impactEnergyMT + 1)); // mock
  return {
    impactEnergyMT: Number(impactEnergyMT.toFixed(2)),
    craterDiameterKM: Number(craterDiameterKM.toFixed(2)),
    seismicMagnitude: Number(seismicMagnitude.toFixed(2)),
    effectZones: [
      { radiusKM: Number((craterDiameterKM * 2).toFixed(2)), label: 'Destrucción Total' },
      { radiusKM: Number((craterDiameterKM * 5).toFixed(2)), label: 'Daños Severos' },
    ],
    impactLat,
    impactLon,
  };
}

// TODO: Integración NeoWs (opcional en hackathon)
// En la versión hackathon no llamamos a la API de NASA. Puedes cargar un JSON local o mock.

// Dibujo de zonas
function drawEffectZones(lat, lon, craterKm, zones) {
  effectLayers.forEach(l => map.removeLayer(l));
  effectLayers = [];
  const crater = L.circle([lat, lon], { radius: craterKm * 1000, color: zoneColors.crater, fillColor: zoneColors.crater, fillOpacity: 0.2, weight: 2 }).addTo(map);
  effectLayers.push(crater);
  zones.forEach((z, idx) => {
    const colors = [zoneColors.total, zoneColors.severe, '#ffa64d'];
    const circle = L.circle([lat, lon], { radius: z.radiusKM * 1000, color: colors[idx % colors.length], fillColor: colors[idx % colors.length], fillOpacity: 0.12, weight: 1.5 }).addTo(map);
    effectLayers.push(circle);
  });
  map.setView([lat, lon], 7);
}

// Simulación 3D (trayectoria orbital curva + impacto)
function animateImpact(lat, lon) {
  if (!THREE_NS || !scene) return;
  // Limpiar previos
  if (asteroidMesh) { scene.remove(asteroidMesh); asteroidMesh.geometry.dispose(); asteroidMesh.material.dispose(); asteroidMesh = null; }
  if (trajectoryLine) { scene.remove(trajectoryLine); trajectoryLine.geometry.dispose(); trajectoryLine = null; }

  const end = latLonToVector3(lat, lon, 1.02);
  const start = new THREE_NS.Vector3(-3, 3, -3);
  const control = new THREE_NS.Vector3(0, 2, 0); // punto de control para curva bézier

  // Construir curva Bezier cuadrática
  function bezier(t, p0, p1, p2) {
    const a = p0.clone().multiplyScalar((1-t)*(1-t));
    const b = p1.clone().multiplyScalar(2*(1-t)*t);
    const c = p2.clone().multiplyScalar(t*t);
    return a.add(b).add(c);
  }
  const points = [];
  for (let t = 0; t <= 1.0; t += 0.02) points.push(bezier(t, start, control, end));
  const lineGeo = new THREE_NS.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE_NS.LineDashedMaterial({ color: 0xff914d, dashSize: 0.05, gapSize: 0.03 });
  trajectoryLine = new THREE_NS.Line(lineGeo, lineMat);
  trajectoryLine.computeLineDistances();
  scene.add(trajectoryLine);

  // Asteroide (esfera pequeña)
  asteroidMesh = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(0.03, 16, 16), new THREE_NS.MeshBasicMaterial({ color: 0xffd27f }));
  scene.add(asteroidMesh);

  // Animar sobre la curva
  let progress = 0;
  function step() {
    progress += 0.01;
    const t = Math.min(progress, 1);
    const p = bezier(t, start, control, end);
    asteroidMesh.position.copy(p);
    if (t < 1) requestAnimationFrame(step); else impactFlash(end);
  }
  requestAnimationFrame(step);
}

// Efecto de impacto simple
function impactFlash(positionVec3) {
  if (!THREE_NS || !scene) return;
  const ringGeo = new THREE_NS.RingGeometry(0.01, 0.2, 32);
  const ringMat = new THREE_NS.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.8, side: THREE_NS.DoubleSide });
  const ring = new THREE_NS.Mesh(ringGeo, ringMat);
  ring.position.copy(positionVec3);
  ring.lookAt(new THREE_NS.Vector3(0,0,0));
  scene.add(ring);
  let s = 0.01;
  const grow = () => {
    s += 0.05;
    ring.scale.set(s, s, s);
    ring.material.opacity *= 0.92;
    if (ring.material.opacity > 0.03) requestAnimationFrame(grow); else { scene.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
  };
  requestAnimationFrame(grow);
}

function add3DControls() {
  if (!THREE_NS || !renderer || !camera) return;

  const ControlsCtor = THREE_NS.OrbitControls;
  if (!ControlsCtor) {
    console.warn('OrbitControls no está disponible. Usando controles básicos.');
    const domElement = renderer.domElement;
    let prevX = 0;
    let prevY = 0;

    domElement.addEventListener('mousedown', (event) => {
      isDragging = true;
      prevX = event.clientX;
      prevY = event.clientY;
    });

    domElement.addEventListener('mousemove', (event) => {
      if (!isDragging) return;
      const deltaX = event.clientX - prevX;
      const deltaY = event.clientY - prevY;

      if (isFollowingEarth) {
        // 🔹 Si estamos centrados en la Tierra, rotar solo la Tierra
        earthGroup.rotation.y += deltaX * 0.01;
        earthGroup.rotation.x += deltaY * 0.01;
      } else {
        // 🔹 Si no, rotar todo el sistema solar
        solarSystemGroup.rotation.y += deltaX * 0.01;
        solarSystemGroup.rotation.x += deltaY * 0.01;
      }

      starSphere.rotation.y -= deltaX * 0.002;        // efecto sutil en estrellas
      starSphere.rotation.x -= deltaY * 0.002;
      prevX = event.clientX;
      prevY = event.clientY;
    });

    ['mouseup', 'mouseleave'].forEach((evt) => {
      domElement.addEventListener(evt, () => { isDragging = false; });
    });

    domElement.addEventListener('wheel', (event) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const zoomDirection = event.deltaY > 0 ? -1 : 1;
      camera.position.z += zoomDirection * zoomSpeed;
      camera.position.z = Math.max(1.5, Math.min(15, camera.position.z));
    });
    return;
  }

  orbitControls = new ControlsCtor(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.enablePan = false;
  orbitControls.minDistance = 1.5;
  orbitControls.maxDistance = 8;
  orbitControls.rotateSpeed = 0.8;

  orbitControls.addEventListener('start', () => { isDragging = true; });
  orbitControls.addEventListener('end', () => { isDragging = false; });
}


function onResize() {
  if (!renderer || !camera || !globe3DContainer) return;
  const width = Math.max(1, globe3DContainer.clientWidth || globe3DContainer.offsetWidth || 600);
  const height = Math.max(1, globe3DContainer.clientHeight || globe3DContainer.offsetHeight || 400);
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
initThree();

// ============== Visor de Asteroides ==============
let currentViewerObject = null;

const FALLBACK_ASTEROIDS = [
  { full_name: 'Asteroide Bennu (Ejemplo)', diameter: 0.49, velocity: 28.0, density: 1260, rotation_period: 4.3, seed: 101, a: 1.126, e: 0.204, i: 6.035, om: 2.1, w: 66.1, ma: 10.4, discovery_date: '1999-09-11' },
  { full_name: 'Asteroide Apophis (Ejemplo)', diameter: 0.37, velocity: 30.7, density: 3260, rotation_period: 30.6, seed: 256, a: 0.922, e: 0.191, i: 3.331, om: 204.4, w: 130.5, ma: 25.7, discovery_date: '2004-06-19' },
  { full_name: 'Planetoide Ceres (Grande)', diameter: 940, velocity: 17.9, density: 2162, rotation_period: 9.1, seed: 512, a: 2.77, e: 0.08, i: 10.59, om: 80.3, w: 73.6, ma: 48.2, discovery_date: '1801-01-01' },
  { full_name: 'Asteroide Vesta', diameter: 525, velocity: 19.3, density: 3420, rotation_period: 5.3, seed: 768, a: 2.36, e: 0.089, i: 7.14, om: 103.9, w: 150.1, ma: 78.4, discovery_date: '1807-03-29' },
  { full_name: 'Asteroide Hygiea', diameter: 434, velocity: 15.2, density: 1940, rotation_period: 13.8, seed: 903, a: 3.14, e: 0.119, i: 3.83, om: 281.2, w: 312.4, ma: 6.8, discovery_date: '1849-04-12' }
];

const FALLBACK_COMETS = [
  { object_name: '1P/Halley', e: '0.967', q_au_1: '0.586', q_au_2: '35.08', i_deg: '162.26', node_deg: '58.42', w_deg: '111.33', p_yr: '75.32', moid_au: '0.063', velocity_kms: '54.0', discovery_date: '0240-05-25' },
  { object_name: '2P/Encke', e: '0.848', q_au_1: '0.336', q_au_2: '4.09', i_deg: '11.78', node_deg: '334.57', w_deg: '186.54', p_yr: '3.30', moid_au: '0.173', velocity_kms: '34.0', discovery_date: '1786-01-17' },
  { object_name: '67P/Churyumov-Gerasimenko', e: '0.641', q_au_1: '1.243', q_au_2: '5.68', i_deg: '7.04', node_deg: '50.14', w_deg: '12.79', p_yr: '6.44', moid_au: '0.257', velocity_kms: '32.9', discovery_date: '1969-09-20' }
];

const DATA_SOURCES = {
  asteroids: { key: 'asteroids', label: 'Asteroides' },
  comets: { key: 'comets', label: 'Cometas' }
};

let currentDatasetKey = 'asteroids';
let catalogFull = [];
let filteredCatalog = [];
let currentObjectIndex = null;
let currentObjectId = null;
let isCatalogLoading = false;
let suppressDatasetEvents = false;

function hashStringToSeed(str) {
  if (!str) return 101;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000;
  }
  return Math.max(1, hash);
}

function toNumber(value, fallback = NaN) {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickFiniteNumber(...values) {
  for (const value of values) {
    const numeric = toNumber(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function extractOrbitalParameters(item) {
  if (!item) return { a: null, e: null, inc: null };
  const raw = item.raw || {};
  const a = pickFiniteNumber(raw.a, raw.semi_major_axis, raw.semiMajorAxis, item.a);
  const e = pickFiniteNumber(raw.e, raw.eccentricity, item.e);
  const inc = pickFiniteNumber(raw.i, raw.i_deg, raw.inclination, item.i);
  return { a, e, inc };
}

// ========== FUNCIÓN DE PROBABILIDAD DE IMPACTO (MÉTODO DE ÖPIK) ==========
function impactProbabilityAdvanced({
  a, e, inc, at = 1.0, et = 0.0167,
  Rt_km = 6371, Mt = 5.97219e24,
  samples = 1000, useGravFocus = true,
  GMsun = 1.32712440018e20, AU_m = 1.495978707e11
} = {}) {
  if (!Number.isFinite(a) || !Number.isFinite(e) || !Number.isFinite(inc)) {
    return { Pcoll: NaN, a, e, inc };
  }

  if (samples % 2 !== 0) samples++;
  const i = inc * Math.PI / 180;
  const Rt = Rt_km * 1000;
  const G = 6.67430e-11;

  function radiusRcoll(U, Ve) {
    const ratio = Math.max(U, 1e-12);
    return Rt * Math.sqrt(1 + (Ve * Ve) / (ratio * ratio));
  }

  function V_target_at_r(rho_AU) {
    const r = rho_AU * AU_m;
    const atSI = at * AU_m;
    return Math.sqrt(Math.max(0, GMsun * (2 / r - 1 / atSI)));
  }

  function tisserand_rho(rho_AU) {
    return (rho_AU / a) + 2 * Math.sqrt((a / rho_AU) * (1 - e * e)) * Math.cos(i);
  }

  const Ve = Math.sqrt(2 * G * Mt / Rt);

  function integrand_nu(nu) {
    const denom = 1 + et * Math.cos(nu);
    if (Math.abs(denom) < 1e-12) return 0;
    const rho = at * (1 - et * et) / denom;
    const Vt = V_target_at_r(rho);
    const T_r = tisserand_rho(rho);
    const tmp = 3 - T_r;
    if (tmp <= 0) return 0;
    const U = Vt * Math.sqrt(tmp);
    const Rcoll = useGravFocus ? radiusRcoll(U, Ve) : Rt;
    const bracket = 2 - (rho / a) - (a / rho) * (1 - e * e);
    if (bracket <= 0) return 0;
    const prefactor = 1 / (4 * Math.PI * Math.sin(i));
    const Rcoll_over_at_sq = (Rcoll / (at * AU_m)) ** 2;
    const factor_speed = U * Math.sqrt(rho * AU_m) / Math.sqrt(GMsun * (1 - et * et));
    const PE_single = prefactor * Rcoll_over_at_sq * factor_speed / Math.sqrt(bracket);
    return 4 * PE_single;
  }

  const a_nu = 0;
  const b_nu = Math.PI;
  const n = samples;
  const h = (b_nu - a_nu) / n;
  let integral = 0;

  for (let k = 0; k <= n; k++) {
    const nu = a_nu + k * h;
    const y = integrand_nu(nu);
    if (k === 0 || k === n) integral += y;
    else if (k % 2 === 1) integral += 4 * y;
    else integral += 2 * y;
  }

  integral *= (h / 3);
  const Pcoll = integral / Math.PI;

  return { Pcoll, a, e, inc, at, et, Rt_km, Mt, useGravFocus, samples };
}

function computeImpactProbabilityValue(a, e, inc) {
  if (typeof impactProbabilityAdvanced !== 'function') return null;
  if (!Number.isFinite(a) || !Number.isFinite(e) || !Number.isFinite(inc)) return null;
  try {
    const result = impactProbabilityAdvanced({ a, e, inc });
    if (result && typeof result === 'object') {
      if (Number.isFinite(result.Pcoll)) return result.Pcoll;
      if (Number.isFinite(result.pcoll)) return result.pcoll;
    }
    if (Number.isFinite(result)) return result;
  } catch (error) {
    console.error('Error calculando la probabilidad de impacto:', error);
  }
  return null;
}

function updateImpactProbabilityForItem(item, { source = 'update' } = {}) {
  const { a, e, inc } = extractOrbitalParameters(item);
  const probability = computeImpactProbabilityValue(a, e, inc);
  outputProbabilityDebug(probability, source);
}

// Unifica mapeo -> cálculo -> visualización con logs
function computeAndDisplayImpactProbability(selectedObject, opts = {}) {
  const { source = 'handler' } = opts;
  // 1. Verificar el objeto seleccionado
  console.log(`[${source}] 1. Objeto seleccionado:`, selectedObject);
  if (!selectedObject) {
    outputProbabilityDebug(null, source);
    return;
  }

  // 2. Mapear y convertir parámetros (a, e, inc)
  const raw = selectedObject && selectedObject.raw ? selectedObject.raw : selectedObject;
  const parseNum = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  };
  let a = parseNum(raw.semi_major_axis);
  if (isNaN(a)) a = parseNum(raw.a);
  if (isNaN(a)) a = parseNum(selectedObject.a);
  if (isNaN(a)) a = parseNum(raw.q_au_2);

  let e = parseNum(raw.eccentricity);
  if (isNaN(e)) e = parseNum(raw.e);
  if (isNaN(e)) e = parseNum(selectedObject.e);

  let inc = parseNum(raw.inclination);
  if (isNaN(inc)) inc = parseNum(raw.i);
  if (isNaN(inc)) inc = parseNum(raw.i_deg);
  if (isNaN(inc)) inc = parseNum(selectedObject.i);

  if ((isNaN(a) || a <= 0) && Number.isFinite(e)) {
    const q = parseNum(raw.q_au_1);
    if (Number.isFinite(q)) {
      const denom = Math.max(1e-6, 1 - e);
      a = q / denom;
    }
  }

  const params = { a, e, inc };
  console.log(`[${source}] 2. Parámetros para la función:`, params);


  // 🪐 Dibujar la órbita del objeto seleccionado
  createOrbitFromElements({
    name: selectedObject.object_fullname || selectedObject.name || 'Objeto desconocido',
    a: params.a,
    e: params.e,
    i: params.inc,
    omega: parseNum(raw.node || raw.long_asc_node || raw.omega),       // Ω - nodo ascendente
    argPeriapsis: parseNum(raw.peri || raw.arg_periapsis || raw.w),    // ω - argumento del perihelio
  });

  // 3. Calcular y registrar el resultado crudo
  let result = null;
  try {
    result = impactProbabilityAdvanced(params);
  } catch (err) {
    console.error(`[${source}] Error llamando a impactProbabilityAdvanced:`, err);
    result = null;
  }

  // 4. Mostrar el resultado en la UI
  let valueToShow = null;
  if (typeof result === 'number' && Number.isFinite(result)) {
    valueToShow = result;
  } else if (result && typeof result === 'object') {
    const candidate = Number.isFinite(result?.Pcoll) ? result.Pcoll
                    : Number.isFinite(result?.pcoll) ? result.pcoll
                    : undefined;
    if (Number.isFinite(candidate)) valueToShow = candidate;
  }

  outputProbabilityDebug(valueToShow, source);
}

function outputProbabilityDebug(probability, source = 'debug') {
  const label = `[${source}] Debug - Probabilidad de Impacto (%):`;
  if (Number.isFinite(probability)) {
    const pct = probability;
    const formatted = `${pct.toExponential(4)}%`;
    if (probabilityDebugOut) probabilityDebugOut.textContent = formatted;
    console.log(label, formatted);
  } else {
    if (probabilityDebugOut) probabilityDebugOut.textContent = '--';
    console.log(label, '--');
  }
}

function getCurrentSelectedItem() {
  if (Number.isInteger(currentObjectIndex) && currentObjectIndex >= 0 && filteredCatalog[currentObjectIndex]) {
    return filteredCatalog[currentObjectIndex];
  }
  if (objectSelect) {
    const idx = Number(objectSelect.value);
    if (Number.isFinite(idx) && filteredCatalog[idx]) return filteredCatalog[idx];
  }
  return null;
}

function estimateViewerSpeed(objectData) {
  if (!objectData) return 15;
  const raw = objectData.raw || {};
  const direct = toNumber(objectData.velocity) || toNumber(raw.velocity_kms) || toNumber(raw.velocity) || toNumber(raw.v_infinity);
  if (Number.isFinite(direct)) return Math.max(0, Math.min(60, direct));
  if (objectData.type === 'comet') return 45;
  return 20;
}

function normalizeAsteroidRecord(record, index = 0) {
  if (!record) return null;
  const name = record.full_name || record.name || `Asteroide ${index + 1}`;
  const a = toNumber(record.a);
  const e = Math.min(0.999, Math.max(0, toNumber(record.e)));
  const inclination = toNumber(record.i);
  const ascendingNode = toNumber(record.om);
  const argPeriapsis = toNumber(record.w);
  const meanAnomaly = toNumber(record.ma);

  const rawDiameter = toNumber(record.diameter);
  const diameterKm = Number.isFinite(rawDiameter)
    ? (rawDiameter > 50 ? rawDiameter / 1000 : rawDiameter)
    : 1;

  const density = toNumber(record.density, 2500 + (hashStringToSeed(name) % 1500));
  const rotation = toNumber(record.rotation_period, 6 + ((hashStringToSeed(name) % 80) / 10));
  const velocityCandidate = toNumber(record.velocity,
    toNumber(record.velocity_kms,
      toNumber(record.velocity_km_s,
        toNumber(record.rel_velocity))));
  const velocity = Number.isFinite(velocityCandidate) ? velocityCandidate : null;
  const discoveryDate = record.discovery_date || record.discoveryDate || record.disc_date || record.discovered || null;

  return {
    id: `ast-${index}`,
    type: 'asteroid',
    name,
    diameterKm: Math.max(0.1, diameterKm),
    density,
    rotation_period: rotation,
    seed: toNumber(record.seed, hashStringToSeed(name)),
    a,
    e,
    i: inclination,
    omega: ascendingNode,
    argPeriapsis,
    meanAnomaly,
    velocity,
    discoveryDate,
    raw: record
  };
}

function normalizeCometRecord(record, index = 0) {
  if (!record) return null;
  const name = record.object_name || record.object || `Cometa ${index + 1}`;
  const e = Math.min(0.999, Math.max(0, toNumber(record.e)));
  const q = toNumber(record.q_au_1, 0.8);
  const a = e >= 1 ? toNumber(record.q_au_2, q + 1) : q / Math.max(1e-3, 1 - e);
  const inclination = toNumber(record.i_deg);
  const ascendingNode = toNumber(record.node_deg);
  const argPeriapsis = toNumber(record.w_deg);
  const period = toNumber(record.p_yr, 10);

  const moid = toNumber(record.moid_au, 0.05);
  const diameterKm = Math.max(0.5, moid * 150);
  const density = toNumber(record.density, 600 + (hashStringToSeed(name) % 200));
  const rotation = period > 0 ? Math.min(48, period * 2) : 12;
  const velocityCandidate = toNumber(record.velocity,
    toNumber(record.velocity_kms,
      toNumber(record.v_inf,
        toNumber(record.v_infinity))));
  const velocity = Number.isFinite(velocityCandidate) ? velocityCandidate : null;
  const discoveryDate = record.discovery_date || record.discoveryDate || record.disc_date || null;

  return {
    id: `com-${index}`,
    type: 'comet',
    name,
    diameterKm,
    density,
    rotation_period: rotation,
    seed: toNumber(record.seed, hashStringToSeed(name)),
    a,
    e,
    i: inclination,
    omega: ascendingNode,
    argPeriapsis,
    meanAnomaly: 0,
    velocity,
    discoveryDate,
    raw: record
  };
}

function setSelectLoading(selectEl, messageKey) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  const option = document.createElement('option');
  option.value = '';
  if (messageKey) {
    option.setAttribute('data-i18n', messageKey);
    option.textContent = translate(messageKey) || messageKey;
  }
  selectEl.appendChild(option);
  selectEl.disabled = true;
}

function updateDatasetRadios(key) {
  datasetMainRadios.forEach((radio) => {
    if (radio.value === key) radio.checked = true;
  });
}

function updateObjectSummary(objectData) {
  if (!objectSummary) return;
  if (!objectData) {
    objectSummary.textContent = '--';
    return;
  }
  const typeKey = objectData.type === 'comet' ? 'summary.type.comet' : 'summary.type.asteroid';
  const typeLabel = translate(typeKey) || (objectData.type === 'comet' ? 'Cometa' : 'Asteroide');
  const diameter = Number.isFinite(objectData.diameterKm) ? `${objectData.diameterKm.toFixed(1)} km` : 'N/D';
  const eccentricity = Number.isFinite(objectData.e) ? objectData.e.toFixed(3) : 'N/D';
  const semiMajor = Number.isFinite(objectData.a) ? `${objectData.a.toFixed(3)} UA` : 'N/D';
  const diameterLabel = translate('summary.diameter') || 'Diámetro';
  const semiMajorLabel = translate('summary.semiMajor') || 'a';
  const eccentricityLabel = translate('summary.eccentricity') || 'e';
  objectSummary.textContent = `${typeLabel} • ${diameterLabel}: ${diameter} • ${semiMajorLabel}: ${semiMajor} • ${eccentricityLabel}: ${eccentricity}`;
}

function populateObjectSelect() {
  if (!objectSelect) return;
  suppressDatasetEvents = true;
  objectSelect.innerHTML = '';
  if (!filteredCatalog.length) {
    setSelectLoading(objectSelect, 'option.emptyCatalog');
    suppressDatasetEvents = false;
    return;
  }
  filteredCatalog.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = item.name;
    objectSelect.appendChild(option);
  });
  objectSelect.disabled = false;
  suppressDatasetEvents = false;
}

function formatObjectDetails(objectData) {
  if (!objectData) return '';
  const lines = [];
  lines.push(`${translate('details.name') || 'Nombre'}: ${objectData.name}`);
  const typeKeyDetails = objectData.type === 'comet' ? 'details.type.comet' : 'details.type.asteroid';
  const typeValue = translate(typeKeyDetails) || (objectData.type === 'comet' ? 'Cometa' : 'Asteroide');
  lines.push(`${translate('details.type') || 'Tipo'}: ${typeValue}`);
  if (Number.isFinite(objectData.diameterKm)) lines.push(`${translate('details.estimatedDiameter') || 'Diámetro estimado'}: ${objectData.diameterKm.toFixed(2)} km`);
  if (Number.isFinite(objectData.density)) lines.push(`${translate('details.modelDensity') || 'Densidad modelo'}: ${Math.round(objectData.density)} kg/m³`);
  if (Number.isFinite(objectData.rotation_period)) lines.push(`${translate('details.rotationPeriod') || 'Periodo de rotación aprox.'}: ${objectData.rotation_period.toFixed(1)} ${translate('details.rotationHours') || 'h'}`);
  if (Number.isFinite(objectData.velocity)) lines.push(`${translate('details.velocity') || 'Velocidad estimada'}: ${objectData.velocity.toFixed(1)} km/s`);
  if (Number.isFinite(objectData.a)) lines.push(`${translate('details.semiMajor') || 'Semieje mayor (a)'}: ${objectData.a.toFixed(3)} UA`);
  if (Number.isFinite(objectData.e)) lines.push(`${translate('details.eccentricity') || 'Excentricidad (e)'}: ${objectData.e.toFixed(3)}`);
  if (Number.isFinite(objectData.i)) lines.push(`${translate('details.inclination') || 'Inclinación (i)'}: ${objectData.i.toFixed(2)}°`);
  if (Number.isFinite(objectData.omega)) lines.push(`${translate('details.ascendingNode') || 'Nodo ascendente (Ω)'}: ${objectData.omega.toFixed(2)}°`);
  if (Number.isFinite(objectData.argPeriapsis)) lines.push(`${translate('details.argPeriapsis') || 'Arg. del perihelio (ω)'}: ${objectData.argPeriapsis.toFixed(2)}°`);
  const period = toNumber(objectData.raw?.p_yr);
  if (Number.isFinite(period)) lines.push(`${translate('details.orbitalPeriod') || 'Período orbital'}: ${period.toFixed(2)} ${translate('units.years') || 'años'}`);
  const discoveryRaw = objectData.discoveryDate || objectData.raw?.discovery_date || objectData.raw?.disc_date || objectData.raw?.discoveryDate;
  if (discoveryRaw) lines.push(`${translate('details.discovery') || 'Descubierto'}: ${discoveryRaw}`);
  return lines.join('\n');
}

function refreshOrbitDetails(explicitObject = null) {
  if (!apiAsteroidDetails) return;
  const targetObject = explicitObject || getCurrentSelectedItem() || currentViewerObject;
  if (!targetObject) {
    apiAsteroidDetails.value = translate('message.selectFromCatalog') || 'Selecciona un objeto del catálogo';
    return;
  }
  apiAsteroidDetails.value = formatObjectDetails(targetObject);
}

function applyObjectToViewer(objectData) {
  if (!objectData) return;

  const diameter = Math.max(0.1, toNumber(objectData.diameterKm, meteoriteState.diameterKM));
  meteoriteState.diameterKM = diameter;
  meteoriteState.density = Number.isFinite(objectData.density) ? objectData.density : null;
  meteoriteState.rotationPeriodHours = Number.isFinite(objectData.rotation_period) ? objectData.rotation_period : null;
  const velocityValue = Number.isFinite(objectData.velocity)
    ? objectData.velocity
    : estimateViewerSpeed(objectData);
  meteoriteState.velocity = velocityValue;

  const seed = Number.isFinite(objectData.seed) ? objectData.seed : hashStringToSeed(objectData.name);
  meteoriteState.seed = seed;
  currentViewerObject = objectData;

  if (!avRenderer) {
    initAsteroidViewerThree();
    resizeAsteroidViewer();
  }

  regenerateMeteorite({ diameterKM: meteoriteState.diameterKM, seed: meteoriteState.seed });
  updateViewerRotationSpeed();
}

function setActiveObjectByIndex(index, { updateViewer = false, updateDetails = false, updateProbability = true } = {}) {
  if (!Array.isArray(filteredCatalog) || !filteredCatalog[index]) return;
  currentObjectIndex = index;
  const selected = filteredCatalog[index];
  currentViewerObject = selected;
  currentObjectId = selected?.id || null;
  const previousFlag = suppressDatasetEvents;
  suppressDatasetEvents = true;
  if (objectSelect) objectSelect.value = String(index);
  suppressDatasetEvents = previousFlag;
  updateObjectSummary(selected);
  if (updateViewer) {
    applyObjectToViewer(selected);
  }
  if (updateDetails) {
    refreshOrbitDetails(selected);
  }
  if (updateProbability) {
    updateImpactProbabilityForItem(selected, { source: 'active-object' });
  }
}

function parseDiscoveryDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function applyFilters({ preserveSelection = false } = {}) {
  if (!Array.isArray(catalogFull)) catalogFull = [];

  const nameQuery = (filterNameInput?.value || '').trim().toLowerCase();
  const minDiameter = toNumber(filterMinDiameterInput?.value);
  const minVelocity = toNumber(filterMinVelocityInput?.value);
  const dateStart = parseDiscoveryDate(filterDateStartInput?.value);
  const dateEnd = parseDiscoveryDate(filterDateEndInput?.value);

  const matchesFilters = (item) => {
    if (!item) return false;

    if (nameQuery) {
      const name = (item.name || '').toLowerCase();
      if (!name.includes(nameQuery)) return false;
    }

    if (Number.isFinite(minDiameter)) {
      if (!Number.isFinite(item.diameterKm) || item.diameterKm < minDiameter) return false;
    }

    if (Number.isFinite(minVelocity) && minVelocity > 0) {
      const velocityCandidates = [
        item.velocity,
        toNumber(item.raw?.velocity),
        toNumber(item.raw?.velocity_kms),
        toNumber(item.raw?.velocity_km_s),
        toNumber(item.raw?.relative_velocity)
      ];
      const velocity = velocityCandidates.find((val) => Number.isFinite(val));
      if (!Number.isFinite(velocity) || velocity < minVelocity) return false;
    }

    if (dateStart || dateEnd) {
      const rawDate = item.discoveryDate || item.raw?.discovery_date || item.raw?.disc_date || item.raw?.discoveryDate || item.discovery_date;
      const parsed = parseDiscoveryDate(rawDate);
      if (!parsed) return false;
      if (dateStart && parsed < dateStart) return false;
      if (dateEnd && parsed > dateEnd) return false;
    }

    return true;
  };

  const previousId = preserveSelection ? currentObjectId : null;
  filteredCatalog = catalogFull.filter(matchesFilters);

  populateObjectSelect();

  if (!filteredCatalog.length) {
    currentObjectIndex = null;
    currentObjectId = null;
    currentViewerObject = null;
    updateObjectSummary(null);
    if (apiAsteroidDetails) apiAsteroidDetails.value = translate('message.noDataAvailable') || 'No hay datos disponibles';
    updateImpactProbabilityForItem(null, { source: 'filters' });
    return;
  }

  let newIndex = 0;
  if (preserveSelection && previousId) {
    const idx = filteredCatalog.findIndex((item) => item.id === previousId);
    if (idx >= 0) newIndex = idx;
  }

  setActiveObjectByIndex(newIndex, { updateViewer: true, updateDetails: true });
}

function getRawDatasetForKey(key) {
  if (key === 'asteroids') {
    const data = Array.isArray(window.asteroidDatabase) && window.asteroidDatabase.length ? window.asteroidDatabase : FALLBACK_ASTEROIDS;
    return data;
  }
  if (key === 'comets') {
    const data = Array.isArray(window.cometDatabase) && window.cometDatabase.length ? window.cometDatabase : FALLBACK_COMETS;
    return data;
  }
  return [];
}

async function ensureDatabaseLoaded(key) {
  try {
    await (window.databaseReady || Promise.resolve());
  } catch (error) {
    console.error('Error esperando la base de datos:', error);
  }
  return getRawDatasetForKey(key);
}

async function switchDataset(key, { origin = 'main', forceReload = false } = {}) {
  if (!DATA_SOURCES[key]) return;
  if (isCatalogLoading) return;

  if (!forceReload && currentDatasetKey === key && catalogFull.length) {
    updateDatasetRadios(key);
    applyFilters({ preserveSelection: true });
    return;
  }

  currentDatasetKey = key;
  isCatalogLoading = true;
  updateDatasetRadios(key);
  setSelectLoading(objectSelect, 'option.loadingCatalog');
  if (apiAsteroidDetails) {
    apiAsteroidDetails.value = translate('option.loadingCatalog') || 'Cargando catálogo...';
  }

  try {
    const rawData = await ensureDatabaseLoaded(key);
    const normalizer = key === 'comets' ? normalizeCometRecord : normalizeAsteroidRecord;
    catalogFull = (rawData || []).map((record, index) => normalizer(record, index)).filter(Boolean);
  } catch (error) {
    console.error('No se pudo cargar el catálogo:', error);
    catalogFull = [];
  } finally {
    isCatalogLoading = false;
  }

  if (!catalogFull.length) {
    const fallback = key === 'comets' ? FALLBACK_COMETS : FALLBACK_ASTEROIDS;
    const normalizer = key === 'comets' ? normalizeCometRecord : normalizeAsteroidRecord;
    catalogFull = fallback.map((record, index) => normalizer(record, index)).filter(Boolean);
  }

  filteredCatalog = catalogFull.slice();
  currentObjectIndex = null;
  currentObjectId = null;
  applyFilters({ preserveSelection: false });
}

if (objectSelect) {
  objectSelect.addEventListener('change', () => {
    if (suppressDatasetEvents) return;
    const value = objectSelect.value;
    const idx = Number(value);
    if (!Number.isFinite(idx) || !filteredCatalog[idx]) {
      updateImpactProbabilityForItem(null, { source: 'dropdown' });
      return;
    }

    const selectedObject = filteredCatalog[idx];
    setActiveObjectByIndex(idx, { updateViewer: true, updateDetails: true, updateProbability: false });
    computeAndDisplayImpactProbability(selectedObject, { source: 'dropdown' });
  });
}

datasetMainRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    if (!radio.checked || suppressDatasetEvents) return;
    switchDataset(radio.value, { origin: 'main', forceReload: true });
  });
});

[
  [filterNameInput, ['input']],
  [filterMinDiameterInput, ['input', 'change']],
  [filterMinVelocityInput, ['input', 'change']],
  [filterDateStartInput, ['input', 'change']],
  [filterDateEndInput, ['input', 'change']]
].forEach(([element, events]) => {
  if (!element || !Array.isArray(events)) return;
  events.forEach((eventName) => {
    element.addEventListener(eventName, () => applyFilters({ preserveSelection: true }));
  });
});

switchDataset('asteroids', { origin: 'init', forceReload: true });

// Three.js para el visor de asteroides
let avRenderer, avScene, avCamera, avAsteroid, avLight;
let meteoriteState = {
  diameterKM: 50,
  seed: 42,
  rotationPeriodHours: 6,
  velocity: null,
  density: null
};

function diameterToSceneRadius(diameterKm) {
  const sanitized = Math.max(0.1, Number(diameterKm) || 1);
  const radius = Math.cbrt(sanitized) * 0.2;
  return Math.min(3.0, Math.max(0.25, radius));
}

function seededRandom(seed) {
  let value = Math.max(1, Math.floor(seed) || 1);
  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function createProceduralTexture(seed, offsets) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const texRandom = seededRandom(seed + 1000);
  const { offsetX, offsetY, offsetZ } = offsets;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;

      const noise1 = Math.sin((x + offsetX * 5) * 0.05) * Math.cos(y * 0.05);
      const noise2 = Math.sin(x * 0.1 + noise1) * Math.cos((y + offsetY * 5) * 0.1);
      const noise3 = Math.sin(x * 0.02) * Math.sin((y + offsetZ * 5) * 0.02);
      const noise4 = Math.sin(x * 0.2 + y * 0.15) * 0.5;
      const combined = noise1 * 0.3 + noise2 * 0.3 + noise3 * 0.2 + noise4 * 0.2;
      const randomVal = (texRandom() - 0.5) * 0.3;

      const baseColor = 50 + combined * 40 + randomVal * 30;
      const r = baseColor + texRandom() * 20;
      const g = baseColor * 0.9 + texRandom() * 15;
      const b = baseColor * 0.8 + texRandom() * 10;

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE_NS.CanvasTexture(canvas);
  texture.wrapS = THREE_NS.RepeatWrapping;
  texture.wrapT = THREE_NS.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function createMeteoriteMesh(diameterKm, seed) {
  const radius = diameterToSceneRadius(diameterKm);
  const geometry = new THREE_NS.SphereGeometry(radius, 96, 96);
  const positions = geometry.attributes.position;
  const random = seededRandom(seed);
  const offsetX = random() * 100;
  const offsetY = random() * 100;
  const offsetZ = random() * 100;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    const noise1 = Math.sin((x + offsetX) * 1.5 + y * 0.8) * Math.cos(z * 1.2);
    const noise2 = Math.sin(y * 1.8 + (z + offsetY) * 1.0) * Math.cos(x * 1.5);
    const noise3 = Math.sin((z + offsetZ) * 1.3 + x * 1.1) * Math.cos(y * 1.6);
    const combinedNoise = noise1 * 0.35 + noise2 * 0.35 + noise3 * 0.3;
    const craterNoise = Math.sin(x * 3) * Math.sin(y * 3) * Math.sin(z * 3);
    const displacement = combinedNoise * 0.25 + craterNoise * 0.1;

    const length = Math.sqrt(x * x + y * y + z * z) || 1;
    const scale = 1 + displacement;
    positions.setXYZ(
      i,
      (x / length) * radius * scale,
      (y / length) * radius * scale,
      (z / length) * radius * scale
    );
  }

  geometry.computeVertexNormals();
  const texture = createProceduralTexture(seed, { offsetX, offsetY, offsetZ });
  const material = new THREE_NS.MeshPhongMaterial({
    map: texture,
    shininess: 5,
    specular: 0x111111,
    flatShading: false
  });

  return new THREE_NS.Mesh(geometry, material);
}

function disposeMesh(mesh) {
  if (!mesh) return;
  if (mesh.geometry) mesh.geometry.dispose();
  const mat = mesh.material;
  if (Array.isArray(mat)) {
    mat.forEach(disposeMaterial);
  } else if (mat) {
    disposeMaterial(mat);
  }
  if (mesh.parent) mesh.parent.remove(mesh);
}

function disposeMaterial(material) {
  if (material.map && typeof material.map.dispose === 'function') material.map.dispose();
  material.dispose();
}

function regenerateMeteorite(overrides = {}) {
  meteoriteState = {
    ...meteoriteState,
    diameterKM: overrides.diameterKM !== undefined ? Number(overrides.diameterKM) : meteoriteState.diameterKM,
    seed: overrides.seed !== undefined ? Number(overrides.seed) : meteoriteState.seed
  };
  if (!avScene) return;
  disposeMesh(avAsteroid);
  avAsteroid = createMeteoriteMesh(meteoriteState.diameterKM, meteoriteState.seed);
  avScene.add(avAsteroid);
  updateViewerRotationSpeed();
}

function updateViewerRotationSpeed() {
  const rotationHours = Number.isFinite(meteoriteState.rotationPeriodHours) && meteoriteState.rotationPeriodHours > 0
    ? meteoriteState.rotationPeriodHours
    : 6;
  const radPerSecond = (2 * Math.PI) / (rotationHours * 3600);
  const velocity = Number.isFinite(meteoriteState.velocity) ? meteoriteState.velocity : 20;
  const velocityFactor = Math.min(2.5, Math.max(0.5, velocity / 20));
  const baseScale = 360; // ajusta la velocidad visual del modelo
  avRotSpeed = radPerSecond * baseScale * velocityFactor;
}

function initAsteroidViewerThree() {
  if (!asteroidCanvas) return;
  if (!THREE_NS) {
    asteroidCanvas.innerHTML = '<div style="padding:10px;color:#9fb0c7;">Vista 3D desactivada (no se pudo cargar Three.js).</div>';
    return;
  }

  const width = asteroidCanvas.clientWidth;
  const height = asteroidCanvas.clientHeight;
  avRenderer = new THREE_NS.WebGLRenderer({ antialias: true });
  avRenderer.setSize(width, height);
  avRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  asteroidCanvas.innerHTML = '';
  asteroidCanvas.appendChild(avRenderer.domElement);

  avScene = new THREE_NS.Scene();

  avCamera = new THREE_NS.PerspectiveCamera(45, width / height, 0.1, 1000);
  avCamera.position.set(0, 0, 3);
  avScene.add(avCamera);

  // Fondo de estrellas
  const textureLoader = new THREE_NS.TextureLoader();
  const starTexture = textureLoader.load(
    'static/textures/nocheHD.jpg',
    () => console.log('✨ Fondo de estrellas cargado'),
    undefined,
    (err) => console.warn('⚠️ Error al cargar fondo de estrellas:', err)
  );

  const starGeometry = new THREE_NS.SphereGeometry(900, 64, 64);
  const starMaterial = new THREE_NS.MeshBasicMaterial({
    map: starTexture,
    side: THREE_NS.BackSide,
  });
  const starSphere = new THREE_NS.Mesh(starGeometry, starMaterial);
  avScene.add(starSphere);

  // Luces
  const ambient = new THREE_NS.AmbientLight(0xffffff, 0.3);
  avScene.add(ambient);

  avLight = new THREE_NS.DirectionalLight(0xffffff, 0.8);
  avLight.position.set(3, 2, 4);
  avScene.add(avLight);

  const dirLight2 = new THREE_NS.DirectionalLight(0xffaa66, 0.35);
  dirLight2.position.set(-4, -2, 3);
  avScene.add(dirLight2);

  const rimLight = new THREE_NS.PointLight(0x6688ff, 0.4, 10);
  rimLight.position.set(-2, 1, -3);
  avScene.add(rimLight);

  // Asteroide procedural con textura adaptada
  function createAsteroidWithTexture(diameterKm, seed) {
    const radius = diameterToSceneRadius(diameterKm);
    const geometry = new THREE_NS.SphereGeometry(radius, 96, 96);
    const positions = geometry.attributes.position;
    const random = seededRandom(seed);
    const offsetX = random() * 100;
    const offsetY = random() * 100;
    const offsetZ = random() * 100;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      const noise1 = Math.sin((x + offsetX) * 1.5 + y * 0.8) * Math.cos(z * 1.2);
      const noise2 = Math.sin(y * 1.8 + (z + offsetY) * 1.0) * Math.cos(x * 1.5);
      const noise3 = Math.sin((z + offsetZ) * 1.3 + x * 1.1) * Math.cos(y * 1.6);
      const combinedNoise = noise1 * 0.35 + noise2 * 0.35 + noise3 * 0.3;
      const craterNoise = Math.sin(x * 3) * Math.sin(y * 3) * Math.sin(z * 3);
      const displacement = combinedNoise * 0.25 + craterNoise * 0.1;

      const length = Math.sqrt(x * x + y * y + z * z) || 1;
      const scale = 1 + displacement;
      positions.setXYZ(
        i,
        (x / length) * radius * scale,
        (y / length) * radius * scale,
        (z / length) * radius * scale
      );
    }

    geometry.computeVertexNormals();

    // Cargar textura y adaptarla a la superficie
    const asteroidTexture = textureLoader.load(
      'static/textures/asteroide.jpg',
      () => {},
      undefined,
      (err) => console.warn('⚠️ Error al cargar textura de asteroide:', err)
    );
    asteroidTexture.wrapS = THREE_NS.RepeatWrapping;
    asteroidTexture.wrapT = THREE_NS.RepeatWrapping;
    asteroidTexture.anisotropy = 4;

    const material = new THREE_NS.MeshPhongMaterial({
      map: asteroidTexture,
      shininess: 5,
      specular: 0x333333,
    });

    const mesh = new THREE_NS.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Crear el asteroide inicial
  avAsteroid = createAsteroidWithTexture(meteoriteState.diameterKM, meteoriteState.seed);
  avScene.add(avAsteroid);

  // Cuando se regenere el meteorito, reemplazar el mesh y mantener la textura pegada
  window.regenerateMeteorite = function (overrides = {}) {
    meteoriteState = {
      diameterKM: overrides.diameterKM !== undefined ? Number(overrides.diameterKM) : meteoriteState.diameterKM,
      seed: overrides.seed !== undefined ? Number(overrides.seed) : meteoriteState.seed
    };
    if (!avScene) return;
    disposeMesh(avAsteroid);
    avAsteroid = createAsteroidWithTexture(meteoriteState.diameterKM, meteoriteState.seed);
    avScene.add(avAsteroid);
    updateViewerRotationSpeed();
  };

  addAsteroidViewerControls();
  requestAnimationFrame(asteroidViewerAnimate);
}

function addAsteroidViewerControls() {
    if (!avRenderer) return;
    const domElement = avRenderer.domElement;
    
    // Variables para el control de órbita
    let isRotating = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Configuración de la órbita
    const orbit = {
        theta: 0,    // Ángulo horizontal
        phi: Math.PI / 2, // Ángulo vertical (empezamos mirando de frente)
        radius: 3,   // Distancia de la cámara al asteroide
        minRadius: 1.5,
        maxRadius: 15,
        minPhi: 0.1,
        maxPhi: Math.PI - 0.1
    };
    
    // Función para actualizar la posición de la cámara
    function updateCameraPosition() {
        // Convertir coordenadas esféricas a cartesianas
        const x = orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
        const y = orbit.radius * Math.cos(orbit.phi);
        const z = orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
        
        avCamera.position.set(x, y, z);
        avCamera.lookAt(0, 0, 0); // Mirar al centro donde está el asteroide
    }
    
    // Inicializar posición de la cámara
    updateCameraPosition();
    
    // Eventos del mouse
  domElement.addEventListener('mousedown', (event) => {
    isRotating = true;
    avDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
        domElement.style.cursor = 'grabbing';
    });
    
    domElement.addEventListener('mousemove', (event) => {
        if (!isRotating) return;
        
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;
        
        // Sensibilidad de rotación
        const sensitivity = 0.01;
        
        // Actualizar ángulos de órbita
        orbit.theta -= deltaX * sensitivity;
        orbit.phi -= deltaY * sensitivity;
        
        // Limitar ángulo vertical para evitar volteretas
        orbit.phi = Math.max(orbit.minPhi, Math.min(orbit.maxPhi, orbit.phi));
        
        // Actualizar posición de la cámara
        updateCameraPosition();
        
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
  domElement.addEventListener('mouseup', () => {
    isRotating = false;
    avDragging = false;
        domElement.style.cursor = 'grab';
    });
    
    domElement.addEventListener('mouseleave', () => {
    isRotating = false;
    avDragging = false;
        domElement.style.cursor = 'grab';
    });

  domElement.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) return;
    isRotating = true;
    avDragging = true;
    const touch = event.touches[0];
    previousMousePosition = { x: touch.clientX, y: touch.clientY };
    domElement.style.cursor = 'grabbing';
  }, { passive: true });

  domElement.addEventListener('touchmove', (event) => {
    if (!isRotating || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - previousMousePosition.x;
    const deltaY = touch.clientY - previousMousePosition.y;
    const sensitivity = 0.01;
    orbit.theta -= deltaX * sensitivity;
    orbit.phi -= deltaY * sensitivity;
    orbit.phi = Math.max(orbit.minPhi, Math.min(orbit.maxPhi, orbit.phi));
    updateCameraPosition();
    previousMousePosition = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  const endTouch = () => {
    if (!isRotating) return;
    isRotating = false;
    avDragging = false;
    domElement.style.cursor = 'grab';
  };

  domElement.addEventListener('touchend', endTouch, { passive: true });
  domElement.addEventListener('touchcancel', endTouch, { passive: true });
    
    // Zoom con rueda del mouse
    domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        
        const zoomSpeed = 0.1;
        const zoomDirection = event.deltaY > 0 ? -1 : 1;
        
        orbit.radius += zoomDirection * zoomSpeed;
        orbit.radius = Math.max(orbit.minRadius, Math.min(orbit.maxRadius, orbit.radius));
        
        updateCameraPosition();
    });
    
    // Configurar cursor inicial
    domElement.style.cursor = 'grab';
}

function asteroidViewerAnimate() {
  requestAnimationFrame(asteroidViewerAnimate);

  // Rotación automática cuando no se está arrastrando
  if (!avDragging) {
    if (avAsteroid) {
      avAsteroid.rotation.y += avRotSpeed;
    }
    // Rotación muy lenta del cielo (como en la Tierra)
    if (starSphere) {
      starSphere.rotation.y += avRotSpeed * 0.1; // Más lento que el asteroide
    }
  }

  if (avRenderer && avScene && avCamera) {
    avRenderer.render(avScene, avCamera);
  }
}


function resizeAsteroidViewer() {
  if (!asteroidCanvas || !avRenderer || !avCamera) return;
  const w = asteroidCanvas.clientWidth; const h = asteroidCanvas.clientHeight;
  avRenderer.setSize(w, h);
  avCamera.aspect = Math.max(0.1, w / Math.max(1, h));
  avCamera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeAsteroidViewer);

// Flujo de simulación (sin backend)
simulateBtn.addEventListener('click', () => {
  if (selectedLat === null || selectedLon === null) { alert('Selecciona un punto de impacto en el mapa de la izquierda.'); return; }
  const payload = {
    diameter: Number(diameterInput.value),
    velocity: Number(velocityInput.value),
    density: Number(densityInput.value),
    impactLat: selectedLat,
    impactLon: selectedLon,
    mitigationVelocity: Number(mitigationInput.value)
  };
  const data = runSimulationTemplate(payload); // <- Aquí se conecta el modelo
  // Actualizar resultados
  energyOut.textContent = data.impactEnergyMT.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  craterOut.textContent = data.craterDiameterKM.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  magnitudeOut.textContent = data.seismicMagnitude.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  // Dibujar zonas
  drawEffectZones(data.impactLat, data.impactLon, data.craterDiameterKM, data.effectZones);
  // Animar 3D
  animateImpact(data.impactLat, data.impactLon);
  map.removeControl(legend2);
  legend2.addTo(map);
});

// Visualization toggle control
const vizToggle = L.control({ position: 'topleft' });
vizToggle.onAdd = function() {
  const div = L.DomUtil.create('div', 'leaflet-control visualization-toggle');
  div.style.background = '#0b1526';
  div.style.border = '2px solid #22304a';
  div.style.borderRadius = '8px';
  div.style.padding = '12px';
  div.style.color = '#e8eef5';
  div.style.minWidth = '180px';
  div.style.width = "50%";

  div.innerHTML = `
    <div style="font-weight:600;margin-bottom:10px;">Visualizaciones</div>
    <button class="viz-btn" data-viz="crater" style="width:100%;margin-bottom:6px;padding:8px;background:#2a7de1;color:#fff;border:none;border-radius:6px;cursor:pointer;">
      Cráter
    </button>
    <button class="viz-btn" data-viz="blast" style="width:100%;margin-bottom:6px;padding:8px;background:#1a2332;color:#e8eef5;border:1px solid #22304a;border-radius:6px;cursor:pointer;">
      Anillos de Explosión
    </button>
    <button class="viz-btn" data-viz="seismic" style="width:100%;margin-bottom:6px;padding:8px;background:#1a2332;color:#e8eef5;border:1px solid #22304a;border-radius:6px;cursor:pointer;">
      Alcance sísmico
    </button>
    <button class="viz-btn" data-viz="casualties" style="width:100%;padding:8px;background:#1a2332;color:#e8eef5;border:1px solid #22304a;border-radius:6px;cursor:pointer;">
      Víctimas
    </button>
  `;
  
  L.DomEvent.disableClickPropagation(div);
  
  div.querySelectorAll('.viz-btn').forEach(btn => {
    btn.onclick = () => switchVisualization(btn.dataset.viz);
  });
  
  return div;
};

function switchVisualization(type) {
  currentVisualization = type;

  // --- Update button styles ---
  document.querySelectorAll('.viz-btn').forEach(btn => {
    if (btn.dataset.viz === type) {
      btn.style.background = '#2a7de1';
      btn.style.border = 'none';
    } else {
      btn.style.background = '#1a2332';
      btn.style.border = '1px solid #22304a';
    }
  });

  // --- Hide all layers first ---
  if (craterCircle && map.hasLayer(craterCircle)) map.removeLayer(craterCircle);
  [blastCircles, casualtyCircles, seismicCircles].forEach(arr => {
    arr.forEach(c => { if (map.hasLayer(c)) map.removeLayer(c); });
  });

  // --- Show only the selected visualization ---
  if (type === 'crater' && craterCircle) {
    craterCircle.addTo(map);
    craterCircle.setStyle({ opacity: 0.8, fillOpacity: 0.5 });
  } 
  
  else if (type === 'blast') {
    blastCircles.forEach(c => {
      const baseOpacity = c.options.originalFillOpacity ?? c.options.fillOpacity ?? 0.2;
      c.setStyle({ opacity: 1, fillOpacity: baseOpacity });
      c.addTo(map);
    });
  } 
  
  else if (type === 'casualties') {
    casualtyCircles.forEach(c => {
      const baseOpacity = c.options.originalFillOpacity ?? c.options.fillOpacity ?? 0.2;
      c.setStyle({ opacity: 1, fillOpacity: baseOpacity });
      c.addTo(map);
    });
  } 
  
  else if (type === 'seismic') {
    const opacities = [0.1, 0.15, 0.2, 0.25, 0.3]; // outer → inner
    seismicCircles.forEach((c, idx) => {
      c.setStyle({ opacity: 1, fillOpacity: opacities[idx] || 0.2 });
      c.addTo(map);
    });
  }
}

const accessibilityMenuButton = document.getElementById('accessibilityMenuButton');
const accessibilityMenu = document.getElementById('accessibilityMenu');
const faqModal = document.getElementById('faqModal');
const faqOverlay = document.getElementById('faqOverlay');
const faqCloseBtn = document.getElementById('faqCloseBtn');
const faqOpenBtn = document.getElementById('faq-open-btn');

function isMenuOpen() {
  return accessibilityMenu && !accessibilityMenu.classList.contains('hidden');
}

function openAccessibilityMenu() {
  if (!accessibilityMenu || !accessibilityMenuButton) return;
  accessibilityMenu.classList.remove('hidden');
  accessibilityMenuButton.setAttribute('aria-expanded', 'true');
}

function closeAccessibilityMenu() {
  if (!accessibilityMenu || !accessibilityMenuButton) return;
  accessibilityMenu.classList.add('hidden');
  accessibilityMenuButton.setAttribute('aria-expanded', 'false');
}

function toggleAccessibilityMenu() {
  if (!accessibilityMenu) return;
  if (isMenuOpen()) closeAccessibilityMenu(); else openAccessibilityMenu();
}

function isFaqOpen() {
  return faqModal && !faqModal.classList.contains('hidden');
}

function openFaqModal() {
  if (!faqModal) return;
  faqModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  closeAccessibilityMenu();
  setTimeout(() => {
    if (faqCloseBtn) faqCloseBtn.focus();
  }, 0);
}

function closeFaqModal() {
  if (!faqModal) return;
  faqModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  setTimeout(() => {
    if (faqOpenBtn) {
      faqOpenBtn.focus();
    } else if (accessibilityMenuButton) {
      accessibilityMenuButton.focus();
    }
  }, 0);
}

if (accessibilityMenuButton) {
  accessibilityMenuButton.addEventListener('click', (event) => {
    event.preventDefault();
    toggleAccessibilityMenu();
  });
}

document.addEventListener('click', (event) => {
  if (!accessibilityMenu || !accessibilityMenuButton) return;
  const withinMenu = accessibilityMenu.contains(event.target);
  const isButton = accessibilityMenuButton.contains(event.target);
  if (!withinMenu && !isButton) {
    closeAccessibilityMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (isFaqOpen()) {
      closeFaqModal();
      event.preventDefault();
      return;
    }
    if (isMenuOpen()) {
      closeAccessibilityMenu();
      event.preventDefault();
    }
  }
});

if (faqOpenBtn) {
  faqOpenBtn.addEventListener('click', (event) => {
    event.preventDefault();
    openFaqModal();
  });
}

if (faqOverlay) {
  faqOverlay.addEventListener('click', closeFaqModal);
}

if (faqCloseBtn) {
  faqCloseBtn.addEventListener('click', (event) => {
    event.preventDefault();
    closeFaqModal();
  });
}

document.querySelectorAll('[data-lang-option]').forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    const lang = btn.getAttribute('data-lang-option');
    setLanguage(lang);
    closeAccessibilityMenu();
  });
});

(function initializeLanguage() {
  let initialLang = 'es';
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && translations[stored]) {
      initialLang = stored;
    } else {
      const browserLang = (navigator.language || navigator.userLanguage || '').slice(0, 2);
      if (translations[browserLang]) initialLang = browserLang;
    }
  } catch (_) {}
  setLanguage(initialLang);
  window.setLanguage = setLanguage;
})();

// Accesibilidad: botón de modo daltónico (toggle en <body>)
(function(){
  const colorToggleButton = document.getElementById('color-toggle-btn');
  if (!colorToggleButton) return;
  // Restaurar preferencia guardada (opcional)
  try {
    const saved = localStorage.getItem('colorblind-mode');
    if (saved === '1') document.body.classList.add('colorblind-mode');
  } catch (_) {}
  colorToggleButton.addEventListener('click', () => {
    document.body.classList.toggle('colorblind-mode');
    try {
      localStorage.setItem('colorblind-mode', document.body.classList.contains('colorblind-mode') ? '1' : '0');
    } catch (_) {}
    closeAccessibilityMenu();
  });
})();

function updateMapCrater(craterRadius) {
    if (craterCircle) {
        map.removeLayer(craterCircle);
    }
    
    if (!impactMarker) return;
    
    const impactCoords = impactMarker.getLatLng();
    
    craterCircle = L.circle(impactCoords, {
        radius: craterRadius,
        color: '#8B0000',
        fillColor: '#8B0000',
        fillOpacity: currentVisualization === 'crater' ? 0.5 : 0,
        opacity: currentVisualization === 'crater' ? 0.8 : 0,
        weight: 2
    }).addTo(map);
    
    if (currentVisualization === 'crater') {
        map.fitBounds(craterCircle.getBounds(), { padding: [50, 50] });
    }
}

function updateLegend(craterRadius) {
    const legendDiv = document.querySelector('.legend'); // Adjust selector as needed
    
    if (!legendDiv) {
        console.warn('Legend div not found');
        return;
    }
    
    legendDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:12px;height:12px;background:rgba(139, 0, 0, 0.6);border:1px solid rgba(255,255,255,0.25);display:inline-block;"></span> 
            Cráter (${(craterRadius/1000).toFixed(2)} km)
        </div>
    `;
}

// Make sure button listener is added AFTER the DOM loads
document.addEventListener('DOMContentLoaded', function() {
    const simulateBtn = document.getElementById('simulateBtn');
    console.log('Simulate button:', simulateBtn); // Check if button exists
    
    if (simulateBtn) {
        simulateBtn.addEventListener('click', function() {
            console.log('Button clicked!');
            updateCraterDisplay();
        });
    } else {
        console.error('simulateBtn not found!');
    }
});

// Dimensiones de cráter
function calculateCraterImpact(phi_i, phi_t, L, v_i, theta_deg) {
    const H = 8;
    const Cd = 2;
    const phi_0 = 1;
    const theta = (theta_deg * Math.PI) / 180; // Convert to radians
   
    // Impactor yield strength
    const Yi = Math.pow(10, 6) * Math.pow(10, 2.107 + 0.0624 * Math.sqrt(phi_i));
   
    // Strength parameter I (using L, not L0)
    const I_f = 4.07 * ((Cd * H * Yi) / (phi_i * L * Math.pow(v_i, 2) * Math.sin(theta)));
   
    let L_final; // Renamed to avoid confusion
   
    if (I_f > 1) {
        L_final = L;
    } else {
        // Breakup altitude
        const z_o = -H * (Math.log(Yi / (phi_0 * Math.pow(v_i, 2))) + 1.308 - 0.314 * I_f - 1.303 * Math.sqrt(1 - I_f));
       
        // Density at breakup altitude
        const phi_zo = phi_0 * Math.exp(-z_o / H);
       
        // Dispersion length (using L, not L0)
        const l = L * Math.sin(theta) * Math.sqrt(phi_i / (Cd * phi_zo));
       
        // Final diameter (using L, not L0)
        L_final = L * Math.sqrt(1 + Math.pow((2 * H / l), 2) * Math.pow((Math.exp((z_o - 0) / (2 * H)) - 1), 2));
    }
    
    const g_E = 9.81;
    // Transient crater calculations (using L_final, not L)
    const D_tc = 1.161 * Math.pow(phi_i / phi_t, 1 / 3) * Math.pow(L_final, 0.78) *
                 Math.pow(v_i, 0.44) * Math.pow(g_E, -0.22) *
                 Math.pow(Math.sin(theta), 1 / 3);
   
    const d_tc = D_tc / (2 * Math.sqrt(2));
    const V_tc = (Math.PI * Math.pow(D_tc, 3)) / (16 * Math.sqrt(2)) * 1e-9;
    
    let craterType, D_fr, d_fr, h_fr;
    
    if (D_tc <= 2560) {
        craterType = 'Cráter simple';
        D_fr = 1.25 * D_tc;
        const V_br = 0.032 * Math.pow(D_fr, 3);
        d_fr = 0.294 * Math.pow(D_fr, 0.301) * 100;
        h_fr = 0.07 * (Math.pow(D_tc, 4) / Math.pow(D_fr, 3));
    } else {
        craterType = 'Cráter complejo';
        const D_c = 3200;
        D_fr = 1.17 * Math.pow(D_tc, 1.13) / Math.pow(D_c, 0.13);
        d_fr = 0.4 * Math.pow(D_fr, 0.3);
        h_fr = 0;
    }
    
    return {
        craterType,
        D_tc,
        d_tc,
        V_tc,
        D_fr,
        d_fr,
        h_fr
    };
}

// === Blast Rings (Table 4 scaled) ===
const table1kt = [
  {d1_m: 126,  p_pa: 426000, desc: "Vehículos destruidos y desplazados"},
  {d1_m: 133,  p_pa: 379000, desc: "Puentes colapsarán"},
  {d1_m: 149,  p_pa: 297000, desc: "Vehículos volcados; reparaciones mayores"},
  {d1_m: 155,  p_pa: 273000, desc: "Edificios de acero: distorsión extrema"},
  {d1_m: 229,  p_pa: 121000, desc: "Puentes de armadura colapsarán"},
  {d1_m: 251,  p_pa: 100000, desc: "Puentes: distorsión sustancial"},
  {d1_m: 389,  p_pa: 42600,  desc: "Edificios de varios pisos colapsarán"},
  {d1_m: 411,  p_pa: 38500,  desc: "Edificios: grietas severas"},
  {d1_m: 502,  p_pa: 26800,  desc: "Edificios de madera casi colapso total"},
  {d1_m: 549,  p_pa: 22900,  desc: "Techos severamente dañados"},
  {d1_m: 1160, p_pa: 6900,   desc: "Ventanas rotas"}
];

// Casualty probability functions
function fatalityProb(r) {
  const A = 1.7809, k = 0.6533;
  return Math.min(1, A * Math.exp(-k * r));
}

function injuryProb(r) {
  const C = 0.4979, mu = 3.8978, sigma = 1.7290;
  return C * Math.exp(-Math.pow(r - mu, 2) / (2 * Math.pow(sigma, 2)));
}

// Query population from Overpass API
async function getPopulation(lat, lon) {
  const url = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:5000,${lat},${lon})[place~"city|town|village"][population];out 1;`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.elements && data.elements.length > 0) {
      const popStr = data.elements[0].tags.population;
      const pop = parseInt(popStr);
      if (!isNaN(pop)) return pop;
    }
  } catch (err) {
    console.error("Population fetch failed", err);
  }
  return 50000; // fallback
}

// Storage for blast circles
let blastCircles = [];

// Draw blast damage rings
function drawBlastRings(latlng, energyMegatons) {
  blastCircles.forEach(c => map.removeLayer(c));
  blastCircles = [];
  
  const energyKt = energyMegatons * 1000;
  const scale = Math.cbrt(energyKt);
  
  const scaled = table1kt.map((row) => ({
    d_m: row.d1_m * scale,
    p_pa: row.p_pa,
    desc: row.desc
  }));
  
  const colors = ['#8B0000', '#FF4500', '#FF8C00', '#FFD700', '#90EE90', '#4169E1'];
  
  for (let i = scaled.length - 1; i >= 0; i--) {
    const entry = scaled[i];
    const colorIdx = Math.floor((i / scaled.length) * colors.length);
    const baseOpacity = 0.1 + (0.05 * (scaled.length - i));
    
    const circle = L.circle(latlng, {
      radius: entry.d_m,
      color: colors[colorIdx],
      weight: 2,
      fillColor: colors[colorIdx],
      fillOpacity: currentVisualization === 'blast' ? baseOpacity : 0,
      opacity: currentVisualization === 'blast' ? 2 : 0,
      originalFillOpacity: baseOpacity // Store for later
    }).addTo(map);
    
    circle.bindPopup(`
      <b>Zona ${i + 1}</b><br/>
      ${entry.desc}<br/>
      <b>Distancia:</b> ${(entry.d_m / 1000).toFixed(2)} km<br/>
      <b>Presión:</b> ${(entry.p_pa / 1000).toFixed(0)} kPa
    `);
    
    blastCircles.push(circle);
  }
  
  if (currentVisualization === 'blast' && blastCircles.length > 0) {
    map.fitBounds(blastCircles[0].getBounds(), { padding: [50, 50] });
  }
}

// Calculate casualties
async function calculateCasualties(latlng, radiusMiles) {
  const pop = await getPopulation(latlng.lat, latlng.lng);
  const cityRadius = 5; // km
  const density = pop / (Math.PI * cityRadius ** 2);
  
  let totalFatal = 0, totalInj = 0;
  const step = 0.5;
  
  for (let r = 0; r < radiusMiles; r += step) {
    const ringArea = Math.PI * ((r + step) ** 2 - r ** 2);
    const ringPop = density * ringArea;
    totalFatal += ringPop * fatalityProb(r + step / 2);
    totalInj += ringPop * injuryProb(r + step / 2);
  }
  
  return { pop, totalFatal, totalInj };
}

function drawCasualtyRings(latlng, radiusMiles, casualties) {
  casualtyCircles.forEach(c => map.removeLayer(c));
  casualtyCircles = [];
  
  const radiusMeters = radiusMiles * 1609.34;
  const zones = [
    { r: 0.25, color: '#8B0000', label: 'Zona de Muerte Inmediata' },
    { r: 0.5, color: '#FF4500', label: 'Zona de Mortalidad Alta' },
    { r: 1, color: '#FF8C00', label: 'Zona de Lesiones Graves' },
    { r: 2, color: '#FFD700', label: 'Zona de Lesiones Moderadas' },
    { r: 3, color: '#90EE90', label: 'Zona de Lesiones Leves' }
  ];
  
  for (let i = zones.length - 1; i >= 0; i--) {
    const zone = zones[i];
    const baseOpacity = 0.15 + (0.1 * (zones.length - i));
    
    const circle = L.circle(latlng, {
      radius: radiusMeters * zone.r,
      color: zone.color,
      weight: 2,
      fillColor: zone.color,
      fillOpacity: currentVisualization === 'casualties' ? baseOpacity : 0,
      opacity: currentVisualization === 'casualties' ? 2 : 0,
      originalFillOpacity: baseOpacity
    }).addTo(map);
    
    const zoneFatal = Math.round(casualties.totalFatal * fatalityProb(zone.r));
    const zoneInj = Math.round(casualties.totalInj * injuryProb(zone.r));
    
    circle.bindPopup(`
      <b>${zone.label}</b><br/>
      <b>Radio:</b> ${(radiusMeters * zone.r / 1000).toFixed(2)} km<br/>
      <b>Muertes estimadas:</b> ${zoneFatal.toLocaleString()}<br/>
      <b>Heridos estimados:</b> ${zoneInj.toLocaleString()}
    `);
    
    casualtyCircles.push(circle);
  }
  
  if (currentVisualization === 'casualties' && casualtyCircles.length > 0) {
    map.fitBounds(casualtyCircles[0].getBounds(), { padding: [50, 50] });
  }
}

// Enhanced seismic visualization function
function visualizeSeismicZones(latlng, mass, velocity) {
    // Clear old seismic circles
    seismicCircles.forEach(c => map.removeLayer(c));
    seismicCircles = [];
    
    // Constants
    const RE = 6371;
    const MT = 9.184e15;
    
    // Calculate base magnitude
    const Ek = 0.5 * mass * Math.pow(velocity, 2);
    const E = Ek / MT;
    const M = 0.67 * Math.log10(E) - 5.87;
    
    // Define seismic zones with distances and descriptions
    const zones = [
        { distance: 50, color: '#8B0000', desc: 'Daño extremo', opacity: 0.3 },
        { distance: 100, color: '#FF4500', desc: 'Daño severo', opacity: 0.25 },
        { distance: 300, color: '#FF8C00', desc: 'Daño moderado', opacity: 0.2 },
        { distance: 600, color: '#FFD700', desc: 'Daño ligero', opacity: 0.15 },
        { distance: 900, color: '#90EE90', desc: 'Perceptible', opacity: 0.1 }
    ];
    
    // Draw circles from largest to smallest
    for (let i = zones.length - 1; i >= 0; i--) {
        const zone = zones[i];
        const distance_km = zone.distance;
        
        // Calculate effective magnitude at this distance
        let Meff;
        if (distance_km < 60) {
            Meff = M - 0.0238 * distance_km;
        } else if (distance_km < 700) {
            Meff = M - 0.0048 * distance_km - 1.1644;
        } else {
            const delta = distance_km / RE;
            Meff = M - 1.661 * Math.log10(delta) - 6.399;
        }
        
        const circle = L.circle(latlng, {
            radius: distance_km * 1000, // Convert km to meters
            color: zone.color,
            weight: 2,
            fillColor: zone.color,
            fillOpacity: zone.opacity
        }).addTo(map);
        
        circle.bindPopup(`
            <b>${zone.desc}</b><br/>
            <b>Distancia:</b> ${distance_km} km<br/>
            <b>Magnitud sísmica:</b> ${Meff.toFixed(2)}
        `);
        
        seismicCircles.push(circle);
    }
    
    return M;
}

// Update your updateCraterDisplay function to include blast effects
async function updateCraterDisplay() {
  console.log('=== updateCraterDisplay START ===');
  
  if (globe3DContainer) globe3DContainer.classList.add('hidden');
  if (map2D) map2D.classList.remove('hidden');
  
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
  
  if (!impactMarker) {
    alert('Por favor, haz clic en el mapa para seleccionar un punto de impacto');
    return;
  }
  
  const L_input = parseFloat(diameterInput.value);
  const v_i = parseFloat(velocityInput.value) * 1000;
  // const theta_rad = (theta_deg * Math.PI) / 180;
  // const v_i = v_0 * Math.exp(3 / (2 * phi_i * L_input * Math.sin(theta_rad)));
  const phi_i = parseFloat(document.getElementById('density').value);
  const phi_t = 2000;
  const theta_deg = 120 - parseFloat(document.getElementById('mitigation').value);
  
  // Calculate crater
  const craterData = calculateCraterImpact(phi_i, phi_t, L_input, v_i, theta_deg);
  
  // Update results panel
  document.getElementById('craterType').textContent = craterData.craterType;
  updateCraterImageDisplay(craterData.craterType);
  document.getElementById('D_tc').textContent = craterData.D_tc.toFixed(2);
  document.getElementById('D_fr').textContent = craterData.D_fr.toFixed(2);
  document.getElementById('d_fr').textContent = craterData.d_fr.toFixed(2);
  document.getElementById('h_fr').textContent = craterData.h_fr > 0 ? craterData.h_fr.toFixed(2) : 'N/A';
  
  // Calculate energy
  const mass = (4 / 3) * Math.PI * Math.pow(L_input / 2, 3) * phi_i;
  const energy_joules = 0.5 * mass * Math.pow(v_i, 2);
  const energy_megatons = energy_joules / (4.184e15);
  document.getElementById('energy').textContent = energy_megatons.toFixed(2);
  
  // Draw crater
  const craterRadius = craterData.D_fr / 2;
  updateMapCrater(craterRadius);
  
  // Draw blast damage rings
  const impactCoords = impactMarker.getLatLng();
  drawBlastRings(impactCoords, energy_megatons);
  
  // Calculate casualties (convert crater radius to miles for casualty model)
  const radiusMiles = ((craterData.D_fr / 2) / 1609.34);
  const casualties = await calculateCasualties(impactCoords, radiusMiles * 3);
  
  drawCasualtyRings(impactCoords, radiusMiles, casualties);
  
  // Visualize seismic zones
  const baseMagnitude = visualizeSeismicZones(impactCoords, mass, v_i);

  // Add toggle if not exists
  if (!map._controlCorners.topleft.querySelector('.visualization-toggle')) {
    vizToggle.addTo(map);
  }
  
  // Show current visualization
  switchVisualization(currentVisualization);

  // Update magnitude and casualties display
  const magnitudeEl = document.getElementById('magnitude');
  if (magnitudeEl) {
    magnitudeEl.textContent = `${baseMagnitude.toFixed(2)} Richter | Población: ${casualties.pop.toLocaleString()}, Muertes: ${Math.round(casualties.totalFatal).toLocaleString()}, Heridos: ${Math.round(casualties.totalInj).toLocaleString()}`;
  }
  
  console.log('=== updateCraterDisplay END ===');
}
