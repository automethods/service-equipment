import * as T from './vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/three/geometries/RoundedBoxGeometry.js';
import { planes } from './balance.js';
import { makeTyreChanger, attachChangerRig, attachChangerWheel, updateTyreChanger } from './tyre-changer.js';
import { bayClearance } from './lift-exercise.js';
import { addDiagnosticEquipment } from './diagnostic-scene.js';
import { addAlignmentPit, alignmentPit } from './diagnostic-axle.js';
import { insidePit, walkingEye, walkStart, walkStep, workshopFloor } from './workshop-walk.js';

const paint = (color, metalness = 0, roughness = .55) => new T.MeshStandardMaterial({ color, metalness, roughness });
const petrol = 0x317975;
const deepTeal = 0x205252;
const ochre = 0xce8551;
const casePaint = paint(petrol, .24, .40);
const edges = paint(0x172b31, .25);
const steel = paint(0xb8c8c9, .75, .32);
const darkSteel = paint(0x435453, .63);
const rubber = paint(0x171921, 0, .91);
const tread = paint(0x252a2d, 0, .94);
const accent = paint(ochre, .13);
const mint = paint(0xbde987, .18);
const cabinetTrim = paint(deepTeal, .24, .48);
const molded = paint(0x2d3036, .06, .69);
const trayWell = paint(0x15191e, .03, .84);
const zinc = paint(0x9ba9b3, .56, .34);
const { clamp, lerp, smoothstep, degToRad } = T.MathUtils;
const markColors = { inner: '#d6f789', outer: '#ffca72' };
const rimOffset = { inner: -.106, outer: .106 };
const fittedPaint = {
  inner: new T.MeshStandardMaterial({ color: 0x91fa45, emissive: 0x3d9c17, emissiveIntensity: .36, roughness: .48 }),
  outer: new T.MeshStandardMaterial({ color: 0xff8c2b, emissive: 0xd0480d, emissiveIntensity: .38, roughness: .48 }),
};
const readingColors = { pending: '#dce9e4', ok: '#b8f77f', correct: '#ff9389' };

const equipmentColors = {
  'Column blue · powder coat': petrol,
  'Deep blue · caps and rails': deepTeal,
  'Safety yellow · arm paint': ochre,
  'Golden yellow · extensions': 0xb67040,
  'Slate blue · powder-coated cabinet': petrol,
  'Deep navy · formed covers': deepTeal,
};

function applyEquipmentPalette(model) {
  model.traverse(part => {
    if (!part.isMesh) return;
    for (const material of [].concat(part.material)) {
      const color = equipmentColors[material.name];
      if (color !== undefined) material.color.setHex(color);
    }
  });
}

function mesh(group, geometry, material, x, y, z) {
  const item = new T.Mesh(geometry, material);
  item.position.set(x, y, z);
  group.add(item);
  return item;
}
function box(group, dimensions, material, x, y, z) {
  return mesh(group, new T.BoxGeometry(...dimensions), material, x, y, z);
}
function rounded(group, dimensions, radius, material, x, y, z) {
  return mesh(group, new RoundedBoxGeometry(...dimensions, 2, radius), material, x, y, z);
}
function cylinder(group, radii, length, material, x, y, z, axis = 'x') {
  const item = mesh(group, new T.CylinderGeometry(...radii, length, 40), material, x, y, z);
  if (axis === 'x') item.rotation.z = -Math.PI / 2;
  return item;
}
function torus(group, radius, tube, material, x, y, z) {
  const item = mesh(group, new T.TorusGeometry(radius, tube, 14, 76), material, x, y, z);
  item.rotation.y = Math.PI / 2;
  return item;
}

function positionOnRim(item, angle, radius, offset) {
  const radians = degToRad(angle);
  item.position.set(offset, radius * Math.cos(radians), radius * Math.sin(radians));
  item.rotation.x = radians;
}

function correctionMark(wheel, plane) {
  const marker = new T.Group();
  const material = new T.MeshBasicMaterial({ color: markColors[plane], transparent: true,
    depthTest: false, depthWrite: false, toneMapped: false });
  cylinder(marker, [.010, 0], .020, material, 0, .010, 0, 'y');
  box(marker, [.006, .020, .006], material, 0, .027, 0);
  const inner = plane === 'inner';
  const badge = mesh(marker, new T.TorusGeometry(inner ? .011 : .014, .0035, 8, inner ? 24 : 4), material, 0, .050, 0);
  marker.userData.badge = badge;
  for (const piece of marker.children) piece.renderOrder = 3;
  marker.scale.setScalar(1.35);
  marker.visible = false;
  wheel.add(marker);
  return marker;
}

function machineDisplay(housing, width, height, y, z, pixelsWide, pixelsHigh) {
  const panel = document.createElement('canvas');
  panel.width = 2 * pixelsWide;
  panel.height = 2 * pixelsHigh;
  const texture = new T.CanvasTexture(panel);
  texture.colorSpace = T.SRGBColorSpace;
  const face = mesh(housing, new T.PlaneGeometry(width, height),
    new T.MeshBasicMaterial({ map: texture, toneMapped: false }), 0, y, z);
  return { panel, texture, face };
}

function rod(group, start, end, radius, material) {
  const from = new T.Vector3(...start);
  const to = new T.Vector3(...end);
  const center = from.clone().lerp(to, .5);
  const item = cylinder(group, [radius, radius], from.distanceTo(to), material, ...center, 'y');
  item.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), to.sub(from).normalize());
  return item;
}

function bolt(group, radius, length, material, x, y, z, axis = 'y') {
  const head = mesh(group, new T.CylinderGeometry(radius, radius, length, 6), material, x, y, z);
  if (axis === 'x') head.rotation.z = Math.PI / 2;
  if (axis === 'z') head.rotation.x = Math.PI / 2;
}

function cabinet(machine) {
  rounded(machine, [.78, .095, .74], .033, casePaint, -.43, .083, .015);
  rounded(machine, [.69, .765, .61], .055, casePaint, -.46, .45, -.012);
  rounded(machine, [.57, .565, .023], .011, cabinetTrim, -.46, .40, .296);
  rounded(machine, [.54, .533, .02], .009, casePaint, -.46, .40, .307);
  for (const x of [-.694, -.224]) {
    for (const y of [.165, .628]) bolt(machine, .009, .006, darkSteel, x, y, .32, 'z');
  }
  rounded(machine, [.18, .146, .018], .008, cabinetTrim, -.48, .274, .32);
  for (let slot = 0; slot < 6; slot++) rounded(machine, [.156, .009, .007], .003, trayWell, -.48, .225 + slot * .019, .33);
  rounded(machine, [.17, .042, .019], .009, molded, -.46, .584, .324);
  rounded(machine, [.08, .012, .011], .004, steel, -.46, .583, .334);
  for (const x of [-.737, -.117]) for (const z of [-.269, .292]) {
    rounded(machine, [.084, .042, .081], .012, rubber, x, .023, z);
    rounded(machine, [.094, .014, .089], .006, darkSteel, x, .049, z);
  }
  const pedal = new T.Group();
  pedal.position.set(-.12, .069, .401);
  pedal.rotation.x = .16;
  machine.add(pedal);
  rounded(pedal, [.142, .030, .087], .009, molded, 0, 0, 0);
  for (let ridge = -2; ridge <= 2; ridge++) box(pedal, [.109, .005, .004], darkSteel, 0, .017, ridge * .013);
  for (const y of [.33, .52]) {
    cylinder(machine, [.012, .012], .105, zinc, -.858, y, .085);
    cylinder(machine, [.040, .063], .054, darkSteel, -.861, y, .085);
  }
}

function weightTray(machine) {
  const weights = new T.Group();
  machine.add(weights);
  rounded(machine, [.785, .080, .67], .038, molded, -.44, .842, .007);
  rounded(weights, [.30, .012, .602], .006, trayWell, -.655, .88, .007);
  rounded(machine, [.43, .012, .602], .006, trayWell, -.29, .88, .007);
  rounded(weights, [.049, .061, .602], .019, molded, -.803, .905, .007);
  rounded(machine, [.049, .061, .602], .019, molded, -.077, .905, .007);
  for (const z of [-.293, .307]) {
    rounded(weights, [.306, .058, .055], .020, molded, -.659, .902, z);
    rounded(machine, [.438, .058, .055], .020, molded, -.287, .902, z);
  }
  rounded(weights, [.024, .036, .559], .010, molded, -.513, .902, .006);
  rounded(weights, [.273, .037, .021], .009, molded, -.663, .903, .072);
  rounded(weights, [.265, .037, .021], .009, molded, -.663, .903, -.091);
  rounded(weights, [.28, .037, .021], .009, molded, -.664, .903, .191);
  rounded(machine, [.405, .036, .019], .009, molded, -.289, .902, -.111);

  // Strips of segmented adhesive weights and loose clip-on weights sit below the tray rim.
  for (let row = 0; row < 3; row++) {
    for (let piece = 0; piece < 7; piece++) {
      rounded(weights, [.018, .008, .018], .002, row === 2 ? darkSteel : zinc,
        -.747 + piece * .020, .892, .102 + row * .025);
    }
  }
  for (let i = 0; i < 5; i++) {
    const clip = new T.Group();
    clip.position.set(-.747 + (i % 3) * .068, .886, -.05 + Math.floor(i / 3) * .055);
    clip.rotation.y = i * .53;
    weights.add(clip);
    rounded(clip, [.033 + i * .005, .014, .014], .005, zinc, 0, .009, 0);
    rounded(clip, [.011, .014, .014], .003, steel, 0, .020, -.009);
  }
  for (const [x, radius] of [[-.422, .052], [-.296, .064], [-.151, .048]]) {
    cylinder(machine, [.62 * radius, radius], .055, darkSteel, x, .917, -.196, 'y');
    cylinder(machine, [.016, .016], .003, trayWell, x, .946, -.196, 'y');
  }
  const pliers = new T.Group();
  pliers.position.set(-.42, .900, .17);
  pliers.rotation.y = -.23;
  weights.add(pliers);
  for (const side of [-1, 1]) {
    rod(pliers, [0, 0, 0], [side * .030, 0, -.128], .011, accent);
    rod(pliers, [0, 0, 0], [side * .017, .005, .050], .009, zinc);
    rounded(pliers, [.014, .016, .023], .005, steel, side * .016, .005, .049);
  }
  bolt(pliers, .011, .009, steel, 0, .007, 0);
  return weights;
}

