import { aim, aimPass, beamIntensity, dippedSlope, floorProfile, lampCenter, lampHeight, lampSides, lampTypes, roadPairLux, wallLux, wallMark } from './diagnostic-model.js';

export const screen = { halfWidth: 2.45, bottom: -lampHeight, top: 1.02, scale: 2500 };
export const wallPoint = (u, v) => [screen.halfWidth * (2 * u - 1), screen.bottom + v * (screen.top - screen.bottom)];
const raster = document.createElement('canvas');
const pixels = raster.getContext('2d');
const lightLevels = (lux, max) => Math.min(1, Math.max(0, lux / max)) ** .35;

function paintMap(context, width, height, color, sample, max, base) {
  raster.width = Math.min(width, 300);
  raster.height = Math.min(height, 180);
  const image = pixels.createImageData(raster.width, raster.height);
  for (let column = 0; column < raster.width; column++) {
    for (let row = 0; row < raster.height; row++) {
      const lux = sample((column + .5) / raster.width, 1 - (row + .5) / raster.height);
      const intensity = lightLevels(lux, max);
      const offset = (row * raster.width + column) * 4;
      for (let channel = 0; channel < 3; channel++) image.data[offset + channel] = lux === null
        ? (Math.floor((column + row) / 4) % 2 ? 36 : 44) : base[channel] + intensity * 239 * color[channel];
      image.data[offset + 3] = 255;
    }
  }
  pixels.putImageData(image, 0, 0);
  context.drawImage(raster, 0, 0, width, height);
}

const wallMaps = new WeakMap();
export function paintWall(canvas, head, probe = true) {
  const { width, height } = canvas;
  const context = canvas.getContext('2d');
  const { halfWidth, bottom, top, scale } = screen;
  const xPixel = x => width * (x / (2 * halfWidth) + .5);
  const yPixel = y => height * (top - y) / (top - bottom);
  if (head.measured || head.lightsOn) {
    const key = [head.lamp, head.mode, head.distance, head.measured, ...aim(head)].join('/');
    let cached = wallMaps.get(canvas);
    if (cached?.key !== key) {
      const map = document.createElement('canvas');
      map.width = width;
      map.height = height;
      paintMap(map.getContext('2d'), width, height, lampTypes[head.lamp].color, (u, v) => wallLux(head, ...wallPoint(u, v)), scale, [15, 21, 24]);
      cached = { key, map };
      wallMaps.set(canvas, cached);
    }
    context.drawImage(cached.map, 0, 0);
  } else {
    context.fillStyle = '#192728';
    context.fillRect(0, 0, width, height);
  }
  context.lineWidth = 1;
  context.strokeStyle = '#8bb5ac45';
  context.beginPath();
  for (let x = -2.25; x <= 2.25; x += .25) {
    context.moveTo(xPixel(x), 0);
    context.lineTo(xPixel(x), height);
  }
  for (let y = -.6; y <= 1; y += .2) {
    context.moveTo(0, yPixel(y));
    context.lineTo(width, yPixel(y));
  }
  context.stroke();
  context.strokeStyle = '#a4cfca';
  context.setLineDash([6, 6]);
  context.beginPath();
  context.moveTo(width / 2, 0);
  context.lineTo(width / 2, height);
  context.moveTo(0, yPixel(0));
  context.lineTo(width, yPixel(0));
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = '#c5e5da';
  context.font = '600 14px system-ui';
  context.fillText('H', 9, yPixel(0) - 6);
  context.fillText('V', width / 2 + 6, 18);
  function cutoff(x, y, color, dashed = false) {
    const upsweep = head.distance * Math.tan(3 * Math.PI / 180);
    const rise = head.distance * Math.tan(.735 * Math.PI / 180);
    context.strokeStyle = color;
    context.lineWidth = 2.5;
    context.setLineDash(dashed ? [7, 4] : []);
    context.beginPath();
    context.moveTo(xPixel(x - 1.33), yPixel(y));
    context.lineTo(xPixel(x), yPixel(y));
    context.lineTo(xPixel(x + upsweep), yPixel(y + rise));
    context.lineTo(xPixel(x + upsweep + .43), yPixel(y + rise));
    context.stroke();
    context.setLineDash([]);
  }
  if (!head.measured && head.mode === 'low') {
    cutoff(0, -dippedSlope / 100 * head.distance, '#d6f789');
  } else if (!head.measured) {
    context.strokeStyle = '#d6f789';
    context.beginPath();
    context.arc(xPixel(0), yPixel(0), 18, 0, Math.PI * 2);
    context.stroke();
  }
  function mark(position, color) {
    const x = xPixel(position[0]), y = yPixel(position[1]);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x - 9, y);
    context.lineTo(x + 9, y);
    context.moveTo(x, y - 9);
    context.lineTo(x, y + 9);
    context.stroke();
  }
  if (!head.measured && head.lightsOn) {
    const markPoint = wallMark(head);
    const aligned = aimPass(head);
    const color = aligned ? '#d6f789' : '#ff817b';
    if (!aligned && head.mode === 'low') cutoff(...markPoint, color, true);
    mark(markPoint, color);
  }
  if (probe) mark(head.probe, '#8cebf8');
}

