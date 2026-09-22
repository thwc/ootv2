/**
 * Game Core Logic - OTTv2
 */
const BOARD_SIZE = 9;
const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
const PIECE_ICONS = { rock: '✊', paper: '✋', scissors: '✌️' };

// Vai trò của tab hiện tại: 'p1' | 'p2' | 'spectator' (mặc định)
let myRole = 'p1'; 

// Hàm thiết lập vai trò từ giao diện
function setPlayerRole(role) {
  myRole = role;
  const msgEl = document.getElementById('game-message');
  if (myRole === 'spectator') {
    msgEl.textContent = 'Bạn đang xem với tư cách Khán giả.';
  } else {
    msgEl.textContent = `Bạn đang điều khiển: ${myRole === 'p1' ? 'Người chơi 1 (Đỏ)' : 'Người chơi 2 (Xanh)'}`;
  }
}

// Đối tượng State có thể JSON.stringify để gửi qua mạng
let gameState = {
  board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
  turn: 'p1',
  status: 'playing',
  winner: null,
  winReason: ''
};

// State cục bộ chỉ phục vụ hiển thị click trên máy hiện tại
let localUI = {
  selectedSquare: null,
  validMoves: []
};

function createInitialBoard() {
  const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  const p1Pieces = ['rock', 'paper', 'scissors', 'scissors', 'rock', 'paper', 'paper', 'scissors', 'rock'];
  for (let c = 0; c < 5; c++) board[0][c] = { player: 'p1', type: p1Pieces[c] };
  for (let c = 0; c < 4; c++) board[1][c] = { player: 'p1', type: p1Pieces[5 + c] };

  const p2Pieces = ['rock', 'scissors', 'paper', 'paper', 'rock', 'scissors', 'scissors', 'paper', 'rock'];
  for (let c = 4; c < 9; c++) board[8][c] = { player: 'p2', type: p2Pieces[c - 4] };
  for (let c = 5; c < 9; c++) board[7][c] = { player: 'p2', type: p2Pieces[5 + (c - 5)] };
  return board;
}

function initBoardSetup() {
  gameState.board = createInitialBoard();
  gameState.turn = 'p1';
  gameState.status = 'playing';
  gameState.winner = null;
  gameState.winReason = '';
  localUI.selectedSquare = null;
  localUI.validMoves = [];
}

function canCapture(attackerType, defenderType) {
  if (attackerType === 'rock' && defenderType === 'scissors') return true;
  if (attackerType === 'scissors' && defenderType === 'paper') return true;
  if (attackerType === 'paper' && defenderType === 'rock') return true;
  return false;
}

function getValidMoves(r, c) {
  const currentPiece = gameState.board[r][c];
  if (!currentPiece) return [];

  const moves = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dr, dc] of directions) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      const target = gameState.board[nr][nc];
      if (!target) {
        moves.push({ r: nr, c: nc, isAttack: false });
      } else if (target.player === currentPiece.player) {
        continue;
      } else {
        if (target.type === currentPiece.type) {
          continue; // Cùng loại chặn nhau
        } else if (canCapture(currentPiece.type, target.type)) {
          moves.push({ r: nr, c: nc, isAttack: true });
        }
      }
    }
  }
  return moves;
}

function getPieceCounts() {
  const counts = {
    p1: { rock: 0, paper: 0, scissors: 0 },
    p2: { rock: 0, paper: 0, scissors: 0 }
  };
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = gameState.board[r][c];
      if (p) counts[p.player][p.type]++;
    }
  }
  return counts;
}

function checkWinCondition() {
  if (gameState.board[0][0] && gameState.board[0][0].player === 'p2') {
    gameState.status = 'gameover';
    gameState.winner = 'p2';
    gameState.winReason = 'Người chơi 2 đã chiếm ô căn cứ a1!';
    return;
  }
  if (gameState.board[8][8] && gameState.board[8][8].player === 'p1') {
    gameState.status = 'gameover';
    gameState.winner = 'p1';
    gameState.winReason = 'Người chơi 1 đã chiếm ô căn cứ i9!';
    return;
  }

  const counts = getPieceCounts();
  if (counts.p2.rock === 0 || counts.p2.paper === 0 || counts.p2.scissors === 0) {
    gameState.status = 'gameover';
    gameState.winner = 'p1';
    gameState.winReason = 'Người chơi 1 thắng: P2 bị diệt sạch 1 loại quân!';
    return;
  }
  if (counts.p1.rock === 0 || counts.p1.paper === 0 || counts.p1.scissors === 0) {
    gameState.status = 'gameover';
    gameState.winner = 'p2';
    gameState.winReason = 'Người chơi 2 thắng: P1 bị diệt sạch 1 loại quân!';
    return;
  }
}

