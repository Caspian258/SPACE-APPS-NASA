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
let moonOrbitRadius = 2;
let moonOrbitSpeed = 0.01;
let previousMouseX = 0;
let previousMouseY = 0
let avDragging = false;
let avPreviousMouseX = 0;
let avPreviousMouseY = 0;
let avRotSpeed = 0.01;
;

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

// Visor de Asteroides UI refs
const simLayout = document.getElementById('simLayout');
const asteroidViewer = document.getElementById('asteroidViewer');
const openAsteroidViewerBtn = document.getElementById('openAsteroidViewerBtn');
const modeToggle = document.getElementById('modeToggle');
const manualControls = document.getElementById('manualControls');
const apiControls = document.getElementById('apiControls');
const manDiameter = document.getElementById('manDiameter');
const manDiameterValue = document.getElementById('manDiameterValue');
const manSpeed = document.getElementById('manSpeed');
const manDensity = document.getElementById('manDensity');
const manRotation = document.getElementById('manRotation');
const manSpeedValue = document.getElementById('manSpeedValue');
const manDensityValue = document.getElementById('manDensityValue');
const manRotationValue = document.getElementById('manRotationValue');
const apiAsteroidSelect = document.getElementById('apiAsteroidSelect');
const apiAsteroidDetails = document.getElementById('apiAsteroidDetails');
const asteroidCanvas = document.getElementById('asteroidCanvas');

// Mostrar valores de sliders
function updateSliderDisplays() {
  diameterValue.textContent = `${diameterInput.value} m`;
  velocityValue.textContent = `${Number(velocityInput.value).toFixed(1)} km/s`;
  mitigationValue.textContent = `${Number(mitigationInput.value).toFixed(3)} km/s`;
}
[diameterInput, velocityInput, mitigationInput].forEach(el => el.addEventListener('input', updateSliderDisplays));
updateSliderDisplays();

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
let renderer, scene, camera, earthMesh, asteroidMesh, trajectoryLine, starSphere, moonMesh, sunLight, earthGroup;
let isDragging = false;
let rotVelX = 0, rotVelY = 0;

function initThree() {
  if (!THREE_NS) {
    globe3D.innerHTML = '<div style="padding:10px;color:#9fb0c7;">Vista 3D desactivada (no se pudo cargar Three.js).</div>';
    return;
  }

  // --- Configuración básica ---
  const width = globe3D.clientWidth || 600;
  const height = globe3D.clientHeight || 400;

  renderer = new THREE_NS.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE_NS.PCFSoftShadowMap;
  globe3D.innerHTML = '';
  globe3D.appendChild(renderer.domElement);

  scene = new THREE_NS.Scene();

  // --- Cámara ---
  camera = new THREE_NS.PerspectiveCamera(45, width / height, 0.1, 2000);
  camera.position.set(0, 0, 6);
  scene.add(camera);

  // --- Luces ---
  scene.add(new THREE_NS.AmbientLight(0x333333, 0.3));
  
  sunLight = new THREE_NS.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(5, 3, 5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 80;
  scene.add(sunLight);

  // --- Fondo envolvente de estrellas ---
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
  starSphere = new THREE_NS.Mesh(starGeometry, starMaterial);
  scene.add(starSphere);

  // --- Grupo contenedor para Tierra y Luna (permite rotarlos juntos) ---
  earthGroup = new THREE_NS.Group();
  earthGroup.rotation.z = -0.3; // Inclinación de la Tierra
  scene.add(earthGroup);

  // --- Geometría y textura de la Tierra ---
  const earthTexture = textureLoader.load(
    'static/textures/planeta.jpg',
    () => console.log('🌍 Textura de la Tierra cargada'),
    undefined,
    (err) => console.warn('⚠️ Error al cargar textura de la Tierra:', err)
  );

  const earthMaterial = new THREE_NS.MeshPhongMaterial({
    map: earthTexture,
    shininess: 5,
    specular: 0x333333,
  });
  earthMesh = new THREE_NS.Mesh(
    new THREE_NS.SphereGeometry(1, 64, 64),
    earthMaterial
  );
  earthMesh.castShadow = true;
  earthMesh.receiveShadow = true;
  earthGroup.add(earthMesh); // Añadir al grupo en lugar de la escena

  // --- Capa de nubes opcional ---
  const cloudsTexture = textureLoader.load(
    'static/textures/fair_clouds_4k.png',
    () => console.log('☁️ Nubes cargadas'),
    undefined,
    () => console.warn('⚠️ No se cargaron las nubes (no pasa nada)')
  );

  const cloudsMaterial = new THREE_NS.MeshLambertMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.4,
  });

  const cloudsMesh = new THREE_NS.Mesh(
    new THREE_NS.SphereGeometry(1.01, 64, 64),
    cloudsMaterial
  );
  earthMesh.add(cloudsMesh);

  // --- Luna ---
  const moonGeometry = new THREE_NS.SphereGeometry(0.27, 32, 32);
  const moonMaterial = new THREE_NS.MeshPhongMaterial({
    map: textureLoader.load('static/textures/luna.jpg'),
    shininess: 5,
    specular: 0x111111,
  });
  moonMesh = new THREE_NS.Mesh(moonGeometry, moonMaterial);
  moonMesh.position.set(2, 0.5, 0);
  moonMesh.castShadow = true;
  moonMesh.receiveShadow = true;
  earthMesh.add(moonMesh); // Ahora la Luna es hija de la Tierra

  add3DControls();
  animate();
}

