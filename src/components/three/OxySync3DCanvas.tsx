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

function dampValue(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
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
  ctx.fillStyle = telemetry.hasCritical ? '#2b0912' : '#052938';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = telemetry.hasCritical ? '#ef4444' : '#06b6d4';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, width - 8, height - 8);

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
      setWebglError('WebGL is unavailable in this browser context.');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 640, container.clientHeight || 420);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const lightBg = new THREE.Color(0xf1f5f9);
    const darkBg = new THREE.Color(0x070b14);
    const sceneFog = new THREE.FogExp2(0xf1f5f9, 0.016);
    scene.background = stateRef.current.theme === 'light' ? lightBg : darkBg;
    scene.fog = sceneFog;

    const camera = new THREE.PerspectiveCamera(
      40,
      (container.clientWidth || 640) / (container.clientHeight || 420),
      0.1,
      100
    );
    camera.position.set(...TWIN_COMPONENTS.overview.cameraPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.rotateSpeed = 0.82;
    controls.zoomSpeed = 0.9;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 2.6;
    controls.maxDistance = 16;
    controls.target.set(...TWIN_COMPONENTS.overview.cameraTarget);

    const cancelFly = () => {
      flyTargetRef.current.active = false;
    };
    controls.addEventListener('start', cancelFly);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.15);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
    keyLight.position.set(6, 10, 7);
    scene.add(keyLight);

    const rimCyan = new THREE.PointLight(0x06b6d4, 1.5, 16);
    rimCyan.position.set(-4, 4, -3);
    scene.add(rimCyan);

    const rimWarm = new THREE.PointLight(0xf59e0b, 0.95, 14);
    rimWarm.position.set(4, 3, 4);
    scene.add(rimWarm);

    const rig: TwinSceneRefs = buildOxySyncRig();
    scene.add(rig.rootGroup);

    const FLOW_PARTICLES = 18;
    const flowSpheres: THREE.Mesh[] = [];
    const flowParticleGeo = new THREE.SphereGeometry(0.06, 10, 10);
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

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return;

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
    let pRatioSmooth = Math.max(0.02, stateRef.current.primaryCylinder.percentRemaining / 100);
    let sRatioSmooth = Math.max(0.02, stateRef.current.secondaryCylinder.percentRemaining / 100);
    let rRatioSmooth = Math.max(0.02, stateRef.current.reserveBuffer.percentRemaining / 100);
    let appliedTheme: 'light' | 'dark' | null = null;
    let lastLcdDraw = -1;
    let elapsed = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, Math.max(0.001, clock.getDelta()));
      elapsed += dt;
      const s = stateRef.current;

      // Apply theme scene palette only on theme change
      if (appliedTheme !== s.theme) {
        appliedTheme = s.theme;
        const isLight = s.theme === 'light';
        scene.background = isLight ? lightBg : darkBg;
        sceneFog.color.copy(isLight ? lightBg : darkBg);
        sceneFog.density = isLight ? 0.016 : 0.028;
        hemiLight.intensity = isLight ? 1.25 : 0.85;
        keyLight.intensity = isLight ? 1.7 : 1.45;
        rig.basePlateMat.color.setHex(isLight ? 0xe2e8f0 : 0x0b1222);
      }

      const inactivePipeHex = s.theme === 'light' ? 0x94a3b8 : 0x1e293b;

      // Frame-rate independent smooth camera transition
      if (flyTargetRef.current.active) {
        const camDamp = 1 - Math.exp(-5.5 * dt);
        camera.position.lerp(flyTargetRef.current.pos, camDamp);
        controls.target.lerp(flyTargetRef.current.target, camDamp);
        if (
          camera.position.distanceTo(flyTargetRef.current.pos) < 0.04 &&
          controls.target.distanceTo(flyTargetRef.current.target) < 0.04
        ) {
          flyTargetRef.current.active = false;
        }
      }

      controls.autoRotate = s.autoRotate && !flyTargetRef.current.active;
      controls.autoRotateSpeed = 0.55;
      controls.update();

      // Smooth exploded assembly interpolation
      explodeLerp = dampValue(explodeLerp, s.exploded ? 1 : 0, 7.5, dt);
      for (const part of rig.explodableParts) {
        part.object.position.copy(part.basePos).addScaledVector(part.explodeOffset, explodeLerp);
      }

      // Smooth cylinder fill transitions
      const pTarget = Math.max(0.02, Math.min(1, s.primaryCylinder.percentRemaining / 100));
      pRatioSmooth = dampValue(pRatioSmooth, pTarget, 6.0, dt);
      rig.primaryFillMesh.scale.y = pRatioSmooth;
      rig.primaryFillMat.color.setHex(pTarget <= 0.15 ? 0xf59e0b : 0x06b6d4);
      rig.primaryFillMat.emissive.setHex(pTarget <= 0.15 ? 0xf59e0b : 0x06b6d4);
      rig.primaryFillMat.emissiveIntensity = dampValue(
        rig.primaryFillMat.emissiveIntensity,
        s.activeSource === 'primary' ? 0.85 : 0.25,
        6.0,
        dt
      );

      const sTarget = Math.max(0.02, Math.min(1, s.secondaryCylinder.percentRemaining / 100));
      sRatioSmooth = dampValue(sRatioSmooth, sTarget, 6.0, dt);
      rig.secondaryFillMesh.scale.y = sRatioSmooth;
      rig.secondaryFillMat.color.setHex(sTarget <= 0.15 ? 0xf59e0b : 0x14b8a6);
      rig.secondaryFillMat.emissive.setHex(sTarget <= 0.15 ? 0xf59e0b : 0x14b8a6);
      rig.secondaryFillMat.emissiveIntensity = dampValue(
        rig.secondaryFillMat.emissiveIntensity,
        s.activeSource === 'secondary' ? 0.85 : 0.25,
        6.0,
        dt
      );

      const rTarget = Math.max(0.02, Math.min(1, s.reserveBuffer.percentRemaining / 100));
      rRatioSmooth = dampValue(rRatioSmooth, rTarget, 6.0, dt);
      rig.reserveFillMesh.scale.y = rRatioSmooth;
      const rColor = s.activeSource === 'reserve' ? 0xef4444 : s.reserveBuffer.isRefilling ? 0x38bdf8 : 0xf59e0b;
      rig.reserveFillMat.color.setHex(rColor);
      rig.reserveFillMat.emissive.setHex(rColor);
      rig.reserveFillMat.emissiveIntensity = dampValue(
        rig.reserveFillMat.emissiveIntensity,
        s.activeSource === 'reserve' ? 1.0 : 0.42,
        6.0,
        dt
      );

      const isPrim = s.activeSource === 'primary';
      const isSec = s.activeSource === 'secondary';
      const isRes = s.activeSource === 'reserve';

      rig.valveLedMats.primary.emissiveIntensity = dampValue(rig.valveLedMats.primary.emissiveIntensity, isPrim ? 1.4 : 0.08, 8, dt);
      rig.valveLedMats.secondary.emissiveIntensity = dampValue(rig.valveLedMats.secondary.emissiveIntensity, isSec ? 1.4 : 0.08, 8, dt);
      rig.valveLedMats.reserve.emissiveIntensity = dampValue(rig.valveLedMats.reserve.emissiveIntensity, isRes ? 1.6 : 0.08, 8, dt);

      rig.relayLedMats.primary.emissiveIntensity = rig.valveLedMats.primary.emissiveIntensity;
      rig.relayLedMats.secondary.emissiveIntensity = rig.valveLedMats.secondary.emissiveIntensity;
      rig.relayLedMats.reserve.emissiveIntensity = rig.valveLedMats.reserve.emissiveIntensity;

      rig.pipeMats.primary.color.setHex(isPrim ? 0x06b6d4 : inactivePipeHex);
      rig.pipeMats.primary.emissiveIntensity = isPrim ? 0.52 : 0.04;

      rig.pipeMats.secondary.color.setHex(isSec ? 0x14b8a6 : inactivePipeHex);
      rig.pipeMats.secondary.emissiveIntensity = isSec ? 0.52 : 0.04;

      rig.pipeMats.manifold.color.setHex(isPrim || isSec ? 0x0891b2 : inactivePipeHex);
      rig.pipeMats.manifold.emissiveIntensity = isPrim || isSec ? 0.45 : 0.04;

      rig.pipeMats.reserve.color.setHex(isRes ? 0xef4444 : inactivePipeHex);
      rig.pipeMats.reserve.emissiveIntensity = isRes ? 0.65 : 0.04;

      rig.pipeMats.bleed.color.setHex(s.reserveBuffer.isRefilling ? 0x38bdf8 : inactivePipeHex);
      rig.pipeMats.bleed.emissiveIntensity = s.reserveBuffer.isRefilling ? 0.5 : 0.04;

      rig.pipeMats.delivery.color.setHex(
        isRes ? 0xef4444 : isPrim || isSec ? 0x0891b2 : inactivePipeHex
      );
      rig.pipeMats.delivery.emissiveIntensity = s.activeSource === 'none' ? 0.02 : 0.48;

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

      const respHz = Math.max(8, s.vitals.respiratoryRate) / 60;
      const breath = 1 + 0.11 * Math.sin(elapsed * respHz * Math.PI * 2);
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
      rig.pulseRingMat.opacity = (1 - beat) * 0.8;
      rig.pulseRingMat.color.setHex(s.vitals.spo2 < 90 ? 0xef4444 : 0x10b981);

      const unack = s.alerts.filter((a) => !a.acknowledged);
      const hasCritical =
        unack.some((a) => a.severity === 'critical') ||
        s.activeSource === 'reserve' ||
        s.activeSource === 'none';
      const hasWarning = !hasCritical && unack.some((a) => a.severity === 'warning');

      if (hasCritical || hasWarning) {
        const ringPhase = (elapsed * (hasCritical ? 2.2 : 0.9)) % 1;
        const rScale = 0.8 + ringPhase * 1.8;
        rig.buzzerRingMesh.scale.set(rScale, rScale, 1);
        rig.buzzerRingMat.color.setHex(hasCritical ? 0xef4444 : 0xf59e0b);
        rig.buzzerRingMat.opacity = (1 - ringPhase) * 0.85;
      } else {
        rig.buzzerRingMat.opacity = 0;
      }

      if (lastLcdDraw < 0 || elapsed - lastLcdDraw >= 0.25) {
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
      <div className="w-full h-full flex items-center justify-center p-6 text-center bg-[var(--surface-well)] text-[var(--text-secondary)] text-xs font-mono">
        {webglError}
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full touch-none" />;
};