function guardShell(group) {
  const samples = 40;
  const vertices = [];
  const indices = [];
  const rimPaths = [[], []];
  for (let i = 0; i <= samples; i++) {
    const angle = .05 + (Math.PI - .10) * i / samples;
    const halfWidth = .254 - .035 * Math.cos(angle) ** 4;
    for (const radius of [.454, .436]) {
      vertices.push(-halfWidth, -.20 + radius * Math.sin(angle), .46 + radius * Math.cos(angle),
        halfWidth, -.20 + radius * Math.sin(angle), .46 + radius * Math.cos(angle));
    }
    for (const [side, points] of rimPaths.entries()) {
      points.push(new T.Vector3((side ? 1 : -1) * halfWidth,
        -.20 + .446 * Math.sin(angle), .46 + .446 * Math.cos(angle)));
    }
    if (i < samples) {
      const n = i * 4;
      indices.push(n, n + 1, n + 4, n + 1, n + 5, n + 4,
        n + 2, n + 6, n + 3, n + 3, n + 6, n + 7);
    }
  }
  const shell = new T.BufferGeometry();
  shell.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  shell.setIndex(indices);
  shell.computeVertexNormals();
  const cover = molded.clone();
  cover.side = T.DoubleSide;
  mesh(group, shell, cover, 0, 0, 0);
  const glazing = paint(0x6e8d8a, .05, .27);
  glazing.side = T.DoubleSide;
  glazing.transparent = true;
  glazing.depthWrite = false;
  glazing.opacity = .48;
  for (const points of rimPaths) {
    const frame = points.map(({ x, y, z }) => new T.Vector3(x, -.20 + (y + .20) * .73, .46 + (z - .46) * .94));
    const sill = points.map(({ x, y, z }) => new T.Vector3(x, -.20 + (y + .20) * .24, .46 + (z - .46) * .86));
    for (const [outer, inner, material] of [[points, frame, cover], [frame, sill, glazing]]) {
      const strip = new T.BufferGeometry();
      const vertices = outer.flatMap((point, i) => [...point, ...inner[i]]);
      const faces = outer.slice(1).flatMap((_, i) => [2*i, 2*i+1, 2*i+2, 2*i+1, 2*i+3, 2*i+2]);
      strip.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      strip.setIndex(faces);
      strip.computeVertexNormals();
      mesh(group, strip, material, 0, 0, 0);
    }
    mesh(group, new T.TubeGeometry(new T.CatmullRomCurve3(points), samples, .012, 10), molded, 0, 0, 0);
    mesh(group, new T.TubeGeometry(new T.CatmullRomCurve3(sill), samples, .010, 10), molded, 0, 0, 0);
  }
  for (const x of [-.151, .151]) {
    const ring = mesh(group, new T.TorusGeometry(.429, .009, 8, 36, Math.PI - .14), trayWell, x, -.20, .46);
    ring.rotation.y = -Math.PI / 2;
    ring.rotateZ(.07);
  }
  rounded(group, [.458, .028, .033], .013, molded, 0, -.174, .912);
  const grip = rounded(group, [.155, .03, .04], .013, trayWell, 0, -.147, .926);
  for (const x of [-.065, .065]) rounded(group, [.025, .029, .039], .011, molded, x, -.154, .908);
  for (const x of [-.184, .184]) {
    rod(group, [x, 0, 0], [x, -.17, .047], .027, molded);
    cylinder(group, [.056, .056], .06, molded, x, 0, 0);
    bolt(group, .022, .009, zinc, x + .035, 0, 0, 'x');
  }
  return grip;
}

function balancer() {
  const machine = new T.Group();
  cabinet(machine);
  const weightsTray = weightTray(machine);
  cylinder(machine, [.126, .126], .049, molded, -.10, .70, 0);
  cylinder(machine, [.093, .114], .060, darkSteel, -.047, .70, 0);
  cylinder(machine, [.077, .096], .048, steel, -.010, .70, 0);
  cylinder(machine, [.052, .074], .094, steel, .052, .70, 0);
  cylinder(machine, [.027, .027], .47, zinc, .279, .70, 0);
  for (let ridge = 0; ridge < 19; ridge++) torus(machine, .026, .0021, darkSteel, .368 + ridge * .0076, .70, 0);
  for (let index = 0; index < 6; index++) {
    const angle = index * Math.PI / 3;
    bolt(machine, .008, .006, zinc, -.071, .70 + .107 * Math.cos(angle), .107 * Math.sin(angle), 'x');
  }
  rounded(machine, [.165, .028, .115], .012, darkSteel, -.565, .926, -.226);
  for (const x of [-.623, -.507]) for (const z of [-.265, -.184]) bolt(machine, .008, .009, zinc, x, .945, z);
  rounded(machine, [.076, .285, .065], .011, molded, -.565, 1.062, -.226).rotation.x = -.22;
  rounded(machine, [.172, .123, .048], .011, darkSteel, -.565, 1.222, -.216).rotation.x = -.21;
  const cablePath = new T.CatmullRomCurve3([[-.516, 1.215, -.231], [-.506, 1.118, -.257],
    [-.498, 1.005, -.308], [-.498, .905, -.296]].map(point => new T.Vector3(...point)));
  mesh(machine, new T.TubeGeometry(cablePath, 14, .008, 8), rubber, 0, 0, 0);
  const console = new T.Group();
  console.position.set(-.565, 1.246, -.168);
  console.rotation.x = -.21;
  console.rotation.y = .31;
  machine.add(console);
  rounded(console, [.570, .358, .055], .019, molded, 0, 0, 0);
  rounded(console, [.542, .324, .024], .011, trayWell, 0, .003, .023);
  rounded(console, [.013, .004, .004], .001, mint, .229, -.162, .029);
  const display = machineDisplay(console, .530, .303, .008, .036, 640, 360);

  const hood = new T.Group();
  hood.position.set(.245, .90, -.46);
  rounded(machine, [.60, .073, .075], .018, darkSteel, -.14, .90, -.46);
  for (const x of [-.391, -.205]) {
    rod(machine, [x, .68, -.29], [x, .90, -.46], .037, molded);
    bolt(machine, .013, .009, zinc, x, .922, -.48);
  }
  cylinder(machine, [.021, .021], .422, zinc, .245, .90, -.46);
  const grip = guardShell(hood);
  machine.add(hood);
  const carrier = new T.Group();
  machine.add(carrier);
  const wheel = new T.Group();
  carrier.add(wheel);
  const proceduralWheel = new T.Group();
  wheel.add(proceduralWheel);
  const tire = cylinder(proceduralWheel, [.319, .319], .195, rubber, 0, 0, 0);
  tire.geometry.dispose();
  tire.geometry = new T.CylinderGeometry(.319, .319, .195, 74, 1, true);
  for (const x of [-.094, .094]) torus(proceduralWheel, .266, .055, rubber, x, 0, 0);
  for (let mark = 0; mark < 48; mark++) {
    const angle = mark * Math.PI / 24;
    for (const x of [-.06, .0, .06]) {
      const stagger = angle + x * .7;
      const block = box(proceduralWheel, [.052, .008, .022], tread, x, .320 * Math.cos(stagger), .320 * Math.sin(stagger));
      block.rotation.x = stagger;
      block.rotation.y = x > 0 ? -.2 : .2;
    }
  }
  const barrel = cylinder(proceduralWheel, [.228, .228], .204, darkSteel, 0, 0, 0);
  barrel.geometry.dispose();
  barrel.geometry = new T.CylinderGeometry(.228, .228, .204, 64, 1, true);
  torus(proceduralWheel, .219, .014, steel, .108, 0, 0);
  torus(proceduralWheel, .219, .014, steel, -.108, 0, 0);
  cylinder(proceduralWheel, [.071, .071], .212, steel, .013, 0, 0);
  for (let n = 0; n < 5; n++) {
    const angle = n * Math.PI * 2 / 5;
    const spoke = box(proceduralWheel, [.025, .169, .028], steel, .081, .127 * Math.cos(angle), .127 * Math.sin(angle));
    spoke.rotation.x = angle;
    cylinder(proceduralWheel, [.009, .009], .014, darkSteel, .124, .045 * Math.cos(angle), .045 * Math.sin(angle));
  }
  const clamp = new T.Group();
  machine.add(clamp);
  cylinder(clamp, [.055, .084], .043, molded, .023, 0, 0);
  cylinder(clamp, [.048, .048], .046, zinc, .058, 0, 0);
  for (let index = 0; index < 3; index++) {
    const grip = rounded(clamp, [.036, .027, .059], .010, molded, .059, 0, 0);
    const angle = index * Math.PI * 2 / 3;
    grip.position.set(.059, .056 * Math.cos(angle), .056 * Math.sin(angle));
    grip.rotation.x = angle;
  }
  const fitted = new T.Group();
  wheel.add(fitted);
  const weightInHand = box(wheel, [1, 1, 1], mint, 0, 0, 0);
  weightInHand.visible = false;
  const marks = Object.fromEntries(planes.map(plane => [plane, correctionMark(wheel, plane)]));
  return { machine, carrier, wheel, proceduralWheel, fitted, weightInHand, clamp, hood, grip, weightsTray, marks, display };
}

