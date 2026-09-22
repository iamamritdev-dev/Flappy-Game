const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI references
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const continueBtn = document.getElementById('continue-btn');
const p1NameInput = document.getElementById('p1-name');
const p2NameInput = document.getElementById('p2-name');
const p1LabelEl = document.getElementById('p1-label');
const p2LabelEl = document.getElementById('p2-label');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const roundTextEl = document.getElementById('round-text');
const resultTitle = document.getElementById('result-title');
const resultMsg = document.getElementById('result-msg');
const nameJokeEl = document.getElementById('name-joke');
const continueBtnEl = document.getElementById('continue-btn');

// Game constants
const GRID = 20;  // cell size in pixels
let COLS, ROWS;

let gameState = 'start';
let animationId;
let gameInterval;
let p1Name = "PLAYER 1";
let p2Name = "PLAYER 2";
let p1Wins = 0;
let p2Wins = 0;
const MAX_WINS = 3;
let roundNumber = 1;

// Snake data
let snake1, snake2, food, apple;

function setupCanvas() {
    // Match actual rendered size
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width / GRID) * GRID;
    canvas.height = Math.floor(rect.height / GRID) * GRID;
    COLS = canvas.width / GRID;
    ROWS = canvas.height / GRID;
}

function initSnakes() {
    snake1 = {
        body: [
            { x: 5, y: Math.floor(ROWS / 2) },
            { x: 4, y: Math.floor(ROWS / 2) },
            { x: 3, y: Math.floor(ROWS / 2) }
        ],
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        color: '#00e5ff',
        headColor: '#ffffff',
        dead: false
    };
    snake2 = {
        body: [
            { x: COLS - 6, y: Math.floor(ROWS / 2) },
            { x: COLS - 5, y: Math.floor(ROWS / 2) },
            { x: COLS - 4, y: Math.floor(ROWS / 2) }
        ],
        dir: { x: -1, y: 0 },
        nextDir: { x: -1, y: 0 },
        color: '#ff003c',
        headColor: '#ff9999',
        dead: false
    };
    spawnFood();
    spawnApple();
}

function spawnFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };
    } while (isOccupied(pos));
    food = pos;
}

function spawnApple() {
    let pos;
    let attempts = 0;
    do {
        pos = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };
        attempts++;
    } while (isOccupied(pos) && attempts < 50);
    apple = pos;
}

function isOccupied(pos) {
    return snake1.body.some(s => s.x === pos.x && s.y === pos.y) ||
           snake2.body.some(s => s.x === pos.x && s.y === pos.y);
}

// Input
const keys = {};
window.addEventListener('keydown', (e) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    keys[e.key] = true;

    if (gameState !== 'playing') return;

    // P1 controls (WASD) - prevent 180 reversal
    if (e.key === 'w' && snake1.dir.y !== 1)  snake1.nextDir = { x: 0, y: -1 };
    if (e.key === 's' && snake1.dir.y !== -1) snake1.nextDir = { x: 0, y: 1 };
    if (e.key === 'a' && snake1.dir.x !== 1)  snake1.nextDir = { x: -1, y: 0 };
    if (e.key === 'd' && snake1.dir.x !== -1) snake1.nextDir = { x: 1, y: 0 };

    // P2 controls (Arrow keys)
    if (e.key === 'ArrowUp'    && snake2.dir.y !== 1)  snake2.nextDir = { x: 0, y: -1 };
    if (e.key === 'ArrowDown'  && snake2.dir.y !== -1) snake2.nextDir = { x: 0, y: 1 };
    if (e.key === 'ArrowLeft'  && snake2.dir.x !== 1)  snake2.nextDir = { x: -1, y: 0 };
    if (e.key === 'ArrowRight' && snake2.dir.x !== -1) snake2.nextDir = { x: 1, y: 0 };
});

startBtn.addEventListener('click', () => {
    p1Name = p1NameInput.value.trim().toUpperCase() || "PLAYER 1";
    p2Name = p2NameInput.value.trim().toUpperCase() || "PLAYER 2";
    p1LabelEl.innerText = p1Name;
    p2LabelEl.innerText = p2Name;
    p1Wins = 0;
    p2Wins = 0;
    roundNumber = 1;
    updateScoreUI();
    startRound();
});

continueBtnEl.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    if (p1Wins >= MAX_WINS || p2Wins >= MAX_WINS) {
        // Full match over — go back to start
        p1Wins = 0;
        p2Wins = 0;
        roundNumber = 1;
        updateScoreUI();
        startScreen.classList.add('active');
    } else {
        roundNumber++;
        startRound();
    }
});

function updateScoreUI() {
    p1ScoreEl.innerText = p1Wins;
    p2ScoreEl.innerText = p2Wins;
    roundTextEl.innerText = `ROUND ${roundNumber}`;
}

function startRound() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    setupCanvas();
    initSnakes();
    gameState = 'playing';
    updateScoreUI();
    clearInterval(gameInterval);
    gameInterval = setInterval(tick, 120); // Speed of game update
    if (!animationId) renderLoop();
}

// GAME LOGIC TICK
function tick() {
    if (gameState !== 'playing') return;

    moveSnake(snake1);
    moveSnake(snake2);

    // Check collisions after both move
    checkCollisions();
}

