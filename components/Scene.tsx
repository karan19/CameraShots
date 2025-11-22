"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, ScrollControls, Trail, useScroll } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { computeTrackOrbitShot } from "./shots/trackOrbit";
import { computeTrackFollowShot } from "./shots/trackFollow";
import { computeOverheadCraneShot } from "./shots/overheadCrane";
import { computeLowSliderShot } from "./shots/lowSlider";
import { computeOrbitPauseShot } from "./shots/orbitPause";
import { computeSideCarShot } from "./shots/sideCar";
import { computeRevealPanShot } from "./shots/revealPan";

type TrackProps = {
  curve: THREE.CatmullRomCurve3;
};

type ShotName = "follow" | "orbit" | "crane" | "slider" | "orbitPause" | "sideCar" | "reveal";

const SMOOTHNESS = 6;
const tmpUp = new THREE.Vector3(0, 1, 0);
const tmpForward = new THREE.Vector3(0, 0, 1);

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 10]} intensity={1.2} color="#9de6ff" />
      <pointLight position={[-10, -6, -2]} intensity={0.6} color="#6bc4ff" />
    </>
  );
}

function buildRoadGeometry(curve: THREE.CatmullRomCurve3, width = 1.6, segments = 420) {
  const frames = curve.computeFrenetFrames(segments, curve.closed);
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const indices: number[] = [];
  const leftPoints: THREE.Vector3[] = [];
  const rightPoints: THREE.Vector3[] = [];
  const centerPoints: THREE.Vector3[] = [];

  let idx = 0;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const binormal = frames.binormals[i].clone().normalize();
    const normal = frames.normals[i].clone().normalize();
    const lateral = binormal.multiplyScalar(width / 2);
    const lift = normal.multiplyScalar(0.02);

    const left = point.clone().add(lateral).add(lift);
    const right = point.clone().sub(lateral).add(lift);
    const center = point.clone().add(lift);

    positions[idx++] = left.x;
    positions[idx++] = left.y;
    positions[idx++] = left.z;
    positions[idx++] = right.x;
    positions[idx++] = right.y;
    positions[idx++] = right.z;

    leftPoints.push(left);
    rightPoints.push(right);
    centerPoints.push(center);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = i * 2 + 2;
    const d = i * 2 + 3;
    indices.push(a, b, d);
    indices.push(a, d, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return { geometry, leftPoints, rightPoints, centerPoints };
}

function Road({ curve }: TrackProps) {
  const { geometry, leftPoints, rightPoints, centerPoints } = useMemo(() => {
    return buildRoadGeometry(curve, 1.8, 320);
  }, [curve]);

  return (
    <>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          color="#0e161f"
          emissive="#0a1e2c"
          emissiveIntensity={0.6}
          roughness={0.82}
          metalness={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line points={centerPoints} color="#ffffff" lineWidth={1.2} opacity={0.9} dashed={false} />
      <Line
        points={leftPoints}
        color="#7df9ff"
        lineWidth={1.8}
        transparent
        opacity={0.85}
        dashed={false}
      />
      <Line
        points={rightPoints}
        color="#7df9ff"
        lineWidth={1.8}
        transparent
        opacity={0.85}
        dashed={false}
      />
    </>
  );
}

function Ball({ curve }: TrackProps) {
  const scroll = useScroll();
  const ballRef = useRef<THREE.Mesh>(null);
  const tmpTangent = useRef(new THREE.Vector3()).current;
  const tmpBinormal = useRef(new THREE.Vector3()).current;
  const tmpNormal = useRef(new THREE.Vector3()).current;
  const tmpQuat = useRef(new THREE.Quaternion()).current;
  const tmpSpin = useRef(new THREE.Quaternion()).current;

  useEffect(() => {
    scroll.el?.scrollTo(0, 0);
  }, [scroll]);

  useFrame(() => {
    const t = scroll.offset % 1;
    const pos = curve.getPointAt(t);
    tmpTangent.copy(curve.getTangentAt(t)).normalize();
    tmpBinormal.crossVectors(tmpTangent, tmpUp);
    if (tmpBinormal.lengthSq() < 1e-6) tmpBinormal.set(1, 0, 0);
    tmpBinormal.normalize();
    tmpNormal.crossVectors(tmpBinormal, tmpTangent).normalize();

    const lifted = pos.clone().add(tmpNormal.clone().multiplyScalar(0.28));
    tmpQuat.setFromUnitVectors(tmpForward, tmpBinormal);
    tmpSpin.setFromAxisAngle(tmpUp, Math.PI / 2);
    tmpQuat.premultiply(tmpSpin);

    if (ballRef.current) {
      ballRef.current.position.copy(lifted);
      ballRef.current.quaternion.copy(tmpQuat);
    }
  });

  return (
    <Trail
      width={0.1}
      length={3.5}
      color="#9df3ff"
      attenuation={(t) => t * t}
      local={false}
    >
      <mesh ref={ballRef} castShadow>
        <torusGeometry args={[0.23, 0.04, 24, 48]} />
        <meshStandardMaterial
          color="#0c1118"
          emissive="#9df3ff"
          emissiveIntensity={1.2}
          metalness={0.45}
          roughness={0.25}
        />
        <mesh rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.46, 12]} />
          <meshStandardMaterial color="#9df3ff" emissive="#9df3ff" emissiveIntensity={0.8} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.46, 12]} />
          <meshStandardMaterial color="#9df3ff" emissive="#9df3ff" emissiveIntensity={0.8} />
        </mesh>
      </mesh>
    </Trail>
  );
}

