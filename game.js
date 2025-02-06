// enhancedGame.js

let score = 0;
let targets = [];
const MOVEMENT_SPEED = 0.1;
let mouseX = 0, mouseY = 0;
const explosionParticles = [];

// Setup Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Audio: Attach a listener to the camera and load audio files
const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();

// Background Music (replace with your own file URL)
const backgroundMusic = new THREE.Audio(listener);
audioLoader.load('path/to/background-music.mp3', function(buffer) {
  backgroundMusic.setBuffer(buffer);
  backgroundMusic.setLoop(true);
  backgroundMusic.setVolume(0.5);
  backgroundMusic.play();
});

// Background Noise (replace with your own file URL)
const backgroundNoise = new THREE.Audio(listener);
audioLoader.load('path/to/background-noise.mp3', function(buffer) {
  backgroundNoise.setBuffer(buffer);
  backgroundNoise.setLoop(true);
  backgroundNoise.setVolume(0.3);
  backgroundNoise.play();
});

// Hit Sound Effect (replace with your own file URL)
const hitSound = new THREE.Audio(listener);
audioLoader.load('path/to/hit-sound.mp3', function(buffer) {
  hitSound.setBuffer(buffer);
  hitSound.setVolume(1.0);
});

// Gunshot Sound Effect (replace with your own file URL)
const gunshotSound = new THREE.Audio(listener);
audioLoader.load('path/to/gunshot-sound.mp3', function(buffer) {
  gunshotSound.setBuffer(buffer);
  gunshotSound.setVolume(0.8);
});

// Skybox Background
const cubeTextureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeTextureLoader.load([
  'path/to/px.jpg', // positive X
  'path/to/nx.jpg', // negative X
  'path/to/py.jpg', // positive Y
  'path/to/ny.jpg', // negative Y
  'path/to/pz.jpg', // positive Z
  'path/to/nz.jpg'  // negative Z
]);
scene.background = skyboxTexture;

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);
scene.add(new THREE.AmbientLight(0x404040));

// Player setup: create a player mesh and position the camera
camera.position.set(0, 1, 5);
const playerGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// Floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Target creation
function createTarget() {
  const geometry = new THREE.SphereGeometry(0.5);
  const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  const target = new THREE.Mesh(geometry, material);
  target.position.set(
    Math.random() * 10 - 5,
    0.5,
    Math.random() * 10 - 5
  );
  scene.add(target);
  targets.push(target);
}
for (let i = 0; i < 5; i++) createTarget();

// Movement controls
const moveState = { forward: false, backward: false, left: false, right: false };
document.addEventListener('keydown', function(e) {
  switch (e.key.toLowerCase()) {
    case 'w': moveState.forward = true; break;
    case 's': moveState.backward = true; break;
    case 'a': moveState.left = true; break;
    case 'd': moveState.right = true; break;
  }
});
document.addEventListener('keyup', function(e) {
  switch (e.key.toLowerCase()) {
    case 'w': moveState.forward = false; break;
    case 's': moveState.backward = false; break;
    case 'a': moveState.left = false; break;
    case 'd': moveState.right = false; break;
  }
});

// Explosion Particle Effect: create a burst of particles at a given position
function createExplosion(position) {
  const particleCount = 10;
  for (let i = 0; i < particleCount; i++) {
    const particleGeom = new THREE.SphereGeometry(0.05);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const particle = new THREE.Mesh(particleGeom, particleMat);
    particle.position.copy(position);
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    );
    scene.add(particle);
    explosionParticles.push({ mesh: particle, velocity: velocity, lifetime: 1.0 });
  }
}

// Shooting function: cast a ray from the camera to check for target intersections
function shoot() {
  // Play gunshot sound regardless of hit
  if (gunshotSound.isPlaying) gunshotSound.stop();
  gunshotSound.play();

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const raycaster = new THREE.Raycaster(camera.position, direction);
  const intersects = raycaster.intersectObjects(targets);
  
  if (intersects.length > 0) {
    const target = intersects[0].object;
    // Play hit sound
    if (hitSound.isPlaying) hitSound.stop();
    hitSound.play();
    // Create explosion at target's position
    createExplosion(target.position);
    scene.remove(target);
    targets = targets.filter(t => t !== target);
    score++;
    const hud = document.getElementById('hud');
    if (hud) {
      hud.textContent = `Score: ${score}`;
    }
    setTimeout(createTarget, 1000);
  }
}

// Pointer Lock Controls: enable immersive mouse-look controls
const pointerLockControls = (function() {
  const element = renderer.domElement;
  let isLocked = false;
  element.addEventListener('click', function() {
    element.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', function() {
    isLocked = document.pointerLockElement === element;
  });
  return {
    get isLocked() {
      return isLocked;
    }
  };
})();

// Mouse movement handler (inverted horizontal movement)
document.addEventListener('mousemove', function(event) {
  if (pointerLockControls.isLocked) {
    mouseX -= event.movementX * 0.002;
    mouseY += event.movementY * 0.002;
    mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY));
  }
});

// Mouse click handler for shooting
document.addEventListener('mousedown', function(event) {
  if (event.button === 0 && pointerLockControls.isLocked) {
    shoot();
  }
});

// Update explosion particles: move them and fade them out
function updateExplosions(delta) {
  for (let i = explosionParticles.length - 1; i >= 0; i--) {
    const pData = explosionParticles[i];
    pData.mesh.position.add(pData.velocity);
    pData.lifetime -= delta;
    pData.mesh.material.opacity = Math.max(0, pData.lifetime);
    pData.mesh.material.transparent = true;
    if (pData.lifetime <= 0) {
      scene.remove(pData.mesh);
      explosionParticles.splice(i, 1);
    }
  }
}

// Main update function: handle movement, camera rotation, and explosions
function update(delta) {
  if (pointerLockControls.isLocked) {
    camera.rotation.set(-mouseY, mouseX, 0, 'YXZ');
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    if (moveState.forward) player.position.add(forward.clone().multiplyScalar(MOVEMENT_SPEED));
    if (moveState.backward) player.position.add(forward.clone().multiplyScalar(-MOVEMENT_SPEED));
    if (moveState.left) player.position.add(right.clone().multiplyScalar(-MOVEMENT_SPEED));
    if (moveState.right) player.position.add(right.clone().multiplyScalar(MOVEMENT_SPEED));
    player.position.y = 1;
    camera.position.copy(player.position).add(new THREE.Vector3(0, 1.6, 0));
  }
  updateExplosions(delta);
}

// Animation loop with delta time
let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  update(delta);
  renderer.render(scene, camera);
}
animate();

// Window resize handling to keep the scene responsive
window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
