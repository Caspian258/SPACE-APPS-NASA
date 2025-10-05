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

// Vistas
const show3D = document.getElementById('show3D');
const show2D = document.getElementById('show2D');
const globe3D = document.getElementById('globe3D');
const map2D = document.getElementById('map2D');
const dataSourceSelect = document.getElementById('dataSourceSelect');
const objectSelect = document.getElementById('objectSelect');
const objectSummary = document.getElementById('objectSummary');

// Visor de Asteroides UI refs
const simLayout = document.getElementById('simLayout');
const asteroidViewer = document.getElementById('asteroidViewer');
const openAsteroidViewerBtn = document.getElementById('openAsteroidViewerBtn');
const modeToggle = document.getElementById('modeToggle');
const manualControls = document.getElementById('manualControls');
const apiControls = document.getElementById('apiControls');
const manSpeed = document.getElementById('manSpeed');
const manDensity = document.getElementById('manDensity');
const manRotation = document.getElementById('manRotation');
const manDiameter = document.getElementById('manDiameter');
const manDiameterValue = document.getElementById('manDiameterValue');
const manSpeedValue = document.getElementById('manSpeedValue');
const manDensityValue = document.getElementById('manDensityValue');
const manRotationValue = document.getElementById('manRotationValue');
const apiAsteroidSelect = document.getElementById('apiAsteroidSelect');
const apiAsteroidDetails = document.getElementById('apiAsteroidDetails');
const apiDataSourceSelect = document.getElementById('apiDataSourceSelect');
const asteroidCanvas = document.getElementById('asteroidCanvas');

// Catálogos disponibles
const DATA_SOURCES = {
  asteroids: {
    key: 'asteroids',
    label: 'Asteroides',
    path: 'Database/Trials/BaseAsteroides.jsonl',
    format: 'jsonl'
  },
  comets: {
    key: 'comets',
    label: 'Cometas',
    path: 'Database/Trials/Comets.json',
    format: 'json'
  }
};

let currentDataSourceKey = 'asteroids';
let catalog = [];
let currentObjectIndex = null;
let isCatalogLoading = false;
let suppressSelectionEvents = false;

// Mostrar valores de sliders
function updateSliderDisplays() {
  diameterValue.textContent = `${diameterInput.value} m`;
  velocityValue.textContent = `${Number(velocityInput.value).toFixed(1)} km/s`;
  mitigationValue.textContent = `${Number(mitigationInput.value).toFixed(3)} km/s`;
}
[diameterInput, velocityInput, mitigationInput].forEach(el => el.addEventListener('input', updateSliderDisplays));
updateSliderDisplays();

function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.warn('Línea JSONL inválida omitida:', line);
        return null;
      }
    })
    .filter(Boolean);
}

function hashStringToSeed(str) {
  if (!str) return 101;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000;
  }
  return Math.max(1, hash);
}

function toNumber(value, fallback = NaN) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeAsteroidRecord(record, index = 0) {
  if (!record) return null;
  const name = record.full_name || `Asteroide ${index + 1}`;
  const a = toNumber(record.a);
  const e = Math.min(0.999, Math.max(0, toNumber(record.e)));
  const inclination = toNumber(record.i);
  const ascendingNode = toNumber(record.om);
  const argPeriapsis = toNumber(record.w);
  const meanAnomaly = toNumber(record.ma);
  const eccentricAnomaly = toNumber(record.E_deg);

  const rawDiameter = toNumber(record.diameter);
  const diameterKm = Number.isFinite(rawDiameter)
    ? (rawDiameter > 50 ? rawDiameter / 1000 : rawDiameter)
    : 1;

  const density = 2500 + (hashStringToSeed(name) % 1500);
  const rotation = 6 + ((hashStringToSeed(name) % 80) / 10);

  return {
    id: `ast-${index}`,
    type: 'asteroid',
    name,
    diameterKm: Math.max(0.1, diameterKm),
    density,
    rotation_period: rotation,
    seed: hashStringToSeed(name),
    a,
    e,
    i: inclination,
    omega: ascendingNode,
    argPeriapsis,
    meanAnomaly,
    eccentricAnomaly,
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
  const density = 600 + (hashStringToSeed(name) % 200);
  const rotation = period > 0 ? Math.min(48, period * 2) : 12;

  return {
    id: `com-${index}`,
    type: 'comet',
    name,
    diameterKm,
    density,
    rotation_period: rotation,
    seed: hashStringToSeed(name),
    a,
    e,
    i: inclination,
    omega: ascendingNode,
    argPeriapsis,
    meanAnomaly: 0,
    eccentricAnomaly: null,
    raw: record
  };
}

function getNormalizerForSource(key) {
  return key === 'comets' ? normalizeCometRecord : normalizeAsteroidRecord;
}

function updateDataSourceSelectors(key) {
  if (dataSourceSelect && dataSourceSelect.value !== key) {
    dataSourceSelect.value = key;
  }
  if (apiDataSourceSelect && apiDataSourceSelect.value !== key) {
    apiDataSourceSelect.value = key;
  }
}

function setSelectLoading(selectEl, message) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  const option = document.createElement('option');
  option.value = '';
  option.textContent = message;
  selectEl.appendChild(option);
  selectEl.disabled = true;
}

