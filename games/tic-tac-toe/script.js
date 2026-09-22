const cells = document.querySelectorAll('.cell');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const p1Input = document.getElementById('p1-name');
const p2Input = document.getElementById('p2-name');
const p1Label = document.getElementById('p1-label');
const p2Label = document.getElementById('p2-label');
const resultTitle = document.getElementById('result-title');
const nameJoke = document.getElementById('name-joke');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const turnText = document.getElementById('turn-text');
const turnIndicator = document.getElementById('turn-indicator');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X'; 
let isGameActive = false;
let p1Name = "Player 1";
let p2Name = "Player 2";
let p1Score = 0;
let p2Score = 0;

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

startBtn.addEventListener('click', () => {
    p1Name = p1Input.value.trim().toUpperCase() || "PLAYER 1";
    p2Name = p2Input.value.trim().toUpperCase() || "PLAYER 2";
    p1Label.innerText = `${p1Name} (X)`;
    p2Label.innerText = `${p2Name} (O)`;
    startGame();
});

restartBtn.addEventListener('click', startGame);

function startGame() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    isGameActive = true;
    updateTurnUI();
    
    cells.forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('x', 'o');
        cell.style.pointerEvents = 'auto';
        cell.style.backgroundColor = 'rgba(20,20,25,0.7)'; // reset win highlight
    });
}

function updateTurnUI() {
    if (currentPlayer === 'X') {
        turnText.innerText = p1Name;
        turnIndicator.style.borderBottomColor = "var(--accent)";
    } else {
        turnText.innerText = p2Name;
        turnIndicator.style.borderBottomColor = "var(--accent-o)";
    }
}

// Player Move (Local 2-Player)
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        
        if (board[index] !== '' || !isGameActive) return;
        
        makeMove(index, currentPlayer);
        
        if (isGameActive) {
            // Switch turns
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateTurnUI();
        }
    });
});

function makeMove(index, player) {
    board[index] = player;
    cells[index].innerText = player;
    cells[index].classList.add(player.toLowerCase());
    cells[index].style.pointerEvents = 'none';
    
    checkWinOrDraw();
}

// Win/Draw Detection
function checkWinOrDraw() {
    let roundWon = false;
    let winningPlayer = '';
    
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningPlayer = board[a];
            // Highlight winning cells
            cells[a].style.backgroundColor = 'rgba(255,255,255,0.15)';
            cells[b].style.backgroundColor = 'rgba(255,255,255,0.15)';
            cells[c].style.backgroundColor = 'rgba(255,255,255,0.15)';
            break;
        }
    }
    
    if (roundWon) {
        isGameActive = false;
        setTimeout(() => showGameOver(winningPlayer), 600);
        return;
    }
    
    if (!board.includes('')) {
        isGameActive = false;
        setTimeout(() => showGameOver('draw'), 600);
    }
}

function showGameOver(result) {
    turnText.innerText = "OVER";
    turnIndicator.style.borderBottomColor = "#555";
    
    resultTitle.className = "game-over-title"; // reset classes
    
    if (result === 'X') {
        p1Score++;
        p1ScoreEl.innerText = p1Score;
        resultTitle.innerText = `${p1Name} WINS!`;
        resultTitle.classList.add('win-x');
        nameJoke.innerText = generateWinJoke(p1Name, p2Name);
    } else if (result === 'O') {
        p2Score++;
        p2ScoreEl.innerText = p2Score;
        resultTitle.innerText = `${p2Name} WINS!`;
        resultTitle.classList.add('win-o');
        nameJoke.innerText = generateWinJoke(p2Name, p1Name);
    } else {
        resultTitle.innerText = "STALEMATE";
        resultTitle.classList.add('draw');
        nameJoke.innerText = generateDrawJoke(p1Name, p2Name);
    }
    
    gameOverScreen.classList.add('active');
}

function generateWinJoke(winner, loser) {
    const jokes = [
        `Better luck next time, ${loser}. ${winner} just destroyed you.`,
        `Did you even try, ${loser}? Because ${winner} barely did.`,
        `${winner} is clearly the superior lifeform compared to ${loser}.`,
        `Ouch. ${loser} might want to consider a different game.`,
        `${winner} takes the crown! ${loser} takes the L.`
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
}

function generateDrawJoke(p1, p2) {
    const jokes = [
        `A draw? Both ${p1} and ${p2} need to step it up.`,
        `Nobody wins. You both wasted your time.`,
        `Is this a staring contest? Play better.`,
        `A stalemate. Perfectly balanced, perfectly boring.`
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
}
