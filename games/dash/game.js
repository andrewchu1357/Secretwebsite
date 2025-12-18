const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ---------------- CONSTANTS ----------------
const PLAYER_SIZE = 36;
const GROUND_HEIGHT = 60;
const GRAVITY = 1;
const JUMP_FORCE = -17;
const UFO_FORCE = -9;

// FAST SPEED
let SPEED = 8;

// ---------------- GAME STATE ----------------
let state = "menu"; // menu | play | dead | complete
let levelIndex = 0;
let frame = 0;
let mode = "cube"; // cube | ufo

// ---------------- PLAYER ----------------
const player = {
  x: 150,
  y: 0,
  vy: 0,
  onGround: false
};

// ---------------- WORLD OBJECTS ----------------
let spikes = [];
let pads = [];
let portals = [];

// ---------------- LEVEL DATA ----------------
const levels = [
  {
    length: 1200,
    speed: 8,
    build: f => {
      if (f % 120 === 0) spawnSpike();
      if (f === 300) spawnPad();
      if (f === 500) spawnPortal("ufo");
    }
  },
  {
    length: 1500,
    speed: 10,
    build: f => {
      if (f % 100 === 0) spawnSpike();
      if (f % 250 === 0) spawnPad();
    }
  }
];

// ---------------- INPUT ----------------
window.addEventListener("keydown", e => {
  if (e.code === "Space") input();
});
window.addEventListener("mousedown", input);

function input() {
  if (state === "menu") startLevel(0);
  else if (state === "dead") startLevel(levelIndex);
  else if (state === "complete") startLevel(levelIndex + 1);
  else if (state === "play") {
    if (mode === "cube" && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
    }
    if (mode === "ufo") {
      player.vy = UFO_FORCE;
    }
  }
}

// ---------------- LEVEL CONTROL ----------------
function startLevel(index) {
  if (index >= levels.length) {
    state = "menu";
    return;
  }

  levelIndex = index;
  state = "play";
  frame = 0;
  mode = "cube";
  SPEED = levels[index].speed;

  player.y = canvas.height - GROUND_HEIGHT - PLAYER_SIZE;
  player.vy = 0;
  player.onGround = true;

  spikes = [];
  pads = [];
  portals = [];
}

// ---------------- SPAWNERS ----------------
function spawnSpike() {
  spikes.push({
    x: canvas.width,
    y: canvas.height - GROUND_HEIGHT - 40,
    w: 40,
    h: 40
  });
}

function spawnPad() {
  pads.push({
    x: canvas.width,
    y: canvas.height - GROUND_HEIGHT - 20,
    w: 40,
    h: 20
  });
}

function spawnPortal(type) {
  portals.push({
    x: canvas.width,
    y: canvas.height - GROUND_HEIGHT - 80,
    w: 30,
    h: 80,
    mode: type
  });
}

// ---------------- UPDATE ----------------
function update() {
  if (state !== "play") return;

  frame++;
  levels[levelIndex].build(frame);

  if (frame > levels[levelIndex].length) {
    state = "complete";
    return;
  }

  // Physics
  player.vy += GRAVITY;
  player.y += player.vy;
  player.onGround = false;

  const groundY = canvas.height - GROUND_HEIGHT;
  if (player.y + PLAYER_SIZE >= groundY) {
    player.y = groundY - PLAYER_SIZE;
    player.vy = 0;
    player.onGround = true;
  }

  // Move objects
  spikes.forEach(o => o.x -= SPEED);
  pads.forEach(o => o.x -= SPEED);
  portals.forEach(o => o.x -= SPEED);

  // Collisions
  spikes.forEach(o => {
    if (hit(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, o)) {
      state = "dead";
    }
  });

  pads.forEach(p => {
    if (hit(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, p)) {
      player.vy = JUMP_FORCE * 1.2;
    }
  });

  portals.forEach(p => {
    if (hit(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, p)) {
      mode = p.mode;
    }
  });

  // Cleanup
  spikes = spikes.filter(o => o.x + o.w > 0);
  pads = pads.filter(o => o.x + o.w > 0);
  portals = portals.filter(o => o.x + o.w > 0);
}

// ---------------- DRAW ----------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state === "menu") {
    drawText("NEON PULSE", 80, -40);
    drawText("CLICK TO PLAY", 36, 40);
    return;
  }

  if (state === "complete") {
    drawText("LEVEL COMPLETE", 60, -20);
    drawText("CLICK FOR NEXT", 36, 40);
    return;
  }

  // Ground
  ctx.fillStyle = "#222";
  ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

  // Player
  ctx.fillStyle = mode === "cube" ? "#00ffff" : "#ffff00";
  ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);

  // Spikes
  ctx.fillStyle = "#ff00ff";
  spikes.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  // Pads
  ctx.fillStyle = "#00ff00";
  pads.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  // Portals
  ctx.fillStyle = "#ff8800";
  portals.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  // Progress bar
  const progress = frame / levels[levelIndex].length;
  ctx.fillStyle = "#00ffff";
  ctx.fillRect(20, 20, (canvas.width - 40) * progress, 6);

  if (state === "dead") {
    drawText("YOU DIED", 60, -20);
    drawText("CLICK TO RETRY", 36, 40);
  }
}

function drawText(text, size, offsetY) {
  ctx.fillStyle = "#00ffff";
  ctx.font = `${size}px Arial`;
  const w = ctx.measureText(text).width;
  ctx.fillText(text, canvas.width / 2 - w / 2, canvas.height / 2 + offsetY);
}

// ---------------- UTILS ----------------
function hit(x, y, w, h, o) {
  return x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y;
}

// ---------------- LOOP ----------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
