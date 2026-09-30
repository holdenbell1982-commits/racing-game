```javascript
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let width;
let height;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    width = canvas.width = Math.floor(rect.width);
    height = canvas.height = Math.floor(rect.height);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* -------------------------
   PLAYER
------------------------- */

const player = {
    x: 0,
    y: 0,

    angle: 0,

    speed: 0,

    width: 22,
    height: 40,

    acceleration: 0.12,
    braking: 0.18,

    maxSpeed: 5,
    reverseSpeed: -2,

    friction: 0.96,

    turnSpeed: 0.045
};

/* -------------------------
   INPUT
------------------------- */

const keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

window.addEventListener("keydown", event => {
    if (event.key === "ArrowUp" || event.key === "w") {
        keys.up = true;
    }

    if (event.key === "ArrowDown" || event.key === "s") {
        keys.down = true;
    }

    if (event.key === "ArrowLeft" || event.key === "a") {
        keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key === "d") {
        keys.right = true;
    }
});

window.addEventListener("keyup", event => {
    if (event.key === "ArrowUp" || event.key === "w") {
        keys.up = false;
    }

    if (event.key === "ArrowDown" || event.key === "s") {
        keys.down = false;
    }

    if (event.key === "ArrowLeft" || event.key === "a") {
        keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key === "d") {
        keys.right = false;
    }
});

/* -------------------------
   TOUCH CONTROLS
------------------------- */

function setupButton(id, key) {
    const button = document.getElementById(id);

    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        keys[key] = true;
    });

    button.addEventListener("pointerup", event => {
        event.preventDefault();
        keys[key] = false;
    });

    button.addEventListener("pointerleave", () => {
        keys[key] = false;
    });

    button.addEventListener("pointercancel", () => {
        keys[key] = false;
    });
}

setupButton("gas", "up");
setupButton("brake", "down");
setupButton("left", "left");
setupButton("right", "right");

/* -------------------------
   GAMEPAD
------------------------- */

function readGamepad() {
    const pads = navigator.getGamepads
        ? navigator.getGamepads()
        : [];

    const pad = pads[0];

    if (!pad) return;

    const horizontal = pad.axes[0] || 0;
    const vertical = pad.axes[1] || 0;

    keys.left = horizontal < -0.25;
    keys.right = horizontal > 0.25;

    keys.up = pad.buttons[0]?.pressed || vertical < -0.25;
    keys.down = pad.buttons[1]?.pressed || vertical > 0.25;
}

/* -------------------------
   TRACK
------------------------- */

function drawTrack() {
    ctx.fillStyle = "#277a35";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    const outerWidth = Math.min(width * 0.9, 800);
    const outerHeight = Math.min(height * 0.75, 500);

    const innerWidth = outerWidth * 0.55;
    const innerHeight = outerHeight * 0.48;

    // Track
    ctx.fillStyle = "#444";

    ctx.beginPath();

    ctx.ellipse(
        centerX,
        centerY,
        outerWidth / 2,
        outerHeight / 2,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Grass inside the track
    ctx.fillStyle = "#277a35";

    ctx.beginPath();

    ctx.ellipse(
        centerX,
        centerY,
        innerWidth / 2,
        innerHeight / 2,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Outer line
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.ellipse(
        centerX,
        centerY,
        outerWidth / 2,
        outerHeight / 2,
        0,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    // Inner line
    ctx.beginPath();

    ctx.ellipse(
        centerX,
        centerY,
        innerWidth / 2,
        innerHeight / 2,
        0,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    // Start/finish line
    ctx.fillStyle = "white";

    ctx.fillRect(
        centerX - 4,
        centerY + innerHeight / 2,
        8,
        outerHeight / 2 - innerHeight / 2
    );
}

/* -------------------------
   PLAYER
------------------------- */

function drawPlayer() {
    ctx.save();

    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Car body
    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
    );

    // Windshield
    ctx.fillStyle = "#9bd7ff";

    ctx.fillRect(
        -player.width / 2 + 3,
        -player.height / 2 + 8,
        player.width - 6,
        10
    );

    // Front
    ctx.fillStyle = "#fff";

    ctx.fillRect(
        -player.width / 2 + 3,
        -player.height / 2,
        player.width - 6,
        4
    );

    ctx.restore();
}

/* -------------------------
   PLAYER PHYSICS
------------------------- */

function updatePlayer() {

    if (keys.up) {
        player.speed += player.acceleration;
    }

    if (keys.down) {
        player.speed -= player.braking;
    }

    if (!keys.up && !keys.down) {
        player.speed *= player.friction;
    }

    player.speed = Math.max(
        player.reverseSpeed,
        Math.min(player.maxSpeed, player.speed)
    );

    if (Math.abs(player.speed) > 0.15) {

        const direction =
            player.speed >= 0 ? 1 : -1;

        if (keys.left) {
            player.angle -= player.turnSpeed * direction;
        }

        if (keys.right) {
            player.angle += player.turnSpeed * direction;
        }
    }

    player.x += Math.sin(player.angle) * player.speed;
    player.y -= Math.cos(player.angle) * player.speed;

    keepPlayerOnScreen();
}

function keepPlayerOnScreen() {

    const padding = 20;

    if (player.x < padding) {
        player.x = padding;
        player.speed *= 0.5;
    }

    if (player.x > width - padding) {
        player.x = width - padding;
        player.speed *= 0.5;
    }

    if (player.y < padding) {
        player.y = padding;
        player.speed *= 0.5;
    }

    if (player.y > height - padding) {
        player.y = height - padding;
        player.speed *= 0.5;
    }
}

/* -------------------------
   GAME LOOP
------------------------- */

function gameLoop() {

    readGamepad();

    ctx.clearRect(0, 0, width, height);

    updatePlayer();

    drawTrack();
    drawPlayer();

    requestAnimationFrame(gameLoop);
}

/* -------------------------
   START
------------------------- */

function startGame() {

    player.x = width / 2;
    player.y = height / 2 + 140;

    player.angle = 0;
    player.speed = 0;

    gameLoop();
}

startGame();
```
