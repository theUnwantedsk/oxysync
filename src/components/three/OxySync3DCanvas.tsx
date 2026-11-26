import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTelemetry } from '../../context/TelemetryContext';
import { TWIN_COMPONENTS, TwinComponentId } from '../../data/digitalTwinCatalog';
import { buildOxySyncRig, TwinSceneRefs } from './twinSceneBuilders';

interface OxySync3DCanvasProps {
  selectedComponent: TwinComponentId;
  onSelectComponent: (id: TwinComponentId) => void;
  exploded: boolean;
  lcdPageIndex: number;
  autoRotate: boolean;
}

function drawLcdScreen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pageIdx: number,
  telemetry: {
    spo2: number;
    pulseRate: number;
    primaryPct: number;
    primaryBar: number;
    secondaryPct: number;
    secondaryBar: number;
    reserveSec: number;
    activeSource: string;
    totalMinutes: number;
    flowRate: number;
    alertTitle: string;
    hasCritical: boolean;
    hasWarning: boolean;
    esp32Live: boolean;
    esp32Host: string;
  }
) {
  // Classic backlit medical cyan-blue 16x2 LCD look
  ctx.fillStyle = telemetry.hasCritical ? '#2b0912' : '#052938';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = telemetry.hasCritical ? '#ef4444' : '#06b6d4';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Subtle LCD character cell grid
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let col = 0; col < 16; col++) {
    ctx.fillRect(22 + col * 29.5, 22, 24, 62);
    ctx.fillRect(22 + col * 29.5, 104, 24, 62);
  }

  let row0 = '';
  let row1 = '';

  switch (pageIdx % 5) {
    case 0:
      row0 = `OXYSYNC ♥${String(telemetry.pulseRate).padStart(3, ' ')} bpm`;
      row1 = `SpO2:${String(Math.round(telemetry.spo2)).padStart(3, ' ')}% [${telemetry.esp32Live ? 'STA' : 'AP '}]`;
      break;
    case 1: {
      const pTag = telemetry.activeSource === 'primary' ? '*' : ' ';
      const bTag = telemetry.activeSource === 'secondary' ? '*' : ' ';
      row0 = `Pri${pTag}:${String(telemetry.primaryPct).padStart(3, ' ')}% ${String(Math.round(telemetry.primaryBar)).padStart(3, ' ')}B`;
      row1 = `Bck${bTag}:${String(telemetry.secondaryPct).padStart(3, ' ')}% ${String(Math.round(telemetry.secondaryBar)).padStart(3, ' ')}B`;
      break;
    }
    case 2: {
      const hrs = Math.floor(telemetry.totalMinutes / 60);
      const mins = Math.floor(telemetry.totalMinutes % 60);
      const st = telemetry.totalMinutes < 30 ? 'LOW!' : 'OK  ';
      row0 = `Rem:${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
      row1 = `Flow:${telemetry.flowRate.toFixed(1)}L ${st}`;
      break;
    }
    case 3:
      row0 = telemetry.hasCritical
        ? '! CRITICAL !'
        : telemetry.hasWarning
        ? '! WARNING  !'
        : 'Status: NORMAL';
      row1 = telemetry.alertTitle.slice(0, 16).padEnd(16, ' ');
      break;
    default:
      row0 = telemetry.esp32Live ? 'WiFi: SYNCED' : 'SoftAP: OXYSYNC';
      row1 = (telemetry.esp32Live ? telemetry.esp32Host : '192.168.4.1').slice(0, 16);
      break;
  }

  ctx.fillStyle = telemetry.hasCritical ? '#fca5a5' : '#67e8f9';
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(row0.slice(0, 16), 24, 54);
  ctx.fillText(row1.slice(0, 16), 24, 136);

  // Page indicator badge in corner
  ctx.fillStyle = 'rgba(103, 232, 249, 0.55)';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`P${(pageIdx % 5) + 1}/5`, width - 52, 20);
}

export const OxySync3DCanvas: React.FC<OxySync3DCanvasProps> = ({
  selectedComponent,
  onSelectComponent,
  exploded,
  lcdPageIndex,
  autoRotate
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const {
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    vitals,
    settings,
    predictions,
    alerts,
    esp32SyncEnabled,
    esp32ConnectionState,
    esp32Host,
    usbStatus,
    theme
  } = useTelemetry();

  const stateRef = useRef({
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    vitals,
    settings,
    predictions,
    alerts,
    esp32Live: (esp32SyncEnabled && esp32ConnectionState === 'connected') || usbStatus === 'connected',
    esp32Host,
    exploded,
    lcdPageIndex,
    autoRotate,
    theme
  });

  stateRef.current = {
    primaryCylinder,
    secondaryCylinder,
    reserveBuffer,
    activeSource,
    vitals,
    settings,
    predictions,
    alerts,
    esp32Live: (esp32SyncEnabled && esp32ConnectionState === 'connected') || usbStatus === 'connected',
    esp32Host,
    exploded,
    lcdPageIndex,
    autoRotate,
    theme
  };

  const flyTargetRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...TWIN_COMPONENTS.overview.cameraPos),
    target: new THREE.Vector3(...TWIN_COMPONENTS.overview.cameraTarget)
  });

  useEffect(() => {
    const spec = TWIN_COMPONENTS[selectedComponent] || TWIN_COMPONENTS.overview;
    flyTargetRef.current = {
      active: true,
      pos: new THREE.Vector3(...spec.cameraPos),
      target: new THREE.Vector3(...spec.cameraTarget)
    };
  }, [selectedComponent]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setWebglError('WebGL is unavailable in this browser context. Please enable hardware acceleration or use a modern browser.');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 640, container.clientHeight || 420);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const lightBg = new THREE.Color(0xeef4fb);
    const darkBg = new THREE.Color(0x040812);
    const sceneFog = new THREE.FogExp2(0xeef4fb, 0.02);
    scene.background = stateRef.current.theme === 'light' ? lightBg : darkBg;
    scene.fog = sceneFog;

    const camera = new THREE.PerspectiveCamera(
      42,
      (container.clientWidth || 640) / (container.clientHeight || 420),
      0.1,
      100
    );
    camera.position.set(...TWIN_COMPONENTS.overview.cameraPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 2.6;
    controls.maxDistance = 16;
    controls.target.set(...TWIN_COMPONENTS.overview.cameraTarget);

    // Stop camera fly-to if user grabs the viewport
    const cancelFly = () => {
      flyTargetRef.current.active = false;
    };
    controls.addEventListener('start', cancelFly);

    // Studio & Medical Accent Lighting
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(6, 10, 7);
    scene.add(keyLight);

    const rimCyan = new THREE.PointLight(0x06b6d4, 1.8, 16);
    rimCyan.position.set(-4, 4, -3);
    scene.add(rimCyan);

    const rimWarm = new THREE.PointLight(0xf59e0b, 1.1, 14);
    rimWarm.position.set(4, 3, 4);
    scene.add(rimWarm);

    // Build 3D Hardware Rig
    const rig: TwinSceneRefs = buildOxySyncRig();
    scene.add(rig.rootGroup);

    // Animated Oxygen Flow Particles
    const FLOW_PARTICLES = 18;
    const flowSpheres: THREE.Mesh[] = [];
    const flowParticleGeo = new THREE.SphereGeometry(0.065, 10, 10);
    const flowParticleMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    for (let i = 0; i < FLOW_PARTICLES; i++) {
      const m = new THREE.Mesh(flowParticleGeo, flowParticleMat);
      m.visible = false;
      scene.add(m);
      flowSpheres.push(m);
    }

    const BLEED_PARTICLES = 6;
    const bleedSpheres: THREE.Mesh[] = [];
    const bleedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < BLEED_PARTICLES; i++) {
      const m = new THREE.Mesh(flowParticleGeo, bleedMat);
      m.visible = false;
      scene.add(m);
      bleedSpheres.push(m);
    }

    // Raycasting for Click-to-Inspect
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Ignore orbit drags

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(rig.hitTargets, true);
      if (intersects.length > 0) {
        const compId = intersects[0].object.userData.componentId as TwinComponentId | undefined;
        if (compId && TWIN_COMPONENTS[compId]) {
          onSelectComponent(compId);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rig.hitTargets, true);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let animId = 0;
    let explodeLerp = 0;
    let lastLcdDraw = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const s = stateRef.current;
      const isLight = s.theme === 'light';
      scene.background = isLight ? lightBg : darkBg;
      sceneFog.color.copy(isLight ? lightBg : darkBg);
      sceneFog.density = isLight ? 0.018 : 0.032;
      hemiLight.intensity = isLight ? 1.25 : 0.85;
      keyLight.intensity = isLight ? 1.75 : 1.45;
      rig.basePlateMat.color.setHex(isLight ? 0xdbe4ef : 0x0b1222);
      const inactivePipeHex = isLight ? 0x94a3b8 : 0x1e293b;

      // Smooth Camera Fly-To
      if (flyTargetRef.current.active) {
        camera.position.lerp(flyTargetRef.current.pos, 0.08);
        controls.target.lerp(flyTargetRef.current.target, 0.08);
        if (
          camera.position.distanceTo(flyTargetRef.current.pos) < 0.05 &&
          controls.target.distanceTo(flyTargetRef.current.target) < 0.05
        ) {
          flyTargetRef.current.active = false;
        }
      }

      controls.autoRotate = s.autoRotate && !flyTargetRef.current.active;
      controls.autoRotateSpeed = 0.7;
      controls.update();

      // Exploded View Interpolation
      const targetExplode = s.exploded ? 1 : 0;
      explodeLerp += (targetExplode - explodeLerp) * 0.1;
      for (const part of rig.explodableParts) {
        part.object.position.copy(part.basePos).addScaledVector(part.explodeOffset, explodeLerp);
      }

      // Cylinder Fill Levels
      const pRatio = Math.max(0.02, Math.min(1, s.primaryCylinder.percentRemaining / 100));
      rig.primaryFillMesh.scale.y = pRatio;
      rig.primaryFillMat.color.setHex(pRatio <= 0.15 ? 0xf59e0b : 0x06b6d4);
      rig.primaryFillMat.emissive.setHex(pRatio <= 0.15 ? 0xf59e0b : 0x06b6d4);
      rig.primaryFillMat.emissiveIntensity = s.activeSource === 'primary' ? 0.85 : 0.3;

      const sRatio = Math.max(0.02, Math.min(1, s.secondaryCylinder.percentRemaining / 100));
      rig.secondaryFillMesh.scale.y = sRatio;
      rig.secondaryFillMat.color.setHex(sRatio <= 0.15 ? 0xf59e0b : 0x14b8a6);
      rig.secondaryFillMat.emissive.setHex(sRatio <= 0.15 ? 0xf59e0b : 0x14b8a6);
      rig.secondaryFillMat.emissiveIntensity = s.activeSource === 'secondary' ? 0.85 : 0.3;

      const rRatio = Math.max(0.02, Math.min(1, s.reserveBuffer.percentRemaining / 100));
      rig.reserveFillMesh.scale.y = rRatio;
      const rColor = s.activeSource === 'reserve' ? 0xef4444 : s.reserveBuffer.isRefilling ? 0x38bdf8 : 0xf59e0b;
      rig.reserveFillMat.color.setHex(rColor);
      rig.reserveFillMat.emissive.setHex(rColor);
      rig.reserveFillMat.emissiveIntensity = s.activeSource === 'reserve' ? 1.0 : 0.45;

      // Solenoid Valve & Relay LEDs
      const isPrim = s.activeSource === 'primary';
      const isSec = s.activeSource === 'secondary';
      const isRes = s.activeSource === 'reserve';

      rig.valveLedMats.primary.emissiveIntensity = isPrim ? 1.4 : 0.08;
      rig.valveLedMats.secondary.emissiveIntensity = isSec ? 1.4 : 0.08;
      rig.valveLedMats.reserve.emissiveIntensity = isRes ? 1.6 : 0.08;

      rig.relayLedMats.primary.emissiveIntensity = isPrim ? 1.5 : 0.08;
      rig.relayLedMats.secondary.emissiveIntensity = isSec ? 1.5 : 0.08;
      rig.relayLedMats.reserve.emissiveIntensity = isRes ? 1.5 : 0.08;

      // Pipe Active Highlighting
      rig.pipeMats.primary.color.setHex(isPrim ? 0x06b6d4 : inactivePipeHex);
      rig.pipeMats.primary.emissiveIntensity = isPrim ? 0.55 : 0.05;

      rig.pipeMats.secondary.color.setHex(isSec ? 0x14b8a6 : inactivePipeHex);
      rig.pipeMats.secondary.emissiveIntensity = isSec ? 0.55 : 0.05;

      rig.pipeMats.manifold.color.setHex(isPrim || isSec ? 0x22d3ee : inactivePipeHex);
      rig.pipeMats.manifold.emissiveIntensity = isPrim || isSec ? 0.45 : 0.05;

      rig.pipeMats.reserve.color.setHex(isRes ? 0xef4444 : inactivePipeHex);
      rig.pipeMats.reserve.emissiveIntensity = isRes ? 0.65 : 0.05;

      rig.pipeMats.bleed.color.setHex(s.reserveBuffer.isRefilling ? 0x38bdf8 : inactivePipeHex);
      rig.pipeMats.bleed.emissiveIntensity = s.reserveBuffer.isRefilling ? 0.5 : 0.05;

      rig.pipeMats.delivery.color.setHex(
        isRes ? 0xef4444 : isPrim || isSec ? 0x22d3ee : inactivePipeHex
      );
      rig.pipeMats.delivery.emissiveIntensity = s.activeSource === 'none' ? 0.02 : 0.5;

      // Flow Particles along Active Curve
      const activeCurve = isPrim
        ? rig.curves.primary
        : isSec
        ? rig.curves.secondary
        : isRes
        ? rig.curves.reserve
        : null;

      flowParticleMat.color.setHex(isRes ? 0xfca5a5 : 0x67e8f9);
      const speedScale = 0.14 + (s.settings.flowRateLpm / 15) * 0.28;

      for (let i = 0; i < FLOW_PARTICLES; i++) {
        const sphere = flowSpheres[i];
        if (!activeCurve) {
          sphere.visible = false;
        } else {
          sphere.visible = true;
          const u = (elapsed * speedScale + i / FLOW_PARTICLES) % 1;
          activeCurve.getPointAt(u, sphere.position);
        }
      }

      for (let i = 0; i < BLEED_PARTICLES; i++) {
        const bSphere = bleedSpheres[i];
        if (!s.reserveBuffer.isRefilling) {
          bSphere.visible = false;
        } else {
          bSphere.visible = true;
          const u = (elapsed * 0.35 + i / BLEED_PARTICLES) % 1;
          rig.curves.bleed.getPointAt(u, bSphere.position);
        }
      }

      // Patient Lungs Expansion & Cardiac Pulse Ring
      const respHz = Math.max(8, s.vitals.respiratoryRate) / 60;
      const breath = 1 + 0.12 * Math.sin(elapsed * respHz * Math.PI * 2);
      rig.lungLeft.scale.set(0.85 * breath, 1.45 * (1 + (breath - 1) * 0.5), 0.72 * breath);
      rig.lungRight.scale.set(0.85 * breath, 1.45 * (1 + (breath - 1) * 0.5), 0.72 * breath);

      const lungColor =
        s.vitals.spo2 < 90 ? 0xef4444 : s.vitals.spo2 < 95 ? 0xf59e0b : 0x06b6d4;
      rig.lungMat.color.setHex(lungColor);
      rig.lungMat.emissive.setHex(lungColor);

      const pulseHz = Math.max(40, s.vitals.pulseRate) / 60;
      const beat = (elapsed * pulseHz) % 1;
      const pulseScale = 0.85 + beat * 0.45;
      rig.pulseRingMesh.scale.set(pulseScale, pulseScale, 1);
      rig.pulseRingMat.opacity = (1 - beat) * 0.85;
      rig.pulseRingMat.color.setHex(s.vitals.spo2 < 90 ? 0xef4444 : 0x10b981);

      // Piezo Buzzer Alarm Wave (GPIO 25)
      const unack = s.alerts.filter((a) => !a.acknowledged);
      const hasCritical = unack.some((a) => a.severity === 'critical') || s.activeSource === 'reserve' || s.activeSource === 'none';
      const hasWarning = !hasCritical && unack.some((a) => a.severity === 'warning');

      if (hasCritical || hasWarning) {
        const ringPhase = (elapsed * (hasCritical ? 2.4 : 1.0)) % 1;
        const rScale = 0.8 + ringPhase * 1.9;
        rig.buzzerRingMesh.scale.set(rScale, rScale, 1);
        rig.buzzerRingMat.color.setHex(hasCritical ? 0xef4444 : 0xf59e0b);
        rig.buzzerRingMat.opacity = (1 - ringPhase) * 0.9;
      } else {
        rig.buzzerRingMat.opacity = 0;
      }

      // Refresh 16x2 I2C LCD CanvasTexture at ~4 Hz
      if (elapsed - lastLcdDraw >= 0.25) {
        lastLcdDraw = elapsed;
        drawLcdScreen(rig.lcdCtx, rig.lcdCanvas.width, rig.lcdCanvas.height, s.lcdPageIndex, {
          spo2: s.vitals.spo2,
          pulseRate: s.vitals.pulseRate,
          primaryPct: s.primaryCylinder.percentRemaining,
          primaryBar: s.primaryCylinder.currentPressureBar,
          secondaryPct: s.secondaryCylinder.percentRemaining,
          secondaryBar: s.secondaryCylinder.currentPressureBar,
          reserveSec: s.reserveBuffer.remainingSeconds,
          activeSource: s.activeSource,
          totalMinutes: s.predictions.totalSystemMinutes,
          flowRate: s.settings.flowRateLpm,
          alertTitle: unack[0]?.title || 'System Nominal',
          hasCritical,
          hasWarning,
          esp32Live: s.esp32Live,
          esp32Host: s.esp32Host
        });
        rig.lcdTexture.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', cancelFly);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      rig.lcdTexture.dispose();
      flowParticleGeo.dispose();
      flowParticleMat.dispose();
      bleedMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSelectComponent]);

  if (webglError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 text-center bg-[#040812] text-slate-300 text-xs font-mono">
        {webglError}
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full touch-none" />;
};
