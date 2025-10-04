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
let renderer, scene, camera, earthMesh, asteroidMesh, trajectoryLine;
let isDragging = false;
let rotVelX = 0, rotVelY = 0;

function initThree() {
  if (!THREE_NS) {
    globe3D.innerHTML = '<div style="padding:10px;color:#9fb0c7;">Vista 3D desactivada (no se pudo cargar Three.js).</div>';
    return;
  }
  const width = globe3D.clientWidth;
  const height = globe3D.clientHeight;
  renderer = new THREE_NS.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  globe3D.innerHTML = '';
  globe3D.appendChild(renderer.domElement);

  scene = new THREE_NS.Scene();
  camera = new THREE_NS.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 4);

  const ambient = new THREE_NS.AmbientLight(0xffffff, 0.8); scene.add(ambient);
  const dir = new THREE_NS.DirectionalLight(0xffffff, 1.0); dir.position.set(5, 3, 5); scene.add(dir);

  const geometry = new THREE_NS.SphereGeometry(1, 64, 64);
  const texLoader = new THREE_NS.TextureLoader();
  texLoader.load('static/textures/earth_texture.jpg', (texture)=>{
    earthMesh = new THREE_NS.Mesh(geometry, new THREE_NS.MeshPhongMaterial({ map: texture }));
    scene.add(earthMesh);
  }, undefined, ()=>{
    earthMesh = new THREE_NS.Mesh(geometry, new THREE_NS.MeshPhongMaterial({ color: 0x1e90ff }));
    scene.add(earthMesh);
  });

  animate();
  add3DControls();
}

