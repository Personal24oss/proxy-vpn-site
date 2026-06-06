const proxyLink = "tg://proxy?server=186.246.3.238&port=8443&secret=70fb81f7a310a1709a951029300633a2";

const copyButton = document.getElementById("copyProxy");
const toast = document.getElementById("toast");

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(proxyLink);
    showToast("Ссылка скопирована");
  } catch {
    showToast("Скопируйте ссылку вручную");
  }
});

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2200);
}

const canvas = document.getElementById("networkCanvas");
const context = canvas?.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let width = 0;
let height = 0;
let nodes = [];
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
  createNodes();
}

function createNodes() {
  const count = Math.max(34, Math.min(74, Math.floor((width * height) / 18000)));
  nodes = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.32,
    vy: (Math.random() - 0.5) * 0.32,
    size: index % 6 === 0 ? 3 : 2,
  }));
}

function drawNetwork() {
  if (!context || prefersReducedMotion.matches) return;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.55)";

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
      if (distance < 150) {
        const opacity = (1 - distance / 150) * 0.16;
        context.strokeStyle = `rgba(117, 226, 255, ${opacity})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }
  }

  animationFrame = window.requestAnimationFrame(drawNetwork);
}

if (canvas && context && !prefersReducedMotion.matches) {
  resizeCanvas();
  drawNetwork();
  window.addEventListener("resize", resizeCanvas, { passive: true });
}

prefersReducedMotion.addEventListener("change", () => {
  window.cancelAnimationFrame(animationFrame);
  if (!prefersReducedMotion.matches) {
    resizeCanvas();
    drawNetwork();
  }
});
