// --- Configuracion de la escena ---
const container = document.getElementById("globe-container");
// ✨ NUEVO: Estas son las variables para manejar la cajita de info
const infoBox = document.getElementById("info-box");
const infoTitle = document.getElementById("info-title");
const infoDesc = document.getElementById("info-desc");

const scene = new THREE.Scene();

// La cámara: el primer número (45) es qué tan "angular" es la vista, el último (4) es la distancia inicial
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

// 🔥 El canvas es FONDO COMPLETO
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "1";

//* --- 1. Fondo de estrellitas si si (lo hago en cada proyecto) ---
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 1500; // esto es pa poner mas estrellistas ok?
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

//* --- 2. texturaaaa ---
const textureLoader = new THREE.TextureLoader();
const earthTex = textureLoader.load(
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
);
const pinTex = textureLoader.load("img/pin.png");

//? EL GRUPO: Esto es como un bolso, metemos todo dentro para moverlo fácil
const globeGroup = new THREE.Group();
scene.add(globeGroup);

//? DE ACA SE MUEEVE LA TIERRA HACIA LA DERECHA - mas alto el número, más se aleja
globeGroup.position.x = window.innerWidth < 768 ? 0 : 0.8;

//? TAMAÑO DE LA TIERRA El 1.3 es el radio Si la quiero mas grande ponele 1.8 a eso cosa
const geometry = new THREE.SphereGeometry(1.3, 64, 64);

const material = new THREE.MeshPhongMaterial({
  map: earthTex,
  color: 0x00ccff,
  transparent: true,
  opacity: 0.6, // opacidad de la tierra
  emissive: 0x002233,
});
const globe = new THREE.Mesh(geometry, material);
globeGroup.add(globe);

// Atmosfera, que se supone que es el brillo, pero no brilla mucho la verdad
const atmoGeom = new THREE.SphereGeometry(1.32, 64, 64);
const atmoMat = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.15,
  side: THREE.BackSide,
});
const atmosphere = new THREE.Mesh(atmoGeom, atmoMat);
globeGroup.add(atmosphere);

//* --- 3. Ubicaciones de los pines ---
const pins = [];

// ✨ NUEVO: Ahora le pasamos el texto que queremos que diga cada pin
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

  //? Guardamos la info del pin para que aparezca al darle click
  pin.userData = {
    basePos: new THREE.Vector3(x, y, z),
    dir: new THREE.Vector3(x, y, z).normalize(),
    offset: Math.random() * 10,
    title: title,
    desc: desc,
  };

  globeGroup.add(pin);
  pins.push(pin);
}

//? ESTO ES PARA PONER MAS LOCATIONs pero toca buscar la latitud y longitud en google
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
  "Una iglesia gigante en Alemania que es puro arte.",
);
addPoint(56.13, -106.34, "CANADA", "Mucho frío pero paisajes increíbles.");
addPoint(36.2, 138.25, "JAPON", "El futuro y el pasado en un solo lugar.");

//* --- luiz ---
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 5, 5); // orientacion de la luz
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040)); // luz general (ni idea que hace)

//* --- 5. el muse ---
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let activePin = null; //? Esto nos dice si tenemos un pin seleccionado ok?

// ✨ Detector de clicks (Raycaster)
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

window.addEventListener("mousedown", () => (isDragging = true));
window.addEventListener("mouseup", () => (isDragging = false));

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    globeGroup.rotation.y += (e.clientX - prevMouse.x) * 0.005;
    globeGroup.rotation.x += (e.clientY - prevMouse.y) * 0.005;
  }
  prevMouse = { x: e.clientX, y: e.clientY };
});

// --- Soporte táctil ---
window.addEventListener("touchstart", (e) => {
  isDragging = true;
  prevMouse = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  };
});

window.addEventListener("touchend", () => {
  isDragging = false;
});

window.addEventListener("touchmove", (e) => {
  if (isDragging) {
    const touch = e.touches[0];

    globeGroup.rotation.y += (touch.clientX - prevMouse.x) * 0.005;
    globeGroup.rotation.x += (touch.clientY - prevMouse.y) * 0.005;

    prevMouse = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }
});

window.addEventListener("wheel", (e) => {
  camera.position.z = Math.min(
    Math.max(camera.position.z + e.deltaY * 0.002, 2.5),
    6,
  );
});

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

//* --- 6. esta es la animacion que se ejecuta cada 60 segundos creo ---
function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.002;

  //? gira solo si no lo muevo yo y si no hay info abierta
  if (!isDragging && !activePin) globeGroup.rotation.y += 0.001;

  //? si hay info abierta, que la caja siga al pin
  if (activePin) updateInfoBoxPosition();

  starsMaterial.opacity = 0.5 + Math.sin(time * 0.5) * 0.4;

  pins.forEach((p) => {
    const bounce = Math.sin(time + p.userData.offset) * 0.03;
    p.position
      .copy(p.userData.basePos)
      .addScaledVector(p.userData.dir, bounce + 0.08);
  });

  renderer.render(scene, camera);
}
animate();

// --- Responsive ---
function handleResize() {

  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  if (width < 768) {
    globeGroup.position.x = 0;
    globeGroup.position.y = -0.6; // 🔥 BAJA la tierra
  } else {
    globeGroup.position.x = 0.8;
    globeGroup.position.y = 0;
  }

  
}
