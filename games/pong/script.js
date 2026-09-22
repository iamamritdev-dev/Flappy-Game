const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const startScreen   = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn      = document.getElementById('start-btn');
const restartBtn    = document.getElementById('restart-btn');
const playerNameInput = document.getElementById('p1-name');
const p1Label       = document.getElementById('p1-label');
const p2Label       = document.getElementById('p2-label');
const resultTitle   = document.getElementById('result-title');
const nameJoke      = document.getElementById('name-joke');
const p1ScoreEl     = document.getElementById('p1-score');
const p2ScoreEl     = document.getElementById('p2-score');
const kingBanner    = document.getElementById('king-banner');

canvas.width  = 600;
canvas.height = 450;

let gameState = 'start';
let animationId;
let playerName = 'PLAYER';
let p1Score = 0;
let aiScore = 0;
const MAX_SCORE = 5;

// Load / save high score
let highScorer = localStorage.getItem('pongKingName') || null;
let highScoreWins = parseInt(localStorage.getItem('pongKingWins') || '0');
let playerWins = 0; // wins this session

const PADDLE_W = 12, PADDLE_H = 80;

const player = { x: 20, y: canvas.height / 2 - PADDLE_H / 2, targetY: canvas.height / 2 - PADDLE_H / 2, color: '#00e5ff' };
const ai     = { x: canvas.width - 32, y: canvas.height / 2 - PADDLE_H / 2, color: '#ff003c', speed: 3.2 };

const ball = {
    x: canvas.width / 2, y: canvas.height / 2,
    size: 12, dx: 0, dy: 0, baseSpeed: 5,
    trail: [] // for motion trail
};

let particles = [];

// Input: keyboard
const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };
window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; e.preventDefault && e.key === ' ' && e.preventDefault(); });
window.addEventListener('keyup',   e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

// Input: mouse — map canvas mouse Y to player paddle
canvas.addEventListener('mousemove', e => {
    if (gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const mouseY = (e.clientY - rect.top) * scaleY;
    player.targetY = mouseY - PADDLE_H / 2;
});

startBtn.addEventListener('click', () => {
    playerName = playerNameInput.value.trim().toUpperCase() || 'PLAYER';
    p1Label.innerText = `${playerName}  (W/S or Mouse)`;
    p2Label.innerText = 'AI';
    playerWins = 0;
    startGame();
});
restartBtn.addEventListener('click', () => { playerWins = 0; startGame(); });

function startGame() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    if (kingBanner) kingBanner.style.display = 'none';
    p1Score = 0; aiScore = 0;
    p1ScoreEl.innerText = 0; p2ScoreEl.innerText = 0;
    particles = [];
    ball.trail = [];
    resetBall();
    gameState = 'playing';
    if (!animationId) loop();
}

function resetBall() {
    ball.x = canvas.width / 2; ball.y = canvas.height / 2;
    ball.trail = [];
    const angle = (Math.random() * 0.5 - 0.25);
    const dir   = Math.random() > 0.5 ? 1 : -1;
    ball.dx = dir * ball.baseSpeed * Math.cos(angle);
    ball.dy = ball.baseSpeed * Math.sin(angle);
    player.y = canvas.height / 2 - PADDLE_H / 2;
    player.targetY = player.y;
    ai.y = canvas.height / 2 - PADDLE_H / 2;
}

function createParticles(x, y, color) {
    for (let i = 0; i < 18; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1, decay: 0.04 + Math.random() * 0.04,
            color, size: Math.random() * 5 + 2
        });
    }
}

function updateAI() {
    // AI uses smooth lerp toward ball — beatable but not stupid
    const aiCentre  = ai.y + PADDLE_H / 2;
    const ballCentre = ball.y;
    const diff = ballCentre - aiCentre;
    const noise = (Math.random() - 0.5) * 10;

    if (Math.abs(diff + noise) > 5) {
        ai.y += diff > 0 ? ai.speed : -ai.speed;
    }
    ai.y = Math.max(0, Math.min(canvas.height - PADDLE_H, ai.y));
}

