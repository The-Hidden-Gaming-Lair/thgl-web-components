// Removed unused quadVS and solidFS to reduce bundle

export const tileVS = `#version 300 es
in vec2 a_pos; // [0..1]
uniform vec2 u_px;   // tile top-left in pixels
uniform vec2 u_size; // tile size in px
uniform mat3 u_view;
out vec2 v_uv;
void main(){
  vec2 px = u_px + a_pos * u_size;
  vec3 p = u_view * vec3(px, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
  v_uv = a_pos;
}
`;

/**
 * Dark map transform, shared by the tile and image-overlay shaders.
 *
 * `u_darkMode`: 0 off, 1 invert lightness (light maps), 2 dim (maps that are
 * already dark). `u_dark` is the strength 0..1 (the user's "Dark Map" slider).
 *
 * Mode 1 inverts only the luma (Y of YIQ) and keeps the chroma, so a parchment
 * map turns dark slate while water stays blue and forests stay green - a plain
 * RGB inversion would turn them orange and purple. The inverted luma is run
 * through a curve that keeps the whole map dark: a plain 1-y sends mid-dark
 * water (y~0.4) to a light blue brighter than anything else, so the range is
 * compressed (white -> 0.04, water -> ~0.37, dark roads/labels -> ~0.57) and
 * the chroma is eased a little so the remaining colours don't glow.
 * Which mode applies is decided per layer from the loaded image's mean luma
 * (see utils/tile-tone.ts): inverting an already-dark map would make it glare.
 */
export const darkMapGLSL = `
uniform int u_darkMode; // 0 off, 1 invert lightness, 2 dim
uniform float u_dark;   // strength 0..1

vec3 darkMap(vec3 rgb, int mode, float k){
  if(mode == 1){
    float y = dot(rgb, vec3(0.299, 0.587, 0.114));
    float i = dot(rgb, vec3(0.596, -0.274, -0.322)) * 0.85;
    float q = dot(rgb, vec3(0.211, -0.523, 0.312)) * 0.85;
    float y2 = 0.04 + pow(1.0 - y, 1.4) * 0.72;
    vec3 inv = vec3(y2 + 0.956 * i + 0.621 * q,
                    y2 - 0.272 * i - 0.647 * q,
                    y2 - 1.106 * i + 1.703 * q);
    return mix(rgb, clamp(inv, 0.0, 1.0), k);
  }
  if(mode == 2){
    return rgb * mix(1.0, 0.45, k);
  }
  return rgb;
}
`;

export const tileFS = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
// 0 none; 1 "greyscale" and 2 "colorful" are the in-game overlay transparency
// modes: dark map pixels become see-through so the game shows behind, bright
// pixels stay at 70% (greyed in mode 1). Restored from the Leaflet canvas layer.
uniform int u_filterMode;
uniform int u_cb_mode; // 0 none, 1 prot, 2 deut, 3 trit, 4 achro
uniform float u_cb_sev; // 0..1
uniform float u_alpha; // cross-fade
${darkMapGLSL}
in vec2 v_uv;
out vec4 outColor;

vec3 simulateCB(vec3 rgb, int mode){
  // Note: mat3() fills by columns, so we use rgb * M (row vector * matrix)
  // to get the same result as the CPU version which does M * rgb (matrix * column vector)
  if(mode==1){ // protanopia
    mat3 M = mat3(0.56667, 0.43333, 0.0,
                  0.55833, 0.44167, 0.0,
                  0.0,     0.24167, 0.75833);
    return rgb * M;
  } else if(mode==2){ // deuteranopia
    mat3 M = mat3(0.625,  0.375,  0.0,
                  0.7,    0.3,    0.0,
                  0.0,    0.3,    0.7);
    return rgb * M;
  } else if(mode==3){ // tritanopia
    mat3 M = mat3(0.95,  0.05,   0.0,
                  0.0,   0.433,  0.567,
                  0.0,   0.475,  0.525);
    return rgb * M;
  } else if(mode==4){ // achromatopsia
    float g = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    return vec3(g);
  }
  return rgb;
}

void main(){
  vec4 c = texture(u_tex, v_uv);
  int darkMode = u_darkMode;
  if(u_filterMode == 1 || u_filterMode == 2){
    // Threshold on the ORIGINAL luma (150/255): bright = keep at 180/255 alpha,
    // dark = transparent. Same numbers as the pre-WebGL canvas filter.
    float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    if(g >= 0.588){
      if(u_filterMode == 1) c.rgb = vec3(0.392);
      c.a *= 0.706;
    } else {
      c.a = 0.0;
    }
    // The kept pixels are the bright ones; inverting them would defeat the
    // threshold, so a dark map only dims here.
    if(darkMode == 1) darkMode = 2;
  }
  c.rgb = darkMap(c.rgb, darkMode, clamp(u_dark, 0.0, 1.0));
  if(u_cb_mode != 0){
    vec3 sim = simulateCB(c.rgb, u_cb_mode);
    c.rgb = mix(c.rgb, sim, clamp(u_cb_sev, 0.0, 1.0));
  }
  // u_alpha doubles as a brightness multiplier: for layered "backdrop" maps we
  // darken the reused parent tiles (rgb *= u_alpha) so the interior overlay reads
  // as the active floor. Applied to rgb (not alpha) so it works regardless of the
  // global blend state (tiles draw opaque; alpha blending is unreliable here).
  outColor = vec4(c.rgb * u_alpha, c.a);
}
`;
