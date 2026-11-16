// GLSL for the mirage layer. Coordinates: planes are 1x1 meshes scaled to their DOM rect in px.

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec2 coverUv(vec2 uv, vec2 res, vec2 tres){
  float ra=res.x/res.y; float ta=tres.x/tres.y;
  vec2 s=ra>ta?vec2(1.0,ta/ra):vec2(ra/ta,1.0);
  return (uv-0.5)*s+0.5;
}
`;

// Shared vertex shader. uCurl > 0 bends the plane with scroll velocity (desktop only).
export const VERT = /* glsl */ `
uniform float uTime;
uniform float uVel;
uniform float uCurl;
uniform vec2 uRes;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float v = uVel * uCurl;
  // Bow: the middle of the plane leads, the edges trail, like a sheet in moving air.
  wp.y += sin(uv.x * 3.14159) * v * 0.07 * uRes.y;
  // Travelling ripple across the plane.
  wp.x += sin(uv.y * 6.2831 + uTime * 2.4) * v * 10.0;
  wp.y += sin(uv.x * 9.0 - uTime * 3.0) * abs(v) * 6.0;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const HERO_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexRes;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform float uIntro;
uniform vec4 uRip[4];
uniform float uRipTime;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 uv = vUv;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  // Ambient heat haze, stronger near the ground (the road).
  float base = 0.0018 + 0.0042 * smoothstep(0.55, 0.0, uv.y);
  float d = length((uv - uMouse) * asp);
  float near = smoothstep(0.32, 0.0, d) * uHover;
  float amp = (base + near * 0.016) * (1.0 + (1.0 - uIntro) * 7.0);
  vec2 q = vec2(
    snoise(vec2(uv.x * 7.0, uv.y * 16.0 - uTime * 1.5)),
    snoise(vec2(uv.x * 9.0 + 5.2, uv.y * 20.0 - uTime * 2.1))
  );
  vec2 off = q * amp;
  // Click ripples: expanding rings that fade.
  for (int i = 0; i < 4; i++) {
    vec4 r = uRip[i];
    float age = uRipTime - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 3.0) continue;
    vec2 dv = (uv - r.xy) * asp;
    float dd = length(dv);
    float front = age * 0.42;
    float ring = exp(-pow((dd - front) * 9.0, 2.0));
    float w = sin((dd - front) * 70.0) * ring * exp(-age * 1.3);
    vec2 dir = dv / max(dd, 1e-4);
    off += vec2(dir.x / asp.x, dir.y) * w * 0.018;
  }
  vec2 suv = coverUv(uv + off, uRes, uTexRes);
  vec2 sh = off * 0.9 + vec2(0.0, 0.0006);
  vec3 col;
  col.r = texture2D(uTex, suv + sh).r;
  col.g = texture2D(uTex, suv).g;
  col.b = texture2D(uTex, suv - sh).b;
  // Warm bloom where the air shimmers.
  col += vec3(0.08, 0.05, 0.02) * near * (0.5 + 0.5 * q.x);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const STOP_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexRes;
