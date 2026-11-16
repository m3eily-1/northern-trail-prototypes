// Procedural sandstone. An SVG tile (turbulence -> relief lighting -> colour)
// is rasterised once by the browser and tiled, so it costs nothing per frame.
// Horizontal strata come from an anisotropic noise frequency.

function tile({ size = 520, seed = 4, gain = [0.21, 0.135, 0.095], off = [0.012, 0.004, 0.0], relief = 5, elev = 38, freq = '0.013 0.028', blot = 0.5 }) {
  const m = [`${gain[0]} 0 0 0 ${off[0]}`, `${gain[1]} 0 0 0 ${off[1]}`, `${gain[2]} 0 0 0 ${off[2]}`, '0 0 0 0 1'].join(' ');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
<filter id='r' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
<feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='5' seed='${seed}' stitchTiles='stitch' result='n'/>
<feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' seed='${seed + 5}' stitchTiles='stitch' result='g'/>
<feComposite in='n' in2='g' operator='arithmetic' k1='0' k2='0.82' k3='0.3' k4='-0.06' result='h'/>
<feDiffuseLighting in='h' surfaceScale='${relief}' diffuseConstant='1' lighting-color='#fff' result='lit'><feDistantLight azimuth='225' elevation='${elev}'/></feDiffuseLighting>
<feColorMatrix in='lit' type='matrix' values='${m}' result='col'/>
<feTurbulence type='fractalNoise' baseFrequency='0.0058 0.0096' numOctaves='3' seed='${seed + 9}' stitchTiles='stitch' result='b'/>
<feColorMatrix in='b' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.6 -1.05' result='bm'/>
<feFlood flood-color='#080402' flood-opacity='${blot}'/>
<feComposite in2='bm' operator='in' result='dark'/>
<feMerge><feMergeNode in='col'/><feMergeNode in='dark'/></feMerge>
</filter>
<rect width='100%' height='100%' filter='url(#r)'/>
</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, ''))}")`;
}

export function initRock() {
  const root = document.documentElement.style;
  // the cliff: dark varnished sandstone
  root.setProperty('--rock-tex', tile({ seed: 4 }));
  // tablets and markers: a paler, freshly split slab
  root.setProperty('--slab-tex', tile({ seed: 11, size: 400, gain: [0.2, 0.13, 0.09], off: [0.13, 0.075, 0.045], relief: 3, elev: 50, freq: '0.02 0.03', blot: 0.25 }));
  // panels recessed into the cliff: deeper and smoother
  root.setProperty('--recess-tex', tile({ seed: 21, size: 440, gain: [0.13, 0.085, 0.06], off: [0.01, 0.004, 0.0], relief: 2.5, elev: 44, freq: '0.018 0.03', blot: 0.35 }));
}