function animate() {
  requestAnimationFrame(animate);
  if (earthMesh) {
    if (!isDragging) {
      const speed = Math.abs(rotVelX) + Math.abs(rotVelY);
      if (speed > 1e-4) {
        earthMesh.rotation.x += rotVelX;
        earthMesh.rotation.y += rotVelY;
        const maxTilt = Math.PI / 2 - 0.01;
        earthMesh.rotation.x = Math.max(-maxTilt, Math.min(maxTilt, earthMesh.rotation.x));
        const damping = 0.95; rotVelX *= damping; rotVelY *= damping;
      } else {
        earthMesh.rotation.y += 0.0008;
      }
    }
  }
  if (renderer && scene && camera) renderer.render(scene, camera);
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

// ============== Visor de Asteroides ==============
// Estado del visor
let viewerMode = 'manual'; // 'manual' | 'api'

// TODO: Reemplazar esta lista con los datos de la API real.
const mockAsteroids = [
  { name: "Ceres-M", diameter: 940, velocity: 17.9, density: 2162, rotation_period: 9.1 },
  { name: "Pallas-M", diameter: 512, velocity: 16.5, density: 2800, rotation_period: 7.8 },
  { name: "Vesta-M", diameter: 525, velocity: 19.3, density: 3420, rotation_period: 5.3 },
  { name: "Hygiea-M", diameter: 434, velocity: 15.2, density: 1940, rotation_period: 13.8 },
  { name: "Apophis-M", diameter: 0.37, velocity: 30.7, density: 2600, rotation_period: 30.6 }
];

// Three.js para el visor de asteroides
let avRenderer, avScene, avCamera, avAsteroid, avLight;

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

  const ambient = new THREE_NS.AmbientLight(0xffffff, 0.6); avScene.add(ambient);
  avLight = new THREE_NS.DirectionalLight(0xffffff, 1.0); avLight.position.set(3, 2, 4); avScene.add(avLight);

  const geo = new THREE_NS.SphereGeometry(1, 64, 64);
  const loader = new THREE_NS.TextureLoader();
  loader.load('./static/textures/asteroid-texture.jpg', (tex) => {
    avAsteroid = new THREE_NS.Mesh(geo, new THREE_NS.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
    avScene.add(avAsteroid);
  }, undefined, () => {
    avAsteroid = new THREE_NS.Mesh(geo, new THREE_NS.MeshStandardMaterial({ color: 0x8a7f70 }));
    avScene.add(avAsteroid);
  });

  addAsteroidViewerControls();
  requestAnimationFrame(asteroidViewerAnimate);
}

let avRotSpeed = 0.01; // rad/frame
function asteroidViewerAnimate() {
  requestAnimationFrame(asteroidViewerAnimate);
  if (avAsteroid) {
    avAsteroid.rotation.y += avRotSpeed;
  }
  if (avRenderer && avScene && avCamera) avRenderer.render(avScene, avCamera);
}

function addAsteroidViewerControls() {
  if (!avRenderer) return;
  const el = avRenderer.domElement;
  let dragging = false, lastX = 0, lastY = 0;
  el.style.cursor = 'grab';
  el.addEventListener('pointerdown', (e)=>{ dragging = true; lastX = e.clientX; lastY = e.clientY; el.style.cursor = 'grabbing'; });
  window.addEventListener('pointermove', (e)=>{
    if (!dragging || !avAsteroid) return;
    const dx = e.clientX - lastX; const dy = e.clientY - lastY;
    avAsteroid.rotation.y += dx * 0.01; avAsteroid.rotation.x += dy * 0.01; lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('pointerup', ()=>{ dragging = false; el.style.cursor = 'grab'; });
  el.addEventListener('wheel', (e)=>{ e.preventDefault(); const d = Math.sign(e.deltaY); avCamera.position.z = Math.max(1.5, Math.min(6, avCamera.position.z + d*0.2)); }, { passive: false });
}

function updateManualDisplay() {
  manSpeedValue.textContent = Number(manSpeed.value).toFixed(1);
  manDensityValue.textContent = `${manDensity.value} kg/m³`;
  manRotationValue.textContent = `${Number(manRotation.value).toFixed(1)} °/s`;
}
[manSpeed, manDensity, manRotation].forEach(el => el && el.addEventListener('input', ()=>{
  updateManualDisplay();
  if (viewerMode === 'manual') applyManualTo3D();
}));
updateManualDisplay();

function applyManualTo3D() {
  if (!avAsteroid) return;
  // Tamaño proporcional a densidad de forma simple (mock): escalar entre 0.5 y 1.3
  const density = Number(manDensity.value);
  const scale = 0.5 + (density - 500) / (8000 - 500) * (1.3 - 0.5);
  avAsteroid.scale.setScalar(Math.max(0.3, Math.min(1.5, scale)));
  // Velocidad de rotación: base en Rotación (°/s) modulada por Velocidad
  const degPerSec = Number(manRotation.value);
  const speed = Number(manSpeed.value);
  const speedFactor = 0.5 + (speed / 60); // 0..60 -> 0.5x .. 1.5x
  avRotSpeed = (degPerSec * Math.PI / 180) * 0.016 * speedFactor; // ~60fps
}

function populateApiSelect() {
  apiAsteroidSelect.innerHTML = '';
  mockAsteroids.forEach((a, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = `${a.name} — Ø ${a.diameter} km, v ${a.velocity} km/s`;
    apiAsteroidSelect.appendChild(opt);
  });
  updateApiDetails();
}

function updateApiDetails() {
  const idx = Number(apiAsteroidSelect.value || 0);
  const a = mockAsteroids[idx];
  if (!a) { apiAsteroidDetails.value = ''; return; }
  apiAsteroidDetails.value = `Nombre: ${a.name}\nDiámetro: ${a.diameter} km\nVelocidad: ${a.velocity} km/s\nDensidad: ${a.density} kg/m³\nPeriodo de rotación: ${a.rotation_period} h`;
  // Al seleccionar, actualizar sliders y 3D y desactivar sliders en modo API
  manSpeed.value = a.velocity.toString();
  manDensity.value = a.density.toString();
  // Aproximación: rotación deg/s desde horas -> suponemos 360° por periodo
  const degPerSec = 360 / (a.rotation_period * 3600);
  manRotation.value = (degPerSec * 100).toFixed(1); // amplificar para visualización
  updateManualDisplay();
  applyManualTo3D();
}

apiAsteroidSelect && apiAsteroidSelect.addEventListener('change', updateApiDetails);

function setViewerMode(mode) {
  viewerMode = mode;
  if (mode === 'manual') {
    manualControls.classList.remove('hidden');
    apiControls.classList.add('hidden');
    modeToggle.textContent = 'Modo Manual';
    [manSpeed, manDensity, manRotation].forEach(el => el.disabled = false);
  } else {
    manualControls.classList.add('hidden');
    apiControls.classList.remove('hidden');
    modeToggle.textContent = 'Modo API';
    [manSpeed, manDensity, manRotation].forEach(el => el.disabled = true);
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

// Accesibilidad: toggle para modo daltónico
const colorToggleButton = document.getElementById('color-toggle-btn');
if (colorToggleButton) {
  colorToggleButton.addEventListener('click', () => {
    document.body.classList.toggle('colorblind-mode');
  });
}

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
