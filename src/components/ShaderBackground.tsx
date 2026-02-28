import { useEffect, useRef } from 'react';

const vertexShaderSource = `#version 300 es
in vec4 aPosition;
void main() {
  gl_Position = aPosition;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float uTime;
uniform vec2 uResolution;

mat2 rot2(in float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float hash21( vec2 p ){ 
  return fract(sin(dot(p, vec2(41, 289)))*45758.5453); 
}

vec2 hash22(vec2 p) { 
  float n = sin(dot(p, vec2(1, 113)));
  p = fract(vec2(262144, 32768)*n); 
  return sin(p*6.2831853 + uTime); 
    
}


float n2D(vec2 p) {
  vec2 i = floor(p); p -= i; p *= p*(3. - p*2.);  
  return dot(mat2(fract(sin(vec4(0, 1, 113, 114) + dot(i, vec2(1, 113)))*43758.5453))* vec2(1. - p.y, p.y), vec2(1. - p.x, p.x) );
}


float n2D3G( in vec2 p ){   
  vec2 i = floor(p); p -= i;
  vec4 v;
  v.x = dot(hash22(i), p);
  v.y = dot(hash22(i + vec2(1, 0)), p - vec2(1, 0));
  v.z = dot(hash22(i + vec2(0, 1)), p - vec2(0, 1));
  v.w = dot(hash22(i + 1.), p - 1.);
  p = p*p*p*(p*(p*6. - 15.) + 10.);
  return mix(mix(v.x, v.y, p.x), mix(v.z, v.w, p.x), p.y);
}

float map(vec3 p, float i){
  //return n2D3G(p.xy*3.)*.66 + n2D3G(p.xy*6.)*.34 + i/10.*1. - .15;
  return n2D3G(p.xy*3.)*.3 + n2D3G(p.xy*6.)*.35 + i/25.*1. - .05;
  // return n2D3G(p.xy*3.)*.14 + n2D3G(p.xy*3.)*.14 + i/30.*1. - .1;
}


vec3 getNormal(in vec3 p, float m, float i) {	
  vec2 e = vec2(.001, 0);
  return (vec3(m - map(p - e.xyy, i), m - map(p - e.yxy, i),	0.))/e.x*1.4142;
}


vec4 mapLayer(in vec3 p, float i){
  vec4 d;
  d.x = map(p, i);
  d.yzw = getNormal(p, d.x, i);
  return d;   
}

vec3 getCol(vec2 p, float sh, float fi, float sf){
  vec3 col;
  
  /*col = pow(min(vec3(1.5, 1, 1)*(sh*.35 + .6), 1.), vec3(1, 3, 16));
  if(fi==0.) col = vec3(.6, .2, .07);
  col = mix(col.xzy, col, sh*.5 + .5).zyx;*/

  // col = pow(min(vec3(1.5, 1, 1)*(sh*.25 + .4), 1.0), vec3(1, 2.4, 32));
  if(fi==0.) col = vec3(0.01, 0.01, 0.01);
  if(fi==1.) col = vec3(0.02, 0.02, 0.02);
  if(fi==2.) col = vec3(0.03, 0.03, 0.03);
  if(fi==3.) col = vec3(0.06, 0.04, 0.04);
  if(fi==4.) col = vec3(0.1, 0.05, 0.05);
  if(fi==5.) col = vec3(1, 0, 0);
  // col = mix(col.xzy, col, sh*.2 + .7).zyx;
  return col;
}
// Inspired by Shane - https://www.shadertoy.com/user/Shane
void main(){
  float res = min(uResolution.y, 700.);
  vec2 uv = (gl_FragCoord.xy - uResolution.xy*.5)/res;
  vec2 p = uv + vec2(0.1, 0.1)*uTime;


  float sf = 1./uResolution.y;
  vec3 col = getCol(p, 0., 0., sf);
  float pL = 0.;
  float hatch = 1.;
  
  const int lNum = 5;
  float flNum = float(lNum);
  
  
  for(int i = 0; i<lNum; i++){
    float fi = float(i);
    hatch = 1.;
    vec4 c = mapLayer(vec3(p, 1.), fi);
    vec4 cSh = mapLayer(vec3(p - vec2(.03, -.03)*((flNum - fi)/flNum*.5 + .5), 1.), fi);
    float sh = (fi + 1.)/(flNum);
    vec3 lCol = getCol(p, sh, fi + 1., sf);
    vec3 ld = normalize(vec3(-1, 1, -.25));
    vec3 n = normalize(vec3(0, 0, -1) + c.yzw);
    float diff = max(dot(ld, n), 0.);
    diff *= 2.;
    vec3 eCol = lCol*(diff + 1.);
    float sfL = sf*length(c.yzx)*2.;
    float sfLSh = sf*length(cSh.yzx)*6.;
    const float shF = .35;
    col = mix(col, vec3(0), (1. - smoothstep(0., sfLSh, max(cSh.x, pL)))*shF);
    col = mix(col, vec3(0), (1. - smoothstep(0., sfL*3., c.x))*.25);
    //outline
    // col = mix(col, vec3(0), (1. - smoothstep(0., sfL, c.x))*.1);
    // col = mix(col, eCol*hatch, (1. - smoothstep(0., sfL, c.x + length(c.yzx)*.003)));
    col = mix(col, lCol*hatch, (1. - smoothstep(0., sfL, c.x + length(c.yzx)*.006)));
    pL = c.x;
  }
  
  uv = gl_FragCoord.xy/uResolution.xy;
  col *= pow(16.*uv.x*uv.y*(1. - uv.x)*(1. - uv.y) , .0625);
  col = mix(col*vec3(.3, 0, 1), col, pow(16.*uv.x*uv.y*(1. - uv.x)*(1. - uv.y) , .125));
  fragColor = vec4(sqrt(max(col, 0.)), 1);
}
`;

//claude 3.7 sonnet
const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Make canvas fullscreen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize WebGL2
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // Create shader program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Look up attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
    const timeUniformLocation = gl.getUniformLocation(program, 'uTime');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'uResolution');

    // Create and bind position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Define a full-screen quad (two triangles)
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create and bind VAO
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Animation loop
    const startTime = performance.now();
    const render = (time: number) => {
      // Set viewport
      gl.viewport(0, 0, canvas.width, canvas.height);
      
      // Clear canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Use shader program
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      
      // Update uniforms
      gl.uniform1f(timeUniformLocation, (time - startTime)/10000);
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      
      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      // Request next frame
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteVertexArray(vao);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -2
      }}
    />
  );
};

// Helper functions
function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Failed to compile shader');
  }
  
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create program');
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error('Failed to link program');
  }
  
  return program;
}

export default ShaderBackground;