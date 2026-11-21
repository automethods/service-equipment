import * as T from './vendor/three/three.module.min.js';
import { alignmentSpecs, angleVerdict, wheels } from './diagnostic-model.js';

const surface = (color, metalness = .55) => new T.MeshStandardMaterial({ color, metalness, roughness: .38 });
const steel = surface(0xb3c2c1), bright = surface(0xe0e7df), brass = surface(0xc58c48);
const boot = surface(0x303c3d, .05), rackPaint = surface(0x526a6b);
const toolPaint = surface(0x3272a3, .25);
const up = new T.Vector3(0, 1, 0);
export const alignmentPit = { x: 8.3, width: .96, rear: -3.45, front: 3.12, depth: 1.52,
  steps: 7, tread: .22, rise: .19 };
export const alignmentRails = { rear: -2.30, front: 2.38, height: .07 };

export function addAlignmentPit(scene) {
  const { x, width, rear, front, depth, steps, tread: stepDepth, rise } = alignmentPit;
  const pit = new T.Group();
  pit.name = 'Alignment inspection pit';
  pit.position.x = x;
  scene.add(pit);
  const concrete = surface(0x475851, .02);
  const tread = surface(0x2e3b36, .02);
  const edge = surface(0xe2b664, .02);
  const curb = surface(0xe5ad3f, .32);
  const light = new T.MeshBasicMaterial({ color: 0xe9f9ea });
  function box([w,h,l], material, px, y, z) {
    const part = new T.Mesh(new T.BoxGeometry(w,h,l), material);
    part.position.set(px,y,z);
    pit.add(part);
  }
  const length = front - rear;
  const middle = (rear + front) / 2;
  box([width, .10, length], tread, 0, -depth - .05, middle);
  for (const side of [-1,1]) {
    box([.09, depth, length], concrete, side * (width / 2 + .045), -depth / 2, middle);
    for (const [from, to, floor] of [
      [rear, alignmentRails.rear, 0],
      [alignmentRails.rear, alignmentRails.front, alignmentRails.height],
      [alignmentRails.front, front, 0],
    ]) box([.047, .05, to - from], curb, side * (width / 2 + .025), floor + .025, (from + to) / 2);
    for (const z of [-1.7, 1.4]) {
      box([.036, .094, .49], tread, side * (width / 2 - .009), -.61, z);
      box([.01, .056, .43], light, side * (width / 2 - .033), -.61, z);
    }
  }
  for (const z of [rear - .045, front + .045]) box([width, depth, .09], concrete, 0, -depth / 2, z);
  for (let step = 1; step <= steps; step++) {
    const height = depth - step * rise;
    const z = rear + (step - .5) * stepDepth;
    box([width, height, stepDepth], tread, 0, -depth + height / 2, z);
    box([width, .009, .025], edge, 0, -step * rise, z + stepDepth / 2 - .016);
  }
  const handrailX = width / 2 - .045;
  const top = new T.Vector3(handrailX, .85, rear - .13);
  const bottom = new T.Vector3(handrailX, .85 - depth, rear + steps * stepDepth + .15);
  bar(pit, top, bottom, .019, steel);
  bar(pit, top, new T.Vector3(handrailX, 0, top.z), .015, steel);
  bar(pit, bottom, new T.Vector3(handrailX, -depth, bottom.z), .015, steel);
}
function cylinder(parent, radius, height, material, y, sides = 24) {
  const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, height, sides), material);
  mesh.position.y = y;
  parent.add(mesh);
  return mesh;
}

function bar(parent, start, end, radius, material) {
  const delta = end.clone().sub(start);
  const part = cylinder(parent, radius, delta.length(), material, 0);
  part.position.copy(start).lerp(end, .5);
  part.quaternion.setFromUnitVectors(up, delta.normalize());
  return part;
}

