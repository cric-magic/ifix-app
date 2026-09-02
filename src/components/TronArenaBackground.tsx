import { useEffect, useRef } from 'react'
import { theme } from 'antd'
import { useDevTools } from '../contexts/DevToolsContext'

// A WebGPU floor-grid shader (single triangle, fragment-shader raymarch)
// for AuthLayout's background, confined to the region below its content
// (see the top/height props). Renders on every theme, but the grid's own
// intensity is dialed down on Light — same additive-glow math everywhere,
// just less of it there, rather than being hidden entirely. Ported from a
// standalone three.js-labeled demo that was actually raw WebGPU (no
// three.js in the dependency graph),
// with several changes: the three hardcoded shader colors are now real
// theme tokens passed in as uniforms instead of baked into the WGSL
// source; every failure mode (no navigator.gpu, no adapter, a WGSL
// compile error) is now silent instead of showing a debug overlay — this
// is decorative chrome on a real login screen, not a shader-authoring
// tool; sizing/animation target this component's own box via
// ResizeObserver instead of assuming a fullscreen canvas pinned to
// innerWidth/innerHeight; the canvas renders with premultiplied alpha and
// the shader outputs real transparency for empty space, so it blends
// into whatever's behind it instead of painting an opaque black
// rectangle; and the camera's pitch is steeper than the original so the
// horizon sits near the top of this shorter box instead of at its
// center, keeping the grid dense instead of just a few oversized cells.

// Tokens come through in either form depending on how they were seeded —
// colorPrimary/colorWarning are literal hex in VARIANT_SEEDS, but
// colorBorderSecondary is computed at runtime (blendOverlay/ensureContrast
// in App.tsx) and comes out as an "rgb(r,g,b)" string — so this needs to
// handle both instead of assuming hex.
function parseColorFloat(input: string): [number, number, number] {
  if (input.startsWith('#')) {
    const h = input.replace('#', '')
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ]
  }
  const match = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (match) {
    return [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255]
  }
  return [1, 1, 1]
}

