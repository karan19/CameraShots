"use client";

import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type RevealMode = "grow" | "clip";
type Vec3 = [number, number, number];
type Scene3Props = {
  mode: RevealMode;
  pos3: Vec3;
  rot3: Vec3;
  focusIndex: number;
  customFocus?: Vec3 | null;
  savedPoints?: Vec3[];
};
type CityProps = {
  path: string;
  position: [number, number, number];
  rotation: Vec3;
  mode: RevealMode;
};

function CityModel({ path, position, rotation, mode }: CityProps) {
  const { scene: gltfScene } = useGLTF(path);
  const { gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const progressRef = useRef(0);
  const baseScaleRef = useRef(1);
  const heightRef = useRef(1);
  const clipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const materialsRef = useRef<THREE.Material[]>([]);

  const scene = useMemo(() => {
    materialsRef.current = [];
    const clone = gltfScene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mapMaterial = (mat?: THREE.Material) => {
          const cloned = (mat ? mat.clone() : new THREE.MeshStandardMaterial({ color: "#cccccc" })) as THREE.Material;
          if ("envMapIntensity" in cloned) {
            (cloned as THREE.MeshStandardMaterial).envMapIntensity = 0.75;
          }
          materialsRef.current.push(cloned);
          return cloned;
        };

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => mapMaterial(m));
        } else {
          mesh.material = mapMaterial(mesh.material as THREE.Material);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [gltfScene]);

  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const desiredSize = 8; // further reduce size to avoid overlap when models sit close together
    const scale = desiredSize / maxDim;

    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.sub(center.multiplyScalar(scale));
    const centeredBox = new THREE.Box3().setFromObject(groupRef.current);
    groupRef.current.position.y -= centeredBox.min.y;

    // recompute bounds after transforms to get an accurate height for clipping
    const finalBox = new THREE.Box3().setFromObject(groupRef.current);
    baseScaleRef.current = scale;
    heightRef.current = finalBox.max.y - finalBox.min.y;
  }, [scene]);

  useEffect(() => {
    elapsedRef.current = 0;
    progressRef.current = 0;
    // reset plane start below the model for clipping mode
    clipPlaneRef.current.constant = -heightRef.current - 2;
    materialsRef.current.forEach((mat) => {
      const material = mat as THREE.Material & { clippingPlanes?: THREE.Plane[] };
      if (mode === "clip") {
        gl.localClippingEnabled = true;
        material.clippingPlanes = [clipPlaneRef.current];
      } else {
        gl.localClippingEnabled = false;
        material.clippingPlanes = [];
      }
    });
    if (!materialsRef.current.length) {
      gl.localClippingEnabled = false;
    }
  }, [gl, mode]);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (mode === "grow") {
      const floors = 10;
      const perFloor = 0.2;
      const builtFloors = Math.min(floors, Math.floor(elapsedRef.current / perFloor));
      progressRef.current = builtFloors / floors;
    } else {
      const speed = 0.5;
      progressRef.current = Math.min(1, elapsedRef.current * speed);
    }

    if (groupRef.current) {
      const built = Math.max(0.001, progressRef.current);
      const base = baseScaleRef.current;
      if (mode === "grow") {
        groupRef.current.scale.set(base, base * built, base);
      } else {
        groupRef.current.scale.setScalar(base);
        const plane = clipPlaneRef.current;
        const start = -heightRef.current - 2;
        const end = 0;
        plane.constant = start + (end - start) * built;
      }
    }
  });

  return <primitive ref={groupRef} object={scene} position={position} rotation={rotation} />;
}

function LoadingOverlay() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html position={[0, 0, 0]} fullscreen zIndexRange={[20, 30]}>
      <div className="pointer-events-none absolute left-1/2 top-4 w-64 -translate-x-1/2 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-white shadow-lg backdrop-blur">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Loading city packs</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

