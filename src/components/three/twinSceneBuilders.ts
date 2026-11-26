import * as THREE from 'three';
import { TwinComponentId } from '../../data/digitalTwinCatalog';

export interface TwinSceneRefs {
  rootGroup: THREE.Group;
  hitTargets: THREE.Object3D[];
  primaryFillMesh: THREE.Mesh;
  primaryFillMat: THREE.MeshStandardMaterial;
  primaryShellMesh: THREE.Mesh;
  secondaryFillMesh: THREE.Mesh;
  secondaryFillMat: THREE.MeshStandardMaterial;
  secondaryShellMesh: THREE.Mesh;
  reserveFillMesh: THREE.Mesh;
  reserveFillMat: THREE.MeshStandardMaterial;
  reserveShellMesh: THREE.Mesh;
  valveLedMats: {
    primary: THREE.MeshStandardMaterial;
    secondary: THREE.MeshStandardMaterial;
    reserve: THREE.MeshStandardMaterial;
  };
  relayLedMats: {
    primary: THREE.MeshStandardMaterial;
    secondary: THREE.MeshStandardMaterial;
    reserve: THREE.MeshStandardMaterial;
  };
  pipeMats: {
    primary: THREE.MeshStandardMaterial;
    secondary: THREE.MeshStandardMaterial;
    manifold: THREE.MeshStandardMaterial;
    bleed: THREE.MeshStandardMaterial;
    reserve: THREE.MeshStandardMaterial;
    delivery: THREE.MeshStandardMaterial;
  };
  curves: {
    primary: THREE.CatmullRomCurve3;
    secondary: THREE.CatmullRomCurve3;
    reserve: THREE.CatmullRomCurve3;
    bleed: THREE.CatmullRomCurve3;
  };
  lcdCanvas: HTMLCanvasElement;
  lcdCtx: CanvasRenderingContext2D;
  lcdTexture: THREE.CanvasTexture;
  buzzerRingMat: THREE.MeshBasicMaterial;
  buzzerRingMesh: THREE.Mesh;
  lungLeft: THREE.Mesh;
  lungRight: THREE.Mesh;
  lungMat: THREE.MeshStandardMaterial;
  pulseRingMesh: THREE.Mesh;
  pulseRingMat: THREE.MeshBasicMaterial;
  explodableParts: Array<{
    object: THREE.Object3D;
    basePos: THREE.Vector3;
    explodeOffset: THREE.Vector3;
  }>;
}

function tagGroup(group: THREE.Object3D, componentId: TwinComponentId, hitTargets: THREE.Object3D[]) {
  group.userData.componentId = componentId;
  group.traverse((child) => {
    child.userData.componentId = componentId;
  });
  hitTargets.push(group);
}

function createTubeFromPoints(
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material
): { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3 } {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.12);
  const geo = new THREE.TubeGeometry(curve, 36, radius, 12, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return { mesh, curve };
}

function buildCylinderAssembly(
  componentId: 'primary_cylinder' | 'secondary_cylinder',
  position: THREE.Vector3,
  accentColor: number,
  hitTargets: THREE.Object3D[]
): {
  group: THREE.Group;
  fillMesh: THREE.Mesh;
  fillMat: THREE.MeshStandardMaterial;
  shellMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.position.copy(position);

  // Pedestal collar
  const baseRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.72, 0.14, 32),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.35 })
  );
  baseRing.position.y = 0.07;
  baseRing.receiveShadow = true;
  group.add(baseRing);

  // Inner dynamic oxygen fill column
  const fillMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.2
  });
  const fillGeo = new THREE.CylinderGeometry(0.46, 0.46, 1.95, 28);
  // Shift pivot to bottom so scale.y grows upward cleanly
  fillGeo.translate(0, 0.975, 0);
  const fillMesh = new THREE.Mesh(fillGeo, fillMat);
  fillMesh.position.y = 0.16;
  group.add(fillMesh);

  // Outer translucent brushed aluminum medical tank cutaway shell
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0xcbd5e1,
    metalness: 0.25,
    roughness: 0.15,
    transparent: true,
    opacity: 0.32,
    transmission: 0.4,
    depthWrite: false
  });
  const shellMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 2.05, 32), shellMat);
  shellMesh.position.y = 1.18;
  group.add(shellMesh);

  // Dome shoulder
  const domeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.28 })
  );
  domeMesh.position.y = 2.2;
  group.add(domeMesh);

  // Brass neck valve & analog gauge housing
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.36, 20), brassMat);
  neck.position.y = 2.86;
  group.add(neck);

  const handwheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.04, 10, 24),
    new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.4, roughness: 0.4 })
  );
  handwheel.rotation.x = Math.PI / 2;
  handwheel.position.y = 3.06;
  group.add(handwheel);

  // Honeywell piezoresistive pressure transducer box mounted at side port
  const sensorBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.32, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.35 })
  );
  sensorBody.position.set(0.6, 1.05, 0);
  group.add(sensorBody);

  const sensorLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 12),
    new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.9 })
  );
  sensorLed.position.set(0.74, 1.12, 0);
  group.add(sensorLed);

  tagGroup(group, componentId, hitTargets);
  return { group, fillMesh, fillMat, shellMesh };
}

