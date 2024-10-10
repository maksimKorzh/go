import * as tf from '../js/tensorflow.js';
import readline from 'readline';
import fetch from 'node-fetch';
globalThis.fetch = fetch;

const Goban = function(params) {
  // CANVAS
  var canvas, ctx, cell;

  // DATA
  const EMPTY = 0
  const BLACK = 1
  const WHITE = 2
  const MARKER = 4
  const OFFBOARD = 7
  const LIBERTY = 8

  var board = [];
  var history = [];
  var komi = 7.5;
  var size;
  var side = BLACK;
  var liberties = [];
  var block = [];
  var ko = EMPTY;
  var bestMove = EMPTY;
  var userMove = 0;
  var moveCount = 0;

  function clearBoard() { /* Empty board, set offboard squares */
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
  }

  function setStone(sq, color, user) { /* Place stone on board */
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
    count(sq, color);
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
    history.push({
      'ply': moveCount+1,
      'side': (3-color),
      'move': sq,
      'board': JSON.stringify(board),
      'ko': ko
    });
    moveCount = history.length-1;
    return true;
  }

  function pass() {
    history.push({
      'ply': moveCount+1,
      'side': (3-side),
      'move': EMPTY,
      'board': JSON.stringify(board),
      'ko': ko
    });
    moveCount = history.length-1;
    ko = EMPTY;
    side = 3 - side;
  }

  function count(sq, color) { /* Count group liberties */
    let stone = board[sq];
    if (stone == OFFBOARD) return;
    if (stone && (stone & color) && (stone & MARKER) == 0) {
      block.push(sq);
      board[sq] |= MARKER;
      for (let offset of [1, size, -1, -size]) count(sq+offset, color);
    } else if (stone == EMPTY) {
      board[sq] |= LIBERTY;
      liberties.push(sq);
    }
  }

  function restoreBoard() { /* Remove group markers */
    block = []; liberties = [];
    for (let sq = 0; sq < size ** 2; sq++) {
      if (board[sq] != OFFBOARD) board[sq] &= 3;
    }
  }

  function captures(color, move) { /* Handle captured stones */
    for (let sq = 0; sq < size ** 2; sq++) {
      let stone = board[sq];
      if (stone == OFFBOARD) continue;
      if (stone & color) {
        count(sq, color);
        if (liberties.length == 0) clearBlock(move);
        restoreBoard()
      }
    }
  }

  function clearBlock(move) { /* Erase stones when captured */
    if (block.length == 1 && inEye(move, 0) == 3-side) ko = block[0];
    for (let i = 0; i < block.length; i++)
      board[block[i]] = EMPTY;
  }

  function inEye(sq) { /* Check if sqaure is in diamond shape */
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
    count(sq, color);
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

  function copyGoban() {
    let newGoban = new Goban();
    newGoban.setSize(size);
    let move = history[moveCount];
    newGoban.setPosition(move.board);
    newGoban.setSide(move.side);
    newGoban.setKo(move.ko);
    return newGoban;
  }

  function loadHistoryMove() {
    let move = history[moveCount];
    board = JSON.parse(move.board);
    side = move.side;
    ko = move.ko;
    userMove = move.move;
    drawBoard();
  }

  function undoMove() {
    if (moveCount == 0) return;
    moveCount--;
    history.pop();
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
    if (moveCount == history.length-1) return;
    moveCount++;
    loadHistoryMove();
  }

  function nextFewMoves(few) {
    if (moveCount == history.length-1) return;
    if ((moveCount + few) <= history.length-1) moveCount += few;
    else lastMove();
    loadHistoryMove();
  }

  function lastMove() {
    moveCount = history.length-1
    loadHistoryMove();
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
    for (let item of history.slice(1, history.length)) {
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

  function init() { /* Init goban module */
    size = params.size+2;
    clearBoard();
    history.push({
      'ply': 0,
      'side': BLACK,
      'move': EMPTY,
      'board': JSON.stringify(board),
      'ko': ko
    });
    moveCount = history.length-1;
  }
  
  // PUBLIC API
  return {
    init: function() { return init(); },
    BLACK: BLACK,
    WHITE: WHITE,
    copy: function() { return copyGoban(); },
    importSgf: function(sgf) { return loadSgf(sgf); },
    exportSgf: function() { return saveSgf(); },
    ladder: function(sq, color) { return isLadder(sq, color); },
    position: function() { return board; },
    setPosition: function(pos) { board = JSON.parse(pos); },
    print: function() { return printBoard(); },
    setKomi: function(komiVal) { komi = komiVal; },
    komi: function() { return komi; },
    history: function() { return history; },
    side: function() { return side; },
    setSide: function(s) { side = s; },
    size: function() { return size; },
    setSize: function(s) { size = s; },
    ko: function() { return ko; },
    setKo: function(k) { ko = k; },
    count: function(sq, color) { return count(sq, color); },
    liberties: function() { return liberties; },
    restore: function() { return restoreBoard(); },
    play: function(sq, color, user) { return setStone(sq, color, user); },
    pass: function() { return pass(); },
    undoMove: function() { return undoMove(); },
    firstMove: function() { return firstMove(); },
    prevFewMoves: function(few) { return prevFewMoves(few); },
    prevMove: function() { return prevMove(); },
    nextMove: function() { return nextMove(); },
    nextFewMoves: function(few) { return nextFewMoves(few); },
    lastMove: function() { return lastMove(); }
  }
}

// DATA
const batches = 1;
const inputBufferLength = 19 * 19;
const inputBufferChannels = 22;
const inputGlobalBufferChannels = 19;
const global_inputs = new Float32Array(batches * inputGlobalBufferChannels);
var computerSide = 2;
var level = 1; // Dan = 1; Kyu = 0

// QUERY MODEL
function enableLadders(bin_inputs) { // Calls f on each location that is part of an inescapable atari, or a group that can be put into inescapable atari
  let gobanCopy = goban.copy();
  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      let sq_19x19 = (19 * y + x);
      let sq_21x21 = (21 * (y+1) + (x+1))
      let color = goban.position()[sq_21x21];
      if (color == goban.BLACK || color == goban.WHITE) {
        let libs_black = 0;
        let libs_white = 0;
        goban.count(sq_21x21, goban.BLACK);
        libs_black = goban.liberties().length;
        goban.restore();
        goban.count(sq_21x21, goban.WHITE);
        libs_white = goban.liberties().length;
        goban.restore();
        if (libs_black == 1 || libs_black == 2 || libs_white == 1 || libs_white == 2) {
          let laddered = gobanCopy.ladder(sq_21x21, color);
          if (laddered == 1) {
            bin_inputs[inputBufferChannels * sq_19x19 + 14] = 1.0;
            bin_inputs[inputBufferChannels * sq_19x19 + 15] = 1.0;
            bin_inputs[inputBufferChannels * sq_19x19 + 16] = 1.0;
          }
          else if (laddered > 1) {
            let col = laddered % goban.size();
            let row = Math.floor(laddered / goban.size());
            let workingMove = 19 * (row-1) + (col-1);
            bin_inputs[inputBufferChannels * workingMove + 17] = 1.0;
          }
        }
      }
    }
  }
}

function inputTensor() { /* Convert GUI goban.position() to katago model input tensor */
  let katago = computerSide;
  let player = (3-computerSide);
  const bin_inputs = new Float32Array(batches * inputBufferLength * inputBufferChannels);
  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      let sq_19x19 = (19 * y + x);
      let sq_21x21 = (21 * (y+1) + (x+1))
      bin_inputs[inputBufferChannels * sq_19x19 + 0] = 1.0;
      if (goban.position()[sq_21x21] == katago) bin_inputs[inputBufferChannels * sq_19x19 + 1] = 1.0;
      if (goban.position()[sq_21x21] == player) bin_inputs[inputBufferChannels * sq_19x19 + 2] = 1.0;
      if (goban.position()[sq_21x21] == katago || goban.position()[sq_21x21] == player) {
        let libs_black = 0;
        let libs_white = 0;
        goban.count(sq_21x21, goban.BLACK);
        libs_black = goban.liberties().length;
        goban.restore();
        goban.count(sq_21x21, goban.WHITE);
        libs_white = goban.liberties().length;
        goban.restore();
        if (libs_black == 1 || libs_white == 1) bin_inputs[inputBufferChannels * sq_19x19 + 3] = 1.0;
        if (libs_black == 2 || libs_white == 2) bin_inputs[inputBufferChannels * sq_19x19 + 4] = 1.0;
        if (libs_black == 3 || libs_white == 3) bin_inputs[inputBufferChannels * sq_19x19 + 5] = 1.0;
      }
    }
  }
  if (goban.ko() > 0) bin_inputs[inputBufferChannels * sq_19x19 + 6] = 1.0;
  let moveIndex = goban.history().length-1;
  if (moveIndex >= 1 && goban.history()[moveIndex-1].side == player) {
    let prevLoc1 = goban.history()[moveIndex-1].move;
    let x = prevLoc1 % 21;
    let y = Math.floor(prevLoc1 / 21);
    if (prevLoc1) bin_inputs[inputBufferChannels * (19 * y + x) + 9] = 1.0;
    else global_inputs[0] = 1.0;
    if (moveIndex >= 2 && goban.history()[moveIndex-2].side == katago) {
      let prevLoc2 = goban.history()[moveIndex-2].move;
      let x = prevLoc2 % 21;
      let y = Math.floor(prevLoc2 / 21);
      if (prevLoc2) bin_inputs[inputBufferChannels * (19 * y + x) + 10] = 1.0;
      else global_inputs[1] = 1.0;
      if (moveIndex >= 3 && goban.history()[moveIndex-3].side == player) {
        let prevLoc3 = goban.history()[moveIndex-3].move;
        let x = prevLoc3 % 21;
        let y = Math.floor(prevLoc3 / 21);
        if (prevLoc3) bin_inputs[inputBufferChannels * (19 * y + x) + 11] = 1.0;
        else global_inputs[2] = 1.0;
        if (moveIndex >= 4 && goban.history()[moveIndex-4].side == katago) {
          let prevLoc4 = goban.history()[moveIndex-4].move;
          let x = prevLoc4 % 21;
          let y = Math.floor(prevLoc4 / 21);
          if (prevLoc4) bin_inputs[inputBufferChannels * (19 * y + x) + 12] = 1.0;
          else global_inputs[3] = 1.0;
          if (moveIndex >= 5 && goban.history()[moveIndex-5].side == player) {
            let prevLoc5 = goban.history()[moveIndex-5].move;
            let x = prevLoc5 % 21;
            let y = Math.floor(prevLoc5 / 21);
            if (prevLoc5) bin_inputs[inputBufferChannels * (19 * y + x) + 13] = 1.0;
            else global_inputs[4] = 1.0;
          }
        }
      }
    }
  }  
  enableLadders(bin_inputs);
  let selfKomi = (computerSide == goban.WHITE ? goban.komi()+1 : -goban.komi());
  global_inputs[5] = selfKomi / 20.0
  return bin_inputs;
}