function twoPostLift() {
  const lift = new T.Group();
  const fallback = new T.Group();
  const carriages = new T.Group();
  lift.add(fallback);
  fallback.add(carriages);
  for (const direction of [-1, 1]) {
    const x = direction * 1.64;
    box(fallback, [.404, .055, .62], darkSteel, x, .028, 0);
    box(fallback, [.305, 2.99, .34], casePaint, x, 1.54, 0);
    box(fallback, [.14, 2.85, .07], darkSteel, x - direction * .06, 1.50, .155);
    box(fallback, [.33, .12, .37], edges, x, 3.0, 0);
    box(carriages, [.25, .53, .37], edges, x, .31, 0);
    for (const forward of [-1, 1]) {
      const arm = new T.Group();
      arm.position.set(x - direction * .09, .17, forward * .10);
      arm.rotation.y = direction * forward * .58;
      carriages.add(arm);
      box(arm, [.71, .106, .14], accent, -direction * .35, 0, 0);
      box(arm, [.42, .075, .096], steel, -direction * .87, 0, 0);
      cylinder(arm, [.085, .085], .045, rubber, -direction * 1.045, .063, 0, 'y');
    }
  }
  box(fallback, [3.4, .04, .24], darkSteel, 0, .022, 0);
  rounded(fallback, [.17, .26, .105], .013, molded, 1.64, 1.95, .21);
  const pump = cylinder(fallback, [.023, .025], .019, mint, 1.64, 2.025, .273, 'z');
  const valve = new T.Group();
  valve.position.set(1.64, 1.95, .272);
  fallback.add(valve);
  rod(valve, [0, 0, 0], [0, -.095, .042], .009, steel);
  rounded(valve, [.039, .026, .025], .010, molded, 0, -.095, .042);
  return { lift, fallback, carriages, pump, valve, pivots: [], extensions: [] };
}

function liftControlPanel(group) {
  const housing = new T.Group();
  housing.position.set(1.64, 1.71, .263);
  group.add(housing);
  rounded(housing, [.214, .415, .090], .018, molded, 0, 0, 0);
  rounded(housing, [.188, .383, .026], .014, edges, 0, 0, .044);
  for (const y of [-.18, .18]) bolt(housing, .009, .009, zinc, 0, y, .058, 'z');
  const keys = Object.fromEntries([['raise', 1, 0xa5d66f], ['lower', -1, 0xffbb68]].map(([id, direction, color]) => {
    const key = new T.Group();
    key.name = direction > 0 ? 'Raise lift button' : 'Lower lift button';
    key.position.set(0, .09 * direction, .068);
    housing.add(key);
    rounded(key, [.153, .145, .034], .017, paint(color, .08, .37), 0, 0, 0);
    const { panel, texture, face } = machineDisplay(key, .101, .101, 0, .0175, 64, 64);
    const context = panel.getContext('2d');
    context.strokeStyle = '#172823';
    context.lineWidth = 14;
    context.lineCap = context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(64, 64 + direction * 29);
    context.lineTo(64, 64 - direction * 29);
    context.lineTo(39, 64 - direction * 4);
    context.moveTo(64, 64 - direction * 29);
    context.lineTo(89, 64 - direction * 4);
    context.stroke();
    texture.needsUpdate = true;
    face.material.transparent = true;
    return [id, key];
  }));
  const lock = new T.Group();
  lock.position.set(0, -.31, .042);
  housing.add(lock);
  rounded(lock, [.15, .145, .052], .012, edges, 0, 0, 0);
  const lever = new T.Group();
  lock.add(lever);
  rod(lever, [0, .032, .022], [.015, -.029, .071], .012, steel);
  rounded(lever, [.093, .029, .035], .011, accent, .015, -.032, .074);
  return { housing, keys, lock, lever };
}

function fitLiftVehicle(rack, vehicle) {
  const body = vehicle.getObjectByName('TeslaModel3');
  const lamps = new Set();
  body.traverse(part => {
    const material = part.material;
    if (material?.name === 'headEmitter' || material?.name === 'tailEmitter') {
      material.emissive.setHex(material.name === 'headEmitter' ? 0xe8f6ff : 0xff1420);
      material.emissiveIntensity = 0;
      lamps.add(material);
    }
  });
  const lampStrips = new T.Group();
  // Lens paths sampled from the compressed Model 3 after fitting it to the bay.
  const headLens = [[.51, .656, 2.135], [.57, .672, 2.098], [.64, .699, 2.043], [.71, .735, 1.961], [.77, .754, 1.856]];
  const tailLens = [[.41, .873, -2.217], [.46, .898, -2.195], [.51, .924, -2.169], [.57, .938, -2.136],
    [.63, .942, -2.099], [.69, .924, -2.067], [.75, .901, -1.988], [.774, .87, -1.934]];
  for (const [points, color, offset] of [[headLens, 0xf1faff, .009], [tailLens, 0xff283f, -.009]]) {
    const material = new T.MeshBasicMaterial({ color, toneMapped: false });
    for (const side of [-1, 1]) {
      const path = new T.CatmullRomCurve3(points.map(([x, y, z]) => new T.Vector3(side * x, y + .004, z + offset)));
      mesh(lampStrips, new T.TubeGeometry(path, 20, .0065, 6, false), material, 0, 0, 0);
    }
  }
  body.add(lampStrips);
  const beams = [];
  for (const side of [-1, 1]) {
    const headlamp = new T.SpotLight(0xe6f3ff, 0, 6, .29, .60);
    headlamp.position.set(side * .59, .67, 2.18);
    headlamp.target.position.set(side * .65, -.10, 6.1);
    body.add(headlamp, headlamp.target);
    beams.push(headlamp);
  }
  const supportY = body.userData.supportY;
  const padX = .77;
  const padZ = .97;
  rounded(body, [1.36, .045, 2.24], .016, darkSteel, 0, supportY + .035, 0);
  const guides = new T.Group();
  const pointMaterial = new T.MeshBasicMaterial({ color: 0xa6fb80, depthTest: false, depthWrite: false, toneMapped: false });
  for (const x of [-padX, padX]) {
    for (const z of [-padZ, padZ]) {
      cylinder(body, [.051, .055], .035, darkSteel, x, supportY + .0175, z, 'y');
      const ring = mesh(guides, new T.TorusGeometry(.067, .009, 8, 32), pointMaterial, x, supportY, z);
      ring.rotation.x = Math.PI / 2;
      ring.renderOrder = 4;
    }
  }
  const batteryLimit = new T.BufferGeometry().setFromPoints([
    [-.67, -1.12], [.67, -1.12], [.67, 1.12], [-.67, 1.12],
  ].map(([x, z]) => new T.Vector3(x, supportY, z)));
  const batteryGuide = new T.LineLoop(batteryLimit, new T.LineBasicMaterial({
    color: 0xff8e75, depthTest: false, depthWrite: false, toneMapped: false,
  }));
  batteryGuide.renderOrder = 3;
  guides.add(batteryGuide);
  guides.visible = false;
  body.add(guides);
  const axles = [];
  const wheelsByAxle = { front: [], rear: [] };
  for (const part of body.children) {
    if (!part.isMesh || !part.name.startsWith('wheels')) continue;
    part.geometry.computeBoundingBox();
    const center = part.geometry.boundingBox.getCenter(new T.Vector3());
    wheelsByAxle[center.z > 0 ? 'front' : 'rear'].push(part);
  }
  for (const wheels of Object.values(wheelsByAxle)) {
    const tyre = wheels.find(part => part.material.name === 'rubber');
    const bounds = tyre.geometry.boundingBox;
    const axle = new T.Group();
    bounds.getCenter(axle.position);
    body.add(axle);
    for (const wheel of wheels) {
      wheel.position.sub(axle.position);
      axle.add(wheel);
    }
    axles.push({ axle, radius: (bounds.max.y - bounds.min.y) / 2 });
  }
  const fit = rack.pivots.map(pivot => {
    const extension = rack.extensions.find(part => part.parent === pivot);
    const pad = extension.getObjectByProperty('isLiftPad', true);
    const padWorld = pad.getWorldPosition(new T.Vector3());
    const padLocal = pivot.worldToLocal(padWorld.clone());
    const target = rack.lift.worldToLocal(padWorld);
    target.set(Math.sign(target.x) * padX, target.y, Math.sign(target.z) * padZ);
    const direction = pivot.parent.worldToLocal(rack.lift.localToWorld(target)).sub(pivot.position);
    const { spread0, spread100, spread75 } = pivot.userData;
    const radius = Math.hypot(direction.x, direction.z);
    const angle = Math.asin(padLocal.z / radius) - Math.atan2(direction.z, direction.x);
    const yaw = spread75 + T.MathUtils.euclideanModulo(angle - spread75 + Math.PI, 2 * Math.PI) - Math.PI;
    const reach = Math.sqrt(radius ** 2 - padLocal.z ** 2) - (padLocal.x - extension.position.x);
    return {
      yaw: clamp(yaw, Math.min(spread0, spread100), Math.max(spread0, spread100)),
      reach: clamp(reach, extension.userData.reach0, extension.userData.reach100),
      height: new T.Box3().setFromObject(pad).max.y - rack.carriages.position.y,
    };
  });
  rack.vehicleFit = fit;
  rack.contactHeight = Math.min(...fit.map(arm => arm.height)) - supportY;
  rack.vehicle = vehicle;
  rack.guides = guides;
  rack.axles = axles;
  rack.lamps = lamps;
  rack.lampStrips = lampStrips;
  rack.beams = beams;
  rack.lift.add(vehicle);
}