function populateMainObjectSelect() {
  if (!objectSelect) return;
  objectSelect.innerHTML = '';
  if (!catalog.length) {
    setSelectLoading(objectSelect, 'Sin datos disponibles');
    return;
  }
  catalog.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${item.name}`;
    objectSelect.appendChild(option);
  });
  objectSelect.disabled = false;
  if (currentObjectIndex !== null && catalog[currentObjectIndex]) {
    objectSelect.value = String(currentObjectIndex);
  } else {
    objectSelect.value = '0';
    currentObjectIndex = 0;
  }
}

function updateObjectSummary(objectData) {
  if (!objectSummary) return;
  if (!objectData) {
    objectSummary.textContent = '--';
    return;
  }
  const typeLabel = objectData.type === 'comet' ? 'Cometa' : 'Asteroide';
  const diameter = objectData.diameterKm ? `${objectData.diameterKm.toFixed(1)} km` : 'N/D';
  const eccentricity = Number.isFinite(objectData.e) ? objectData.e.toFixed(3) : 'N/D';
  const semiMajor = Number.isFinite(objectData.a) ? `${objectData.a.toFixed(3)} UA` : 'N/D';
  objectSummary.textContent = `${typeLabel} • Diámetro: ${diameter} • a: ${semiMajor} • e: ${eccentricity}`;
}

function populateApiSelect() {
  if (!apiAsteroidSelect) return;
  apiAsteroidSelect.innerHTML = '';
  if (!catalog.length) {
    setSelectLoading(apiAsteroidSelect, 'Sin datos disponibles');
    if (apiAsteroidDetails) apiAsteroidDetails.value = '';
    return;
  }

  catalog.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${item.name}`;
    apiAsteroidSelect.appendChild(option);
  });
  apiAsteroidSelect.disabled = false;
  if (currentObjectIndex !== null && catalog[currentObjectIndex]) {
    apiAsteroidSelect.value = String(currentObjectIndex);
  } else {
    apiAsteroidSelect.value = '0';
  }
}

function rotationPeriodToViewerSpeed(rotationPeriodHours) {
  const hours = toNumber(rotationPeriodHours, 6);
  if (!Number.isFinite(hours) || hours <= 0) return 5;
  const degPerSecond = 360 / (hours * 3600);
  const amplified = degPerSecond * 1200; // acelera para visualización
  return clampValue(amplified, 0.2, 25);
}

function estimateViewerSpeed(objectData) {
  if (!objectData) return 10;
  const raw = objectData.raw || {};
  const directVelocity = toNumber(raw.velocity_kms) || toNumber(raw.velocity) || toNumber(raw.v_infinity);
  if (Number.isFinite(directVelocity)) return clampValue(directVelocity, 0, 60);
  return objectData.type === 'comet' ? 45 : 20;
}

function syncViewerControlsFromObject(objectData) {
  if (!objectData) return;
  const diameter = clampValue(toNumber(objectData.diameterKm, meteoriteState.diameterKM), Number(manDiameter?.min) || 0.1, Number(manDiameter?.max) || 1000);
  const density = clampValue(Math.round(toNumber(objectData.density, meteoriteState.density)), Number(manDensity?.min) || 500, Number(manDensity?.max) || 8000);
  const rotationVisual = rotationPeriodToViewerSpeed(objectData.rotation_period);
  const speed = clampValue(estimateViewerSpeed(objectData), Number(manSpeed?.min) || 0, Number(manSpeed?.max) || 60);

  if (manDiameter) manDiameter.value = diameter.toFixed(1);
  if (manDensity) manDensity.value = String(Math.round(density));
  if (manRotation) manRotation.value = rotationVisual.toFixed(1);
  if (manSpeed) manSpeed.value = speed.toFixed(1);

  meteoriteState.seed = objectData.seed || hashStringToSeed(objectData.name);
}

function formatObjectDetails(objectData) {
  if (!objectData) return '';
  const lines = [];
  lines.push(`Nombre: ${objectData.name}`);
  lines.push(`Tipo: ${objectData.type === 'comet' ? 'Cometa' : 'Asteroide'}`);
  if (Number.isFinite(objectData.diameterKm)) lines.push(`Diámetro estimado: ${objectData.diameterKm.toFixed(2)} km`);
  if (Number.isFinite(objectData.density)) lines.push(`Densidad modelo: ${Math.round(objectData.density)} kg/m³`);
  if (Number.isFinite(objectData.a)) lines.push(`Semieje mayor (a): ${objectData.a.toFixed(3)} UA`);
  if (Number.isFinite(objectData.e)) lines.push(`Excentricidad (e): ${objectData.e.toFixed(3)}`);
  if (Number.isFinite(objectData.i)) lines.push(`Inclinación (i): ${objectData.i.toFixed(2)}°`);
  if (Number.isFinite(objectData.omega)) lines.push(`Nodo ascendente (Ω): ${objectData.omega.toFixed(2)}°`);
  if (Number.isFinite(objectData.argPeriapsis)) lines.push(`Arg. del perihelio (ω): ${objectData.argPeriapsis.toFixed(2)}°`);
  if (Number.isFinite(objectData.rotation_period)) lines.push(`Periodo de rotación (aprox.): ${objectData.rotation_period.toFixed(1)} h`);
  const period = toNumber(objectData.raw?.p_yr);
  if (Number.isFinite(period)) lines.push(`Período orbital: ${period.toFixed(2)} años`);
  return lines.join('\n');
}

