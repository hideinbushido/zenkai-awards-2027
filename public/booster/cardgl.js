/* ZENKAI 2027 — rendu WebGL d'une carte révélée + ses effets continus de rareté.
   mode 0 = ZENKAI (foil cristal, emblème en filigrane, flammes vivantes, balayage prisme, braises)
   mode 1 = MIRAGE (brume de chaleur, image fantôme, profondeur, verre nacré, lumières en orbite) */
(function () {
  const VS = `attribute vec2 p;varying vec2 vUv;void main(){vUv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
  const FS = `precision highp float;
varying vec2 vUv;
uniform sampler2D uIll,uOver,uMask;
uniform float uT,uLoop,uMode,uFx,uDepth,uZoom,uGhost,uAsp,uFlash,uBurn;
uniform sampler2D uBack;
uniform vec2 uTilt;
uniform vec4 uPts[64];
uniform vec3 uPtCol[64];
const float PI=3.14159265;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 hash2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vnoise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec3 rainbow(float t){t=fract(t)*6.;
 vec3 c0=vec3(1.,.31,.78),c1=vec3(.67,.27,1.),c2=vec3(.27,.47,1.),c3=vec3(.24,.86,1.),c4=vec3(.39,1.,.67),c5=vec3(1.,.94,.47);
 float f=fract(t);f=f*f*(3.-2.*f);int i=int(floor(t));
 vec3 a=c0,b=c1;
 if(i==1){a=c1;b=c2;}else if(i==2){a=c2;b=c3;}else if(i==3){a=c3;b=c4;}else if(i==4){a=c4;b=c5;}else if(i==5){a=c5;b=c0;}
 return mix(a,b,f);}
vec3 pastel(float t){t=fract(t)*6.;
 vec3 c0=vec3(.8,.7,1.),c1=vec3(1.,.67,.9),c2=vec3(.67,.78,1.),c3=vec3(.59,.92,1.),c4=vec3(.78,1.,.92),c5=vec3(.92,.82,1.);
 float f=fract(t);f=f*f*(3.-2.*f);int i=int(floor(t));
 vec3 a=c0,b=c1;
 if(i==1){a=c1;b=c2;}else if(i==2){a=c2;b=c3;}else if(i==3){a=c3;b=c4;}else if(i==4){a=c4;b=c5;}else if(i==5){a=c5;b=c0;}
 return mix(a,b,f);}
vec3 scr(vec3 a,vec3 b,float k){return a+(1.-a)*b*clamp(k,0.,1.);}
vec4 tex(sampler2D s,vec2 uv){return (uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)?vec4(0.):texture2D(s,uv);}
float star(vec2 uv,vec2 c,float size){
 vec2 d=(uv-c)*vec2(uAsp,1.)/size;
 return exp(-abs(d.x)*18.)*exp(-abs(d.y)*2.)+exp(-abs(d.y)*18.)*exp(-abs(d.x)*2.)+exp(-dot(d,d)*40.);}
void main(){
 vec2 uv=vUv;
 float t=fract(uT/uLoop);float T=2.*PI*t;
 float S=uv.x*.75+uv.y*.55;
 vec4 mk=texture2D(uMask,uv);
 // ---------- illustration (plan du fond), avec profondeur
 vec2 iuv=(uv-.5)/uZoom+.5-uTilt*.014;
 vec3 ill;float ia;
 if(uMode<.5){
  vec4 I=tex(uIll,iuv);ill=I.rgb;ia=texture2D(uIll,uv).a;
  float lum=dot(ill,vec3(.3,.55,.15));
  // foil cristal : facettes holo qui s'allument
  vec2 g=uv*vec2(26.,36.);vec2 gi=floor(g),gf=fract(g);float md=9.;vec2 cid=vec2(0.);
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 r=o+hash2(gi+o)-gf;float d=dot(r,r);if(d<md){md=d;cid=gi+o;}}
  float th=hash(cid),hu=hash(cid+7.3);
  float flash=pow(max(cos(T+th*2.*PI+S*3.),0.),3.);
  float m=smoothstep(.38,.73,lum)*uFx;
  vec3 fc=rainbow(hu+S*1.5+t);
  ill=scr(ill,fc,flash*m*.65);
  ill=scr(ill,vec3(1.),pow(flash,4.)*m*.4);
  // emblème géant en filigrane, faisceau qui tourne
  float ang=atan(uv.y-.44,(uv.x-.5)*uAsp);
  float beam=pow(max(cos(ang-T),0.),10.);
  ill=scr(ill,rainbow(ang/(2.*PI)+t+S),mk.b*(.15+.7*beam)*uFx);
 }else if(uMode<1.5){
  // brume de chaleur
  float n=vnoise(uv*vec2(5.,7.)+vec2(0.,uT*.15))*1.5;
  float amp=.0026*(.5+uFx*.5+uGhost*1.5);
  vec2 dsp=vec2(amp*sin(uv.y*1483./22.-4.*T+n)*(.6+.4*sin(uv.x*1061./90.+T)),amp*.5*sin(uv.x*1061./35.+2.*T));
  // profondeur : fond et personnages sur deux plans
  vec2 bgUv=(iuv-.5)/(1.+.06*uDepth)+.5+dsp-uTilt*.006;
  vec2 fgUv=(iuv-.5)/(1.-.04*uDepth)+.5+dsp*.5+uTilt*.012+vec2(0.,-.03*uDepth);
  vec4 B=tex(uIll,bgUv),Fg=tex(uIll,fgUv);
  float fa=tex(uMask,fgUv).b;
  ill=mix(B.rgb,Fg.rgb,fa);ia=texture2D(uIll,uv).a;
  // image fantôme irisée
  float gA=pow(abs(sin(T)),1.2)*.28*uFx+uGhost*.45;
  vec2 off=vec2(.013*sin(T)+.03*uGhost*sin(uT*3.),-.004*sin(T));
  vec3 gh=vec3(tex(uIll,bgUv-off+vec2(.0038,0.)).r,tex(uIll,bgUv-off).g,tex(uIll,bgUv-off-vec2(.0038,0.)).b);
  gh=gh*.6+pastel(S*2.+t)*.4;
  ill=scr(ill,gh,gA);
  float p=-.3+1.6*t;
  ill=scr(ill,pastel(S*3.-t),exp(-pow((S-p)/.16,2.))*.18*uFx);
 }else if(uMode>2.5){
  vec4 I=tex(uIll,iuv);ill=I.rgb;ia=texture2D(uIll,uv).a;
  if(uMode<3.5){
   // PRISME : la lumière se diffracte dans les cristaux des coins et projette des éventails d'arc-en-ciel
   for(int c=0;c<4;c++){
    vec2 cc=vec2(c==1||c==3?1.:0.,c>=2?1.:0.);
    vec2 v=(uv-cc)*vec2(uAsp,1.);float dist=length(v);
    float an=atan(v.y,v.x);
    float fan=pow(.5+.5*sin(an*26.+uT*.8+float(c)*1.7),3.)*exp(-dist/.22)*(.55+.45*sin(T+float(c)*1.57));
    ill=scr(ill,rainbow(dist*3.-uT*.12+float(c)*.25),fan*.32*uFx);
   }
   float p=-.35+1.7*t+uTilt.x*.2;
   float bar=exp(-pow((S-p)/.012,2.))+.5*exp(-pow((S-p+.03)/.02,2.));
   ill=scr(ill,rainbow((S-p)*18.+.2),bar*.22*uFx);
  }
 }else{
  // SPECTRE : flammes noires holographiques qui lèchent l'image depuis la bordure (aucune animation de l'illustration)
  vec4 I=tex(uIll,iuv);ill=I.rgb;ia=texture2D(uIll,uv).a;
  vec2 pp=(uv-.5)*vec2(uAsp,1.);
  float dd=-sdRB(pp,vec2((.5-66./1061.)*uAsp,.5-66./1483.),22./1483.);
  float sa=atan(pp.y,pp.x);
  float fl=uT*.9;
  vec2 q=vec2(sa*15.,dd*13.-fl*1.9);
  float n=fbm(q+vec2(fbm(q*.6+vec2(0.,fl*.4))*1.6,0.));
  float reach=(.085+.06*vnoise(vec2(sa*2.5,uT*.25)))*(1.+2.4*uGhost);
  float h=n-max(dd,0.)/reach;
  float on=max(uFx,uGhost)*step(0.,dd);
  float body=smoothstep(.02,.22,h)*on;
  float rim=(smoothstep(-.07,0.,h)-smoothstep(0.,.07,h))*on;
  vec3 hc=rainbow(sa*.35+dd*5.-uT*.18+uTilt.x*.6+uTilt.y*.3);
  hc=mix(hc,vec3(.62,.36,1.),.25);
  ill=mix(ill,ill*.1+vec3(.02,.0,.05),body*.88);
  ill=scr(ill,hc,body*.1*(.5+.5*sin(sa*6.+uT*2.)));
  ill=scr(ill,hc,rim*1.3);
  float core=smoothstep(.25,.6,h)*on;
  ill=mix(ill,vec3(0.),core*.5);
 }
 // ---------- calque du dessus : cadre + infos
 vec2 ouv=uv;
 if(uMode>1.5&&uMode<2.5){vec2 fl=vec2(vnoise(uv*6.+vec2(0.,-uT*.4))-.5,vnoise(uv*6.+vec2(5.,uT*.3))-.5)*.006*mk.g*(uFx+uGhost);ouv+=fl;}
 vec4 O=texture2D(uOver,ouv);
 vec3 col=mix(ill,O.rgb,O.a);
 float a=ia+O.a*(1.-ia);
 if(uMode<.5){
  // flammes vivantes
  float de=min(min(uv.x,1.-uv.x)*uAsp,min(uv.y,1.-uv.y));
  float pulse=pow(max(sin(2.*PI*(2.*t-de/.09)),0.),6.);
  col=scr(col,vec3(1.,.9,.6),(clamp(pulse*mk.g*1.3,0.,1.)+.14*(.5+.5*sin(T))*mk.r)*uFx);
  // balayage prisme (suit aussi l'inclinaison)
  float p=-.25+1.7*(.5-.5*cos(PI*min(1.,t/.7)))+uTilt.x*.25;
  float I=exp(-pow((S-p)/.1,2.))+.5*exp(-pow((S-p+.2)/.035,2.));
  col=scr(col,rainbow(S*3.-t),I*ia*(.45+.55*mk.r)*uFx);
 }else if(uMode>3.5){
  // ÉCLAT : reflet d'argent qui balaie le cadre, l'or s'allume au passage
  float p=-.3+1.6*(.5-.5*cos(PI*min(1.,t/.6)))+uTilt.x*.25;
  float I=exp(-pow((S-p)/.07,2.));
  col=scr(col,vec3(1.,.98,.94),mk.r*I*.75*uFx);
  col=scr(col,vec3(1.,.82,.45),mk.g*(I*.6+.12*(.5+.5*sin(T*2.)))*uFx);
 }else if(uMode>2.5){
  // PRISME : les cristaux s'allument en spectre, l'or s'illumine
  float fl=pow(max(sin(T*2.+vnoise(uv*vec2(22.,30.))*6.28),0.),5.);
  col=scr(col,rainbow(S*2.+t+vnoise(uv*9.)),mk.g*(.15+.75*fl)*uFx);
  float p=-.3+1.6*t+uTilt.x*.2;
  col=scr(col,vec3(1.,.9,.7),mk.r*exp(-pow((S-p)/.06,2.))*.6*uFx);
 }else if(uMode>1.5){
  vec2 pp=(uv-.5)*vec2(uAsp,1.);
  float sa=atan(pp.y,pp.x);
  float dout=sdRB(pp,vec2((.5-66./1061.)*uAsp,.5-66./1483.),22./1483.);
  float n2=fbm(vec2(sa*12.,dout*30.-uT*1.7));
  float tongue=smoothstep(.5,.75,n2)*mk.g*uFx;
  col=mix(col,col*.25,tongue*.75);
  float edge=(smoothstep(.42,.5,n2)-smoothstep(.5,.58,n2))*mk.g*uFx;
  vec3 hc=rainbow(sa*.35-uT*.18+uTilt.x*.6+S);
  col=scr(col,hc,edge*.9);
  float p=-.3+1.6*t+uTilt.x*.2;
  col=scr(col,rainbow(S*3.-t),mk.r*exp(-pow((S-p)/.06,2.))*.6*uFx);
  }else{
  float flow=.5+.5*sin(S*14.-2.*T);
  col=scr(col,pastel(S*2.5+t),mk.g*(.15+.45*pow(flow,4.))*uFx);
  float p=-.3+1.6*t+uTilt.x*.2;
  col=scr(col,vec3(1.),mk.g*exp(-pow((S-p)/.05,2.))*.55*uFx);
 }
 // reflet qui suit le doigt / la souris
 vec2 gp=vec2(.5,.45)+uTilt*vec2(.7,.6);
 col=scr(col,vec3(1.,.97,.92),exp(-dot((uv-gp)*vec2(uAsp,1.),(uv-gp)*vec2(uAsp,1.))/.05)*.22*a*(.3+.7*mk.r+.3*(1.-O.a)));
 // éclats, braises, lumières
 for(int i=0;i<64;i++){vec4 P=uPts[i];if(P.z>.003){float s=star(uv,P.xy,P.w)*P.z;col=scr(col,uPtCol[i],s);a=max(a,clamp(s,0.,1.));}}
 // combustion SPECTRE : le dos posé par-dessus brûle depuis les bords et laisse voir la face
 if(uBurn>0.){
  vec2 bq=(uv-.5)*vec2(uAsp,1.);vec2 be=vec2(uAsp,1.)*.5-abs(bq);
  float k=min(be.x,be.y)+(vnoise(uv*vec2(4.,5.5))-.5)*.17+(vnoise(uv*vec2(13.,15.))-.5)*.05-mix(-.13,.5,uBurn);
  vec4 B=texture2D(uBack,uv);
  if(k>=0.){
   vec3 bc=B.rgb*.92;
   bc=mix(bc,vec3(.025,.018,.03),smoothstep(.055,.004,k)*.95);
   bc+=mix(vec3(.55,.3,1.),rainbow(uv.x*2.3+uv.y*1.7+uT*.35),.55)*smoothstep(.013,0.,k)*1.8;
   col=mix(col,bc,B.a);a=max(a,B.a);
  }else{
   float fl=vnoise(vec2(uv.x*13.,uv.y*5.+uT*2.4))*.7+vnoise(vec2(uv.x*29.,uv.y*11.+uT*3.6))*.3;
   float f=smoothstep(.02+.075*fl*fl,0.,-k);
   float rim=smoothstep(.15,.55,f)*(1.-smoothstep(.55,.95,f));
   vec3 fc=vec3(.012,.008,.02)+(rainbow(uv.y*1.3+uv.x*.8+uT*.22+fl*.6)*.8+vec3(.15,.05,.3))*rim*1.1;
   col=mix(col,fc,f*.92);
  }
 }
 col=mix(col,vec3(1.),uFlash);
 gl_FragColor=vec4(col*a,a);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function loadImg(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  class CardGL {
    constructor(canvas) {
      this.c = canvas;
      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!gl) throw new Error("webgl");
      this.gl = gl;
      const pr = gl.createProgram();
      gl.attachShader(pr, compile(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(pr, compile(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr); this.pr = pr;
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {};
      ["uIll", "uOver", "uMask", "uT", "uLoop", "uMode", "uFx", "uDepth", "uZoom", "uGhost", "uAsp", "uFlash", "uTilt", "uPts", "uPtCol", "uBurn", "uBack"]
        .forEach(n => this.u[n] = gl.getUniformLocation(pr, n));
      this.tex = [gl.createTexture(), gl.createTexture(), gl.createTexture(), gl.createTexture()];
      this.backReady = false;
      this.pts = new Float32Array(64 * 4); this.pcol = new Float32Array(64 * 3);
      this.state = { fx: 0, depth: 0, zoom: 1, ghost: 0, flash: 0, tiltX: 0, tiltY: 0, burn: 0 };
      this.t0 = performance.now();
    }
    async load(card) {
      const gl = this.gl;
      const srcs = [card.ill, card.over, card.masks]; if (!this.backReady) srcs.push("img/dos.webp");
      const imgs = await Promise.all(srcs.map(loadImg)); this.backReady = true;
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      imgs.forEach((im, i) => {
        gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.tex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      });
      gl.uniform1i(this.u.uIll, 0); gl.uniform1i(this.u.uOver, 1); gl.uniform1i(this.u.uMask, 2); gl.uniform1i(this.u.uBack, 3);
      this.card = card;
      this.mode = { zenkai: 0, mirage: 1, spectre: 2, prisme: 3, eclat: 4 }[card.rarity] ?? 1;
      this.loop = card.rarity === "zenkai" ? 3 : 4;
      this.resize();
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = Math.min(1256, Math.max(300, Math.round(r.height * dpr)));
      const w = Math.round(h * 900 / 1256);
      if (this.c.width !== w || this.c.height !== h) { this.c.width = w; this.c.height = h; }
      this.gl.viewport(0, 0, w, h);
    }
    points(t) {
      const P = this.pts, C = this.pcol, D = window.ZK_DATA, s = this.state;
      P.fill(0);
      let k = 0;
      const put = (x, y, i, size, c) => { if (k >= 64) return; P.set([x, y, i, size], k * 4); C.set(c, k * 3); k++; };
      const TP = 2 * Math.PI;
      if (this.mode === 0) {
        const lt = (t / 3) % 1, d = D.zenkai;
        d.embers.forEach((e, i) => {
          const ph = (i * 0.618) % 1, age = (lt * 2 + ph) % 1;
          const x = e[0] + (0.5 - e[0]) * 0.08 * age + Math.sin(i * 3.1 + t) * 0.004;
          const y = e[1] - 0.14 * age * (0.6 + (i % 5) * 0.12);
          put(x, y, Math.sin(Math.PI * age) * s.fx, 0.012, [1, 0.78, 0.35]);
        });
        d.crown.forEach((c, j) => put(c[0], c[1], Math.pow(Math.max(0, Math.sin(TP * (lt * 2 - j / 5))), 8) * s.fx, 0.04, [1, 0.9, 1]));
        (this.card.twinkle || []).forEach((c, j) => { const a = Math.pow(Math.max(0, Math.sin(TP * (lt * 2 + j * 0.37))), 10); put(c[0], c[1], a * 0.8 * s.fx, 0.014, [1, 0.96, 0.85]); });
      } else if (this.mode === 3 || this.mode === 4) {
        const lt = (t / 4) % 1, d = this.mode === 3 ? D.prisme : D.eclat;
        d.glass.forEach((c, j) => { const a = Math.pow(Math.max(0, Math.sin(TP * (lt * (this.mode === 3 ? 2 : 1) + j * 0.31))), 12); put(c[0], c[1], a * s.fx, this.mode === 3 ? 0.025 : 0.03, this.mode === 3 ? [1, 0.9, 1] : [1, 0.88, 0.6]); });
        (this.card.twinkle || []).slice(0, this.mode === 3 ? 20 : 8).forEach((c, j) => { const a = Math.pow(Math.max(0, Math.sin(TP * (lt * 2 + j * 0.41))), 12); put(c[0], c[1], a * 0.5 * s.fx, 0.012, [1, 0.97, 0.92]); });
      } else if (this.mode === 2) {
        const lt = (t / 4) % 1, d = D.spectre;
        for (let i = 0; i < 34; i++) {          // poussière spectrale qui monte des bords
          const ph = (i * 0.618) % 1, age = (lt * 2 + ph) % 1, side = i % 3;
          const bx = side === 0 ? 0.08 + ((i * 0.37) % 1) * 0.84 : (side === 1 ? 0.07 : 0.93);
          const by = side === 0 ? 0.93 : 0.2 + ((i * 0.53) % 1) * 0.75;
          const x = bx + (0.5 - bx) * 0.12 * age + Math.sin(i * 2.3 + t * 1.3) * 0.01, y = by - 0.12 * age;
          put(x, y, Math.sin(Math.PI * age) * 0.8 * s.fx, 0.01, i % 2 ? [0.55, 0.9, 1] : [0.75, 0.55, 1]);
        }
        d.glass.forEach((c, j) => { const a = Math.pow(Math.max(0, Math.sin(TP * (lt + j * 0.29))), 12); put(c[0], c[1], a * s.fx, 0.022, [0.85, 0.95, 1]); });
        d.rings.forEach((o, j) => {
          const th = TP * lt * (j ? -1 : 1) + j * 2, px = o[2] * 1061 * Math.cos(th), py = o[3] * 1483 * Math.sin(th);
          const cr = Math.cos(o[4] * Math.PI / 180), sr = Math.sin(o[4] * Math.PI / 180);
          put((px * cr - py * sr + o[0] * 1061) / 1061, (px * sr + py * cr + o[1] * 1483) / 1483, (0.5 + 0.5 * Math.sin(th)) * s.fx, 0.02, [0.6, 0.95, 1]);
        });
        put(d.diamond[0], d.diamond[1], Math.pow(Math.max(0, Math.sin(TP * lt * 2)), 6) * s.fx, 0.06, [0.8, 0.9, 1]);
        (this.card.twinkle || []).forEach((c, j) => { const a = Math.pow(Math.max(0, Math.sin(TP * (lt * 2 + j * 0.41))), 10); put(c[0], c[1], a * 0.6 * s.fx, 0.012, [0.8, 0.9, 1]); });
      } else {
        const lt = (t / 4) % 1, d = D.mirage;
        d.orbits.forEach((o, j) => {
          const th = TP * lt + j * 1.1, px = o[2] * 1061 * Math.cos(th), py = o[3] * 1483 * Math.sin(th);
          const cr = Math.cos(o[4] * Math.PI / 180), sr = Math.sin(o[4] * Math.PI / 180);
          const X = px * cr - py * sr + o[0] * 1061, Y = px * sr + py * cr + o[1] * 1483;
          put(X / 1061, Y / 1483, (0.55 + 0.45 * Math.sin(th)) * s.fx, 0.02, [1, 0.95, 1]);
        });
        (this.card.twinkle || []).forEach((c, j) => { const a = Math.pow(Math.max(0, Math.sin(TP * (lt * 2 + j * 0.41))), 10); put(c[0], c[1], a * 0.8 * s.fx, 0.012, [1, 0.95, 1]); });
        d.glass.forEach((c, j) => { const a = Math.pow(Math.max(0, Math.sin(TP * (lt + j * 0.29))), 12); put(c[0], c[1], a * s.fx, 0.018, [1, 1, 1]); });
        put(d.diamond[0], d.diamond[1], Math.pow(Math.max(0, Math.sin(TP * lt * 2)), 6) * s.fx, 0.06, [1, 1, 1]);
      }
    }
    draw(now) {
      if (!this.card) return;
      const gl = this.gl, u = this.u, s = this.state;
      const t = (now - this.t0) / 1000;
      this.points(t);
      gl.uniform1f(u.uT, t); gl.uniform1f(u.uLoop, this.loop); gl.uniform1f(u.uMode, this.mode);
      gl.uniform1f(u.uFx, s.fx); gl.uniform1f(u.uDepth, s.depth); gl.uniform1f(u.uZoom, s.zoom);
      gl.uniform1f(u.uGhost, s.ghost); gl.uniform1f(u.uFlash, s.flash); gl.uniform1f(u.uBurn, s.burn || 0); gl.uniform1f(u.uAsp, 900 / 1256);
      gl.uniform2f(u.uTilt, s.tiltX, s.tiltY);
      gl.uniform4fv(u.uPts, this.pts); gl.uniform3fv(u.uPtCol, this.pcol);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
  window.CardGL = CardGL;
  window.CARD_FS = FS;
})();