// A box-end spanner with a hexagonal opening around the flats of the adjuster.
function spanner() {
  const shape = new T.Shape();
  shape.absarc(0, 0, .042, .42, 2 * Math.PI - .42, false);
  shape.lineTo(.145, -.012);
  shape.quadraticCurveTo(.200, -.024, .200, 0);
  shape.quadraticCurveTo(.200, .024, .145, .012);
  shape.closePath();
  const socket = new T.Path();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const point = [.030 * Math.sin(a), .030 * Math.cos(a)];
    if (i === 0) socket.moveTo(...point); else socket.lineTo(...point);
  }
  socket.closePath();
  shape.holes.push(socket);
  const tool = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: .013, bevelEnabled: true, bevelSegments: 1, bevelSize: .001, bevelThickness: .001 }), bright);
  const grip = new T.Mesh(new T.BoxGeometry(.095, .028, .017), toolPaint);
  grip.position.set(.144, 0, .006);
  tool.add(grip);
  tool.rotation.x = -Math.PI / 2;
  return tool;
}

export function buildSteering(vehicle, hubs, bay) {
  const rack = new T.Group();
  rack.name = 'Steering rack';
  rack.position.set(0, .328, 1.31);
  vehicle.add(rack);
  cylinder(rack, .046, .69, rackPaint, 0).rotation.z = Math.PI / 2;
  const ties = [1, -1].map((side, index) => {
    const hub = hubs[index].hub;
    const pivot = new T.Vector3(-side * .046, -.02, -.101);
    const upright = new T.Vector3(-side * .084, -.087, .015);
    bar(hub, pivot, upright, .024, rackPaint);
    bar(hub, upright, new T.Vector3(-side * .074, .125, .018), .032, rackPaint);
    const lowerJoint = upright.clone().add(hub.position);
    for (const z of [1.26, 1.82]) {
      const bushing = new T.Vector3(side * .36, .235, z);
      bar(vehicle, bushing, lowerJoint, .026, rackPaint);
      cylinder(vehicle, .037, .055, boot, 0).position.copy(bushing);
    }
    const seat = new T.Vector3(side * .61, .86, 1.55);
    const ankle = hub.position.clone().add(new T.Vector3(-side * .08, .075, .017));
    bar(vehicle, ankle, seat, .028, steel);
    const spring = [];
    for (let n = 0; n <= 84; n++) {
      const f = n / 84, angle = f * Math.PI * 12;
      const pt = ankle.clone().lerp(seat, .24 + f * .57);
      pt.x += .061 * Math.cos(angle);
      pt.z += .061 * Math.sin(angle);
      spring.push(pt);
    }
    vehicle.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(spring), 84, .006, 6, false), rackPaint));
    const line = new T.Group();
    rack.add(line);
    line.position.x = side * .31;
    const direction = hub.position.clone().add(pivot).sub(rack.position).sub(line.position);
    line.quaternion.setFromUnitVectors(up, direction.clone().normalize());
    const length = direction.length();
    cylinder(line, .019, length, steel, length / 2);
    for (let i = 0; i < 7; i++) cylinder(line, .049 - i * .002, .011, boot, .010 + i * .015);
    for (let i = 0; i < 12; i++) cylinder(line, .022, .0025, bright, .205 + i * .005);
    const adjuster = cylinder(line, .029, .113, brass, .178, 6);
    const stripe = new T.Mesh(new T.BoxGeometry(.008, .086, .003), boot);
    stripe.position.z = .026;
    adjuster.add(stripe);
    const nut = cylinder(line, .034, .028, bright, .262, 6);
    const end = cylinder(line, .031, .165, rackPaint, .357);
    const joint = new T.Mesh(new T.SphereGeometry(.045, 16, 10), rackPaint);
    joint.position.y = length;
    line.add(joint);
    const tool = new T.Group();
    tool.add(spanner());
    bay.add(tool);
    const home = new T.Vector3(side * .365, -.58, .90);
    const pad = new T.Mesh(new T.BoxGeometry(.21, .07, .32), boot);
    pad.position.set(home.x, home.y - .039, home.z + .075);
    bay.add(pad);
    const parked = new T.Quaternion().setFromAxisAngle(up, -Math.PI / 2);
    return { line, side, hub, pivot, adjuster, nut, tool, home, parked, end, joint };
  });
  return { rack, ties };
}