function update() {
    if (gameState !== 'playing') return;

    // Player movement — keyboard
    const KSPEED = 6;
    if (keys.w || keys.ArrowUp)   player.targetY -= KSPEED;
    if (keys.s || keys.ArrowDown) player.targetY += KSPEED;

    // Smooth interpolation to mouse/keyboard target
    player.y += (player.targetY - player.y) * 0.25;
    player.y  = Math.max(0, Math.min(canvas.height - PADDLE_H, player.y));
    player.targetY = Math.max(0, Math.min(canvas.height - PADDLE_H, player.targetY));

    updateAI();

    // Ball trail
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall bounce
    if (ball.y <= 0 || ball.y + ball.size >= canvas.height) ball.dy *= -1;

    // Player paddle collision
    if (ball.x <= player.x + PADDLE_W &&
        ball.y + ball.size >= player.y && ball.y <= player.y + PADDLE_H && ball.dx < 0) {
        ball.dx = Math.abs(ball.dx) * 1.07;
        const hit = (ball.y + ball.size / 2) - (player.y + PADDLE_H / 2);
        ball.dy = hit * 0.22;
        createParticles(ball.x, ball.y, player.color);
    }

    // AI paddle collision
    if (ball.x + ball.size >= ai.x &&
        ball.y + ball.size >= ai.y && ball.y <= ai.y + PADDLE_H && ball.dx > 0) {
        ball.dx = -Math.abs(ball.dx) * 1.07;
        const hit = (ball.y + ball.size / 2) - (ai.y + PADDLE_H / 2);
        ball.dy = hit * 0.22;
        createParticles(ball.x + ball.size, ball.y, ai.color);
    }

    // Speed cap
    const speed = Math.hypot(ball.dx, ball.dy);
    if (speed > 15) { ball.dx = (ball.dx / speed) * 15; ball.dy = (ball.dy / speed) * 15; }

    // Scoring
    if (ball.x < 0) {
        aiScore++; p2ScoreEl.innerText = aiScore;
        checkWin(); if (gameState === 'playing') resetBall();
    }
    if (ball.x > canvas.width) {
        p1Score++; playerWins++; p1ScoreEl.innerText = p1Score;
        checkWin(); if (gameState === 'playing') resetBall();
    }
}

function checkWin() {
    if (p1Score < MAX_SCORE && aiScore < MAX_SCORE) return;
    gameState = 'gameover';
    const playerWon = p1Score >= MAX_SCORE;

    // Update king record
    if (playerWon && playerWins > highScoreWins) {
        highScoreWins = playerWins;
        highScorer    = playerName;
        localStorage.setItem('pongKingName', highScorer);
        localStorage.setItem('pongKingWins', highScoreWins);
    }

    resultTitle.className = 'game-over-title';
    resultTitle.classList.add(playerWon ? 'win-p1' : 'win-p2');
    resultTitle.innerText = playerWon ? `${playerName} WINS!` : 'AI WINS!';
    nameJoke.innerText = playerWon
        ? `Congrats ${playerName}! You beat a few lines of code. Set the bar low?`
        : generateLoseJoke(playerName);

    // Show king banner
    if (kingBanner) {
        if (playerWon && playerName === highScorer) {
            kingBanner.innerText = `👑 NEW KING: ${playerName}! Best: ${highScoreWins} wins`;
        } else if (highScorer) {
            kingBanner.innerText = `👑 KING: ${highScorer} (${highScoreWins} wins)`;
        }
        kingBanner.style.display = highScorer ? 'block' : 'none';
    }

    setTimeout(() => gameOverScreen.classList.add('active'), 500);
}

function generateLoseJoke(name) {
    const j = [
        `${name} lost to an AI that has no soul. Truly inspiring.`,
        `The AI doesn't have eyes and it still beat ${name}. Embarrassing.`,
        `${name} vs. code. Code wins. Maybe go do your project.`,
        `${name}, the AI speed is literally set to EASY. Yikes.`,
        `${name} tried their best. Their best was not enough.`
    ];
    return j[Math.floor(Math.random() * j.length)];
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Centre dashed line
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke(); ctx.setLineDash([]);

    // Side labels
    ctx.font = 'bold 11px Montserrat'; ctx.textAlign = 'center';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('AI', canvas.width - 16, 20);
    ctx.fillText('YOU', 16, 20);

    // Paddles (rounded + glow)
    [[player, player.color], [ai, ai.color]].forEach(([p, c]) => {
        ctx.fillStyle = c; ctx.shadowBlur = 14; ctx.shadowColor = c;
        roundRect(ctx, p.x, p.y, PADDLE_W, PADDLE_H, 4);
        ctx.fill();
    });

    // Ball trail
    ball.trail.forEach((t, i) => {
        ctx.globalAlpha = (i / ball.trail.length) * 0.35;
        ctx.fillStyle   = '#ffffff';
        const s = ball.size * (i / ball.trail.length);
        ctx.fillRect(t.x + (ball.size - s) / 2, t.y + (ball.size - s) / 2, s, s);
    });
    ctx.globalAlpha = 1;

    // Ball
    if (gameState === 'playing') {
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 16;
        ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
    }
    ctx.shadowBlur = 0;

    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    });
    particles = particles.filter(p => p.life > 0);
    ctx.globalAlpha = 1;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function loop() { update(); draw(); animationId = requestAnimationFrame(loop); }
draw();
