import { THREE, start, paint, mesh, cylinder, ease, mix } from '../shared/runtime.js';
import { makeVessel } from './vessel.js';
import { makeFrieze, storyState } from './frieze.js';

await start({
  title: 'Troy, Written in Clay — Living Black Figure Pottery',
  background: '#10191b',
  setup({ scene, camera, sun, ambient, fill }) {
    camera.position.set(.12, 9.2, 12.8);
    camera.lookAt(0, 3.75, 0);
    scene.fog = new THREE.Fog('#10191b', 19, 78);
    ambient.intensity = 1.08;
    ambient.color.set('#ffe8c9');
    ambient.groundColor.set('#354747');
    sun.position.set(-5.6, 11, 7.4);
    sun.intensity = 3.5;
    sun.color.set('#ffe3bc');
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 10, bottom: -3, near: .5, far: 32 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = .012;
    sun.shadow.bias = -.0002;
    fill.position.set(7, 7.8, -4);
    fill.color.set('#b5d0d2');
    fill.intensity = 1.2;

    const ground = paint('#172124', { kind: 'stone', roughness: .96, bump: .002 });
    const plinth = paint('#242b29', { kind: 'stone', roughness: .88, bump: .008 });
    const floor = mesh(scene, new THREE.PlaneGeometry(140, 140), ground, 0, -.46, 0);
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    cylinder(scene, plinth, 0, -.20, 0, 3.08, .43, 96);
    cylinder(scene, paint('#10191a', { roughness: .93 }), 0, -.405, 0, 3.14, .075, 96);

    const frieze = makeFrieze();
    const vessel = makeVessel(frieze.staticTexture, frieze.storyTexture);
    scene.add(vessel);

    return {
      update(t) {
        frieze.draw(t);
        // The modest turn keeps the narrative on the lit face as it unfolds.
        vessel.rotation.y = Math.PI + .245 - .48 * ease(t, 0, 20);
        const night = ease(t, 7.6, 10.7);
        sun.intensity = mix(3.5, 2.12, night);
        fill.intensity = mix(1.2, 1.62, night);
        ambient.intensity = mix(1.08, .92, night);
      },
      state(t) {
        return {
          ...storyState(t),
          vesselRotation: Math.PI + .245 - .48 * ease(t, 0, 20),
          storyTextureWidth: 2048,
          storyTextureHeight: 512,
          hollowVessel: true,
          geometryAllocatedDuringUpdate: 0,
          finalFrameHeld: t >= 20,
        };
      },
    };
  },
});