function buildSolenoidValve(position: THREE.Vector3, bodyTint: number): {
  group: THREE.Group;
  ledMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  group.position.copy(position);

  const brassMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.82, roughness: 0.28 });
  const valveBlock = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.38), brassMat);
  valveBlock.castShadow = true;
  group.add(valveBlock);

  const coilMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.42, 20),
    new THREE.MeshStandardMaterial({ color: bodyTint, metalness: 0.45, roughness: 0.35 })
  );
  coilMesh.position.y = 0.35;
  group.add(coilMesh);

  const ledMat = new THREE.MeshStandardMaterial({
    color: bodyTint,
    emissive: bodyTint,
    emissiveIntensity: 0.8
  });
  const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 10, 24), ledMat);
  ledRing.rotation.x = Math.PI / 2;
  ledRing.position.y = 0.56;
  group.add(ledRing);

  return { group, ledMat };
}

export function buildOxySyncRig(): TwinSceneRefs {
  const rootGroup = new THREE.Group();
  const hitTargets: THREE.Object3D[] = [];
  const explodableParts: TwinSceneRefs['explodableParts'] = [];

  // 1. Dark Anodized Medical Exhibition Chassis Base
  const basePlate = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.24, 5.8),
    new THREE.MeshStandardMaterial({ color: 0x0b1222, metalness: 0.65, roughness: 0.45 })
  );
  basePlate.position.set(0.2, -0.12, 0.1);
  basePlate.receiveShadow = true;
  rootGroup.add(basePlate);

  const gridHelper = new THREE.GridHelper(10.0, 20, 0x0ea5e9, 0x162238);
  gridHelper.position.set(0.2, 0.005, 0.1);
  rootGroup.add(gridHelper);

  // 2. Primary & Secondary Oxygen Cylinders
  const primary = buildCylinderAssembly(
    'primary_cylinder',
    new THREE.Vector3(-3.3, 0, -1.2),
    0x06b6d4,
    hitTargets
  );
  rootGroup.add(primary.group);
  explodableParts.push({
    object: primary.shellMesh,
    basePos: primary.shellMesh.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.85, 0)
  });

  const secondary = buildCylinderAssembly(
    'secondary_cylinder',
    new THREE.Vector3(-3.3, 0, 1.4),
    0x14b8a6,
    hitTargets
  );
  rootGroup.add(secondary.group);
  explodableParts.push({
    object: secondary.shellMesh,
    basePos: secondary.shellMesh.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.85, 0)
  });

  // 3. 3-Channel Latching Solenoid Bank (V-1, V-2, VR)
  const solenoidGroup = new THREE.Group();
  const v1 = buildSolenoidValve(new THREE.Vector3(-1.45, 1.05, -1.2), 0x06b6d4);
  const v2 = buildSolenoidValve(new THREE.Vector3(-1.45, 1.05, 1.4), 0x14b8a6);
  const vr = buildSolenoidValve(new THREE.Vector3(1.15, 1.05, -0.95), 0xf59e0b);
  solenoidGroup.add(v1.group, v2.group, vr.group);
  tagGroup(solenoidGroup, 'solenoid_bank', hitTargets);
  rootGroup.add(solenoidGroup);
  explodableParts.push({
    object: solenoidGroup,
    basePos: solenoidGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.55, 0)
  });

  // 4. 6061-T6 Manifold, 3.5 Bar Regulator & Mass Flow Controller
  const manifoldGroup = new THREE.Group();
  const aluminumMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });

  const manifoldBlock = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.62, 0.9), aluminumMat);
  manifoldBlock.position.set(-0.2, 1.05, 0.1);
  manifoldBlock.castShadow = true;
  manifoldGroup.add(manifoldBlock);

  const regulatorBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.45, 24),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.65, roughness: 0.28 })
  );
  regulatorBody.position.set(0.68, 1.08, 0.1);
  manifoldGroup.add(regulatorBody);

  const regGauge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  regGauge.position.set(0.68, 1.35, 0.1);
  manifoldGroup.add(regGauge);

  // Sensirion-style Mass Flow Controller
  const mfcBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.48, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x065f46, metalness: 0.5, roughness: 0.35 })
  );
  mfcBody.position.set(1.75, 1.05, 0.1);
  manifoldGroup.add(mfcBody);

  const mfcScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.22),
    new THREE.MeshBasicMaterial({ color: 0x34d399 })
  );
  mfcScreen.position.set(1.75, 1.3, 0.1);
  mfcScreen.rotation.x = -Math.PI / 2;
  manifoldGroup.add(mfcScreen);

  tagGroup(manifoldGroup, 'manifold_regulator', hitTargets);
  rootGroup.add(manifoldGroup);

  // 5. 5-Minute Reserve Buffer Accumulator Vessel (Back-Center)
  const reserveGroup = new THREE.Group();
  reserveGroup.position.set(0.55, 0, -1.75);

  const reservePedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.64, 0.68, 0.14, 28),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.35 })
  );
  reservePedestal.position.y = 0.07;
  reserveGroup.add(reservePedestal);

  const reserveFillMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.25
  });
  const reserveFillGeo = new THREE.CylinderGeometry(0.44, 0.44, 1.4, 28);
  reserveFillGeo.translate(0, 0.7, 0);
  const reserveFillMesh = new THREE.Mesh(reserveFillGeo, reserveFillMat);
  reserveFillMesh.position.y = 0.16;
  reserveGroup.add(reserveFillMesh);

  const reserveShellMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.54, 1.5, 28),
    new THREE.MeshPhysicalMaterial({
      color: 0xfde68a,
      metalness: 0.2,
      roughness: 0.15,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    })
  );
  reserveShellMesh.position.y = 0.92;
  reserveGroup.add(reserveShellMesh);

  const reserveCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.54, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.75, roughness: 0.3 })
  );
  reserveCap.position.y = 1.67;
  reserveGroup.add(reserveCap);

  tagGroup(reserveGroup, 'reserve_buffer', hitTargets);
  rootGroup.add(reserveGroup);
  explodableParts.push({
    object: reserveShellMesh,
    basePos: reserveShellMesh.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.75, 0)
  });

  // 6. Piping Network + Flow Splines
  const makePipeMat = (color: number) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.12,
      metalness: 0.5,
      roughness: 0.35
    });

  const pipeMats = {
    primary: makePipeMat(0x1e293b),
    secondary: makePipeMat(0x1e293b),
    manifold: makePipeMat(0x1e293b),
    bleed: makePipeMat(0x1e293b),
    reserve: makePipeMat(0x1e293b),
    delivery: makePipeMat(0x1e293b)
  };

  const primTube = createTubeFromPoints(
    [
      new THREE.Vector3(-2.6, 1.05, -1.2),
      new THREE.Vector3(-1.45, 1.05, -1.2),
      new THREE.Vector3(-0.75, 1.05, -1.2),
      new THREE.Vector3(-0.4, 1.05, -0.2),
      new THREE.Vector3(-0.2, 1.05, 0.1)
    ],
    0.055,
    pipeMats.primary
  );
  rootGroup.add(primTube.mesh);

  const secTube = createTubeFromPoints(
    [
      new THREE.Vector3(-2.6, 1.05, 1.4),
      new THREE.Vector3(-1.45, 1.05, 1.4),
      new THREE.Vector3(-0.75, 1.05, 1.4),
      new THREE.Vector3(-0.4, 1.05, 0.4),
      new THREE.Vector3(-0.2, 1.05, 0.1)
    ],
    0.055,
    pipeMats.secondary
  );
  rootGroup.add(secTube.mesh);

  const manifoldTube = createTubeFromPoints(
    [
      new THREE.Vector3(0.05, 1.05, 0.1),
      new THREE.Vector3(0.68, 1.05, 0.1),
      new THREE.Vector3(1.25, 1.05, 0.1),
      new THREE.Vector3(1.75, 1.05, 0.1)
    ],
    0.06,
    pipeMats.manifold
  );
  rootGroup.add(manifoldTube.mesh);

  const bleedTube = createTubeFromPoints(
    [
      new THREE.Vector3(0.0, 1.05, 0.0),
      new THREE.Vector3(0.15, 1.05, -1.05),
      new THREE.Vector3(0.55, 1.05, -1.3)
    ],
    0.038,
    pipeMats.bleed
  );
  rootGroup.add(bleedTube.mesh);

  const reserveTube = createTubeFromPoints(
    [
      new THREE.Vector3(0.85, 1.05, -1.45),
      new THREE.Vector3(1.15, 1.05, -0.95),
      new THREE.Vector3(1.25, 1.05, 0.1)
    ],
    0.055,
    pipeMats.reserve
  );
  rootGroup.add(reserveTube.mesh);

  const deliveryTube = createTubeFromPoints(
    [
      new THREE.Vector3(2.05, 1.05, 0.1),
      new THREE.Vector3(2.65, 1.05, -0.15),
      new THREE.Vector3(3.15, 1.15, -0.35),
      new THREE.Vector3(3.45, 1.65, -0.35)
    ],
    0.052,
    pipeMats.delivery
  );
  rootGroup.add(deliveryTube.mesh);

  // Curves for animated glowing gas spheres
  const curves = {
    primary: new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.6, 1.05, -1.2),
      new THREE.Vector3(-1.45, 1.05, -1.2),
      new THREE.Vector3(-0.4, 1.05, -0.2),
      new THREE.Vector3(0.68, 1.05, 0.1),
      new THREE.Vector3(1.75, 1.05, 0.1),
      new THREE.Vector3(2.75, 1.08, -0.2),
      new THREE.Vector3(3.45, 1.65, -0.35)
    ]),
    secondary: new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.6, 1.05, 1.4),
      new THREE.Vector3(-1.45, 1.05, 1.4),
      new THREE.Vector3(-0.4, 1.05, 0.4),
      new THREE.Vector3(0.68, 1.05, 0.1),
      new THREE.Vector3(1.75, 1.05, 0.1),
      new THREE.Vector3(2.75, 1.08, -0.2),
      new THREE.Vector3(3.45, 1.65, -0.35)
    ]),
    reserve: new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.85, 1.05, -1.45),
      new THREE.Vector3(1.15, 1.05, -0.95),
      new THREE.Vector3(1.25, 1.05, 0.1),
      new THREE.Vector3(1.75, 1.05, 0.1),
      new THREE.Vector3(2.75, 1.08, -0.2),
      new THREE.Vector3(3.45, 1.65, -0.35)
    ]),
    bleed: bleedTube.curve
  };

  // 7. ESP32 Controller Console + 3-Channel Relay + 16x2 Live LCD + Piezo Buzzer
  const espGroup = new THREE.Group();
  espGroup.position.set(2.05, 0, 1.82);

  // Angled Console Base
  const consoleDeck = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.16, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.4 })
  );
  consoleDeck.position.y = 0.08;
  espGroup.add(consoleDeck);

  // ESP32 PCB
  const espPcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.06, 0.48),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4, metalness: 0.2 })
  );
  espPcb.position.set(-0.65, 0.22, 0.25);
  espGroup.add(espPcb);

  const espRfShield = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.08, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
  );
  espRfShield.position.set(-0.85, 0.28, 0.25);
  espGroup.add(espRfShield);

  // 3-Channel Relay Module beside ESP32
  const relayPcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.06, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.45 })
  );
  relayPcb.position.set(0.65, 0.22, 0.25);
  espGroup.add(relayPcb);

  const relayLedMats = {
    primary: new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.9 }),
    secondary: new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x14b8a6, emissiveIntensity: 0.1 }),
    reserve: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.1 })
  };

  const makeRelayCube = (x: number, mat: THREE.MeshStandardMaterial) => {
    const relayBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.22, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 })
    );
    relayBlue.position.set(x, 0.34, 0.2);
    espGroup.add(relayBlue);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), mat);
    led.position.set(x, 0.28, 0.42);
    espGroup.add(led);
  };
  makeRelayCube(0.37, relayLedMats.primary);
  makeRelayCube(0.65, relayLedMats.secondary);
  makeRelayCube(0.93, relayLedMats.reserve);

  // Piezo Alarm Buzzer (GPIO 25)
  const buzzerBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.18, 20),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 })
  );
  buzzerBody.position.set(-0.95, 0.27, -0.35);
  espGroup.add(buzzerBody);

  const buzzerRingMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const buzzerRingMesh = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.28, 28), buzzerRingMat);
  buzzerRingMesh.rotation.x = -Math.PI / 2;
  buzzerRingMesh.position.set(-0.95, 0.38, -0.35);
  espGroup.add(buzzerRingMesh);

  // Upright Angled 16x2 I2C LCD Screen (CanvasTexture!)
  const lcdCanvas = document.createElement('canvas');
  lcdCanvas.width = 512;
  lcdCanvas.height = 192;
  const lcdCtx = lcdCanvas.getContext('2d')!;
  const lcdTexture = new THREE.CanvasTexture(lcdCanvas);
  lcdTexture.minFilter = THREE.LinearFilter;

  const lcdBezel = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.85, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.45, roughness: 0.35 })
  );
  lcdBezel.position.set(0.15, 0.82, -0.32);
  lcdBezel.rotation.x = -0.45;
  espGroup.add(lcdBezel);

  const lcdFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.66, 0.66),
    new THREE.MeshBasicMaterial({ map: lcdTexture })
  );
  lcdFace.position.set(0.15, 0.82, -0.255);
  lcdFace.rotation.x = -0.45;
  // Offset slightly forward along bezel normal so there is zero z-fighting
  lcdFace.position.y += 0.027;
  lcdFace.position.z += 0.055;
  espGroup.add(lcdFace);

  tagGroup(espGroup, 'esp32_lcd', hitTargets);
  rootGroup.add(espGroup);
  explodableParts.push({
    object: lcdBezel,
    basePos: lcdBezel.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.55, -0.25)
  });
  explodableParts.push({
    object: lcdFace,
    basePos: lcdFace.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.55, -0.25)
  });

  // 8. Patient Cannula & Sculpted Respiratory Lung Pod
  const patientGroup = new THREE.Group();
  patientGroup.position.set(3.45, 0, -0.35);

  const podBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 0.16, 32),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.65, roughness: 0.35 })
  );
  podBase.position.y = 0.08;
  patientGroup.add(podBase);

  const pulseRingMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const pulseRingMesh = new THREE.Mesh(new THREE.RingGeometry(0.68, 0.82, 32), pulseRingMat);
  pulseRingMesh.rotation.x = -Math.PI / 2;
  pulseRingMesh.position.y = 0.18;
  patientGroup.add(pulseRingMesh);

  // Translucent protective acrylic dome
  const acrylicDome = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.86, 1.85, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.16,
      roughness: 0.1,
      depthWrite: false
    })
  );
  acrylicDome.position.y = 1.08;
  patientGroup.add(acrylicDome);

  // Trachea & Bronchi stem
  const trachea = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.65, 16),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
  );
  trachea.position.y = 1.55;
  patientGroup.add(trachea);

  const lungMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    transparent: true,
    opacity: 0.9
  });

  const lungLeft = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 24), lungMat);
  lungLeft.scale.set(0.85, 1.45, 0.72);
  lungLeft.position.set(-0.34, 0.98, 0);
  lungLeft.rotation.z = 0.14;
  patientGroup.add(lungLeft);

  const lungRight = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 24), lungMat);
  lungRight.scale.set(0.85, 1.45, 0.72);
  lungRight.position.set(0.34, 0.98, 0);
  lungRight.rotation.z = -0.14;
  patientGroup.add(lungRight);

  tagGroup(patientGroup, 'patient_pod', hitTargets);
  rootGroup.add(patientGroup);
  explodableParts.push({
    object: acrylicDome,
    basePos: acrylicDome.position.clone(),
    explodeOffset: new THREE.Vector3(0, 1.15, 0)
  });

  return {
    rootGroup,
    hitTargets,
    primaryFillMesh: primary.fillMesh,
    primaryFillMat: primary.fillMat,
    primaryShellMesh: primary.shellMesh,
    secondaryFillMesh: secondary.fillMesh,
    secondaryFillMat: secondary.fillMat,
    secondaryShellMesh: secondary.shellMesh,
    reserveFillMesh,
    reserveFillMat,
    reserveShellMesh,
    valveLedMats: {
      primary: v1.ledMat,
      secondary: v2.ledMat,
      reserve: vr.ledMat
    },
    relayLedMats,
    pipeMats,
    curves,
    lcdCanvas,
    lcdCtx,
    lcdTexture,
    buzzerRingMat,
    buzzerRingMesh,
    lungLeft,
    lungRight,
    lungMat,
    pulseRingMesh,
    pulseRingMat,
    explodableParts
  };
}