function animate() {
  requestAnimationFrame(animate);

  // Revolución de la Luna alrededor de la Tierra
  moonAngle += moonOrbitSpeed;
  moonMesh.position.x = Math.cos(moonAngle) * moonOrbitRadius;
  moonMesh.position.z = Math.sin(moonAngle) * moonOrbitRadius;
  // Inclinación orbital de la Luna (aproximadamente 5 grados)
  moonMesh.position.y = Math.sin(moonAngle) * 0.2;

  // Rotación automática suave cuando no se está arrastrando
  if (!isDragging) {
    earthGroup.rotation.y += 0.001;
    // Rotación muy lenta del cielo
    starSphere.rotation.y += 0.0001;
  }

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
  const domElement = renderer.domElement;
  
  // Controles de rotación con mouse
  domElement.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
  });

  domElement.addEventListener('mousemove', (event) => {
    if (!isDragging) return;
    
    const deltaX = event.clientX - previousMouseX;
    const deltaY = event.clientY - previousMouseY;
    
    // Rotar el grupo Tierra (incluyendo la Luna)
    earthGroup.rotation.y += deltaX * 0.01;
    earthGroup.rotation.x += deltaY * 0.01;
    
    // Rotar el cielo en la misma dirección pero más suave
    starSphere.rotation.y -= deltaX * 0.002;
    starSphere.rotation.x -= deltaY * 0.002;
    
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
  });

  domElement.addEventListener('mouseup', () => {
    isDragging = false;
  });

  domElement.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  // Controles de zoom con la rueda del mouse
  domElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    // Calcular la dirección del zoom
    const zoomSpeed = 0.1;
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    
    // Aplicar zoom moviendo la cámara
    camera.position.z += zoomDirection * zoomSpeed;
    
    // Limitar el rango de zoom para evitar extremos
    camera.position.z = Math.max(1.5, Math.min(15, camera.position.z));
  });
}

