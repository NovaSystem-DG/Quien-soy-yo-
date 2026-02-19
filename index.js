//* Detecta si el usuario está en un celular o tablet
let isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);

//* Variables para zoom táctil
let initialPinchDistance = null;
let initialCameraZ = 4;

//* Variables para rotación con mouse o dedo
let isDragging = false;
let prevMouse = { x: 0, y: 0 };

//* Pin seleccionado actualmente
let activePin = null;

//? ===============================
//? CONFIGURACIÓN DE LA ESCENA
//? ===============================

//* Elementos del HTML
const container = document.getElementById("globe-container");
const infoBox = document.getElementById("info-box");
const infoTitle = document.getElementById("info-title");
const infoDesc = document.getElementById("info-desc");

//* Escena principal
const scene = new THREE.Scene();

//* Cámara
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 4; // distancia inicial de la cámara

//? ===============================
//? RENDERIZADOR
//? ===============================

//* Motor gráfico que dibuja la escena
const renderer = new THREE.WebGLRenderer({
  alpha: true, // fondo transparente
  antialias: window.innerWidth > 768, // suavizado en pantallas grandes
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);

//* Agrega el canvas al body
document.body.appendChild(renderer.domElement);

//* Posiciona el canvas detrás del contenido
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "1";
renderer.domElement.style.touchAction = "none";

//? ===============================
//? FONDO DE ESTRELLAS
//? ===============================

const starsGeometry = new THREE.BufferGeometry();
const starsCount = 1500;

//* Posiciones aleatorias para las estrellas
const posArray = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 10;
}

starsGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));

//* Material de las estrellas
const starsMaterial = new THREE.PointsMaterial({
  size: 0.015,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8,
});

//* Objeto de estrellas
const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

//? ===============================
//? TEXTURAS
//? ===============================

const textureLoader = new THREE.TextureLoader();

//* Textura del planeta
const earthTex = textureLoader.load(
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
);

//* Textura del pin
const pinTex = textureLoader.load("img/pin.png");

//? ===============================
//? GLOBO TERRÁQUEO
//? ===============================

//* Grupo que contiene todo el planeta
const globeGroup = new THREE.Group();
scene.add(globeGroup);

//* Geometría de la esfera
const geometry = new THREE.SphereGeometry(1.3, 64, 64);

//* Material del planeta
const material = new THREE.MeshPhongMaterial({
  map: earthTex,
  color: 0x00ccff,
  transparent: true,
  opacity: 0.6,
  emissive: 0x002233,
});

//* Malla del planeta
const globe = new THREE.Mesh(geometry, material);
globeGroup.add(globe);

//? ===============================
//? ATMÓSFERA
//? ===============================

//* Esfera un poco más grande para el brillo exterior
const atmoGeom = new THREE.SphereGeometry(1.32, 64, 64);

const atmoMat = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.15,
  side: THREE.BackSide,
});

const atmosphere = new THREE.Mesh(atmoGeom, atmoMat);
globeGroup.add(atmosphere);

//? ===============================
//? PINES EN EL GLOBO
//? ===============================

const pins = [];

//* Función para crear pines en el planeta
function addPoint(lat, lon, title, desc) {
  const r = 1.3;

  //* Conversión de latitud y longitud a coordenadas 3D
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  //* Material del pin
  const spriteMat = new THREE.SpriteMaterial({ map: pinTex, color: 0x00ffff });

  const pin = new THREE.Sprite(spriteMat);
  pin.scale.set(0.12, 0.12, 1);

  //* Posición del pin
  pin.position.set(x, y, z);

  //* Datos del pin
  pin.userData = {
    basePos: new THREE.Vector3(x, y, z),
    dir: new THREE.Vector3(x, y, z).normalize(),
    offset: Math.random() * 10,
    title,
    desc,
  };

  globeGroup.add(pin);
  pins.push(pin);
}

