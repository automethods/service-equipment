import * as T from './vendor/three/three.module.min.js';
import { exercises } from './balance.js';

const { clamp, lerp, smoothstep, euclideanModulo } = T.MathUtils;
const fullTurn = 2 * Math.PI;
const up = new T.Vector3(0, 1, 0);
const { diameter: rimDiameter, width: rimWidth } = exercises.guided.rim;
const flat = new T.Quaternion().setFromEuler(new T.Euler(-Math.PI / 2, 0, 0));
const upright = new T.Quaternion().setFromAxisAngle(up, Math.PI / 2);
const flipped = new T.Quaternion().setFromAxisAngle(up, -Math.PI / 2);
const removalLift = .250;

// The rubber mesh is the original wheel's tyre component. Its coordinates are in the
// undeformed wheel frame, with the outboard bead on the positive axial side.
function prepareRubber(mesh) {
  mesh.geometry = mesh.geometry.clone();
  const position = mesh.geometry.attributes.position;
  position.setUsage(T.DynamicDrawUsage);
  const vertices = [...new Set(mesh.geometry.index.array)].map(index => {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    return { index, x, y, z, radius: Math.hypot(x, y), angle: Math.atan2(y, x) };
  });
  mesh.frustumCulled = false;
  return { mesh, position, vertices };
}

function liftedArc(progress, sector) {
  if (progress === 0 || progress === 1) return progress;
  const sweep = angle => smoothstep(angle, -.43, .20)
    * (1 - smoothstep(angle - progress * fullTurn, -.18, .59));
  // Blend across the angular seam so the sidewall follows a continuous arc.
  const arc = Math.max(sweep(sector), sweep(sector - fullTurn), sweep(sector + fullTurn));
  return lerp(arc, 1, smoothstep(progress, .92, 1));
}