async function switchDataSource(key, { origin = 'main', forceReload = false } = {}) {
  if (!DATA_SOURCES[key]) return;
  if (isCatalogLoading) return;
  updateDataSourceSelectors(key);

  if (!forceReload && currentDataSourceKey === key && catalog.length) {
    populateMainObjectSelect();
    populateApiSelect();
    if (catalog[currentObjectIndex || 0]) {
      updateObjectSummary(catalog[currentObjectIndex || 0]);
    }
    return;
  }

  currentDataSourceKey = key;
  isCatalogLoading = true;
  setSelectLoading(objectSelect, 'Cargando catálogo...');
  setSelectLoading(apiAsteroidSelect, 'Cargando catálogo...');
  if (apiAsteroidDetails) apiAsteroidDetails.value = '';

  const source = DATA_SOURCES[key];
  try {
    const response = await fetch(source.path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    let rawData;
    if (source.format === 'jsonl') {
      const text = await response.text();
      rawData = parseJsonl(text);
    } else {
      rawData = await response.json();
    }
    const normalizer = getNormalizerForSource(key);
    catalog = (rawData || [])
      .map((record, index) => normalizer(record, index))
      .filter(Boolean);
    currentObjectIndex = catalog.length ? 0 : null;
  } catch (error) {
    console.error('No se pudo cargar el catálogo:', error);
    catalog = [];
    currentObjectIndex = null;
  } finally {
    isCatalogLoading = false;
  }

  populateMainObjectSelect();
  populateApiSelect();
  if (catalog.length) {
    suppressSelectionEvents = true;
    if (objectSelect) objectSelect.value = String(currentObjectIndex);
    if (apiAsteroidSelect) apiAsteroidSelect.value = String(currentObjectIndex);
    suppressSelectionEvents = false;
    setActiveObjectByIndex(currentObjectIndex, { updateViewer: true, updateDetails: true });
  } else {
    updateObjectSummary(null);
  }
}

function setActiveObjectByIndex(index, { updateViewer = false, updateDetails = false } = {}) {
  if (!Array.isArray(catalog) || !catalog[index]) return;
  currentObjectIndex = index;
  const selected = catalog[index];
  updateObjectSummary(selected);
  updateSpaceObject(selected);

  if (updateViewer) {
    applyObjectToViewer(selected);
  }
  if (updateDetails) {
    updateApiDetails();
  }
}

function applyObjectToViewer(objectData) {
  if (!objectData) return;
  syncViewerControlsFromObject(objectData);
  updateManualDisplay();
  applyManualTo3D();

  if (apiAsteroidSelect && catalog[currentObjectIndex || 0]) {
    suppressSelectionEvents = true;
    apiAsteroidSelect.value = String(currentObjectIndex);
    suppressSelectionEvents = false;
  }

  if (viewerMode === 'api') {
    updateApiDetails();
  }
}

// Leaflet: mapa de selección (pequeño)
const selectionMap = L.map('selectMap', {
  worldCopyJump: true,
  attributionControl: false,
  zoomControl: false
}).setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 7 }).addTo(selectionMap);
selectionMap.on('click', (e) => {
  selectedLat = e.latlng.lat;
  selectedLon = e.latlng.lng;
  impactCoords.textContent = `Lat: ${selectedLat.toFixed(3)}, Lon: ${selectedLon.toFixed(3)}`;
  if (impactMarker) selectionMap.removeLayer(impactMarker);
  impactMarker = L.marker([selectedLat, selectedLon]).addTo(selectionMap);
});

// Leaflet: mapa principal
const map = L.map('map2D').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 10 }).addTo(map);

