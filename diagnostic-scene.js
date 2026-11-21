import * as T from './vendor/three/three.module.min.js';
import { alignmentPit, alignmentRails, buildRearToe, buildSteering, paintAlignmentMonitor, poseRearToe, poseSteering } from './diagnostic-axle.js';
import { aim, alignmentReadings, headStage, lampCenter, lampHeight, lampSeparation, lampSides, lampTypes, pendingAimAxis, requiredBeam, wallMark, wheels } from './diagnostic-model.js';
import { paintAimingWall, paintBeamFloor, paintHeadlampIndicator, paintWall, screen, wallPoint } from './diagnostic-beams.js';
import { buildBeamComparison } from './diagnostic-comparison.js';
import { addPorscheControls, addPorscheHeadlampCovers, addPorschePositionLights } from './diagnostic-porsche.js';

const { degToRad, clamp, lerp, smoothstep } = T.MathUtils;
const material = color => new T.MeshStandardMaterial({ color, metalness: .22, roughness: .48 });
const metal = material(0x758e91);
const dark = material(0x223837);
const amber = material(0xbb743e);
const alignmentPosition = alignmentPit.x;
const headlampPosition = 13.3;
const sourceZ = 1.08;
const wallZ = sourceZ - 7.62;
const floorBeamWidth = 5;
const rimX = .79;
const wheelRadius = .345;
const axleZ = [1.56, -1.3];

function mesh(parent, geo, surface, x, y, z) {
  const part = new T.Mesh(geo, surface);
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}
const box = (parent, size, surface, x, y, z) => mesh(parent, new T.BoxGeometry(...size), surface, x, y, z);
const cyl = (parent, radius, height, surface, x, y, z, sides = 32) =>
  mesh(parent, new T.CylinderGeometry(radius, radius, height, sides), surface, x, y, z);

function textureScreen(surface, canvas, width, height) {
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  if (surface) {
    const plane = mesh(surface, new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({ map: texture, toneMapped: false }), 0, 0, .002);
    surface.material = dark;
    return { texture, plane };
  }
  return { texture };
}

function headlampHaze(rig) {
  const geometry = new T.BoxGeometry(2, 2, 1).translate(0, 0, -.5);
  const haze = new T.ShaderMaterial({
    uniforms: { tint: { value: new T.Color() }, strength: { value: 0 }, dipped: { value: 1 },
      cameraLocal: { value: new T.Vector3() }, extent: { value: new T.Vector3() } },
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
    vertexShader: `
      varying vec3 localPoint;
      void main() {
        localPoint = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 tint;
      uniform vec3 cameraLocal;
      uniform vec3 extent;
      uniform float strength;
      uniform float dipped;
      varying vec3 localPoint;
      void main() {
        vec3 direction = normalize(localPoint - cameraLocal);
        vec3 ray = mix(vec3(-1.0), vec3(1.0), step(vec3(0.0), direction)) * max(abs(direction), vec3(0.0001));
        vec3 a = (vec3(-1.0, -1.0, -1.0) - localPoint) / ray;
        vec3 b = (vec3(1.0, 1.0, 0.0) - localPoint) / ray;
        vec3 exit = max(a, b);
        float segment = max(0.0, min(exit.x, min(exit.y, exit.z)));
        float density = 0.0;
        for (int i = 0; i < 24; i++) {
          vec3 p = localPoint + direction * segment * (float(i) + 0.5) / 24.0;
          float range = clamp(-p.z, 0.0, 1.0);
          float spread = 0.048 + 0.92 * range;
          vec2 crossSection = (p.xy + vec2(0.0, 0.26 * dipped * range)) / spread;
          float radial = dot(crossSection, crossSection);
          float cutoff = mix(1.0, 1.0 - smoothstep(0.08, 0.23, p.y / spread), dipped);
          density += exp(-3.6 * radial) * (1.0 - smoothstep(0.70, 1.0, radial)) * cutoff
            * (1.0 - 0.63 * smoothstep(0.67, 1.0, range));
        }
        float opticalDepth = density * segment * length(direction * extent) / 24.0;
        gl_FragColor = vec4(tint, 1.0 - exp(-strength * opticalDepth));
        #include <colorspace_fragment>
      }`,
  });
  const beam = new T.Mesh(geometry, haze);
  const inverseWorld = new T.Matrix4();
  beam.onBeforeRender = (_renderer, _scene, camera) => {
    inverseWorld.copy(beam.matrixWorld).invert();
    haze.uniforms.cameraLocal.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inverseWorld);
    haze.uniforms.extent.value.copy(beam.scale);
  };
  rig.add(beam);
  return { beam, haze };
}

