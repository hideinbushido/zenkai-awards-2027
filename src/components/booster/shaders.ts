// Shaders du booster (foil holographique) et des cartes (art + film irisé).

export const FOIL_VERTEX = /* glsl */ `
uniform float uTime; uniform float uBombe;
varying vec2 vUv; varying vec3 vPos; varying vec3 vVue;
void main() {
  vUv = uv;
  vec3 p = position;
  float x = uv.x * 2.0 - 1.0, y = uv.y * 2.0 - 1.0;
  float sertie = smoothstep(0.9, 1.0, abs(y));
  float bombe = (1.0 - x * x) * (1.0 - pow(abs(y), 6.0)) * uBombe;
  p.z += bombe * 0.24;
  p.z += sertie * 0.018 * sin(uv.x * 170.0);
  p.z += sin(uTime * 1.2 + uv.y * 3.5 + uv.x * 1.5) * 0.02 * (1.0 - sertie);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vPos = wp.xyz;
  vVue = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const FOIL_FRAGMENT = /* glsl */ `
uniform sampler2D uEtiquette; uniform float uTime; uniform float uOpacite; uniform float uSertieHaut; uniform float uSertieBas;
varying vec2 vUv; varying vec3 vPos; varying vec3 vVue;
vec3 spectre(float t) { return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + t)); }
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
  vec3 v = normalize(vVue);
  float fres = 1.0 - abs(dot(n, v));
  vec3 l = normalize(vec3(-0.35, 0.55, 1.0));
  float diff = 0.55 + 0.45 * max(dot(n, l), 0.0);
  float brosse = (h(vec2(floor(vUv.y * 420.0), 3.0)) - 0.5) * 0.08;
  vec3 metal = vec3(0.74, 0.76, 0.82) * diff + brosse;
  vec3 irise = spectre(fres * 2.2 + vUv.y * 0.9 + vUv.x * 0.35 + uTime * 0.025);
  vec3 col = mix(metal, irise * 1.05, 0.5 + 0.3 * fres);
  float spec = pow(max(dot(reflect(-l, n), v), 0.0), 36.0);
  col += spec * 0.85;
  float y = vUv.y;
  float zone = max(smoothstep(1.0 - uSertieHaut, 1.0, y) * step(0.001, uSertieHaut), smoothstep(uSertieBas, 0.0, y) * step(0.001, uSertieBas));
  col *= 1.0 - zone * 0.28 * step(0.5, fract(vUv.x * 90.0));
  vec4 e = texture2D(uEtiquette, vUv);
  col = mix(col, e.rgb, e.a);
  gl_FragColor = vec4(col, uOpacite);
}`;

export const CARTE_VERTEX = /* glsl */ `
varying vec2 vUv; varying vec3 vPos; varying vec3 vVue;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz; vVue = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const CARTE_FRAGMENT = /* glsl */ `
uniform sampler2D uArt; uniform vec2 uImage; uniform float uTime; uniform float uOpacite;
varying vec2 vUv; varying vec3 vPos; varying vec3 vVue;
vec3 spectre(float t) { return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + t)); }
void main() {
  // Liseré chromé de 3,5 % autour de l'art
  vec2 bord = vec2(0.045, 0.032);
  vec2 dans = (vUv - bord) / (1.0 - 2.0 * bord);
  float cadre = step(0.0, dans.x) * step(dans.x, 1.0) * step(0.0, dans.y) * step(dans.y, 1.0);
  float rc = 63.0 / 88.0, ri = uImage.x / uImage.y;
  vec2 s = rc > ri ? vec2(1.0, ri / rc) : vec2(rc / ri, 1.0);
  vec2 uvArt = (dans - 0.5) * s + 0.5;
  uvArt.y = 0.18 + uvArt.y * 0.82 + (1.0 - s.y) * 0.0;
  vec3 art = texture2D(uArt, uvArt).rgb;
  vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
  vec3 v = normalize(vVue);
  float fres = 1.0 - abs(dot(n, v));
  vec3 film = spectre(vUv.x * 1.2 - vUv.y * 0.8 + fres * 3.0 + uTime * 0.04);
  vec3 col = art + film * 0.22 * (0.4 + fres);
  vec3 chrome = mix(vec3(0.55, 0.57, 0.63), vec3(0.95, 0.96, 0.99), smoothstep(0.0, 1.0, vUv.y + fres));
  col = mix(chrome + film * 0.25, col, cadre);
  gl_FragColor = vec4(col, uOpacite);
}`;
