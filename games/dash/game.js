const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ---------------- CONSTANTS ----------------
const GROUND_HEIGHT = 60;
const PLAYER_SIZE = 40;
const GRAVITY = 1;
const JUMP_FORCE = -18;
const SPEED = 6;

// ---------------- GAME STATE ----------------
let state = "menu"; // menu | play | dead
let frame = 0;

// ---------------- PLAYER ----------------
const player = {
  x: 150,
  y: 0,
  vy: 0,
  onGround: false
};

// ---------------- WORLD ----------------
let spikes = [];

// ---------------- INPUT ----------------
window.addEventListener("keydown", e => {
  if (e.code === "Space") handleInput();
});

window.addEventListener("mousedown", handleInput);

function handleInput() {
  if (state === "menu") {
    startGame();
    return;
  }

  if (state === "dead") {
    startGame();
    return;
  }

  if (state === "play" && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }
}

// ---------------- GAME FLOW ----------------
function startGame() {
  state = "play";
  frame = 0;

  player.y = canvas.height - GROUND_HEIGHT - PLAYER_SIZE;
  player.vy = 0;
  player.onGround = true;

  spikes = [];
}

// ---------------- UPDATE ----------------
function update() {
  if (state !== "play") return;

  frame++;

  // Spawn spikes every 120 frames
  if (frame % 120 === 0) {
    spikes.push({
      x: canvas.width,
      y: canvas.height - GROUND_HEIGHT - 40,
      w: 40,
      h: 40
    });
  }

  // Gravity
  player.vy += GRAVITY;
  player.y += player.vy;

  // Ground collision
  const groundY = canvas.height - GROUND_HEIGHT;
  if (player.y + PLAYER_SIZE >= groundY) {
    player.y = groundY - PLAYER_SIZE;
    player.vy = 0;
    player.onGround = true;
  }

  // Move spikes
  spikes.forEach(s => s.x -= SPEED);

  // Collision
  spikes.forEach(s => {
    if (collide(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, s)) {
      state = "dead";
    }
  });

  // Cleanup
  spikes = spikes.filter(s => s.x + s.w > 0);
}

// ---------------- DRAW ----------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state === "menu") {
    drawCenteredText("NEON PULSE", 80, -40);
    drawCenteredText("CLICK TO PLAY", 36, 40);
    return;
  }

  // Ground
  ctx.fillStyle = "#222";
  ctx.fillRect(
    0,
    canvas.height - GROUND_HEIGHT,
    canvas.width,
    GROUND_HEIGHT
  );

  // Player
  ctx.fillStyle = "#00ffff";
  ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);

  // Spikes
  ctx.fillStyle = "#ff00ff";
  spikes.forEach(s => {
    ctx.fillRect(s.x, s.y, s.w, s.h);
  });

  if (state === "dead") {
    drawCenteredText("YOU DIED", 60, -20);
    drawCenteredText("CLICK TO RETRY", 36, 40);
  }
}

function drawCenteredText(text, size, offsetY) {
  ctx.fillStyle = "#00ffff";
  ctx.font = `${size}px Arial`;
  const width = ctx.measureText(text).width;
  ctx.fillText(
    text,
    canvas.width / 2 - width / 2,
    canvas.height / 2 + offsetY
  );
}

// ---------------- COLLISION ----------------
function collide(x, y, w, h, obj) {
  return (
    x < obj.x + obj.w &&
    x + w > obj.x &&
    y < obj.y + obj.h &&
    y + h > obj.y
  );
}

// ---------------- LOOP ----------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
