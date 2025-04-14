var canvas, ctx, cell;
var editMode = 0;
var gameOver = 0;
var db = 1;

function drawBoard() {
  cell = canvas.width / (size-2);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  for (let i = 0; i < size-2; i++) {
    const x = i * cell + cell / 2;
    const y = i * cell + cell / 2;
    let offset = cell * 2 - cell / 2 - cell;
    ctx.moveTo(offset, y);
    ctx.lineTo(canvas.width - offset, y);
    ctx.moveTo(x, offset);
    ctx.lineTo(x, canvas.height - offset);
  };
  ctx.lineWidth = 1;
  ctx.stroke();
  let candidateMoves = db ?  gameMovesBlack(saveSgf().slice(1, -1)) : gameMovesWhite(saveSgf().slice(1, -1));
  for (let row = 0; row < size-2; row++) {
    for (let col = 0; col < size-2; col++) {
      let sq = (row+1) * size + (col+1);
      let starPoints = {
         9: [36, 38, 40, 58, 60, 62, 80, 82, 84],
        13: [64, 67, 70, 109, 112, 115, 154, 157, 160],
        19: [88, 94, 100, 214, 220, 226, 340, 346, 352]
      }
      if ([9, 13, 19].includes(size-2) && starPoints[size-2].includes(sq)) {
        ctx.beginPath();
        ctx.arc(col * cell+(cell/4)*2, row * cell +(cell/4)*2, cell / 6 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (board[sq] == 7) continue;
      let color = board[sq] == 1 ? 'black' : 'white';
      if (board[sq]) {
        ctx.beginPath();
        ctx.arc(col * cell + cell / 2, row * cell + cell / 2, cell / 2 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = (color == 'white') ? 2 : 1;
        ctx.stroke();
      }
      if (sq == userMove) {
        let color = board[sq] == 1 ? 'white' : 'black';
        ctx.beginPath();
        ctx.arc(col * cell+(cell/4)*2, row * cell +(cell/4)*2, cell / 5 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (editMode && candidateMoves.length) {
        for (let move of candidateMoves) {
          if (board[sq] == EMPTY && sq == move) {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(col * cell + cell/4, row * cell + cell/4, Math.floor(cell/2), Math.floor(cell/2));
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }
  }
}

function userInput(event) {
  if (gameOver) return;
  let rect = canvas.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  let col = Math.floor(mouseX / cell);
  let row = Math.floor(mouseY / cell);
  let sq = (row+1) * size + (col+1);
  if (board[sq]) return;
  if (!setStone(sq, side, true)) return;
  drawBoard();
  setTimeout(function() { playMove(); }, 100)
}

function resizeCanvas() {
  if (window.innerWidth >= window.innerHeight) window.innerWidth = 800;
  canvas.width = window.innerWidth-20;
  canvas.height = canvas.width;
  drawBoard();
  document.getElementById('controls').style = 'display: flex; height: 6vh; gap: 5px; width: ' + (canvas.width+4) + 'px;';
}

function downloadSgf() {
  const element = document.createElement('a');
  const file = new Blob([saveSgf()], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = 'game.sgf';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function handleGo() {
  if (!gameOver) {
    if (editMode) handleMode();
    alert('Please press "PASS" to finish the game first');
    return;
  }
  initGoban();
  drawBoard();
  gameOver = 0;
  editMode = 0;
  document.getElementById('stats').innerHTML = 'AI(dan), Chinese rules, Komi 7.5';
}

function handlePass() {
  if (!gameOver) {
    if (editMode) passMove();
    else {
      (async () => {
        let result = await evaluatePosition()
        if (!moveHistory.slice(-1).move) {
          passMove();
          if (!moveHistory.slice(-1).move && !moveHistory.slice(-2).move) {
            result = result.replace('leads', 'wins');
            document.getElementById('stats').innerHTML = 'Press GO to play again';
            setTimeout(function() { alert('Game is finished\n' + result); }, 100);
            gameOver = 1;
          }
        }
      })();    
    }
  }
}

function handleMove() {
  if (!gameOver) playMove(1)
}

function handleUndo() {
  if (!gameOver) {
    undoMove();
    drawBoard();
  }
}

function handleMode() {
  if (!gameOver) {
    editMode ^= 1;
    document.getElementById('stats').innerHTML = editMode ? 'EDIT' : 'PLAY';
    drawBoard();
  }
}

function handleEval() {
  if (!gameOver) {
    (async () => { alert(await evaluatePosition()); })();
  }
}

function handleSave() {
  if (gameOver) downloadSgf();
  else {
    editMode = 0;
    handlePass();
    downloadSgf();
  }
}

function handleAI() {
  if (!gameOver) {
    level ^= 1;
    document.getElementById('stats').innerHTML = level ? 'AI (dan)' : 'AI (kyu)';
  }
}

function handleDB() {
  db ^= 1;
  document.getElementById('stats').innerHTML = db ? 'Using BLACK wins database' : 'Using WHITE wins database';
  drawBoard();
}

function initGUI() {
  let container = document.getElementById('goban');
  canvas = document.createElement('canvas');
  canvas.style = 'border: 2px solid black;';
  container.appendChild(canvas);
  canvas.addEventListener('click', userInput);
  ctx = canvas.getContext('2d');
  document.getElementById('controls').innerHTML = `
    <button onclick="handleGo();">GO</button>
    <button onclick="handlePass();">PASS</button>
    <button onclick="handleMove();">MOVE</button>
    <button onclick="handleUndo();">UNDO</button>
    <button onclick="handleMode();">MODE</button>
    <button onclick="handleEval();">EVAL</button>
    <button onclick="handleSave();">SAVE</button>
    <button onclick="handleAI();">AI</button>
  `;
  window.addEventListener('resize', resizeCanvas);
  initGoban();
  resizeCanvas();
  document.getElementById('stats').innerHTML = 'AI(dan), Chinese rules, Komi 7.5';
}

function initAnalyzer() {
  let container = document.getElementById('goban');
  canvas = document.createElement('canvas');
  canvas.style = 'border: 2px solid black;';
  container.appendChild(canvas);
  canvas.addEventListener('click', userInput);
  ctx = canvas.getContext('2d');
  document.getElementById('controls').innerHTML = `
    <textarea id="sgf" spellcheck="false" style="font-size: 18px; width: 100%;" placeholder="Paste your SGF here..."></textarea>
    <select id="moveFrom" style="font-size: 18px;">
      <option>First</option>
      <option>50</option>
      <option>100</option>
      <option>150</option>
      <option>200</option>
      <option>250</option>
      <option>300</option>
    </select>
    <select id="moveTo" style="font-size: 18px;">
      <option>Last</option>
      <option>50</option>
      <option>100</option>
      <option>150</option>
      <option>200</option>
      <option>250</option>
      <option>300</option>
    </select>
    <button onclick="loadGame();">Analyze</button>
  `;
  window.addEventListener('resize', resizeCanvas);
  initGoban();
  resizeCanvas();
  document.getElementById('stats').innerHTML = 'AI(dan), Chinese rules, Komi 7.5';
}
