/******************************
* RESPONSIVE WARNING BEHAVIOR *
******************************/

const responsiveWarning = document.getElementById("responsive-warning");
// Enable/disable responsive warning.
const responsiveDesign = true;
// Mobile width limit.
const threshold = 768;

// Show or hide modal based on screen size.
function checkResponsiveState() {
  const small = window.innerWidth <= threshold;

  if (!responsiveDesign && small) {
    if (!responsiveWarning.open) {
      responsiveWarning.showModal();
      document.body.classList.add("overflow-hidden");
    }
  } else {
    if (responsiveWarning.open) {
      responsiveWarning.close();
      document.body.classList.remove("overflow-hidden");
    }
  }
}

// Initial check.
checkResponsiveState();

// Real-time resize detection.
window.addEventListener("resize", checkResponsiveState);


/************************
* RUBIK'S CUBE BEHAVIOR *
************************/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Cube configuration.
const CUBE_SIZE = 1;
const SPACING = -0.05;
const EDGE_RADIUS = 0.125;
const ROTATION_ANIMATION_DURATION = 300;

// Standard Rubik’s Cube colors.
const FACE_COLORS = {
  R: 0xcc0000,
  L: 0xff5500,
  U: 0xffffff,
  D: 0xffd500,
  F: 0x009e60,
  B: 0x0051ba
};

const scene = new THREE.Scene();

// Compute viewport aspect ratio.
function getAspectRatio() {
  return window.innerWidth / window.innerHeight;
}

// Camera setup.
const camera = new THREE.PerspectiveCamera(45, getAspectRatio(), 0.1, 100);
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);
scene.add(camera);

// Adapt camera distance to screen ratio.
function adaptCameraDistance() {
  const aspectRatio = getAspectRatio();
  let cameraDistance = 10;

  if (aspectRatio > 1.6) {
    cameraDistance = 6;
  }

  if (aspectRatio <= 1.6 && aspectRatio > 1) {
    cameraDistance = 7;
  }

  if (aspectRatio <= 1) {
    cameraDistance = 8;
  }

  camera.position.set(cameraDistance, cameraDistance, cameraDistance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

adaptCameraDistance();

// Render setup.
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  premultipliedAlpha: false,
  powerPreference: "high-performance",
  precision: "highp"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// Controls Setup.
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.1;
orbitControls.enablePan = false;

// Lights.
scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.5));

const mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainDirectionalLight.position.set(5, 10, 5);
mainDirectionalLight.castShadow = true;
camera.add(mainDirectionalLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// Create colored face material.
function createFaceMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color: color,
    roughness: 0.35,
    metalness: 0.0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    specularIntensity: 0.9
  });
}

// Internal plastic material.
const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

// Cubies.
const cubies = [];
const rotationPivot = new THREE.Group();
scene.add(rotationPivot);

// Rounded geometry for external cubies.
const cubieGeometry = new RoundedBoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, 4, EDGE_RADIUS);

// Generate all 27 cubies.
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      const faceMaterials = [
        x === 1 ? createFaceMaterial(FACE_COLORS.R) : blackMaterial,
        x === -1 ? createFaceMaterial(FACE_COLORS.L) : blackMaterial,
        y === 1 ? createFaceMaterial(FACE_COLORS.U) : blackMaterial,
        y === -1 ? createFaceMaterial(FACE_COLORS.D) : blackMaterial,
        z === 1 ? createFaceMaterial(FACE_COLORS.F) : blackMaterial,
        z === -1 ? createFaceMaterial(FACE_COLORS.B) : blackMaterial
      ];

      const cubieMesh = new THREE.Mesh(cubieGeometry, faceMaterials);

      const spacingOffset = CUBE_SIZE + SPACING;
      cubieMesh.position.set(
        x * spacingOffset,
        y * spacingOffset,
        z * spacingOffset
      );

      cubieMesh.castShadow = true;
      cubieMesh.receiveShadow = true;

      // Inner black core with subtle bevel.
      cubieMesh.add(
        new THREE.Mesh(
          new RoundedBoxGeometry(0.95, 0.95, 0.95, 5, 0.025),
          blackMaterial
        )
      );

      scene.add(cubieMesh);
      cubies.push(cubieMesh);
    }
  }
}