// Leyenda en el mapa
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function() {
  const div = L.DomUtil.create('div', 'leaflet-control legend');
  div.style.background = '#0b1526';
  div.style.border = '1px solid #22304a';
  div.style.borderRadius = '6px';
  div.style.padding = '8px';
  div.style.color = '#e8eef5';
  div.style.font = '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="width:12px;height:12px;background:${zoneColors.crater};border:1px solid rgba(255,255,255,0.25);display:inline-block;"></span> Cráter</div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="width:12px;height:12px;background:${zoneColors.total};border:1px solid rgba(255,255,255,0.25);display:inline-block;"></span> Destrucción Total</div>
    <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;background:${zoneColors.severe};border:1px solid rgba(255,255,255,0.25);display:inline-block;"></span> Daños Severos</div>
  `;
  return div;
};
legend.addTo(map);

// Capas de datos simuladas (carga desde /static/data si existen)
fetch('static/data/seismic_zones.geojson').then(r=>r.json()).then(geo=>{
  seismicLayer = L.geoJSON(geo, { style: { color: '#ff6b6b', weight: 1, opacity: 0.6, fillOpacity: 0.1 } }).addTo(map);
}).catch(()=>{});
fetch('static/data/population_density.json').then(r=>r.json()).then(pop=>{
  populationLayer = L.layerGroup((pop.features||[]).map(f=>{
    const { lat, lon, density } = f.properties;
    const radius = Math.sqrt(density) * 1000;
    return L.circle([lat, lon], { radius, color: '#6bc3ff', weight: 1, fillOpacity: 0.15 });
  })).addTo(map);
}).catch(()=>{});

document.getElementById('toggleSeismic').addEventListener('change', (e)=>{
  if (!seismicLayer) return;
  if (e.target.checked) map.addLayer(seismicLayer); else map.removeLayer(seismicLayer);
});
document.getElementById('togglePopulation').addEventListener('change', (e)=>{
  if (!populationLayer) return;
  if (e.target.checked) map.addLayer(populationLayer); else map.removeLayer(populationLayer);
});

// Vistas 2D/3D
show3D.addEventListener('click', () => { globe3D.classList.remove('hidden'); map2D.classList.add('hidden'); onResize(); });
show2D.addEventListener('click', () => { map2D.classList.remove('hidden'); globe3D.classList.add('hidden'); map.invalidateSize(); });

// Three.js (UMD) expone window.THREE cuando se carga desde <script>
const THREE_NS = window.THREE;
let renderer, scene, camera;
let earthMesh, earthCloudsMesh;
let asteroidMesh, trajectoryLine;
let orbitControls = null;
let sunLight = null;
let sunMesh = null;
let spaceObjectMesh = null;
let spaceOrbitLine = null;
let spaceOrbitPoints = null;
let spaceOrbitProgress = 0;
let isDragging = false;
let rotVelX = 0, rotVelY = 0;

let avRenderer, avScene, avCamera, avAsteroid, avLight;
let avRotSpeed = 0.01;

function clampValue(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function createSeededRandom(seed) {
  let value = Math.floor(seed || 1) % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function diameterKmToSceneRadius(diameterKm) {
  const km = Number.isFinite(diameterKm) && diameterKm > 0 ? diameterKm : 1;
  const log = Math.log10(Math.max(1, km));
  return 0.02 + Math.min(0.3, Math.max(0, log * 0.02));
}

function densityToSeed(density) {
  const val = Number.isFinite(density) ? density : 3000;
  const normalized = (val - 500) / (8000 - 500);
  return Math.floor(clampValue(normalized, 0, 1) * 1000) + 1;
}

function createMeteoriteMesh(diameterKm = 1, seed = 1) {
  if (!THREE_NS) return null;
  const random = createSeededRandom(seed);
  const radius = diameterKmToSceneRadius(diameterKm);
  const geometry = new THREE_NS.IcosahedronGeometry(radius, 4);
  const position = geometry.attributes.position;
  const vertex = new THREE_NS.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const noise = (random() - 0.5) * 0.4;
    const stretch = 1 + noise;
    vertex.multiplyScalar(stretch);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  const material = new THREE_NS.MeshStandardMaterial({
    color: 0xff8c00,
    roughness: 0.92,
    metalness: 0.08
  });
  const mesh = new THREE_NS.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function disposeMesh(mesh) {
  if (!mesh) return;
  if (mesh.parent) mesh.parent.remove(mesh);
  if (mesh.geometry) mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(mat => mat && mat.dispose && mat.dispose());
  } else if (mesh.material && mesh.material.dispose) {
    mesh.material.dispose();
  }
}

const meteoriteState = {
  diameterKM: toNumber(manDiameter?.value, 50),
  density: toNumber(manDensity?.value, 3000),
  rotationDegPerSec: toNumber(manRotation?.value, 5),
  seed: densityToSeed(toNumber(manDensity?.value, 3000))
};

function regenerateMeteorite({ diameterKM, density, seed, rotationDegPerSec } = {}) {
  if (Number.isFinite(diameterKM)) meteoriteState.diameterKM = diameterKM;
  if (Number.isFinite(density)) meteoriteState.density = density;
  if (Number.isFinite(seed)) meteoriteState.seed = seed;
  if (Number.isFinite(rotationDegPerSec)) meteoriteState.rotationDegPerSec = rotationDegPerSec;

  if (!avScene) return;
  if (avAsteroid) {
    disposeMesh(avAsteroid);
    avAsteroid = null;
  }
  const mesh = createMeteoriteMesh(meteoriteState.diameterKM, meteoriteState.seed);
  if (mesh) {
    avAsteroid = mesh;
    avAsteroid.rotation.x = 0.3;
    avAsteroid.rotation.y = 0;
    avScene.add(avAsteroid);
  }
}

const AU_TO_SCENE_UNITS = 1.3;
const ORBIT_POINT_COUNT = 512;
const ORBIT_SPEED = 0.12;

function initThree() {
  if (!THREE_NS) {
    globe3D.innerHTML = '<div style="padding:10px;color:#9fb0c7;">Vista 3D desactivada (no se pudo cargar Three.js).</div>';
    return;
  }

  const width = Math.max(1, globe3D.clientWidth || 640);
  const height = Math.max(1, globe3D.clientHeight || 420);

  renderer = new THREE_NS.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x05070f, 1);
  globe3D.innerHTML = '';
  globe3D.appendChild(renderer.domElement);

  scene = new THREE_NS.Scene();
  scene.background = new THREE_NS.Color(0x05070f);

  camera = new THREE_NS.PerspectiveCamera(50, width / height, 0.1, 200);
  camera.position.set(0, 1.2, 5.2);
  scene.add(camera);

  if (THREE_NS.OrbitControls) {
    orbitControls = new THREE_NS.OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.enablePan = true;
    orbitControls.minDistance = 1.8;
    orbitControls.maxDistance = 12;
    orbitControls.target.set(0, 0, 0);
    orbitControls.addEventListener('start', () => { isDragging = true; });
    orbitControls.addEventListener('end', () => { isDragging = false; });
  } else {
    console.warn('OrbitControls no está disponible, usando controles básicos.');
    add3DControls();
  }

  const ambient = new THREE_NS.AmbientLight(0x334466, 0.6);
  scene.add(ambient);

  sunLight = new THREE_NS.PointLight(0xfff2cc, 2.2, 0, 2);
  sunLight.position.set(5, 3.5, 4.5);
  scene.add(sunLight);

  sunMesh = new THREE_NS.Mesh(
    new THREE_NS.SphereGeometry(0.35, 32, 32),
    new THREE_NS.MeshStandardMaterial({ color: 0x111111, emissive: 0xffdd55, emissiveIntensity: 1.6 })
  );
  sunMesh.position.copy(sunLight.position.clone().setLength(6));
  scene.add(sunMesh);

  const texLoader = new THREE_NS.TextureLoader();
  const earthTexture = texLoader.load('static/textures/earth_texture.jpg', undefined, undefined, () => {
    console.warn('⚠️ No se pudo cargar la textura de la Tierra, usando color sólido.');
  });

  const earthMaterial = new THREE_NS.MeshPhongMaterial({
    map: earthTexture,
    color: 0xffffff,
    shininess: 10
  });

  earthMesh = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(1, 64, 64), earthMaterial);
  scene.add(earthMesh);

  const cloudsTexture = texLoader.load('static/textures/fair_clouds_4k.png', undefined, undefined, () => {});
  const cloudsMaterial = new THREE_NS.MeshLambertMaterial({ map: cloudsTexture, transparent: true, opacity: 0.35 });
  earthCloudsMesh = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(1.01, 64, 64), cloudsMaterial);
  earthMesh.add(earthCloudsMesh);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (!earthMesh || !renderer || !scene || !camera) return;

  if (!isDragging) {
    earthMesh.rotation.y += 0.0006;
    if (earthCloudsMesh) earthCloudsMesh.rotation.y += 0.0009;
  }

  if (spaceObjectMesh && spaceOrbitPoints && spaceOrbitPoints.length > 1) {
    spaceOrbitProgress = (spaceOrbitProgress + ORBIT_SPEED) % spaceOrbitPoints.length;
    const currentIndex = Math.floor(spaceOrbitProgress);
    const nextIndex = (currentIndex + 1) % spaceOrbitPoints.length;
    const t = spaceOrbitProgress - currentIndex;
    spaceObjectMesh.position.lerpVectors(spaceOrbitPoints[currentIndex], spaceOrbitPoints[nextIndex], t);
  }

  if (orbitControls) orbitControls.update();
  renderer.render(scene, camera);
}

function latLonToVector3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE_NS.Vector3(x, y, z);
}

function degreesToRadians(deg) {
  return (deg || 0) * Math.PI / 180;
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

function solveKeplerEquation(meanAnomalyRad, eccentricity) {
  let E = eccentricity < 0.8 ? meanAnomalyRad : Math.PI;
  for (let iter = 0; iter < 20; iter++) {
    const f = E - eccentricity * Math.sin(E) - meanAnomalyRad;
    const fPrime = 1 - eccentricity * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < 1e-8) break;
  }
  return E;
}

function meanAnomalyToTrueAnomaly(meanAnomalyDeg, eccentricity) {
  const meanAnomalyRad = degreesToRadians(meanAnomalyDeg || 0);
  const E = solveKeplerEquation(meanAnomalyRad, eccentricity);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const factor = Math.sqrt(1 - eccentricity * eccentricity);
  const sinV = (factor * sinE) / (1 - eccentricity * cosE);
  const cosV = (cosE - eccentricity) / (1 - eccentricity * cosE);
  return normalizeAngle(Math.atan2(sinV, cosV));
}

function calculateOrbitPoints(elements, segments = ORBIT_POINT_COUNT) {
  if (!THREE_NS) return null;
  const semiMajor = Number.isFinite(elements.a) ? elements.a : 1;
  const eccentricity = Math.min(0.995, Math.max(0, elements.e || 0));
  const inclination = degreesToRadians(elements.i || 0);
  const ascendingNode = degreesToRadians(elements.omega || 0);
  const periapsisArg = degreesToRadians(elements.argPeriapsis || 0);

  const cosO = Math.cos(ascendingNode);
  const sinO = Math.sin(ascendingNode);
  const cosw = Math.cos(periapsisArg);
  const sinw = Math.sin(periapsisArg);
  const cosi = Math.cos(inclination);
  const sini = Math.sin(inclination);

  const aScene = semiMajor * AU_TO_SCENE_UNITS;
  const sqrtOneMinusESquared = Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity));

  const points = [];
  const trueAnomalies = [];

  for (let k = 0; k < segments; k++) {
    const E = (k / segments) * Math.PI * 2;
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);

    const xPerifocal = aScene * (cosE - eccentricity);
    const yPerifocal = aScene * sqrtOneMinusESquared * sinE;

    const trueAnomaly = normalizeAngle(
      2 * Math.atan2(Math.sqrt(1 + eccentricity) * Math.sin(E / 2), Math.sqrt(1 - eccentricity) * Math.cos(E / 2))
    );

    const x = (cosO * cosw - sinO * sinw * cosi) * xPerifocal + (-cosO * sinw - sinO * cosw * cosi) * yPerifocal;
    const y = (sinO * cosw + cosO * sinw * cosi) * xPerifocal + (-sinO * sinw + cosO * cosw * cosi) * yPerifocal;
    const z = (sinw * sini) * xPerifocal + (cosw * sini) * yPerifocal;

    points.push(new THREE_NS.Vector3(x, y, z));
    trueAnomalies.push(trueAnomaly);
  }

  return { points, trueAnomalies };
}

function disposeSpaceObject() {
  if (spaceOrbitLine) {
    scene.remove(spaceOrbitLine);
    spaceOrbitLine.geometry.dispose();
    spaceOrbitLine.material.dispose();
    spaceOrbitLine = null;
  }
  if (spaceObjectMesh) {
    scene.remove(spaceObjectMesh);
    disposeMesh(spaceObjectMesh);
    spaceObjectMesh = null;
  }
  spaceOrbitPoints = null;
  spaceOrbitProgress = 0;
}

function updateSpaceObject(objectData) {
  if (!scene || !objectData) return;
  disposeSpaceObject();

  const orbitData = calculateOrbitPoints(objectData);
  if (!orbitData || !orbitData.points.length) {
    console.warn('No se pudo generar la órbita para el objeto seleccionado.');
    return;
  }

  spaceOrbitPoints = orbitData.points;
  const orbitGeometry = new THREE_NS.BufferGeometry().setFromPoints(spaceOrbitPoints);
  const orbitMaterial = new THREE_NS.LineBasicMaterial({ color: objectData.type === 'comet' ? 0xffa347 : 0x6bc3ff, linewidth: 1 });
  spaceOrbitLine = new THREE_NS.LineLoop(orbitGeometry, orbitMaterial);
  scene.add(spaceOrbitLine);

  spaceObjectMesh = createMeteoriteMesh(objectData.diameterKm, objectData.seed);
  if (spaceObjectMesh) {
    spaceObjectMesh.material.color = new THREE_NS.Color(objectData.type === 'comet' ? 0xffaa55 : 0xff8c00);
    scene.add(spaceObjectMesh);
  }

  let initialIndex = 0;
  if (Array.isArray(orbitData.trueAnomalies) && orbitData.trueAnomalies.length) {
    const ecc = Math.min(0.995, Math.max(0, objectData.e || 0));
    const targetTrueAnomaly = meanAnomalyToTrueAnomaly(objectData.meanAnomaly || 0, ecc);
    let minDelta = Infinity;
    orbitData.trueAnomalies.forEach((value, idx) => {
      const diff = Math.abs(value - targetTrueAnomaly);
      const wrapped = Math.min(diff, Math.PI * 2 - diff);
      if (wrapped < minDelta) {
        minDelta = wrapped;
        initialIndex = idx;
      }
    });
  }

  spaceOrbitProgress = initialIndex;
  if (spaceObjectMesh) {
    spaceObjectMesh.position.copy(spaceOrbitPoints[initialIndex]);
  }
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
let cachedNEOs = [];
let filteredNEOs = [];
function applyNeoFilters() {
  const minD = Number(neoMinDiameter.value || 0);
  const minV = neoMinVel.value === '' ? null : Number(neoMinVel.value);
  const maxV = neoMaxVel.value === '' ? null : Number(neoMaxVel.value);
  const q = (neoSearch.value || '').trim().toLowerCase();
  filteredNEOs = (cachedNEOs || []).filter(n => {
    if (!isNaN(minD) && n.diameter_m < minD) return false;
    if (minV !== null && !isNaN(minV) && n.velocity_kms < minV) return false;
    if (maxV !== null && !isNaN(maxV) && n.velocity_kms > maxV) return false;
    if (q && !(n.name || '').toLowerCase().includes(q)) return false;
    return true;
  });
  populateNeoSelect();
}
function populateNeoSelect() {
  neoSelect.innerHTML = '';
  filteredNEOs.forEach((neo, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${neo.name} — Ø ${neo.diameter_m} m, v ${neo.velocity_kms} km/s`;
    neoSelect.appendChild(opt);
  });
  updateNeoDetails();
}
function updateNeoDetails() {
  const idx = Number(neoSelect.value || 0);
  const neo = filteredNEOs[idx];
  neoDetails.textContent = neo ? `Nombre: ${neo.name} | Diámetro: ${neo.diameter_m} m | Velocidad: ${neo.velocity_kms} km/s` : '--';
}
neoSelect.addEventListener('change', updateNeoDetails);

