import * as T from './vendor/three/three.module.min.js';
import { floorProfile, lampTypes, roadReach } from './diagnostic-model.js';
import { paintComparisonLight } from './diagnostic-beams.js';

export function buildBeamComparison(parent, porsche, sourceZ, text) {
  const { distance, laneWidth, footprintWidth } = floorProfile;
  const paints = [null, 0x527594, 0xa04d43, 0xb6ab85, 0x5a8b77];
  const types = Object.keys(lampTypes);
  const group = new T.Group();
  group.name = 'Five-car beam comparison';
  parent.add(group);
  const stripLeft = porsche.position.x - laneWidth / 2;
  const stripRight = stripLeft + laneWidth * types.length;
  const reachPaint = new T.MeshBasicMaterial({ color: 0xc8f48f, toneMapped: false });

  function floorGraphic(width, depth, pxWidth, pxHeight, x, z) {
    const canvas = document.createElement('canvas');
    canvas.width = pxWidth;
    canvas.height = pxHeight;
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const tile = new T.Mesh(new T.PlaneGeometry(width, depth), new T.MeshBasicMaterial({ map: texture, toneMapped: false,
      transparent: true, depthWrite: false }));
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(x, .023, z);
    group.add(tile);
    return { canvas, texture, tile };
  }

  const lanes = types.map((lamp, i) => {
    const x = porsche.position.x + i * laneWidth;
    const panel = floorGraphic(footprintWidth, distance, 176, 640, x, sourceZ - distance / 2);
    panel.tile.name = lamp + ' floor illumination';
    panel.tile.material.blending = T.AdditiveBlending;
    panel.tile.material.fog = false;
    const reach = new T.Mesh(new T.PlaneGeometry(2.35, .18), reachPaint);
    reach.rotation.x = -Math.PI / 2;
    reach.position.set(x, .055, sourceZ);
    group.add(reach);
    const label = floorGraphic(6.4, 2.05, 320, 104, x, sourceZ + 7.7);
    label.tile.rotateZ(Math.PI / 2);
    const vehicle = i === 0 ? porsche : porsche.clone(true);
    let projector, marker;
    if (i > 0) {
      vehicle.name = 'Porsche 911 · ' + lamp;
      vehicle.position.x = x;
      group.add(vehicle);
      vehicle.traverse(part => {
        if (part.material?.name === 'Web bODY') {
          part.material = part.material.clone();
          part.material.color.setHex(paints[i]);
        }
        if (part.material?.name === 'Web lamp emii.002') {
          projector = part.material = part.material.clone();
          projector.emissive.setRGB(...lampTypes[lamp].color);
        }
        if (part.name === 'EMM') marker = part.material = part.material.clone();
      });
    }
    return { lamp, panel, reach, label, projector, marker };
  });
  const ruler = [];
  for (let meters = 0; meters <= distance; meters += 20) {
    const label = floorGraphic(6.3, 2.25, 252, 90, stripLeft - 1.4, sourceZ - meters);
    label.tile.position.y += .002;
    label.tile.rotateZ(Math.PI / 2);
    ruler.push({ meters, label });
  }
  function mark({ canvas, texture }, value) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `700 ${Math.round(canvas.height * .67)}px system-ui`;
    ctx.fillStyle = '#f1f4e6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, canvas.width / 2, canvas.height / 2, canvas.width - 14);
    texture.needsUpdate = true;
  }
  let previousBeam, localized;
  function update(beam) {
    const language = text('road');
    if (localized !== language) {
      lanes.forEach(({ lamp, label }) => mark(label, text(lamp)));
      ruler.forEach(({ meters, label }) => mark(label, meters + ' ' + text('meterUnit')));
      localized = language;
    }
    if (beam === previousBeam) return;
    for (const { lamp, panel, reach, projector, marker } of lanes) {
      const on = beam !== 'off';
      panel.tile.visible = reach.visible = on;
      if (on && panel.mode !== beam) {
        paintComparisonLight(panel.canvas, lamp, beam);
        panel.texture.needsUpdate = true;
        reach.position.z = sourceZ - roadReach(lamp, beam);
        panel.mode = beam;
      }
      if (projector) projector.emissiveIntensity = on ? (beam === 'high' ? 4.4 : 2.6) : 0;
      if (marker) marker.emissiveIntensity = on ? 4.2 : 0;
    }
    previousBeam = beam;
  }
  return { update, stripLeft, stripRight };
}