export function paintAimingWall(canvas, head, probe = true, sources = [head.side], closeUp = false) {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  const center = lampCenter(head.side);
  const { left, right, bottom, top } = closeUp ? { left: center - 1.15, right: center + 1.15, bottom: -.39, top: .36 }
    : { left: -screen.halfWidth, right: screen.halfWidth, bottom: screen.bottom, top: screen.top };
  const x = meters => (meters - left) / (right - left) * width;
  const y = meters => (top - meters) / (top - bottom) * height;
  const lowerLine = -head.distance * dippedSlope / 100;
  if (head.lightsOn) {
    const lights = sources.map(side => ({ settings: { ...head, side }, center: lampCenter(side) }));
    paintMap(ctx, width, height, lampTypes[head.lamp].color, (u, v) => {
      const lateral = left + u * (right - left);
      const up = bottom + v * (top - bottom);
      return lights.reduce((lux, lamp) => lux + wallLux(lamp.settings, lateral - lamp.center, up), 0);
    }, screen.scale, [137, 145, 141]);
  } else {
    ctx.fillStyle = '#aeb5aa';
    ctx.fillRect(0, 0, width, height);
  }
  const s = width / 840;
  const line = (x0, y0, x1, y1, color, thickness, dashed = false) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * s;
    ctx.setLineDash(dashed ? [8 * s, 6 * s] : []);
    ctx.beginPath();
    ctx.moveTo(x(x0), y(y0));
    ctx.lineTo(x(x1), y(y1));
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const text = (label, atX, atY, fill) => {
    ctx.fillStyle = fill;
    ctx.textAlign = 'center';
    ctx.font = `${Math.round((closeUp ? 24 : 17) * s)}px system-ui`;
    ctx.fillText(label, x(atX), y(atY));
  };
  const tape = '#233a3a';
  const active = '#0a5b36';
  const labelHeight = closeUp ? top - .09 : .81;
  line(0, screen.bottom, 0, labelHeight - .06, tape, 2, true);
  line(-2.38, 0, 2.38, 0, tape, 2);
  line(-2.38, lowerLine, 2.38, lowerLine, active, 2.5);
  text('A', 0, labelHeight, tape);
  text('H', left + .18, .047, tape);
  text('D', left + .18, lowerLine - .095, active);
  for (const side of lampSides) {
    const base = lampCenter(side);
    const color = side === head.side ? active : tape;
    line(base, -.33, base, labelHeight - .06, color, side === head.side ? 4 : 2);
    text(side === 'left' ? 'B' : 'C', base, labelHeight, color);
    const target = head.mode === 'low' ? lowerLine : 0;
    line(base - .07, target, base + .07, target, color, 4);
  }
  if (head.lightsOn && sources.includes(head.side)) {
    const [lateral, height] = wallMark(head);
    const at = center + lateral;
    const color = aimPass(head) ? active : '#ac2929';
    if (head.mode === 'low') {
      const sweep = head.distance * Math.tan(3 * Math.PI / 180);
      const rise = head.distance * Math.tan(.735 * Math.PI / 180);
      line(at - 1.18, height, at, height, color, 2, true);
      line(at, height, at + sweep, height + rise, color, 2, true);
    }
    line(at - .055, height, at + .055, height, color, 3);
    line(at, height - .055, at, height + .055, color, 3);
  }
  if (probe) {
    const [dx, up] = head.probe;
    ctx.beginPath();
    ctx.arc(x(center + dx), y(up), 7 * s, 0, 2 * Math.PI);
    ctx.strokeStyle = '#145986';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
  }
}

