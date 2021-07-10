import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function createCubeMesh(x, color) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({ color });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = x;
  return cube;
}

const scene = new THREE.Scene();
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(4, 2, 4);
const cubes = [];
cubes.push(createCubeMesh(-2, 0x3333bb));
cubes.push(createCubeMesh(0, 0x33bb33));
cubes.push(createCubeMesh(2, 0xbb3333));
for (const c of cubes) {
  scene.add(c);
}
scene.add(light);

const camera = new THREE.PerspectiveCamera(
  75, // FOV
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // near
  1000 // far
);
camera.position.z = 5;

const canvas = document.querySelector("#glCanvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const controls = new OrbitControls(camera, renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function resizeRendererToDisplaySize(renderer, camera) {
  const { clientWidth: bW, clientHeight: bH } = document.body;
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
  for (const c of cubes) {
    c.rotation.z += 0.01;
  }
  resizeRendererToDisplaySize(renderer, camera);
  renderer.render(scene, camera);
}

animate();
