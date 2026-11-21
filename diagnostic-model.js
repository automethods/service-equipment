import { horizontalAngles, medianCd } from './measured-low-beams.js';

const radians = Math.PI / 180;
export const lampHeight = .58;
export const lampSeparation = 1.108;
export const dippedSlope = 1;
export const aimTolerance = .15;
export const floorProfile = { distance: 120, laneWidth: 8, footprintWidth: 26, lux: 10, threshold: .2 };
// UMTRI-2019-5, Tables 1 and 2. Sales-weighted median low-beam values at 0° horizontal.
export const measuredDipped = [.5, 0, -.5, -1, -1.5, -2].map(vertical => [
  vertical, measuredIntensity('halogen', 0, vertical), measuredIntensity('led', 0, vertical),
]);
export function measuredIntensity(lamp, horizontal, vertical) {
  const grid = medianCd[lamp];
  if (!grid || horizontal < -25 || horizontal > 25 || vertical < -5 || vertical > 7) return null;
  const col = horizontalAngles.findIndex(angle => angle >= horizontal);
  const left = Math.max(0, col - 1);
  const x = col === left ? 0 : (horizontal - horizontalAngles[left]) / (horizontalAngles[col] - horizontalAngles[left]);
  const v = (7 - vertical) * 2;
  const row = Math.floor(v);
  const at = r => grid[r][left] + (grid[r][col] - grid[r][left]) * x;
  return at(row) + (at(Math.min(row + 1, grid.length - 1)) - at(row)) * (v - row);
}
export function measuredWallLux(candela, vertical, distance) {
  return candela * Math.cos(vertical * radians) ** 3 / distance ** 2;
}
export const lampTypes = {
  halogen: { color: [1, .76, .48], low: [16000, 7.3, 1.8, .19], high: [42000, 5.1, 2.0] },
  xenon: { color: [.88, .94, 1], low: [25500, 8.2, 1.65, .13], high: [45000, 5.0, 1.9], separate: true },
  bixenon: { color: [.91, .96, 1], low: [26500, 8.4, 1.64, .10], high: [76000, 4.1, 1.53] },
  led: { color: [.92, .97, 1], low: [32000, 9.2, 1.53, .07], high: [96000, 3.9, 1.42] },
  laser: { color: [.92, .97, 1], low: [32000, 9.2, 1.53, .07], high: [96000, 3.9, 1.42], boost: [112000, 1.12, .57] },
};

export const lampSides = ['left', 'right'];
export const lampCenter = side => (side === 'right' ? 1 : -1) * lampSeparation / 2;
export const headlampMethod = (route, side) => route === 'split' ? (side === 'left' ? 'rig' : 'wall') : route;
export const freshHeadlamp = () => ({
  stages: { rig: { right: 'position', left: 'position' }, wall: { right: 'position', left: 'position' } },
  aims: { right: { low: [1.15, .95], high: [-.65, .40] }, left: { low: [-.85, -.50], high: [.65, -.35] } },
  side: lampSides[0], route: 'split', method: 'rig', lamp: 'halogen', mode: 'low', lightsOn: false, hoodOpen: false, toolPicked: false, distance: 7.62,
  probe: [0, -.2], presentation: 'rig', adjusting: false, shutdownConfirmed: false, comparisonBeam: null,
});
export const headStage = (head, method, side = head.side) => head.stages[method]?.[side];
export const requiredBeam = stage => ({ dipped: 'low', main: 'high', recheck: 'low' })[stage];
export const aim = (head, mode = head.mode, side = head.side) => head.aims[side][mode === 'high' && lampTypes[head.lamp].separate ? 'high' : 'low'];
export const beamPitchTarget = mode => mode === 'low' ? -Math.atan(dippedSlope / 100) / radians : 0;
export function wallMark(head, mode = head.mode, side = head.side) {
  const [yaw, pitch] = aim(head, mode, side);
  const x = Math.tan(yaw * radians) * head.distance;
  const y = Math.tan((pitch + beamPitchTarget(mode)) * radians) * head.distance;
  return [x, y];
}
export function wallAimTargets(head) {
  const atWall = angle => Math.tan(angle * radians) * head.distance;
  return [0, beamPitchTarget(head.mode)].map(angle => ({
    target: atWall(angle),
    tolerance: (atWall(angle + aimTolerance) - atWall(angle - aimTolerance)) / 2,
  }));
}
export function aimPass(head, mode = head.mode) {
  return pendingAimAxis(head, mode) === -1;
}
export const pendingAimAxis = (head, mode = head.mode) => aim(head, mode).findIndex(angle => Math.abs(angle) > aimTolerance);

export function beamIntensity(id, mode, horizontal, vertical) {
  const profile = lampTypes[id];
  const gaussian = (x, y, width, height) => Math.exp(-.5 * ((x / width) ** 2 + (y / height) ** 2));
  if (mode === 'high') {
    const [peak, width, height] = profile.high;
    const [boost, boostWidth, boostHeight] = profile.boost ?? [0, 1, 1];
    return peak * gaussian(horizontal, vertical, width, height)
      + boost * gaussian(horizontal, vertical, boostWidth, boostHeight);
  }
  const [peak, width, height, edge] = profile.low;
  const upsweep = Math.max(0, Math.min(3, horizontal)) * .245;
  const cutoff = -Math.atan(dippedSlope / 100) / radians + upsweep;
  const mask = 1 / (1 + Math.exp((vertical - cutoff) / edge));
  const hot = gaussian(horizontal - 1.25, vertical + 1.28, width * .57, height * .77);
  const fill = gaussian(horizontal, vertical + 2.35, width, height);
  return peak * (.68 * hot + .35 * fill) * (.008 + .992 * mask);
}

