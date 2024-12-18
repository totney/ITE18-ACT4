import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

// Scene Setup ni
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffcc99); // Para sa warm desert tone
scene.fog = new THREE.Fog(0xffcc99, 20, 150); // Desert fog para nindot

// Renderer Setup ni diri
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Camera Setup ni diri
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 40);
scene.add(camera);

// Orbit Controls ni
const controls = new OrbitControls(camera, renderer.domElement);

// Sunlight
const sunLight = new THREE.PointLight(0xffaa00, 4, 200);
sunLight.position.set(20, 50, 20);
scene.add(sunLight);

// Ground geometry (Sand dunes kibali)
const groundGeometry = new THREE.PlaneGeometry(200, 200, 300, 300);
groundGeometry.rotateX(-Math.PI / 2);

// Ground shader ni diri bai
const groundMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        duneHeight: { value: 2.0 },
        duneFrequency: { value: 0.3 },
        sandColor: { value: new THREE.Color(0xf4a460) }, // Sand color
        sunPosition: { value: new THREE.Vector3(20, 50, 20) },
    },
    vertexShader: `
        uniform float time;
        uniform float duneHeight;
        uniform float duneFrequency;
        varying vec2 vUv;

        void main() {
            vUv = uv;
            vec3 pos = position;

            // Create rolling sand dunes
            pos.y += sin(pos.x * duneFrequency + time) * duneHeight * 0.7;
            pos.y += cos(pos.z * duneFrequency * 1.5 + time) * duneHeight * 0.5;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 sandColor;
        uniform vec3 sunPosition;
        varying vec2 vUv;

        void main() {
            float brightness = dot(normalize(sunPosition), vec3(0, 1, 0)) * 0.5 + 0.5; // Simulated sunlight
            vec3 finalColor = sandColor * brightness;
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
    side: THREE.DoubleSide,
});

// Add sa ground mesh
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
scene.add(ground);

// Load sa cactus model
const loader = new GLTFLoader();
let cactus = null;

loader.load(
    'https://trystan211.github.io/ite18_act4_n/cactus_1_downloadable.glb', 
    (gltf) => {
        cactus = gltf.scene;
        cactus.position.set(0, 0, 0);
        cactus.scale.set(2, 2, 2);
        scene.add(cactus);
    },
    undefined,
    (error) => {
        console.error("Error loading the cactus model:", error);
    }
);

// Sandstorm geometry ni diri
const sandCount = 10000;
const sandGeometry = new THREE.BufferGeometry();
const sandPositions = [];
const sandVelocities = [];

for (let i = 0; i < sandCount; i++) {
    const x = (Math.random() - 0.5) * 200;
    const y = Math.random() * 50;
    const z = (Math.random() - 0.5) * 200;
    sandPositions.push(x, y, z);
    sandVelocities.push(-0.1 - Math.random() * 0.3); // Sandstorm movement para murag nag dagan
}

sandGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sandPositions, 3));

// Sandstorm material ni diri
const sandMaterial = new THREE.PointsMaterial({
    color: 0xd2b48c, // Sandy color ni na code
    size: 0.4,
    transparent: true,
    opacity: 0.7,
});

// Pag add sa sandstorm particles ni
const sandstorm = new THREE.Points(sandGeometry, sandMaterial);
scene.add(sandstorm);

// Animation na loop
const clock = new THREE.Clock();
function animate() {
    const elapsedTime = clock.getElapsedTime();

    // Update sa ground
    groundMaterial.uniforms.time.value = elapsedTime;

    // Update sa sandstorm
    const positions = sandstorm.geometry.attributes.position.array;
    for (let i = 0; i < sandCount; i++) {
        positions[i * 3 + 1] += sandVelocities[i]; // Y-axis na lihok para sa falling effect
        if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 50; // Reset sa sand particle
        }
    }
    sandstorm.geometry.attributes.position.needsUpdate = true;

    // Moving sunlight ni (kanang bright orange)
    sunLight.position.set(
        20 * Math.sin(elapsedTime * 0.2),
        50,
        20 * Math.cos(elapsedTime * 0.2)
    );

    // Para mu sway ang cactus 
    if (cactus) {
    cactus.rotation.z = Math.sin(elapsedTime * 0.5) * 0.08; // Increased frequency (0.5) og ang amplitude (0.5)
}

    // Render sa scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();


window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});