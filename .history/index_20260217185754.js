// --- Interacción ---
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let activePin = null;
let initialPinchDistance = null;
let initialCameraZ = camera.position.z;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


// CLICK (Desktop)
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


// ------------------
// MOUSE (Desktop)
// ------------------

window.addEventListener("mousedown", (e) => {
  isDragging = true;
  prevMouse = { x: e.clientX, y: e.clientY };
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  globeGroup.rotation.y += (e.clientX - prevMouse.x) * 0.005;
  globeGroup.rotation.x += (e.clientY - prevMouse.y) * 0.005;

  prevMouse = { x: e.clientX, y: e.clientY };
});


// ------------------
// TOUCH (Mobile)
// ------------------

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

}, { passive: false });


window.addEventListener("touchmove", (e) => {

  e.preventDefault(); // evita scroll

  // ROTACIÓN
  if (e.touches.length === 1 && isDragging) {

    globeGroup.rotation.y += (e.touches[0].clientX - prevMouse.x) * 0.005;
    globeGroup.rotation.x += (e.touches[0].clientY - prevMouse.y) * 0.005;

    prevMouse = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }

  // ZOOM
  if (e.touches.length === 2 && initialPinchDistance !== null) {

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    if (currentDistance > 0) {
      const zoomFactor = initialPinchDistance / currentDistance;

      const newZ = initialCameraZ * zoomFactor;

      camera.position.z = Math.min(Math.max(newZ, 2.5), 6);
    }
  }

}, { passive: false });


window.addEventListener("touchend", () => {
  isDragging = false;
  initialPinchDistance = null;
});


// ------------------
// ZOOM RUEDA (Desktop)
// ------------------

window.addEventListener("wheel", (e) => {

  camera.position.z = Math.min(
    Math.max(camera.position.z + e.deltaY * 0.002, 2.5),
    6
  );

});
