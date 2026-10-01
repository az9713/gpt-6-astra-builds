import { THREE, V, mesh } from '../shared/runtime.js';

// Static geometry is combined by material once. Animation only changes transforms.
export function merged(parent, material, parts, shadows = true) {
  const positions = [], normals = [], uvs = [], indices = [];
  let offset = 0;
  for (const geometry of parts) {
    const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal');
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < p.count; i++) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      normals.push(n?.getX(i) ?? 0, n?.getY(i) ?? 1, n?.getZ(i) ?? 0);
      uvs.push(uv?.getX(i) ?? 0, uv?.getY(i) ?? 0);
    }
    const index = geometry.getIndex();
    for (let i = 0; i < (index?.count ?? p.count); i++) indices.push(offset + (index ? index.getX(i) : i));
    offset += p.count;
    geometry.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const result = mesh(parent, geometry, material);
  result.castShadow = shadows;
  return result;
}

export function tubeGeometry(points, radius = .025, segments = 48, closed = false, sides = 5) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => Array.isArray(p) ? V(...p) : p), closed), segments, radius, sides, closed);
}

export function ringGeometry(radius, thickness, y, segments = 96) {
  return new THREE.TorusGeometry(radius, thickness, 6, segments).rotateX(Math.PI / 2).translate(0, y, 0);
}

export function poleGeometry(a, b, radius = .025, sides = 8) {
  const start = V(...a), end = V(...b), delta = end.clone().sub(start);
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), sides);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), delta.normalize()));
  geometry.translate(...start.add(end).multiplyScalar(.5).toArray());
  return geometry;
}

export function roofGeometry(style) {
  if (style === 0) {
    const shape = new THREE.Shape().moveTo(-.5, 0).lineTo(.5, 0).lineTo(0, 1).closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false }).translate(0, 0, -.5);
  }
  const rings = style === 1 ? [[.5, 0, .5], [.18, 1, .32]] : [[.5, 0, .5], [.36, .72, .39], [.12, 1, .24]];
  const positions = [], indices = [];
  rings.forEach(([x,y,z]) => positions.push(-x,y,-z, x,y,-z, x,y,z, -x,y,z));
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < 4; i++) {
    const a = j*4+i, b = j*4+(i+1)%4, c = b+4, d = a+4;
    indices.push(a,d,b, b,d,c);
  }
  const top = (rings.length - 1) * 4;
  indices.push(top,top+3,top+1, top+1,top+3,top+2);
  const result = new THREE.BufferGeometry();
  result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  result.setIndex(indices);
  result.computeVertexNormals();
  return result;
}

export function signedBoxClearance(a, b) {
  const gaps = ['x','y','z'].map(k => Math.max(b.min[k] - a.max[k], a.min[k] - b.max[k]));
  return gaps.some(g => g > 0) ? Math.hypot(...gaps.map(g => Math.max(g,0))) : Math.max(...gaps);
}

export function captureInstanceBounds(object, output, label) {
  object.geometry.computeBoundingBox();
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < object.count; i++) {
    object.getMatrixAt(i, matrix);
    output.push({ box: object.geometry.boundingBox.clone().applyMatrix4(matrix), label: `${label}-${i}` });
  }
}
