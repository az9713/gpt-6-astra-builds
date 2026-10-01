import {THREE,TSL,clock,paint} from '../shared/runtime.js';
export function bridgeMaterials(){return {
 steel:paint('#b44025',{roughness:.56,metalness:.2,bump:.003}),
 flange:paint('#e27643',{roughness:.53,metalness:.15,bump:.002}),
 darkSteel:paint('#873a29',{roughness:.67,metalness:.13,bump:.002}),
 bolt:paint('#f09d67',{roughness:.58,metalness:.2,bump:0}),
 road:paint('#3c5c58',{roughness:.96,bump:.003}),
 walk:paint('#b79e76',{roughness:.93,bump:.003}),
 seam:paint('#294746',{roughness:1,bump:0}),
 rope:paint('#524c3a',{roughness:.85,bump:0}),
 wire:paint('#595b4d',{roughness:.4,metalness:.42,bump:0}),
 rig:paint('#77694a',{roughness:.63,metalness:.15,bump:.003}),
 brass:paint('#d9ad68',{roughness:.53,metalness:.4,bump:.002}),
 concrete:paint('#cabc95',{roughness:.95,bump:.012,kind:'stone'}),
 shirt:paint('#47757b',{roughness:.94,bump:.003}),
 shirtB:paint('#839284',{roughness:.95,bump:.003}),
 trouser:paint('#334b4e',{roughness:.96,bump:.003}),
 skin:paint('#cf9870',{roughness:.88,bump:0}),
 cap:paint('#b69a68',{roughness:.92,bump:.002}),
 boot:paint('#463d32',{roughness:.87,bump:0}),
 belt:paint('#3e4a42',{roughness:.87,bump:0}),
 collar:paint('#c4b992',{roughness:.95,bump:0}),
 };
}
export function bayWater(parent){
 const p=TSL.positionGeometry,t=clock;
 const long=TSL.sin(p.x.mul(.19).add(p.y.mul(.13)).add(TSL.sin(p.y.mul(.053)).mul(1.7)).sub(t.mul(.48))).mul(.10);
 const cross=TSL.sin(p.x.mul(.41).sub(p.y.mul(.57)).add(TSL.sin(p.x.mul(.072)).mul(1.9)).add(t.mul(.71))).mul(.031);
 const small=TSL.mx_noise_float(TSL.vec3(p.x.mul(.74),p.y.mul(.74),t.mul(.09))).mul(.009);
 const height=long.add(cross).add(small);
 const m=new THREE.MeshPhysicalNodeMaterial({metalness:0,roughness:.48,ior:1.33,specularIntensity:.36});
 m.colorNode=TSL.mix(TSL.color('#165b65'),TSL.color('#418f8a'),long.add(cross).mul(1.6).add(.42));
 m.normalNode=TSL.bumpMap(height,TSL.float(.43));
 m.positionNode=p.add(TSL.vec3(0,0,long.add(cross).mul(.22)));
 // All highlights come from the actual directional light and view-dependent BRDF.
 // No additive color glitter, random highlight dots, or independent reflection axis.
 m.roughnessNode=TSL.float(.48).add(small.abs().mul(2.2));
 m.userData={tsl:true,role:'sun-lit bay: directional waves and physically lit specular'};
 const water=new THREE.Mesh(new THREE.PlaneGeometry(650,540,110,92),m);
 water.rotation.x=-Math.PI/2;water.position.set(0,-.15,-70);water.receiveShadow=true;parent.add(water);return water;
}
