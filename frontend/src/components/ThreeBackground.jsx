import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const ThreeBackground = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create enhanced particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 800;
    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);

    // Purple color palette
    const colors = [
      new THREE.Color(0x522b5b), // Main dark purple
      new THREE.Color(0x7c3aed), // Bright purple
      new THREE.Color(0xa855f7), // Light purple
      new THREE.Color(0xc084fc), // Lavender
      new THREE.Color(0xe879f9), // Pink purple
    ];

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Position
      posArray[i] = (Math.random() - 0.5) * 20;
      posArray[i + 1] = (Math.random() - 0.5) * 20;
      posArray[i + 2] = (Math.random() - 0.5) * 20;

      // Color
      const color = colors[Math.floor(Math.random() * colors.length)];
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.008,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Create floating geometric shapes with enhanced materials
    const geometries = [
      new THREE.SphereGeometry(0.15, 32, 32),
      new THREE.BoxGeometry(0.15, 0.15, 0.15),
      new THREE.ConeGeometry(0.12, 0.25, 32),
      new THREE.OctahedronGeometry(0.12),
      new THREE.TetrahedronGeometry(0.15),
    ];

    const materials = [
      new THREE.MeshPhongMaterial({ 
        color: 0x522b5b, 
        transparent: true, 
        opacity: 0.4,
        shininess: 100,
        emissive: 0x1a0a1d
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0x7c3aed, 
        transparent: true, 
        opacity: 0.4,
        shininess: 100,
        emissive: 0x2d1b69
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0xa855f7, 
        transparent: true, 
        opacity: 0.4,
        shininess: 100,
        emissive: 0x3730a3
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0xc084fc, 
        transparent: true, 
        opacity: 0.4,
        shininess: 100,
        emissive: 0x4338ca
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0xe879f9, 
        transparent: true, 
        opacity: 0.4,
        shininess: 100,
        emissive: 0x5b21b6
      })
    ];

    const meshes = [];
    
    for (let i = 0; i < 30; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.x = (Math.random() - 0.5) * 15;
      mesh.position.y = (Math.random() - 0.5) * 15;
      mesh.position.z = (Math.random() - 0.5) * 15;
      
      // Random rotation
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;
      
      scene.add(mesh);
      meshes.push(mesh);
    }

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x522b5b, 0.4);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x7c3aed, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xa855f7, 0.6);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Add point lights for more dynamic lighting
    const pointLight1 = new THREE.PointLight(0xe879f9, 1, 10);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xc084fc, 1, 10);
    pointLight2.position.set(-3, -3, -3);
    scene.add(pointLight2);

    // Create floating rings/torus
    const torusGeometry = new THREE.TorusGeometry(0.3, 0.05, 16, 100);
    const torusMaterial = new THREE.MeshPhongMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.3,
      emissive: 0x2d1b69
    });

    const toruses = [];
    for (let i = 0; i < 8; i++) {
      const torus = new THREE.Mesh(torusGeometry, torusMaterial);
      torus.position.x = (Math.random() - 0.5) * 12;
      torus.position.y = (Math.random() - 0.5) * 12;
      torus.position.z = (Math.random() - 0.5) * 12;
      torus.rotation.x = Math.random() * Math.PI;
      torus.rotation.y = Math.random() * Math.PI;
      scene.add(torus);
      toruses.push(torus);
    }

    camera.position.z = 8;

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Enhanced animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Rotate particles with different speeds
      particlesMesh.rotation.y += 0.0008;
      particlesMesh.rotation.x += 0.0004;

      // Animate floating shapes with more complex movements
      meshes.forEach((mesh, index) => {
        mesh.rotation.x += 0.008 + (index % 3) * 0.002;
        mesh.rotation.y += 0.012 + (index % 4) * 0.001;
        mesh.rotation.z += 0.006 + (index % 2) * 0.003;
        
        // Floating motion
        mesh.position.y += Math.sin(time * 0.5 + index) * 0.002;
        mesh.position.x += Math.cos(time * 0.3 + index) * 0.001;
      });

      // Animate torus rings
      toruses.forEach((torus, index) => {
        torus.rotation.x += 0.01 + (index % 2) * 0.005;
        torus.rotation.y += 0.015 + (index % 3) * 0.003;
        torus.position.y += Math.sin(time * 0.8 + index * 2) * 0.003;
      });

      // Animate point lights
      pointLight1.position.x = Math.sin(time * 0.5) * 4;
      pointLight1.position.z = Math.cos(time * 0.5) * 4;
      pointLight2.position.x = Math.cos(time * 0.3) * 4;
      pointLight2.position.z = Math.sin(time * 0.3) * 4;

      renderer.render(scene, camera);
    };

    animate();

    // Enhanced scroll handling
    const handleScroll = () => {
      

      const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      const scrollPercent = scrollY / Math.max(documentHeight - windowHeight, 1);
      
      if (cameraRef.current) {
        cameraRef.current.position.y = scrollY * 0.002;
        cameraRef.current.rotation.x = scrollPercent * 0.1;
      }
      
      // Rotate entire scene slightly on scroll
      if (sceneRef.current) {
        sceneRef.current.rotation.y = scrollPercent * 0.2;
      }

    };

    // Add scroll listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: false });


    // Handle resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);

      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 -z-10"
      style={{ 
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 58, 237, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(192, 132, 252, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, #522b5b 0%, #3c1a42 25%, #2d1b3d 50%, #1e1b2e 75%, #0f0f1a 100%)
        `
      }}
    />
  );
};