const SHADER_CODE = /* wgsl */`
  struct Uniforms {
    data: vec4<f32>,       // x: time, y: resX, z: resY, w: gridIntensity
    gridColor: vec4<f32>,  // xyz: color, w: unused
    path1Color: vec4<f32>,
    path2Color: vec4<f32>,
  };
  @group(0) @binding(0) var<uniform> u: Uniforms;

  @vertex
  fn vs_main(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 3>(
      vec2<f32>(-1.0, -1.0),
      vec2<f32>( 3.0, -1.0),
      vec2<f32>(-1.0,  3.0)
    );
    return vec4<f32>(pos[idx], 0.0, 1.0);
  }

  fn gridGlow(coord: f32, cell: f32, width: f32) -> f32 {
    let d = abs(fract(coord / cell) - 0.5) * cell;
    return 1.0 - smoothstep(0.0, width, d);
  }

  fn segDH(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    let pa = p - a;
    let ba = b - a;
    let h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    let d = length(pa - ba * h);
    return vec2<f32>(d, h);
  }

  fn openPathField(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>, c: vec2<f32>, d: vec2<f32>) -> vec2<f32> {
    let lab = length(b - a);
    let lbc = length(c - b);
    let lcd = length(d - c);

    var best = 1e9;
    var bestArc = 0.0;
    var acc = 0.0;

    var r = segDH(p, a, b);
    if (r.x < best) { best = r.x; bestArc = acc + r.y * lab; }
    acc += lab;

    r = segDH(p, b, c);
    if (r.x < best) { best = r.x; bestArc = acc + r.y * lbc; }
    acc += lbc;

    r = segDH(p, c, d);
    if (r.x < best) { best = r.x; bestArc = acc + r.y * lcd; }
    acc += lcd;

    return vec2<f32>(best, bestArc);
  }

  fn rand(seed: f32) -> f32 {
    return fract(sin(seed * 12.9898) * 43758.5453123);
  }

  fn pathGlow(p: vec2<f32>, time: f32, cycleDuration: f32, laneSeed: f32, lineWidth: f32) -> vec2<f32> {
    let cycleIndex = floor(time / cycleDuration);
    let cycleStart = cycleIndex * cycleDuration;

    let seed = cycleIndex * 13.7 + laneSeed * 91.3;
    let r1 = rand(seed + 0.10);
    let r2 = rand(seed + 0.21);
    let r3 = rand(seed + 0.32);
    let r4 = rand(seed + 0.43);
    let r5 = rand(seed + 0.54);

    // Wide enough that paths regularly start (and their turns can exit)
    // beyond the visible frustum width, not just within it — reads as
    // beams passing through the scene rather than always spawning
    // in-frame.
    let xStart = -19.0 + 2.0 * floor(r1 * 19.0);
    let len1 = 4.0 + 2.0 * floor(r2 * 3.0);
    let turnDir = select(-1.0, 1.0, r3 > 0.5);
    let len2 = 2.0 + 2.0 * floor(r4 * 3.0);
    let len3 = 4.0 + 2.0 * floor(r5 * 3.0);

    let a = vec2<f32>(xStart, -3.0);
    let b = a + vec2<f32>(0.0, len1);
    let c = b + vec2<f32>(turnDir * len2, 0.0);
    let d = c + vec2<f32>(0.0, len3);

    let total = length(b - a) + length(c - b) + length(d - c);
    let fld = openPathField(p, a, b, c, d);
    let dist = fld.x;
    let arc = fld.y;

    let laneMaskRaw = 1.0 - smoothstep(0.0, lineWidth, dist);

    let phase = clamp((time - cycleStart) / cycleDuration, 0.0, 1.0);
    let head = phase * total;
    let diff = head - arc;
    let trailLen = 4.5;
    var pulse = 0.0;
    if (diff >= 0.0) {
      pulse = smoothstep(trailLen, 0.0, diff);
    }
    let edgeFade = smoothstep(0.0, 0.04, phase) * (1.0 - smoothstep(0.94, 1.0, phase));
    let laneMask = laneMaskRaw * edgeFade;

    return vec2<f32>(laneMask, pulse);
  }

  @fragment
  fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    let res = u.data.yz;
    let time = u.data.x;

    var uv = (fragCoord.xy / res) * 2.0 - vec2<f32>(1.0, 1.0);
    uv.x *= res.x / res.y;
    uv.y = -uv.y;

    let camPos = vec3<f32>(0.0, 1.7, -6.0);
    // This box only ever covers the region below the caller's content
    // (see the component's clipTop prop), not the full page — pitching
    // the look-down angle steeper puts the horizon near the TOP of that
    // shorter box instead of at its vertical center, so the grid fills
    // almost the whole visible area with many converging lines instead
    // of just the few oversized cells nearest the camera.
    let rayDir = normalize(vec3<f32>(uv.x, uv.y * 0.82 - 0.70, 1.0));

    var col = vec3<f32>(0.0, 0.0, 0.0);

    let tFloorRaw = -camPos.y / rayDir.y;
    let hit = camPos + rayDir * tFloorRaw;
    let p = vec2<f32>(hit.x, hit.z);

    let pixWorld = max(fwidth(p.x), fwidth(p.y));
    let lineW = pixWorld * 1.5;

    let gridSize = 2.0;

    if (rayDir.y < -0.0005 && tFloorRaw > 0.0 && tFloorRaw < 1e8) {
      let dist = tFloorRaw;
      let fog = exp(-dist * 0.018);

      let g = max(gridGlow(p.x, gridSize, lineW), gridGlow(p.y, gridSize, lineW));
      col += g * u.gridColor.xyz * fog * u.data.w;

      let f1 = pathGlow(p, time, 5.5, 0.0, lineW);
      let f2 = pathGlow(p, time, 4.5, 1.0, lineW);

      var pathCol = vec3<f32>(0.0);
      pathCol += f1.x * f1.y * u.path1Color.xyz * 2.6;
      pathCol += f2.x * f2.y * u.path2Color.xyz * 2.6;

      col += pathCol * fog;

      let farFade = 1.0 - smoothstep(22.0, 55.0, dist);
      col *= farFade;
    }

    let ndc = (fragCoord.xy / res) * 2.0 - vec2<f32>(1.0, 1.0);
    let vig = 1.0 - smoothstep(0.5, 1.1, length(ndc));
    col *= vig;

    // Alpha tracks raw (pre-tonemap) intensity — empty space stays fully
    // transparent so the page's own gradient shows through underneath,
    // and only the grid lines/glow are actually opaque. Canvas is
    // configured alphaMode: 'premultiplied' below, so the RGB output here
    // must already be multiplied by alpha.
    let alpha = clamp(max(max(col.r, col.g), col.b) * 1.6, 0.0, 1.0);

    col = col / (col + vec3<f32>(1.0));
    col = pow(col, vec3<f32>(1.0 / 2.2));

    return vec4<f32>(col * alpha, alpha);
  }
`

interface Props {
  // px from the top of the positioned ancestor where the canvas's own box
  // starts — the scene only ever appears below the caller's own content
  // (a sign-in form, say), never behind it, because the canvas doesn't
  // extend above this point at all.
  top: number
  // Explicit px height for that box. Passed instead of relying on
  // `bottom: 0` because the positioned ancestor only sets minHeight, not
  // height — an absolutely positioned box with both top and bottom set
  // needs a definite containing-block height to resolve sanely, which
  // minHeight alone doesn't provide.
  height: number
}