export function wallLux(head, x, y, id = head.lamp, mode = head.mode) {
  const [yaw, pitch] = head.measured ? [0, 0] : aim(id === head.lamp ? head : { ...head, lamp: id }, mode);
  const distance = Math.hypot(head.distance, x, y);
  const horizontal = Math.atan2(x, head.distance) / radians;
  const vertical = Math.atan2(y, Math.hypot(head.distance, x)) / radians;
  const cd = head.measured ? measuredIntensity(id, horizontal, vertical) : beamIntensity(id, mode, horizontal - yaw, vertical - pitch);
  return cd === null ? null : cd * head.distance / distance ** 3;
}

export function roadLux(id, mode, forward, lateral) {
  const distance = Math.hypot(forward, lateral, lampHeight);
  const horizontal = Math.atan2(lateral, forward) / radians;
  const vertical = Math.atan2(-lampHeight, Math.hypot(forward, lateral)) / radians;
  const profile = id === 'laser' ? 'led' : id;
  let intensity;
  if (mode === 'low' && medianCd[profile]) {
    const x = Math.max(-25, Math.min(25, horizontal));
    const y = Math.max(-5, vertical);
    // Continue the measured edge smoothly into the unmeasured foreground and far sides.
    intensity = measuredIntensity(profile, x, y) * Math.exp(-(((horizontal - x) / 7) ** 2 + ((vertical - y) / 4) ** 2));
  } else {
    intensity = beamIntensity(id, mode, horizontal, vertical);
  }
  // A weak, wide foreground component blends into the brighter distance beam.
  // For dipped beams, keep this component below the measured range.
  const foreground = mode === 'high' ? 1 : Math.min(1, Math.max(0, (-5 - vertical) / 2));
  const foregroundWidth = mode === 'high' ? 3.9 : 4.6;
  const spill = Math.exp(-.5 * ((horizontal / 14) ** 2 + ((vertical + 7) / foregroundWidth) ** 2));
  intensity += lampTypes[id][mode][0] * .004 * foreground * spill;
  return intensity * lampHeight / distance ** 3;
}

export function roadPairLux(id, mode, forward, lateral = 0) {
  return roadLux(id, mode, forward, lateral + lampSeparation / 2) + roadLux(id, mode, forward, lateral - lampSeparation / 2);
}

export function roadReach(id, mode) {
  for (let forward = floorProfile.distance; forward > 0; forward -= .25) {
    if (roadPairLux(id, mode, forward) >= floorProfile.threshold) return forward;
  }
  return 0;
}

export const wheels = ['FL', 'FR', 'RL', 'RR'];
// Tesla Model 3 (2017–2023), coil suspension, without ballast, Table 1.
// Positive toe is toe-in. Each axle lists the nominal value and its tolerance.
export const alignmentSpecs = {
  toe: [[.06, .05], [.18, .05]],
  camber: [[-.30, .45], [-.90, 1]],
  caster: [[5.70, 1], null],
};
const splitLimits = { toe: [.10, .10], camber: [.60, .60], caster: [1, null] };
const originalToe = {
  four: [-.32, .43, -.08, .42],
  crossed: [-.32, .43, .17, .18],
  replacement: [.55, .06, .17, .18],
  rear: [.05, .06, -.08, .42],
};
const camber = [-.53, -.68, -1.09, -1.14];

export const freshAlignment = (exercise = 'four') => ({
  exercise, axle: exercise === 'rear' || exercise === 'four' ? 1 : 0, stage: 'prepare', mounts: [], turns: [0, 0, 0, 0], steer: 0, caster: false,
  baseline: null, verified: null, motion: null, axleView: false, rail: 0,
});

export function alignmentReadings(alignment) {
  const toe = originalToe[alignment.exercise].map((value, index) => value + .32 * alignment.turns[index]);
  return {
    toe, camber, frontTotal: toe[0] + toe[1], rearTotal: toe[2] + toe[3],
    thrust: (toe[3] - toe[2]) / 2,
    caster: alignment.caster ? [5.9, 6.12] : null,
  };
}

export function angleVerdict(kind, axle, value) {
  const limits = alignmentSpecs[kind][axle];
  if (value == null || !limits) return null;
  const [target, tolerance] = limits;
  if (value < target - tolerance - 1e-9) return 'increase';
  if (value > target + tolerance + 1e-9) return 'decrease';
  return 'ok';
}

export function alignmentPass(reading) {
  return Object.entries(alignmentSpecs).every(([kind, axles]) =>
    axles.every((limits, axle) => !limits || axleAnglesPass(reading, kind, axle)));
}

export function axleAnglesPass(reading, kind, axle) {
  const left = reading[kind]?.[axle * 2], right = reading[kind]?.[axle * 2 + 1];
  return angleVerdict(kind, axle, left) === 'ok' && angleVerdict(kind, axle, right) === 'ok' &&
    Math.abs(left - right) <= splitLimits[kind][axle] + 1e-9;
}
