import { THREE, TSL, V, TAU, rng, paint, mesh, box, ell, batch, water, clock } from '../shared/runtime.js';
import { merged, roofGeometry, poleGeometry, tubeGeometry, captureInstanceBounds } from './geometry.js';

export const riverZ = x => -20 + .13*x + 5.8*Math.sin(x*.025);

function landscapeStrip(a,b,y) {
  const shape=new THREE.Shape();
  for(let x=-150;x<=150;x+=3){const z=riverZ(x)+a; x===-150?shape.moveTo(x,-z):shape.lineTo(x,-z);}
  for(let x=150;x>=-150;x-=3)shape.lineTo(x,-riverZ(x)-b);
  shape.closePath();
  return new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,y,0);
}

export function buildCity(scene) {
  const random=rng(8317),colliders=[];
  const stone=paint('#cdb993',{kind:'stone'}),trim=paint('#e0cfac',{kind:'stone'});
  const plaster=paint('#ffffff',{kind:'stone',bump:.007});
  const roofs=paint('#ffffff',{kind:'stone',roughness:.88,bump:.005});
  const dark=paint('#3b4950'),wood=paint('#725844',{kind:'wood'});
  const ground=mesh(scene,new THREE.PlaneGeometry(650,650),paint('#a8a07d',{kind:'stone',bump:.004}));ground.rotation.x=-Math.PI/2;ground.position.y=-.15;
  const riverside=mesh(scene,landscapeStrip(-9.3,9.3,-.025),stone);riverside.castShadow=false;
  const river=water(scene,300,150,.03);river.geometry.dispose();
  // water() keeps its -PI/2 transform; the replacement coordinates remain XY.
  river.geometry=landscapeStrip(-7.5,7.5,0).rotateX(Math.PI/2);
  const p=TSL.positionLocal;
  const broad=TSL.sin(p.x.mul(.43).add(p.y.mul(.31)).add(TSL.sin(p.y.mul(.13)).mul(2)).add(clock.mul(.45)));
  const cross=TSL.sin(p.y.mul(1.7).sub(p.x.mul(.12)).add(TSL.sin(p.x.mul(.11)).mul(1.1)).sub(clock.mul(.65)));
  const fine=TSL.sin(p.x.mul(2.3).add(p.y.mul(3.6)).add(TSL.sin(p.x.mul(.27)).mul(1.4)).add(clock.mul(.8)));
  const ripples=broad.mul(.55).add(cross.mul(.3)).add(fine.mul(.15));
  const brokenGlint=TSL.pow(cross.mul(.5).add(.5),14).mul(TSL.pow(broad.mul(.5).add(.5),5));
  river.material.colorNode=TSL.mix(TSL.color('#527b78'),TSL.color('#91a98b'),ripples.mul(.035).add(.14)).add(TSL.color('#e8c47f').mul(brokenGlint.mul(.024)));
  river.material.normalNode=TSL.bumpMap(ripples.mul(.08),TSL.float(.024));
  river.material.positionNode=p.add(TSL.vec3(0,0,ripples.mul(.006)));
  river.material.roughness=.62;
  river.material.userData.role='warped crossing water ripples with intermittent restrained gold glints';
  const quay=[];for(const side of[-1,1]){
    const points=[];for(let x=-145;x<=145;x+=5)points.push([x,.13,riverZ(x)+side*7.8]);
    quay.push(tubeGeometry(points,.13,116,false,5));
  }merged(scene,trim,quay,false);

  // A large irregular cobbled square gives the launch its own readable silhouette.
  const square=new THREE.Shape().moveTo(-16,-1).lineTo(16,-1).lineTo(16,-36).lineTo(12,-40).lineTo(-16,-38).closePath();
  const paving=mesh(scene,new THREE.ShapeGeometry(square),paint('#c4b797',{kind:'stone',bump:.008}));paving.rotation.x=-Math.PI/2;paving.position.y=-.045;paving.castShadow=false;
  const pavingMarks=[];
  for(let z=4;z<=35;z+=2.4)for(let x=-13;x<=13;x+=3.1) if(random()>.15)pavingMarks.push({p:[x+(random()-.5)*.3,-.027,z],s:[.75+random()*.8,.012,.03],r:[0,(random()-.5)*.2,0]});
  batch(scene,new THREE.BoxGeometry(),paint('#a89b7e'),pavingMarks,false);

  const bodyParts=[],roofParts=[[],[],[]],windows=[],sills=[],cornices=[],chimneys=[],caps=[],dormers=[],dormerRoofs=[],doors=[],shutters=[];
  const palette=['#cbb596','#dbc7a4','#c1b091','#d9bd92','#c4a184','#dfcdb2','#bdb49a'];
  const roofPalette=['#65777b','#586975','#7b7770','#626678','#8a7563'];
  let buildingCount=0;
  for(let ix=-18;ix<=18;ix++)for(let iz=-18;iz<=15;iz++){
    const x=ix*6.1+(iz%3)*.45+(random()-.5)*.7;
    const z=iz*7.1+(random()-.5)*.7;
    const w=3.4+random()*1.9,d=3.8+random()*2.0;
    // Bounds-aware exclusions: neither roofs nor cornices can enter the launch court.
    if(Math.abs(z-riverZ(x))<11+d*.5)continue;
    if(Math.abs(x)<17+w*.5 && z+d*.5>-.5 && z-d*.5<39)continue;
    if(Math.abs(x+31)<10+w*.5&&Math.abs(z+45)<12+d*.5)continue;
    if(Math.abs(x-48)<6 && z>-5)continue;
    if(iz%7===0 || ix%9===0 && iz%4!==1)continue;
    const h=3.2+random()*3.7+(Math.abs(x)<30&&z>0?1:0);
    const roofH=1.2+random()*.85,style=Math.floor(random()*3),color=palette[Math.floor(random()*palette.length)];
    const roofColor=roofPalette[Math.floor(random()*roofPalette.length)];
    const near=Math.hypot(x,z-18)<60;
    bodyParts.push({p:[x,h/2,z],s:[w,h,d],c:color});
    roofParts[style].push({p:[x,h,z],s:[w+.35,roofH,d+.35],c:roofColor});
    cornices.push({p:[x,h-.08,z],s:[w+.32,.2,d+.32]});
    if(near)cornices.push({p:[x,1.45,z],s:[w+.08,.12,d+.08]});
    chimneys.push({p:[x+w*.25,h+roofH*.75,z-d*.18],s:[.3+random()*.15,1.35,.4],c:color});
    caps.push({p:[x+w*.25,h+roofH*.75+.7,z-d*.18],s:[.48,.13,.56]});
    for(let y=1.0;y<h-.5;y+=1.28)for(const fraction of[-.29,0,.29]){
      const wh=.64+random()*.16;
      windows.push({p:[x+w*fraction,y,z+d/2+.014],s:[.38,wh,1]});
      windows.push({p:[x+w/2+.014,y,z+d*fraction],s:[.38,wh,1],r:[0,Math.PI/2,0]});
      if(near){
        sills.push({p:[x+w*fraction,y-wh/2-.035,z+d/2+.055],s:[.54,.075,.14]});
        if((ix+iz)%3===0)for(const side of[-1,1])shutters.push({p:[x+w*fraction+side*.265,y,z+d/2+.033],s:[.105,wh,.045]});
      }
    }
    if(near){
      doors.push({p:[x, .53,z+d/2+.025],s:[.59,1.04,.035]});
      if(style===2||style===0){
        dormers.push({p:[x-w*.15,h+roofH*.4,z+d*.37],s:[.62,.78,.45],c:color});
        dormerRoofs.push({p:[x-w*.15,h+roofH*.4+.39,z+d*.37],s:[.84,.38,.66],c:roofColor});
        windows.push({p:[x-w*.15,h+roofH*.4,z+d*.37+.23],s:[.32,.46,1]});
      }
    }
    buildingCount++;
  }
  const bodyBatch=batch(scene,new THREE.BoxGeometry(),plaster,bodyParts);bodyBatch.name='varied-townhouse-bodies';captureInstanceBounds(bodyBatch,colliders,'house');
  roofParts.forEach((transforms,i)=>{const roofsBatch=batch(scene,roofGeometry(i),roofs,transforms);captureInstanceBounds(roofsBatch,colliders,`roof-${i}`);});
  const corniceBatch=batch(scene,new THREE.BoxGeometry(),trim,cornices);captureInstanceBounds(corniceBatch,colliders,'cornice');
  const chimneyBatch=batch(scene,new THREE.BoxGeometry(),plaster,chimneys);captureInstanceBounds(chimneyBatch,colliders,'chimney');
  const capBatch=batch(scene,new THREE.BoxGeometry(),stone,caps);captureInstanceBounds(capBatch,colliders,'chimney-cap');
  batch(scene,new THREE.PlaneGeometry(),dark,windows,false);
  batch(scene,new THREE.BoxGeometry(),trim,sills,false);
  batch(scene,new THREE.BoxGeometry(),wood,doors,false);
  batch(scene,new THREE.BoxGeometry(),paint('#577270'),shutters,false);
  if(dormers.length){const m=batch(scene,new THREE.BoxGeometry(),plaster,dormers);captureInstanceBounds(m,colliders,'dormer');const n=batch(scene,roofGeometry(0),roofs,dormerRoofs);captureInstanceBounds(n,colliders,'dormer-roof');}

  const bridges=[];
  for(const x of[-48,23,69]){
    const z=riverZ(x),group=new THREE.Group();scene.add(group);group.position.set(x,0,z);group.rotation.y=-.13;
    box(group,stone,0,1.55,0,4.2,.35,18.8);
    for(const side of[-1,1]){
      box(group,trim,side*2,2.01,0,.22,.6,18.8);
      for(let j=-1;j<=1;j++){
        const arch=[];for(let k=0;k<=20;k++){const a=k*Math.PI/20;arch.push([side*1.98,.18+Math.sin(a)*1.25,j*5.2+Math.cos(a)*2.35]);}
        bridges.push(tubeGeometry(arch,.24,24,false,6).applyMatrix4(new THREE.Matrix4().makeRotationY(-.13)).translate(x,0,z));
      }
    }
    for(let j=-2;j<=2;j++)box(group,stone,0,.65,j*5.15,4.35,1.5,.5);
    group.updateMatrixWorld(true);colliders.push({box:new THREE.Box3().setFromObject(group),label:`bridge-${x}`});
  }merged(scene,trim,bridges);

  // An invented period-inspired church: an urban landmark, not a reconstruction.
  const church=new THREE.Group();scene.add(church);church.position.set(-31,0,-45);
  box(church,stone,0,3.6,0,7,7.2,14);box(church,trim,0,4.3,0,4.9,8.6,13.5);
  const naveRoof=mesh(church,roofGeometry(0),paint('#647a79'),0,8.6,0);naveRoof.scale.set(5.6,2.6,14.2);
  const churchTrim=[];
  for(const side of[-1,1]){
    box(church,stone,side*3.65,6.3,6.25,2.5,12.6,3);
    box(church,trim,side*3.65,11.5,6.25,2.78,.32,3.3);
    const crown=mesh(church,roofGeometry(1),paint('#73807a'),side*3.65,12.6,6.25);crown.scale.set(2.9,2.6,3.4);
    for(const x of[-.5,.5])box(church,dark,side*3.65+x,10.4,7.77,.4,1.35,.04);
    for(let z=-5;z<=4;z+=3)churchTrim.push({p:[side*3.7,2.5,z],s:[.75,5,.6]});
  }
  batch(church,new THREE.BoxGeometry(),trim,churchTrim);
  const rose=mesh(church,new THREE.TorusGeometry(.88,.12,8,32),trim,0,6.15,7.08);box(church,dark,0,1.7,7.08,1.4,3.4,.06);
  church.updateMatrixWorld(true);colliders.push({box:new THREE.Box3().setFromObject(church),label:'invented-church'});

  // Clipped trees, stone coping and simple barges break up the city grid.
  const trunks=[],leaves=[],treePositions=[];
  for(let i=0;i<24;i++){
    const x=i%2?-14.7:14.7,z=3+Math.floor(i/2)*3.0;
    trunks.push({p:[x,.8,z],s:[.13,1.6,.13]});leaves.push({p:[x,2.15,z],s:[.8,1.15,.85],c:i%3?'#7f8e61':'#8a9865'});treePositions.push([x,z]);
  }
  batch(scene,new THREE.CylinderGeometry(1,1,1,7),wood,trunks);
  const treeBatch=batch(scene,new THREE.IcosahedronGeometry(1,1),paint('#ffffff'),leaves);captureInstanceBounds(treeBatch,colliders,'tree');
  const bollards=[];for(let x=-100;x<=100;x+=4.2)for(const side of[-1,1])bollards.push({p:[x,.35,riverZ(x)+side*8.5],s:[.17,.7,.17]});batch(scene,new THREE.CylinderGeometry(1,1,1,7),stone,bollards,false);
  for(const x of[-62,-9,50]){
    const boat=new THREE.Group();scene.add(boat);boat.position.set(x,.15,riverZ(x)+Math.sin(x)*2);boat.rotation.y=.15;
    ell(boat,wood,0,.06,0,2.7,.34,.75);box(boat,paint('#b6a174',{kind:'wood'}),0,.18,0,4.3,.1,1.05);
    for(let j=-1;j<=1;j++)box(boat,paint('#a2977d'),j*.95,.53,0,.7,.65,.75);
    box(boat,wood,1.6,1.1,0,.07,2,.07);
  }
  return {colliders,buildingCount,treePositions};
}