function CameraRig({ curve, shot }: TrackProps & { shot: ShotName }) {
  const scroll = useScroll();
  const lerpedPosition = useRef(new THREE.Vector3());
  const lerpedLookAt = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  const computeShotForOffset = useCallback(
    (offset: number) => {
      if (shot === "follow") return computeTrackFollowShot(curve, offset);
      if (shot === "orbit") return computeTrackOrbitShot(curve, offset);
      if (shot === "crane") return computeOverheadCraneShot(curve, offset);
      if (shot === "orbitPause") return computeOrbitPauseShot(curve, offset);
      if (shot === "sideCar") return computeSideCarShot(curve, offset);
      if (shot === "reveal") return computeRevealPanShot(curve, offset);
      return computeLowSliderShot(curve, offset);
    },
    [curve, shot]
  );

  useEffect(() => {
    const { position, lookAt } = computeShotForOffset(scroll.offset);
    lerpedPosition.current.copy(position);
    lerpedLookAt.current.copy(lookAt);
  }, [computeShotForOffset, scroll.offset]);

  useFrame(({ camera }, delta) => {
    const offset = scroll.offset;
    const { position: targetPosition, lookAt: targetLook } = computeShotForOffset(offset);

    const lerpAlpha = 1 - Math.exp(-delta * SMOOTHNESS);

    lerpedPosition.current.lerp(targetPosition, lerpAlpha);
    lerpedLookAt.current.lerp(targetLook, lerpAlpha);

    camera.position.copy(lerpedPosition.current);
    camera.up.set(0, 1, 0);
    camera.lookAt(lerpedLookAt.current);

    if (!initialized.current) {
      initialized.current = true;
    }
  });

  return null;
}

function SceneContent({ curve, shot }: TrackProps & { shot: ShotName }) {
  return (
    <>
      <Lights />
      <Road curve={curve} />
      <Ball curve={curve} />
      <CameraRig curve={curve} shot={shot} />
    </>
  );
}

export default function Scene() {
  const [shot, setShot] = useState<ShotName>("follow");

  const curve = useMemo(() => {
    const anchors = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.25, 0.02, 5),
      new THREE.Vector3(0.35, -0.01, 10),
      new THREE.Vector3(0.25, 0.02, 14.5),
      new THREE.Vector3(0.1, 0, 19),
      new THREE.Vector3(0.05, -0.01, 22)
    ];

    const points = anchors.map((p, i) => {
      if (i === 0) return p.clone();
      return p
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.3
          )
        );
    });

    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  }, []);

  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 2]}
      camera={{ fov: 60, near: 0.1, far: 200, position: [0, 0, 12] }}
    >
      <color attach="background" args={["#050608"]} />
      <fog attach="fog" args={["#050608", 18, 40]} />
      <ScrollControls pages={5} damping={0.2}>
        <SceneContent curve={curve} shot={shot} />
        <Html position={[0, 0, 0]} fullscreen zIndexRange={[10, 20]} transform={false}>
          <div className="pointer-events-none absolute right-4 top-4 flex justify-end">
            <div className="pointer-events-auto rounded-xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-md">
              <label className="mr-2 text-xs text-white/60">Shot</label>
              <select
                className="bg-black/60 text-sm text-white outline-none"
                value={shot}
                onChange={(e) => setShot(e.target.value as ShotName)}
              >
                <option value="follow">Track Follow</option>
                <option value="orbit">Orbit</option>
                <option value="crane">Overhead Crane</option>
                <option value="slider">Low Slider</option>
                <option value="orbitPause">Orbit Pause</option>
                <option value="sideCar">Side Car</option>
                <option value="reveal">Reveal Pan</option>
              </select>
            </div>
          </div>
        </Html>
      </ScrollControls>
    </Canvas>
  );
}
