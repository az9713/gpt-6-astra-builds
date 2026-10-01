const clamp = t => Math.max(0, Math.min(1, t));
const ease = (t, a, b) => { const u = clamp((t-a)/(b-a)); return u*u*(3-2*u); };

export function flightAt(seconds) {
  const t = Math.max(0, Math.min(20, seconds));
  const climb = ease(t, 0, 20), drift = ease(t, 6, 20), reveal = ease(t, 3, 19);
  return {
    t, climb, drift, reveal,
    x: -8.2 * drift,
    y: 1.55 + 29.5 * climb,
    z: 18 - 16 * drift,
    yaw: -.09 + .13 * Math.sin(t * .21),
    pitch: .012 * Math.sin(t * .29),
    roll: .023 * Math.sin(t * .34),
    cameraAngle: .32 + .24 * reveal,
    cameraDistance: 23.2 + 6.2 * reveal,
    phase: t < 4 ? 'the cheering launch square' : t < 10 ? 'clearing the slate rooftops' : t < 17 ? 'the river unfolds' : 'above the city',
  };
}
