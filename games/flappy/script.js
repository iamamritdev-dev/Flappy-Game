const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const readyScreen = document.getElementById('ready-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const funnyQuoteElement = document.getElementById('funny-quote');
const nameJokeElement = document.getElementById('name-joke');
const titleElement = document.getElementById('title');
const playerNameInput = document.getElementById('player-name');

// Menu Elements
const hamburger = document.getElementById('hamburger-icon');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const settingsIcon = document.getElementById('settings-icon');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const particleToggle = document.getElementById('particle-toggle');
const difficultySelect = document.getElementById('difficulty-select');

// Setup Canvas
canvas.width = 400;
canvas.height = 650;

// Game State
let gameState = 'start'; // start, ready, playing, gameover
let score = 0;
let highScore = localStorage.getItem('flappyHighScoreX') || 0;
let highScoreName = localStorage.getItem('flappyHighScoreNameX') || 'Nobody';
highScoreElement.innerText = highScore;
let frames = 0;
let animationId;
let playerName = "Unknown";
let enableParticles = true;
let globalDifficulty = 'easy';
let gameOverCalled = false; // guard flag to prevent double-trigger
let gameOverTimeout;
let gameOverFrame = 0;

const funnyQuotes = [
    "Even my grandma has better reflexes.",
    "Did you close your eyes on purpose?",
    "Gravity: 1. You: 0.",
    "Are you playing with your elbows?",
    "I've seen potatoes fly better than that.",
    "Was that supposed to be a jump?",
    "Error 404: Skill not found.",
    "You do know you have to click, right?"
];

// Massively slowed down and floaty modes to make it easy!
const modes = {
    baby: { speed: 2.0, gravity: 0.05, jump: -2.5, pipeGap: 240, gapVariation: 0 }, 
    normal: { speed: 3.0, gravity: 0.15, jump: -4.0, pipeGap: 200, gapVariation: 0 },
    fast: { speed: 4.5, gravity: 0.22, jump: -5.5, pipeGap: 180, gapVariation: 0 },
    moon: { speed: 2.2, gravity: 0.08, jump: -3.5, pipeGap: 210, gapVariation: 0 },
    crazy: { speed: 3.0, gravity: 0.15, jump: -4.0, pipeGap: 200, gapVariation: 0.05 } 
};
let currentMode = 'normal';

// Objects
const bird = {
    x: 60,
    y: canvas.height / 2,
    size: 24, 
    velocity: 0,
    gravity: modes.normal.gravity,
    jump: modes.normal.jump,
    rotation: 0,
    scale: 1,
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (gameState === 'playing' || gameState === 'gameover') {
            this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
            ctx.rotate(this.rotation);
        }

        ctx.scale(this.scale, 1/this.scale); 

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        ctx.fillStyle = '#00e5ff'; // Cyan core
        ctx.fillRect(-this.size/4, -this.size/4, this.size/2, this.size/2);

        if(this.velocity < 0 && gameState === 'playing' && enableParticles) {
            ctx.fillStyle = '#ff003c'; 
            ctx.beginPath();
            ctx.moveTo(-this.size/2 + 2, this.size/2);
            ctx.lineTo(this.size/2 - 2, this.size/2);
            let flameLength = this.size/2 + Math.random() * 15;
            ctx.lineTo(0, this.size/2 + flameLength);
            ctx.fill();
        }

        ctx.restore();

        if (this.scale > 1) this.scale -= 0.05;
        if (this.scale < 1) this.scale = 1;
    },
    
    update() {
        if (gameState === 'ready') {
            this.y = (canvas.height / 2) + Math.sin(frames * 0.05) * 10;
            return;
        }

        this.velocity += this.gravity;
        this.y += this.velocity;
        
        if(currentMode === 'crazy' && frames % 50 === 0) {
            this.gravity = modes.crazy.gravity + (Math.random() * 0.1 - 0.05); // Less chaotic gravity
        }

        if (this.y + this.size/2 >= canvas.height - 20) {
            this.y = canvas.height - 20 - this.size/2;
            if (gameState === 'playing' && !gameOverCalled) gameOver();
        }
        
        if (this.y - this.size/2 <= 0) {
            this.y = this.size/2;
            this.velocity = 0;
        }
    },
    
    flap() {
        this.velocity = this.jump;
        this.scale = 1.3; 
        
        if (enableParticles) {
            particles.createThrust(this.x, this.y + this.size/2);
        }
    }
};

