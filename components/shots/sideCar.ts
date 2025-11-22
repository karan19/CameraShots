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
const tmpLook = new THREE.Vector3();
const resultPosition = new THREE.Vector3();
const resultLookAt = new THREE.Vector3();

export function computeSideCarShot(curve: THREE.CatmullRomCurve3, offset: number): ShotResult {
  const t = offset % 1;
  const point = curve.getPointAt(t);
  tmpTangent.copy(curve.getTangentAt(t)).normalize();

  tmpBinormal.crossVectors(tmpTangent, UP);
  if (tmpBinormal.lengthSq() < 1e-6) tmpBinormal.set(1, 0, 0);
  tmpBinormal.normalize();
  tmpNormal.crossVectors(tmpBinormal, tmpTangent).normalize();

  tmpWheel.copy(point).addScaledVector(tmpNormal, 0.18);

  const lateral = 1.1; // right side
  const height = 0.14; // near ground
  const forward = -0.1; // slight trailing

  resultPosition
    .copy(point)
    .addScaledVector(tmpBinormal, lateral)
    .addScaledVector(tmpNormal, height)
    .addScaledVector(tmpTangent, forward);

  tmpLook
    .copy(tmpWheel)
    .addScaledVector(tmpTangent, 0.4)
    .addScaledVector(tmpBinormal, -0.3)
    .addScaledVector(tmpNormal, -0.04);

  resultLookAt.copy(tmpLook);
  return { position: resultPosition, lookAt: resultLookAt };
}
