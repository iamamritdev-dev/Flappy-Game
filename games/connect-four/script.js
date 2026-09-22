const boardEl = document.querySelector('#board');
const turnEl = document.querySelector('#turn');
const setup = document.querySelector('#setup');
const names = ['PLAYER 1', 'PLAYER 2'];
let board = [];
let current = 0;
let scores = [0, 0];
let active = false;
const rows = 6;
const cols = 7;

function start() {
  names[0] = document.querySelector('#p1').value.trim().toUpperCase() || 'PLAYER 1';
  names[1] = document.querySelector('#p2').value.trim().toUpperCase() || 'PLAYER 2';
  document.querySelector('#red-label').textContent = names[0];
  document.querySelector('#yellow-label').textContent = names[1];
  setup.hidden = true;
  active = true;
  current = 0;
  board = Array.from({ length: rows }, () => Array(cols).fill(''));
  render();
}
function render() {
  boardEl.innerHTML = '';
  turnEl.textContent = active ? `${names[current]}'S TURN` : 'SETUP MATCH';
  for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
    const slot = document.createElement('button');
    slot.className = `slot ${board[row][col]}`;
    slot.type = 'button';
    slot.setAttribute('aria-label', `row ${row + 1}, column ${col + 1}`);
    slot.addEventListener('click', () => drop(col));
    boardEl.append(slot);
  }
}
function drop(col) {
  if (!active) return;
  let row = rows - 1;
  while (row >= 0 && board[row][col]) row -= 1;
  if (row < 0) return;
  const token = current === 0 ? 'red' : 'yellow';
  board[row][col] = token;
  if (won(row, col, token)) {
    active = false;
    scores[current] += 1;
    document.querySelector('#red-score').textContent = scores[0];
    document.querySelector('#yellow-score').textContent = scores[1];
    turnEl.textContent = `${names[current]} WINS!`;
  } else if (board.every((line) => line.every(Boolean))) {
    active = false;
    turnEl.textContent = 'DRAW ROUND';
  } else current = 1 - current;
  render();
}
function won(row, col, token) {
  return [[0, 1], [1, 0], [1, 1], [1, -1]].some(([dr, dc]) => {
    let count = 1;
    for (const direction of [1, -1]) { let r = row + dr * direction; let c = col + dc * direction; while (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c] === token) { count += 1; r += dr * direction; c += dc * direction; } }
    return count >= 4;
  });
}
document.querySelector('#start').addEventListener('click', start);
document.querySelector('#reset').addEventListener('click', start);
render();
