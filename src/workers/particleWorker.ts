
interface Particle { x: number; y: number; speed: number; length: number; alpha: number; age: number; maxAge: number; }
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 800;
let height = 600;
let isRunning = false;
let animFrameId: number | null = null;
let windSpeed = 12.0;
let windDir = 165.0;
let isThrottled = false;
let particles: Particle[] = [];
const BASE_PARTICLE_COUNT = 240;

function initParticles() {
  const count = isThrottled ? Math.round(BASE_PARTICLE_COUNT * 0.45) : BASE_PARTICLE_COUNT;
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: (1.5 + Math.random() * 2.5) * (windSpeed / 12.0),
      length: 8 + Math.random() * 14,
      alpha: 0.15 + Math.random() * 0.45,
      age: Math.random() * 100,
      maxAge: 70 + Math.random() * 60
    });
  }
}

function render() {
  if (!ctx || !canvas || !isRunning) return;
  ctx.fillStyle = "rgba(3, 7, 18, 0.12)";
  ctx.fillRect(0, 0, width, height);
  const rad = ((windDir + 180) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.age++;
    if (p.age > p.maxAge || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.age = 0;
      p.speed = (1.5 + Math.random() * 2.5) * Math.max(0.4, windSpeed / 12.0);
    }
    const prevX = p.x;
    const prevY = p.y;
    p.x += cos * p.speed;
    p.y += sin * p.speed;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  animFrameId = requestAnimationFrame(render);
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data || {};
  switch (type) {
    case "init":
      if (payload?.canvas) {
        canvas = payload.canvas;
        ctx = canvas.getContext("2d");
        width = canvas.width || width;
        height = canvas.height || height;
        initParticles();
      }
      break;
    case "resize":
      if (payload?.width && payload?.height) {
        width = payload.width;
        height = payload.height;
        if (canvas) { canvas.width = width; canvas.height = height; }
        initParticles();
      }
      break;
    case "update":
      if (typeof payload?.windSpeedKmh === "number") windSpeed = payload.windSpeedKmh;
      if (typeof payload?.windDirDeg === "number") windDir = payload.windDirDeg;
      if (typeof payload?.throttle === "boolean" && payload.throttle !== isThrottled) {
        isThrottled = payload.throttle;
        initParticles();
      }
      break;
    case "start":
      if (!isRunning) { isRunning = true; render(); }
      break;
    case "stop":
      isRunning = false;
      if (animFrameId !== null) { cancelAnimationFrame(animFrameId); animFrameId = null; }
      if (ctx && canvas) { ctx.clearRect(0, 0, width, height); }
      break;
  }
};
