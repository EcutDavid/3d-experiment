import * as THREE from "three";
// import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const inputAreaHeight = 100;
// const gui = new GUI();
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

function renderModel(mode) {
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

  gltfLoader.load(modelUrl, (gltf) => {
    animating = true;
    const group = gltf.scene.children[0];
    const targetObjs = group.children.filter((d) =>
      ["main", "surface_front", "surface_back"].includes(d.name)
    );
    const surfaceFront = targetObjs.find((d) => d.name === "surface_front");
    const surfaceBack = targetObjs.find((d) => d.name === "surface_back");
    for (const o of targetObjs) {
      o.castShadow = true;
      o.material.roughness = 0.2;
    }
    // Model adjustment, should do it in blender instead.
    if (group.name === "mug") {
      group.rotation.z = 1.27;
      camera.position.set(-2, 1, 3);
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
  const index = (textureIndex++) % 3;
  for (let i = 1; i <= surfacesList.length; i++) {
    textureLoader.load(`./${currentMode}/${index * surfacesList.length + i}.png`, t => {
      surfacesList[i - 1].material.map = t;
    });
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
animate();

renderModel("mug");

const mugButton = document.querySelector("#mug");
const tshirtButton = document.querySelector("#tshirt");
const shuffleButton = document.querySelector("#changeImage");

function prepareNextRender() {
  while (rotatingObjList.length) rotatingObjList.pop();
  while (surfacesList.length) surfacesList.pop();
  scene.clear();
}

mugButton.addEventListener("click", () => {
  prepareNextRender();
  tshirtButton.removeAttribute("disabled");
  mugButton.setAttribute("disabled", "true");
  renderModel("mug");
  currentMode = "mug";
});

tshirtButton.addEventListener("click", () => {
  prepareNextRender();
  tshirtButton.setAttribute("disabled", "true");
  mugButton.removeAttribute("disabled");
  renderModel("tshirt");
  currentMode = "tshirt";
});

shuffleButton.addEventListener("click", () => {
  assignTextures();
})