function liftPose(rack, state, now) {
  const { arms, carZ, motion } = state.liftRun;
  const time = motion ? clamp((now - motion.start) / motion.duration, 0, 1) : 0;
  const swing = motion?.arms === 'parked' ? smoothstep(time, .33, 1) : smoothstep(time, 0, .73);
  const extensionTravel = motion?.arms === 'parked' ? smoothstep(time, 0, .49) : smoothstep(time, .42, 1);
  for (const [index, pivot] of rack.pivots.entries()) {
    const { spread0, spread75, spread100 } = pivot.userData;
    const manual = state.forkSpread <= 75 ? lerp(spread0, spread75, state.forkSpread / 75)
      : lerp(spread75, spread100, (state.forkSpread - 75) / 25);
    const yaw = mode => mode === 'positioned' ? rack.vehicleFit[index].yaw : mode === 'parked' ? spread100 : manual;
    pivot.rotation.set(0, motion?.arms ? lerp(yaw(arms), yaw(motion.arms), swing) : yaw(arms), 0);
  }
  for (const [index, extension] of rack.extensions.entries()) {
    const { reach0, reach100 } = extension.userData;
    const reach = mode => mode === 'positioned' ? rack.vehicleFit[index].reach
      : mode === 'parked' ? reach0 : lerp(reach0, reach100, state.forkReach / 100);
    extension.position.x = motion?.arms ? lerp(reach(arms), reach(motion.arms), extensionTravel) : reach(arms);
  }
  if (rack.vehicle) {
    const driving = carZ !== null && motion?.carZ != null;
    const movingOnLift = arms === 'positioned' && carZ === 0 && Boolean(state.liftDirection);
    rack.lampStrips.visible = driving || movingOnLift;
    for (const material of rack.lamps) {
      material.emissiveIntensity = driving || movingOnLift ? (material.name === 'headEmitter' ? 3.1 : 1.7) : 0;
    }
    for (const beam of rack.beams) beam.intensity = driving ? 88 : 0;
    rack.vehicle.position.z = driving ? lerp(carZ, motion.carZ, smoothstep(time, 0, 1)) : carZ ?? -bayClearance;
    rack.vehicle.position.y = arms === 'positioned' && carZ === 0
      ? Math.max(0, rack.contactHeight + rack.carriages.position.y) : 0;
    rack.guides.visible = state.showLiftGuides && carZ === 0 && !driving;
    for (const { axle, radius } of rack.axles) {
      axle.rotation.x = (rack.vehicle.position.z + bayClearance) / radius;
    }
  }
  return Boolean(motion && time < 1);
}

function contactShadows(machine) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 6, 32, 32, 31);
  gradient.addColorStop(0, 'rgba(8, 17, 16, .68)');
  gradient.addColorStop(.62, 'rgba(8, 17, 16, .3)');
  gradient.addColorStop(1, 'rgba(8, 17, 16, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const material = new T.MeshBasicMaterial({ map: new T.CanvasTexture(canvas), transparent: true, depthWrite: false });
  mesh(machine, new T.PlaneGeometry(1.26, 1.14), material, -.42, .007, .013).rotation.x = -Math.PI / 2;
  const wheelShadow = mesh(machine, new T.PlaneGeometry(.78, .78), material.clone(), 0, .008, 0);
  wheelShadow.rotation.x = -Math.PI / 2;
  return wheelShadow;
}

const screenControls = {
  inner: [20, 76, 289, 207],
  outer: [331, 76, 289, 207],
  spin: [424, 295, 196, 47],
};

function drawConsole(display, readout, controls, hover, cue) {
  const context = display.panel.getContext('2d');
  context.setTransform(2, 0, 0, 2, 0, 0);
  context.fillStyle = '#101a20';
  context.fillRect(0, 0, 640, 360);
  context.fillStyle = '#f4fbf8';
  context.textAlign = 'left';
  context.font = '750 36px system-ui';
  context.fillText(readout.title, 24, 53, 400);
  context.textAlign = 'right';
  context.font = '750 34px monospace';
  context.fillText(readout.rpm, 616, 53, 190);
  context.textAlign = 'left';
  for (const plane of planes) {
    const [x, y, width, height] = screenControls[plane];
    context.fillStyle = '#203037';
    context.fillRect(x, y, width, height);
    context.fillStyle = markColors[plane];
    context.font = '800 43px system-ui';
    context.fillText(readout[plane + 'Label'], x + 19, 125, 245);
    context.fillStyle = readingColors[readout[plane + 'Verdict']];
    context.font = '750 80px monospace';
    context.fillText(readout[plane + 'Mass'], x + 19, 202, 245);
    context.font = '700 43px monospace';
    context.fillText(readout[plane + 'Angle'], x + 19, 260, 245);
  }
  const [x, y, w, h] = screenControls.spin;
  context.fillStyle = controls.spin.disabled ? '#283a40' : '#cce987';
  context.fillRect(x, y, w, h);
  context.font = '800 33px system-ui';
  context.textAlign = 'center';
  context.fillStyle = controls.spin.disabled ? '#c7d5d2' : '#142219';
  context.fillText(readout.start, x + w / 2, y + 34, w - 18);
  for (const [id, rect] of Object.entries(screenControls)) {
    if (!controls[id].disabled && (cue === id || hover === id)) {
      context.strokeStyle = '#f2ffca';
      context.lineWidth = 5;
      context.strokeRect(...rect);
    }
  }
  display.texture.needsUpdate = true;
}

