import * as T from './vendor/three/three.module.min.js';

const trim = new T.MeshStandardMaterial({ color: 0x232e32, roughness: .65 });
const steel = new T.MeshStandardMaterial({ color: 0xb7c3c3, metalness: .55, roughness: .32 });
const socket = new T.MeshStandardMaterial({ color: 0x424c4c, metalness: .35, roughness: .42 });

function mesh(parent, geometry, material, x, y, z) {
  const part = new T.Mesh(geometry, material);
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

const box = (parent, dimensions, material, x, y, z) => mesh(parent, new T.BoxGeometry(...dimensions), material, x, y, z);
const cylinder = (parent, radius, height, sides, material, x, y, z) =>
  mesh(parent, new T.CylinderGeometry(radius, radius, height, sides), material, x, y, z);

export function addPorscheHeadlampCovers(vehicle) {
  // Sampled along the right lamp rim, with a small offset to keep the mask above the chrome.
  const rim = [
    [-.123, -.118, -.211], [-.159, -.096, -.189], [-.161, -.073, -.151], [-.160, -.057, -.119],
    [-.157, -.031, -.061], [-.150, -.017, -.027], [-.112, .004, 0], [-.073, .027, .031],
    [-.048, .050, .098], [.019, .080, .182], [.093, .083, .192], [.144, .050, .151],
    [.163, -.001, .079], [.151, -.048, 0], [.141, -.073, -.042], [.138, -.078, -.050],
    [.124, -.092, -.077], [.085, -.112, -.123], [.026, -.119, -.157], [-.048, -.120, -.186],
  ];
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, ...rim.flat()], 3));
  geometry.setIndex(rim.flatMap((_, i) => [0, i + 1, (i + 1) % rim.length + 1]));
  geometry.computeVertexNormals();
  const surface = new T.MeshStandardMaterial({ color: 0x232323, roughness: 1 });
  return Object.fromEntries([['left', -1], ['right', 1]].map(([side, sign]) => {
    const cover = mesh(vehicle, geometry, surface, sign * .50, .64, -1.67);
    cover.name = side + ' headlamp cover';
    cover.scale.x = sign;
    cover.visible = false;
    return [side, cover];
  }));
}