function flexRubber(rubber, pose) {
  const { position, vertices, mesh } = rubber;
  const { press, pressSide, pressAngle, peelAngle, outerLoose, innerLoose, top, bottom, radial, axial } = pose;
  const key = [press, press && pressSide, press && pressAngle, outerLoose, innerLoose, top, bottom,
    (top > 0 && top < 1 || bottom > 0 && bottom < 1) && peelAngle].join(':');
  if (rubber.lastShape === key) return;
  rubber.lastShape = key;
  const released = smoothstep(bottom, .76, 1);
  const casingLift = lerp(.145 * smoothstep(bottom, .12, .82), removalLift, released);
  for (const { index, x, y, z, radius, angle } of vertices) {
    const side = Math.sign(z);
    const flank = smoothstep(Math.abs(z), .022, .095);
    const bead = 1 - smoothstep(radius, .232, .278);
    const sidewall = 1 - smoothstep(radius, .258, .308);
    const loose = side > 0 ? outerLoose : innerLoose;
    const squeeze = side === pressSide ? press * Math.max(0, Math.cos(angle - pressAngle)) ** 8 : 0;
    const sector = euclideanModulo(angle - peelAngle, fullTurn);
    const lifted = liftedArc(side > 0 ? top : bottom, sector);
    // The bead moves out over the flange before rising. The shoulder blends into the tread.
    const expansion = smoothstep(lifted, 0, .58) * flank * bead * (1 - released);
    const flex = smoothstep(lifted, .28, 1) * flank * sidewall * (1 - released);
    const narrow = (.009 + .006 * bead) * loose * (1 - released) + .015 * squeeze * sidewall;
    const radiusDelta = .028 * expansion;
    const heightDelta = casingLift + (side > 0 ? .041 : .077) * flex - side * flank * narrow;
    const stretch = 1 + radiusDelta / radius;
    position.setXYZ(index, x * stretch * radial, y * stretch * radial, z * axial + heightDelta);
  }
  position.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

export function makeTyreChanger() {
  const machine = new T.Group();
  const carrier = new T.Group();
  const wheel = new T.Group();
  machine.add(carrier);
  carrier.add(wheel);
  return { machine, carrier, wheel, parked: new T.Vector3(-.79, .117, .61) };
}

function poseInterval(times, progress) {
  const end = times.findIndex((time, i) => i > 0 && time >= progress);
  const index = end < 0 ? times.length - 2 : end - 1;
  const amount = clamp((progress - times[index]) / (times[index + 1] - times[index]), 0, 1);
  return [index, amount];
}

function setPose(part, progress) {
  const { node, poses, times } = part;
  const [index, amount] = poseInterval(times, progress);
  const start = poses[index];
  const end = poses[index + 1];
  node.position.lerpVectors(start.position, end.position, amount);
  node.quaternion.slerpQuaternions(start.rotation, end.rotation, amount);
  node.scale.lerpVectors(start.scale, end.scale, amount);
}

export function attachChangerRig(changer, model) {
  const find = name => {
    const node = model.getObjectByName('Changer' + name);
    if (!node) throw new Error('Missing tyre changer part: ' + name);
    return node;
  };
  changer.machine.add(model);
  const poses = [];
  model.traverse(node => {
    const { motionPoses: samples, poseGroup, midProgress, poseTimes } = node.userData;
    if (!samples) return;
    const frames = [];
    for (let i = 0; i < samples.length; i += 10) {
      frames.push({
        position: new T.Vector3().fromArray(samples, i),
        rotation: new T.Quaternion().fromArray(samples, i + 3),
        scale: new T.Vector3().fromArray(samples, i + 7),
      });
    }
    const times = poseTimes ?? (frames.length === 2 ? [0, 1] : [0, midProgress ?? .55, 1]);
    poses.push({ node, group: poseGroup, poses: frames, times });
  });
  const location = node => changer.machine.worldToLocal(node.getWorldPosition(new T.Vector3()));
  const headContact = find('HeadContact');
  for (const part of poses) setPose(part, ['swing', 'head', 'lock'].includes(part.group) ? 1 : 0);
  const workHead = location(headContact);
  for (const part of poses) setPose(part, 0);
  const table = find('Table');
  const { wheelSeating } = model.getObjectByName('UkrainianTyreChanger').userData;
  const seating = [];
  for (let i = 0; i < wheelSeating.length; i += 5) {
    seating.push({ at: wheelSeating[i], position: new T.Vector3().fromArray(wheelSeating, i + 1), tilt: wheelSeating[i + 4] });
  }
  changer.rig = {
    table, tableRest: table.quaternion.clone(), swing: find('Swing'), head: find('Head'), breaker: find('Breaker'),
    iron: find('Iron'), brush: find('Brush'), poses, headContact, workHead, seating, seatingTimes: seating.map(pose => pose.at),
    shoeContact: find('ShoeContact'), sideSocket: location(find('SideSocket')), tableSocket: location(find('TableSocket')),
  };
}

export function attachChangerWheel(changer, model) {
  const rim = model.getObjectByName('WheelRim')?.clone();
  const tyre = model.getObjectByName('TyreRubber')?.clone();
  if (!rim || !tyre) throw new Error('The wheel needs separate rim and tyre geometry.');
  changer.rim = rim;
  changer.rubber = prepareRubber(tyre);
  changer.wheel.add(rim, tyre);
}

export function updateTyreChanger(changer, state, now) {
  const { rig, wheel, carrier, rim, rubber } = changer;
  carrier.visible = Boolean(rim && rig);
  if (!rim || !rig) return false;

  const { step, motion } = state;
  const time = motion ? clamp((now - motion.start) / motion.duration, 0, 1) : 0;
  const key = `${step}:${motion?.action ?? ''}:${time}`;
  if (changer.lastPose === key) return false;
  changer.lastPose = key;
  const radial = (rimDiameter * .0127 + .1) / .316;
  const axial = rimWidth / 7.5;
  const tableY = rig.tableSocket.y - .087 + .113 * axial;
  const side = rig.sideSocket.clone().setY(.319 * radial);
  const table = rig.tableSocket.clone().setY(tableY);
  const action = motion?.action;
  let jawClosure = 0;
  let turn = 0;
  let guide = 0;
  let press = 0;
  let pressSide = 1;
  let outerLoose = step === 'empty' || step === 'loaded' ? 0 : 1;
  let innerLoose = outerLoose;
  let top = 0;
  let bottom = 0;
  let setAside = 0;
  carrier.position.copy(step === 'empty' ? changer.parked : side);
  carrier.quaternion.copy(step === 'empty' ? flat : step === 'loaded' ? upright : flipped);
  if (action === 'tyre-load') {
    const front = new T.Vector3(.65, .33, .68);
    const carry = smoothstep(time, 0, .66);
    const approach = smoothstep(time, .66, 1);
    carrier.position.copy(changer.parked).lerp(front, carry);
    carrier.position.z += .20 * Math.sin(Math.PI * carry);
    carrier.position.y += .15 * Math.sin(Math.PI * carry);
    carrier.position.lerp(side, approach);
    carrier.quaternion.copy(flat).slerp(upright, smoothstep(time, .48, .94));
  } else if (action === 'tyre-break') {
    const flip = smoothstep(time, .38, .60);
    carrier.quaternion.copy(upright).slerp(flipped, flip);
    carrier.position.x += .13 * Math.sin(Math.PI * flip);
    carrier.position.y += .03 * Math.sin(Math.PI * flip);
    pressSide = time < .5 ? 1 : -1;
    const cycle = pressSide > 0 ? time : time - .60;
    press = smoothstep(cycle, .02, .15) * (1 - smoothstep(cycle, .24, .35));
    outerLoose = smoothstep(time, .09, .27);
    innerLoose = smoothstep(time, .69, .87);
  } else if (action === 'tyre-clamp') {
    const travel = clamp(time / .77, 0, 1);
    const [index, amount] = poseInterval(rig.seatingTimes, travel);
    const from = rig.seating[index];
    const to = rig.seating[index + 1];
    const tilt = lerp(from.tilt, to.tilt, amount);
    carrier.position.lerpVectors(from.position, to.position, amount);
    carrier.position.y += lerp(side.y - rig.seating[0].position.y, tableY - rig.tableSocket.y, tilt);
    carrier.quaternion.copy(flipped).slerp(flat, tilt);
    jawClosure = smoothstep(time, .76, 1);
  } else if (['clamped', 'lubricated', 'upper', 'removed'].includes(step)) {
    carrier.position.copy(table);
    carrier.quaternion.copy(flat);
    jawClosure = 1;
    top = step === 'upper' || step === 'removed' ? 1 : 0;
    bottom = step === 'removed' ? 1 : 0;
    setAside = step === 'removed' ? 1 : 0;
    guide = step === 'upper' ? 1 : 0;
    if (action === 'tyre-turn') {
      const turnStart = step === 'upper' ? .22 : .36;
      const travel = smoothstep(time, turnStart, step === 'upper' ? .77 : .95);
      const rotation = travel * fullTurn;
      turn = -rotation;
      const progress = .045 * smoothstep(time, turnStart - .12, turnStart) + .955 * travel;
      guide = step === 'upper' ? 1 : clamp(time / .26, 0, 1);
      if (step === 'lubricated') top = progress;
      else {
        bottom = progress;
        setAside = smoothstep(time, .77, 1);
        guide *= 1 - smoothstep(time, .78, .92);
      }
    } else if (step === 'upper') guide = 1;
  }

  const ironProgress = action === 'tyre-turn' ? (step === 'upper'
    ? smoothstep(time, .06, .22) * (1 - smoothstep(time, .31, .46))
    : smoothstep(time, .22, .36) * (1 - smoothstep(time, .48, .65))) : 0;
  const rise = tableY + .113 * axial - rig.tableSocket.y - .087;
  const progress = {
    breaker: press, clamp: jawClosure, swing: guide, head: guide, lock: guide, iron: ironProgress,
    paste: action === 'tyre-paste' ? time : 0,
    clampPedal: action === 'tyre-clamp' ? Math.sin(Math.PI * smoothstep(time, .75, 1)) : 0,
    turnPedal: action === 'tyre-turn' ? smoothstep(time, .22, .36) * (1 - smoothstep(time, .80, 1)) : 0,
  };
  for (const part of rig.poses) {
    setPose(part, progress[part.group]);
    if (part.group === 'head') part.node.position.y += rise * smoothstep(guide, .38, 1);
  }
  if (action === 'tyre-paste') {
    const atBead = smoothstep(time, .05, .27) * (1 - smoothstep(time, .55, .85));
    rig.brush.position.x *= 1 + .15 * atBead;
    rig.brush.position.z *= 1 + .15 * atBead;
    rig.brush.position.y += atBead * rise;
  }
  rig.table.quaternion.copy(rig.tableRest);
  rig.table.rotateY(turn);
  rig.swing.rotateY((.2486 * radial - .207) / .48 * guide);
  const head = changer.machine.worldToLocal(rig.headContact.getWorldPosition(new T.Vector3()));
  const ironOffset = head.clone().sub(rig.workHead).multiplyScalar(smoothstep(ironProgress, 0, .55));
  if (ironProgress > 0) {
    changer.machine.localToWorld(ironOffset.add(changer.machine.worldToLocal(rig.iron.getWorldPosition(new T.Vector3()))));
    rig.iron.position.copy(rig.iron.parent.worldToLocal(ironOffset));
  }
  const contact = carrier.worldToLocal(rig.shoeContact.getWorldPosition(new T.Vector3()));
  const pressAngle = Math.atan2(contact.y, contact.x);
  const peelAngle = Math.atan2(-head.z, head.x);
  wheel.rotation.z = turn;
  rim.scale.set(radial, radial, axial);

  const lowerToFloor = smoothstep(setAside, .34, 1);
  rubber.mesh.position.set(.96 * setAside, .39 * setAside, (.113 * axial - tableY - removalLift) * lowerToFloor);
  rubber.mesh.rotation.z = 0;
  // The tyre travels clear of the rim before settling back to floor height.
  if (setAside > 0) rubber.mesh.position.z += .11 * Math.sin(Math.PI * setAside);
  flexRubber(rubber, { press, pressSide, pressAngle, peelAngle, outerLoose, innerLoose, top, bottom, radial, axial });
  return Boolean(motion && time < 1);
}
