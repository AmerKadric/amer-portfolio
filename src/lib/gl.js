// A tiny WebGL2 renderer for the panorama: textured, vertex-coloured meshes with
// linear fog, alpha cutout and a gradient sky. That's all the scene needs, so this
// replaces three.js (~120 KB compressed) with a few KB.
//
// Colours follow the usual convention: textures and hex colours are sRGB, maths
// happens in linear space, and the result is converted back to sRGB on output.

const MESH_VERT = `#version 300 es
in vec3 position;
in vec2 uv;
in vec3 color;
uniform mat4 proj;
uniform mat4 view;
uniform vec3 offset;
uniform vec4 uvTransform; // xy: scale, zw: offset
out vec2 vUv;
out vec3 vColor;
out float vDepth;
void main() {
  vec4 mv = view * vec4(position + offset, 1.0);
  vDepth = -mv.z;
  vUv = uv * uvTransform.xy + uvTransform.zw;
  vColor = color;
  gl_Position = proj * mv;
}`

const MESH_FRAG = `#version 300 es
precision mediump float;
in vec2 vUv;
in vec3 vColor;
in float vDepth;
uniform sampler2D map;
uniform bool useMap;
uniform vec3 tint;
uniform float opacity;
uniform float alphaTest;
uniform vec3 ambient; // overall light level (day/night); 1 = full daylight
uniform bool useFog;
uniform vec3 fogColor;
uniform vec2 fogRange;
out vec4 outColor;
vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec4 t = useMap ? texture(map, vUv) : vec4(1.0);
  if (t.a < alphaTest) discard;
  vec3 c = toLinear(t.rgb) * vColor * tint * ambient;
  if (useFog) c = mix(c, fogColor, smoothstep(fogRange.x, fogRange.y, vDepth));
  outColor = vec4(toSRGB(c), t.a * opacity);
}`

// Full-screen vertical gradient, drawn behind everything
const SKY_VERT = `#version 300 es
in vec2 corner;
out float vY;
void main() {
  vY = corner.y * 0.5 + 0.5;
  gl_Position = vec4(corner, 0.0, 1.0);
}`

const SKY_FRAG = `#version 300 es
precision mediump float;
in float vY;
uniform vec3 top;
uniform vec3 mid;
uniform vec3 horizon;
out vec4 outColor;
void main() {
  float t = 1.0 - vY; // 0 at the top of the screen
  vec3 c = t < 0.55 ? mix(top, mid, t / 0.55) : mix(mid, horizon, (t - 0.55) / 0.45);
  outColor = vec4(c, 1.0);
}`

// '#rrggbb' → [r, g, b] in 0–1 (sRGB), optionally converted to linear
export function hexColor(hex, linear = false) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
  return linear ? c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) : c
}

function program(gl, vertSrc, fragSrc) {
  const compile = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
    return s
  }
  const p = gl.createProgram()
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vertSrc))
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p))
  const uniforms = new Proxy({}, { get: (cache, name) => (cache[name] ??= gl.getUniformLocation(p, name)) })
  return { p, uniforms, attrib: (name) => gl.getAttribLocation(p, name) }
}

// Perspective projection (column-major), vertical field of view in degrees
function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan((fov * Math.PI) / 360)
  const nf = 1 / (near - far)
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0])
}

// View matrix for a camera at `pos` turned by yaw (around Y) then pitch (around X)
function viewMatrix([px, py, pz], yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
  // Camera rotation R = Ry(yaw) · Rx(pitch); the view matrix is its inverse
  const R = [
    [cy, sy * sp, sy * cp],
    [0, cp, -sp],
    [-sy, cy * sp, cy * cp],
  ]
  const m = new Float32Array(16)
  // Column-major: entry (row, col) of Rᵀ is R[col][row]
  for (let col = 0; col < 3; col++) for (let row = 0; row < 3; row++) m[col * 4 + row] = R[col][row]
  for (let row = 0; row < 3; row++) m[12 + row] = -(R[0][row] * px + R[1][row] * py + R[2][row] * pz)
  m[15] = 1
  return m
}