function moveSnake(snake) {
    if (snake.dead) return;

    snake.dir = { ...snake.nextDir };
    const head = snake.body[0];
    const newHead = {
        x: (head.x + snake.dir.x + COLS) % COLS,
        y: (head.y + snake.dir.y + ROWS) % ROWS
    };

    // Check if ate food
    let ate = false;
    if (food && newHead.x === food.x && newHead.y === food.y) {
        ate = true;
        spawnFood();
    }
    if (apple && newHead.x === apple.x && newHead.y === apple.y) {
        ate = true;
        spawnApple();
    }

    snake.body.unshift(newHead);
    if (!ate) snake.body.pop();
}

function checkCollisions() {
    const h1 = snake1.body[0];
    const h2 = snake2.body[0];

    // Self collision
    const s1SelfCrash = snake1.body.slice(1).some(s => s.x === h1.x && s.y === h1.y);
    const s2SelfCrash = snake2.body.slice(1).some(s => s.x === h2.x && s.y === h2.y);

    // Cross collision (head into opponent body)
    const s1HitsS2 = snake2.body.some(s => s.x === h1.x && s.y === h1.y);
    const s2HitsS1 = snake1.body.some(s => s.x === h2.x && s.y === h2.y);

    const p1Dies = s1SelfCrash || s1HitsS2;
    const p2Dies = s2SelfCrash || s2HitsS1;

    if (p1Dies || p2Dies) {
        clearInterval(gameInterval);
        gameState = 'roundover';

        let roundWinner = null;
        if (p1Dies && p2Dies) {
            roundWinner = 'draw';
        } else if (p1Dies) {
            roundWinner = 'p2';
            p2Wins++;
        } else {
            roundWinner = 'p1';
            p1Wins++;
        }

        updateScoreUI();

        setTimeout(() => {
            showRoundResult(roundWinner);
        }, 500);
    }
}

function showRoundResult(winner) {
    resultTitle.className = 'game-over-title';
    const isMatchOver = p1Wins >= MAX_WINS || p2Wins >= MAX_WINS;

    if (winner === 'draw') {
        resultTitle.innerText = 'MUTUAL DESTRUCTION';
        resultTitle.classList.add('draw');
        resultMsg.innerText = `Both ${p1Name} and ${p2Name} crashed simultaneously.`;
        nameJokeEl.innerText = "Neither of you deserves to win. Honestly embarrassing.";
        continueBtnEl.innerText = isMatchOver ? 'PLAY AGAIN' : 'NEXT ROUND';
    } else if (winner === 'p1') {
        resultTitle.innerText = isMatchOver ? `${p1Name} WINS THE MATCH!` : `${p1Name} WINS ROUND ${roundNumber}!`;
        resultTitle.classList.add('win-p1');
        resultMsg.innerText = isMatchOver ? `Final Score: ${p1Wins} - ${p2Wins}` : `Score: ${p1Wins} - ${p2Wins}`;
        nameJokeEl.innerText = generateLoserRoast(p2Name);
        continueBtnEl.innerText = isMatchOver ? 'PLAY AGAIN' : 'NEXT ROUND';
    } else {
        resultTitle.innerText = isMatchOver ? `${p2Name} WINS THE MATCH!` : `${p2Name} WINS ROUND ${roundNumber}!`;
        resultTitle.classList.add('win-p2');
        resultMsg.innerText = isMatchOver ? `Final Score: ${p1Wins} - ${p2Wins}` : `Score: ${p1Wins} - ${p2Wins}`;
        nameJokeEl.innerText = generateLoserRoast(p1Name);
        continueBtnEl.innerText = isMatchOver ? 'PLAY AGAIN' : 'NEXT ROUND';
    }

    gameOverScreen.classList.add('active');
}

// RENDERING
function renderLoop() {
    drawBoard();
    animationId = requestAnimationFrame(renderLoop);
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * GRID, 0);
        ctx.lineTo(x * GRID, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * GRID);
        ctx.lineTo(canvas.width, y * GRID);
        ctx.stroke();
    }

    // Food (Golden glowing dot)
    if (food) {
        drawDot(food.x, food.y, '#ffcc00', '#ffcc00', 0.8);
    }
    // Bonus apple (pink)
    if (apple) {
        drawDot(apple.x, apple.y, '#ff66aa', '#ff66aa', 0.6);
    }

    // Draw snakes
    drawSnake(snake1);
    drawSnake(snake2);
}

function drawDot(gx, gy, color, glow, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha + Math.sin(Date.now() * 0.005) * 0.2;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    const cx = gx * GRID + GRID / 2;
    const cy = gy * GRID + GRID / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, GRID / 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawSnake(snake) {
    if (!snake) return;
    snake.body.forEach((seg, i) => {
        const alpha = i === 0 ? 1 : Math.max(0.3, 1 - (i / snake.body.length) * 0.6);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = i === 0 ? snake.headColor : snake.color;
        ctx.shadowColor = snake.color;
        ctx.shadowBlur = i === 0 ? 12 : 5;
        const pad = i === 0 ? 1 : 2;
        ctx.fillRect(seg.x * GRID + pad, seg.y * GRID + pad, GRID - pad * 2, GRID - pad * 2);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function generateLoserRoast(loser) {
    const roasts = [
        `${loser}, a snake beat you. `,
        `${loser} should go back to doing  project.`,
        `${loser} couldn't even keep a snake alive. haha..`,
        `${loser}, your snake gave up before you did.`,
        `Was ${loser} even looking at the screen?`
    ];
    return roasts[Math.floor(Math.random() * roasts.length)];
}

// Initial blank draw
setupCanvas();
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);

