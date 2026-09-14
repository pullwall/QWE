import * as THREE from 'three';

function roundedCuboid(width, height, depth, radius, bevel = 5) {
  const x = width / 2;
  const z = depth / 2;
  const r = Math.min(radius, x * 0.48, z * 0.48);
  const shape = new THREE.Shape();
  shape.moveTo(-x + r, -z);
  shape.lineTo(x - r, -z);
  shape.quadraticCurveTo(x, -z, x, -z + r);
  shape.lineTo(x, z - r);
  shape.quadraticCurveTo(x, z, x - r, z);
  shape.lineTo(-x + r, z);
  shape.quadraticCurveTo(-x, z, -x, z - r);
  shape.lineTo(-x, -z + r);
  shape.quadraticCurveTo(-x, -z, -x + r, -z);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, height - radius * 0.65),
    bevelEnabled: true,
    bevelSegments: bevel,
    steps: 1,
    bevelSize: radius * 0.38,
    bevelThickness: radius * 0.32,
    curveSegments: 10,
  });
  geometry.center();
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function keycapGeometry(width, height, depth, radius) {
  const geometry = roundedCuboid(width, height, depth, radius, 8);
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const position = geometry.attributes.position;
  const span = Math.max(.001, max.y - min.y);

  for (let index = 0; index < position.count; index += 1) {
    const t = THREE.MathUtils.clamp((position.getY(index) - min.y) / span, 0, 1);
    const eased = t * t * (3 - 2 * t);
    const horizontalScale = THREE.MathUtils.lerp(1.07, .76, eased);
    position.setX(index, position.getX(index) * horizontalScale);
    position.setZ(index, position.getZ(index) * horizontalScale);
  }

  position.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  return geometry;
}

function reflectionTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 1024, 512);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(.22, '#ffdbe8');
  gradient.addColorStop(.48, '#f5fbff');
  gradient.addColorStop(.72, '#b9f2e3');
  gradient.addColorStop(1, '#e4edff');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 512);
  context.fillStyle = 'rgba(255,255,255,.92)';
  context.fillRect(55, 45, 220, 330);
  context.fillStyle = 'rgba(255,255,255,.72)';
  context.fillRect(710, 25, 85, 400);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSwitchScene(canvas, handlers = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .96;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.environment = reflectionTexture();
  const camera = new THREE.PerspectiveCamera(27, 2.4, .1, 40);
  camera.position.set(0, 5.2, 9.4);
  camera.lookAt(0, .62, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xa9b8c8, 1.65));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.35);
  keyLight.position.set(-4, 7, 5);
  scene.add(keyLight);
  const pinkLight = new THREE.PointLight(0xff7da8, 3.2, 14);
  pinkLight.position.set(-4, 3, 3);
  scene.add(pinkLight);
  const mintLight = new THREE.PointLight(0x69ddd0, 2.8, 14);
  mintLight.position.set(4, 2.5, 2);
  scene.add(mintLight);

  const world = new THREE.Group();
  world.rotation.x = -.03;
  scene.add(world);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xf4fbff,
    metalness: 0,
    roughness: .08,
    transmission: .94,
    thickness: .72,
    ior: 1.46,
    attenuationColor: new THREE.Color(0xdcecff),
    attenuationDistance: 2.7,
    clearcoat: 1,
    clearcoatRoughness: .06,
    transparent: true,
    opacity: .84,
    envMapIntensity: 1.65,
    side: THREE.DoubleSide,
  });
  const innerGlass = glass.clone();
  innerGlass.opacity = .58;
  innerGlass.roughness = .16;
  innerGlass.attenuationColor.set(0xffffff);
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8c7d5, metalness: .9, roughness: .2, envMapIntensity: 1.5 });
  const stemMaterial = new THREE.MeshPhysicalMaterial({ color: 0xfffefe, roughness: .24, clearcoat: .72, clearcoatRoughness: .12 });

  const base = new THREE.Mesh(roundedCuboid(6.25, .34, 2.12, .24, 7), glass.clone());
  base.position.y = .09;
  world.add(base);
  const lowerBase = new THREE.Mesh(roundedCuboid(6.05, .17, 1.93, .2, 6), innerGlass);
  lowerBase.position.y = -.08;
  world.add(lowerBase);

  const capMaterials = {};
  const keyStates = {};
  const pickMeshes = [];
  const initial = { Q: '#ff8fb1', W: '#73dedb', E: '#ffd267' };

  ['Q', 'W', 'E'].forEach((key, index) => {
    const root = new THREE.Group();
    root.position.x = (index - 1) * 2.02;
    world.add(root);

    const housingMaterial = glass.clone();
    housingMaterial.attenuationColor = new THREE.Color(index === 1 ? 0xffe7ef : index === 2 ? 0xd7fff3 : 0xf7fbff);
    const housing = new THREE.Mesh(roundedCuboid(1.73, .78, 1.73, .19, 6), housingMaterial);
    housing.position.y = .42;
    root.add(housing);

    const innerPlate = new THREE.Mesh(roundedCuboid(1.34, .14, 1.34, .1, 4), innerGlass.clone());
    innerPlate.position.y = .58;
    root.add(innerPlate);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.25, .31, .72, 20), stemMaterial.clone());
    stem.position.y = .92;
    root.add(stem);

    for (let loop = 0; loop < 3; loop += 1) {
      const spring = new THREE.Mesh(new THREE.TorusGeometry(.29, .035, 8, 28), metal);
      spring.rotation.x = Math.PI / 2;
      spring.position.y = .48 + loop * .12;
      root.add(spring);
    }

    const capPivot = new THREE.Group();
    root.add(capPivot);
    const capMaterial = new THREE.MeshPhysicalMaterial({
      color: initial[key],
      roughness: .24,
      metalness: 0,
      clearcoat: .5,
      clearcoatRoughness: .16,
      sheen: .08,
      sheenColor: new THREE.Color(0xffffff),
      envMapIntensity: .92,
    });
    capMaterials[key] = capMaterial;
    const cap = new THREE.Mesh(keycapGeometry(1.58, .86, 1.58, .2), capMaterial);
    cap.position.y = 1.39;
    cap.scale.set(.98, 1, .93);
    cap.userData.key = key;
    capPivot.add(cap);
    pickMeshes.push(cap);

    keyStates[key] = { pivot: capPivot, target: 0 };
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let activeKey = null;
  let disposed = false;
  let lastTime = performance.now();

  function hitTest(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(pickMeshes, false)[0]?.object.userData.key || null;
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const key = hitTest(event);
    if (key) {
      activeKey = key;
      canvas.setPointerCapture(event.pointerId);
      handlers.onPress?.(key);
    } else {
      handlers.onDrag?.();
    }
  });
  const finishPointer = () => {
    if (activeKey) handlers.onRelease?.(activeKey);
    activeKey = null;
  };
  canvas.addEventListener('pointerup', finishPointer);
  canvas.addEventListener('pointercancel', finishPointer);
  canvas.addEventListener('lostpointercapture', finishPointer);
  canvas.addEventListener('pointermove', (event) => {
    if (!activeKey) canvas.style.cursor = hitTest(event) ? 'pointer' : 'grab';
    const rect = canvas.getBoundingClientRect();
    world.rotation.y = THREE.MathUtils.lerp(world.rotation.y, ((event.clientX - rect.left) / rect.width - .5) * .055, .12);
  });
  canvas.addEventListener('pointerleave', () => { world.rotation.y = 0; });

  const resize = new ResizeObserver(() => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resize.observe(canvas);

  function animate(now) {
    if (disposed) return;
    const dt = Math.min(.034, Math.max(.001, (now - lastTime) / 1000));
    lastTime = now;
    Object.values(keyStates).forEach((state) => {
      const current = state.pivot.position.y;
      const response = state.target < current ? 44 : 28;
      state.pivot.position.y = THREE.MathUtils.damp(current, state.target, response, dt);
      if (Math.abs(state.target - state.pivot.position.y) < .0005) {
        state.pivot.position.y = state.target;
      }
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  return {
    setPressed(key, isPressed) {
      if (!keyStates[key]) return;
      keyStates[key].target = isPressed ? -.32 : 0;
    },
    setColors(colors) {
      ['Q', 'W', 'E'].forEach((key, index) => capMaterials[key].color.set(colors[index]));
    },
    dispose() {
      disposed = true;
      resize.disconnect();
      renderer.dispose();
      scene.environment?.dispose();
    },
  };
}