async function play(button) { /* Play best move */
  if (goban.history().length > 1 && goban.history().slice(-1)[0].move == 0) { console.log('= PASS\n'); return; }
  computerSide = goban.side();
  const bin_inputs = inputTensor();
  try {
    tf.default.setBackend("cpu");
    let path = level ? "http:127.0.0.1:8000//model/dan/model.json" : "http:127.0.0.1:8000//model/kyu/model.json";

    const model = await tf.default.loadGraphModel(path);
    const results = await model.executeAsync({
        "swa_model/bin_inputs": tf.default.tensor(bin_inputs, [batches, inputBufferLength, inputBufferChannels], 'float32'),
        "swa_model/global_inputs": tf.default.tensor(global_inputs, [batches, inputGlobalBufferChannels], 'float32')
    });
    const policyTensor = level ? results[1]: results[3];
    const policyArray = await policyTensor.slice([0, 0, 0], [1, 1, 361]).array();
    const flatPolicyArray = policyArray[0][0];
    let scores = level ? results[2] : results[1];
    let flatScores = scores.dataSync();
    let copyPolicy = JSON.parse(JSON.stringify(flatPolicyArray));
    let topPolicies = copyPolicy.sort((a, b) => b - a).slice(0, 2);
    for (let move = 0; move < topPolicies.length; move++) {
      let best_19 = flatPolicyArray.indexOf(topPolicies[move]);
      let row_19 = Math.floor(best_19 / 19);
      let col_19 = best_19 % 19;
      let scoreLead = (flatScores[2]*20).toFixed(2);
      let katagoColor = computerSide == goban.BLACK ? 'Black' : 'White';
      let playerColor = (3-computerSide) == goban.BLACK ? 'Black' : 'White';
      let bestMove = 21 * (row_19+1) + (col_19+1);
      if (!goban.play(bestMove, computerSide, false)) {
        if (move == 0) continue;
        goban.pass();
        return 0;
      }
      console.log('= ' + 'ABCDEFGHJKLMNOPQRST'[col_19] + (goban.size()-row_19-2) + '\n'); // skip unsupported commands
      break;
    }
  } catch (e) {
    console.log(e);
  }
}