// Align cubie position and rotation to grid.
function snapCubieToGrid(cubie) {
  const spacingOffset = CUBE_SIZE + SPACING;

  cubie.position.x = Math.round(cubie.position.x / spacingOffset) * spacingOffset;
  cubie.position.y = Math.round(cubie.position.y / spacingOffset) * spacingOffset;
  cubie.position.z = Math.round(cubie.position.z / spacingOffset) * spacingOffset;

  const euler = new THREE.Euler().setFromQuaternion(cubie.quaternion);
  const quarterTurn = Math.PI / 2;

  euler.x = Math.round(euler.x / quarterTurn) * quarterTurn;
  euler.y = Math.round(euler.y / quarterTurn) * quarterTurn;
  euler.z = Math.round(euler.z / quarterTurn) * quarterTurn;

  cubie.quaternion.setFromEuler(euler);
}

let isLayerRotationInProgress = false;

// Rotate a cube layer.
function rotateLayer(axisName, layerCoordinate, rotationDirection) {
  if (isLayerRotationInProgress) {
    return;
  }

  isLayerRotationInProgress = true;
  orbitControls.enabled = false;

  const tolerance = 0.1;

  const layerCubies = cubies.filter(
    cubie => Math.abs(cubie.position[axisName] - layerCoordinate) < tolerance
  );

  rotationPivot.rotation.set(0, 0, 0);

  layerCubies.forEach(cubie => {
    scene.remove(cubie);
    rotationPivot.add(cubie);
  });

  const targetRotation = (Math.PI / 2) * rotationDirection;
  let animationStartTime = null;

  // Ease-out with slight overshoot for mechanical inertia.
  function easeOutBack(t) {
    const overshootStrength = 1.25;

    const overshootFactor = overshootStrength + 1;

    return (1 + overshootFactor * Math.pow(t - 1, 3) + overshootStrength * Math.pow(t - 1, 2));
  }

  // Animate layer rotation with eased timing.
  function animateRotation(timestamp) {
    if (animationStartTime === null) {
      animationStartTime = timestamp;
    }

    const progress = Math.min((timestamp - animationStartTime) / ROTATION_ANIMATION_DURATION, 1);

    const easedProgress = easeOutBack(progress);
    rotationPivot.rotation[axisName] = easedProgress * targetRotation;


    if (progress < 1) {
      requestAnimationFrame(animateRotation);
      return;
    }

    rotationPivot.updateMatrixWorld();

    layerCubies.forEach(cubie => {
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();

      cubie.getWorldPosition(worldPosition);
      cubie.getWorldQuaternion(worldQuaternion);

      rotationPivot.remove(cubie);
      scene.add(cubie);

      cubie.position.copy(worldPosition);
      cubie.quaternion.copy(worldQuaternion);

      snapCubieToGrid(cubie);
    });

    isLayerRotationInProgress = false;
    orbitControls.enabled = true;
  }

  requestAnimationFrame(animateRotation);
}

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

let isDragging = false;
let startPointerX = 0;
let startPointerY = 0;

let intersectedCubie = null;
let intersectionPoint = null;
let intersectionNormal = null;

// Pointer press.
window.addEventListener("pointerdown", event => {
  if (isLayerRotationInProgress) {
    return;
  }

  pointerNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointerNDC, camera);

  const intersections = raycaster.intersectObjects(cubies);

  if (intersections.length === 0) {
    return;
  }

  isDragging = true;
  orbitControls.enabled = false;

  startPointerX = event.clientX;
  startPointerY = event.clientY;

  intersectedCubie = intersections[0].object;
  intersectionPoint = intersections[0].point;
  intersectionNormal = intersections[0].face.normal
    .clone()
    .transformDirection(intersectedCubie.matrixWorld)
    .round();
});

