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
let orbitControls = null;
let avDragging = false;
let avPreviousMouseX = 0;
let avPreviousMouseY = 0;
let avRotSpeed = 0.01;

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


// Vistas
const show3D = document.getElementById('show3D');
const show2D = document.getElementById('show2D');

const map2D = document.getElementById('map2D');
const objectSelect = document.getElementById('objectSelect');
const objectSummary = document.getElementById('objectSummary');
const datasetMainRadios = document.querySelectorAll('input[name="datasetMain"]');
const datasetViewerRadios = document.querySelectorAll('input[name="datasetViewer"]');
const filterNameInput = document.getElementById('filterName');
const filterMinDiameterInput = document.getElementById('filterMinDiameter');
const filterMinVelocityInput = document.getElementById('filterMinVelocity');
const filterDateStartInput = document.getElementById('filterDateStart');
const filterDateEndInput = document.getElementById('filterDateEnd');

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

// Vistas 2D/3D
show3D.addEventListener('click', () => { globe3D.classList.remove('hidden'); map2D.classList.add('hidden'); onResize(); });
show2D.addEventListener('click', () => { map2D.classList.remove('hidden'); globe3D.classList.add('hidden'); map.invalidateSize(); });

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
const threeContainer = document.getElementById('globe3D') || { 
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
    camera.position.set(0, 0, 15); 
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
    const sunGeometry = new THREE_NS.SphereGeometry(1.5, 64, 64);
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
        radius: 0.7,
        texturePath: 'static/textures/planeta.jpg'
    });
    earthGroup.add(earthMesh);

    // ☁️ Nubes
    const cloudsMesh = createPlanet({
        name: 'Nubes',
        texturePath: 'static/textures/fair_clouds_4k.png',
        radius: 0.71,
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
        radius: 0.27,
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



// --- Botón de seguimiento ---
function setupFollowButton() {
    const button = document.createElement('button');
    button.textContent = 'Centrar en Tierra 🌍';
    button.id = 'followEarthButton';
    
    button.style.position = 'absolute';
    button.style.bottom = '10px';
    button.style.left = '10px';
    button.style.padding = '8px 15px';
    button.style.zIndex = '1000';
    button.style.backgroundColor = 'rgba(60, 179, 113, 0.8)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    document.body.appendChild(button);

    button.addEventListener('click', () => {
        isFollowingEarth = !isFollowingEarth;
        if (isFollowingEarth) {
            button.textContent = 'Dejar de Seguir';
            camera.position.set(sunOrbitRadius * 1.5, 0, sunOrbitRadius * 0.5); 
        } else {
            button.textContent = 'Centrar en Tierra 🌍';
            camera.position.set(0, 0, 15);
            camera.lookAt(new THREE_NS.Vector3(0, 0, 0));
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
            camera.position.set(0, 0, 15);
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
    if (isFollowingEarth) {
        const earthPosition = new THREE_NS.Vector3();
        earthGroup.getWorldPosition(earthPosition);
        const relativeOffset = new THREE_NS.Vector3(0, 1, 4);
        const matrix = new THREE_NS.Matrix4().extractRotation(sunGroup.matrixWorld);
        relativeOffset.applyMatrix4(matrix);
        camera.position.copy(earthPosition).add(relativeOffset);
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
  if (!renderer || !camera) return;
  const width = globe3D.clientWidth; const height = globe3D.clientHeight;
  renderer.setSize(width, height); camera.aspect = width/height; camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
initThree();

// ============== Visor de Asteroides ==============
// Estado del visor
let viewerMode = 'manual'; // 'manual' | 'api'

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

function rotationPeriodToViewerSpeed(rotationPeriodHours) {
  const hours = toNumber(rotationPeriodHours, 6);
  if (!Number.isFinite(hours) || hours <= 0) return 5;
  const degPerSecond = 360 / (hours * 3600);
  const amplified = degPerSecond * 1200;
  return Math.min(30, Math.max(0.3, amplified));
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

function setSelectLoading(selectEl, message) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  const option = document.createElement('option');
  option.value = '';
  option.textContent = message;
  selectEl.appendChild(option);
  selectEl.disabled = true;
}

function updateDatasetRadios(key) {
  datasetMainRadios.forEach((radio) => {
    if (radio.value === key) radio.checked = true;
  });
  datasetViewerRadios.forEach((radio) => {
    if (radio.value === key) radio.checked = true;
  });
}

function updateObjectSummary(objectData) {
  if (!objectSummary) return;
  if (!objectData) {
    objectSummary.textContent = '--';
    return;
  }
  const typeLabel = objectData.type === 'comet' ? 'Cometa' : 'Asteroide';
  const diameter = Number.isFinite(objectData.diameterKm) ? `${objectData.diameterKm.toFixed(1)} km` : 'N/D';
  const eccentricity = Number.isFinite(objectData.e) ? objectData.e.toFixed(3) : 'N/D';
  const semiMajor = Number.isFinite(objectData.a) ? `${objectData.a.toFixed(3)} UA` : 'N/D';
  objectSummary.textContent = `${typeLabel} • Diámetro: ${diameter} • a: ${semiMajor} • e: ${eccentricity}`;
}

function populateObjectSelect() {
  if (!objectSelect) return;
  suppressDatasetEvents = true;
  objectSelect.innerHTML = '';
  if (!filteredCatalog.length) {
    setSelectLoading(objectSelect, 'Sin datos disponibles');
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
  lines.push(`Nombre: ${objectData.name}`);
  lines.push(`Tipo: ${objectData.type === 'comet' ? 'Cometa' : 'Asteroide'}`);
  if (Number.isFinite(objectData.diameterKm)) lines.push(`Diámetro estimado: ${objectData.diameterKm.toFixed(2)} km`);
  if (Number.isFinite(objectData.density)) lines.push(`Densidad modelo: ${Math.round(objectData.density)} kg/m³`);
  if (Number.isFinite(objectData.rotation_period)) lines.push(`Periodo de rotación aprox.: ${objectData.rotation_period.toFixed(1)} h`);
  if (Number.isFinite(objectData.velocity)) lines.push(`Velocidad estimada: ${objectData.velocity.toFixed(1)} km/s`);
  if (Number.isFinite(objectData.a)) lines.push(`Semieje mayor (a): ${objectData.a.toFixed(3)} UA`);
  if (Number.isFinite(objectData.e)) lines.push(`Excentricidad (e): ${objectData.e.toFixed(3)}`);
  if (Number.isFinite(objectData.i)) lines.push(`Inclinación (i): ${objectData.i.toFixed(2)}°`);
  if (Number.isFinite(objectData.omega)) lines.push(`Nodo ascendente (Ω): ${objectData.omega.toFixed(2)}°`);
  if (Number.isFinite(objectData.argPeriapsis)) lines.push(`Arg. del perihelio (ω): ${objectData.argPeriapsis.toFixed(2)}°`);
  const period = toNumber(objectData.raw?.p_yr);
  if (Number.isFinite(period)) lines.push(`Período orbital: ${period.toFixed(2)} años`);
  const discoveryRaw = objectData.discoveryDate || objectData.raw?.discovery_date || objectData.raw?.disc_date || objectData.raw?.discoveryDate;
  if (discoveryRaw) lines.push(`Descubierto: ${discoveryRaw}`);
  return lines.join('\n');
}

function applyObjectToViewer(objectData) {
  if (!objectData) return;
  const minDiameter = Number(manDiameter ? manDiameter.min : 0.1) || 0.1;
  const maxDiameter = Number(manDiameter ? manDiameter.max : 1000) || 1000;
  const diameter = Math.min(Math.max(toNumber(objectData.diameterKm, minDiameter), minDiameter), maxDiameter);
  if (manDiameter) {
    manDiameter.value = diameter.toFixed(1);
    meteoriteState.diameterKM = diameter;
  }

  const derivedDensity = Number.isFinite(objectData.density) ? objectData.density : seedToDensity(hashStringToSeed(objectData.name));
  if (manDensity) {
    manDensity.value = Math.round(derivedDensity);
  }

  const rotationSliderValue = rotationPeriodToViewerSpeed(objectData.rotation_period);
  if (manRotation) {
    const minRot = Number(manRotation.min) || 0;
    const maxRot = Number(manRotation.max) || 30;
    manRotation.value = Math.min(Math.max(rotationSliderValue, minRot), maxRot).toFixed(1);
  }

  if (manSpeed) {
    const speedValue = Number.isFinite(objectData.velocity)
      ? objectData.velocity
      : estimateViewerSpeed(objectData);
    manSpeed.value = Math.max(0, speedValue).toFixed(1);
  }

  updateManualDisplay();

  const seed = Number.isFinite(objectData.seed) ? objectData.seed : hashStringToSeed(objectData.name);
  meteoriteState.seed = seed;
  regenerateMeteorite({ diameterKM: meteoriteState.diameterKM, seed });
  updateViewerRotationSpeed();
}

function setActiveObjectByIndex(index, { updateViewer = false, updateDetails = false, updateProbability = true } = {}) {
  if (!Array.isArray(filteredCatalog) || !filteredCatalog[index]) return;
  currentObjectIndex = index;
  const selected = filteredCatalog[index];
  currentObjectId = selected?.id || null;
  const previousFlag = suppressDatasetEvents;
  suppressDatasetEvents = true;
  if (objectSelect) objectSelect.value = String(index);
  if (apiAsteroidSelect) apiAsteroidSelect.value = String(index);
  suppressDatasetEvents = previousFlag;
  updateObjectSummary(selected);
  if (updateViewer) {
    applyObjectToViewer(selected);
  }
  if (updateDetails && apiAsteroidDetails) {
    apiAsteroidDetails.value = formatObjectDetails(selected);
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
  populateApiSelect();

  if (!filteredCatalog.length) {
    currentObjectIndex = null;
    currentObjectId = null;
    updateObjectSummary(null);
    if (apiAsteroidDetails) apiAsteroidDetails.value = 'No hay datos disponibles';
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
  setSelectLoading(objectSelect, 'Cargando catálogo...');
  setSelectLoading(apiAsteroidSelect, 'Cargando catálogo...');
  if (apiAsteroidDetails) apiAsteroidDetails.value = '';

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

datasetViewerRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    if (!radio.checked || suppressDatasetEvents) return;
    switchDataset(radio.value, { origin: 'viewer', forceReload: true });
  });
});

if (document.querySelectorAll('input[name="datasetViewer"]').length > 0) {
  document.querySelectorAll('input[name="datasetViewer"]').forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'asteroids') {
        switchDataset('asteroids', { origin: 'viewer', forceReload: false });
      } else {
        switchDataset('comets', { origin: 'viewer', forceReload: false });
      }
    });
  });
}

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
        domElement.style.cursor = 'grab';
    });
    
    domElement.addEventListener('mouseleave', () => {
        isRotating = false;
        domElement.style.cursor = 'grab';
    });
    
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

