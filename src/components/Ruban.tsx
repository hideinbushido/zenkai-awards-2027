"use client";
import {useEffect,useRef} from "react";
import type {Nomine} from "@/data/edition";
import s from "./Ruban.module.css";

type Props={entries:Nomine[];images:string[];index:number;onSelect:(i:number)=>void};
export default function Ruban({entries,images,index,onSelect}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);
 const model=useRef({index,onSelect,images});model.current={index,onSelect,images};
 const move=useRef<(i:number)=>void>(()=>{});
 useEffect(()=>{move.current(index)},[index]);
 useEffect(()=>{
   const el=canvas.current;
   if(!el)return;
   const ctx=el.getContext("2d");
   if(!ctx)return;
   const count=entries.length, wrap=(n:number)=>((n%count)+count)%count;
   let position=model.current.index,target=position,lastIndex=wrap(position),frame=0,lastTime=0;
   let width=0,height=0,pitch=1,x0=0,start=0,previousX=0,previousTime=0,speed=0,dragging=false,bending=0;
   let wheelTimer:ReturnType<typeof setTimeout>|undefined;
   const reduced=matchMedia("(prefers-reduced-motion: reduce)");
   const textures=new Map<number,HTMLImageElement>();
   let disposed=false;
   function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(draw)}
   function texture(i:number){
     if(!textures.has(i)){
       const image=new Image();image.onload=schedule;image.src=model.current.images[i];textures.set(i,image);
     }
     return textures.get(i)!;
   }
   function draw(t:number){
     frame=0;if(!ctx||!el)return;
     const dt=Math.min(40,Math.max(1,t-lastTime));lastTime=t;
     const before=position;
     position+= (target-position)*(reduced.matches?1:1-Math.exp(-dt/(dragging?28:91)));
     const velocity=(position-before)/dt*1000;
     bending+=(Math.max(-1,Math.min(1,velocity*.21))-bending)*(1-Math.exp(-dt/75));
     if(reduced.matches)bending=0;
     ctx.clearRect(0,0,width,height);
     const h=Math.min(height*.90,width*.79/.716),w=h*.716;
     pitch=w+Math.min(76,Math.max(24,width*.037));
     const visible=Math.ceil(width/pitch/2)+1;
     for(let slot=Math.floor(position)-visible;slot<=Math.ceil(position)+visible;slot++){
       const dist=slot-position,center=width/2+dist*pitch;
       if(center+w/2<0||center-w/2>width)continue;
       const img=texture(wrap(slot));if(!img.complete||!img.naturalWidth)continue;
       const depth=Math.min(1,Math.abs(dist)),scale=1-.115*depth;
       const cw=w*scale,ch=h*scale,top=(height-ch)/2+depth*6;
       const slices=36;
       ctx.globalAlpha=1-depth*.36;
       for(let j=0;j<slices;j++){
         const u=j/slices,z=u*2-1;
         const edge=z*z,flex=bending*edge;
         const dx=center+(u-.5)*cw-flex*cw*.078;
         const nextZ=2*(j+1)/slices-1;
         const dw=cw/slices-bending*(nextZ*nextZ-edge)*cw*.078;
         const dy=top+Math.abs(flex)*ch*.052+flex*z*ch*.018;
         ctx.drawImage(img,u*img.naturalWidth,0,img.naturalWidth/slices,img.naturalHeight,dx,dy,dw+.5,ch-Math.abs(flex)*ch*.055);
       }
     }
     ctx.globalAlpha=1;
     if(Math.abs(target-position)>.001||Math.abs(bending)>.004)schedule();
     else if(!dragging&&Number.isInteger(target)&&wrap(target)!==lastIndex){lastIndex=wrap(target);model.current.onSelect(lastIndex)}
   }
   function resize(){if(!el||!ctx)return;const b=el.getBoundingClientRect();width=b.width;height=b.height;const d=Math.min(devicePixelRatio||1,2);el.width=Math.round(width*d);el.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);schedule()}
   function settle(){target=Math.round(target);schedule()}
   function down(e:PointerEvent){if(e.button!==0)return;clearTimeout(wheelTimer);dragging=true;x0=previousX=e.clientX;previousTime=e.timeStamp;speed=0;start=position;target=position;el!.setPointerCapture(e.pointerId)}
   function drag(e:PointerEvent){if(!dragging)return;target=start+(x0-e.clientX)/pitch;speed=(previousX-e.clientX)/Math.max(8,e.timeStamp-previousTime);previousX=e.clientX;previousTime=e.timeStamp;schedule()}
   function up(e:PointerEvent){if(!dragging)return;dragging=false;if(Math.abs(e.clientX-x0)<6){const x=e.clientX-el!.getBoundingClientRect().left;target=position+(x-width/2)/pitch}else if(e.timeStamp-previousTime<100){target+=Math.max(-1.2,Math.min(1.2,speed*145/pitch))}settle()}
   function cancel(){dragging=false;settle()}
   function wheel(e:WheelEvent){if(e.ctrlKey)return;e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?height:1;target+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*unit/pitch;clearTimeout(wheelTimer);wheelTimer=setTimeout(settle,140);schedule()}
   move.current=i=>{if(i===lastIndex)return;lastIndex=i;const n=Math.round(position);const forward=wrap(i-wrap(n));target=n+(forward>count/2?forward-count:forward);schedule()};
   const observer=new ResizeObserver(resize);observer.observe(el);resize();
   el.addEventListener("pointerdown",down);el.addEventListener("pointermove",drag);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",cancel);el.addEventListener("wheel",wheel,{passive:false});
   return ()=>{disposed=true;observer.disconnect();cancelAnimationFrame(frame);clearTimeout(wheelTimer);el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",drag);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",cancel);el.removeEventListener("wheel",wheel);move.current=()=>{}};
 },[entries]);
 return <canvas className={s.ribbon} ref={canvas} data-lenis-prevent="" tabIndex={0} role="group" aria-label={"Galerie des nominés · "+entries[index].nom+" · flèches gauche et droite"} />;
}