export function buildCrowd(scene) {
  const random=rng(7781),coats=[],heads=[],hats=[],brims=[],skirts=[],limbs=[],hands=[],waving=[];
  const palette=['#526974','#935b46','#9a8256','#4d5f53','#bda47d','#745862','#b07b59'];
  for(let i=0;i<215;i++) {
    const a=i*2.399963229728653,rad=7.1+random()*5.5;
    const x=Math.sin(a)*rad,z=18+Math.cos(a)*rad,scale=.8+random()*.28;
    const coat=palette[i%palette.length],skin=['#cc9b76','#b17d59','#dfb28c'][i%3],angle=Math.atan2(-x,18-z);
    const transform=(dx,y,dz)=>[x+Math.cos(angle)*dx+Math.sin(angle)*dz,y*scale,z-Math.sin(angle)*dx+Math.cos(angle)*dz];
    const skirt=i%4===0;
    if(skirt)skirts.push({p:transform(0,.38,0),s:[.27*scale,.65*scale,.25*scale],c:coat});
    coats.push({p:transform(0,.71,0),s:[.2*scale,.52*scale,.15*scale],r:[0,angle,0],c:coat});
    heads.push({p:transform(0,1.14,.025),s:[.135*scale,.175*scale,.13*scale],c:skin});
    hats.push({p:transform(0,1.295,0),s:[.16*scale,.06*scale,.15*scale],c:i%5===0?'#dac8a4':'#414740'});
    brims.push({p:transform(0,1.29,0),s:[.26*scale,.024*scale,.18*scale],r:[0,angle,0],c:i%5===0?'#dac8a4':'#414740'});
    for(const side of[-1,1]){
      if(!skirt)limbs.push({a:transform(side*.085,.47,0),b:transform(side*.1,.075,.025),radius:.05*scale,color:'#474b43'});
      const raised=(i+side)%3!==0,hand=transform(side*(raised?.34:.28),raised?1.34:.63,raised?.02:.11);
      if(raised)waving.push({limb:limbs.length,hand:hands.length,phase:i*.74+side,scale,angle,base:hand.slice()});
      limbs.push({a:transform(side*.17,.92,0),b:hand,radius:.054*scale,color:coat});
      hands.push({p:hand,s:[.055*scale,.07*scale,.055*scale],c:skin});
    }
  }
  const white=paint('#ffffff');
  batch(scene,new THREE.CylinderGeometry(.8,1,1,8),white,coats);
  batch(scene,new THREE.SphereGeometry(1,10,7),white,heads);
  batch(scene,new THREE.CylinderGeometry(.45,1,1,10),white,skirts);
  batch(scene,new THREE.SphereGeometry(1,8,6),white,hats);
  batch(scene,new THREE.BoxGeometry(),white,brims);
  const handBatch=batch(scene,new THREE.SphereGeometry(1,8,6),white,hands);
  const temp=new THREE.Object3D(),up=V(0,1,0),limbTransforms=[];
  for(const limb of limbs){const a=V(...limb.a),b=V(...limb.b);temp.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());limbTransforms.push({p:a.clone().add(b).multiplyScalar(.5).toArray(),s:[limb.radius,a.distanceTo(b),limb.radius],r:temp.rotation.toArray().slice(0,3),c:limb.color});}
  const limbBatch=batch(scene,new THREE.CylinderGeometry(1,1,1,6),white,limbTransforms);
  limbBatch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);handBatch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const start=V(),end=V(),direction=V();
  return {count:heads.length,animate(t){
    for(const wave of waving){
      const limb=limbs[wave.limb],offset=Math.sin(t*2.7+wave.phase)*.09;
      start.set(...limb.a);
      end.set(wave.base[0]+Math.cos(wave.angle)*offset,wave.base[1]+Math.cos(t*2.7+wave.phase)*.025,wave.base[2]-Math.sin(wave.angle)*offset);
      direction.copy(end).sub(start);temp.position.copy(start).add(end).multiplyScalar(.5);
      temp.scale.set(limb.radius,direction.length(),limb.radius);temp.quaternion.setFromUnitVectors(up,direction.normalize());temp.updateMatrix();limbBatch.setMatrixAt(wave.limb,temp.matrix);
      temp.position.copy(end);temp.quaternion.identity();temp.scale.set(...hands[wave.hand].s);temp.updateMatrix();handBatch.setMatrixAt(wave.hand,temp.matrix);
    }
    limbBatch.instanceMatrix.needsUpdate=true;handBatch.instanceMatrix.needsUpdate=true;
  }};
}
