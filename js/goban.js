var tf;
var danModel, kyuModel;

if (typeof(module) != 'undefined') {
  (async () => {
    const tfModule = await import('./tensorflow.js');
    tf = tfModule.default;
    danModel = await tf.loadGraphModel("https://maksimkorzh.github.io/go/model/dan/model.json");
    kyuModel = await tf.loadGraphModel("https://maksimkorzh.github.io/go/model/kyu/model.json");
  })();
}

if (typeof(document) != 'undefined') {
  (async () => {
    document.getElementById('stats').innerHTML = 'Loading neural nets, please wait...';
    danModel = await tf.loadGraphModel("https://maksimkorzh.github.io/go/model/dan/model.json");
    kyuModel = await tf.loadGraphModel("https://maksimkorzh.github.io/go/model/kyu/model.json");
    initGUI();
  })();
}

const batches = 1;
const inputBufferLength = 19 * 19;
const inputBufferChannels = 22;
const inputGlobalBufferChannels = 19;
const globalInputs = new Float32Array(batches * inputGlobalBufferChannels);

const EMPTY = 0
const BLACK = 1
const WHITE = 2
const MARKER = 4
const OFFBOARD = 7
const LIBERTY = 8

var board = [];
var moveHistory = [];
var komi = 7.5;
var size = 21;
var side = BLACK;
var liberties = [];
var block = [];
var ko = EMPTY;
var bestMove = EMPTY;
var userMove = EMPTY;
var moveCount = EMPTY;
var level = 1;

function clearBoard() {
  board = [];
  moveHistory = [];
  liberties = [];
  block = [];
  liberties = [];
  block = [];
  side = BLACK;
  ko = EMPTY;
  bestMove = EMPTY;
  userMove = EMPTY;
  moveCount = EMPTY;
  level = 1;
  for (let sq = 0; sq < size ** 2; sq++) {
    switch (true) {
      case (sq < size):
      case (sq >= (size ** 2 - size)):
      case (!(sq % size)):
        board[sq] = OFFBOARD;
        board[sq-1] = OFFBOARD;
        break;
      default: board[sq] = 0;
    }
  }
}

function printBoard() {
  let pos = '';
  let chars = '.XO    #';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let sq = row * size + col;
      pos += ' ' + chars[board[sq]];
    } pos += '\n'
  } console.log(pos);
  return pos;
}

function setStone(sq, color, user) {
  if (board[sq] != EMPTY) {
    if (user) alert("Illegal move!");
    return false;
  } else if (sq == ko) {
    if (user) alert("Ko!");
    return false;
  } let old_ko = ko;
  ko = EMPTY;
  board[sq] = color;
  captures(3 - color, sq);
  countLiberties(sq, color);
  let suicide = liberties.length ? false : true; 
  restoreBoard();
  if (suicide) {
    board[sq] = EMPTY;
    ko = old_ko;
    moveCount--;
    if (user) alert("Suicide move!");
    return false;
  } 
  side = 3 - side;
  userMove = sq;
  moveHistory.push({
    'ply': moveCount+1,
    'side': (3-color),
    'move': sq,
    'board': JSON.stringify(board),
    'ko': ko
  });
  moveCount = moveHistory.length-1;
  return true;
}

function passMove() {
  moveHistory.push({
    'ply': moveCount+1,
    'side': (3-side),
    'move': EMPTY,
    'board': JSON.stringify(board),
    'ko': ko
  });
  moveCount = moveHistory.length-1;
  ko = EMPTY;
  side = 3 - side;
}

function countLiberties(sq, color) {
  let stone = board[sq];
  if (stone == OFFBOARD) return;
  if (stone && (stone & color) && (stone & MARKER) == 0) {
    block.push(sq);
    board[sq] |= MARKER;
    for (let offset of [1, size, -1, -size]) countLiberties(sq+offset, color);
  } else if (stone == EMPTY) {
    board[sq] |= LIBERTY;
    liberties.push(sq);
  }
}

function restoreBoard() {
  block = []; liberties = []; points_side = [];
  for (let sq = 0; sq < size ** 2; sq++) {
    if (board[sq] != OFFBOARD) board[sq] &= 3;
  }
}

