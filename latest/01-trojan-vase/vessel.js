import { THREE, TSL, mesh, ell, paint, V } from '../shared/runtime.js';

const H = 7.62;
const TAU = Math.PI * 2;

// The section crosses the recessed underside, rolled lip and actual inner wall.
// It ends at the internal floor; there is no flat mouth cap.
const PROFILE = [
  [0,.13],[.76,.13],[.84,.08],[1.17,.08],[1.29,.13],[1.33,.22],[1.31,.31],
  [1.23,.38],[1.08,.42],[1.00,.49],[.96,.61],[1.01,.78],[1.17,.98],
  [1.42,1.25],[1.71,1.59],[1.98,1.99],[2.23,2.45],[2.43,2.99],
  [2.54,3.51],[2.55,4.02],[2.46,4.55],[2.29,5.04],[2.03,5.49],
  [1.69,5.87],[1.33,6.12],[1.18,6.28],[1.14,6.43],[1.15,6.83],
  [1.18,7.00],[1.24,7.10],[1.45,7.20],[1.59,7.29],[1.65,7.40],
  [1.63,7.52],[1.55,7.60],[1.46,7.61],
  [1.38,7.54],[1.33,7.42],[1.25,7.31],[1.05,7.20],[1.00,7.04],
  [.99,6.53],[1.02,6.30],[1.22,6.12],[1.55,5.83],[1.91,5.39],
  [2.17,4.94],[2.34,4.44],[2.41,3.95],[2.39,3.47],[2.25,2.92],
  [2.05,2.42],[1.77,1.94],[1.44,1.53],[1.06,1.19],[.73,.98],[0,.91],
];

function shellGeometry() {
  const curve = new THREE.CatmullRomCurve3(PROFILE.map(([r,y]) => V(r,y,0)), false, 'centripetal');
  const samples = 280, sides = 144;
  const profile = curve.getPoints(samples).map(p => new THREE.Vector2(Math.max(0,p.x),p.y));
  const geo = new THREE.LatheGeometry(profile, sides);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const region = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), a = Math.atan2(pos.getX(i),pos.getZ(i));
    const r = Math.hypot(pos.getX(i),pos.getZ(i));
    // Millimetric throwing irregularity, coherent across the whole shell.
    const oval = 1 + .0045*Math.sin(3*a+.5)*Math.sin(y*.65) + .002*Math.sin(5*a+y*.7);
    const throwing = .0025*Math.sin(y*88+Math.sin(y*3.3)) * Math.min(1,r);
    pos.setXYZ(i, Math.sin(a)*(r*oval+throwing) + .012*Math.sin(y*.69), y, Math.cos(a)*(r*oval+throwing));
    uv.setY(i, y/H);
    const row = i % (samples + 1);
    region[i] = row > samples * (35 / (PROFILE.length - 1)) ? 1 : 0;
  }
  geo.setAttribute('inside', new THREE.BufferAttribute(region,1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

function clayMaterial(staticTexture, storyTexture) {
  const p = TSL.positionLocal;
  const broad = TSL.mx_noise_float(p.mul(.81).add(TSL.vec3(4.1,2.3,-1.7)));
  const medium = TSL.mx_noise_float(p.mul(8.7));
  const grain = TSL.mx_noise_float(p.mul(112));
  const thrown = TSL.sin(p.y.mul(185).add(TSL.sin(p.y.mul(12)).mul(.65)));
  const inside = TSL.attribute('inside','float');
  const storyUV = TSL.vec2(TSL.uv().x, TSL.uv().y.sub(1-1200/1536).div(700/1536));
  const reserve = TSL.texture(staticTexture).r.mul(TSL.texture(storyTexture,storyUV).r);
  const inkCoverage = TSL.float(1).sub(reserve).mul(TSL.float(1).sub(inside));
  const firing = broad.mul(.36).add(.56);
  const clay = TSL.mix(TSL.color('#a66a40'), TSL.color('#c78e59'), firing)
    .mul(medium.mul(.026).add(grain.mul(.012)).add(thrown.mul(.006)).add(.985));
  const pigment = TSL.mix(TSL.color('#1a1713'),TSL.color('#352920'),broad.mul(.24).add(.32));
  const abrasion = TSL.smoothstep(.26,.57,grain).mul(TSL.smoothstep(-.08,.37,medium)).mul(.45);
  const wornInk = TSL.mix(pigment,clay,abrasion);
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: .75 });
  mat.colorNode = TSL.mix(clay,wornInk,inkCoverage).mul(TSL.mix(TSL.float(1),TSL.float(.61),inside));
  mat.roughnessNode = TSL.mix(TSL.float(.79),TSL.float(.53),inkCoverage).add(medium.mul(.055)).add(inside.mul(.09));
  mat.normalNode = TSL.bumpMap(grain.mul(.004).add(medium.mul(.007)).add(thrown.mul(.0016)),TSL.float(.15));
  mat.userData = { tsl: true, role: 'fired terracotta, worn black slip, wheel marks, continuous hollow vessel' };
  return mat;
}