export function makeWorkshop(canvas, getState, controls, moveLift, diagnostics) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;
  const scene = new T.Scene();
  scene.background = new T.Color(0x233831);
  scene.fog = new T.Fog(0x233831, 25, 62);
  scene.add(new T.HemisphereLight(0xe3f3eb, 0x455e48, 2.4));
  const key = new T.DirectionalLight(0xfff4d2, 3.3);
  key.position.set(3, 6, 5);
  scene.add(key);
  const fill = new T.DirectionalLight(0x9dd9ea, 1.8);
  fill.position.set(-4, 2, -4);
  scene.add(fill);
  const floor = paint(0x54625f);
  const { x: pitX, width: pitWidth, rear: pitRear, front: pitFront } = alignmentPit;
  const pitLeft = pitX - pitWidth / 2;
  const pitRight = pitX + pitWidth / 2;
  // The opening runs through the slab. End the grid lines at its edges as well.
  const { left: floorLeft, right: floorRight, rear: floorRear, front: floorFront } = workshopFloor;
  for (const [left, right, rear, front] of [
    [floorLeft,pitLeft,floorRear,floorFront], [pitRight,floorRight,floorRear,floorFront],
    [pitLeft,pitRight,floorRear,pitRear], [pitLeft,pitRight,pitFront,floorFront],
  ]) {
    box(scene, [right - left, .065, front - rear], floor, (left + right) / 2, -.044, (rear + front) / 2);
  }
  const joints = [];
  for (let z = floorRear; z <= floorFront; z += 2) {
    if (z > pitRear && z < pitFront) joints.push(floorLeft,0,z,pitLeft,0,z,pitRight,0,z,floorRight,0,z);
    else joints.push(floorLeft,0,z,floorRight,0,z);
  }
  for (let x = floorLeft; x <= floorRight; x += 2) {
    if (x > pitLeft && x < pitRight) joints.push(x,0,floorRear,x,0,pitRear,x,0,pitFront,x,0,floorFront);
    else joints.push(x,0,floorRear,x,0,floorFront);
  }
  scene.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(joints, 3)),
    new T.LineBasicMaterial({ color: 0x50605c })));
  addAlignmentPit(scene);
  const zoneSigns = [[1.2, 3.6], [9.15, 7.0]].map(([x, z]) => {
    const sign = machineDisplay(scene, 4.75, .73, .007, z, 420, 64);
    sign.face.position.x = x;
    sign.face.rotation.x = -Math.PI / 2;
    sign.face.material.transparent = true;
    sign.face.material.depthWrite = false;
    sign.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return sign;
  });
  const tape = paint(0xabb382);
  for (const side of [-3.15, 5.55]) box(scene, [.025, .002, 5.6], tape, side, .003, .05);
  for (const end of [-2.75, 2.85]) box(scene, [8.7, .002, .025], tape, 1.20, .003, end);
  const diagnosticsEnds = [-9.45, 7.65];
  const diagnosticsLength = diagnosticsEnds[1] - diagnosticsEnds[0];
  const diagnosticEdges = [6.45, 50];
  for (const x of diagnosticEdges) box(scene, [.025, .002, diagnosticsLength], tape, x, .003, diagnosticsEnds[0] + diagnosticsLength / 2);
  for (const z of diagnosticsEnds) box(scene, [diagnosticEdges[1] - diagnosticEdges[0], .002, .025], tape,
    (diagnosticEdges[0] + diagnosticEdges[1]) / 2, .003, z);

  const stand = balancer();
  const wheelShadow = contactShadows(stand.machine);
  const rack = twoPostLift();
  const changer = makeTyreChanger();
  const changerShadow = contactShadows(changer.machine);
  stand.machine.position.set(4.42, 0, .53);
  rack.lift.position.set(-.95, 0, -.63);
  changer.machine.position.set(2.12, 0, .12);
  scene.add(stand.machine, rack.lift, changer.machine);
  const equipment = [stand.machine, rack.lift, changer.machine];
  stand.display.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const actuators = new Map();
  function register(id, part, anchor = part, point = new T.Vector3(), alternates = []) {
    part.userData.control = id;
    actuators.set(id, { anchor, point, alternates });
  }
  register('mount', stand.carrier);
  register('hood', stand.hood, stand.grip);
  register('fit', stand.weightsTray, stand.weightsTray, new T.Vector3(-.659, .958, .323), [
    { anchor: stand.weightsTray, point: new T.Vector3(-.805, .958, .13) },
    { anchor: stand.weightsTray, point: new T.Vector3(-.659, .958, -.309) },
  ]);
  register('tyre-load', changer.carrier, changer.carrier, new T.Vector3(0, 0, .092));
  rack.pump.userData.control = 'raise';
  rack.valve.userData.control = 'lower';
  const liftPanel = liftControlPanel(rack.lift);
  const beacon = new T.Group();
  beacon.position.set(1.64, 3.07, 0);
  rack.lift.add(beacon);
  const amberBeacon = new T.MeshStandardMaterial({ color: 0xe88716, emissive: 0xff8700, emissiveIntensity: 0, roughness: .32 });
  cylinder(beacon, [.071, .073], .035, molded, 0, 0, 0, 'y');
  cylinder(beacon, [.049, .061], .085, amberBeacon, 0, .056, 0, 'y');
  cylinder(beacon, [.043, .049], .016, amberBeacon, 0, .107, 0, 'y');
  for (const [id, key] of Object.entries(liftPanel.keys)) register(id, key, key, new T.Vector3(0, 0, .019));
  register('lift-lock', liftPanel.lock, liftPanel.lever, new T.Vector3(.015, -.032, .094));
  rack.pumpRest = rack.pump.position.clone();
  rack.valveRest = rack.valve.quaternion.clone();
  const cues = Array.from({ length: 2 }, () => {
    const element = document.createElement('span');
    element.className = 'actuator-cue';
    element.setAttribute('aria-hidden', 'true');
    element.hidden = true;
    canvas.after(element);
    return element;
  });
  const views = {
    bay: { center: new T.Vector3(5.75, .85, -.35), distance: 20.0, yaw: -.05, pitch: .44, aspect: 1.58 },
    balancer: { center: stand.machine.position.clone().add(new T.Vector3(-.055, .84, .055)), distance: 3.67, yaw: .69, pitch: .39, aspect: 1.36 },
    lift: { center: rack.lift.position.clone().add(new T.Vector3(.19, 1.53, 0)), distance: 5.9, yaw: .54, pitch: .23, aspect: 1.24 },
    changer: { center: changer.machine.position.clone().add(new T.Vector3(.02, .99, .16)), distance: 3.85, yaw: .53, pitch: .31, aspect: 1.26 },
  };
  const camera = new T.PerspectiveCamera(36, 1, .035, 85);
  const stage = canvas.parentElement;
  const stairsButton = document.getElementById('face-pit-stairs');
  const walkPad = document.getElementById('walk-controls');
  const walkHint = document.getElementById('walk-hint');
  const walkKeys = { w: 'forward', a: 'left', s: 'back', d: 'right',
    arrowup: 'forward', arrowleft: 'left', arrowdown: 'back', arrowright: 'right' };
  const heldWalk = new Map();
  let walker;
  let yaw = .86;
  let pitch = .39;
  let zoom = 1;
  let zoomLimit = 3;
  const panOffset = new T.Vector3();
  const panAxis = new T.Vector3();
  let currentShot, manualShot;
  let pointing;
  let hovered;
  const ray = new T.Raycaster();
  const mouse = new T.Vector2();
  const inverseMarkRotation = new T.Quaternion();
  let currentView;
  let shotKey, flight, diagnosticRig;
  const lastCenter = new T.Vector3();
  let size = '';
  let labels = '';
  let weights = '';
  let frame = 0;
  let cueTimer = 0;
  let hasAlloyWheel = false;
  const motionReduced = matchMedia('(prefers-reduced-motion: reduce)');
  canvas.dataset.wheelModel = 'procedural';
  canvas.dataset.liftModel = 'procedural';
  canvas.dataset.changerModel = 'loading';
  const gltfModule = import('./vendor/three/loaders/GLTFLoader.js');
  const compressedLoader = Promise.all([gltfModule, import('./vendor/three/libs/meshopt_decoder.module.js')])
    .then(([{ GLTFLoader }, { MeshoptDecoder }]) => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder));
  const alloyReady = gltfModule
    .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(new URL('./models/alloy-wheel.glb', import.meta.url).href))
    .then(({ scene: wheelModel }) => {
      attachChangerWheel(changer, wheelModel);
      const axis = new T.Group();
      const bounds = new T.Box3().setFromObject(wheelModel);
      wheelModel.position.sub(bounds.getCenter(new T.Vector3()));
      axis.rotation.y = Math.PI / 2;
      axis.add(wheelModel);
      stand.wheel.add(axis);
      stand.proceduralWheel.visible = false;
      hasAlloyWheel = true;
      canvas.dataset.wheelModel = 'alloy-wheel';
      draw();
    });
  alloyReady.catch(error => console.warn('Using the built-in wheel because the alloy wheel could not be loaded.', error));
  const liftReady = compressedLoader.then(loader => loader.loadAsync(new URL('./models/lift-ukrainian.glb?v=native-controls', import.meta.url).href))
    .then(({ scene: model }) => {
      const carriages = model.getObjectByName('LiftCarriages');
      const pump = model.getObjectByName('LiftPumpButton');
      const valve = model.getObjectByName('LiftLowerValve');
      const column = model.getObjectByName('Column_B');
      if (!carriages || !pump || !valve || !column) throw new Error('The lift is missing its moving assembly or hydraulic controls.');
      carriages.traverse(part => {
        if (part.userData.spread75 !== undefined) rack.pivots.push(part);
        if (part.userData.reach100 !== undefined) rack.extensions.push(part);
        if (part.name.endsWith('rubber_pad')) part.isLiftPad = true;
      });
      model.rotation.y = Math.PI / 2;
      applyEquipmentPalette(model);
      rack.lift.add(model);
      rack.carriages = carriages;
      pump.userData.control = 'raise';
      valve.userData.control = 'lower';
      liftPanel.housing.position.x = rack.lift.worldToLocal(column.getWorldPosition(new T.Vector3())).x;
      beacon.position.x = liftPanel.housing.position.x;
      beacon.position.y = new T.Box3().setFromObject(column).max.y + .10;
      const armAnchors = rack.pivots.slice().reverse().flatMap(anchor => {
        anchor.userData.control = 'lift-arms';
        const pad = anchor.getObjectByProperty('isLiftPad', true);
        return [{ anchor: pad, point: new T.Vector3(0, .046, 0) },
          { anchor, point: new T.Vector3(.40, .048, 0) },
          { anchor, point: new T.Vector3(.075, .060, 0) }];
      });
      const [firstArm, ...otherArms] = armAnchors;
      register('lift-arms', firstArm.anchor, firstArm.anchor, firstArm.point, otherArms);
      pump.material = mint;
      rack.pump = pump;
      rack.valve = valve;
      rack.pumpRest = pump.position.clone();
      rack.valveRest = valve.quaternion.clone();
      rack.fallback.visible = false;
      canvas.dataset.liftModel = 'ukrainian';
      canvas.dispatchEvent(new Event('liftmodelready'));
      draw();
    });
  liftReady.catch(error => console.warn('Using the built-in lift because the Ukrainian lift could not be loaded.', error));
  const changerReady = compressedLoader.then(loader => loader.loadAsync(new URL('./models/tyre-changer.glb', import.meta.url).href))
    .then(({ scene: model }) => {
      applyEquipmentPalette(model);
      attachChangerRig(changer, model);
      for (const [id, name] of [['tyre-break', 'Break'], ['tyre-clamp', 'Clamp'], ['tyre-turn', 'Turn']]) {
        const pedal = model.getObjectByName('Changer' + name + 'Pedal');
        register(id, pedal, pedal, new T.Vector3(.108, .013, 0));
      }
      register('tyre-paste', changer.rig.brush, changer.rig.brush, new T.Vector3(0, .070, 0));
      draw();
    });
  const propsReady = compressedLoader
    .then(loader => loader.loadAsync(new URL('./models/workshop-props.glb', import.meta.url).href))
    .then(({ scene: props }) => { scene.add(props); draw(); })
    .catch(error => console.warn('The workshop props could not be loaded.', error));
  Promise.all([alloyReady, changerReady]).then(() => {
    canvas.dataset.changerModel = 'ready';
    canvas.dispatchEvent(new Event('changermodelready'));
    draw();
  }).catch(error => {
    console.warn('The tyre changer or its wheel could not be prepared.', error);
    canvas.dataset.changerModel = 'unavailable';
    canvas.dispatchEvent(new Event('changermodelfailed'));
  });

  // Both cars use the same download. Each station owns its moving parts and materials.
  const load = file => compressedLoader.then(loader => loader.loadAsync(new URL('./models/' + file, import.meta.url).href)).then(asset => asset.scene);
  const vehicleModel = load('tesla-lift.glb');
  const liftCarReady = Promise.all([liftReady, vehicleModel]).then(([, model]) => {
    fitLiftVehicle(rack, model.clone(true));
    register('lift-car', rack.vehicle, rack.vehicle, new T.Vector3(0, 1.485, .06));
    draw();
  });
  const diagnosticsReady = addDiagnosticEquipment(scene, file => file === 'tesla-lift.glb' ? vehicleModel.then(car => car.clone(true)) : load(file),
    diagnostics, draw, Math.min(8, renderer.capabilities.getMaxAnisotropy()))
    .then(rig => { diagnosticRig = rig; diagnostics.status('ready'); })
    .catch(error => { console.warn('Diagnostics models could not be loaded.', error); diagnostics.status('fallback'); });
  Promise.allSettled([liftCarReady, alloyReady, changerReady, propsReady, diagnosticsReady]).then(() => {
    document.getElementById('workshop-loading').hidden = true;
    draw();
  });

  function serviceShot(state) {
    const view = views[state.view];
    const local = (key, machine, position, distance, yaw, pitch) => ({
      key, center: machine.position.clone().add(new T.Vector3(...position)), distance, yaw, pitch, aspect: 1.27,
    });
    if (state.follow && state.view === 'changer') {
      if (state.changer.step === 'loaded') return local('bead-breaker', changer.machine, [.30,.48,.16], 2.85, .82, .42);
      if (['clamped','lubricated','upper'].includes(state.changer.step)) return local('changer-table', changer.machine, [.02,.78,.13], 2.85, .42, .51);
    }
    if (state.follow && state.view === 'balancer' && !state.closed &&
        (['inner', 'outer', 'fit', 'remove'].includes(state.nextKey) || ['indexing', 'fitting', 'removing'].includes(state.motion?.action))) {
      return local('correction-plane', stand.machine, [.02,.91,.11], 3.35, .77, .42);
    }
    if (state.view !== 'lift' || !rack.vehicle || state.liftRun.stage === 'free') return view;
    if (state.follow && ['clearArea','raiseOffLocks','releaseLocks'].includes(state.liftRun.stage)) {
      return local('lift-safety', rack.lift, [liftPanel.housing.position.x,1.42,.02], 3.45, .52, .24);
    }
    const z = rack.vehicle.position.z, exit = Math.max(0, z);
    const center = view.center.clone();
    center.z += .48 * z + .22 * exit;
    center.y += clamp(rack.vehicle.position.y / 1.8, 0, 1) * .41 - .30;
    return { ...view, center, distance: 7.15 + .46 * Math.abs(z) + .33 * exit };
  }

  function refresh(now) {
    frame = 0;
    const state = getState();
    const diagnostic = diagnostics.getState();
    currentView = diagnostic.station ?? state.view;
    zoneSigns.forEach(({ panel, face, texture }, index) => {
      const name = state.zoneNames[index];
      if (face.name === name) return;
      face.name = name;
      const ctx = panel.getContext('2d');
      ctx.clearRect(0, 0, panel.width, panel.height);
      ctx.fillStyle = '#e9ecd7'; ctx.font = '750 95px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(name.toLocaleUpperCase(), panel.width / 2, 99, panel.width - 28);
      texture.needsUpdate = true;
    });
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) {
      if (diagnostic.station === 'headlamp' && diagnostic.head.presentation === 'wall' &&
          diagnosticRig?.update(now, diagnostic)) draw();
      return;
    }
    const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5, Math.sqrt(3500000 / (clientWidth * clientHeight)));
    const nextSize = clientWidth + ':' + clientHeight + ':' + pixelRatio;
    if (nextSize !== size) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      size = nextSize;
    }
    rack.carriages.position.y = state.liftHeight / 1000;
    rack.pump.position.copy(rack.pumpRest);
    rack.pump.position.z -= state.liftDirection > 0 ? .006 : 0;
    rack.valve.quaternion.copy(rack.valveRest);
    if (state.liftDirection < 0) rack.valve.rotateX(-.15);
    liftPanel.keys.raise.position.z = state.liftDirection > 0 ? .058 : .068;
    liftPanel.keys.lower.position.z = state.liftDirection < 0 ? .058 : .068;
    liftPanel.lever.rotation.x = state.liftRun.stage === 'lowerToFloor' ? .53 : 0;
    const liftMoving = liftPose(rack, state, now);
    const beaconActive = Boolean(state.liftDirection || state.liftRun.motion?.arms);
    amberBeacon.emissiveIntensity = beaconActive && (motionReduced.matches || Math.floor(now / 350) % 2 === 0) ? 2.5 : 0;
    const motion = state.motion;
    const action = motion?.action;
    const time = motion ? clamp((now - motion.start) / motion.duration, 0, 1) : 0;
    const eased = smoothstep(time, 0, 1);
    let hoodOpening = state.closed ? 0 : 1;
    if (action === 'opening') hoodOpening = eased;
    if (action === 'closing') hoodOpening = 1 - eased;
    stand.hood.rotation.x = -1.84 * hoodOpening;
    const radial = (state.rim.diameter * .0127 + .1) / .316;
    const axial = state.rim.width / 7.5;
    stand.wheel.scale.set(axial, radial, radial);
    const lifting = state.mounted ? 1 : action === 'mounting' ? smoothstep(time, 0, .52) : 0;
    const seating = state.mounted ? 1 : action === 'mounting' ? smoothstep(time, .49, .78) : 0;
    const tightening = state.mounted ? 1 : action === 'mounting' ? smoothstep(time, .77, 1) : 0;
    const tilt = lerp(Math.PI / 2, 0, lifting);
    const halfWidth = (hasAlloyWheel ? .113 : .124) * axial;
    const tireRadius = (hasAlloyWheel ? .319 : .324) * radial;
    const floorClearance = halfWidth * Math.sin(tilt) + tireRadius * Math.cos(tilt);
    stand.carrier.rotation.z = tilt;
    stand.carrier.position.set(lerp(.86, .245, seating),
      Math.max(floorClearance + .004, lerp(halfWidth + .004, .70, lifting)), lerp(-.40, 0, lifting));
    wheelShadow.position.x = stand.carrier.position.x;
    wheelShadow.position.z = stand.carrier.position.z;
    wheelShadow.visible = !state.mounted;
    wheelShadow.material.opacity = 1 - lifting;
    wheelShadow.scale.set(radial, radial, 1);
    stand.fitted.visible = state.mounted;
    let indexAngle = state.angle;
    if (action === 'indexing') {
      const travel = T.MathUtils.euclideanModulo(motion.detail - indexAngle + 180, 360) - 180;
      indexAngle += travel * eased;
    }
    stand.wheel.rotation.x = lerp(.30, -degToRad(indexAngle), lifting) + (motionReduced.matches ? 0 : degToRad(state.turn));
    stand.clamp.visible = state.mounted || (action === 'mounting' && time >= .77);
    stand.clamp.position.set(.245 + halfWidth + .22 * (1 - tightening), .70, 0);
    stand.clamp.rotation.x = stand.wheel.rotation.x - 3 * Math.PI * (1 - tightening);

    const nextWeights = JSON.stringify([hasAlloyWheel, state.weights]);
    const weightRadius = hasAlloyWheel ? .221 : .217;
    for (const plane of planes) {
      const angle = state.correctionAngles[plane];
      const mark = stand.marks[plane];
      mark.visible = state.mounted && angle != null;
      if (mark.visible) positionOnRim(mark, angle, weightRadius, rimOffset[plane]);
    }
    if (nextWeights !== weights) {
      for (const item of [...stand.fitted.children]) {
        stand.fitted.remove(item);
        item.geometry.dispose();
      }
      for (const weight of state.weights) {
        const block = box(stand.fitted, [.026, .014, .018 + weight.grams * .00055], fittedPaint[weight.plane], 0, 0, 0);
        positionOnRim(block, weight.angle, weightRadius, rimOffset[weight.plane]);
      }
      weights = nextWeights;
    }
    stand.weightInHand.visible = action === 'fitting';
    if (action === 'fitting') {
      const { plane, grams, angle } = motion.detail;
      const radius = weightRadius + .11 * (1 - eased);
      const offset = rimOffset[plane] + Math.sign(rimOffset[plane]) * .15 * (1 - eased);
      stand.weightInHand.material = fittedPaint[plane];
      positionOnRim(stand.weightInHand, angle, radius, offset);
      stand.weightInHand.scale.set(.026, .014, .018 + grams * .00055);
    }
    const changerMoving = updateTyreChanger(changer, state.changer, now);
    changerShadow.position.set(changer.carrier.position.x, .008, changer.carrier.position.z);
    changerShadow.visible = changer.carrier.visible && changer.carrier.position.y < .32;

    const activeControl = controlEnabled(hovered) ? hovered : undefined;
    canvas.classList.toggle('console-active', Boolean(activeControl));
    if (!canvas.classList.contains('aim-screw-active')) canvas.title = activeControl ? controls[activeControl].textContent : '';
    const screenCue = state.nextKey in screenControls && (motionReduced.matches || Math.floor(now / 480) % 2 === 0) ? state.nextKey : '';
    const screenHover = hovered in screenControls ? hovered : '';
    const nextLabels = JSON.stringify([state.console, ...Object.keys(screenControls).map(id => controls[id].disabled), screenHover, screenCue]);
    if (nextLabels !== labels) {
      drawConsole(stand.display, state.console, controls, screenHover, screenCue);
      labels = nextLabels;
    }
    const diagnosticMoving = diagnosticRig?.update(now, diagnostic);
    const view = manualShot ?? (diagnostic.station ? diagnosticRig?.cameraView(diagnostic, state.follow) ?? views.bay : serviceShot(state));
    currentShot = view;
    const nextKey = view.key ?? (diagnostic.station ? 'bay' : currentView);
    if (!walker && nextKey !== shotKey) {
      const travel = lastCenter.distanceTo(view.center);
      flight = shotKey && !view.pit && !['axle','rear'].includes(shotKey) && !motionReduced.matches ? { camera: camera.position.clone(), center: lastCenter.clone(), start: now,
        duration: travel > 4 ? 950 : 540, rise: Math.min(3.4, travel * .15) } : null;
      shotKey = nextKey;
      yaw = view.yaw; pitch = view.pitch; zoom = 1; hovered = undefined;
      panOffset.set(0, 0, 0);
    }
    const center = view.center.clone().add(panOffset);
    const aspectFit = Math.max(1, view.aspect / camera.aspect);
    const startingDistance = view.distance * (view.pit ? Math.min(1.15, aspectFit) : aspectFit);
    zoomLimit = Math.max(2.5, 82 / startingDistance);
    zoom = Math.min(zoom, zoomLimit);
    // Below the slab, widen the lens as the camera pulls back from the pit.
    const underground = center.y + startingDistance * Math.sin(pitch) < -.20 && insidePit(center);
    const lensFactor = underground ? Math.min(3.25, Math.max(1, zoom)) : 1;
    const lensZoom = walker ? 1 / walker.zoom : 1 / lensFactor;
    let walking = false;
    if (walker) {
      walking = updateWalk(now);
      camera.position.copy(walker.position);
      center.set(Math.cos(walker.pitch) * Math.sin(walker.yaw), Math.sin(walker.pitch),
        Math.cos(walker.pitch) * Math.cos(walker.yaw)).add(camera.position);
    } else {
      const distance = startingDistance * (underground ? Math.min(1, zoom) : zoom);
      camera.position.set(center.x + distance * Math.cos(pitch) * Math.sin(yaw),
        center.y + distance * Math.sin(pitch), center.z + distance * Math.cos(pitch) * Math.cos(yaw));
      if (flight) {
        const fraction = smoothstep(now - flight.start, 0, flight.duration);
        camera.position.lerp(flight.camera, 1 - fraction);
        camera.position.y += Math.sin(fraction * Math.PI) * flight.rise;
        center.lerp(flight.center, 1 - fraction);
        if (fraction === 1) flight = null;
      }
    }
    stairsButton.hidden = !insidePit(camera.position) || camera.position.y >= 0;
    lastCenter.copy(center);
    camera.lookAt(center);
    const distance = walker ? 0 : camera.position.distanceTo(center);
    const distant = distance > 85 || camera.position.y > 55;
    const extraVisibility = Math.max(0, distance - 23) * 1.45;
    const far = distant ? Math.max(750, Math.ceil(distance * 2)) : Math.ceil(85 + extraVisibility);
    const near = distance > 70 || camera.position.y > 32 ? 1.2 : .035;
    if (camera.far !== far || camera.near !== near || camera.zoom !== lensZoom) {
      camera.far = far;
      camera.near = near;
      camera.zoom = lensZoom;
      camera.updateProjectionMatrix();
    }
    scene.fog.near = distant ? 630 : 25 + extraVisibility;
    scene.fog.far = distant ? far : 62 + extraVisibility;
    renderer.toneMappingExposure = diagnostic.station === 'headlamp' && diagnostic.head.comparisonBeam !== null ? .45 : 1.24;
    for (const mark of Object.values(stand.marks)) {
      if (mark.visible) mark.userData.badge.quaternion.copy(mark.getWorldQuaternion(inverseMarkRotation).invert()).multiply(camera.quaternion);
    }
    renderer.render(scene, camera);
    diagnosticRig?.project(camera, flight ? [] : diagnostic.actions);
    if (diagnostic.station || flight) cues.forEach(cue => { cue.hidden = true; });
    else showActuators(state.liftActive ? (state.liftTarget ? [state.liftTarget] : ['raise', 'lower']) : [state.nextKey]);
    if (walking || flight || diagnosticMoving || (motion && time < 1) || changerMoving || liftMoving) draw();
    else if (!diagnostic.station && state.nextKey in screenControls && !motionReduced.matches && !cueTimer) {
      cueTimer = setTimeout(() => { cueTimer = 0; if (!canvas.hidden) draw(); }, 480);
    }
  }
  function draw() {
    if (!frame) frame = requestAnimationFrame(refresh);
  }

  function takeCameraControl() {
    if (walker || manualShot || !currentShot) return;
    manualShot = { ...currentShot, key: shotKey };
    flight = null;
  }

  function startWalk() {
    if (walker || !size || canvas.hidden) return;
    const direction = camera.getWorldDirection(new T.Vector3());
    const { x, y, z } = walkStart(camera.position);
    walker = { position: new T.Vector3(x, y, z), yaw: Math.atan2(direction.x, direction.z),
      pitch: Math.asin(direction.y), last: performance.now(), onGround: false, zoom: 1 / camera.zoom };
    flight = null;
    stage.dataset.walking = 'true';
    walkPad.hidden = walkHint.hidden = false;
    diagnostics.setPitLocation(insidePit(walker.position));
    stage.focus({ preventScroll: true });
    draw();
  }

  function stopWalk() {
    if (!walker) return;
    walker = undefined;
    heldWalk.clear();
    delete stage.dataset.walking;
    walkPad.hidden = walkHint.hidden = true;
    manualShot = undefined;
    shotKey = undefined;
    diagnostics.setPitLocation(null);
    draw();
  }

  function moveWalk(forward, right, distance) {
    const step = distance / Math.hypot(forward, right);
    const dx = (Math.sin(walker.yaw) * forward - Math.cos(walker.yaw) * right) * step;
    const dz = (Math.cos(walker.yaw) * forward + Math.sin(walker.yaw) * right) * step;
    const { x, z } = walkStep(walker.position, dx, dz);
    walker.position.x = x;
    walker.position.z = z;
    walker.onGround = true;
    diagnostics.setPitLocation(insidePit(walker.position));
  }

  function updateWalk(now) {
    const directions = new Set(heldWalk.values());
    const forward = Number(directions.has('forward')) - Number(directions.has('back'));
    const right = Number(directions.has('right')) - Number(directions.has('left'));
    const elapsed = clamp((now - walker.last) / 1000, 0, .055);
    walker.last = now;
    if (forward || right) moveWalk(forward, right, 1.6 * elapsed);
    if (!walker.onGround) return false;
    const target = walkingEye(walker.position);
    const adjusted = Math.abs(target - walker.position.y) > .003;
    walker.position.y = adjusted ? lerp(walker.position.y, target, 1 - Math.exp(-13 * elapsed)) : target;
    return Boolean(forward || right || adjusted);
  }

  stairsButton.addEventListener('click', () => {
    startWalk();
    if (!walker) return;
    walker.yaw = Math.atan2(pitX - walker.position.x, pitRear - .48 - walker.position.z);
    walker.pitch = .06;
    stage.focus({ preventScroll: true });
    draw();
  });
  stage.addEventListener('keydown', event => {
    if (event.altKey || event.metaKey || event.ctrlKey || canvas.hidden) return;
    const key = event.key.toLowerCase();
    if (key === 'escape' && walker) { stopWalk(); return; }
    if (!Object.hasOwn(walkKeys, key) || (!walker && key.startsWith('arrow'))) return;
    startWalk();
    if (!walker) return;
    event.preventDefault();
    heldWalk.set(key, walkKeys[key]);
    draw();
  });
  window.addEventListener('keyup', event => { heldWalk.delete(event.key.toLowerCase()); });
  window.addEventListener('blur', () => heldWalk.clear());
  for (const button of walkPad.querySelectorAll('[data-walk-direction]')) {
    const direction = button.dataset.walkDirection;
    let start;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !walker) return;
      start = walker.position.clone();
      button.setPointerCapture(event.pointerId);
      heldWalk.set(event.pointerId, direction);
      draw();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => { heldWalk.delete(event.pointerId); });
    }
    button.addEventListener('click', event => {
      if (!walker || (event.detail !== 0 && start
          && Math.hypot(start.x - walker.position.x, start.z - walker.position.z) > .02)) return;
      moveWalk(Number(direction === 'forward') - Number(direction === 'back'),
        Number(direction === 'right') - Number(direction === 'left'), .18);
      draw();
    });
  }

  function controlEnabled(id) {
    const control = controls[id];
    return control && !control.disabled && (!id.startsWith('lift-') || control.dataset.control === id);
  }

  function firstSurface() {
    const hits = ray.intersectObjects(equipment, true);
    for (const hit of hits) {
      if (!hit.object.isMesh || !hit.object.material?.depthTest) continue;
      let control;
      let visible = true;
      for (let part = hit.object; part; part = part.parent) {
        if (!part.visible) { visible = false; break; }
        control ??= part.userData.control;
      }
      if (!visible) continue;
      if (hit.object === stand.display.face) {
        const x = hit.uv.x * 640;
        const y = (1 - hit.uv.y) * 360;
        control = Object.keys(screenControls).find(id => {
          const [left, top, width, height] = screenControls[id];
          return x >= left && x <= left + width && y >= top && y <= top + height;
        });
      }
      if (control || !hit.object.material?.transparent) return { control, distance: hit.distance };
    }
    return null;
  }

  function showActuators(ids) {
    for (const [index, indicator] of cues.entries()) {
      const id = ids[index];
      const actuator = actuators.get(id);
      indicator.hidden = true;
      if (!actuator || !controlEnabled(id)) continue;
      for (const { anchor, point: local } of [actuator, ...actuator.alternates]) {
        const point = anchor.localToWorld(local.clone());
        const projected = point.clone().project(camera);
        if (Math.abs(projected.x) > .97 || Math.abs(projected.y) > .97 || Math.abs(projected.z) > 1) continue;
        ray.setFromCamera(mouse.set(projected.x, projected.y), camera);
        const hit = firstSurface();
        if (hit && hit.control !== id && hit.distance < ray.ray.origin.distanceTo(point) - .02) continue;
        indicator.style.left = ((projected.x + 1) * 50) + '%';
        indicator.style.top = ((1 - projected.y) * 50) + '%';
        indicator.dataset.control = id;
        indicator.textContent = ['fit', 'lift-car', 'lift-arms', 'lift-lock'].includes(id) ? controls[id].textContent : '';
        indicator.hidden = false;
        break;
      }
    }
  }

  function pointRay(event) {
    const { left, top, width, height } = canvas.getBoundingClientRect();
    mouse.set(2 * (event.clientX - left) / width - 1, 1 - 2 * (event.clientY - top) / height);
    ray.setFromCamera(mouse, camera);
  }

  function buttonAt(event) {
    if (!size || diagnostics.getState().station) return undefined;
    pointRay(event);
    const id = firstSurface()?.control;
    if (controlEnabled(id)) return id;
    for (const indicator of cues) {
      if (indicator.hidden || !controlEnabled(indicator.dataset.control)) continue;
      const cue = indicator.getBoundingClientRect();
      if (event.clientX >= cue.left && event.clientX <= cue.right && event.clientY >= cue.top && event.clientY <= cue.bottom) {
        return indicator.dataset.control;
      }
    }
    return undefined;
  }

  const liftKeys = { raise: 1, lower: -1 };
  function adjusterAt(event) {
    if (!size || flight || diagnostics.getState().station !== 'headlamp') return;
    pointRay(event);
    return diagnosticRig?.adjusterAt(ray, event.clientX, event.clientY);
  }
  function releaseButton() {
    if (pointing?.key in liftKeys) moveLift(0);
    pointing = undefined;
    draw();
  }
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || ![0, 2].includes(event.button)) return;
    const pan = !walker && (event.shiftKey || event.button === 2);
    if (event.button === 2 && !pan) return;
    const key = pan ? undefined : buttonAt(event);
    pointing = { key, pan, adjuster: pan ? undefined : adjusterAt(event), id: event.pointerId, x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    if (key in liftKeys) moveLift(liftKeys[key]);
    draw();
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointing) {
      const key = buttonAt(event);
      const screw = adjusterAt(event);
      canvas.classList.toggle('aim-screw-active', screw !== undefined);
      if (screw !== undefined) canvas.title = diagnostics.text(screw === 0 ? 'horizontalScrew' : 'verticalScrew');
      else if (!key) canvas.title = '';
      if (hovered !== key) {
        hovered = key;
        draw();
      }
    } else if (event.pointerId === pointing.id && pointing.adjuster !== undefined) {
      const step = Math.trunc((event.clientX - pointing.x) / 10);
      if (step) {
        pointing.x += step * 10;
        diagnostics.turnAimScrew(pointing.adjuster, step);
      }
    } else if (event.pointerId === pointing.id && !pointing.key) {
      const dx = event.clientX - pointing.x;
      const dy = event.clientY - pointing.y;
      if (walker) {
        walker.yaw -= dx * .008;
        walker.pitch = clamp(walker.pitch - dy * .008, -1.35, 1.35);
      } else {
        takeCameraControl();
        if (pointing.pan) {
          const scale = 2 * camera.position.distanceTo(lastCenter) * Math.tan(T.MathUtils.degToRad(camera.getEffectiveFOV() / 2)) / stage.clientHeight;
          panOffset.addScaledVector(panAxis.setFromMatrixColumn(camera.matrixWorld, 0), -dx * scale);
          panOffset.addScaledVector(panAxis.setFromMatrixColumn(camera.matrixWorld, 1), dy * scale);
        } else {
          yaw -= dx * .011;
          pitch = clamp(pitch + dy * .011, -1.565, 1.565);
        }
      }
      pointing.x = event.clientX;
      pointing.y = event.clientY;
      hovered = undefined;
      draw();
    }
  });
  canvas.addEventListener('pointerup', event => {
    if (event.pointerId !== pointing?.id) return;
    const { key, pan, adjuster, startX: x, startY: y } = pointing;
    releaseButton();
    if (!pan && adjuster === undefined && diagnostics.getState().station === 'headlamp' && Math.hypot(event.clientX - x, event.clientY - y) < 6) {
      pointRay(event);
      diagnosticRig?.probe(ray);
    }
    if (controlEnabled(key) && !(key in liftKeys) && Math.hypot(event.clientX - x, event.clientY - y) < 8 && buttonAt(event) === key) {
      controls[key].click();
    }
  });
  canvas.addEventListener('pointerleave', () => { hovered = undefined; canvas.classList.remove('aim-screw-active'); draw(); });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  function zoomBy(factor) {
    if (walker) walker.zoom = clamp(walker.zoom * factor, .64, 3.25);
    else {
      takeCameraControl();
      zoom = clamp(zoom * factor, .32, zoomLimit);
    }
    draw();
  }
  canvas.parentElement.addEventListener('wheel', event => {
    if (canvas.hidden || !event.deltaY) return;
    event.preventDefault();
    zoomBy(event.deltaY > 0 ? 1.12 : 1 / 1.12);
  }, { passive: false, capture: true });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(name, event => {
      if (pointing?.id === event.pointerId) releaseButton();
    });
  }
  new ResizeObserver(draw).observe(canvas);
  draw();
  return {
    draw,
    loadVehicle: () => liftCarReady,
    resetView() { stopWalk(); manualShot = undefined; shotKey = undefined; draw(); },
    zoom: zoomBy,
    rotate() {
      if (walker) walker.yaw += Math.PI / 3;
      else { takeCameraControl(); yaw += Math.PI / 3; }
      draw();
    },
  };
}