export default function Scene3Models({
  mode,
  pos3,
  rot3,
  focusIndex,
  customFocus,
  savedPoints = []
}: Scene3Props) {
const basePoints = useMemo<Vec3[]>(
  () => [
    [-2.75, 0.25, -2.25],
    [-1.25, 0.25, 3.25],
    [1.25, 0.25, 1.25],
    [-0.25, 0.25, -3.75]
  ],
  []
);
const targetPoints = useMemo<Vec3[]>(() => {
  const list = [...basePoints];
  if (customFocus) list.push(customFocus);
  return list;
}, [basePoints, customFocus]);
const currentMarker: Vec3 = targetPoints[Math.min(targetPoints.length - 1, Math.max(0, focusIndex))];
const controlsRef = useRef<OrbitControlsImpl>(null);
const desiredPos = useRef(new THREE.Vector3());
const desiredTarget = useRef(new THREE.Vector3());
const lerpPos = useRef(new THREE.Vector3());
const lerpTarget = useRef(new THREE.Vector3());
const userDragging = useRef(false);
const animateCam = useRef(true);
const startSph = useRef(new THREE.Spherical());
const endSph = useRef(new THREE.Spherical());
const animT = useRef(0);
const orbitAngles = useMemo<number[]>(() => [45, 120, -140, -45, 60], []);

const computeOffset = (target: Vec3, angleDeg: number, radius = 10, height = 3) => {
  const angle = THREE.MathUtils.degToRad(angleDeg);
  return new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
};

  const computeCameraPos = (target: Vec3, angleDeg: number) => {
    return new THREE.Vector3(...target).add(computeOffset(target, angleDeg));
  };

  useEffect(() => {
    const idx = Math.min(targetPoints.length - 1, Math.max(0, focusIndex));
    const target = targetPoints[idx];
    const angle = orbitAngles[Math.min(orbitAngles.length - 1, idx)];
    const cam = controlsRef.current?.object as THREE.PerspectiveCamera | undefined;
    const tgtVec = new THREE.Vector3(...target);
    const currentPos = cam ? cam.position.clone() : tgtVec.clone().add(computeOffset(target, angle));
    const startOffset = currentPos.clone().sub(tgtVec);
    const endOffset = computeOffset(target, angle);

    if (startOffset.length() < 1e-3) {
      startOffset.copy(endOffset);
    } else {
      startOffset.setLength(10);
      startOffset.y = 3;
    }

    startSph.current.setFromVector3(startOffset);
    endSph.current.setFromVector3(endOffset);

    desiredTarget.current.copy(tgtVec);
    desiredPos.current.copy(tgtVec.clone().add(endOffset));
    // snap camera/controls immediately toward this target before animating
    if (cam) {
      cam.position.copy(desiredPos.current);
      cam.lookAt(tgtVec);
    }
    if (controlsRef.current) {
      controlsRef.current.target.copy(tgtVec);
      controlsRef.current.update();
    }
    lerpPos.current.copy(desiredPos.current);
    lerpTarget.current.copy(desiredTarget.current);
    animateCam.current = true;
    animT.current = 0;
  }, [focusIndex, targetPoints]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      userDragging.current = true;
    };
    const onEnd = () => {
      userDragging.current = false;
      // lock desired to user-chosen camera/target
      desiredPos.current.copy(controls.object.position);
      desiredTarget.current.copy(controls.target);
      lerpPos.current.copy(desiredPos.current);
      lerpTarget.current.copy(desiredTarget.current);
      animateCam.current = false;
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);
    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
    };
  }, []);

  function CameraFollow() {
    const { camera } = useThree();
    useFrame((_, delta) => {
      if (userDragging.current) return;
      if (!animateCam.current) return;
      animT.current = Math.min(1, animT.current + delta / 1.0); // ~1s
      const eased = 1 - Math.pow(1 - animT.current, 3);
      const tgtVec = desiredTarget.current.clone();
      const sph = new THREE.Spherical().copy(startSph.current);
      sph.radius = THREE.MathUtils.lerp(startSph.current.radius, endSph.current.radius, eased);
      sph.phi = THREE.MathUtils.lerp(startSph.current.phi, endSph.current.phi, eased);
      sph.theta = THREE.MathUtils.lerp(startSph.current.theta, endSph.current.theta, eased);
      const orbitVec = new THREE.Vector3().setFromSpherical(sph);

      camera.position.copy(tgtVec.clone().add(orbitVec));
      lerpTarget.current.copy(tgtVec);
      camera.lookAt(tgtVec);
      if (controlsRef.current) {
        controlsRef.current.target.copy(tgtVec);
        controlsRef.current.update();
      }
      if (animT.current >= 0.999) {
        animateCam.current = false;
      }
    });
    return null;
  }

  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 2]}
      camera={{ position: computeCameraPos(targetPoints[0]), fov: 35, near: 0.1, far: 400 }}
    >
      <color attach="background" args={["#06080d"]} />
      <ambientLight intensity={0.5} color="#cfe8ff" />
      <directionalLight
        position={[18, 24, 14]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0008}
        shadow-camera-near={5}
        shadow-camera-far={120}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <pointLight position={[-14, 12, -10]} intensity={0.8} color="#6bd6ff" />
      <Suspense fallback={<LoadingOverlay />}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]} receiveShadow>
          <planeGeometry args={[240, 240]} />
          <meshStandardMaterial color="#0c0f14" metalness={0.08} roughness={0.85} />
        </mesh>
        <CityModel path="/models/city_pack_3.glb" position={pos3} rotation={rot3} mode={mode} />
        {basePoints.map((pt, idx) => (
          <mesh key={`base-${idx}`} position={pt}>
            <sphereGeometry args={[0.01, 10, 10]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
          </mesh>
        ))}
        {currentMarker && (
          <mesh position={currentMarker}>
            <sphereGeometry args={[0.02, 12, 12]} />
            <meshStandardMaterial color="#7df9ff" emissive="#7df9ff" emissiveIntensity={1} />
          </mesh>
        )}
        {savedPoints?.map((pt, idx) => (
          <mesh key={`saved-${idx}`} position={pt}>
            <sphereGeometry args={[0.015, 12, 12]} />
            <meshStandardMaterial color="#ffcc66" emissive="#ffcc66" emissiveIntensity={0.8} />
          </mesh>
        ))}
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        enablePan
      />
      <CameraFollow />
    </Canvas>
  );
}

useGLTF.preload("/models/city_pack_3.glb");