export function poseSteering(ties, alignment, release) {
  for (const [index, tie] of ties.entries()) {
    const turns = alignment.turns[index];
    const endpoint = tie.pivot.clone().applyQuaternion(tie.hub.quaternion).add(tie.hub.position).sub(tie.line.parent.position).sub(tie.line.position);
    tie.joint.position.y = endpoint.length();
    tie.line.quaternion.setFromUnitVectors(up, endpoint.normalize());
    const phase = tie.side * turns * Math.PI * 2;
    tie.adjuster.rotation.y = phase;
    tie.adjuster.position.y = .178 + turns * .0015;
    tie.end.position.y = .357 - turns * .0015;
    const move = T.MathUtils.clamp(2 * release - index, 0, 1);
    const unlock = T.MathUtils.smoothstep(move, .42, .78);
    const ontoRod = T.MathUtils.smoothstep(move, .78, 1);
    tie.nut.position.y = .262 - .022 * unlock + turns * .0015;
    tie.nut.rotation.y = -tie.side * unlock * Math.PI * .85;
    const contact = T.MathUtils.lerp(tie.nut.position.y, tie.adjuster.position.y, ontoRod);
    const target = tie.tool.parent.worldToLocal(tie.line.localToWorld(new T.Vector3(0, contact, 0)));
    const reach = T.MathUtils.smoothstep(move, 0, .42);
    tie.tool.position.copy(tie.home).lerp(target, reach);
    tie.tool.position.y -= Math.sin(reach * Math.PI) * .10;
    const upright = new T.Vector3(0, -.95, .30).applyQuaternion(tie.line.quaternion.clone().invert());
    const rotation = Math.atan2(-upright.z, upright.x) + T.MathUtils.lerp(tie.nut.rotation.y, phase, ontoRod);
    const working = tie.line.quaternion.clone().multiply(new T.Quaternion().setFromAxisAngle(up, rotation));
    tie.tool.quaternion.copy(tie.parked).slerp(working, reach);
    tie.tool.scale.setScalar(1 + .18 * reach * (1 - ontoRod));
  }
}

export function buildRearToe(vehicle, hubs) {
  const subframe = new T.Group();
  subframe.name = 'Rear toe link mounts';
  vehicle.add(subframe);
  subframe.position.set(0, .28, -1.56);
  bar(subframe, new T.Vector3(-.48, 0, 0), new T.Vector3(.48, 0, 0), .055, rackPaint);
  const links = hubs.slice(2).map(({ hub }, index) => {
    const side = index ? -1 : 1;
    const mount = new T.Group();
    mount.position.x = side * .43;
    subframe.add(mount);
    const slot = new T.Mesh(new T.BoxGeometry(.145, .028, .115), boot);
    mount.add(slot);
    cylinder(mount, .037, .042, rackPaint, -.031);
    const eccentric = cylinder(mount, .044, .016, brass, -.054);
    cylinder(eccentric, .021, .029, bright, -.018, 6);
    const link = cylinder(vehicle, .024, 1, steel, 0);
    const tool = new T.Group();
    mount.add(tool);
    tool.add(spanner());
    const joint = new T.Vector3(-side * .064, -.034, -.15);
    const brace = new T.Vector3(.34 * side, .24, -1.12);
    bar(vehicle, brace, new T.Vector3(.71 * side, .24, -1.28), .031, rackPaint);
    return { mount, eccentric, link, tool, joint, hub, side };
  });
  return { subframe, links };
}

export function poseRearToe(links, alignment, release) {
  for (const [index, part] of links.entries()) {
    const turns = alignment.turns[index + 2];
    const engaged = T.MathUtils.clamp(2 * release - index, 0, 1);
    part.eccentric.position.x = -part.side * turns * .014;
    part.eccentric.rotation.y = part.side * turns * Math.PI / 2;
    const start = part.mount.position.clone().add(part.mount.parent.position).add(part.eccentric.position);
    const end = part.joint.clone().applyQuaternion(part.hub.quaternion).add(part.hub.position);
    const span = end.clone().sub(start);
    part.link.position.lerpVectors(start, end, .5);
    part.link.scale.y = span.length();
    part.link.quaternion.setFromUnitVectors(up, span.normalize());
    part.tool.visible = engaged > 0;
    part.tool.position.copy(part.eccentric.position);
    part.tool.position.y -= .024 + .16 * (1 - engaged);
    part.tool.rotation.y = part.eccentric.rotation.y + part.side * (1 - engaged);
  }
}

