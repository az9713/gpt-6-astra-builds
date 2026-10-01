import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';
let atlas;
function stoneAtlas(){
 if(atlas)return atlas;
 const N=1024,data=new Uint8Array(N*N*4),hash=(x,y,s=0)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s,1274126177);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295};
 const noise=(x,y,n,seed)=>{x*=n;y*=n;const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,a=u*u*(3-2*u),b=v*v*(3-2*v),h=(i,j)=>hash((i+n)%n,(j+n)%n,seed);return(h(ix,iy)*(1-a)+h(ix+1,iy)*a)*(1-b)+(h(ix,iy+1)*(1-a)+h(ix+1,iy+1)*a)*b;};
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const u=x/N,v=y/N,broad=noise(u,v,8,17),grain=noise(u,v,128,29),coarse=noise(u,v,32,11),cellX=Math.floor(u*32),cellY=Math.floor(v*32),dx=u*32-cellX-(.2+.6*hash(cellX,cellY,81)),dy=v*32-cellY-(.2+.6*hash(cellX,cellY,92)),rr=.035+.12*hash(cellX,cellY,101),hole=Math.max(0,1-Math.hypot(dx,dy)/rr)**2;
  const cut=Math.max(0,1-Math.abs((u*53+coarse*.7)%1-.5)/.028)*Math.max(0,(noise(u,v,16,123)-.50))*1.4;
  const h=.48+.11*(coarse-.5)+.10*(grain-.5)-.27*hole-.075*cut;
  const i=(y*N+x)*4;data[i]=Math.round(255*(.49+.22*(broad-.5)+.1*(coarse-.5)-.3*hole));data[i+1]=Math.round(255*h);data[i+2]=Math.round(255*(.5+.12*(grain-.5)-.33*hole-.10*cut));data[i+3]=255;
 }
 atlas=new THREE.DataTexture(data,N,N,THREE.RGBAFormat);atlas.wrapS=atlas.wrapT=THREE.RepeatWrapping;atlas.magFilter=THREE.LinearFilter;atlas.minFilter=THREE.LinearMipmapLinearFilter;atlas.generateMipmaps=true;atlas.colorSpace=THREE.NoColorSpace;atlas.anisotropy=4;atlas.needsUpdate=true;return atlas;
}
export function stone({color='#c5b697',fine=true,cavity=false}={}){
 const m=new THREE.MeshStandardNodeMaterial({color,roughness:.94,metalness:0});
 const p=TSL.positionGeometry;
 const broad=TSL.mx_noise_float(p.mul(.76)),medium=TSL.mx_noise_float(p.mul(6.3));
 m.colorNode=TSL.color(color).mul(TSL.float(.98).add(broad.mul(.055)).add(medium.mul(fine?.022:0)));
 if(cavity)m.colorNode=m.colorNode.mul(TSL.attribute('cavity','float'));
 if(fine){const tex=stoneAtlas(),a=TSL.abs(TSL.normalGeometry).pow(4),w=a.div(a.x.add(a.y).add(a.z)),scale=.7;
  const sample=TSL.texture(tex,p.yz.mul(scale)).mul(w.x).add(TSL.texture(tex,p.xz.mul(scale)).mul(w.y)).add(TSL.texture(tex,p.xy.mul(scale)).mul(w.z));
  m.colorNode=m.colorNode.mul(sample.r.sub(.5).mul(.42).add(1));
  const height=sample.g.mul(.12).add(medium.mul(.026));m.normalNode=TSL.bumpMap(height,TSL.float(.4));m.roughnessNode=TSL.float(.94).add(sample.b.sub(.5).mul(.15));
 }
 m.userData={tsl:true,role:'original limestone, broad mineral variation and restrained surface relief'};return m;
}