export function paintHeadlampIndicator(canvas, mode) {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!mode) return;
  context.save();
  context.scale(canvas.width / 64, canvas.height / 40);
  context.strokeStyle = mode === 'high' ? '#76baff' : '#82f899';
  context.lineWidth = 3;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(35, 8);
  context.quadraticCurveTo(57, 7, 57, 20);
  context.quadraticCurveTo(57, 33, 35, 32);
  context.closePath();
  for (const y of [10, 17, 24, 31]) {
    context.moveTo(27, mode === 'low' ? y - 3 : y);
    context.lineTo(7, mode === 'low' ? y + 3 : y);
  }
  context.stroke();
  context.restore();
}

export function paintBeamFloor(canvas, head, widthInMeters, isolated) {
  const { width, height } = canvas;
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  const { color } = lampTypes[head.lamp];
  const degrees = 180 / Math.PI;
  const sources = (isolated ? [head.side] : lampSides).map(side => ({ center: lampCenter(side), angles: aim(head, head.mode, side) }));
  const floorLux = (forward, lateral, [yaw, pitch]) => {
    const onFloor = Math.hypot(forward, lateral);
    const horizontal = degrees * Math.atan2(lateral, forward);
    const vertical = degrees * Math.atan2(-lampHeight, onFloor);
    return beamIntensity(head.lamp, head.mode, horizontal - yaw, vertical - pitch) * lampHeight /
      Math.hypot(onFloor, lampHeight) ** 3;
  };
  for (let row = 0; row < height; row++) {
    const forward = (1 - (row + .5) / height) * head.distance;
    for (let column = 0; column < width; column++) {
      const lateral = ((column + .5) / width - .5) * widthInMeters;
      const lux = sources.reduce((sum, source) => sum + floorLux(forward, lateral - source.center, source.angles), 0);
      const index = (row * width + column) * 4;
      const fade = Math.min(1, (column + .5) / 8, (width - column - .5) / 8);
      for (let channel = 0; channel < 3; channel++) image.data[index + channel] = color[channel] * 255;
      image.data[index + 3] = 205 * fade * lightLevels(lux, 80);
    }
  }
  context.putImageData(image, 0, 0);
}

export function paintComparisonLight(canvas, lamp, mode) {
  const { width, height } = canvas;
  const { distance, footprintWidth, lux } = floorProfile;
  const color = lampTypes[lamp].color.map(channel => Math.round(channel * 255));
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  const displayRange = Math.log1p(lux / .12);
  for (let row = 0; row < height; row++) {
    const forward = (1 - (row + .5) / height) * distance;
    for (let column = 0; column < width; column++) {
      const lateral = ((column + .5) / width - .5) * footprintWidth;
      const level = roadPairLux(lamp, mode, forward, lateral);
      const edge = Math.min(1, (footprintWidth / 2 - Math.abs(lateral)) / 4, (distance - forward) / 8);
      const brightness = 1 - Math.exp(-Math.log1p(level / .12) / displayRange);
      const alpha = .92 * brightness ** 1.35 * edge;
      const index = (row * width + column) * 4;
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
      image.data[index + 3] = alpha * 255;
    }
  }
  context.putImageData(image, 0, 0);
}

