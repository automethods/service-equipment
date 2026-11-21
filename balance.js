export const planes = ['inner', 'outer'];
export const spinTime = 8;
export const maxSpeed = 200;
export const tolerance = 2;
export const dimensions = {
    diameter: { min: 10, max: 24, step: 0.5 },
    width: { min: 3, max: 14, step: 0.5 },
    offset: { min: 35, max: 200, step: 1 },
};
export const exercises = {
    guided: {
        rim: { diameter: 17, width: 7.5, offset: 78 },
        imbalance: [{ plane: 'inner', grams: 35, angle: 235 }, { plane: 'outer', grams: 20, angle: 35 }],
        weights: [],
    },
    fault: {
        rim: { diameter: 18, width: 8, offset: 86 },
        imbalance: [{ plane: 'inner', grams: 25, angle: 310 }, { plane: 'outer', grams: 15, angle: 100 }],
        weights: [{ plane: 'outer', grams: 25, angle: 130 }],
    },
};
export function degrees(angle) {
    return ((angle % 360) + 360) % 360;
}
export function validDimensions(rim) {
    return Object.keys(dimensions).every(key => {
        const { min, max } = dimensions[key];
        return Number.isFinite(rim[key]) && rim[key] >= min && rim[key] <= max;
    });
}
export function measure(exercise, weights, entered) {
    if (!validDimensions(entered))
        throw new RangeError('Invalid rim dimensions');
    const actual = exercises[exercise].rim;
    const radius = actual.diameter * 12.7;
    const locations = { inner: actual.offset, outer: actual.offset + actual.width * 25.4 };
    const width = entered.width * 25.4;
    // Unbalance is a rotating g·mm vector. Keep its axial moment to resolve two independent planes.
    const [force, moment] = [...exercises[exercise].imbalance, ...weights].reduce(([force, moment], weight) => {
        const phase = weight.angle * Math.PI / 180;
        const x = weight.grams * radius * Math.cos(phase);
        const y = weight.grams * radius * Math.sin(phase);
        const z = locations[weight.plane];
        return [[force[0] + x, force[1] + y], [moment[0] + x * z, moment[1] + y * z]];
    }, [[0, 0], [0, 0]]);
    const outer = force.map((value, axis) => (moment[axis] - entered.offset * value) / width);
    const inner = force.map((value, axis) => value - outer[axis]);
    const correction = ([x, y]) => {
        const grams = Math.hypot(x, y) / (entered.diameter * 12.7);
        return { grams, angle: grams < 0.05 ? null : Math.round(degrees(Math.atan2(-y, -x) * 180 / Math.PI)) % 360 };
    };
    return { inner: correction(inner), outer: correction(outer) };
}
export function spin(elapsed) {
    const time = Math.min(spinTime, Math.max(0, elapsed));
    const ramp = 1.2;
    const remaining = spinTime - time;
    const fraction = Math.min(1, time / ramp, remaining / ramp);
    const equivalentSeconds = time < ramp ? time ** 2 / (2 * ramp)
        : remaining < ramp ? spinTime - ramp - remaining ** 2 / (2 * ramp)
            : time - ramp / 2;
    return { rpm: maxSpeed * fraction, turn: 6 * maxSpeed * equivalentSeconds, done: time === spinTime };
}