function captures(color, move) {
  for (let sq = 0; sq < size ** 2; sq++) {
    let stone = board[sq];
    if (stone == OFFBOARD) continue;
    if (stone & color) {
      countLiberties(sq, color);
      if (liberties.length == 0) clearBlock(move);
      restoreBoard()
    }
  }
}

function clearBlock(move) {
  if (block.length == 1 && inEye(move, 0) == 3-side) ko = block[0];
  for (let i = 0; i < block.length; i++)
    board[block[i]] = EMPTY;
}

function inEye(sq) {
  let eyeColor = -1;
  let otherColor = -1;
  for (let offset of [1, size, -1, -size]) {
    if (board[sq+offset] == OFFBOARD) continue;
    if (board[sq+offset] == EMPTY) return 0;
    if (eyeColor == -1) {
      if (board[sq+offset] <= 2) eyeColor = board[sq+offset];
      else eyeColor = board[sq+offset] - MARKER;
      otherColor = 3-eyeColor;
    } else if (board[sq+offset] == otherColor)
      return 0;
  } return eyeColor;
}

function isLadder(sq, color) {
  let libs = [];
  countLiberties(sq, color);
  libs = JSON.parse(JSON.stringify(liberties));
  restoreBoard();
  if (libs.length == 0) return 1;
  if (libs.length == 1) {
    board[libs[0]] = color;
    if (isLadder(libs[0], color)) return 1;
    board[libs[0]] = EMPTY;
  }
  if (libs.length == 2) {
    for (let move of libs) {
      board[move] = (3-color);
      if (isLadder(sq, color)) return move;
      board[move] = EMPTY;
    }
  }
  return 0;
}

function loadHistoryMove() {
  let move = moveHistory[moveCount];
  board = JSON.parse(move.board);
  side = move.side;
  ko = move.ko;
  userMove = move.move;
}

function undoMove() {
  if (moveCount == 0) return;
  moveCount--;
  moveHistory.pop();
  loadHistoryMove();
}

function firstMove() {
  moveCount = 0;
  loadHistoryMove();
}

function prevMove() {
  if (moveCount == 0) return;
  moveCount--;
  loadHistoryMove();
}

function prevFewMoves(few) {
  if (moveCount == 0) return;
  if ((moveCount - few) >= 0) moveCount -= few;
  else firstMove();
  loadHistoryMove();
}

function nextMove() {
  if (moveCount == moveHistory.length-1) return;
  moveCount++;
  loadHistoryMove();
}

function nextFewMoves(few) {
  if (moveCount == moveHistory.length-1) return;
  if ((moveCount + few) <= moveHistory.length-1) moveCount += few;
  else lastMove();
  loadHistoryMove();
}

function lastMove() {
  moveCount = moveHistory.length-1
  loadHistoryMove();
}

function getHistory() {
  return moveHistory;
}

function loadSgf(sgf) {
  for (let move of sgf.split(';')) {
    if (move.length) {
      if (move.charCodeAt(2) < 97 || move.charCodeAt(2) > 115) { continue; }
      let player = move[0] == 'B' ? BLACK : WHITE;
      let col = move.charCodeAt(2)-97;
      let row = move.charCodeAt(3)-97;
      let sq = (row+1) * 21 + (col+1);
      setStone(sq, player, false);
    }
  } firstMove();
}

function saveSgf() {
  let sgf = '(';
  for (let item of moveHistory.slice(1, moveHistory.length)) {
    let col = item.move % size;
    let row = Math.floor(item.move / size);
    let color = item.side == BLACK ? 'W' : 'B';
    let coords = ' abcdefghijklmnopqrs';
    let move = coords[col] + coords[row];
    if (move == '  ') sgf += ';' + color + '[]'
    else sgf += ';' + color + '[' + move + ']';
  } sgf += ')'
  return sgf;
}

