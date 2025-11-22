import * as THREE from "three";

export type ShotResult = {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

const UP = new THREE.Vector3(0, 1, 0);

const tmpTangent = new THREE.Vector3();
const tmpBinormal = new THREE.Vector3();
const tmpNormal = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpP0 = new THREE.Vector3();
const tmpP1 = new THREE.Vector3();
const tmpP2 = new THREE.Vector3();
const tmpCamPoint = new THREE.Vector3();
const tmpCamTangent = new THREE.Vector3();
const tmpCamBinormal = new THREE.Vector3();
const tmpCamNormal = new THREE.Vector3();

const resultPosition = new THREE.Vector3();
const resultLookAt = new THREE.Vector3();

export function computeTrackOrbitShot(curve: THREE.CatmullRomCurve3, offset: number): ShotResult {
  const ballT = offset % 1;
  const targetPoint = curve.getPointAt(ballT);
  tmpTangent.copy(curve.getTangentAt(ballT)).normalize();

  tmpBinormal.crossVectors(tmpTangent, UP);
  if (tmpBinormal.lengthSq() < 1e-6) tmpBinormal.set(1, 0, 0);
  tmpBinormal.normalize();
  tmpNormal.crossVectors(tmpBinormal, tmpTangent).normalize();

  const phase1End = 0.06;
  const phase2End = 0.18;
  if (offset < phase1End) {
    const distance = 2.2;
    const height = 0.1;
    resultPosition
      .copy(targetPoint)
      .addScaledVector(tmpTangent, -distance)
      .addScaledVector(tmpNormal, height);

    resultLookAt.copy(curve.getPointAt(Math.min(ballT + 0.16, 1)));
    return { position: resultPosition, lookAt: resultLookAt };
  }

  if (offset < phase2End) {
    const alpha = THREE.MathUtils.clamp((offset - phase1End) / (phase2End - phase1End), 0, 1);

    tmpP0
      .copy(targetPoint)
      .addScaledVector(tmpTangent, -1.0)
      .addScaledVector(tmpNormal, 0.16)
      .addScaledVector(tmpBinormal, 0.08);

    tmpP1
      .copy(targetPoint)
      .addScaledVector(tmpTangent, 0.08)
      .addScaledVector(tmpBinormal, 0.24)
      .addScaledVector(tmpNormal, 0.24);

    tmpP2
      .copy(targetPoint)
      .addScaledVector(tmpTangent, 0.42)
      .addScaledVector(tmpBinormal, 0.14)
      .addScaledVector(tmpNormal, 0.18);

    const inv = 1 - alpha;
    resultPosition
      .set(0, 0, 0)
      .addScaledVector(tmpP0, inv * inv)
      .addScaledVector(tmpP1, 2 * inv * alpha)
      .addScaledVector(tmpP2, alpha * alpha);

    resultLookAt.copy(curve.getPointAt(Math.min(ballT + 0.28, 1)));
    return { position: resultPosition, lookAt: resultLookAt };
  }

  const lead = 0.14;
  const camT = Math.min(ballT + lead, 1);
  const lookT = Math.min(camT + 0.22, 1);

  tmpCamPoint.copy(curve.getPointAt(camT));
  tmpCamTangent.copy(curve.getTangentAt(camT)).normalize();
  tmpCamBinormal.copy(tmpCamTangent).cross(UP);
  if (tmpCamBinormal.lengthSq() < 1e-6) tmpCamBinormal.set(1, 0, 0);
  tmpCamBinormal.normalize();
  tmpCamNormal.copy(tmpCamBinormal).cross(tmpCamTangent).normalize();

  const distance = 2.0;
  const height = 0.12;
  tmpDir
    .copy(tmpCamTangent)
    .multiplyScalar(-0.35)
    .add(tmpCamNormal.clone().multiplyScalar(height));

  resultPosition.copy(tmpCamPoint).add(tmpDir);
  resultLookAt.copy(curve.getPointAt(lookT));
  return { position: resultPosition, lookAt: resultLookAt };
}