loadNeoBtn.addEventListener('click', async () => {
  // TODO: Cargar NEOs desde un JSON local o definir un mock aquí
  cachedNEOs = [
    { name: 'Demo NEO 1', diameter_m: 350, velocity_kms: 18.2 },
    { name: 'Demo NEO 2', diameter_m: 120, velocity_kms: 12.5 },
    { name: 'Demo NEO 3', diameter_m: 850, velocity_kms: 22.1 },
  ];
  applyNeoFilters();
  neoPicker.classList.remove('hidden');
});
applyNeo.addEventListener('click', () => {
  const idx = Number(neoSelect.value || 0);
  const neo = filteredNEOs[idx];
  if (!neo) return;
  const d = Math.max(10, Math.min(1000, neo.diameter_m));
  const v = Math.max(10, Math.min(70, neo.velocity_kms));
  diameterInput.value = d.toFixed(0);
  velocityInput.value = v.toFixed(1);
  updateSliderDisplays();
  neoPicker.classList.add('hidden');
});
closeNeo.addEventListener('click', () => neoPicker.classList.add('hidden'));
[neoMinDiameter, neoMinVel, neoMaxVel, neoSearch].forEach(el => el.addEventListener('input', () => {
  if (cachedNEOs.length) applyNeoFilters();
}));

