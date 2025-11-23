"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export type VariationMode =
  | "wave-z"
  | "radial"
  | "diagonal"
  | "spiral"
  | "clusters"
  | "jitter"
  | "color-beats"
  | "fly-in"
  | "night"
  | "looping";

type Props = {
  mode: VariationMode;
};

function Floor({ night }: { night: boolean }) {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color={night ? "#0a0f16" : "#ffffff"} metalness={0} roughness={0.1} />
    </mesh>
  );
}

function Lights({ night }: { night: boolean }) {
  return (
    <>
      <ambientLight intensity={night ? 0.35 : 0.6} color={night ? "#8cf0ff" : "#ffffff"} />
      <spotLight
        color={night ? "#7df9ff" : "#ffffff"}
        position={[100, 150, 100]}
        intensity={night ? 1.4 : 1}
        castShadow
        angle={0.4}
        penumbra={0.4}
      />
      <pointLight color={night ? "#00e6ff" : "#00ff00"} intensity={night ? 3.5 : 4} position={[18, 22, -9]} />
      <pointLight color={night ? "#ff3ad7" : "#00aaff"} intensity={night ? 3 : 3} position={[-24, 18, 14]} />
    </>
  );
}

function BuildingsWave({ mode }: { mode: VariationMode }) {
  const raw = useLoader(OBJLoader, "/models/buildings.obj");
  const camera = useThree((state) => state.camera);
  const group = useMemo(() => new THREE.Group(), []);
  const materialRef = useRef(
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0.58,
      emissive: "#000000",
      roughness: 0.18
    })
  );
  const models = useMemo(() => {
    return raw.children
      .map((child) => {
        const mesh = child.clone() as THREE.Mesh;
        mesh.scale.setScalar(0.01);
        mesh.position.set(0, -14, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      })
      .filter(Boolean);
  }, [raw]);

  const [buildings, setBuildings] = useState<THREE.Mesh[]>([]);
  const tweensRef = useRef<gsap.core.Tween[]>([]);
  const loopTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!models.length) return;
    group.clear();
    const clones: THREE.Mesh[] = [];
    const gridSize = 40;
    const boxSize = 3;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const base = models[Math.floor(Math.random() * models.length)];
        const building = base.clone();
        building.material = materialRef.current;
        building.position.set(i * boxSize, base.position.y, j * boxSize);
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        clones.push(building);
      }
    }

    group.position.set(-gridSize - 10, 1, -gridSize - 10);
    setBuildings(clones);
  }, [group, models]);

  useEffect(() => {
    const material = materialRef.current;

    if (mode === "night") {
      material.color.set("#7df9ff");
      material.emissive.set("#0a2a36");
      material.metalness = 0.2;
      material.roughness = 0.35;
    } else if (mode === "color-beats") {
      material.color.set("#ffffff");
      material.emissive.set("#0050ff");
      material.metalness = 0.5;
      material.roughness = 0.2;
    } else {
      material.color.set("#ffffff");
      material.emissive.set("#000000");
      material.metalness = 0.58;
      material.roughness = 0.18;
    }
  }, [mode]);

  useEffect(() => {
    if (!buildings.length) return;

    tweensRef.current.forEach((t) => t.kill());
    tweensRef.current = [];
    if (loopTweenRef.current) {
      loopTweenRef.current.kill();
      loopTweenRef.current = null;
    }

    buildings.forEach((b) => {
      gsap.killTweensOf(b.position);
      gsap.set(b.position, { y: -14 });
    });

    const list = [...buildings];
    if (["wave-z", "night", "color-beats", "fly-in", "looping"].includes(mode)) {
      list.sort((a, b) => a.position.z - b.position.z).reverse();
    }

    const center = new THREE.Vector2(0, 0);
    const delays: number[] = [];

    const getDelay = (b: THREE.Mesh, index: number) => {
      if (mode === "radial") {
        const p = new THREE.Vector2(b.position.x, b.position.z).sub(center);
        return p.length() * 0.04;
      }
      if (mode === "diagonal") return (b.position.x + b.position.z) * 0.02;
      if (mode === "spiral") {
        const angle = Math.atan2(b.position.z, b.position.x) + Math.PI;
        const norm = angle / (Math.PI * 2);
        const r = Math.sqrt(b.position.x * b.position.x + b.position.z * b.position.z);
        return norm * 1.2 + r * 0.01;
      }
      if (mode === "clusters") {
        const cluster = Math.floor(b.position.x / 6) + Math.floor(b.position.z / 6);
        return cluster * 0.12 + (index % 5) * 0.02;
      }
      if (mode === "looping") return index * 0.002;
      return index / 350;
    };

    const getDuration = (index: number) => {
      if (mode === "looping") return 0.25;
      if (mode === "spiral") return 0.5 + index * 0.0005;
      return 0.3 + index / 350;
    };

    const runWave = () => {
      list.forEach((building, idx) => {
        const delay = getDelay(building, idx);
        const duration = getDuration(idx);
        delays[idx] = delay;
        const tween = gsap.to(building.position, {
          y: 1,
          duration,
          delay,
          ease: "power3.out"
        });
        tweensRef.current.push(tween);
      });

      if (mode === "jitter") {
        tweensRef.current.push(
          gsap.to(list, {
            y: "+=0.25",
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: Math.max(...delays, 0)
          })
        );
      }

      if (mode === "color-beats") {
        tweensRef.current.push(
          gsap.to(materialRef.current.emissive, {
            r: 0.2,
            g: 0.1,
            b: 0.6,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          })
        );
      }
    };

    runWave();

    if (mode === "looping") {
      const repeatDelay = Math.max(...delays, 0) + 1.0;
      loopTweenRef.current = gsap.delayedCall(repeatDelay, () => {
        buildings.forEach((b) => gsap.set(b.position, { y: -14 }));
        runWave();
      });
      loopTweenRef.current.repeat(-1);
    }

    return () => {
      tweensRef.current.forEach((t) => t.kill());
      tweensRef.current = [];
      if (loopTweenRef.current) loopTweenRef.current.kill();
    };
  }, [buildings, mode]);

  useEffect(() => {
    if (mode === "spiral" || mode === "fly-in") {
      gsap.to(camera.position, {
        x: 20,
        y: 24,
        z: 130,
        duration: 6,
        ease: "sine.inOut",
        repeat: mode === "spiral" ? -1 : 0,
        yoyo: mode === "spiral"
      });
    } else {
      gsap.to(camera.position, { x: 3, y: 16, z: 111, duration: 1.2, ease: "power2.out" });
    }
  }, [camera, mode]);

  useFrame((state) => {
    if (mode === "spiral") {
      const t = state.clock.getElapsedTime() * 0.08;
      const radius = 120;
      camera.position.x = Math.cos(t) * radius;
      camera.position.z = Math.sin(t) * radius;
      camera.position.y = 24;
      camera.lookAt(0, 0, 0);
    }
  });

  return <primitive object={group} />;
}

export default function BuildingWaveScene({ mode }: Props) {
  const night = mode === "night";
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 2]}
      camera={{ fov: 20, near: 1, far: 1000, position: [3, 16, 111] }}
    >
      <color attach="background" args={[night ? "#02050b" : "#ffffff"]} />
      <Suspense
        fallback={
          <Html center className={night ? "text-white" : "text-black"}>
            Loading buildings...
          </Html>
        }
      >
        <Lights night={night} />
        <Floor night={night} />
        <BuildingsWave mode={mode} />
      </Suspense>
      <OrbitControls enablePan enableZoom enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