let avAutoRotate = true; // rad/frame
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
  if (!apiAsteroidSelect) return;
  
  apiAsteroidSelect.innerHTML = '';
  
  // Usar el catálogo filtrado actual
  if (!filteredCatalog || !filteredCatalog.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No hay datos disponibles';
    apiAsteroidSelect.appendChild(option);
    apiAsteroidSelect.disabled = true;
    return;
  }
  
  filteredCatalog.forEach((item, index) => {
    const opt = document.createElement('option');
    opt.value = String(index);
    
    // Formato consistente con el panel principal
    const diameter = Number.isFinite(item.diameterKm) ? `${item.diameterKm.toFixed(1)}` : 'N/D';
    const velocity = Number.isFinite(item.velocity) ? `${item.velocity.toFixed(1)}` : 'N/D';
    
    opt.textContent = `${item.name} — Ø ${diameter} km, v ${velocity} km/s`;
    apiAsteroidSelect.appendChild(opt);
  });
  
  apiAsteroidSelect.disabled = false;
  
  // Seleccionar el objeto actual si existe, de lo contrario el primero
  let selectedIndex = 0;
  if (Number.isInteger(currentObjectIndex) && filteredCatalog[currentObjectIndex]) {
    selectedIndex = currentObjectIndex;
  }
  
  apiAsteroidSelect.value = String(selectedIndex);
  updateApiDetails();
}