function handleGeometry(side) {
  const path = new THREE.CatmullRomCurve3([
    V(side*1.13,6.79,0),V(side*1.69,6.96,0),V(side*2.37,7.03,0),
    V(side*2.94,6.76,0),V(side*3.14,6.10,0),V(side*3.04,5.47,0),
    V(side*2.67,5.04,0),V(side*2.31,4.86,0),
  ],false,'centripetal');
  const rings = 72, sides = 16, vertices = [], uvs = [], indices = [];
  for (let i = 0; i <= rings; i++) {
    const t = i/rings, pt = path.getPoint(t), tangent = path.getTangent(t);
    const normal = V(-tangent.y,tangent.x,0).normalize();
    const attachment = Math.exp(-t*26)+Math.exp(-(1-t)*26);
    const thickness = .124 + attachment*.05, width = .23 + attachment*.07;
    for (let j = 0; j <= sides; j++) {
      const a = j/sides*TAU, ridge = 1+.035*Math.cos(a*4);
      vertices.push(pt.x+normal.x*Math.cos(a)*thickness*ridge,pt.y+normal.y*Math.cos(a)*thickness*ridge,Math.sin(a)*width);
      uvs.push(t,j/sides);
      if (i < rings && j < sides) {
        const v=i*(sides+1)+j,n=v+sides+1;
        indices.push(v,v+1,n,n,v+1,n+1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
  return geo;
}

export function makeVessel(staticTexture, storyTexture) {
  const group = new THREE.Group();
  group.name = 'hollow_terracotta_amphora';
  const shell = mesh(group,shellGeometry(),clayMaterial(staticTexture,storyTexture));
  shell.name = 'continuous_outer_lip_inner_wall_and_foot';
  const handleMat = new THREE.MeshStandardNodeMaterial({ roughness: .64 });
  const p = TSL.positionLocal;
  const noise = TSL.mx_noise_float(p.mul(7));
  const grain = TSL.mx_noise_float(p.mul(100));
  const blackFace = TSL.smoothstep(.52,.72,TSL.abs(TSL.sin(TSL.uv().y.mul(TAU))));
  handleMat.colorNode = TSL.mix(TSL.color('#aa7145'),TSL.color('#2a221a'),blackFace.mul(.92))
    .mul(noise.mul(.13).add(grain.mul(.018)).add(.97));
  handleMat.roughnessNode = blackFace.mul(-.15).add(.77).add(noise.mul(.04));
  handleMat.normalNode = TSL.bumpMap(grain.mul(.008),TSL.float(.1));
  handleMat.userData = { tsl: true, role: 'oval strap handles, black slip faces and exposed clay edges' };
  const jointClay = paint('#a97449',{kind:'clay',roughness:.78,bump:.004});
  for (const side of [-1,1]) {
    const handle=mesh(group,handleGeometry(side),handleMat);
    handle.name='swept_strap_handle';
    // Flattened saddles overlap the shell and strap instead of hovering.
    const upper=ell(group,jointClay,side*1.12,6.78,0,.155,.245,.32);
    upper.rotation.z=side*-.18;
    const lower=ell(group,jointClay,side*2.28,4.86,0,.14,.24,.34);
    lower.rotation.z=side*.45;
  }
  return group;
}
