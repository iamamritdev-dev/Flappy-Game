// Elements
const startScreen   = document.getElementById('start-screen');
const winScreen     = document.getElementById('win-screen');
const startBtn      = document.getElementById('start-btn');
const restartBtn    = document.getElementById('restart-btn');
const cardGrid      = document.getElementById('card-grid');
const moveCountEl   = document.getElementById('move-count');
const pairsFoundEl  = document.getElementById('pairs-found');
const timerEl       = document.getElementById('timer');
const finalTimeEl   = document.getElementById('final-time');
const finalMovesEl  = document.getElementById('final-moves');
const finalRatingEl = document.getElementById('final-rating');
const winJokeEl     = document.getElementById('win-joke');
const playerNameIn  = document.getElementById('player-name');
const diffBtns      = document.querySelectorAll('.diff-btn');

// Emoji pairs pool — 18 unique emojis for 6×6 (9 pairs shown)
const emojiPool = [
    '🔥','⚡','💎','🎯','🚀','👾','🎮','🧠','🐉',
    '🌊','🎲','💀','🌙','⭐','🦊','🎸','🏆','🎭'
];

let playerName  = "PLAYER";
let cols        = 4;
let totalPairs  = 8;
let flipped     = [];
let matched     = 0;
let moves       = 0;
let lockBoard   = false;
let timerStart  = null;
let timerInterval = null;
let elapsed     = 0;

// Difficulty selection
diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cols = parseInt(btn.dataset.cols);
        totalPairs = (cols * cols) / 2;
    });
});

startBtn.addEventListener('click', () => {
    playerName = playerNameIn.value.trim() || "Anonymous";
    startGame();
});
restartBtn.addEventListener('click', startGame);

function startGame() {
    startScreen.classList.remove('active');
    winScreen.classList.remove('active');
    flipped = []; matched = 0; moves = 0; lockBoard = false;
    moveCountEl.innerText = 0;
    pairsFoundEl.innerText = `0 / ${totalPairs}`;
    buildGrid();
    startTimer();
}

function buildGrid() {
    cardGrid.innerHTML = '';
    cardGrid.className = `card-grid cols-${cols}`;

    // Pick `totalPairs` emojis from pool, then duplicate & shuffle
    const chosen = emojiPool.slice(0, totalPairs);
    const deck   = shuffle([...chosen, ...chosen]);

    deck.forEach((emoji, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.emoji = emoji;
        card.dataset.index = i;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-back"></div>
                <div class="card-front">${emoji}</div>
            </div>`;
        card.addEventListener('click', onCardClick);
        cardGrid.appendChild(card);
    });
}

function onCardClick(e) {
    const card = e.currentTarget;
    if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flipped.push(card);

    if (flipped.length === 2) {
        moves++;
        moveCountEl.innerText = moves;
        lockBoard = true;
        checkMatch();
    }
}

function checkMatch() {
    const [a, b] = flipped;
    if (a.dataset.emoji === b.dataset.emoji) {
        // Match!
        a.classList.add('matched');
        b.classList.add('matched');
        matched++;
        pairsFoundEl.innerText = `${matched} / ${totalPairs}`;
        flipped = [];
        lockBoard = false;

        if (matched === totalPairs) {
            stopTimer();
            setTimeout(showWin, 600);
        }
    } else {
        // No match — shake and flip back
        a.classList.add('wrong');
        b.classList.add('wrong');
        setTimeout(() => {
            a.classList.remove('flipped', 'wrong');
            b.classList.remove('flipped', 'wrong');
            flipped = [];
            lockBoard = false;
        }, 900);
    }
}

function startTimer() {
    clearInterval(timerInterval);
    elapsed = 0;
    timerEl.innerText = '00:00';
    timerStart = Date.now();
    timerInterval = setInterval(() => {
        elapsed = Math.floor((Date.now() - timerStart) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
    }, 500);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function showWin() {
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    finalTimeEl.innerText = `${m}:${s}`;
    finalMovesEl.innerText = moves;

    // Rating logic
    const minMoves = totalPairs; // theoretical minimum
    const ratio = moves / minMoves;
    let rating, joke;

    if (ratio <= 1.2) {
        rating = '⭐⭐⭐ GENIUS';
        joke = `${playerName}, that was ELITE. Are you secretly a robot? Actually impressive.`;
    } else if (ratio <= 1.6) {
        rating = '⭐⭐ SMART';
        joke = `Not bad, ${playerName}. You might actually have a functioning brain.`;
    } else if (ratio <= 2.5) {
        rating = '⭐ AVERAGE';
        joke = `${playerName}, you got there eventually. Your brain works… mostly.`;
    } else {
        rating = '💀 POTATO';
        joke = `${playerName}, it took you ${moves} moves to find ${totalPairs} pairs. Sir, are you okay?`;
    }

    finalRatingEl.innerText = rating;
    winJokeEl.innerText = joke;
    winScreen.classList.add('active');
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
