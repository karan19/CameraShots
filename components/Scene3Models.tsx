"use client";

import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type RevealMode = "grow" | "clip";
type Vec3 = [number, number, number];
type Scene3Props = { mode: RevealMode; pos3: Vec3; rot3: Vec3 };
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

export default function Scene3Models({ mode, pos3, rot3 }: Scene3Props) {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 2]}
      camera={{ position: [8, 6, 9], fov: 35, near: 0.1, far: 400 }}
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
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0, 0]} />
    </Canvas>
  );
}

useGLTF.preload("/models/city_pack_3.glb");
