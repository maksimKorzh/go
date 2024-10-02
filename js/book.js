const book = [
  ';B[pd];W[dp];B[pp];W[dd]',
  ';B[pd];W[dp];B[pp];W[de]',
]

function bookMove(moves) {
  for (let game of book) {
    if (game.includes(moves)) {
      let move = game.split(moves)[1].split(';')[1];
      if (move[0] == 'B' || move[0] == 'W') {
        let col = move.charCodeAt(2)-97;
        let row = move.charCodeAt(3)-97;
        let sq = (row+1) * 21 + (col+1);
        return sq;
      } else return 0;
    }
  }
}