// This canvas is both the console texture and the mechanic's magnified monitor.
export function paintAlignmentMonitor(canvas, al, readings, steeringAngle, text, degrees) {
  const ctx = canvas.getContext('2d'), w = 768, h = 420;
  ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
  ctx.textAlign = 'left';
  const live = Boolean(al.baseline);
  const [toeTarget, toeTolerance] = alignmentSpecs.toe[al.axle];
  ctx.fillStyle = '#12232a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#c5e2d9';
  ctx.font = '650 28px system-ui';
  ctx.fillText(text(al.axle ? 'rearToe' : 'frontToe'), 25, 44, w * .45);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#c7d1c9';
  ctx.font = '550 23px system-ui';
  ctx.fillText(text('tolerance') + ' ' + degrees(toeTarget) + ' ± ' + degrees(toeTolerance), w - 22, 42, w * .6);
  for (let i = 0; i < 2; i++) {
    const index = al.axle * 2 + i;
    const x = 16 + i * (w / 2), cx = x + (w / 2 - 32) / 2, toe = readings.toe[index];
    const verdict = angleVerdict('toe', al.axle, toe);
    const color = !live ? '#b4c9c7' : verdict === 'ok' ? '#baff62' : '#ff7771';
    ctx.fillStyle = '#20353c';
    ctx.fillRect(x, 64, w / 2 - 22, 254);
    ctx.textAlign = 'left';
    ctx.font = '600 25px system-ui';
    ctx.fillStyle = '#deebe8';
    ctx.fillText(text(['frontLeft', 'frontRight', 'rearLeft', 'rearRight'][index]), x + 17, 102);
    ctx.fillStyle = color;
    ctx.font = '700 57px monospace';
    ctx.fillText(live ? degrees(toe) : '—', x + 16, 191, w * .31);
    ctx.save();
    ctx.translate(x + w / 2 - 83, 193);
    ctx.strokeStyle = '#b9cfcd';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(0, -65); ctx.lineTo(0, 65); ctx.stroke();
    ctx.setLineDash([]);
    // Screen view looks down with the nose pointing up. Toe-in points toward the centerline.
    ctx.rotate(live ? (i ? -1 : 1) * toe * 25 * Math.PI / 180 : 0);
    ctx.fillStyle = '#0f1e25'; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-12, -40, 24, 80, 6); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-51); ctx.lineTo(-5,-42); ctx.lineTo(5,-42); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
    ctx.restore();
    const span = w / 2 - 76;
    const coordinate = value => cx + Math.max(-1, Math.min(1, (value - toeTarget) / .55)) * span / 2;
    ctx.fillStyle = '#526268';
    ctx.fillRect(cx - span / 2, 265, span, 10);
    ctx.fillStyle = '#abd990';
    ctx.fillRect(coordinate(toeTarget - toeTolerance), 259, coordinate(toeTarget + toeTolerance) - coordinate(toeTarget - toeTolerance), 22);
    if (live) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(coordinate(toe), 261); ctx.lineTo(coordinate(toe)-8, 248); ctx.lineTo(coordinate(toe)+8, 248); ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.font = '720 26px system-ui';
    ctx.fillStyle = color;
    ctx.fillText(live ? text(verdict === 'ok' ? 'inRange' : verdict) : (al.mounts.includes(wheels[index]) ? '✓' : '—'), cx, 305, w * .42);
  }
  ctx.textAlign = 'left'; ctx.font = '600 24px system-ui'; ctx.fillStyle = '#e5ede7';
  ctx.fillText(text(al.axle ? 'rearTotal' : 'frontTotal') + '  ' + (live ? degrees(al.axle ? readings.rearTotal : readings.frontTotal) : '—'), 24, 361);
  ctx.font = '500 22px system-ui'; ctx.fillStyle = '#b8ccc8';
  ctx.fillText(al.stage === 'sweep' ? text('steeringAngle') + '  ' + degrees(steeringAngle) : text('planScale'), 24, 398);
}