function wallDistanceMarks(parent, anisotropy) {
  return [5, 7.62, 10].map(distance => {
    const z = wallZ + distance;
    const line = box(parent, [2.98,.006,.027], amber.clone(), -.44,.006,z);
    const panel = document.createElement('canvas');
    panel.width = 384;
    panel.height = 144;
    const context = panel.getContext('2d');
    context.fillStyle = '#172c27';
    context.fillRect(0, 0, panel.width, panel.height);
    context.fillStyle = '#ffefb9';
    context.font = '750 89px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(distance + ' m', 192, 76);
    const { texture } = textureScreen(null, panel);
    texture.anisotropy = anisotropy;
    const label = mesh(parent, new T.PlaneGeometry(.86,.324), new T.MeshBasicMaterial({ map: texture, toneMapped: false }),
      1.35,.012,z);
    label.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    label.name = 'Wall distance ' + distance + ' m';
    return { distance, line, label };
  });
}

function vehicleWheels(vehicle) {
  const body = vehicle.getObjectByName('TeslaModel3');
  const glassBody = new T.MeshStandardMaterial({ color: 0x94c9d2, transparent: true, opacity: .22, depthWrite: false, roughness: .46 });
  const glassTrim = new T.MeshBasicMaterial({ color: 0x86b5c1, transparent: true, opacity: .045, depthWrite: false });
  const hubs = wheels.map((_, index) => {
    const hub = new T.Group();
    hub.position.set((index % 2 ? -1 : 1) * rimX, wheelRadius, axleZ[index < 2 ? 0 : 1]);
    const rotor = new T.Group();
    hub.add(rotor);
    body.add(hub);
    return { hub, rotor };
  });
  const shell = [], surfaces = new Map();
  for (const part of [...body.children]) {
    if (!part.isMesh) continue;
    if (!part.name.startsWith('wheels')) {
      if (!surfaces.has(part.material)) surfaces.set(part.material, part.material.clone());
      part.material = surfaces.get(part.material);
      if (part.material.name === 'paint') part.material.color.setHex(0x879b9c);
      shell.push({ part, solid: part.material, translucent: part.material.name === 'paint' ? glassBody : glassTrim });
      continue;
    }
    const geometry = part.geometry;
    const positions = geometry.getAttribute('position');
    const index = geometry.getIndex();
    geometry.computeBoundingBox();
    const firstHub = geometry.boundingBox.getCenter(new T.Vector3()).z > 0 ? 0 : 2;
    const parts = [[], []];
    for (let i = 0; i < (index?.count ?? positions.count); i += 3) {
      const a = index ? index.getX(i) : i;
      const b = index ? index.getX(i + 1) : i + 1;
      const c = index ? index.getX(i + 2) : i + 2;
      parts[positions.getX(a) + positions.getX(b) + positions.getX(c) > 0 ? 0 : 1].push(a, b, c);
    }
    for (const [side, ids] of parts.entries()) {
      const { hub, rotor } = hubs[firstHub + side];
      const piece = geometry.clone();
      piece.setIndex(ids);
      piece.translate(-hub.position.x, -hub.position.y, -hub.position.z);
      rotor.add(new T.Mesh(piece, part.material));
    }
    part.removeFromParent();
  }
  return { hubs, shell };
}

