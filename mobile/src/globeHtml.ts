// The Atlas globe — the mockup's signature world, adapted for a WebView.
// Two views, exactly like the mockup: 'real' (procedural earth, climate-band
// colours, ported verbatim from the approved mockup) and 'ink' (dark sphere,
// land dots, channel lights). setMode() is called from RN via
// injectJavaScript. Drag to spin, tap a light -> postMessage(country code).
import GEO from './data/geo'
import { COUNTRIES } from './data'

export function globeHtml(): string {
  const pts = COUNTRIES.map((c) => [c.c, c.la, c.lo])
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body{margin:0;padding:0;background:#08080b;overflow:hidden;touch-action:none;-webkit-user-select:none}
canvas{display:block;width:100vw;height:100vh}
</style></head><body><canvas id="g"></canvas><script>
var GEO=${JSON.stringify(GEO)};
var PTS=${JSON.stringify(pts)};
var MODE='real';
function setMode(m){MODE=m}
var LAND=new Uint8Array(GEO.W*GEO.H);
(function(){var i=0,v=0;for(var r=0;r<GEO.rle.length;r++){var n=GEO.rle[r];for(var k=0;k<n;k++)LAND[i++]=v;v=1-v}})();
function isLand(la,lo){var x=Math.floor((lo+180)/360*GEO.W),y=Math.floor((90-la)/180*GEO.H);
if(x<0)x=0;if(x>=GEO.W)x=GEO.W-1;if(y<0)y=0;if(y>=GEO.H)y=GEO.H-1;return LAND[y*GEO.W+x]===1}
var cv=document.getElementById('g'),ctx=cv.getContext('2d');
var DPR=Math.min(window.devicePixelRatio||1,2);
function fit(){cv.width=innerWidth*DPR;cv.height=innerHeight*DPR}
fit();addEventListener('resize',fit);
var dots=[];
for(var la=-88;la<=88;la+=3){for(var lo=-180;lo<180;lo+=3){
  if(!isLand(la,lo))continue;
  var p=la*Math.PI/180,l=lo*Math.PI/180;
  dots.push([Math.cos(p)*Math.sin(l),Math.sin(p),Math.cos(p)*Math.cos(l)]);
}}
var CP=PTS.map(function(a){var p=a[1]*Math.PI/180,l=a[2]*Math.PI/180;
  return {c:a[0],v:[Math.cos(p)*Math.sin(l),Math.sin(p),Math.cos(p)*Math.cos(l)],sx:0,sy:0,vis:false}});
var rot=0.6,tilt=-0.25,vel=0.0016,t0=Date.now();
/* ---- procedural earth (ported from the mockup, no texture) ---- */
var S=300, off=document.createElement('canvas'); off.width=off.height=S;
var octx=off.getContext('2d'); var img=octx.createImageData(S,S);
function renderReal(){
  var d=img.data, i=0, ct=Math.cos(tilt), st=Math.sin(tilt);
  for(var yy=0;yy<S;yy++){ var ny=1-2*(yy+0.5)/S;
    for(var xx=0;xx<S;xx++,i+=4){ var nx=2*(xx+0.5)/S-1;
      var rr=nx*nx+ny*ny; if(rr>1){ d[i+3]=0; continue }
      var nz=Math.sqrt(1-rr);
      var y0=ny*ct+nz*st, z0=-ny*st+nz*ct, x0=nx;
      var la2=Math.asin(Math.max(-1,Math.min(1,y0)));
      var lo2=Math.atan2(x0,z0)+rot;
      var laD=la2*180/Math.PI, loD=lo2*180/Math.PI; loD=((loD%360)+540)%360-180;
      var dt=nx*-0.42+ny*0.5+nz*0.76; var lig=0.22+0.9*Math.max(0,dt);
      var r,g,b;
      if(isLand(laD,loD)){
        var al=Math.abs(laD);
        if(al>66){ r=224;g=231;b=236 }
        else if(al>56){ var t=(al-56)/10; r=96+t*100;g=112+t*95;b=88+t*124 }
        else if(al>38){ r=60;g=99;b=56 }
        else if(al>15){ var dz=1-Math.abs(al-26)/12; dz=Math.max(0,Math.min(1,dz));
          r=62+dz*82; g=100+dz*22; b=56+dz*14 }
        else { r=48;g=96;b=46 }
        var tx=1+0.10*Math.sin(laD*7.3)*Math.sin(loD*6.1)+0.06*Math.sin(laD*17.7+loD*13.3);
        r*=tx; g*=tx; b*=tx;
      } else {
        r=12; g=42+20*nz; b=82+34*nz;
        var sp=Math.pow(Math.max(0,dt),26)*80; r+=sp; g+=sp; b+=sp*1.1;
      }
      d[i]=r*lig; d[i+1]=g*lig; d[i+2]=b*lig; d[i+3]=255;
    } }
  octx.putImageData(img,0,0);
}
function proj(v,R,cx,cy){
  var x=v[0]*Math.cos(rot)-v[2]*Math.sin(rot);
  var z=v[0]*Math.sin(rot)+v[2]*Math.cos(rot);
  var y=v[1]*Math.cos(tilt)-z*Math.sin(tilt);
  var z2=v[1]*Math.sin(tilt)+z*Math.cos(tilt);
  return [cx+x*R,cy-y*R,z2];
}
function frame(){
  var W=cv.width,H=cv.height,cx=W/2,cy=H*0.47,R=Math.min(W,H)*0.42;
  ctx.clearRect(0,0,W,H);
  /* faint orbit rings, like the mockup */
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(-0.32);
  ctx.beginPath(); ctx.ellipse(0,0,R*1.28,R*0.4,0,0,7); ctx.strokeStyle='rgba(255,255,255,0.045)'; ctx.lineWidth=1*DPR; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,0,R*1.28,R*0.4,0,-0.5,0.35); ctx.strokeStyle='rgba(255,107,0,0.16)'; ctx.lineWidth=1.4*DPR; ctx.stroke();
  ctx.restore();
  if(MODE==='real'){
    renderReal();
    ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.clip();
    ctx.imageSmoothingEnabled=true; ctx.drawImage(off,cx-R,cy-R,2*R,2*R);
    ctx.restore();
    var rg=ctx.createRadialGradient(cx,cy,R*0.86,cx,cy,R);
    rg.addColorStop(0,'rgba(255,255,255,0)'); rg.addColorStop(1,'rgba(255,255,255,0.10)');
    ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fillStyle=rg; ctx.fill();
  } else {
    var g=ctx.createRadialGradient(cx-R*0.3,cy-R*0.35,R*0.1,cx,cy,R);
    g.addColorStop(0,'#1c1c24');g.addColorStop(1,'#0b0b0f');
    ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fillStyle=g;ctx.fill();
    var s=1.6*DPR;
    for(var i=0;i<dots.length;i++){
      var p=proj(dots[i],R,cx,cy);
      if(p[2]>0){ctx.globalAlpha=0.14+0.42*p[2];ctx.fillStyle='rgba(170,170,188,0.9)';ctx.fillRect(p[0]-s/2,p[1]-s/2,s,s)}
    }
    ctx.globalAlpha=1;
  }
  /* channel lights — both modes */
  var tm=(Date.now()-t0)/1000;
  for(var j=0;j<CP.length;j++){
    var q=proj(CP[j].v,R,cx,cy);
    CP[j].vis=q[2]>0.05;CP[j].sx=q[0];CP[j].sy=q[1];
    if(!CP[j].vis)continue;
    var pulse=0.55+0.45*Math.sin(tm*1.6+j*0.7);
    ctx.beginPath();ctx.arc(q[0],q[1],4.2*DPR*q[2],0,7);
    ctx.fillStyle='rgba(255,107,0,'+(0.10+0.10*pulse)+')';ctx.fill();
    ctx.beginPath();ctx.arc(q[0],q[1],1.7*DPR*(0.6+0.4*q[2]),0,7);
    ctx.fillStyle='rgba(255,'+(140+Math.floor(40*pulse))+',30,'+(0.55+0.4*q[2])+')';ctx.fill();
  }
  if(!drag)rot+=vel;
  requestAnimationFrame(frame);
}
var drag=false,sx0=0,sy0=0,r0=0,t1=0,moved=0;
cv.addEventListener('pointerdown',function(e){drag=true;moved=0;sx0=e.clientX;sy0=e.clientY;r0=rot;t1=tilt});
addEventListener('pointermove',function(e){if(!drag)return;
  var dx=e.clientX-sx0,dy=e.clientY-sy0;
  if(Math.abs(dx)+Math.abs(dy)>7)moved=1;
  rot=r0+dx*0.006;tilt=Math.max(-1.1,Math.min(1.1,t1-dy*0.005))});
addEventListener('pointerup',function(e){
  drag=false;if(moved)return;
  var px=e.clientX*DPR,py=e.clientY*DPR,best=null,bd=26*DPR;
  for(var j=0;j<CP.length;j++){if(!CP[j].vis)continue;
    var d=Math.hypot(CP[j].sx-px,CP[j].sy-py);
    if(d<bd){bd=d;best=CP[j].c}}
  if(best&&window.ReactNativeWebView)window.ReactNativeWebView.postMessage(best);
});
frame();
</script></body></html>`
}