function onResize() {
  if (!renderer || !camera) return;
  const width = globe3D.clientWidth; const height = globe3D.clientHeight;
  renderer.setSize(width, height); camera.aspect = width/height; camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
initThree();

// Estado del visor
let viewerMode = 'manual'; // 'manual' | 'api'

// TODO: Reemplazar esta lista con los datos de la API real.
const mockAsteroidDatabase = [
  { name: "Asteroide Bennu (Ejemplo)", diameter: 0.49, velocity: 28.0, density: 1260, rotation_period: 4.3, seed: 101, a: 1.126, e: 0.204, i: 6.035 },
  { name: "Asteroide Apophis (Ejemplo)", diameter: 0.37, velocity: 30.7, density: 3260, rotation_period: 30.6, seed: 256, a: 0.922, e: 0.191, i: 3.331 },
  { name: "Planetoide Ceres (Grande)", diameter: 940, velocity: 17.9, density: 2162, rotation_period: 9.1, seed: 512, a: 2.77, e: 0.08, i: 10.59 },
  { name: "Asteroide Vesta", diameter: 525, velocity: 19.3, density: 3420, rotation_period: 5.3, seed: 768, a: 2.36, e: 0.089, i: 7.14 },
  { name: "Asteroide Hygiea", diameter: 434, velocity: 15.2, density: 1940, rotation_period: 13.8, seed: 903, a: 3.14, e: 0.119, i: 3.83 }
];

// Three.js para el visor de asteroides
let avRenderer, avScene, avCamera, avAsteroid, avLight;
let meteoriteState = {
  diameterKM: 50,
  seed: 42
};

function densityToSeed(density) {
  const min = manDensity ? Number(manDensity.min) || 1 : 1;
  const max = manDensity ? Number(manDensity.max) || Math.max(min + 1, density) : 8000;
  const clamped = Math.min(Math.max(density, min), max);
  const normalized = (clamped - min) / (max - min || 1);
  return Math.max(1, Math.round(normalized * 999) + 1);
}

function seedToDensity(seed) {
  if (!manDensity) return seed;
  const min = Number(manDensity.min) || 1;
  const max = Number(manDensity.max) || 8000;
  const normalized = (Math.max(1, seed) - 1) / 999;
  return Math.round(min + normalized * (max - min));
}

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

  // Aplicar ruido para la forma irregular (mantener esto)
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
  
  const textureLoader = new THREE_NS.TextureLoader();
  const asteroidTexture = textureLoader.load(
    'static/textures/asteroide.jpg',
    () => console.log('🪨 Textura de asteroide cargada'),
    undefined,
    (err) => console.warn('⚠️ Error al cargar textura de asteroide:', err)
  );
  
  const material = new THREE_NS.MeshPhongMaterial({
    map: asteroidTexture,  // Textura fija
    shininess: 10,
    specular: 0x222222,
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
  const degPerSec = Number(manRotation ? manRotation.value : 5);
  const speed = Number(manSpeed ? manSpeed.value : 10);
  const speedFactor = 0.5 + speed / 60;
  avRotSpeed = (degPerSec * Math.PI / 180) * 0.016 * speedFactor;
}

meteoriteState.diameterKM = manDiameter ? Number(manDiameter.value) : meteoriteState.diameterKM;
meteoriteState.seed = manDensity ? densityToSeed(Number(manDensity.value)) : meteoriteState.seed;

function initAsteroidViewerThree() {
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

  avCamera = new THREE_NS.PerspectiveCamera(45, width/height, 0.1, 1000);
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
  starSphere = new THREE_NS.Mesh(starGeometry, starMaterial);
  avScene.add(starSphere);

  
  // Luces (mantener)
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

  const texturLoader = new THREE_NS.TextureLoader();
  const asteroidTexture = texturLoader.load(
    'static/textures/asteroide.jpg',
    () => console.log('🪨 Textura de asteroide cargada'),
    undefined,
    (err) => console.warn('⚠️ Error al cargar textura de asteroide:', err)
  );

  const asteroidGeometry = new THREE_NS.SphereGeometry(1, 64, 64);
  const asteroidMaterial = new THREE_NS.MeshPhongMaterial({
    map: asteroidTexture,
    shininess: 5,
    specular: 0x333333,
  });
  avAsteroid = new THREE_NS.Mesh(asteroidGeometry, asteroidMaterial);
  avAsteroid.castShadow = true;
  avAsteroid.receiveShadow = true;
  avScene.add(avAsteroid);

  addAsteroidViewerControls();
  requestAnimationFrame(asteroidViewerAnimate);
}

let avAutoRotate = true; // rad/frame
function asteroidViewerAnimate() {
  requestAnimationFrame(asteroidViewerAnimate);

  // Rotación automática cuando no se está arrastrando
  if (!avDragging && avAutoRotate) {
    if (avAsteroid) {
      avAsteroid.rotation.y += avRotSpeed;
    }
    // El cielo también rota automáticamente a la misma velocidad
    if (starSphere) {
      starSphere.rotation.y += avRotSpeed;
    }
  }

  if (avRenderer && avScene && avCamera) {
    avRenderer.render(avScene, avCamera);
  }
}

function addAsteroidViewerControls() {
  if (!avRenderer) return;
  const domElement = avRenderer.domElement;
  
  // Controles de rotación con mouse (igual que en la Tierra)
  domElement.addEventListener('mousedown', (event) => {
    avDragging = true;
    avPreviousMouseX = event.clientX;
    avPreviousMouseY = event.clientY;
    domElement.style.cursor = 'grabbing';
  });

  domElement.addEventListener('mousemove', (event) => {
  if (!avDragging) return;
  
  const deltaX = event.clientX - avPreviousMouseX;
  const deltaY = event.clientY - avPreviousMouseY;
  
  // Rotar el asteroide
  if (avAsteroid) {
    avAsteroid.rotation.y += deltaX * 0.01;
    avAsteroid.rotation.x += deltaY * 0.01;
  }
  
  // Rotar el cielo en la misma dirección y proporción que el asteroide
  // Esto crea la sensación de que estás moviendo tu perspectiva alrededor del objeto
  if (starSphere) {
    starSphere.rotation.y += deltaX * 0.01;  // Misma velocidad que el asteroide
    starSphere.rotation.x += deltaY * 0.01;  // Misma velocidad que el asteroide
  }
  
  avPreviousMouseX = event.clientX;
  avPreviousMouseY = event.clientY;
  });

  domElement.addEventListener('mouseup', () => {
    avDragging = false;
    domElement.style.cursor = 'grab';
  });

  domElement.addEventListener('mouseleave', () => {
    avDragging = false;
    domElement.style.cursor = 'grab';
  });

  // Controles de zoom con la rueda del mouse (igual que en la Tierra)
  domElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    // Calcular la dirección del zoom
    const zoomSpeed = 0.1;
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    
    // Aplicar zoom moviendo la cámara
    avCamera.position.z += zoomDirection * zoomSpeed;
    
    // Limitar el rango de zoom para evitar extremos
    avCamera.position.z = Math.max(1.5, Math.min(15, avCamera.position.z));
  });
}