export function TronArenaBackground({ top, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { token } = theme.useToken()
  const { themeVariant } = useDevTools()
  // Light keeps the grid dimmer — the same colorPrimary tint reads as too
  // prominent against a light surface at the Neutral/Bluish intensity, so
  // it's a lower multiplier there rather than a different color or being
  // hidden outright.
  const gridIntensity = themeVariant === 'light' ? 0.08 : themeVariant === 'blue' ? 0.2 : 0.35
  // Read by the running frame loop's closure on every frame — mutating
  // these on theme change repaints with the new values immediately, no
  // need to tear down and recreate the whole WebGPU context.
  const colorsRef = useRef({
    grid: parseColorFloat(token.colorPrimary),
    path1: parseColorFloat(token.colorPrimary),
    path2: parseColorFloat(token.colorWarning),
    gridIntensity,
  })
  colorsRef.current = {
    grid: parseColorFloat(token.colorPrimary),
    path1: parseColorFloat(token.colorPrimary),
    path2: parseColorFloat(token.colorWarning),
    gridIntensity,
  }
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!navigator.gpu) return

    let cancelled = false
    let rafId = 0
    let device: GPUDevice | null = null
    let resizeObserver: ResizeObserver | null = null

    async function setup() {
      const adapter = await navigator.gpu!.requestAdapter()
      if (!adapter || cancelled) return
      const dev = await adapter.requestDevice()
      if (cancelled) { dev.destroy(); return }
      device = dev

      const context = canvas!.getContext('webgpu')
      if (!context) return
      const format = navigator.gpu!.getPreferredCanvasFormat()

      function resize() {
        const rect = canvas!.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas!.width = Math.max(1, Math.floor(rect.width * dpr))
        canvas!.height = Math.max(1, Math.floor(rect.height * dpr))
        context!.configure({ device: dev, format, alphaMode: 'premultiplied' })
      }
      resize()
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas!)

      dev.pushErrorScope('validation')
      const module = dev.createShaderModule({ code: SHADER_CODE })
      const info = await module.getCompilationInfo()
      if (info.messages.some(m => m.type === 'error')) { await dev.popErrorScope(); return }

      const pipeline = dev.createRenderPipeline({
        layout: 'auto',
        vertex: { module, entryPoint: 'vs_main' },
        fragment: { module, entryPoint: 'fs_main', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      })
      const scopeError = await dev.popErrorScope()
      if (scopeError || cancelled) return

      const uniformBuffer = dev.createBuffer({
        size: 64, // 4 vec4<f32>s: time/res/gridIntensity, gridColor, path1Color, path2Color
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
      const bindGroup = dev.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      })

      const uniformData = new Float32Array(16)
      const start = performance.now()
      let visible = !document.hidden

      function onVisibility() {
        visible = !document.hidden
        if (visible) rafId = requestAnimationFrame(frame)
      }
      document.addEventListener('visibilitychange', onVisibility)

      function frame() {
        if (cancelled || !visible) return
        const t = (performance.now() - start) / 1000
        const { grid, path1, path2, gridIntensity } = colorsRef.current
        uniformData.set([t, canvas!.width, canvas!.height, gridIntensity], 0)
        uniformData.set([...grid, 0], 4)
        uniformData.set([...path1, 0], 8)
        uniformData.set([...path2, 0], 12)
        dev.queue.writeBuffer(uniformBuffer, 0, uniformData)

        const encoder = dev.createCommandEncoder()
        const view = context!.getCurrentTexture().createView()
        const pass = encoder.beginRenderPass({
          colorAttachments: [{ view, clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: 'clear', storeOp: 'store' }],
        })
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.draw(3)
        pass.end()
        dev.queue.submit([encoder.finish()])

        rafId = requestAnimationFrame(frame)
      }
      rafId = requestAnimationFrame(frame)

      return () => document.removeEventListener('visibilitychange', onVisibility)
    }

    let cleanupVisibility: (() => void) | undefined
    setup().then(fn => { cleanupVisibility = fn }).catch(() => {
      // Any WebGPU failure (adapter/device/shader/pipeline) is silent —
      // this is decorative background chrome on a real login screen, not
      // a shader-authoring tool. The plain gradient behind it already
      // covers this case visually.
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
      cleanupVisibility?.()
      device?.destroy()
    }
  }, [])

  // The canvas's own box starts at clipTop and runs to the bottom, rather
  // than covering the full container and masking the top away — cropping
  // a full-height render post-hoc would only ever show whatever thin,
  // oversized-cell sliver near the camera happened to fall below clipTop.
  // Sizing the box itself to just this region means the shader's whole
  // vertical field of view (see the rayDir pitch above) maps into it, so
  // it reads as a real horizon-to-foreground grid, not a cropped fragment
  // of a bigger one.
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top,
        left: 0,
        width: '100%',
        height,
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  )
}
