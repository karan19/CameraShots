import * as THREE from "three";

export type ShotResult = {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

const UP = new THREE.Vector3(0, 1, 0);

const tmpTangent = new THREE.Vector3();
const tmpBinormal = new THREE.Vector3();
const tmpNormal = new THREE.Vector3();
const tmpWheel = new THREE.Vector3();
const resultPosition = new THREE.Vector3();
const resultLookAt = new THREE.Vector3();

export function computeOrbitPauseShot(curve: THREE.CatmullRomCurve3, offset: number): ShotResult {
  const t = offset % 1;
  const point = curve.getPointAt(t);
  tmpTangent.copy(curve.getTangentAt(t)).normalize();

  tmpBinormal.crossVectors(tmpTangent, UP);
  if (tmpBinormal.lengthSq() < 1e-6) tmpBinormal.set(1, 0, 0);
  tmpBinormal.normalize();
  tmpNormal.crossVectors(tmpBinormal, tmpTangent).normalize();

  tmpWheel.copy(point).addScaledVector(tmpNormal, 0.18);

  const radius = 1.1;
  const height = 0.12;
  const angle = offset * Math.PI * 2;

  const dir = tmpBinormal
    .clone()
    .multiplyScalar(Math.cos(angle))
    .add(tmpTangent.clone().multiplyScalar(Math.sin(angle)));

  resultPosition
    .copy(tmpWheel)
    .addScaledVector(dir.normalize(), radius)
    .addScaledVector(tmpNormal, height);
  resultLookAt.copy(tmpWheel);

  return { position: resultPosition, lookAt: resultLookAt };
}
