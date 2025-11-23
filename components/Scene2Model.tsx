"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

type RevealMode = "grow" | "clip";

function LoadedModel({ mode }: { mode: RevealMode }) {
  const raw = useLoader(OBJLoader, "/models/CooperUnion.obj");
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const progressRef = useRef(0);
  const baseScaleRef = useRef(1);
  const heightRef = useRef(1);
  const clipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const { gl } = useThree();

  const scene = useMemo(() => {
    const clone = raw.clone() as THREE.Group;
    const material = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0.4,
      roughness: 0.2,
      emissive: "#0a0a0a"
    });

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = material;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    materialRef.current = material;
    return clone;
  }, [raw]);

  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const desiredSize = 16;
    const scale = desiredSize / maxDim;
    baseScaleRef.current = scale;
    heightRef.current = size.y * scale;

    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.sub(center.multiplyScalar(scale));

    // recenter so base sits on the ground
    const centeredBox = new THREE.Box3().setFromObject(groupRef.current);
    groupRef.current.position.y -= centeredBox.min.y;
  }, [scene]);

  useEffect(() => {
    elapsedRef.current = 0;
    progressRef.current = 0;
    if (materialRef.current) {
      if (mode === "clip") {
        gl.localClippingEnabled = true;
        materialRef.current.clippingPlanes = [clipPlaneRef.current];
      } else {
        gl.localClippingEnabled = false;
        materialRef.current.clippingPlanes = [];
      }
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
      const speed = 0.5; // seconds to full reveal ~2s
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
        const start = -heightRef.current - 2; // fully below model
        const end = 0; // base level
        plane.constant = start + (end - start) * built;
      }
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return <primitive ref={groupRef} object={scene} />;
}

export default function Scene2Model({ mode }: { mode: RevealMode }) {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 2]}
      camera={{ position: [14, 12, 18], fov: 35, near: 0.1, far: 200 }}
    >
      <color attach="background" args={["#050608"]} />
      <ambientLight intensity={0.45} color="#8fd6ff" />
      <directionalLight position={[12, 18, 10]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[-10, 10, -6]} intensity={0.8} color="#6bd6ff" />
      <Suspense
        fallback={
          <Html center className="text-white">
            Loading model...
          </Html>
        }
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#0c0f14" metalness={0.1} roughness={0.8} />
        </mesh>
        <LoadedModel mode={mode} />
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