const pipes = {
    items: [],
    width: 60,
    
    draw() {
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            
            ctx.fillStyle = '#111';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;

            ctx.fillRect(p.x, 0, this.width, p.top);
            ctx.strokeRect(p.x, 0, this.width, p.top);
            
            ctx.fillRect(p.x, canvas.height - 20 - p.bottom, this.width, p.bottom);
            ctx.strokeRect(p.x, canvas.height - 20 - p.bottom, this.width, p.bottom);
            
            let accentColor = '#00e5ff';
            if(currentMode === 'fast') accentColor = '#ff003c';
            if(currentMode === 'baby') accentColor = '#00ff66';
            
            ctx.fillStyle = accentColor;
            ctx.fillRect(p.x, p.top - 5, this.width, 5);
            ctx.fillRect(p.x, canvas.height - 20 - p.bottom, this.width, 5);
        }
    },
    
    update() {
        if (gameState !== 'playing') return;

        const modeData = modes[currentMode];
        
        // Apply global difficulty modifiers
        let speedModifier = globalDifficulty === 'easy' ? 0.8 : (globalDifficulty === 'hard' ? 1.2 : 1.0);
        let gapModifier = globalDifficulty === 'easy' ? 40 : (globalDifficulty === 'hard' ? -30 : 0);
        
        let actualSpeed = modeData.speed * speedModifier;
        let baseGap = modeData.pipeGap + gapModifier;

        if (frames > 150 && frames % Math.max(60, Math.floor(180 / actualSpeed)) === 0) {
            let currentGap = baseGap;
            if (currentMode === 'crazy') {
                currentGap += (Math.random() - 0.5) * 50; 
            }
            
            let minHeight = 50;
            let groundHeight = 20;
            let maxHeight = canvas.height - groundHeight - currentGap - minHeight;
            let topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            let bottomHeight = canvas.height - groundHeight - currentGap - topHeight;
            
            this.items.push({
                x: canvas.width,
                top: topHeight,
                bottom: bottomHeight,
                passed: false,
                moveDir: currentMode === 'crazy' ? (Math.random() > 0.5 ? 1 : -1) : 0 
            });
        }
        
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x -= actualSpeed;
            
            if(currentMode === 'crazy' && p.moveDir !== 0) {
                p.top += p.moveDir * 1.0;
                p.bottom -= p.moveDir * 1.0;
                if(p.top > canvas.height - 150 || p.top < 50) p.moveDir *= -1;
            }

            let birdLeft = bird.x - bird.size/2 + 3; 
            let birdRight = bird.x + bird.size/2 - 3;
            let birdTop = bird.y - bird.size/2 + 3;
            let birdBottom = bird.y + bird.size/2 - 3;

            if (birdRight > p.x && birdLeft < p.x + this.width) {
                if (birdTop < p.top || birdBottom > canvas.height - 20 - p.bottom) {
                    if (!gameOverCalled) gameOver();
                }
            }
            
            if (p.x + this.width < birdLeft && !p.passed) {
                score++;
                scoreElement.innerText = score;
                p.passed = true;
                
                scoreElement.style.transform = 'scale(1.5)';
                scoreElement.style.color = '#00e5ff';
                setTimeout(() => {
                    scoreElement.style.transform = 'scale(1)';
                    scoreElement.style.color = 'var(--primary)';
                }, 150);
            }
            
            if (p.x + this.width < 0) {
                this.items.shift();
                i--;
            }
        }
    },
    
    reset() {
        this.items = [];
    }
};

const particles = {
    items: [],
    
    createExplosion(x, y) {
        if(!enableParticles) return;
        for(let i=0; i<30; i++) {
            this.items.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1, decay: 0.05,
                color: Math.random() > 0.5 ? '#00e5ff' : '#ff003c',
                size: 4
            });
        }
    },

    createThrust(x, y) {
        if(!enableParticles) return;
        for(let i=0; i<3; i++) {
            this.items.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 3 + 2,
                life: 1, decay: 0.1,
                color: '#ff003c',
                size: 3
            });
        }
    },

    draw() {
        for(let p of this.items) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    },
    
    update() {
        for(let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if(p.life <= 0) {
                this.items.splice(i, 1);
                i--;
            }
        }
    }
}

// Name Jokes Logic
function generateNameJoke(name) {
    if (!name || name.trim() === '') return "Oh, 'Anonymous'? Very creative.";
    const lowerName = name.toLowerCase().trim();
    if (lowerName === 'john') return "Oh, 'John'? More like 'John the Noob'.";
    if (lowerName === 'admin') return "Nice try, Admin. You still died.";
    if (lowerName === 'pro') return "Pro? Are you sure about that?";
    if (lowerName.length < 3) return `'${name}'? Didn't even have time to type a full name?`;
    if (lowerName.length > 8) return `Wow ${name}, typing that took longer than your run.`;
    
    const jokes = [
        `Hey ${name}, maybe try a different game.`,
        `${name}, were you distracted?`,
        `Nice run, ${name}. For a beginner.`,
        `${name} is currently rethinking their life choices.`,
        `Don't quit your day job, ${name}.`
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
}

// Controls
function action() {
    if (gameState === 'ready') {
        gameState = 'playing';
        readyScreen.classList.remove('active');
        titleElement.style.opacity = '0.1';
        bird.flap();
    } else if (gameState === 'playing') {
        bird.flap();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'ready' || gameState === 'playing') {
            action();
        } else if (gameState === 'gameover' || gameState === 'start') {
            return;
        }
    }
});

