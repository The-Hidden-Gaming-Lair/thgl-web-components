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

export const tileFS = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform int u_filterMode; // 0 none, 1 greyscale
uniform int u_cb_mode; // 0 none, 1 prot, 2 deut, 3 trit, 4 achro
uniform float u_cb_sev; // 0..1
uniform float u_alpha; // cross-fade
in vec2 v_uv;
out vec4 outColor;

vec3 simulateCB(vec3 rgb, int mode){
  if(mode==1){ // protanopia
    mat3 M = mat3(0.56667, 0.43333, 0.0,
                  0.55833, 0.44167, 0.0,
                  0.0,     0.24167, 0.75833);
    return M * rgb;
  } else if(mode==2){ // deuteranopia
    mat3 M = mat3(0.625,  0.375,  0.0,
                  0.7,    0.3,    0.0,
                  0.0,    0.3,    0.7);
    return M * rgb;
  } else if(mode==3){ // tritanopia
    mat3 M = mat3(0.95,  0.05,   0.0,
                  0.0,   0.433,  0.567,
                  0.0,   0.475,  0.525);
    return M * rgb;
  } else if(mode==4){ // achromatopsia
    float g = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    return vec3(g);
  }
  return rgb;
}

void main(){
  vec4 c = texture(u_tex, v_uv);
  if(u_filterMode == 1){
    float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    c = vec4(vec3(g), c.a);
  }
  if(u_cb_mode != 0){
    vec3 sim = simulateCB(c.rgb, u_cb_mode);
    c.rgb = mix(c.rgb, sim, clamp(u_cb_sev, 0.0, 1.0));
  }
  outColor = vec4(c.rgb, c.a * u_alpha);
}
`;
