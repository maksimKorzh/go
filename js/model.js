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
  if (goban.ko() != goban.EMPTY) {
    let col = (goban.ko() % 21)-1;
    let row = Math.floor(goban.ko() / 21)-1;
    let sq_19x19 = row * 19 + col;
    bin_inputs[inputBufferChannels * sq_19x19 + 6] = 1.0;
  }
  let moveIndex = goban.history().length-1;
  if (moveIndex >= 1 && goban.history()[moveIndex-1].side == player) {
    let prevLoc1 = goban.history()[moveIndex-1].move;
    let x = (prevLoc1 % 21)-1;
    let y = (Math.floor(prevLoc1 / 21))-1;
    if (prevLoc1) bin_inputs[inputBufferChannels * (19 * y + x) + 9] = 1.0;
    else global_inputs[0] = 1.0;
    if (moveIndex >= 2 && goban.history()[moveIndex-2].side == katago) {
      let prevLoc2 = goban.history()[moveIndex-2].move;
      let x = (prevLoc2 % 21)-1;
      let y = (Math.floor(prevLoc2 / 21))-1;
      if (prevLoc2) bin_inputs[inputBufferChannels * (19 * y + x) + 10] = 1.0;
      else global_inputs[1] = 1.0;
      if (moveIndex >= 3 && goban.history()[moveIndex-3].side == player) {
        let prevLoc3 = goban.history()[moveIndex-3].move;
        let x = (prevLoc3 % 21)-1;
        let y = (Math.floor(prevLoc3 / 21))-1;
        if (prevLoc3) bin_inputs[inputBufferChannels * (19 * y + x) + 11] = 1.0;
        else global_inputs[2] = 1.0;
        if (moveIndex >= 4 && goban.history()[moveIndex-4].side == katago) {
          let prevLoc4 = goban.history()[moveIndex-4].move;
          let x = (prevLoc4 % 21)-1;
          let y = (Math.floor(prevLoc4 / 21))-1;
          if (prevLoc4) bin_inputs[inputBufferChannels * (19 * y + x) + 12] = 1.0;
          else global_inputs[3] = 1.0;
          if (moveIndex >= 5 && goban.history()[moveIndex-5].side == player) {
            let prevLoc5 = goban.history()[moveIndex-5].move;
            let x = (prevLoc5 % 21)-1;
            let y = (Math.floor(prevLoc5 / 21))-1;
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
  if (editMode) { if (button) alert('Please switch to "PLAY" mode first'); return; }
  document.getElementById('stats').innerHTML = 'Thinking...';
  computerSide = goban.side();
  let sgf = goban.exportSgf().slice(1, -1);
  let move = bookMove(sgf);
  if (move) {
    goban.play(move, computerSide, false)
    goban.refresh();
    document.getElementById('stats').innerHTML = 'BOOK';
    return;
  }
  const bin_inputs = inputTensor();
  try {
    tf.setBackend('webgl').then(() => {
      if (tf.getBackend() !== 'webgl') {
        tf.setBackend('cpu'); // Manually set to CPU if WebGL is unavailable
      }
    });
    let path = level ? "./model/dan/model.json" : "./model/kyu/model.json";
    const model = await tf.loadGraphModel(path);
    const results = await model.executeAsync({
        "swa_model/bin_inputs": tf.tensor(bin_inputs, [batches, inputBufferLength, inputBufferChannels], 'float32'),
        "swa_model/global_inputs": tf.tensor(global_inputs, [batches, inputGlobalBufferChannels], 'float32')
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
      document.getElementById('stats').innerHTML = (scoreLead > 0 ? (katagoColor + ' leads by ') : (playerColor + ' leads by ')) + Math.abs(scoreLead) + ' points';
      let bestMove = 21 * (row_19+1) + (col_19+1);
      if (!goban.play(bestMove, computerSide, false)) {
        if (move == 0) continue;
        alert('Pass');
        goban.pass();
      } goban.refresh(); break;
    }
  } catch (e) {
    console.log(e);
  }
}

async function eval() { /* Estimate score */
  document.getElementById('stats').innerHTML = 'Estimating score...';
  computerSide = goban.side();
  const bin_inputs = inputTensor();
  try {
    tf.setBackend("cpu");
    const model = await tf.loadGraphModel("./model/dan/model.json");
    const results = await model.executeAsync({
        "swa_model/bin_inputs": tf.tensor(bin_inputs, [batches, inputBufferLength, inputBufferChannels], 'float32'),
        "swa_model/global_inputs": tf.tensor(global_inputs, [batches, inputGlobalBufferChannels], 'float32')
    });
    let scores = results[2];
    let flatScores = scores.dataSync(2);
    let scoreLead = (flatScores[2]*20).toFixed(2);
    let katagoColor = computerSide == goban.BLACK ? 'Black' : 'White';
    let playerColor = (3-computerSide) == goban.BLACK ? 'Black' : 'White';
    document.getElementById('stats').innerHTML = (scoreLead > 0 ? (katagoColor + ' leads by ') : (playerColor + ' leads by ')) + Math.abs(scoreLead) + ' points';
  } catch (e) {
    console.log(e);
  }
}
