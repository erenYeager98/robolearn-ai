import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const ThreeBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let animationFrameId; // To store the requestAnimationFrame ID

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // --- OPTIMIZATION 1: Renderer Settings ---
    // Disable antialiasing and cap the pixel ratio for significant performance gain.
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Cap at 1 for low-power devices
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // --- OPTIMIZATION 2: Reduced Particle Count ---
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200; // Reduced from 800
    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);

    const colors = [
      new THREE.Color(0x522b5b),
      new THREE.Color(0x7c3aed),
      new THREE.Color(0xa855f7),
      new THREE.Color(0xc084fc),
      new THREE.Color(0xe879f9),
    ];

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 20;
      posArray[i + 1] = (Math.random() - 0.5) * 20;
      posArray[i + 2] = (Math.random() - 0.5) * 20;

      const color = colors[Math.floor(Math.random() * colors.length)];
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02, // Slightly larger to compensate for fewer particles
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.NormalBlending, // NormalBlending is cheaper than AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- OPTIMIZATION 3: Simplified Geometries ---
    // Drastically reduced segment counts (the last arguments) for lower polygon count.
    const geometries = [
      new THREE.SphereGeometry(0.15, 8, 8),     // Reduced from 32x32
      new THREE.BoxGeometry(0.15, 0.15, 0.15),
      new THREE.ConeGeometry(0.12, 0.25, 8),    // Reduced from 32
      new THREE.OctahedronGeometry(0.12),
      new THREE.TetrahedronGeometry(0.15),
    ];

    // --- OPTIMIZATION 4: Basic Materials & No Lighting ---
    // Switched MeshPhongMaterial to MeshBasicMaterial.
    // MeshBasicMaterial does not react to light, making it extremely fast.
    // This allows us to remove ALL light sources from the scene.
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0x522b5b, transparent: true, opacity: 0.6 }),
      new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.6 }),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.6 }),
      new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.6 }),
      new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.6 })
    ];

    // --- OPTIMIZATION 5: Reduced Object Count ---
    const meshes = [];
    for (let i = 0; i < 15; i++) { // Reduced from 30
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
      
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      scene.add(mesh);
      meshes.push(mesh);
    }
    
    // All lights have been removed as MeshBasicMaterial does not use them.

    camera.position.z = 8;

    // --- OPTIMIZATION 6: Simplified Animation ---
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      particlesMesh.rotation.y += 0.0005;

      meshes.forEach((mesh, index) => {
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.005;
        // Simplified movement, less computationally intensive Math.sin/cos per frame.
        mesh.position.y += Math.sin(elapsedTime * 0.2 + index) * 0.001;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Capping pixel ratio again on resize
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of Three.js objects to free up memory
      scene.traverse(object => {
        if (object.isMesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
             if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
             } else {
                object.material.dispose();
             }
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 -z-10"
      // --- OPTIMIZATION 7: Simplified CSS Background ---
      // A simple linear gradient is less demanding than multiple radial gradients.
      style={{ 
        background: `linear-gradient(135deg, #2d1b3d 0%, #0f0f1a 100%)`
      }}
    />
  );
};