import {THREE,TSL,mesh,batch,tube,cylinder,ell,box,sky,rng,V,clock} from '../shared/runtime.js';
import {pigment,geometry} from './anatomy.js';
export function leafGeometry(length=1,width=.34) {
  const v=[],ix=[],colors=[];
  for(let i=0;i<=8;i++){
    const q=i/8,w=Math.pow(Math.sin(q*Math.PI),.85)*width;
    for(const s of[-1,0,1]){v.push(w*s,length*q,.085*Math.sin(q*Math.PI)*(1-Math.abs(s))+.10*q*q);const c=new THREE.Color(s===0?'#779354':i<3?'#526f46':'#6a884c');colors.push(c.r,c.g,c.b);}
    if(i){const b=i*3;ix.push(b-3,b-2,b,b,b-2,b+1,b-2,b-1,b+1,b+1,b-1,b+2);}
  }
  return geometry(v,ix,colors);
}
function fernGeometry() {
  const vertices=[],indices=[],colors=[];
  function addLeaf(a,b,w,shade) {
    const first=vertices.length/3,dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz)||1;
    const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2+.025,(a[2]+b[2])/2];
    vertices.push(...a,mid[0]-dz/len*w,mid[1]-.02,mid[2]+dx/len*w,...mid,mid[0]+dz/len*w,mid[1]-.02,mid[2]-dx/len*w,...b);
    indices.push(first,first+1,first+2,first,first+2,first+3,first+1,first+4,first+2,first+2,first+4,first+3);
    const c=new THREE.Color(shade);for(let i=0;i<5;i++)colors.push(c.r,c.g,c.b);
  }
  for(let f=0;f<7;f++){
    const a=f*Math.PI*2/7,cs=Math.cos(a),sn=Math.sin(a);
    const P=(s,l,y)=>[cs*l-sn*s,y,sn*l+cs*s];
    for(let j=0;j<9;j++){
      const q=(j+1)/10,l=q*.9,y=.06+Math.sin(q*Math.PI*.82)*.52;
      for(const s of[-1,1])addLeaf(P(0,l,y),P(s*(.22*(1-q)+.025),l+.09,y-.035),.04*(1-q)+.011,j%2?'#5e8447':'#73934f');
      if(j<8)addLeaf(P(0,l,y-.004),P(0,l+.115,.06+Math.sin((q+.115)*Math.PI*.82)*.52),.012,'#a0ae65');
    }
    addLeaf(P(0,.86,.35),P(0,1.03,.18),.035,'#75934e');
  }
  return geometry(vertices,indices,colors);
}
function grassGeometry() {
  const v=[],ix=[],c=[];for(let j=0;j<7;j++){
    const a=j*2.399,h=.27+(j%3)*.095,dx=Math.cos(a),dz=Math.sin(a),b=v.length/3;
    v.push(-dz*.028,0,dx*.028,dz*.028,0,-dx*.028,dx*.075+dz*.018,h*.63,dz*.075-dx*.018,dx*.075-dz*.018,h*.63,dz*.075+dx*.018,dx*.19,h,dz*.19);
    ix.push(b,b+1,b+2,b,b+2,b+3,b+3,b+2,b+4);const color=new THREE.Color(j%2?'#91a762':'#6c914f');for(let i=0;i<5;i++)c.push(color.r,color.g,color.b);
  }return geometry(v,ix,c);
}
function branchTransform(a,b,r) {
  const av=V(...a),bv=V(...b),obj=new THREE.Object3D();obj.quaternion.setFromUnitVectors(V(0,1,0),bv.clone().sub(av).normalize());
  return {p:av.add(bv).multiplyScalar(.5).toArray(),s:[r,V(...a).distanceTo(V(...b)),r],r:[obj.rotation.x,obj.rotation.y,obj.rotation.z]};
}
export function makeWoodland(scene,{mobile=false}={}) {
  const random=rng(33717);
  sky(scene,'#e9e0bf','#a9c4b0');scene.fog=new THREE.Fog('#b3c5ae',19,49);
  const moss=pigment('#5b784b',{grain:.006}),earth=pigment('#c6ab7d',{grain:.006}),bark=pigment('#514d3b',{grain:.025}),barkLight=pigment('#8a7952');
  const floor=mesh(scene,new THREE.PlaneGeometry(110,90),moss,0,-.032,-10);floor.rotation.x=-Math.PI/2;
  const p=new THREE.Shape();p.moveTo(-35,-2.4);p.bezierCurveTo(-12,-2.28,-2,-2.68,8,-2.52);p.bezierCurveTo(17,-2.4,23,-2.7,35,-2.3);p.lineTo(35,2.45);p.bezierCurveTo(13,2.27,-6,2.8,-35,2.45);p.closePath();
  const trail=mesh(scene,new THREE.ShapeGeometry(p,50),earth,0,.002,0);trail.rotation.x=-Math.PI/2;trail.name='Clear unbroken race path';
  const distant=[],mid=[],branches=[],leafSets=[[],[],[]];
  for(let i=0;i<43;i++) {
    const x=(random()-.5)*43,z=-6-random()*23,h=6.8+random()*7.3,r=.17+random()*.30,lean=(random()-.5)*.9;
    (z<-14?distant:mid).push(branchTransform([x,0,z],[x+lean,h,z+.3],r));
    if(z>-16)for(let j=0;j<3;j++){
      const s=j%2?-1:1,start=[x+lean*.6,h*.59,z],end=[x+s*(1.1+random()),h*.83,z+(random()-.5)*2];branches.push(branchTransform(start,end,r*.30));
      for(let k=0;k<30;k++)leafSets[i%3].push({p:[end[0]+(random()-.5)*2.2,end[1]+(random()-.5)*1.1,end[2]+(random()-.5)*2],s:[.65+random()*.7,.65+random()*.65,.8],r:[1.0+random(),random()*6.28,(random()-.5)*2]});
    }
  }
  batch(scene,new THREE.CylinderGeometry(.70,1,1,9),pigment('#799078'),distant,false);
  batch(scene,new THREE.CylinderGeometry(.65,1,1,11),bark,mid,false);
  batch(scene,new THREE.CylinderGeometry(.45,1,1,9),bark,branches,false);
  // Two leaning foreground trees frame the clearing, with roots authored around the bank.
  for(const[x,z,lean]of[[-7.9,-2.7,-1.2],[7.8,-3.9,.9]]){
    tube(scene,bark,[[x,0,z],[x+.15,1.3,z],[x+lean*.35,3.3,z+.16],[x+lean,6.7,z]],.37);
    for(const s of[-1,1]){
      tube(scene,bark,[[x,.55,z],[x+s*.45,.18,z+.2],[x+s*1.1,.02,z+.9]],.13);
      tube(scene,bark,[[x+lean*.4,3.4,z],[x+s*1.2,5,z],[x+s*2.25,5.5,z-.5]],.11);
      for(let k=0;k<95;k++)leafSets[k%3].push({p:[x+s*1.7+(random()-.5)*2.6,5.7+(random()-.5)*1.1,z+(random()-.5)*2.2],s:[.55+random()*.65,.6+random()*.7,1],r:[1.3+random(),random()*6.28,(random()-.5)*2.5]});
    }
    // Bark strokes follow the tree instead of covering it with a uniform noise map.
    for(let j=0;j<5;j++){const o=(j-2)*.11;tube(scene,barkLight,[[x+o,.3,z+.29],[x+o+.12,1.6,z+.32],[x+o+lean*.42,3.5,z+.32]],.012);}
  }
  const leaf=leafGeometry(),leafMat=pigment('#fff',{vertex:true,grain:.015});leafMat.side=THREE.DoubleSide;
  for(const set of leafSets)batch(scene,leaf,leafMat,set,false);
  // Low leaf banks: opaque authored blades are cheap and do not create alpha overdraw.
  const shrubs=[];for(let i=0;i<25;i++){
    const x=-12+i,z=-3.35-random()*2.2;
    for(let j=0;j<(mobile?23:36);j++){const a=random()*6.28,q=random();shrubs.push({p:[x+Math.cos(a)*q*.7,.12+random()*.4,z+Math.sin(a)*q*.6],s:[.22+random()*.2,.3+random()*.4,.5],r:[(random()-.5)*2,a,(random()-.5)*2]});}
  }batch(scene,leaf,leafMat,shrubs,false);
  const ferns=[],grass=[],stones=[],flowers=[],stems=[],centers=[],petals=[];
  for(let i=0;i<(mobile?42:62);i++){const x=(random()-.5)*26,z=(i%2?1:-1)*(3.1+random()*4.6),s=.55+random()*.6;ferns.push({p:[x,.014,z],s:[s,s,s],r:[0,random()*6.28,0]});}
  for(let i=0;i<230;i++){const x=(random()-.5)*32,z=(random()-.5)*18;if(Math.abs(z)<2.6)continue;const s=.65+random()*.85;grass.push({p:[x,.004,z],s:[s,s,s],r:[0,random()*6.28,0]});}
  batch(scene,fernGeometry(),leafMat,ferns,false);batch(scene,grassGeometry(),leafMat,grass,false);
  for(let i=0;i<115;i++){const x=(random()-.5)*28,z=(random()-.5)*4.7;stones.push({p:[x,.005,z],s:[.025+random()*.045,.013,.021+random()*.03],r:[0,random()*6.28,0]});}
  batch(scene,new THREE.IcosahedronGeometry(1,0),pigment('#aa966d'),stones,false);
  for(let i=0;i<38;i++){
    const x=(random()-.5)*23,z=(i%2?-1:1)*(3.05+random()*2.6),h=.26+random()*.28;
    stems.push({p:[x,h/2,z],s:[.012,h,.012]});centers.push({p:[x,h,z],s:[.042,.035,.042]});
    for(let j=0;j<6;j++){const a=j*6.28/6;petals.push({p:[x+Math.cos(a)*.055,h,z+Math.sin(a)*.055],s:[.058,.014,.03],r:[0,-a,0]});}
  }
  batch(scene,new THREE.CylinderGeometry(1,1,1,5),moss,stems,false);
  batch(scene,new THREE.SphereGeometry(1,8,5),pigment('#d5a449'),centers,false);
  batch(scene,new THREE.SphereGeometry(1,8,5),pigment('#efdfad'),petals,false);
  // A low fallen branch gives the opening nap an immediately readable setting.
  const logGroup=new THREE.Group();scene.add(logGroup);logGroup.position.set(-5.0,.27,-2.18);logGroup.rotation.y=-.15;
  const log=cylinder(logGroup,bark,0,0,0,.26,2.3,16,.23);log.rotation.z=Math.PI/2;
  for(const x of[-1.165,1.165]){const end=cylinder(logGroup,barkLight,x,0,0,.225,.022,24);end.rotation.z=Math.PI/2;}
  tube(logGroup,bark,[[.25,.08,0],[.41,.44,.13],[.36,.56,.20]],.072);
  for(const[x,z]of[[-6.4,-2.7],[-6.18,-2.82],[6.0,3.7],[6.25,3.8]]){
    const h=.19+random()*.13;cylinder(scene,pigment('#dcc7a0'),x,h/2,z,.035,h,8);
    const cap=mesh(scene,new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),pigment('#b57550'),x,h,z);cap.scale.set(.18,.1,.18);
  }
  const finish=3.4;
  box(scene,pigment('#f0e6c5'),finish,.01,0,.11,.016,4.90);
  const pole=pigment('#94784b'),cord=pigment('#6b6347');
  // Low chalk-line pegs preserve the actors' silhouettes; the garland hangs on the bank.
  for(const z of[-2.64,2.64]){cylinder(scene,pole,finish,.20,z,.045,.40,10,.03);ell(scene,pigment('#d7b875'),finish,.43,z,.064,.07,.064);}
  for(const x of[2.3,5.2]){cylinder(scene,pole,x,1.80,-2.85,.045,3.60,10,.033);ell(scene,pigment('#d7b875'),x,3.63,-2.85,.075,.09,.075);}
  tube(scene,cord,[[2.3,3.60,-2.85],[3.75,3.38,-2.85],[5.2,3.60,-2.85]],.013);
  const pennants=[];
  for(let i=0;i<11;i++){
    const x=2.43+i*.264,y=3.38+.20*((x-3.75)/1.45)**2,z=-2.85;
    const g=geometry([x-.115,y,z,x+.115,y,z,x,y-.27,z],[0,1,2]);
    const m=pigment(i%3===0?'#b77053':i%3===1?'#d8b563':'#859365');m.side=THREE.DoubleSide;
    m.positionNode=TSL.positionLocal.add(TSL.vec3(TSL.sin(clock.mul(1.6).add(TSL.positionLocal.z.mul(3))).mul(.025),0,0));pennants.push(mesh(scene,g,m));
  }
  return{finishX:finish,leafInstances:leafSets.reduce((s,a)=>s+a.length,0)+shrubs.length,fernInstances:ferns.length};
}
