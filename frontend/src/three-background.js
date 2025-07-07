// src/three-background.js
import * as THREE from 'three';

let animationId;

export function initThreeBackground() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Add some floating shapes
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({ color: 0x66ccff, roughness: 0.2, metalness: 0.6 });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  const light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(5, 5, 5);
  scene.add(light);

  camera.position.z = 4;

  function animate() {
    animationId = requestAnimationFrame(animate);
    sphere.rotation.x += 0.005;
    sphere.rotation.y += 0.01;
    renderer.render(scene, camera);
  }

  animate();

  // Resize handling
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function cleanupThreeBackground() {
  cancelAnimationFrame(animationId);
  const canvas = document.getElementById('three-canvas');
  if (canvas) {
    const context = canvas.getContext('webgl');
    if (context) context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
  }
}
