// Theme toggle
const themeToggle = document.getElementById("themeToggle");
const body = document.body;
const moonIcon = document.getElementById("moonIcon");
const sunIcon = document.getElementById("sunIcon");
const themeText = document.getElementById("themeText");

function setTheme(mode) {
  if (mode === "dark") {
    body.classList.add("dark-mode");
    moonIcon.classList.add("hidden");
    sunIcon.classList.remove("hidden");
    themeText.textContent = "Light Mode";
  } else {
    body.classList.remove("dark-mode");
    moonIcon.classList.remove("hidden");
    sunIcon.classList.add("hidden");
    themeText.textContent = "Dark Mode";
  }
}
if (localStorage.getItem("theme")) {
  setTheme(localStorage.getItem("theme"));
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  setTheme("dark");
}
themeToggle.addEventListener("click", () => {
  const mode = body.classList.contains("dark-mode") ? "light" : "dark";
  setTheme(mode);
  localStorage.setItem("theme", mode);
});



// Background animation
const canvas = document.getElementById("backgroundCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class FlowingLine {
  constructor(startY, direction, color) {
    this.startY = startY;
    this.direction = direction;
    this.color = color;
    this.points = [];
    this.numPoints = 80;
    this.speed = (Math.random() * 0.8 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
    this.amplitude = Math.random() * 120 + 60;
    this.frequency = Math.random() * 0.008 + 0.004;
    this.offset = Math.random() * 1000;
    this.thickness = Math.random() * 3 + 2;
    this.opacity = Math.random() * 0.35 + 0.25;
    for (let i = 0; i < this.numPoints; i++) {
      this.points.push({ x: (i / this.numPoints) * canvas.width, y: this.startY });
    }
  }
  update(time) {
    for (let i = 0; i < this.points.length; i++) {
      const x = (i / this.numPoints) * canvas.width;
      const wave1 = Math.sin(x * this.frequency + time * this.speed + this.offset) * this.amplitude;
      const wave2 = Math.cos(x * this.frequency * 1.5 + time * this.speed * 0.7 + this.offset) * (this.amplitude * 0.5);
      this.points[i].x = x;
      this.points[i].y = this.startY + (wave1 + wave2) * this.direction;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length - 1; i++) {
      const xc = (this.points[i].x + this.points[i + 1].x) / 2;
      const yc = (this.points[i].y + this.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
    }
    ctx.lineTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
    ctx.strokeStyle = this.color.replace("OPACITY", this.opacity);
    ctx.lineWidth = this.thickness;
    ctx.stroke();
  }
}

const lines = [];
const colors = [
  "rgba(255,117,24,OPACITY)",
  "rgba(0,68,204,OPACITY)",
  "rgba(51,153,255,OPACITY)",
];
for (let i = 0; i < 10; i++) {
  const startY = (canvas.height / (10 + 1)) * (i + 1);
  const direction = Math.random() > 0.5 ? 1 : -1;
  const color = colors[i % colors.length];
  lines.push(new FlowingLine(startY, direction, color));
}

let time = 0;
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  time += 0.01;
  lines.forEach((line) => {
    line.update(time);
    line.draw();
  });
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
