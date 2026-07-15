// The Atlas globe — the mockup's signature canvas world, adapted for a
// WebView. Dark sphere, sampled land dots, one orange light per country.
// Drag to spin, tap a light -> postMessage(country code) -> Country dive.
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
var LAND=new Uint8Array(GEO.W*GEO.H);
(function(){var i=0,v=0;for(var r=0;r<GEO.rle.length;r++){var n=GEO.rle[r];for(var k=0;k<n;k++)LAND[i++]=v;v=1-v}})();
function isLand(la,lo){var x=Math.floor((lo+180)/360*GEO.W),y=Math.floor((90-la)/180*GEO.H);
if(x<0)x=0;if(x>=GEO.W)x=GEO.W-1;if(y<0)y=0;if(y>=GEO.H)y=GEO.H-1;return LAND[y*GEO.W+x]===1}
var cv=document.getElementById('g'),ctx=cv.getContext('2d');
var DPR=Math.min(window.devicePixelRatio||1,2);
function fit(){cv.width=innerWidth*DPR;cv.height=innerHeight*DPR}
fit();addEventListener('resize',fit);
/* land dots as unit vectors */
var dots=[];
for(var la=-88;la<=88;la+=3){for(var lo=-180;lo<180;lo+=3){
  if(!isLand(la,lo))continue;
  var p=la*Math.PI/180,l=lo*Math.PI/180;
  dots.push([Math.cos(p)*Math.sin(l),Math.sin(p),Math.cos(p)*Math.cos(l)]);
}}
var CP=PTS.map(function(a){var p=a[1]*Math.PI/180,l=a[2]*Math.PI/180;
  return {c:a[0],v:[Math.cos(p)*Math.sin(l),Math.sin(p),Math.cos(p)*Math.cos(l)],sx:0,sy:0,vis:false}});
var rot=0.6,tilt=-0.25,vel=0.0016,t0=Date.now();
function proj(v,R,cx,cy){
  var x=v[0]*Math.cos(rot)-v[2]*Math.sin(rot);
  var z=v[0]*Math.sin(rot)+v[2]*Math.cos(rot);
  var y=v[1]*Math.cos(tilt)-z*Math.sin(tilt);
  var z2=v[1]*Math.sin(tilt)+z*Math.cos(tilt);
  return [cx+x*R,cy-y*R,z2];
}
function frame(){
  var W=cv.width,H=cv.height,cx=W/2,cy=H/2,R=Math.min(W,H)/2-14*DPR;
  ctx.clearRect(0,0,W,H);
  var g=ctx.createRadialGradient(cx-R*0.3,cy-R*0.35,R*0.1,cx,cy,R);
  g.addColorStop(0,'#1c1c24');g.addColorStop(1,'#0b0b0f');
  ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fillStyle=g;ctx.fill();
  ctx.fillStyle='rgba(170,170,188,0.5)';
  var s=1.6*DPR;
  for(var i=0;i<dots.length;i++){
    var p=proj(dots[i],R,cx,cy);
    if(p[2]>0){var a=0.14+0.42*p[2];ctx.globalAlpha=a;ctx.fillRect(p[0]-s/2,p[1]-s/2,s,s)}
  }
  ctx.globalAlpha=1;
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
