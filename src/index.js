import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const inputAreaHeight = 180;
const gui = new GUI();
const meshFolder = gui.addFolder("Mesh");

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

const scene = new THREE.Scene();

// Lights
const ambLight = new THREE.AmbientLight(0xffffff, 1.3);
const ambLightFolder = gui.addFolder("Amb light");
ambLightFolder.add(ambLight, "intensity");
scene.add(ambLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0);
const dirLightFolder = gui.addFolder("Dir light");
dirLightFolder.add(dirLight, "intensity");
dirLightFolder.add(dirLight.position, "x");
dirLightFolder.add(dirLight.position, "y");
dirLightFolder.add(dirLight.position, "z");
dirLight.position.set(-4, 2, 4);
dirLight.castShadow = true;
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xffffff, 5);
pointLight.position.x = -6;
pointLight.position.y = 1;
pointLight.position.z = 0;
const poiLightFolder = gui.addFolder("Point light");
poiLightFolder.add(pointLight, "intensity");
poiLightFolder.add(pointLight.position, "x");
poiLightFolder.add(pointLight.position, "y");
poiLightFolder.add(pointLight.position, "z");
scene.add(pointLight);

const objList = [];
let surfaceFront;
// gltfLoader.load("./mug_v0.2.gltf", (gltf) => {
  // gltfLoader.load("./tshirt.gltf", (gltf) => {
  gltfLoader.load("https://3d-mode-trial.s3.ap-southeast-2.amazonaws.com/tshirt.gltf", (gltf) => {
  const group = gltf.scene.children[0];
  console.log(group);
  const targetObjs = group.children.filter((d) =>
    ["main", "surface_front", "surface_back"].includes(d.name)
  );
  surfaceFront = targetObjs.find((d) => d.name === "surface_front");
  const surfaceBack = targetObjs.find((d) => d.name === "surface_back");
  textureLoader.load("./dw.jpg", (t) => {
    surfaceFront.material.map = t;
    surfaceBack.material.map = t;
  });
  for (const o of targetObjs) {
    o.castShadow = true;
    o.material.roughness = 0.8;
  }
  meshFolder.add(group.rotation, "x");
  meshFolder.add(group.rotation, "y");
  meshFolder.add(group.rotation, "z");
  scene.add(group);
  objList.push(group);
  console.log(group);
});

const camera = new THREE.PerspectiveCamera(
  65, // FOV
  window.innerWidth / (window.innerHeight - inputAreaHeight), // Aspect ratio
  0.1, // near
  1000 // far
);
camera.position.set(-2, 1, 3);

const canvas = document.querySelector("#glCanvas");
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas,
  alpha: true,
});
// renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3.5;
const controls = new OrbitControls(camera, renderer.domElement);
const changeHandler = () => {
  console.log('foo');
  controls.removeEventListener('change', changeHandler);
}
controls.addEventListener('change', changeHandler);

controls.maxAzimuthAngle = 0;
renderer.setSize(window.innerWidth, window.innerHeight - inputAreaHeight);

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
  for (const c of objList) {
    // c.rotation.z += 0.01;
  }
  resizeRendererToDisplaySize(renderer, camera);
  renderer.render(scene, camera);
}

animate();

const imageUrlInput = document.querySelector("#imageUrl");
const submitButton = document.querySelector("#submitButton");

submitButton.addEventListener("click", () => {
  textureLoader.load(imageUrlInput.value, (t) => {
    surfaceFront.material.map = t;
  });
});