canvas.addEventListener('mousedown', action);
canvas.addEventListener('touchstart', (e) => {
    if(e.target === canvas) {
        e.preventDefault();
        action();
    }
}, {passive: false});

modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        modeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentMode = e.target.dataset.mode;
        
        bird.gravity = modes[currentMode].gravity;
        bird.jump = modes[currentMode].jump;
    });
});

startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playerName = playerNameInput.value;
    initializeGame();
});

restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetGame();
});

// Sidebar & Settings Logic
if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => sidebar.classList.add('open'));
}
if (closeSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
}
if (settingsIcon && settingsModal) {
    settingsIcon.addEventListener('click', () => settingsModal.classList.add('open'));
}
if (closeSettingsBtn && settingsModal && particleToggle && difficultySelect) {
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('open');
    enableParticles = particleToggle.checked;
    globalDifficulty = difficultySelect.value; // Apply the difficulty change
    });
}

// Init settings on load
if (difficultySelect) difficultySelect.value = globalDifficulty;

function initializeGame() {
    clearTimeout(gameOverTimeout);
    startScreen.classList.remove('active');
    readyScreen.classList.add('active');
    gameOverScreen.classList.remove('active');
    gameState = 'ready';
    gameOverCalled = false; // reset guard
    
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    bird.scale = 1;
    bird.gravity = modes[currentMode].gravity;
    bird.jump = modes[currentMode].jump;
    
    score = 0;
    scoreElement.innerText = score;
    frames = 0;
    pipes.reset();
    particles.items = [];
    titleElement.style.opacity = '1';

    const kingEl = document.getElementById('king-banner');
    if (kingEl) kingEl.style.display = 'none';
    
    if(!animationId) loop();
}

function resetGame() {
    gameOverScreen.classList.remove('active');
    initializeGame();
}

function gameOver() {
    if (gameOverCalled) return;
    gameOverCalled = true;
    gameState = 'gameover';
    gameOverFrame = frames;
    particles.createExplosion(bird.x, bird.y);
    titleElement.style.opacity = '1';
    
    if (score > highScore) {
        highScore = score;
        highScoreName = playerName || 'Anonymous';
        localStorage.setItem('flappyHighScoreX', highScore);
        localStorage.setItem('flappyHighScoreNameX', highScoreName);
        highScoreElement.innerText = highScore;
    }
    
    nameJokeElement.innerText = generateNameJoke(playerName);
    funnyQuoteElement.innerText = `"${funnyQuotes[Math.floor(Math.random() * funnyQuotes.length)]}"`;
    finalScoreElement.innerText = score;

    // Show king banner if this player holds the best score
    const kingEl = document.getElementById('king-banner');
    if (kingEl) {
        kingEl.innerText = score >= highScore
            ? `👑 NEW KING: ${playerName || 'You'}!`
            : `👑 KING: ${highScoreName} (${highScore} pts)`;
        kingEl.style.display = 'block';
    }

    gameOverTimeout = setTimeout(() => {
        if (gameState !== 'gameover') return;
        gameOverScreen.classList.add('active');
    }, 600);
}

function drawBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)'; // Cyan grid
    ctx.lineWidth = 1;
    let offset = (frames * 0.5) % 40;
    
    ctx.beginPath();
    for (let x = -offset; x < canvas.width; x += 40) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.strokeStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();
    
    if (gameState === 'playing' || gameState === 'ready') {
        ctx.strokeStyle = '#333';
        let speed = gameState === 'playing' ? modes[currentMode].speed : 2;
        let gOffset = (frames * speed) % 20;
        ctx.beginPath();
        for(let i = -gOffset; i < canvas.width + 20; i+=20) {
            ctx.moveTo(i, canvas.height - 20);
            ctx.lineTo(i - 10, canvas.height);
        }
        ctx.stroke();
    }
}

function update() {
    particles.update();
    bird.update();
    pipes.update();
    
}

function loop() {
    update();
    drawBackground();
    
    pipes.draw();
    particles.draw();
    
    if(gameState !== 'gameover' || frames - gameOverFrame < 10) {
        bird.draw();
    }
    
    frames++;
    animationId = requestAnimationFrame(loop);
}

// Initial draw
drawBackground();
