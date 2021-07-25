// TODO: clean code.
import * as THREE from "three";
// import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const inputAreaHeight = 100;
// // const gui = new GUI();
const textureLoader = new THREE.TextureLoader();
const scene = new THREE.Scene();
const gltfLoader = new GLTFLoader();
const canvas = document.querySelector("#glCanvas");

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight - inputAreaHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3.5;

const camera = new THREE.PerspectiveCamera(
  65, // FOV
  window.innerWidth / (window.innerHeight - inputAreaHeight), // Aspect ratio
  0.1, // near
  100 // far
);
camera.position.set(-2, 1, 3);

const controls = new OrbitControls(camera, renderer.domElement);
controls.maxAzimuthAngle = 0.1;

const rotatingObjList = [];
const surfacesList = [];
let currentMode = "mug";
let animating;
let textureIndex = 0;
const rotationChangeHandler = () => {
  animating = false;
};
controls.addEventListener("start", rotationChangeHandler);
const mousePointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let tracingTarget;
let floor;
let tracingHelper;

document.addEventListener("mousemove", ({ clientX, clientY }) => {
  mousePointer.x = (clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = -(clientY / (window.innerHeight - inputAreaHeight)) * 2 + 1;
});

function modeToModelUrl(mode) {
  switch (mode) {
    case "mug":
      // return "https://3d-mode-trial.s3.ap-southeast-2.amazonaws.com/mug_v2.gltf";
      return "./mug_v2.gltf";
    case "tshirt":
      // return "https://3d-mode-trial.s3.ap-southeast-2.amazonaws.com/tshirt.gltf";
      return "./tshirt.gltf";
    default:
      break;
  }
}

function renderModel(mode, enableFloor) {
  let modelUrl = modeToModelUrl(mode);
  animating = true;
  textureIndex = 0;

  const ambLight = new THREE.AmbientLight(0xffffff, 1.0);
  // const ambLightFolder = gui.addFolder("Amb light");
  // ambLightFolder.add(ambLight, "intensity");
  scene.add(ambLight);

  const pointLight1 = new THREE.PointLight(0xffffff, 2);
  pointLight1.position.set(1, 0.5, -4);
  pointLight1.castShadow = true;
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 2);
  pointLight2.position.set(-3, 1, 2);
  scene.add(pointLight2);

  if (enableFloor) {
    animating = false;
    // Referenced https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_physical.html
    const floorMat = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      color: 0xffffff,
      metalness: 0.2,
      bumpScale: 0.0005,
    });
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("wood/diffuse.jpg", function (map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      map.encoding = THREE.sRGBEncoding;
      floorMat.map = map;
      floorMat.needsUpdate = true;
    });
    textureLoader.load("wood/bump.jpg", function (map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      floorMat.bumpMap = map;
      floorMat.needsUpdate = true;
    });
    textureLoader.load("wood/roughness.jpg", function (map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      floorMat.roughnessMap = map;
      floorMat.needsUpdate = true;
    });
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2.0;
    floorMesh.position.y = -1.02;
    floorMesh.scale.set(10, 10, 1);
    floor = floorMesh;
    scene.add(floorMesh);
  } else {
    floor = undefined;
  }

  gltfLoader.load(modelUrl, (gltf) => {
    const group = gltf.scene.children[0];
    const targetObjs = group.children.filter((d) =>
      ["main", "surface_front", "surface_back"].includes(d.name)
    );
    const surfaceFront = targetObjs.find((d) => d.name === "surface_front");
    const surfaceBack = targetObjs.find((d) => d.name === "surface_back");
    const main = targetObjs.find((d) => d.name === "main");
    tracingTarget = main;
    tracingHelper = new THREE.BoxHelper(main, 0x87ceeb);
    tracingHelper.visible = false;
    group.add(tracingHelper);
    for (const o of targetObjs) {
      o.castShadow = true;
      o.material.roughness = 0.1;
    }
    // Model adjustment, should do it in blender instead.
    if (group.name === "mug") {
      group.rotation.z = 1.27;
      camera.position.set(-2, enableFloor ? 3 : 1, enableFloor ? 6 : 3);
    } else if (group.name === "tshirt") {
      camera.position.set(-2, 1, 1);
      ambLight.intensity = 1.5;
      pointLight1.intensity = 2.5;
      pointLight1.position.set(-0.5, 1, 3);
      pointLight2.intensity = 2.5;
      pointLight2.position.set(0.5, 1, -3);
      for (const o of targetObjs) {
        o.material.roughness = 0.45;
      }
    }
    surfacesList.push(surfaceFront, surfaceBack);
    assignTextures();

    scene.add(group);

    rotatingObjList.push(group);
  });
}

