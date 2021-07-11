import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const inputAreaHeight = 180;

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
function createCubeLineSegs(x, color) {
  const geometry = new THREE.WireframeGeometry(new THREE.BoxGeometry(1, 1, 1));
  const material = new THREE.LineBasicMaterial({ color });
  const cube = new THREE.LineSegments(geometry, material);
  cube.position.x = x;
  cube.position.z = -2;
  return cube;
}

function createCubeMesh(x, color) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({
    color,
    map: textureLoader.load("./github.png"),
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = x;
  return cube;
}

function createSphereSegs(x, y, size, color) {
  const geometry = new THREE.WireframeGeometry(
    new THREE.SphereGeometry(size, 8, 8)
  );
  const material = new THREE.LineBasicMaterial({ color });
  const sphere = new THREE.LineSegments(geometry, material);
  sphere.position.x = x;
  sphere.position.y = y;
  return sphere;
}

const scene = new THREE.Scene();
const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(4, 2, 4);
scene.add(dirLight);
const objList = [];
let mugTexture;
gltfLoader.load(
  "./mug.gltf",

  (gltf) => {
    const targetObjs = gltf.scene.children.filter((d) =>
      ["mug_main", "mug_texture"].includes(d.name)
    );
    mugTexture = targetObjs.find((d) => d.name === "mug_texture");
    textureLoader.load("./github.png", (t) => {
      mugTexture.material.map = t;
    });
    for (const o of targetObjs) {
      scene.add(o);
      objList.push(o);
      // TODO: update the model
      o.scale.x *= 5;
      o.scale.y *= 5;
      o.scale.z *= 5;
    }
    scene.add(gltf.scene.children[0]);
  }
);

const camera = new THREE.PerspectiveCamera(
  75, // FOV
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // near
  1000 // far
);
camera.position.z = 8;

const canvas = document.querySelector("#glCanvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const controls = new OrbitControls(camera, renderer.domElement);
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
  console.log('?')
  textureLoader.load(imageUrlInput.value, (t) => {
    mugTexture.material.map = t;
  });
});