function enableLadders(binInputs) {
  let move = moveHistory[moveCount];
  boardCopy = JSON.parse(move.board);
  sideCopy = move.side;
  koCopy = move.ko;
  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      let sq_19x19 = (19 * y + x);
      let sq_21x21 = (21 * (y+1) + (x+1))
      let color = board[sq_21x21];
      if (color == BLACK || color == WHITE) {
        let libs_black = 0;
        let libs_white = 0;
        countLiberties(sq_21x21, BLACK);
        libs_black = liberties.length;
        restoreBoard();
        countLiberties(sq_21x21, WHITE);
        libs_white = liberties.length;
        restoreBoard();
        if (libs_black == 1 || libs_black == 2 || libs_white == 1 || libs_white == 2) {
          let laddered = isLadder(sq_21x21, color);
          if (laddered == 1) {
            binInputs[inputBufferChannels * sq_19x19 + 14] = 1.0;
            binInputs[inputBufferChannels * sq_19x19 + 15] = 1.0;
            binInputs[inputBufferChannels * sq_19x19 + 16] = 1.0;
          }
          else if (laddered > 1) {
            let col = laddered % size;
            let row = Math.floor(laddered / size);
            let workingMove = 19 * (row-1) + (col-1);
            binInputs[inputBufferChannels * workingMove + 17] = 1.0;
          }
        }
      }
    }
  }
  board = boardCopy;
  side = sideCopy;
  ko = koCopy;
}

function inputTensor() {
  let katago = side;
  let player = (3-side);
  const binInputs = new Float32Array(batches * inputBufferLength * inputBufferChannels);
  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      let sq_19x19 = (19 * y + x);
      let sq_21x21 = (21 * (y+1) + (x+1))
      binInputs[inputBufferChannels * sq_19x19 + 0] = 1.0;
      if (board[sq_21x21] == katago) binInputs[inputBufferChannels * sq_19x19 + 1] = 1.0;
      if (board[sq_21x21] == player) binInputs[inputBufferChannels * sq_19x19 + 2] = 1.0;
      if (board[sq_21x21] == katago || board[sq_21x21] == player) {
        let libs_black = 0;
        let libs_white = 0;
        countLiberties(sq_21x21, BLACK);
        libs_black = liberties.length;
        restoreBoard();
        countLiberties(sq_21x21, WHITE);
        libs_white = liberties.length;
        restoreBoard();
        if (libs_black == 1 || libs_white == 1) binInputs[inputBufferChannels * sq_19x19 + 3] = 1.0;
        if (libs_black == 2 || libs_white == 2) binInputs[inputBufferChannels * sq_19x19 + 4] = 1.0;
        if (libs_black == 3 || libs_white == 3) binInputs[inputBufferChannels * sq_19x19 + 5] = 1.0;
      }
    }
  }
  if (ko != EMPTY) {
    let col = (ko % 21)-1;
    let row = Math.floor(ko / 21)-1;
    let sq_19x19 = row * 19 + col;
    binInputs[inputBufferChannels * sq_19x19 + 6] = 1.0;
  }
  let moveIndex = moveHistory.length-1;
  if (moveIndex >= 1 && moveHistory[moveIndex-1].side == player) {
    let prevLoc1 = moveHistory[moveIndex-1].move;
    let x = (prevLoc1 % 21)-1;
    let y = (Math.floor(prevLoc1 / 21))-1;
    if (prevLoc1) binInputs[inputBufferChannels * (19 * y + x) + 9] = 1.0;
    else globalInputs[0] = 1.0;
    if (moveIndex >= 2 && moveHistory[moveIndex-2].side == katago) {
      let prevLoc2 = moveHistory[moveIndex-2].move;
      let x = (prevLoc2 % 21)-1;
      let y = (Math.floor(prevLoc2 / 21))-1;
      if (prevLoc2) binInputs[inputBufferChannels * (19 * y + x) + 10] = 1.0;
      else globalInputs[1] = 1.0;
      if (moveIndex >= 3 && moveHistory[moveIndex-3].side == player) {
        let prevLoc3 = moveHistory[moveIndex-3].move;
        let x = (prevLoc3 % 21)-1;
        let y = (Math.floor(prevLoc3 / 21))-1;
        if (prevLoc3) binInputs[inputBufferChannels * (19 * y + x) + 11] = 1.0;
        else globalInputs[2] = 1.0;
        if (moveIndex >= 4 && moveHistory[moveIndex-4].side == katago) {
          let prevLoc4 = moveHistory[moveIndex-4].move;
          let x = (prevLoc4 % 21)-1;
          let y = (Math.floor(prevLoc4 / 21))-1;
          if (prevLoc4) binInputs[inputBufferChannels * (19 * y + x) + 12] = 1.0;
          else globalInputs[3] = 1.0;
          if (moveIndex >= 5 && moveHistory[moveIndex-5].side == player) {
            let prevLoc5 = moveHistory[moveIndex-5].move;
            let x = (prevLoc5 % 21)-1;
            let y = (Math.floor(prevLoc5 / 21))-1;
            if (prevLoc5) binInputs[inputBufferChannels * (19 * y + x) + 13] = 1.0;
            else globalInputs[4] = 1.0;
          }
        }
      }
    }
  }  
  enableLadders(binInputs);
  let selfKomi = (side == WHITE ? komi+1 : -komi);
  globalInputs[5] = selfKomi / 20.0
  return binInputs;
}