function assignTextures() {
  const index = textureIndex++ % 3;
  for (let i = 1; i <= surfacesList.length; i++) {
    textureLoader.load(
      `./${currentMode}/${index * surfacesList.length + i}.png`,
      (t) => {
        t.encoding = THREE.sRGBEncoding;
        surfacesList[i - 1].material.map = t;
      }
    );
  }
}

function resizeRendererToDisplaySize(renderer, camera) {
  let { clientWidth: bW, clientHeight: bH } = document.body;
  bH -= inputAreaHeight;
  const { clientWidth: cW, clientHeight: cH } = canvas;
  // Assumed that the renderer occupied the whole window.
  if (bW === cW && bH === cH) {
    return false;
  }

  renderer.setSize(bW, bH);
  camera.aspect = bW / bH;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (animating) {
    for (const o of rotatingObjList) o.rotation.z += 0.011;
  }
  resizeRendererToDisplaySize(renderer, camera);
  renderer.render(scene, camera);
}

let dndEnabled = false;
canvas.addEventListener("pointerdown", (e) => {
  camera.updateProjectionMatrix();
  raycaster.setFromCamera(mousePointer, camera);
  if (rotatingObjList.length && floor) {
    const intersects = raycaster.intersectObjects([tracingTarget, floor]);
    if (intersects.length > 0) {
      // hack
      if (intersects.find((d) => d.object.name === "main")) {
  controls.enabled = false;
        tracingHelper.visible = true;
        dndEnabled = true;
      }
    }
  }
}, { capture: true });

document.body.addEventListener("pointerup", () => {
  tracingHelper.visible = false;
  dndEnabled = false;
    controls.enabled = true;
});
document.body.addEventListener("mousemove", () => {
  if (!dndEnabled) return;
  camera.updateProjectionMatrix();
  raycaster.setFromCamera(mousePointer, camera);
  if (rotatingObjList.length && floor) {
    const intersects = raycaster.intersectObjects([tracingTarget, floor]);

    if (intersects.length > 0) {
      const { point } = intersects.find((d) => d.object.name === "");
      rotatingObjList[0].position.set(point.x, 0, point.z);
    }
  }
});
animate();

renderModel("mug");

const mugButton = document.querySelector("#mug");
const tshirtButton = document.querySelector("#tshirt");
const shuffleButton = document.querySelector("#changeImage");
const dndButton = document.querySelector("#dnd");

function prepareNextRender() {
  while (rotatingObjList.length) rotatingObjList.pop();
  while (surfacesList.length) surfacesList.pop();
  scene.clear();
}

mugButton.addEventListener("click", () => {
  prepareNextRender();
  tshirtButton.removeAttribute("disabled");
  mugButton.setAttribute("disabled", "true");
  dnd.removeAttribute("disabled");
  renderModel("mug");
  currentMode = "mug";
});

tshirtButton.addEventListener("click", () => {
  prepareNextRender();
  tshirtButton.setAttribute("disabled", "true");
  dnd.removeAttribute("disabled");
  mugButton.removeAttribute("disabled");
  renderModel("tshirt");
  currentMode = "tshirt";
});

dndButton.addEventListener("click", () => {
  prepareNextRender();
  tshirtButton.removeAttribute("disabled");
  dnd.setAttribute("disabled", "true");
  mugButton.removeAttribute("disabled");
  renderModel("mug", true);
  currentMode = "mug";
});

shuffleButton.addEventListener("click", () => {
  assignTextures();
});