function updateManualDisplay() {
  if (manDiameter && manDiameterValue) {
    manDiameterValue.textContent = `${Number(manDiameter.value).toFixed(1)} km`;
  }
  manSpeedValue.textContent = Number(manSpeed.value).toFixed(1);
  manDensityValue.textContent = `${manDensity.value} kg/m³`;
  manRotationValue.textContent = `${Number(manRotation.value).toFixed(1)} °/s`;
}
[manDiameter, manSpeed, manDensity, manRotation].forEach(el => el && el.addEventListener('input', updateManualDisplay));
updateManualDisplay();

if (manDiameter) {
  manDiameter.addEventListener('input', () => {
    meteoriteState.diameterKM = Number(manDiameter.value);
    if (viewerMode === 'manual') regenerateMeteorite({ diameterKM: meteoriteState.diameterKM });
  });
}

if (manDensity) {
  manDensity.addEventListener('input', () => {
    const newSeed = densityToSeed(Number(manDensity.value));
    meteoriteState.seed = newSeed;
    if (viewerMode === 'manual') regenerateMeteorite({ seed: newSeed });
  });
}

if (manSpeed) {
  manSpeed.addEventListener('input', () => {
    if (viewerMode === 'manual') updateViewerRotationSpeed();
  });
}

if (manRotation) {
  manRotation.addEventListener('input', () => {
    if (viewerMode === 'manual') updateViewerRotationSpeed();
  });
}

function populateApiSelect() {
  apiAsteroidSelect.innerHTML = '';
  mockAsteroidDatabase.forEach((a, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = `${a.name} — Ø ${a.diameter} km, v ${a.velocity} km/s`;
    apiAsteroidSelect.appendChild(opt);
  });
  updateApiDetails();
}

