"use client";

import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type RevealMode = "grow" | "clip";
type Props = { mode: RevealMode; modelPath: string };

function LoadedModel({ mode, modelPath }: Props) {
  const { scene: gltfScene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const progressRef = useRef(0);
  const baseScaleRef = useRef(1);
  const heightRef = useRef(1);
  const clipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const materialsRef = useRef<THREE.Material[]>([]);
  const { gl } = useThree();

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
        } else if (mesh.material) {
          mesh.material = mapMaterial(mesh.material as THREE.Material);
        } else {
          mesh.material = mapMaterial();
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
    const desiredSize = 22;
    const scale = desiredSize / maxDim;
    baseScaleRef.current = scale;
    heightRef.current = size.y * scale;

    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.sub(center.multiplyScalar(scale));

    // Recenter so the model sits on the ground
    const centeredBox = new THREE.Box3().setFromObject(groupRef.current);
    groupRef.current.position.y -= centeredBox.min.y;
  }, [scene]);

  useEffect(() => {
    elapsedRef.current = 0;
    progressRef.current = 0;
    materialsRef.current.forEach((mat) => {
      const materialArray = Array.isArray(mat) ? mat : [mat];
      materialArray.forEach((m) => {
        const material = m as THREE.Material & { clippingPlanes?: THREE.Plane[] };
        if (mode === "clip") {
          gl.localClippingEnabled = true;
          material.clippingPlanes = [clipPlaneRef.current];
        } else {
          gl.localClippingEnabled = false;
          material.clippingPlanes = [];
        }
      });
    });
    if (!materialsRef.current.length) {
      gl.localClippingEnabled = false;
    }
  }, [gl, mode]);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (mode === "grow") {
      const floors = 12;
      const perFloor = 0.18;
      const builtFloors = Math.min(floors, Math.floor(elapsedRef.current / perFloor));
      progressRef.current = builtFloors / floors;
    } else {
      const speed = 0.45; // seconds to full reveal ~2.2s
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
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return <primitive ref={groupRef} object={scene} />;
}

function LoadingOverlay({ modelPath }: { modelPath: string }) {
  const { progress, active } = useProgress();
  const [visible, setVisible] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState(modelPath);

  useEffect(() => {
    setCurrentPath(modelPath);
    setVisible(true);
  }, [modelPath]);

  useEffect(() => {
    if (active) return;
    const t = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(t);
  }, [active]);

  if (!visible) return null;
  const pct = active ? progress : 100;
  const label = currentPath.split("/").pop() ?? "Model";

  return (
    <Html position={[0, 0, 0]} fullscreen zIndexRange={[20, 30]}>
      <div className="pointer-events-none absolute left-1/2 top-4 w-64 -translate-x-1/2 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-white shadow-lg backdrop-blur">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Loading {label}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        {!active && (
          <div className="mt-1 text-[11px] text-white/60" aria-live="polite">
            Loaded
          </div>
        )}
      </div>
    </Html>
  );
}

export default function Scene1Model({ mode, modelPath }: Props) {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 2]}
      camera={{ position: [18, 14, 20], fov: 35, near: 0.1, far: 400 }}
    >
      <color attach="background" args={["#06080d"]} />
      <ambientLight intensity={0.45} color="#b8dfff" />
      <directionalLight
        position={[16, 22, 12]}
        intensity={1.4}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0008}
        shadow-camera-near={5}
        shadow-camera-far={80}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <pointLight position={[-12, 10, -8]} intensity={0.8} color="#6bd6ff" />
      <Suspense
        fallback={<LoadingOverlay modelPath={modelPath} />}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#0c0f14" metalness={0.08} roughness={0.85} />
        </mesh>
        <LoadedModel key={modelPath} mode={mode} modelPath={modelPath} />
      </Suspense>
      <LoadingOverlay modelPath={modelPath} />
      <OrbitControls enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

const MODEL_PATHS = [
  "/models/city_pack_3.glb",
  "/models/city_pack_7.glb",
  "/models/city_pack_blur_controlled.glb"
];

MODEL_PATHS.forEach((p) => useGLTF.preload(p));