dataSourceSelect && dataSourceSelect.addEventListener('change', (event) => {
  if (suppressSelectionEvents) return;
  const key = event.target.value;
  switchDataSource(key, { origin: 'main' });
});

objectSelect && objectSelect.addEventListener('change', (event) => {
  if (suppressSelectionEvents) return;
  const index = Number(event.target.value);
  if (!Number.isInteger(index)) return;
  setActiveObjectByIndex(index, { updateViewer: true, updateDetails: true });
  suppressSelectionEvents = true;
  if (apiAsteroidSelect) apiAsteroidSelect.value = event.target.value;
  suppressSelectionEvents = false;
});

apiDataSourceSelect && apiDataSourceSelect.addEventListener('change', (event) => {
  if (suppressSelectionEvents) return;
  switchDataSource(event.target.value, { origin: 'api' });
});

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
  if (!renderer) return;
  const el = renderer.domElement;
  let lastX = 0, lastY = 0;
  const dragSensitivity = 0.005;
  el.style.cursor = 'grab';
  el.addEventListener('pointerdown', (e)=>{ isDragging = true; lastX = e.clientX; lastY = e.clientY; el.style.cursor = 'grabbing'; });
  window.addEventListener('pointermove', (e)=>{
    if (!isDragging || !earthMesh) return;
    const dx = e.clientX - lastX; const dy = e.clientY - lastY;
    const dYaw = dx * dragSensitivity; const dPitch = dy * dragSensitivity;
    earthMesh.rotation.y += dYaw; earthMesh.rotation.x += dPitch;
    const maxTilt = Math.PI/2 - 0.01; earthMesh.rotation.x = Math.max(-maxTilt, Math.min(maxTilt, earthMesh.rotation.x));
    rotVelY = dYaw; rotVelX = dPitch; lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('pointerup', ()=>{ isDragging = false; el.style.cursor = 'grab'; });
  el.addEventListener('wheel', (e)=>{ e.preventDefault(); const delta = Math.sign(e.deltaY); camera.position.z = Math.max(2, Math.min(8, camera.position.z + delta*0.2)); }, { passive: false });
}

function onResize() {
  if (!renderer || !camera) return;
  const width = globe3D.clientWidth; const height = globe3D.clientHeight;
  renderer.setSize(width, height); camera.aspect = width/height; camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
initThree();
switchDataSource('asteroids', { forceReload: true }).catch(()=>{});

// ============== Visor de Asteroides ==============
let viewerMode = 'manual'; // 'manual' | 'api'
let asteroidViewerAnimating = false;

function initAsteroidViewerThree() {
  if (!THREE_NS) {
    asteroidCanvas.innerHTML = '<div style="padding:10px;color:#9fb0c7;">Vista 3D desactivada (no se pudo cargar Three.js).</div>';
    return;
  }

  const width = Math.max(1, asteroidCanvas.clientWidth || 360);
  const height = Math.max(1, asteroidCanvas.clientHeight || 260);
  avRenderer = new THREE_NS.WebGLRenderer({ antialias: true, alpha: true });
  avRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  avRenderer.setSize(width, height);
  asteroidCanvas.innerHTML = '';
  asteroidCanvas.appendChild(avRenderer.domElement);

  avScene = new THREE_NS.Scene();
  avScene.background = new THREE_NS.Color(0x05070f);
  avCamera = new THREE_NS.PerspectiveCamera(45, width / height, 0.1, 100);
  avCamera.position.set(0, 0, 3.2);

  const ambient = new THREE_NS.AmbientLight(0xffffff, 0.65);
  avScene.add(ambient);
  avLight = new THREE_NS.DirectionalLight(0xfff2d0, 1.15);
  avLight.position.set(3, 2, 4);
  avScene.add(avLight);

  regenerateMeteorite({});
  applyManualTo3D();
  addAsteroidViewerControls();
  if (!asteroidViewerAnimating) {
    asteroidViewerAnimating = true;
    requestAnimationFrame(asteroidViewerAnimate);
  }
}

function asteroidViewerAnimate() {
  if (avRenderer && avScene && avCamera) {
    if (avAsteroid) {
      avAsteroid.rotation.y += avRotSpeed;
      avAsteroid.rotation.x += avRotSpeed * 0.3;
    }
    avRenderer.render(avScene, avCamera);
  }
  requestAnimationFrame(asteroidViewerAnimate);
}

function addAsteroidViewerControls() {
  if (!avRenderer) return;
  const el = avRenderer.domElement;
  let dragging = false;
  let lastX = 0, lastY = 0;
  el.style.cursor = 'grab';
  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    el.style.cursor = 'grabbing';
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging || !avAsteroid) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    avAsteroid.rotation.y += dx * 0.01;
    avAsteroid.rotation.x += dy * 0.01;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
    el.style.cursor = 'grab';
  });
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    avCamera.position.z = Math.max(1.4, Math.min(6, avCamera.position.z + delta * 0.2));
  }, { passive: false });
}