// Xử lý di chuyển và báo ra cho multiplayer biết
function executeMove(fromR, fromC, toR, toC) {
  // 1. Cập nhật state cục bộ ngay lập tức
  gameState.board[toR][toC] = gameState.board[fromR][fromC];
  gameState.board[fromR][fromC] = null;
  localUI.selectedSquare = null;
  localUI.validMoves = [];

  checkWinCondition();

  if (gameState.status === 'playing') {
    gameState.turn = gameState.turn === 'p1' ? 'p2' : 'p1';
  }

  // 2. Vẽ lại màn hình người đi NGAY LẬP TỨC (không chờ mạng)
  render();

  // 3. Đẩy dữ liệu sang cho đối phương sau
  window.dispatchEvent(new CustomEvent('ott:state-changed', { detail: gameState }));
}

function onCellClick(r, c) {
  if (gameState.status === 'gameover') return;

  // Ràng buộc Online: Không phải lượt của bạn hoặc bạn là Spectator thì không được đi
  if (myRole !== 'spectator' && gameState.turn !== myRole) {
    const msgEl = document.getElementById('game-message');
    msgEl.textContent = 'Chưa đến lượt của bạn!';
    return;
  }

  const clickedPiece = gameState.board[r][c];

  if (localUI.selectedSquare) {
    const isTarget = localUI.validMoves.find(m => m.r === r && m.c === c);
    if (isTarget) {
      executeMove(localUI.selectedSquare.r, localUI.selectedSquare.c, r, c);
      return;
    }
    if (localUI.selectedSquare.r === r && localUI.selectedSquare.c === c) {
      localUI.selectedSquare = null;
      localUI.validMoves = [];
      render();
      return;
    }
  }

  if (clickedPiece && clickedPiece.player === gameState.turn) {
    // Nếu có vai trò cụ thể, chỉ được chọn quân của phe mình
    if (myRole !== 'spectator' && clickedPiece.player !== myRole) return;

    localUI.selectedSquare = { r, c };
    localUI.validMoves = getValidMoves(r, c);
    render();
  }
}

function render() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  boardEl.innerHTML = '';

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');

      if (r === 0 && c === 0) cell.classList.add('base-a1');
      if (r === 8 && c === 8) cell.classList.add('base-i9');

      const coordSpan = document.createElement('span');
      coordSpan.className = 'cell-coord';
      coordSpan.textContent = `${COLS[c]}${r + 1}`;
      cell.appendChild(coordSpan);

      if (localUI.selectedSquare && localUI.selectedSquare.r === r && localUI.selectedSquare.c === c) {
        cell.classList.add('selected');
      }

      const moveOpt = localUI.validMoves.find(m => m.r === r && m.c === c);
      if (moveOpt) {
        cell.classList.add(moveOpt.isAttack ? 'valid-attack' : 'valid-move');
      }

      const piece = gameState.board[r][c];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.classList.add('piece', piece.player);
        pieceEl.textContent = PIECE_ICONS[piece.type];
        cell.appendChild(pieceEl);
      }

      cell.addEventListener('click', () => onCellClick(r, c));
      boardEl.appendChild(cell);
    }
  }

  const counts = getPieceCounts();
  document.getElementById('p1-rock').textContent = counts.p1.rock;
  document.getElementById('p1-paper').textContent = counts.p1.paper;
  document.getElementById('p1-scissors').textContent = counts.p1.scissors;

  document.getElementById('p2-rock').textContent = counts.p2.rock;
  document.getElementById('p2-paper').textContent = counts.p2.paper;
  document.getElementById('p2-scissors').textContent = counts.p2.scissors;

  const turnEl = document.getElementById('status-turn');
  const msgEl = document.getElementById('game-message');

  if (gameState.status === 'gameover') {
    turnEl.innerHTML = `<strong>KẾT THÚC</strong>`;
    msgEl.innerHTML = `<span style="color: #dc2626;">🏆 ${gameState.winReason}</span>`;
  } else {
    const turnText = gameState.turn === 'p1' ? 'Người chơi 1 (Đỏ)' : 'Người chơi 2 (Xanh)';
    turnEl.innerHTML = `Lượt chơi: <strong>${turnText}</strong>`;
  }
}

// Hàm nhận State mới từ mạng và nạp vào game
function applyRemoteState(newState) {
  if (!newState || !newState.board) return;
  gameState = JSON.parse(JSON.stringify(newState));
  localUI.selectedSquare = null;
  localUI.validMoves = [];
  render();
}

// Khởi tạo
initBoardSetup();
render();