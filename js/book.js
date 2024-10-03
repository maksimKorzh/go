const book = [
  ';B[qd];W[dp];B[pq];W[dd];B[oc];W[po];B[qo];W[qn];B[qp];W[pn];B[nq];W[pj];B[cj];W[qg];B[cn];W[fq];B[fc];W[cf]',
  ';B[qd];W[dp];B[pq];W[dd];B[oc];W[po];B[qo];W[pp];B[qp];W[oq];B[pn];W[qq];B[pr];W[rq];B[or];W[np];B[on];W[no];B[rp];W[qn];B[rn];W[qm];B[rm];W[ql];B[rr];W[nm]',
  ';B[qd];W[dp];B[pq];W[dd];B[oc];W[qo];B[op];W[ql];B[fc];W[cf];B[dc];W[cc];B[cb];W[ec];B[db];W[ed];B[eb];W[fd];B[gc];W[cn];B[fq]',
  ';B[qd];W[dp];B[pq];W[dd];B[oc];W[qo];B[qm];W[oo];B[np];W[pl];B[qp];W[ql];B[ro];W[qn];B[cj];W[qf];B[fq];W[cn];B[cg];W[gc];B[dr];W[cq];B[iq]',
  ';B[pd];W[dp];B[pp];W[dd];B[cc];W[dc];B[cd];W[de];B[bf];W[qq];B[pq];W[qp];B[po];W[rn];B[hc];W[jc];B[he];W[nc]',
  ';B[pd];W[dp];B[pq];W[dd];B[qk];W[nc];B[pf];W[pb];B[qc];W[kc];B[fq];W[cn];B[dr];W[cq];B[iq];W[po];B[np];W[qq];B[qr];W[qp];B[rr];W[qm]',
  ';B[pd];W[dp];B[pp];W[dd];B[pj];W[nq];B[pn];W[pr];B[qq];W[kq];B[jd];W[hc];B[he];W[fc];B[pf];W[cn]'
]

function bookMove(moves) {
  if (moves == '') return Math.floor(Math.random() * 2) ? 100 : 101;
  for (let game of book) {
    let result = game.split(moves);
    if (result.length == 2 && result[0].length == 0) {
      let move = game.split(moves)[1].split(';')[1];
      if (move == undefined) return 0;
      if (move[0] == 'B' || move[0] == 'W') {
        let col = move.charCodeAt(2)-97;
        let row = move.charCodeAt(3)-97;
        let sq = (row+1) * 21 + (col+1);
        return sq;
      } else return 0;
    }
  }
}