function updateManualDisplay() {
  if (manDiameter && manDiameterValue) manDiameterValue.textContent = `${Number(manDiameter.value).toFixed(1)} km`;
  if (manSpeed && manSpeedValue) manSpeedValue.textContent = Number(manSpeed.value).toFixed(1);
  if (manDensity && manDensityValue) manDensityValue.textContent = `${manDensity.value} kg/m³`;
  if (manRotation && manRotationValue) manRotationValue.textContent = `${Number(manRotation.value).toFixed(1)} °/s`;
}

[manDiameter, manSpeed, manDensity, manRotation].forEach((el) => el && el.addEventListener('input', () => {
  updateManualDisplay();
  applyManualTo3D();
}));
updateManualDisplay();

function applyManualTo3D() {
  const diameterKM = toNumber(manDiameter?.value, meteoriteState.diameterKM);
  const density = toNumber(manDensity?.value, meteoriteState.density);
  const rotationDegPerSec = toNumber(manRotation?.value, meteoriteState.rotationDegPerSec);
  const speed = toNumber(manSpeed?.value, 10);
  const seed = densityToSeed(density);

  regenerateMeteorite({ diameterKM, density, seed, rotationDegPerSec });
  const speedFactor = 0.5 + (speed / 60);
  avRotSpeed = (rotationDegPerSec * Math.PI / 180) * 0.016 * speedFactor;
}