// Pointer drag.
window.addEventListener("pointermove", event => {
  if (!isDragging || isLayerRotationInProgress) {
    return;
  }

  const deltaX = event.clientX - startPointerX;
  const deltaY = event.clientY - startPointerY;

  if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < 8) {
    return;
  }

  isDragging = false;

  const dragDirection = new THREE.Vector2(deltaX, deltaY).normalize();

  const worldAxes = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1)
  ];

  const candidateAxes = worldAxes.filter(
    axis => Math.abs(axis.dot(intersectionNormal)) < 0.1
  );

  let bestAxis = null;
  let bestAlignmentScore = -1;

  for (const axis of candidateAxes) {
    const worldStart = intersectionPoint.clone();
    const worldEnd = intersectionPoint.clone().add(axis);

    const screenStart = worldStart.project(camera);
    const screenEnd = worldEnd.project(camera);

    const screenAxisDirection = new THREE.Vector2(
      (screenEnd.x - screenStart.x) * window.innerWidth * 0.5,
      -(screenEnd.y - screenStart.y) * window.innerHeight * 0.5
    ).normalize();

    const alignmentScore = Math.abs(
      dragDirection.dot(screenAxisDirection)
    );

    if (alignmentScore > bestAlignmentScore) {
      bestAlignmentScore = alignmentScore;
      bestAxis = axis;
    }
  }

  if (!bestAxis) {
    orbitControls.enabled = true;
    return;
  }

  const rotationAxis = new THREE.Vector3().crossVectors(
    intersectionNormal,
    bestAxis
  );

  let rotationAxisName = "x";

  if (Math.abs(rotationAxis.y) > Math.abs(rotationAxis.x) && Math.abs(rotationAxis.y) > Math.abs(rotationAxis.z)) {
    rotationAxisName = "y";
  }

  if (Math.abs(rotationAxis.z) > Math.abs(rotationAxis.x) && Math.abs(rotationAxis.z) > Math.abs(rotationAxis.y)) {
    rotationAxisName = "z";
  }

  const layerCoordinate = intersectedCubie.position[rotationAxisName];

  const testRotationGroup = new THREE.Group();
  testRotationGroup.rotation[rotationAxisName] = 0.25;
  testRotationGroup.updateMatrixWorld();

  const rotatedPoint = intersectionPoint
    .clone()
    .applyMatrix4(testRotationGroup.matrixWorld);

  const projectedStart = intersectionPoint.clone().project(camera);
  const projectedEnd = rotatedPoint.clone().project(camera);

  const theoreticalDirection = new THREE.Vector2(
    projectedEnd.x - projectedStart.x,
    -(projectedEnd.y - projectedStart.y)
  ).normalize();

  const rotationDirection =
    dragDirection.dot(theoreticalDirection) < 0 ? -1 : 1;

  rotateLayer(rotationAxisName, layerCoordinate, rotationDirection);
});

// Pointer release.
window.addEventListener("pointerup", () => {
  isDragging = false;

  if (!isLayerRotationInProgress) {
    orbitControls.enabled = true;
  }
});

// Rotation direction modifier (default).
let direction = -1;

// Track Space key state (invert direction while held).
window.addEventListener("keydown", event => {
  if (event.code === "Space") {
    direction = 1;
    event.preventDefault();
  }
});

window.addEventListener("keyup", event => {
  if (event.code === "Space") {
    direction = -1;
    event.preventDefault();
  }
});

// Face rotations.
window.addEventListener("keydown", event => {
  if (isLayerRotationInProgress) {
    return;
  }

  // Ignore Space here (handled above).
  if (event.code === "Space") {
    return;
  }

  const key = event.key.toUpperCase();
  const spacingOffset = CUBE_SIZE + SPACING;

  if (key === "R") rotateLayer("x", spacingOffset, direction);
  if (key === "L") rotateLayer("x", -spacingOffset, -direction);
  if (key === "U") rotateLayer("y", spacingOffset, direction);
  if (key === "D") rotateLayer("y", -spacingOffset, -direction);
  if (key === "F") rotateLayer("z", spacingOffset, direction);
  if (key === "B") rotateLayer("z", -spacingOffset, -direction);
});

// Render loop.
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}

animate();

// Resize handling.
window.addEventListener("resize", () => {
  camera.aspect = getAspectRatio();
  adaptCameraDistance();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