async function playMove(button) {
  if (typeof(document) != 'undefined') {
    if (editMode) { if (button) alert('Please switch to "PLAY" mode first'); return; }
    document.getElementById('stats').innerHTML = 'Thinking...';
  }
  const binInputs = inputTensor();
  try {
    const model = await (level ? danModel : kyuModel);
    const results = await model.executeAsync({
        "swa_model/bin_inputs": tf.tensor(binInputs, [batches, inputBufferLength, inputBufferChannels], 'float32'),
        "swa_model/global_inputs": tf.tensor(globalInputs, [batches, inputGlobalBufferChannels], 'float32')
    });
    const policyTensor = level ? results[1]: results[3];
    const policyArray = await policyTensor.slice([0, 0, 0], [1, 1, 361]).array();
    const flatPolicyArray = policyArray[0][0];
    let scores = level ? results[2] : results[1];
    let flatScores = scores.dataSync();
    let copyPolicy = JSON.parse(JSON.stringify(flatPolicyArray));
    let topPolicies = copyPolicy.sort((a, b) => b - a).slice(0, 3);
    for (let move = 0; move < topPolicies.length; move++) {
      let moveChoice = (moveHistory.length <= 6) ? Math.floor(Math.random() * 3) : move;
      let best_19 = flatPolicyArray.indexOf(topPolicies[moveChoice]);
      let row_19 = Math.floor(best_19 / 19);
      let col_19 = best_19 % 19;
      let scoreLead = (flatScores[2]*20).toFixed(2);
      let katagoColor = side == BLACK ? 'Black' : 'White';
      let playerColor = (3-side) == BLACK ? 'Black' : 'White';
      if (typeof(document) != 'undefined') {
        document.getElementById('stats').innerHTML = 'AI(' + (level ? 'dan' : 'kyu') + '), Chinese rules, Komi 7.5';
      }
      let bestMove = 21 * (row_19+1) + (col_19+1);
      if (!setStone(bestMove, side, false)) {
        if (move == 0) continue;
        if (typeof(document) != 'undefined') { alert('Pass'); }
        else console.log('= PASS\n');
        passMove();
      }
      if (typeof(document) != 'undefined') { drawBoard(); }
      else console.log('= ' + 'ABCDEFGHJKLMNOPQRST'[col_19] + (size-row_19-2) + '\n');
      break;
    }
  } catch (e) {console.log(e);}
}

async function evaluatePosition(button) {
  const binInputs = inputTensor();
  try {
    const model = await danModel;
    const results = await model.executeAsync({
        "swa_model/bin_inputs": tf.tensor(binInputs, [batches, inputBufferLength, inputBufferChannels], 'float32'),
        "swa_model/global_inputs": tf.tensor(globalInputs, [batches, inputGlobalBufferChannels], 'float32')
    });
    let scores = results[2];
    let flatScores = scores.dataSync(2);
    let scoreLead = (flatScores[2]*20).toFixed(2);
    let katagoColor = side == BLACK ? 'Black' : 'White';
    let playerColor = (3-side) == BLACK ? 'Black' : 'White';
    let scoreString = (scoreLead > 0 ? (katagoColor + ' leads by ') : (playerColor + ' leads by ')) + Math.abs(scoreLead) + ' points';
    return scoreString;
  } catch (e) {}
}

function initGoban() {
  clearBoard();
  moveHistory.push({
    'ply': 0,
    'side': BLACK,
    'move': EMPTY,
    'board': JSON.stringify(board),
    'ko': ko
  });
  moveCount = moveHistory.length-1;
}

if (typeof(module) != 'undefined') {
  module.exports = {
    BLACK, WHITE,
    size,
    getHistory,
    initGoban,
    printBoard,
    setStone,
    playMove,
    passMove
  };
}