function updateApiDetails() {
  if (!apiAsteroidDetails) return;
  const selectedIndex = currentObjectIndex !== null ? currentObjectIndex : Number(apiAsteroidSelect?.value);
  const objectData = catalog[selectedIndex] || catalog[0];
  if (!objectData) {
    apiAsteroidDetails.value = '';
    return;
  }
  if (apiAsteroidSelect && apiAsteroidSelect.value !== String(selectedIndex)) {
    suppressSelectionEvents = true;
    apiAsteroidSelect.value = String(selectedIndex);
    suppressSelectionEvents = false;
  }
  apiAsteroidDetails.value = formatObjectDetails(objectData);
  if (viewerMode === 'api') {
    syncViewerControlsFromObject(objectData);
    updateManualDisplay();
    applyManualTo3D();
  }
}

apiAsteroidSelect && apiAsteroidSelect.addEventListener('change', (event) => {
  if (suppressSelectionEvents) return;
  const index = Number(event.target.value);
  if (!Number.isInteger(index)) return;
  setActiveObjectByIndex(index, { updateViewer: true, updateDetails: true });
  suppressSelectionEvents = true;
  if (objectSelect) objectSelect.value = event.target.value;
  suppressSelectionEvents = false;
});

function setViewerMode(mode) {
  viewerMode = mode;
  if (mode === 'manual') {
    manualControls.classList.remove('hidden');
    apiControls.classList.add('hidden');
    modeToggle.textContent = 'Modo Manual';
    [manDiameter, manSpeed, manDensity, manRotation].forEach(el => el && (el.disabled = false));
  } else {
    manualControls.classList.add('hidden');
    apiControls.classList.remove('hidden');
    modeToggle.textContent = 'Modo API';
    [manDiameter, manSpeed, manDensity, manRotation].forEach(el => el && (el.disabled = true));
    populateApiSelect();
    updateApiDetails();
  }
}

modeToggle && modeToggle.addEventListener('click', () => {
  setViewerMode(viewerMode === 'manual' ? 'api' : 'manual');
});

openAsteroidViewerBtn && openAsteroidViewerBtn.addEventListener('click', () => {
  const img = openAsteroidViewerBtn.querySelector('img');
  const isViewerOpen = !asteroidViewer.classList.contains('hidden');
  if (isViewerOpen) {
    asteroidViewer.classList.add('hidden');
    simLayout.classList.remove('hidden');
    if (img) img.src = './static/img/asteroid-icon.png';
  } else {
    simLayout.classList.add('hidden');
    asteroidViewer.classList.remove('hidden');
    if (img) img.src = './static/img/planet-icon.png';
    if (!avRenderer) initAsteroidViewerThree(); else applyManualTo3D();
    setViewerMode(viewerMode);
    setTimeout(() => { resizeAsteroidViewer(); }, 0);
  }
});

function resizeAsteroidViewer() {
  if (!avRenderer || !avCamera) return;
  const w = Math.max(1, asteroidCanvas.clientWidth);
  const h = Math.max(1, asteroidCanvas.clientHeight);
  avRenderer.setSize(w, h);
  avCamera.aspect = Math.max(0.1, w / h);
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
});

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
  });
})();
