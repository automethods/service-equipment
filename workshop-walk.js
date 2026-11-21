import { alignmentPit } from './diagnostic-axle.js';

export const workshopFloor = { left: -16, right: 60, rear: -126, front: 20 };
const { x: center, width, rear, front, depth, steps, tread, rise } = alignmentPit;
const left = center - width / 2;
const right = center + width / 2;
const clearance = .12;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function floorPosition(x, z) {
  return { x: clamp(x, workshopFloor.left + clearance, workshopFloor.right - clearance),
    z: clamp(z, workshopFloor.rear + clearance, workshopFloor.front - clearance) };
}

export function insidePit({ x, z }) {
  return x > left && x < right && z >= rear && z < front;
}

export function walkStart(position) {
  const { y } = position;
  let { x, z } = floorPosition(position.x, position.z);
  if (insidePit({ x, z }) && y < 0) x = clamp(x, left + clearance, right - clearance);
  else if (z >= rear && z <= front + clearance && x > left - clearance && x < right + clearance) {
    x = x <= center ? left - clearance : right + clearance;
  }
  return { x, y, z };
}

export function walkStep(position, dx, dz) {
  let { x, z } = floorPosition(position.x + dx, position.z + dz);
  if (insidePit(position)) {
    x = clamp(x, left + clearance, right - clearance);
    z = Math.min(z, front - clearance);
  } else {
    const fromStairs = position.z < rear && x >= left + clearance && x <= right - clearance;
    if (!fromStairs && z >= rear && z <= front + clearance && x > left - clearance && x < right + clearance) {
      if (position.x <= left - clearance) x = left - clearance;
      else if (position.x >= right + clearance) x = right + clearance;
      else z = position.z < rear ? rear - .01 : front + clearance;
    }
  }
  return { x, z };
}

export function walkingEye(position) {
  if (!insidePit(position)) return 1.43;
  const treadIndex = Math.floor((position.z - rear) / tread);
  const surface = treadIndex < steps ? -(treadIndex + 1) * rise : -depth;
  return surface + .87;
}