export async function addDiagnosticEquipment(scene, load, ui, draw, screenAnisotropy) {
  const { getState, act: onAction, text } = ui;
  const hotspotLayer = document.getElementById('diagnostic-hotspots');
  const [alignment, beamsetter, vehicle, porsche] = await Promise.all([
    load('alignment-stand.glb'), load('headlamp-stand.glb'), load('tesla-lift.glb'), load('porsche-911.glb?v=controls'),
  ]);
  const alignmentBay = new T.Group();
  alignmentBay.name = 'Alignment lane';
  alignmentBay.position.x = alignmentPosition;
  scene.add(alignmentBay);
  alignment.position.set(0, 0, 3.75);
  alignment.rotation.y = Math.PI;
  vehicle.position.y = .078;
  alignmentBay.add(alignment, vehicle);
  const { hubs, shell } = vehicleWheels(vehicle);
  const body = vehicle.getObjectByName('TeslaModel3');
  const driverGlass = body.children.find(part => part.name.startsWith('door_lf_glass'));
  const glassHeight = driverGlass.position.y;
  const steeringWheel = new T.Group();
  steeringWheel.name = 'Driver steering wheel';
  steeringWheel.position.set(.396, .842, .574);
  body.add(steeringWheel);
  for (const part of [...body.children]) {
    if (part.userData.name?.startsWith('movsteer_1.0_movsteer_')) steeringWheel.attach(part);
  }
  const columnAxis = new T.Vector3(0, .45, -.89).normalize();
  const consolePanel = document.getElementById('alignment-monitor');
  const alignmentDisplay = alignment.getObjectByName('AlignmentDisplay');
  const consoleTexture = textureScreen(alignmentDisplay, consolePanel, .583, .319).texture;
  consoleTexture.anisotropy = screenAnisotropy;
  consoleTexture.minFilter = T.LinearMipmapLinearFilter;
  const rail = alignment.getObjectByName('CameraRail');
  const railHeight = rail.position.y;
  const targets = wheels.map((name, index) => {
    const group = alignment.getObjectByName('Target_' + name);
    const reflector = group.children.find(part => part.userData.name?.includes('reflective target'));
    const clamp = new T.Group();
    clamp.name = 'Rim clamp';
    for (const part of [...group.children]) {
      if (part !== reflector) clamp.add(part);
    }
    group.add(clamp);
    const side = index % 2 ? -1 : 1;
    return { group, reflector, clamp, side, fit: 0, parent: group.parent, home: group.position.clone(),
      rotation: group.quaternion.clone(), ...hubs[index] };
  });
  const fitTarget = (target, fit) => {
    target.fit = fit;
    target.clamp.scale.y = lerp(1, 1.82, fit);
    target.reflector.rotation.y = -target.side * Math.PI / 2 * fit;
  };
  const turnplates = [];
  for (const side of [-1, 1]) {
    const { rear, front, height } = alignmentRails;
    box(alignmentBay, [.63, height, front - rear], dark, side * rimX, height / 2, (front + rear) / 2);
    box(alignmentBay, [.61, .035, .60], metal, side * rimX, .055, axleZ[1]);
    turnplates.push(cyl(alignmentBay, .322, .044, metal, side * rimX, .055, axleZ[0]));
    box(alignmentBay, [.026, .004, 5.52], amber, side * 1.2, .004, .08);
  }
  const { rack: steering, ties } = buildSteering(vehicle, hubs, alignmentBay);
  const { subframe, links } = buildRearToe(vehicle, hubs);

  const lightBay = new T.Group();
  lightBay.name = 'Headlamp lane';
  lightBay.position.x = headlampPosition;
  scene.add(lightBay);
  const rig = new T.Group();
  lightBay.add(rig);
  rig.add(beamsetter);
  // The exported stand is turned for its Blender preview. Its lens faces +Z at zero yaw.
  beamsetter.getObjectByName('headlamp-stand').rotation.y = 0;
  lightBay.updateWorldMatrix(true, true);
  const carriage = beamsetter.getObjectByName('HeightCarriage');
  const fresnelCenter = lightBay.worldToLocal(new T.Box3().setFromObject(beamsetter.getObjectByName('FresnelLens')).getCenter(new T.Vector3()));
  const carriageHome = carriage.position.y;
  const headDisplay = beamsetter.getObjectByName('BeamsetterDisplay');
  const headPanel = document.createElement('canvas');
  headPanel.width = 520;
  headPanel.height = 292;
  const headTexture = textureScreen(headDisplay, headPanel, .232, .132).texture;
  const lamp = new T.Group();
  lamp.position.set(0, lampHeight, sourceZ);
  lamp.name = 'Right headlamp reference';
  // Porsche GLB faces -Z. Reference the right lens face, ahead of the projector.
  porsche.position.set(-lampSeparation / 2, 0, sourceZ + 1.61);
  porsche.name = 'Porsche 911';
  rig.add(lamp, porsche);
  const glass = porsche.getObjectByName('Window').material;
  glass.color.setHex(0xa2c8d2);
  glass.transparent = true;
  glass.opacity = .26;
  glass.depthWrite = false;
  glass.metalness = .05;
  glass.roughness = .17;
  const comparison = buildBeamComparison(lightBay, porsche, sourceZ, text);
  const porscheControls = addPorscheControls(porsche);
  porscheControls.driverGlass.visible = false;
  const positionLights = addPorschePositionLights(porsche);
  const headlampCovers = addPorscheHeadlampCovers(porsche);
  let emitter;
  porsche.traverse(part => {
    if (part.material?.name === 'Web lamp emii.002') emitter = part.material;
  });
  const beams = lampSides.map(side => {
    const x = lampCenter(side) - lampSeparation / 2;
    const { beam, haze } = headlampHaze(rig);
    beam.name = side + ' headlamp haze';
    beam.position.copy(lamp.position);
    beam.position.x = x;
    return { side, beam, haze, cover: headlampCovers[side] };
  });
  const forward = new T.Vector3(0, 0, -1);
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 1050;
  wallCanvas.height = 350;
  const { texture: wallTexture } = textureScreen(null, wallCanvas);
  const wallHeight = screen.top - screen.bottom;
  const wall = mesh(lightBay, new T.PlaneGeometry(2 * screen.halfWidth, wallHeight),
    new T.MeshBasicMaterial({ map: wallTexture, toneMapped: false }), 0, wallHeight / 2, -6);
  wall.name = 'Marked aiming wall';
  const frame = box(lightBay, [2 * screen.halfWidth + .16,wallHeight + .12,.08], metal, 0, wallHeight / 2, -6.05);
  frame.name = 'Aiming wall trolley';
  for (const x of [-1, 1].map(side => side * (screen.halfWidth + .04))) {
    box(frame, [.14, .07, .54], dark, x, .10 - wallHeight / 2, 0);
    for (const z of [-.18, .18]) cyl(frame, .045, .047, dark, x, .045 - wallHeight / 2, z, 16).rotation.z = Math.PI / 2;
  }
  const centerline = box(lightBay, [.014,.005,10], amber, -lampSeparation / 2,.001,-3.9);
  const distanceMarks = wallDistanceMarks(lightBay, screenAnisotropy);
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 180;
  floorCanvas.height = 144;
  const { texture: floorTexture } = textureScreen(null, floorCanvas);
  const floorBeam = mesh(lightBay, new T.PlaneGeometry(floorBeamWidth, 1),
    new T.MeshBasicMaterial({ map: floorTexture, transparent: true, depthWrite: false,
      blending: T.AdditiveBlending, toneMapped: false }), -lampSeparation / 2, .009, 0);
  floorBeam.name = 'Headlamp illumination on the floor';
  floorBeam.rotation.x = -Math.PI / 2;

  const hot = new Map();
  const shot = (x, y, z, distance, yaw, pitch) => ({ center: new T.Vector3(x,y,z), distance, yaw, pitch, aspect: 1.22 });
  alignmentBay.updateWorldMatrix(true, true);
  const monitor = alignmentDisplay.getWorldPosition(new T.Vector3());
  const monitorDirection = new T.Vector3(0, 0, 1).transformDirection(alignmentDisplay.matrixWorld);
  const views = {
    diagnostics: shot(6.5, .73, .65, 24.0, .02, .46),
    alignment: shot(alignmentPosition, .86, .89, 10.4, .30, .55),
    cockpit: shot(alignmentPosition + .396, .920, .574, 1.96, 2.28, .46),
    axle: { ...shot(alignmentPosition, .24, 1.44, 2.24, Math.PI, -.45), pit: true },
    rear: { ...shot(alignmentPosition, .19, -1.46, 2.16, 0, -.45), pit: true },
    monitor: shot(monitor.x, monitor.y, monitor.z, 1.28, Math.atan2(monitorDirection.x, monitorDirection.z), .12),
    headlamp: shot(headlampPosition, .78, -1.90, 12.8, 1.02, .43),
    optics: shot(headlampPosition - .10, .79, sourceZ + .25, 4.7, 2.05, .48),
    cabin: shot(headlampPosition - 1.04, .80, sourceZ + 1.38, 1.48, -1.12, .39),
    beams: { ...shot(headlampPosition - .48, .53, -1.56, 17.9, 1.38, .51), aspect: 1.36 },
    wall: { ...shot(headlampPosition - .55, .80, wallZ, 6.25, .17, .125), aspect: 1.52 },
    road: { ...shot(headlampPosition + (comparison.stripLeft + comparison.stripRight) / 2, 0,
      sourceZ - 54.25, 101, 1.42, 1.31), aspect: 2.14 },
  };
  let labels = '', optics = '', floorPattern = '', telltale = null, cutaway = false;
  let travel, windowTravel;
  let driverAxis = -1;
  let glassOpening = 0;
  let currentDistance = 7.62;
  const standPose = { value: 0, goal: 0 };
  const lensSide = { value: 0, goal: 0 };
  const hoodPose = { value: 0, goal: 0 };
  const comparisonParking = { value: 0, goal: 0 };
  const opticalMotion = [standPose, lensSide, hoodPose, comparisonParking];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function move(pose, goal, time, duration) {
    if (pose.goal !== goal) {
      pose.goal = goal;
      pose.from = pose.value;
      pose.start = reduced.matches ? undefined : time;
    }
    const fraction = pose.start === undefined ? 1 : smoothstep(time - pose.start, 0, duration);
    pose.value = fraction === 1 ? goal : lerp(pose.from, goal, fraction);
    if (fraction === 1) pose.start = undefined;
    return pose.value;
  }

  function cameraView(state, follow) {
    const {station, alignment: al, head} = state;
    let name = station ?? 'diagnostics';
    if (name === 'alignment') {
      if (al.monitorView) name = 'monitor';
      else if (al.axleView) name = al.axle ? 'rear' : 'axle';
      else if (follow && al.stage === 'sweep') name = 'cockpit';
    } else if (name === 'headlamp') {
      if (head.presentation === 'adjusters') name = 'optics';
      else if (['wall', 'cabin', 'beams', 'road'].includes(head.presentation)) name = head.presentation;
      else if (follow && headStage(head, head.method) !== 'position') name = 'optics';
    }
    const view = views[name];
    const center = view.center.clone();
    const distanceSetting = head.comparisonBeam === null ? head.distance : 7.62;
    if (['optics', 'cabin'].includes(name)) center.z += distanceSetting - 7.62;
    const wide = name === 'beams';
    if (wide) center.z += (distanceSetting - 7.62) / 2;
    const distance = view.distance + (wide ? .63 * (distanceSetting - 7.62) : 0);
    const left = head.side === 'left' && name === 'optics';
    if (left) center.x -= .84;
    return { ...view, center, distance, yaw: left ? -view.yaw : view.yaw, key: name };
  }

  function updateHotspots(actions, camera) {
    const needed = new Set();
    for (const { id, label, description = label, recommended = false, mounted = false, pressed, point,
      ring = false, guide = false, marker = '', offset = [0, 0] } of actions) {
      const pos = point.project(camera);
      if (Math.abs(pos.x) > .93 || Math.abs(pos.y) > .93 || Math.abs(pos.z) > 1) continue;
      let button = hot.get(id);
      if (!button) {
        button = document.createElement(mounted || guide ? 'span' : 'button');
        button.dataset.action = id;
        if (mounted) button.className = 'mounted-target';
        if (ring) button.className = 'actuator-cue';
        if (guide) {
          button.classList.add('aim-guide');
          button.setAttribute('aria-hidden', 'true');
        }
        if (!mounted && !guide) {
          button.type = 'button';
          button.addEventListener('click', () => onAction(id));
        }
        hotspotLayer.append(button);
        hot.set(id, button);
      }
      button.textContent = ring ? marker : label;
      button.setAttribute('aria-label', description);
      if (pressed !== undefined) button.setAttribute('aria-pressed', pressed);
      button.title = description;
      button.dataset.recommended = recommended;
      button.style.left = 'calc(' + (pos.x + 1) * 50 + '% + ' + offset[0] + 'px)';
      button.style.top = 'calc(' + (1 - pos.y) * 50 + '% + ' + offset[1] + 'px)';
      needed.add(id);
    }
    for (const [id, button] of hot) {
      if (!needed.has(id)) { button.remove(); hot.delete(id); }
    }
  }

  function update(time, state) {
    const { station, alignment: al, head } = state;
    const showThrough = station === 'alignment' && state.inspectionPit;
    if (showThrough !== cutaway) {
      for (const { part, solid, translucent } of shell) part.material = showThrough ? translucent : solid;
      cutaway = showThrough;
    }
    rail.position.y = railHeight + al.rail;
    const reading = alignmentReadings(al);
    const progress = al.motion ? clamp((time - al.motion.start) / al.motion.duration, 0, 1) : 1;
    const rolling = al.motion?.kind === 'roll';
    const travelling = rolling ? -.32 * Math.sin(Math.PI * progress) ** 2 : 0;
    vehicle.position.z = travelling;
    const steer = al.motion?.kind === 'steer' ? lerp(al.motion.from, al.steer, smoothstep(progress, 0, 1)) : al.steer;
    const openWindow = Number(station === 'alignment' && al.stage === 'sweep');
    if (openWindow !== (windowTravel?.to ?? glassOpening)) {
      windowTravel = reduced.matches ? null : { start: time, from: glassOpening, to: openWindow };
    }
    const windowFraction = windowTravel ? smoothstep(time - windowTravel.start, 0, 480) : 1;
    glassOpening = windowTravel ? lerp(windowTravel.from, windowTravel.to, windowFraction) : openWindow;
    if (windowFraction === 1) windowTravel = null;
    driverGlass.position.y = glassHeight - .49 * glassOpening;
    driverGlass.visible = glassOpening < 1;
    steeringWheel.quaternion.setFromAxisAngle(columnAxis, degToRad(-steer * 13));
    for (const [index, target] of targets.entries()) {
      const mounted = al.mounts.includes(wheels[index]);
      const { side } = target;
      target.hub.rotation.y = degToRad((index < 2 ? -steer : 0) - reading.toe[index] * side);
      target.hub.rotation.z = degToRad(-reading.camber[index] * side);
      target.rotor.rotation.x = travelling / wheelRadius;
      const parent = mounted ? target.rotor : target.parent;
      if (target.group.parent !== parent) {
        parent.attach(target.group);
        // Turn the clamp normal outboard and bring its pad ends to the rim face.
        const to = mounted ? new T.Vector3(side * .193, 0, 0) : target.home;
        const orientation = mounted
          ? new T.Quaternion().setFromAxisAngle(T.Object3D.DEFAULT_UP, side * Math.PI / 2) : target.rotation;
        target.travel = reduced.matches ? null : { start: time, from: target.group.position.clone(),
          rotation: target.group.quaternion.clone(), to, orientation, fromFit: target.fit, toFit: Number(mounted) };
        if (!target.travel) {
          target.group.position.copy(to);
          target.group.quaternion.copy(orientation);
          fitTarget(target, Number(mounted));
        }
      }
      if (target.travel) {
        const { start, from, to, rotation, orientation, fromFit, toFit } = target.travel;
        const fraction = rolling && mounted ? 1 : smoothstep(time - start, 0, 700);
        const arc = Math.sin(fraction * Math.PI);
        target.group.position.lerpVectors(from, to, fraction);
        target.group.position.y += .31 * arc;
        target.group.position.x += (toFit ? 1 : -1) * target.side * .30 * arc;
        target.group.quaternion.slerpQuaternions(rotation, orientation, fraction);
        fitTarget(target, lerp(fromFit, toFit, fraction));
        if (fraction === 1) target.travel = null;
      }
    }
    const release = al.motion?.kind === 'lock' ? lerp(al.motion.from, 1 - al.motion.from, smoothstep(progress, 0, 1)) : Number(al.stage === 'adjust');
    poseSteering(ties, al, al.axle ? 0 : release);
    poseRearToe(links, al, al.axle ? release : 0);
    for (const plate of turnplates) plate.rotation.y = degToRad(-steer);
    const comparing = head.comparisonBeam !== null;
    const selectedDistance = comparing ? 7.62 : head.distance;
    if (currentDistance !== selectedDistance) {
      travel = reduced.matches ? null : { from: rig.position.z, start: time };
      currentDistance = selectedDistance;
    }
    const t = travel ? smoothstep(time - travel.start, 0, 700) : 1;
    rig.position.z = lerp(travel?.from ?? 0, currentDistance - 7.62, t);
    if (t === 1) travel = null;
    comparison.update(head.comparisonBeam ?? 'off');
    const parking = move(comparisonParking, Number(comparing), time, 920);
    const standParkX = comparison.stripRight + 3.4;
    const testing = head.method === 'rig' && headStage(head, 'rig') !== 'position' && !comparing;
    const arrival = move(standPose, Number(testing), time, 720);
    const lensOffset = -lampSeparation * move(lensSide, Number(head.side === 'left'), time, 680);
    beamsetter.position.set(lerp(lerp(1.48, lensOffset - fresnelCenter.x, arrival), standParkX, parking), 0,
      lerp(lerp(-.16, sourceZ - .50 - fresnelCenter.z, arrival), 2.6, parking));
    carriage.position.y = carriageHome + (lampHeight - fresnelCenter.y) * arrival;
    const hoodOpening = move(hoodPose, Number(head.hoodOpen && !comparing), time, 540);
    porscheControls.hood.rotation.x = 1.06 * hoodOpening;
    porscheControls.liner.visible = hoodOpening > .15;
    const activeMode = head.comparisonBeam ?? (head.lightsOn ? head.mode : 'off');
    const lightsOn = activeMode !== 'off';
    porscheControls.knob.rotation.z = lightsOn ? -.75 : .40;
    porscheControls.stalk.rotation.y = activeMode === 'high' ? -.24 : .13;
    const indicator = lightsOn ? activeMode : null;
    if (indicator !== telltale) {
      paintHeadlampIndicator(porscheControls.indicator, indicator);
      porscheControls.indicatorTexture.needsUpdate = true;
      telltale = indicator;
    }
    for (const side of lampSides) {
      const angles = aim(head, head.mode, side);
      porscheControls.adjusters[side].forEach(({ head: screw }, i) => { screw.rotation.y = angles[i] * 3.5; });
    }
    const { screwdriver, driverRest } = porscheControls;
    const beam = requiredBeam(headStage(head, head.method));
    const useDriver = !comparing && head.toolPicked &&
      hoodOpening > .98 && head.lightsOn && head.mode === beam;
    const angles = aim(head);
    driverAxis = useDriver ? pendingAimAxis(head) : -1;
    screwdriver.position.copy(driverAxis < 0 ? driverRest : porscheControls.adjusters[head.side][driverAxis].screw.position);
    if (driverAxis >= 0) screwdriver.position.y += .04;
    screwdriver.rotation.set(driverAxis < 0 ? Math.PI / 2 : 0, driverAxis < 0 ? 0 : angles[driverAxis] * 3.5, 0);
    wall.position.z = wallZ;
    const wallParkX = comparison.stripLeft - screen.halfWidth - .30;
    frame.position.x = wall.position.x = lerp(-lampSeparation / 2, wallParkX, parking);
    frame.position.z = wall.position.z - .05;
    centerline.scale.z = head.distance / 10;
    centerline.position.z = wall.position.z + head.distance / 2;
    for (const { distance, line } of distanceMarks) line.material.color.setHex(distance === head.distance ? 0xfce29a : 0xbb743e);
    const main = activeMode === 'high';
    const light = lampTypes[comparing ? 'halogen' : head.lamp];
    const captured = arrival > .98 && lensSide.start === undefined;
    const isolated = !comparing && head.method === 'wall' && Boolean(requiredBeam(headStage(head, 'wall')));
    emitter.emissive.setRGB(...light.color);
    emitter.emissiveIntensity = !lightsOn ? 0 : main ? 4.4 : 2.6;
    positionLights.front.emissiveIntensity = lightsOn ? 4.2 : 0;
    positionLights.reflector.emissiveIntensity = lightsOn ? 3.1 : 0;
    positionLights.plateEmitters.emissiveIntensity = lightsOn ? 3.2 : 0;
    for (const light of positionLights.plateLights) light.intensity = lightsOn ? .55 : 0;
    for (const { side, beam, haze, cover } of beams) {
      cover.visible = isolated && side !== head.side;
      beam.visible = head.lightsOn && !comparing && !cover.visible;
      if (!beam.visible) continue;
      const inTester = side === head.side && captured;
      const span = inTester ? .50 : beam.position.z + rig.position.z - wall.position.z;
      const [x, y] = wallMark(head, head.mode, side).map(value => value * span / head.distance);
      const direction = new T.Vector3(x, y, -span);
      beam.scale.set(.027 + span * (main ? .095 : .17), .026 + span * (main ? .077 : .049), direction.length());
      beam.quaternion.setFromUnitVectors(forward, direction.normalize());
      haze.uniforms.tint.value.setRGB(...light.color);
      haze.uniforms.strength.value = inTester ? 7.2 : main ? 2.05 : 1.72;
      haze.uniforms.dipped.value = main ? 0 : 1;
    }
    const nextOptics = JSON.stringify([head.lightsOn, head.side, head.lamp, head.mode, head.distance, head.aims, captured, comparing, isolated]);
    if (nextOptics !== optics) {
      const projecting = isolated ? [head.side] : lampSides.filter(side => !captured || side !== head.side);
      paintAimingWall(wallCanvas, { ...head, lightsOn: head.lightsOn && !comparing }, false, projecting);
      if (captured && head.lightsOn) paintWall(headPanel, { ...head, distance: 7.62 }, false);
      else {
        const context = headPanel.getContext('2d');
        context.fillStyle = '#152223';
        context.fillRect(0, 0, headPanel.width, headPanel.height);
      }
      wallTexture.needsUpdate = headTexture.needsUpdate = true;
      optics = nextOptics;
    }
    floorBeam.visible = head.lightsOn && !captured && !comparing;
    if (floorBeam.visible) {
      floorBeam.position.z = wall.position.z + (sourceZ + rig.position.z - wall.position.z) / 2;
      floorBeam.scale.y = sourceZ + rig.position.z - wall.position.z;
      const pattern = JSON.stringify([head.mode, head.lamp, head.distance, head.aims, isolated && head.side]);
      if (pattern !== floorPattern) {
        paintBeamFloor(floorCanvas, head, floorBeamWidth, isolated);
        floorTexture.needsUpdate = true;
        floorPattern = pattern;
      }
    }
    const nextLabels = JSON.stringify([al.axle, al.stage, al.mounts, reading, steer.toFixed(1), text('alignmentReadout')]);
    if (nextLabels !== labels) {
      paintAlignmentMonitor(consolePanel, al, reading, steer, text, ui.degrees);
      consoleTexture.needsUpdate = true;
      labels = nextLabels;
    }

    return progress < 1 || Boolean(windowTravel) || opticalMotion.some(pose => pose.start !== undefined) ||
      Boolean(travel) || targets.some(target => target.travel);
  }

  function project(camera, actions) {
    const at = (part, x = 0, y = 0, z = 0) => part.localToWorld(new T.Vector3(x,y,z));
    const { station, alignment: al, head } = getState();
    const adjusters = al.axle ? links.map(link => link.eccentric) : ties.map(tie => tie.adjuster);
    const lock = al.axle ? links[0].eccentric : ties[0].nut;
    const crossmember = al.axle ? subframe : steering;
    const covered = beams.find(beam => beam.side !== head.side).cover;
    const otherLamp = lampCenter(head.side === 'left' ? 'right' : 'left');
    const aimGuide = axis => driverAxis === axis ? at(porscheControls.screwdriver, 0, .40)
      : at(porscheControls.adjusters[head.side][axis].head, 0, .015);
    const anchors = {
      'open-alignment': () => at(alignmentDisplay, 0, .19),
      'open-headlamp': () => at(headDisplay, 0, .19),
      setup: () => at(alignmentDisplay, 0, .19),
      compensate: () => at(body, 0, 1.12, .62),
      steer: () => at(steeringWheel),
      loosen: () => at(lock, 0, .22),
      tighten: () => at(crossmember, 0, .28, .04),
      'panel-loosen': () => at(alignmentDisplay, 0, .20),
      'panel-tighten': () => at(alignmentDisplay, 0, .20),
      verify: () => at(alignmentDisplay, 0, .20),
      position: () => head.method === 'wall' ? at(covered, 0, .025) : at(porsche, lampCenter(head.side), .65, -1.59),
      check: () => head.method === 'wall' ? at(wall, lampCenter(head.side), -.23) : at(headDisplay),
      'beam-cabin': () => at(porsche, -.79, .87, -.23),
      'raise-hood': () => at(porsche, 0, .68, -1.96),
      'pick-driver': () => at(porscheControls.screwdriver, 0, .22, 0),
      'next-lamp': () => at(porsche, otherLamp, .65, -1.59),
      'lights-toggle': () => at(porscheControls.knob),
      'beam-low': () => at(porscheControls.stalk, -.14),
      'beam-high': () => at(porscheControls.stalk, -.14),
      'aim-guide-0': () => aimGuide(0),
      'aim-guide-1': () => aimGuide(1),
      'toe-left-minus': () => at(adjusters[0], 0, .02, 0),
      'toe-left-plus': () => at(adjusters[0], 0, .02, 0),
      'toe-right-minus': () => at(adjusters[1], 0, .02, 0),
      'toe-right-plus': () => at(adjusters[1], 0, .02, 0),
      ...Object.fromEntries(targets.map(({ group }, index) => ['mount-' + wheels[index], () => at(group, index % 2 ? .12 : -.12, .09)])),
    };
    const offsets = { 'toe-left-minus': [-21, 34], 'toe-left-plus': [21, 34], 'toe-right-minus': [-21, 34], 'toe-right-plus': [21, 34],
      'mount-FL': [8, -12], 'mount-FR': [-8, -12], 'mount-RL': [8, 9], 'mount-RR': [-8, 9] };
    const projected = actions.map(action => ({ ...action, point: anchors[action.id]?.(), offset: offsets[action.id] })).filter(action => action.point);
    if (station === 'alignment' && !al.motion && ['targets', 'compensate'].includes(al.stage)) {
      for (const [index, target] of targets.entries()) {
        if (target.group.parent === target.rotor && !target.travel) {
          const wheel = wheels[index];
          projected.push({ id: 'mounted-' + wheel, label: wheel + ' ✓', mounted: true,
            point: at(target.group, 0, .34, .07), offset: [0, -6] });
        }
      }
    }
    updateHotspots(projected, camera);
  }

  function probe(ray) {
    const { station, head } = getState();
    if (station !== 'headlamp' || head.comparisonBeam !== null) return;
    const hit = ray.intersectObject(wall)[0];
    if (hit) {
      const [x, y] = wallPoint(hit.uv.x, hit.uv.y);
      ui.setProbe([x - lampCenter(head.side), y]);
    }
  }
  function adjusterAt(ray, x, y) {
    const { station, head } = getState();
    if (station !== 'headlamp' || head.comparisonBeam !== null || !head.toolPicked ||
        headStage(head, head.method) === 'position' || hoodPose.value < .98) return;
    const adjusters = porscheControls.adjusters[head.side];
    const cue = hot.get('aim-guide-' + driverAxis);
    if (cue && !hotspotLayer.hidden) {
      const bounds = cue.getBoundingClientRect();
      if (Math.hypot(x - (bounds.left + bounds.width / 2), y - (bounds.top + bounds.height / 2)) <= bounds.width / 2) return driverAxis;
    }
    const hood = ray.intersectObject(porscheControls.hood, true)[0]?.distance ?? Infinity;
    if (driverAxis >= 0 && ray.intersectObject(porscheControls.screwdriver, true)[0]?.distance < hood) return driverAxis;
    const hits = ray.intersectObjects(adjusters.map(({ pick }) => pick), false);
    const hit = hits[0];
    if (hit && hit.distance <= hood) {
      return adjusters.findIndex(({ pick }) => pick === hit.object);
    }
  }
  draw();
  return { update, cameraView, project, probe, adjusterAt };
}
