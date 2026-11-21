export const bayClearance = 5.5;
const checkRise = 125;
const releaseRise = 1800;
const lockRise = 1760;

export const liftSteps = {
  preflight: { next: 'openArms' },
  openArms: { next: 'driveIn', arms: 'parked', duration: 1250, target: 'lift-arms' },
  driveIn: { next: 'positionPads', carZ: 0, duration: 2500, target: 'lift-car' },
  positionPads: { next: 'raiseToCheck', arms: 'positioned', duration: 1500, target: 'lift-arms' },
  raiseToCheck: { next: 'checkPads', direction: 1, limit: checkRise },
  checkPads: { next: 'raiseToService' },
  raiseToService: { next: 'seatLocks', direction: 1, limit: releaseRise },
  seatLocks: { next: 'clearArea', direction: -1, limit: lockRise },
  clearArea: { next: 'raiseOffLocks', locks: 'seated' },
  raiseOffLocks: { next: 'releaseLocks', direction: 1, limit: releaseRise, locks: 'seated' },
  releaseLocks: { next: 'lowerToFloor', locks: 'unloaded', target: 'lift-lock' },
  lowerToFloor: { next: 'withdrawArms', direction: -1, limit: 0 },
  withdrawArms: { next: 'driveOut', arms: 'parked', duration: 1500, target: 'lift-arms' },
  driveOut: { next: 'done', carZ: bayClearance, duration: 2500, target: 'lift-car' },
  done: {},
};

export function liftLimit(stage, direction, max) {
  if (stage === 'free') return direction > 0 ? max : 0;
  return liftSteps[stage].direction === direction ? liftSteps[stage].limit : null;
}

export function liftJog(stage, height, direction, distance, max) {
  const limit = liftLimit(stage, direction, max);
  if (limit === null) return { stage, height };
  const nextHeight = direction > 0 ? Math.min(limit, height + distance) : Math.max(limit, height - distance);
  return { height: nextHeight, stage: nextHeight === limit && stage !== 'free' ? liftSteps[stage].next : stage };
}