export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' })
  if (!gl) return null

  const mesh = program(gl, MESH_VERT, MESH_FRAG)
  const sky = program(gl, SKY_VERT, SKY_FRAG)
  const owned = { buffers: [], textures: [], vaos: [] }
  const meshes = new Set()

  const skyVao = gl.createVertexArray()
  gl.bindVertexArray(skyVao)
  const skyBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(sky.attrib('corner'))
  gl.vertexAttribPointer(sky.attrib('corner'), 2, gl.FLOAT, false, 0, 0)
  owned.buffers.push(skyBuf)
  owned.vaos.push(skyVao)

  return {
    // Pixel-art texture from a canvas: crisp up close, mipmapped in the distance.
    // (No anisotropic filtering: on some drivers it smooths textures up close too.)
    texture(source, { repeat = false } = {}) {
      const t = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR)
      const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)
      owned.textures.push(t)
      return t
    },

    // Upload geometry: { pos, col, idx } and optionally uv. `lines` draws idx as line pairs;
    // `dynamic` meshes can have their positions replaced every frame (updateMesh).
    mesh({ pos, uv, col, idx }, { lines = false, dynamic = false } = {}) {
      const bufs = {}
      const vao = gl.createVertexArray()
      gl.bindVertexArray(vao)
      const attr = (name, data, size) => {
        const loc = mesh.attrib(name)
        if (loc < 0) return
        if (!data) {
          gl.disableVertexAttribArray(loc)
          return
        }
        const b = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, b)
        gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW)
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
        bufs[name] = b
      }
      attr('position', pos, 3)
      attr('uv', uv, 2)
      attr('color', col, 3)
      const ib = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
      bufs.idx = ib
      gl.bindVertexArray(null)
      // Missing attributes read a constant instead: white vertex colour, zero uv
      const m = { vao, bufs, count: idx.length, constUv: !uv, constCol: !col, lines }
      meshes.add(m)
      return m
    },

    // Replace a dynamic mesh's vertex positions (same vertex count)
    updateMesh(m, pos) {
      gl.bindBuffer(gl.ARRAY_BUFFER, m.bufs.position)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos)
    },

    // Free a mesh's GPU memory (e.g. when a chunk of the world is rebuilt)
    deleteMesh(m) {
      if (!meshes.delete(m)) return
      Object.values(m.bufs).forEach((b) => gl.deleteBuffer(b))
      gl.deleteVertexArray(m.vao)
    },

    setSize(width, height, ratio) {
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
    },

    // scene: { sky: [top, mid, horizon] (sRGB 0–1), fog: { color (linear), near, far }, ambient?, items: [...] }
    // camera: { fov, near, far, position, yaw, pitch }
    render(scene, camera) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.BLEND)
      gl.useProgram(sky.p)
      gl.uniform3fv(sky.uniforms.top, scene.sky[0])
      gl.uniform3fv(sky.uniforms.mid, scene.sky[1])
      gl.uniform3fv(sky.uniforms.horizon, scene.sky[2])
      gl.bindVertexArray(skyVao)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      gl.clear(gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LEQUAL)
      gl.useProgram(mesh.p)
      const u = mesh.uniforms
      gl.uniformMatrix4fv(u.proj, false, perspective(camera.fov, canvas.width / canvas.height, camera.near, camera.far))
      gl.uniformMatrix4fv(u.view, false, viewMatrix(camera.position, camera.yaw, camera.pitch))
      const ambient = scene.ambient ?? [1, 1, 1]
      gl.uniform3fv(u.fogColor, scene.fog.color)
      gl.uniform2f(u.fogRange, scene.fog.near, scene.fog.far)
      gl.uniform1i(u.map, 0)
      gl.activeTexture(gl.TEXTURE0)

      for (const item of scene.items) {
        if (item.cull === false) gl.disable(gl.CULL_FACE)
        else gl.enable(gl.CULL_FACE)
        if (item.blend) {
          gl.enable(gl.BLEND)
          gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        } else gl.disable(gl.BLEND)
        gl.uniform1i(u.useMap, item.map ? 1 : 0)
        if (item.map) gl.bindTexture(gl.TEXTURE_2D, item.map)
        gl.uniform3fv(u.tint, item.tint ?? [1, 1, 1])
        gl.uniform3fv(u.ambient, item.glow ? [1, 1, 1] : ambient)
        gl.uniform1f(u.opacity, item.opacity ?? 1)
        gl.uniform1f(u.alphaTest, item.alphaTest ?? 0)
        gl.uniform1i(u.useFog, item.fog === false ? 0 : 1)
        gl.depthMask(item.depthWrite !== false)
        gl.uniform3fv(u.offset, item.offset ?? [0, 0, 0])
        gl.uniform4fv(u.uvTransform, item.uvTransform ?? [1, 1, 0, 0])
        gl.bindVertexArray(item.mesh.vao)
        if (item.mesh.constUv) gl.vertexAttrib2f(mesh.attrib('uv'), 0, 0)
        if (item.mesh.constCol) gl.vertexAttrib3f(mesh.attrib('color'), 1, 1, 1)
        gl.drawElements(item.mesh.lines ? gl.LINES : gl.TRIANGLES, item.mesh.count, gl.UNSIGNED_INT, 0)
      }
      gl.depthMask(true)
      gl.bindVertexArray(null)
    },

    dispose() {
      ;[...meshes].forEach((m) => this.deleteMesh(m))
      owned.buffers.forEach((b) => gl.deleteBuffer(b))
      owned.textures.forEach((t) => gl.deleteTexture(t))
      owned.vaos.forEach((v) => gl.deleteVertexArray(v))
      gl.deleteProgram(mesh.p)
      gl.deleteProgram(sky.p)
    },
  }
}