//* Pines de ejemplo
addPoint(
  4,
  -72,
  "CHOCO, COLOMBIA",
  "Mi tierra linda, donde la selva toca el mar.",
);
addPoint(
  50.93,
  6.95,
  "CATEDRAL DE COLONIA",
  "Una iglesia gigante en Alemania.",
);
addPoint(56.13, -106.34, "CANADA", "Mucho frío pero paisajes increíbles.");
addPoint(36.2, 138.25, "JAPON", "El futuro y el pasado en un solo lugar.");

//? ===============================
//? LUCES
//? ===============================

//* Luz principal
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 5, 5);
scene.add(light);

//* Luz ambiental
scene.add(new THREE.AmbientLight(0x404040));

//? ===============================
//? DETECCIÓN DE CLIC EN PINES
//? ===============================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  //* Evita detectar clic si estaba arrastrando
  if (isDragging) return;

  //* Convierte el clic a coordenadas 3D
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(pins);

  //* Si hizo clic en un pin
  if (intersects.length > 0) {
    activePin = intersects[0].object;
    infoTitle.innerText = activePin.userData.title;
    infoDesc.innerText = activePin.userData.desc;

    infoBox.classList.remove("info-box-hidden");
    infoBox.classList.add("info-box-visible");
  } else {
    //* Si no hizo clic en nada
    activePin = null;
    infoBox.classList.add("info-box-hidden");
    infoBox.classList.remove("info-box-visible");
  }
});

//? ===============================
//? ROTACIÓN CON MOUSE
//? ===============================

window.addEventListener("mousedown", () => (isDragging = true));
window.addEventListener("mouseup", () => (isDragging = false));

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    globeGroup.rotation.y += (e.clientX - prevMouse.x) * 0.005;
    globeGroup.rotation.x += (e.clientY - prevMouse.y) * 0.005;
  }
  prevMouse = { x: e.clientX, y: e.clientY };
});

//? ===============================
//? ZOOM CON RUEDA DEL MOUSE
//? ===============================

window.addEventListener("wheel", (e) => {
  camera.position.z = Math.min(
    Math.max(camera.position.z + e.deltaY * 0.002, 2),
    6,
  );
});

//? ===============================
//? POSICIÓN DE LA CAJA DE INFO
//? ===============================

function updateInfoBoxPosition() {
  if (!activePin) return;

  const vector = new THREE.Vector3();
  activePin.getWorldPosition(vector);
  vector.project(camera);

  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

  infoBox.style.left = `${x + 50}px`;
  infoBox.style.top = `${y - 20}px`;
}

//? ===============================
//? ANIMACIÓN PRINCIPAL
//? ===============================

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.002;

  //* Rotación automática del planeta
  if (!isDragging && !activePin && !isMobileDevice)
    globeGroup.rotation.y += 0.001;

  //* Actualiza posición del cuadro de info
  if (activePin) updateInfoBoxPosition();

  //* Parpadeo de estrellas
  starsMaterial.opacity = 0.5 + Math.sin(time * 0.5) * 0.4;

  //* Rebote de pines
  if (!activePin) {
    pins.forEach((p) => {
      const bounce = Math.sin(time + p.userData.offset) * 0.03;
      p.position
        .copy(p.userData.basePos)
        .addScaledVector(p.userData.dir, bounce + 0.08);
    });
  }

  renderer.render(scene, camera);
}

animate();
// --- Responsive ---
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const isMobile = width < 768;
  const isPortrait = height > width;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  if (isMobile && isPortrait) {
    globeGroup.position.set(0, -1.2, 0);
    globeGroup.scale.set(0.9, 0.9, 0.9);
    camera.position.z = 3;
  } else if (isMobile) {
    globeGroup.position.set(0, 0, 0);
    globeGroup.scale.set(1, 1, 1);
    camera.position.z = 2.8;
  } else {
    globeGroup.position.set(0.8, 0, 0);
    globeGroup.scale.set(0.9, 0.9, 0.9);
    camera.position.z = 3;
  }
}

handleResize();
window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", () => {
  setTimeout(handleResize, 200);
});