export function addPorscheControls(vehicle) {
  const bonnet = vehicle.children.find(part => part.userData.name === 'Front bonnet');
  const hood = new T.Group();
  hood.name = 'Bonnet hinge';
  hood.position.set(0, .792, -.685);
  vehicle.add(hood);
  hood.attach(bonnet);
  bonnet.material = bonnet.material.clone();
  bonnet.material.side = T.DoubleSide;

  const driverGlass = vehicle.children.find(part => part.userData.name === 'Driver window pane');
  const liner = new T.Group();
  liner.name = 'Front luggage compartment liner';
  vehicle.add(liner);
  box(liner, [.78, .095, .70], trim, 0, .506, -1.168);
  for (const side of [-1, 1]) box(liner, [.045,.097,.75], socket, side*.367, .595, -1.145);
  box(liner, [.74,.105,.055], socket, 0, .616, -.809);
  box(liner, [.63,.086,.056], socket, 0, .583, -1.52);
  const adjusters = Object.fromEntries(['right', 'left'].map((side, sideIndex) => {
    const direction = sideIndex ? -1 : 1;
    box(liner, [.14,.035,.31], trim, direction * .413, .628, -1.361);
    const pair = [[.41, .655, -1.491], [.41, .668, -1.237]].map(([x,y,z], index) => {
      const screw = new T.Group();
      screw.name = side + (index ? ' vertical aiming screw' : ' horizontal aiming screw');
      screw.position.set(direction * x, y, z);
      liner.add(screw);
      cylinder(screw, .033, .018, 18, socket, 0, 0, 0);
      const head = new T.Group();
      head.position.y = .020;
      screw.add(head);
      cylinder(head, .024, .022, 6, steel, 0, 0, 0);
      box(head, [.036, .002, .005], trim, 0, .012, 0);
      box(head, [.005, .002, .028], trim, 0, .012, 0);
      const pick = mesh(screw, new T.SphereGeometry(.043, 12, 8), new T.MeshBasicMaterial({ visible: false }), 0, .025, 0);
      return { screw, head, pick };
    });
    return [side, pair];
  }));

  const tray = new T.Group();
  tray.name = 'Headlamp tool tray';
  tray.position.set(1.47, .35, -1.22);
  vehicle.add(tray);
  box(tray, [.32, .034, .52], socket, 0, 0, 0);
  box(tray, [.34, .04, .54], trim, 0, -.33, 0);
  for (const x of [-.12, .12]) for (const z of [-.22, .22]) {
    box(tray, [.024, .33, .024], socket, x, -.16, z);
  }
  const screwdriver = new T.Group();
  screwdriver.name = 'Headlamp Phillips screwdriver';
  vehicle.add(screwdriver);
  const driverGrip = new T.MeshStandardMaterial({ color: 0xd96d2d, roughness: .46 });
  cylinder(screwdriver, .011, .026, 8, steel, 0, .013, 0);
  cylinder(screwdriver, .007, .153, 12, steel, 0, .092, 0);
  cylinder(screwdriver, .026, .106, 16, driverGrip, 0, .216, 0);
  cylinder(screwdriver, .024, .017, 16, trim, 0, .275, 0);
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    box(screwdriver, [.006, .083, .006], trim, Math.cos(angle) * .025, .215, Math.sin(angle) * .025);
  }
  const driverRest = tray.position.clone().add(new T.Vector3(0, .045, -.17));
  screwdriver.position.copy(driverRest);
  screwdriver.rotation.x = Math.PI / 2;

  const lightSwitch = new T.Group();
  lightSwitch.name = 'Dashboard light switch';
  lightSwitch.position.set(-.515, .785, -.296);
  vehicle.add(lightSwitch);
  const bezel = cylinder(lightSwitch, .036,.022, 24, socket, 0, 0, .005);
  bezel.rotation.x = Math.PI / 2;
  const knob = new T.Group();
  knob.position.z = .026;
  lightSwitch.add(knob);
  const dial = cylinder(knob, .025,.026, 12, trim, 0, 0, 0);
  dial.rotation.x = Math.PI / 2;
  box(knob, [.005,.024,.004], steel, 0,.008,.014);

  const stalk = new T.Group();
  stalk.name = 'Dipped and main beam stalk';
  stalk.position.set(-.345, .75, -.329);
  vehicle.add(stalk);
  box(stalk, [.147,.018,.023], trim, -.068, 0, 0);
  box(stalk, [.058,.026,.034], socket, -.143, 0, 0);
  box(stalk, [.023,.005,.012], steel, -.150, .015, 0);

  const indicator = document.createElement('canvas');
  indicator.width = 128;
  indicator.height = 80;
  const indicatorTexture = new T.CanvasTexture(indicator);
  indicatorTexture.colorSpace = T.SRGBColorSpace;
  box(lightSwitch, [.094,.055,.028], trim, .022,.067,.005);
  const telltale = mesh(lightSwitch, new T.PlaneGeometry(.086,.053), new T.MeshBasicMaterial({ map: indicatorTexture,
    transparent: true, depthWrite: false, toneMapped: false }), .022,.067,.020);
  telltale.name = 'Headlamp telltale';
  return { hood, liner, driverGlass, adjusters, screwdriver, driverRest, knob, stalk, indicator, indicatorTexture };
}

export function addPorschePositionLights(vehicle) {
  const tails = vehicle.children.find(part => part.userData.name === 'BACK LIGHT');
  const redLens = tails.children.find(part => part.material?.name === 'Web lamp backlight glass.002');
  for (const pane of tails.children) {
    pane.material.transparent = true;
    pane.material.depthWrite = false;
    pane.material.opacity = pane === redLens ? .40 : .25;
    pane.material.roughness = .18;
  }
  const reflector = new T.MeshStandardMaterial({ color: 0x531218, roughness: .33, emissive: 0xf82a13, emissiveIntensity: 0 });
  reflector.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 lensPoint;\n' + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n lensPoint = position;');
    shader.fragmentShader = 'varying vec3 lensPoint;\n' + shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      float band = smoothstep(-0.085, -0.077, lensPoint.y) * (1.0 - smoothstep(-0.050, -0.038, lensPoint.y));
      float ribs = mix(0.54, 1.0, smoothstep(0.22, 0.55, abs(sin(lensPoint.x * 168.0))));
      totalEmissiveRadiance *= 0.06 + band * ribs;
    `);
  };
  const insert = new T.Mesh(redLens.geometry, reflector);
  insert.name = 'Rear position lamp reflectors';
  insert.position.z = -.004;
  tails.add(insert);

  const plateEmitters = new T.MeshStandardMaterial({ color: 0x8e9695, emissive: 0xfff1d8, emissiveIntensity: 0 });
  const plateLights = [-.124, .124].map(x => {
    box(vehicle, [.051,.022,.025], trim, x, .497, 1.977);
    box(vehicle, [.039,.006,.018], plateEmitters, x, .484, 1.984);
    const light = new T.SpotLight(0xffefd7, 0, .23, .71, .84);
    light.position.set(x, .485, 2.023);
    light.target.position.set(x*.78, .415, 1.963);
    vehicle.add(light, light.target);
    return light;
  });
  const frontLamps = vehicle.getObjectByName('EMM');
  frontLamps.position.z -= .008;
  const front = frontLamps.material;
  front.emissive.setHex(0xfff3df);
  return { front, reflector, plateEmitters, plateLights };
}