function updateApiDetails() {
  if (!apiAsteroidSelect || !apiAsteroidDetails) return;
  
  const idx = Number(apiAsteroidSelect.value);
  if (!Number.isFinite(idx) || !filteredCatalog[idx]) {
    apiAsteroidDetails.value = 'Selecciona un objeto del catálogo';
    return;
  }
  
  const object = filteredCatalog[idx];
  if (!object) {
    apiAsteroidDetails.value = 'No hay datos disponibles';
    return;
  }

  // Usar la función de formato existente
  apiAsteroidDetails.value = formatObjectDetails(object);
  
  // Actualizar el objeto activo globalmente
  setActiveObjectByIndex(idx, { 
    updateViewer: true, 
    updateDetails: false, 
    updateProbability: true 
  });
}

// === FIN DEL REEMPLAZO ===

if (apiAsteroidSelect) {
  apiAsteroidSelect.addEventListener('change', function() {
    updateApiDetails();
    
    // También actualizar la selección en el panel principal si es necesario
    const idx = Number(this.value);
    if (Number.isFinite(idx) && filteredCatalog[idx]) {
      setActiveObjectByIndex(idx, { 
        updateViewer: true, 
        updateDetails: false, 
        updateProbability: false 
      });
    }
  });
}

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
    
    // Usar el catálogo actual en lugar de datos mock
    populateApiSelect();
    
    // Si hay un objeto seleccionado, cargar sus detalles
    if (Number.isInteger(currentObjectIndex) && filteredCatalog[currentObjectIndex]) {
      const selectedObject = filteredCatalog[currentObjectIndex];
      apiAsteroidDetails.value = formatObjectDetails(selectedObject);
      computeAndDisplayImpactProbability(selectedObject, { source: 'viewer-mode' });
    }
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

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar el select del modo API cuando esté disponible
  if (apiAsteroidSelect && viewerMode === 'api') {
    setTimeout(() => {
      populateApiSelect();
    }, 100);
  }
});
let craterCircle;

