import { THREE, TSL, V, TAU, clock, paint, flat, mesh, ell, box, batch, segment } from '../shared/runtime.js';
import { merged, tubeGeometry, ringGeometry, poleGeometry } from './geometry.js';

export function buildBalloon(scene) {
  const assembly = new THREE.Group();
  assembly.name = 'complete-suspended-balloon';
  scene.add(assembly);
  const gold = paint('#e3b965', { roughness: .64, metalness: .12 });
  const ropeMat = paint('#c8ad78', { kind: 'wood', bump: .003 });
  const wicker = paint('#bd884d', { kind: 'wood', bump: .006 });
  const frame = paint('#8e562e', { kind: 'wood' });
  const dark = paint('#343d45');
  const profile = new THREE.SplineCurve([
    [.59,3.15], [1.28,3.85], [2.45,4.65], [3.35,5.8],
    [3.64,7.15], [3.32,8.65], [2.49,9.83], [1.25,10.72], [.015,11.13],
  ].map(p => new THREE.Vector2(...p))).getPoints(150);
  function radiusAt(y) {
    for (let i = 1; i < profile.length; i++) if (profile[i].y >= y) {
      const a = profile[i-1], b = profile[i];
      return a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y);
    }
    return profile.at(-1).x;
  }
  function surface(a,y,extra=.025) {
    const radius = radiusAt(y)*(1+.014*Math.sin(a*12)**2)+extra;
    return [Math.sin(a)*radius,y,Math.cos(a)*radius];
  }

  // Every gore has a real inflated profile: grooves remain legible in silhouette.
  const positions=[], uv=[], indices=[], radial=192;
  for (let j=0;j<profile.length;j++) for (let i=0;i<=radial;i++) {
    const a=i/radial*TAU, p=profile[j], rr=p.x*(1+.014*Math.sin(a*12)**2);
    positions.push(Math.sin(a)*rr,p.y,Math.cos(a)*rr);
    uv.push(i/radial,(p.y-3.15)/7.98);
  }
  for(let j=0;j<profile.length-1;j++)for(let i=0;i<radial;i++){
    const a=j*(radial+1)+i,b=a+radial+1;
    indices.push(a,a+1,b, a+1,b+1,b);
  }
  const fabricGeometry=new THREE.BufferGeometry();
  fabricGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  fabricGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  fabricGeometry.setIndex(indices);fabricGeometry.computeVertexNormals();
  const silk=new THREE.MeshStandardNodeMaterial({roughness:.77,metalness:.025});
  const coords=TSL.uv(),panel=TSL.sin(coords.x.mul(TAU*12));
  const broad=TSL.sin(coords.y.mul(19).add(coords.x.mul(11))).mul(.035).add(.97);
  const grain=TSL.sin(coords.x.mul(2400)).mul(TSL.sin(coords.y.mul(1800)));
  const band=TSL.oneMinus(TSL.smoothstep(.012,.016,TSL.abs(coords.y.sub(.24))))
    .max(TSL.oneMinus(TSL.smoothstep(.015,.02,TSL.abs(coords.y.sub(.8)))));
  silk.colorNode=TSL.mix(TSL.mix(TSL.color('#25485f'),TSL.color('#456f82'),TSL.smoothstep(-.3,.3,panel)),TSL.color('#d8a951'),band).mul(broad).mul(grain.mul(.025).add(.98));
  silk.normalNode=TSL.bumpMap(grain.mul(.04).add(panel.mul(.08)),TSL.float(.025));
  silk.userData={tsl:true,role:'alternating woven silk gores and sewn ornamental bands'};
  const envelope=mesh(assembly,fabricGeometry,silk);envelope.name='sewn-inflated-envelope';

  const seams=[],ornaments=[];
  for(let i=0;i<24;i++) {
    const a=i*TAU/24;
    seams.push(tubeGeometry(profile.filter((_,j)=>j%5===0).map(p=>surface(a,p.y,.021)),.012,40));
    const swag=[];
    for(let j=0;j<=16;j++){const f=j/16;swag.push(surface(a+f*TAU/24,9.03-.58*Math.sin(f*Math.PI),.045));}
    ornaments.push(tubeGeometry(swag,.028,24));
    for(const y of[5.38,7.35]) {
      const center=V(...surface(a+TAU/48,y,.045));
      const matrix=new THREE.Matrix4().makeRotationY(a+TAU/48);matrix.setPosition(center);
      const stem=poleGeometry([0,-.13,0],[0,.15,0],.025,6);stem.applyMatrix4(matrix);ornaments.push(stem);
      for(const side of[-1,1]) {
        const leaf=new THREE.SphereGeometry(1,8,6).scale(.052,.14,.023).rotateZ(side*.68).translate(side*.058,.06,0);
        leaf.applyMatrix4(matrix);ornaments.push(leaf);
      }
    }
  }
  for(const y of[3.16,4.72,5.13,8.94,9.69]) seams.push(ringGeometry(radiusAt(y)+.038,.027,y));
  merged(assembly,gold,seams);
  merged(assembly,gold,ornaments);

  // One embossed sun and two smaller rosettes, all fitted to the fabric tangent.
  const medallion=new THREE.Group();assembly.add(medallion);
  medallion.position.set(...surface(.44,6.95,.055));medallion.rotation.y=.44;
  ell(medallion,gold,0,0,0,.66,.69,.06);
  const rays=[];
  for(let i=0;i<24;i++) {
    const a=i*TAU/24, r=i%2?.92:1.04;
    rays.push(poleGeometry([Math.sin(a)*.7,Math.cos(a)*.72,0],[Math.sin(a)*r,Math.cos(a)*r,-.045],i%2?.022:.03,5));
  }
  rays.push(tubeGeometry([[-.2,-.21,.063],[0,-.25,.068],[.2,-.21,.063]],.014,16));
  merged(medallion,gold,rays);
  const ink=paint('#74552f');
  const faceParts=[];
  for(const x of[-.19,.19])faceParts.push(new THREE.SphereGeometry(1,8,6).scale(.057,.025,.012).translate(x,.12,.065));
  faceParts.push(tubeGeometry([[-.15,-.18,.066],[0,-.21,.07],[.15,-.18,.066]],.012,12));
  merged(medallion,ink,faceParts);
  ell(medallion,gold,.005,.02,.07,.04,.105,.035);

  const basket = new THREE.Group();basket.name='open-woven-basket';assembly.add(basket);
  // The side shell is open at the top. The reed relief is geometric, not a decal.
  const basketWall=mesh(basket,new THREE.CylinderGeometry(.99,.89,.79,64,1,true),frame,0,.65,0);
  basketWall.material=frame.clone();basketWall.material.side=THREE.DoubleSide;
  mesh(basket,new THREE.CylinderGeometry(.9,.9,.075,48),frame,0,.27,0);
  const reeds=[],uprights=[],rim=[];
  for(let row=0;row<20;row++) {
    const y=.285+row*.038, rad=.89+(y-.255)/.79*.1, points=[];
    for(let col=0;col<144;col++) {
      const a=col*TAU/144, weave=.013*Math.cos(a*48+row*Math.PI);
      points.push([Math.sin(a)*(rad+weave),y,Math.cos(a)*(rad+weave)]);
    }
    reeds.push(tubeGeometry(points,.019,144,true,4));
  }
  for(let col=0;col<48;col++){
    const a=col*TAU/48;
    uprights.push(poleGeometry([Math.sin(a)*.896,.27,Math.cos(a)*.896],[Math.sin(a)*.996,1.06,Math.cos(a)*.996],col%4===0?.028:.014,6));
  }
  for(const y of[.27,1.065])rim.push(ringGeometry(y<.5?.91:1.015,.049,y,96));
  merged(basket,wicker,reeds);merged(basket,frame,uprights);merged(basket,wicker,rim);
  const floorboards=[];for(let i=-3;i<=3;i++)floorboards.push({p:[i*.23,.32,0],s:[.19,.025,Math.sqrt(.75-(i*.23)**2)*2]});
  batch(basket,new THREE.BoxGeometry(),wicker,floorboards);

  // Rope endpoints use distinct structural anchors, then are checked in world space.
  const collar=new THREE.Group();assembly.add(collar);collar.position.y=3.15;
  const collarRings=[ringGeometry(.62,.045,0),ringGeometry(.66,.037,.12)];
  merged(collar,frame,collarRings);
  const attachments=[];
  for(let i=0;i<12;i++){
    const a=i*TAU/12;
    const basketAnchor=new THREE.Object3D();basketAnchor.position.set(Math.sin(a)*1.01,1.065,Math.cos(a)*1.01);basket.add(basketAnchor);
    const neckAnchor=new THREE.Object3D();neckAnchor.position.set(Math.sin(a)*.62,0,Math.cos(a)*.62);collar.add(neckAnchor);
    const rope=segment(assembly,ropeMat,basketAnchor.position.toArray(),[neckAnchor.position.x,3.15,neckAnchor.position.z],.025);
    rope.name=`load-rope-${i+1}`;
    attachments.push({rope,basketAnchor,neckAnchor});
  }
  const knots=[];
  for(const item of attachments)knots.push({p:item.basketAnchor.position.toArray(),s:[.044,.068,.044]});
  batch(basket,new THREE.SphereGeometry(1,8,6),ropeMat,knots);

  const passengers=[];
  for(let i=0;i<2;i++) {
    const person=new THREE.Group();basket.add(person);person.position.set(i===0?-.4:.39,.32,.02);person.rotation.y=i===0?-.12:.12;
    const coat=paint(i===0?'#653e37':'#25485b'),skin=paint(i===0?'#c99368':'#e1b28b'),linen=paint('#e7d8b7');
    const bodyParts=[new THREE.SphereGeometry(1,12,8).scale(.22,.37,.16).translate(0,.74,0)];
    bodyParts.push(new THREE.CylinderGeometry(.14,.22,.38,10).translate(0,.47,0));
    merged(person,coat,bodyParts);
    ell(person,skin,0,1.2,.025,.155,.19,.155);ell(person,dark,0,1.3,-.025,.16,.11,.14);
    box(person,linen,0,.96,.148,.095,.2,.025);
    const legs=[poleGeometry([-.09,.42,0],[-.1,.07,.03],.069),poleGeometry([.09,.42,0],[.1,.07,.03],.069)];merged(person,dark,legs);
    const hatShape=new THREE.Shape().moveTo(-.26,-.09).quadraticCurveTo(0,-.28,.26,-.09).quadraticCurveTo(.22,.08,.06,.21).quadraticCurveTo(-.12,.15,-.26,-.09).closePath();
    const hat=new THREE.ExtrudeGeometry(hatShape,{depth:.055,bevelEnabled:false}).rotateX(Math.PI/2).translate(0,1.42,0);mesh(person,hat,dark);
    const arm=new THREE.Group();person.add(arm);arm.position.set(i===0?-.17:.17,.93,0);arm.rotation.z=i===0?-.55:.5;
    mesh(arm,new THREE.CylinderGeometry(.057,.068,.37,10),coat,0,.17,0);ell(arm,skin,0,.4,0,.062,.082,.062);
    segment(person,coat,[i===0?.17:-.17,.95,0],[i===0?.24:-.24,.7,.23],.065);ell(person,skin,i===0?.24:-.24,.7,.23,.06,.08,.06);
    passengers.push({arm,side:i===0?-1:1});
  }

  // A modest ember tray suggests heating without a modern gas-burner silhouette.
  const emberTray=mesh(assembly,new THREE.CylinderGeometry(.28,.2,.09,20),dark,0,2.16,0);
  const embers=batch(assembly,new THREE.IcosahedronGeometry(1,0),flat('#ec9644'),[-.12,0,.12].map((x,i)=>({p:[x,2.23,(i%2)*.09-.045],s:[.08,.045,.07]})),false);
  const hangers=[];for(const a of[0,TAU/3,TAU*2/3])hangers.push(poleGeometry([Math.sin(a)*.25,2.18,Math.cos(a)*.25],[Math.sin(a)*.6,3.16,Math.cos(a)*.6],.011));merged(assembly,dark,hangers,false);

  return {assembly,envelope,basket,collar,attachments,
    animate(t) { passengers.forEach(({arm,side},i)=>{arm.rotation.z=side*(.64+.15*Math.sin(t*1.6+i));});embers.scale.y=1+.12*Math.sin(t*9); },
  };
}