uniform vec2 uRes;
uniform float uTime;
uniform float uReveal;
uniform float uVel;
uniform vec2 uMouse;
uniform float uHover;
uniform float uRgb;
uniform float uPar;
uniform float uSeed;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 uv = vUv;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);

  // Liquid reveal: a noise threshold sweeps the plane, with strong displacement while it runs.
  float rn = snoise(uv * 2.4 + uSeed) * 0.5 + snoise(uv * 6.0 - uSeed) * 0.22;
  float f = clamp((1.0 - uv.y) * 0.55 + (rn * 0.5 + 0.5) * 0.45, 0.0, 1.0);
  float R = uReveal * 1.25 - 0.12;
  float mask = smoothstep(f, f + 0.1, R);
  float edge = 1.0 - abs(mask * 2.0 - 1.0);
  float settle = pow(1.0 - uReveal, 2.0);
  vec2 n2 = vec2(snoise(uv * 3.0 + uTime * 0.35 + uSeed), snoise(uv * 3.0 - uTime * 0.3 + uSeed * 2.0));
  vec2 liquid = n2 * (settle * 0.12 + edge * 0.05);

  // Mirage hover: the image melts under the pointer (downward drip + swirl), then reforms.
  float d = length((uv - uMouse) * asp);
  float fall = smoothstep(0.42, 0.0, d) * uHover;
  float m1 = snoise(vec2(uv.x * 5.0, uv.y * 3.0 + uTime * 0.7));
  float m2 = snoise(vec2(uv.x * 14.0 + uSeed, uTime * 0.5));
  vec2 melt = vec2(m1 * 0.02, 0.022 + abs(m2) * 0.038) * fall;

  // Slight inner zoom and parallax so the photo drifts inside its frame.
  vec2 puv = (uv - 0.5) / 1.1 + 0.5;
  puv.y += uPar * 0.035;
  vec2 suv = coverUv(puv + liquid + melt, uRes, uTexRes);

  float sh = uRgb * (0.0008 + min(abs(uVel), 1.0) * 0.004) + fall * 0.003 + edge * 0.006;
  vec3 col;
  col.r = texture2D(uTex, suv + vec2(0.0, sh)).r;
  col.g = texture2D(uTex, suv).g;
  col.b = texture2D(uTex, suv - vec2(0.0, sh)).b;

  // Crispness for 600 px sources: a light unsharp mask, then fine grain.
  vec2 tx = 1.0 / uTexRes;
  vec3 blur = (texture2D(uTex, suv + vec2(tx.x, 0.0)).rgb + texture2D(uTex, suv - vec2(tx.x, 0.0)).rgb
             + texture2D(uTex, suv + vec2(0.0, tx.y)).rgb + texture2D(uTex, suv - vec2(0.0, tx.y)).rgb) * 0.25;
  col += (col - blur) * 0.35;
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.04;

  col += vec3(0.10, 0.06, 0.02) * fall * (0.5 + 0.5 * m1);
  // Sand-coloured glow along the reveal front.
  col = mix(col, vec3(0.784, 0.549, 0.235), edge * 0.55);
  gl_FragColor = vec4(col, mask);
}
`;

export const FIELD_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec2 uRes;
uniform float uTime;
uniform float uReveal;
uniform float uSeed;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 uv = vUv;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = uv * asp * 1.4 + uSeed;
  vec2 w = vec2(snoise(p + uTime * 0.05), snoise(p + 4.3 - uTime * 0.04));
  float n = snoise(p * 1.2 + w * 1.4 + vec2(uTime * 0.03, 0.0));
  vec3 dark = uColor * 0.58;
  vec3 light = uColor * 1.02;
  vec3 col = mix(dark, light, smoothstep(-0.7, 0.9, n));
  // Faint strata lines, like wind-cut sand.
  float b = abs(fract(n * 3.0 + uv.y * 0.6) - 0.5);
  col += smoothstep(0.035, 0.0, b) * 0.035;
  // Darker foot where the text sits (keeps cream text above AA).
  col *= mix(0.62, 1.0, smoothstep(0.02, 0.55, uv.y));
  col += (hash(uv * uRes + fract(uTime)) - 0.5) * 0.03;
  // Liquid rise from the bottom while the panel opens.
  float f = uv.y * 0.72 + (snoise(uv * vec2(3.0, 2.0) + uSeed) * 0.5 + 0.5) * 0.28;
  float m = smoothstep(f, f + 0.06, uReveal * 1.12 - 0.04);
  gl_FragColor = vec4(col, m);
}
`;

export const DUNE_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
varying vec2 vUv;
${NOISE}
float ridge(float x, float k, float t){
  float base = 0.44 - k * 0.085;
  float amp = 0.045 + k * 0.03;
  float fr = 1.1 + k * 1.3;
  return base + amp * (snoise(vec2(x * fr + t * (0.012 + k * 0.01) + k * 9.0, k * 3.7)) * 0.75
                     + snoise(vec2(x * fr * 2.6 + k * 4.0, t * 0.02 + k)) * 0.25);
}
void main(){
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  float x = uv.x * asp * 0.55;
  // Dusk sky: deep at the top, sand-dark near the horizon, a low warm sun.
  vec3 top = vec3(0.13, 0.065, 0.04);
  vec3 hor = vec3(0.47, 0.25, 0.15);
  vec3 col = mix(hor, top, smoothstep(0.32, 1.0, uv.y));
  float sun = length((uv - vec2(0.5, 0.40)) * vec2(asp, 1.0));
  col += vec3(0.78, 0.55, 0.24) * 0.32 * exp(-sun * 4.0);
  // Heat shimmer on the horizon.
  float hz = snoise(vec2(uv.x * 30.0, uv.y * 60.0 - uTime * 0.8)) * 0.0025 * smoothstep(0.55, 0.38, uv.y);
  for (int i = 0; i < 5; i++) {
    float k = float(i) / 4.0;
    float h = ridge(x + hz, k, uTime);
    float h2 = ridge(x + hz + 0.004, k, uTime);
    float slope = (h2 - h) / 0.004;
    float dep = max(h - uv.y, 0.0);
    vec3 back = vec3(0.66, 0.42, 0.24);
    vec3 front = vec3(0.40, 0.20, 0.11);
    vec3 lc = mix(back, front, k);
    // Wind-facing slopes catch the low sun near the crest; shade deepens below it.
    float lit = clamp(slope * 0.45, -0.25, 0.3) * (1.0 - smoothstep(0.0, 0.16, dep));
    lc *= 1.0 + lit;
    lc *= 1.0 - smoothstep(0.0, 0.28, dep) * 0.22;
    lc += vec3(0.85, 0.6, 0.3) * exp(-dep * 140.0) * 0.10 * (1.0 - k * 0.5);
    // Ripple texture on the sand.
    lc *= 1.0 + snoise(vec2(x * 40.0 + k * 3.0, (uv.y - h) * 260.0 + x * 30.0)) * 0.025;
    // Haze between layers.
    lc = mix(lc, hor, (1.0 - k) * 0.25);
    float m = smoothstep(h + 0.0025, h - 0.0025, uv.y);
    col = mix(col, lc, m);
  }
  col += (hash(uv * uRes + fract(uTime * 0.5)) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}
`;