const goban = new Goban({'size': 19})
goban.init();

// create CLI interface
var gtp = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// gtp loop
gtp.on('line', function(command){
  if (command == 'quit') process.exit();
  else if (command.includes('name')) console.log('= PWAGoApp\n');
  else if (command.includes('protocol_version')) console.log('= 2\n');
  else if (command.includes('version')) console.log('= 1.0\n');
  else if (command.includes('list_commands')) console.log('= protocol_version\n');
  else if (command.includes('boardsize')) console.log('=\n'); // set up board size if supported
  else if (command.includes('clear_board')) { goban.init(); console.log('=\n'); }
  else if (command.includes('showboard')) { console.log('= '); goban.print(); }
  else if (command.includes('play')) {
    let color = (command.split(' ')[1] == 'B') ? goban.BLACK : goban.WHITE;
    let coord = command.split(' ')[2];
    if (coord == 'PASS') goban.pass();
    else {
      let col = ' ABCDEFGHJKLMNOPQRST'.indexOf(coord[0]);
      let row = goban.size() - parseInt(coord.slice(1))-1;
      let sq = row * goban.size() + col;
      goban.play(sq, color);
    }
    console.log('=\n');
  }
  else if (command.includes('genmove')) { play(); }
  else console.log('=\n'); // skip unsupported commands
});