function updateApiDetails() {
  if (!apiAsteroidSelect || !apiAsteroidDetails) return;
  const idx = Number(apiAsteroidSelect.value || 0);
  const asteroid = mockAsteroidDatabase[idx];
  if (!asteroid) {
    apiAsteroidDetails.value = 'No hay datos disponibles';
    return;
  }

  const infoLines = [
    `Nombre: ${asteroid.name}`,
    `Diámetro: ${asteroid.diameter} km`,
    `Velocidad: ${asteroid.velocity} km/s`,
    `Densidad: ${asteroid.density} kg/m³`,
    `Periodo de rotación: ${asteroid.rotation_period} h`,
    `Semilla procedural: ${asteroid.seed}`
  ];
  apiAsteroidDetails.value = infoLines.join('\n');

  if (manDiameter) {
    const min = Number(manDiameter.min) || 0.1;
    const max = Number(manDiameter.max) || 1000;
    const diameter = Math.min(Math.max(Number(asteroid.diameter) || min, min), max);
    manDiameter.value = diameter.toFixed(1);
    meteoriteState.diameterKM = Number(manDiameter.value);
  }

  if (manSpeed) manSpeed.value = Number(asteroid.velocity).toFixed(1);
  if (manDensity) manDensity.value = Math.round(Number(asteroid.density)).toString();

  if (manRotation) {
    const degPerSec = 360 / Math.max(1, Number(asteroid.rotation_period) * 3600);
    const sliderValue = Math.min(Number(manRotation.max) || 30, Math.max(Number(manRotation.min) || 0, degPerSec * 100));
    manRotation.value = sliderValue.toFixed(1);
  }

  updateManualDisplay();
  updateViewerRotationSpeed();

  const seed = Number.isFinite(asteroid.seed) ? Number(asteroid.seed) : densityToSeed(Number(manDensity.value));
  meteoriteState.seed = seed;
  regenerateMeteorite({ diameterKM: meteoriteState.diameterKM, seed });
}

apiAsteroidSelect && apiAsteroidSelect.addEventListener('change', updateApiDetails);

function setViewerMode(mode) {
  viewerMode = mode;
  if (mode === 'manual') {
    manualControls.classList.remove('hidden');
    apiControls.classList.add('hidden');
    modeToggle.textContent = 'Modo Manual';
    [manDiameter, manSpeed, manDensity, manRotation].forEach(el => el && (el.disabled = false));
    updateViewerRotationSpeed();
    regenerateMeteorite({
      diameterKM: Number(manDiameter ? manDiameter.value : meteoriteState.diameterKM),
      seed: densityToSeed(Number(manDensity ? manDensity.value : meteoriteState.seed))
    });
  } else {
    manualControls.classList.add('hidden');
    apiControls.classList.remove('hidden');
    modeToggle.textContent = 'Modo API';
    [manDiameter, manSpeed, manDensity, manRotation].forEach(el => el && (el.disabled = true));
    populateApiSelect();
  }
}

modeToggle && modeToggle.addEventListener('click', ()=>{
  setViewerMode(viewerMode === 'manual' ? 'api' : 'manual');
});

// Toggle view with the header icon. The icon image swaps between asteroid-icon.png and planet-icon.png
openAsteroidViewerBtn && openAsteroidViewerBtn.addEventListener('click', ()=>{
  const img = openAsteroidViewerBtn.querySelector('img');
  const isViewerOpen = !asteroidViewer.classList.contains('hidden');
  if (isViewerOpen) {
    // Close viewer -> show simulation
    asteroidViewer.classList.add('hidden');
    simLayout.classList.remove('hidden');
    if (img) img.src = './static/img/asteroid-icon.png';
  } else {
    // Open viewer -> hide simulation
    simLayout.classList.add('hidden');
    asteroidViewer.classList.remove('hidden');
    if (img) img.src = './static/img/planet-icon.png';
    if (!avRenderer) initAsteroidViewerThree();
    setViewerMode('manual');
    setTimeout(()=>{ resizeAsteroidViewer(); }, 0);
  }
});

function resizeAsteroidViewer() {
  if (!avRenderer || !avCamera) return;
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
