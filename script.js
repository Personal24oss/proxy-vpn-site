const toast = document.getElementById("toast");

document.addEventListener("click", async (event) => {
  const guideButton = event.target.closest("[data-guide-toggle]");
  if (guideButton) {
    toggleGuide(guideButton);
    return;
  }

  const button = event.target.closest("[data-copy]");
  if (!button) return;

  const value = button.getAttribute("data-copy");
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value);
    showToast("Ссылка скопирована");
  } catch {
    showToast("Скопируйте ссылку вручную");
  }
});

function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2200);
}

function toggleGuide(button) {
  const guideId = button.getAttribute("data-guide-toggle");
  const guide = guideId ? document.getElementById(guideId) : null;
  if (!guide) return;

  const shouldOpen = guide.hidden;

  document.querySelectorAll("[data-guide-toggle]").forEach((otherButton) => {
    const otherGuide = document.getElementById(otherButton.getAttribute("data-guide-toggle"));
    if (!otherGuide) return;
    otherGuide.hidden = true;
    otherGuide.closest(".vpn-card")?.classList.remove("guide-open");
    otherButton.setAttribute("aria-expanded", "false");
    otherButton.textContent = "Посмотреть инструкцию";
  });

  guide.hidden = !shouldOpen;
  guide.closest(".vpn-card")?.classList.toggle("guide-open", shouldOpen);
  button.setAttribute("aria-expanded", String(shouldOpen));
  button.textContent = shouldOpen ? "Скрыть инструкцию" : "Посмотреть инструкцию";

  if (shouldOpen) {
    window.requestAnimationFrame(() => {
      guide.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

const canvas = document.getElementById("networkCanvas");
const context = canvas?.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let width = 0;
let height = 0;
let nodes = [];
let packets = [];
let animationFrame = 0;

function resizeCanvas() {
  if (!canvas || !context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  createScene();
}

function createScene() {
  const nodeCount = Math.max(28, Math.min(66, Math.floor((width * height) / 21000)));
  nodes = Array.from({ length: nodeCount }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.24,
    vy: (Math.random() - 0.5) * 0.24,
    size: index % 7 === 0 ? 3 : 2,
  }));

  packets = Array.from({ length: 7 }, (_, index) => ({
    offset: index / 7,
    speed: 0.0015 + Math.random() * 0.0011,
    lane: index % 3,
  }));
}

function drawScene() {
  if (!context || prefersReducedMotion.matches) return;
  context.clearRect(0, 0, width, height);
  drawRoutes();
  drawNodes();
  animationFrame = window.requestAnimationFrame(drawScene);
}

function drawRoutes() {
  const lanes = [
    [width * 0.08, height * 0.64, width * 0.46, height * 0.22, width * 0.92, height * 0.36],
    [width * 0.02, height * 0.38, width * 0.42, height * 0.52, width * 0.98, height * 0.2],
    [width * 0.16, height * 0.82, width * 0.56, height * 0.72, width * 0.9, height * 0.82],
  ];

  context.lineWidth = 1;
  for (const lane of lanes) {
    const gradient = context.createLinearGradient(lane[0], lane[1], lane[4], lane[5]);
    gradient.addColorStop(0, "rgba(255, 53, 86, 0.04)");
    gradient.addColorStop(0.45, "rgba(40, 215, 255, 0.18)");
    gradient.addColorStop(1, "rgba(66, 230, 141, 0.05)");
    context.strokeStyle = gradient;
    context.beginPath();
    context.moveTo(lane[0], lane[1]);
    context.quadraticCurveTo(lane[2], lane[3], lane[4], lane[5]);
    context.stroke();
  }

  for (const packet of packets) {
    packet.offset = (packet.offset + packet.speed) % 1;
    const lane = lanes[packet.lane];
    const point = quadraticPoint(lane, packet.offset);
    context.fillStyle = packet.lane === 0 ? "rgba(255, 53, 86, 0.9)" : "rgba(40, 215, 255, 0.85)";
    context.beginPath();
    context.arc(point.x, point.y, 2.8, 0, Math.PI * 2);
    context.fill();
  }
}

function quadraticPoint(points, t) {
  const [x1, y1, cx, cy, x2, y2] = points;
  const inverse = 1 - t;
  return {
    x: inverse * inverse * x1 + 2 * inverse * t * cx + t * t * x2,
    y: inverse * inverse * y1 + 2 * inverse * t * cy + t * t * y2,
  };
}

function drawNodes() {
  context.fillStyle = "rgba(255,255,255,0.46)";

  for (const node of nodes) {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < -20) node.x = width + 20;
    if (node.x > width + 20) node.x = -20;
    if (node.y < -20) node.y = height + 20;
    if (node.y > height + 20) node.y = -20;

    context.beginPath();
    context.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    context.fill();
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 138) {
        const opacity = (1 - distance / 138) * 0.12;
        context.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }
  }
}

if (canvas && context && !prefersReducedMotion.matches) {
  resizeCanvas();
  drawScene();
  window.addEventListener("resize", resizeCanvas, { passive: true });
}

prefersReducedMotion.addEventListener("change", () => {
  window.cancelAnimationFrame(animationFrame);
  if (!prefersReducedMotion.matches) {
    resizeCanvas();
    drawScene();
  }
});
