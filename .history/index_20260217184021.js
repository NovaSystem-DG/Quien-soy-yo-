// --- Configuracion de la escena ---
const container = document.getElementById("globe-container");

const infoBox = document.getElementById("info-box");
const infoTitle = document.getElementById("info-title");
const infoDesc = document.getElementById("info-desc");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 4;

// 🔥 Renderer optimizado
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: window.innerWidth > 768
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "1";


// --- Fondo de estrellas ---
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 1500;
const posArray = new Float32Array(starsCount * 3);

for (let i = 0; i < starsCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 10;
}

starsGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));

const starsMaterial = new THREE.PointsMaterial({
  size: 0.015,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8,
});

const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);


// --- Texturas ---
const textureLoader = new THREE.TextureLoader();
const earthTex = textureLoader.load(
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
);
const pinTex = textureLoader.load("img/pin.png");


// --- Grupo del globo ---
const globeGroup = new THREE.Group();
scene.add(globeGroup);

const geometry = new THREE.SphereGeometry(1.3, 64, 64);

const material = new THREE.MeshPhongMaterial({
  map: earthTex,
  color: 0x00ccff,
  transparent: true,
  opacity: 0.6,
  emissive: 0x002233,
});

const globe = new THREE.Mesh(geometry, material);
globeGroup.add(globe);

// Atmosfera
const atmoGeom = new THREE.SphereGeometry(1.32, 64, 64);
const atmoMat = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.15,
  side: THREE.BackSide,
});
const atmosphere = new THREE.Mesh(atmoGeom, atmoMat);
globeGroup.add(atmosphere);


// --- Pines ---
const pins = [];

function addPoint(lat, lon, title, desc) {
  const r = 1.3;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  const spriteMat = new THREE.SpriteMaterial({ map: pinTex, color: 0x00ffff });
  const pin = new THREE.Sprite(spriteMat);
  pin.scale.set(0.12, 0.12, 1);
  pin.position.set(x, y, z);

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

addPoint(4, -72, "CHOCO, COLOMBIA", "Mi tierra linda, donde la selva toca el mar.");
addPoint(50.93, 6.95, "CATEDRAL DE COLONIA", "Una iglesia gigante en Alemania que es puro arte.");
addPoint(56.13, -106.34, "CANADA", "Mucho frío pero paisajes increíbles.");
addPoint(36.2, 138.25, "JAPON", "El futuro y el pasado en un solo lugar.");


// --- Luces ---
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));


// --- Interacción ---
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let activePin = null;

let initialPinchDistance = null;
let initialCameraZ = camera.position.z;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  if (isDragging) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(pins);

  if (intersects.length > 0) {
    activePin = intersects[0].object;
    infoTitle.innerText = activePin.userData.title;
    infoDesc.innerText = activePin.userData.desc;
    infoBox.classList.remove("info-box-hidden");
    infoBox.classList.add("info-box-visible");
  } else {
    activePin = null;
    infoBox.classList.add("info-box-hidden");
    infoBox.classList.remove("info-box-visible");
  }
});

// Mouse
window.addEventListener("mousedown", () => (isDragging = true));
window.addEventListener("mouseup", () => (isDragging = false));

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    globeGroup.rotation.y += (e.clientX - prevMouse.x) * 0.005;
    globeGroup.rotation.x += (e.clientY - prevMouse.y) * 0.005;
  }
  prevMouse = { x: e.clientX, y: e.clientY };
});

// --- Touch mejorado ---
window.addEventListener("touchstart", (e) => {

  if (e.touches.length === 1) {
    isDragging = true;
    prevMouse = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }

  if (e.touches.length === 2) {
    isDragging = false;

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    initialCameraZ = camera.position.z;
  }
});

window.addEventListener("touchmove", (e) => {

  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  const isMobile = width < 768;
  const isPortrait = height > width;

  if (e.touches.length === 1 && isDragging) {
    const touch = e.touches[0];

    globeGroup.rotation.y += (touch.clientX - prevMouse.x) * 0.005;
    globeGroup.rotation.x += (touch.clientY - prevMouse.y) * 0.005;

    prevMouse = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  if (e.touches.length === 2 && isMobile && !isPortrait) {

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    const zoomFactor = initialPinchDistance / currentDistance;

    camera.position.z = Math.min(
      Math.max(initialCameraZ * zoomFactor, 2),
      6
    );
  }

});

window.addEventListener("touchend", () => {
  isDragging = false;
  initialPinchDistance = null;
});

// Wheel zoom desktop
window.addEventListener("wheel", (e) => {
  camera.position.z = Math.min(
    Math.max(camera.position.z + e.deltaY * 0.002, 2.5),
    6,
  );
});


// --- Info Box ---
function updateInfoBoxPosition() {
  if (!activePin) return;

  const vector = new THREE.Vector3();
  activePin.getWorldPosition(vector);
  vector.project(camera);

  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

  infoBox.style.left = `${x + 60}px`;
  infoBox.style.top = `${y - 20}px`;
}


// --- Animación ---
function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.002;

  if (!isDragging && !activePin)
    globeGroup.rotation.y += 0.001;

  if (activePin)
    updateInfoBoxPosition();

  starsMaterial.opacity = 0.5 + Math.sin(time * 0.5) * 0.4;

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

  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;

  const isMobile = width < 768;
  const isPortrait = height > width;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  if (isMobile && isPortrait) {

    globeGroup.position.x = 0;
    globeGroup.position.y = -1.2;
    globeGroup.scale.set(0.9, 0.9, 0.9);
    camera.position.z = 3;

  } else if (isMobile) {

    globeGroup.position.x = 0;
    globeGroup.position.y = 0;
    globeGroup.scale.set(1, 1, 1);
    camera.position.z = 2.8;

  } else {

    globeGroup.position.x = 0.8;
    globeGroup.position.y = 0;
   
    camera.position.z = 3;
  }
}

handleResize();

window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", () => {
  setTimeout(handleResize, 200);
});