// Parámetros de inicio
function updateCraterDisplay() {
    console.log('=== updateCraterDisplay START ===');
    
    // Switch to 2D map view
    document.getElementById('globe3D').classList.add('hidden');
    document.getElementById('map2D').classList.remove('hidden');
    
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
    
    if (!impactMarker) {
        alert('Por favor, haz clic en el mapa para seleccionar un punto de impacto');
        return;
    }
    
    const L_input = parseFloat(diameterInput.value);
    const v_i = parseFloat(velocityInput.value) * 1000;
    
    // Get density from the input field
    const phi_i = parseFloat(document.getElementById('density').value);
    const phi_t = 2000;
    const theta_deg = document.getElementById('theta') ? 
                      parseFloat(document.getElementById('theta').value) : 45;
    
    console.log('Using density from input:', phi_i);
    
    console.log('Input values:', { L_input, v_i, phi_i, phi_t, theta_deg });
    
    // Calculate crater
    const craterData = calculateCraterImpact(phi_i, phi_t, L_input, v_i, theta_deg);
    
    console.log('Crater data:', craterData);
    console.log('D_fr:', craterData.D_fr);
    
    // Update results panel
    document.getElementById('craterType').textContent = craterData.craterType;
    document.getElementById('D_tc').textContent = craterData.D_tc.toFixed(2);
    document.getElementById('D_fr').textContent = craterData.D_fr.toFixed(2);
    document.getElementById('d_fr').textContent = craterData.d_fr.toFixed(2);
    document.getElementById('h_fr').textContent = craterData.h_fr > 0 ? craterData.h_fr.toFixed(2) : 'N/A';
    
    // Calculate energy
    const mass = (4/3) * Math.PI * Math.pow(L_input/2, 3) * phi_i;
    const energy_joules = 0.5 * mass * Math.pow(v_i, 2);
    const energy_megatons = energy_joules / (4.184e15);
    document.getElementById('energy').textContent = energy_megatons.toFixed(2);
    
    // Calculate crater radius and display on map
    const craterRadius = craterData.D_fr / 2;
    console.log('Crater radius (meters):', craterRadius);
    console.log('Calling updateMapCrater...');
    
    updateMapCrater(craterRadius);
    console.log('=== updateCraterDisplay END ===');
}

function updateMapCrater(craterRadius) {
    console.log('=== updateMapCrater START ===');
    console.log('Crater radius received:', craterRadius);
    console.log('impactMarker:', impactMarker);
    console.log('map object:', map);
    
    if (!impactMarker) {
        console.error('No impact marker!');
        return;
    }
    
    // Remove old crater circle
    if (craterCircle) {
        console.log('Removing old crater circle');
        map.removeLayer(craterCircle);
    }
    
    const impactCoords = impactMarker.getLatLng();
    console.log('Impact coordinates:', impactCoords);
    
    // Create crater circle
    console.log('Creating circle with radius:', craterRadius);
    craterCircle = L.circle(impactCoords, {
        radius: craterRadius,
        color: '#8B0000',
        fillColor: '#8B0000',
        fillOpacity: 0.5,
        weight: 2
    });
    
    console.log('Adding circle to map');
    craterCircle.addTo(map);
    
    console.log('Circle added, bounds:', craterCircle.getBounds());
    
    // Zoom to crater
    map.fitBounds(craterCircle.getBounds(), { padding: [50, 50] });
    
    console.log('=== updateMapCrater END ===');
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
