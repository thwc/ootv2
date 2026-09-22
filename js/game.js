/**
 * Game Core Logic - OTTv2
 * Bàn cờ 9x9 (Hàng: 0 -> 8, Cột: 0 -> 8 tương ứng a-i và 1-9)
 * Ô [0,0] là a1, ô [8,8] là i9
 */

const BOARD_SIZE = 9;
const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

// Ký hiệu icon quân cờ
const PIECE_ICONS = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️'
};

// State tổng của ván cờ
const gameState = {
  board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
  turn: 'p1', // 'p1' (Người chơi 1) hoặc 'p2' (Người chơi 2)
  selectedSquare: null, // { r, c }
  validMoves: [], // Danh sách các ô có thể đi tới: [{ r, c, isAttack }]
  status: 'playing', // 'playing' | 'gameover'
  winner: null,
  winReason: ''
};

// Khởi tạo bàn cờ ban đầu:
// P1 dàn quân ở hàng 0 và 1 (quanh ô a1)
// P2 dàn quân ở hàng 7 và 8 (quanh ô i9)
function initBoardSetup() {
  gameState.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

  // Quân P1: 3 Đấm, 3 Lá, 3 Kéo
  const p1Pieces = [
    'rock', 'paper', 'scissors',
    'scissors', 'rock', 'paper',
    'paper', 'scissors', 'rock'
  ];

  // Hàng 0: 5 ô đầu tiên
  for (let c = 0; c < 5; c++) {
    gameState.board[0][c] = { player: 'p1', type: p1Pieces[c] };
  }
  // Hàng 1: 4 ô đầu tiên
  for (let c = 0; c < 4; c++) {
    gameState.board[1][c] = { player: 'p1', type: p1Pieces[5 + c] };
  }

  // Quân P2: 3 Đấm, 3 Lá, 3 Kéo
  const p2Pieces = [
    'rock', 'scissors', 'paper',
    'paper', 'rock', 'scissors',
    'scissors', 'paper', 'rock'
  ];

  // Hàng 8: 5 ô cuối cùng
  for (let c = 4; c < 9; c++) {
    gameState.board[8][c] = { player: 'p2', type: p2Pieces[c - 4] };
  }
  // Hàng 7: 4 ô cuối cùng
  for (let c = 5; c < 9; c++) {
    gameState.board[7][c] = { player: 'p2', type: p2Pieces[5 + (c - 5)] };
  }

  gameState.turn = 'p1';
  gameState.selectedSquare = null;
  gameState.validMoves = [];
  gameState.status = 'playing';
  gameState.winner = null;
  gameState.winReason = '';
}

// Logic ăn quân theo luật Oẳn Tù Tì
function canCapture(attackerType, defenderType) {
  if (attackerType === 'rock' && defenderType === 'scissors') return true;
  if (attackerType === 'scissors' && defenderType === 'paper') return true;
  if (attackerType === 'paper' && defenderType === 'rock') return true;
  return false;
}

// Tính toán các nước đi hợp lệ cho 1 quân cờ (8 hướng)
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

    // Kiểm tra nằm trong phạm vi bàn cờ 9x9
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      const targetPiece = gameState.board[nr][nc];

      if (!targetPiece) {
        // Ô trống: Di chuyển tự do
        moves.push({ r: nr, c: nc, isAttack: false });
      } else if (targetPiece.player === currentPiece.player) {
        // Cùng quân ta: Chặn đường, không đi được
        continue;
      } else {
        // Quân đối phương
        if (targetPiece.type === currentPiece.type) {
          // Cùng loại: Chặn nhau, không ăn được
          continue;
        } else if (canCapture(currentPiece.type, targetPiece.type)) {
          // Khác loại và khắc chế: Được phép ăn quân
          moves.push({ r: nr, c: nc, isAttack: true });
        }
      }
    }
  }

  return moves;
}

// Đếm số lượng quân của mỗi bên
function getPieceCounts() {
  const counts = {
    p1: { rock: 0, paper: 0, scissors: 0, total: 0 },
    p2: { rock: 0, paper: 0, scissors: 0, total: 0 }
  };

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = gameState.board[r][c];
      if (piece) {
        counts[piece.player][piece.type]++;
        counts[piece.player].total++;
      }
    }
  }
  return counts;
}

// Kiểm tra 2 điều kiện thắng
function checkWinCondition() {
  // 1. Kiểm tra đưa quân vào ô căn cứ
  // Ô a1 tương ứng với [0][0]
  const a1Piece = gameState.board[0][0];
  if (a1Piece && a1Piece.player === 'p2') {
    gameState.status = 'gameover';
    gameState.winner = 'p2';
    gameState.winReason = 'Người chơi 2 đã đưa quân vào căn cứ a1!';
    return;
  }

  // Ô i9 tương ứng với [8][8]
  const i9Piece = gameState.board[8][8];
  if (i9Piece && i9Piece.player === 'p1') {
    gameState.status = 'gameover';
    gameState.winner = 'p1';
    gameState.winReason = 'Người chơi 1 đã đưa quân vào căn cứ i9!';
    return;
  }

  // 2. Kiểm tra ăn sạch 1 loại quân của đối phương
  const counts = getPieceCounts();

  // Kiểm tra P2 bị tuyệt chủng loại quân nào không (P1 thắng)
  if (counts.p2.rock === 0 || counts.p2.paper === 0 || counts.p2.scissors === 0) {
    gameState.status = 'gameover';
    gameState.winner = 'p1';
    gameState.winReason = 'Người chơi 1 thắng vì đối phương đã bị tiêu diệt sạch 1 loại quân!';
    return;
  }

  // Kiểm tra P1 bị tuyệt chủng loại quân nào không (P2 thắng)
  if (counts.p1.rock === 0 || counts.p1.paper === 0 || counts.p1.scissors === 0) {
    gameState.status = 'gameover';
    gameState.winner = 'p2';
    gameState.winReason = 'Người chơi 2 thắng vì đối phương đã bị tiêu diệt sạch 1 loại quân!';
    return;
  }
}

// Thực thi nước đi từ (fromR, fromC) tới (toR, toC)
function executeMove(fromR, fromC, toR, toC) {
  const movingPiece = gameState.board[fromR][fromC];
  gameState.board[toR][toC] = movingPiece;
  gameState.board[fromR][fromC] = null;

  // Xóa chọn ô
  gameState.selectedSquare = null;
  gameState.validMoves = [];

  // Kiểm tra thắng thua
  checkWinCondition();

  // Đổi lượt nếu game chưa kết thúc
  if (gameState.status === 'playing') {
    gameState.turn = gameState.turn === 'p1' ? 'p2' : 'p1';
  }

  render();
}

// Xử lý khi click vào 1 ô trên bàn cờ
function onCellClick(r, c) {
  if (gameState.status === 'gameover') return;

  const clickedPiece = gameState.board[r][c];

  // Nếu đang có ô được chọn
  if (gameState.selectedSquare) {
    const isMoveTarget = gameState.validMoves.find(m => m.r === r && m.c === c);

    if (isMoveTarget) {
      // Thực hiện nước đi
      executeMove(gameState.selectedSquare.r, gameState.selectedSquare.c, r, c);
      return;
    }

    // Nếu bấm lại vào chính quân đó -> Hủy chọn
    if (gameState.selectedSquare.r === r && gameState.selectedSquare.c === c) {
      gameState.selectedSquare = null;
      gameState.validMoves = [];
      render();
      return;
    }
  }

  // Chọn quân mới (phải là quân của người đang đến lượt)
  if (clickedPiece && clickedPiece.player === gameState.turn) {
    gameState.selectedSquare = { r, c };
    gameState.validMoves = getValidMoves(r, c);
    render();
  }
}

// Render toàn bộ giao diện dựa trên State
function render() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');

      // Đánh dấu ô đặc biệt
      if (r === 0 && c === 0) cell.classList.add('base-a1');
      if (r === 8 && c === 8) cell.classList.add('base-i9');

      // Tọa độ cờ (a1, i9...)
      const coordSpan = document.createElement('span');
      coordSpan.className = 'cell-coord';
      coordSpan.textContent = `${COLS[c]}${r + 1}`;
      cell.appendChild(coordSpan);

      // Highlight ô đang chọn
      if (gameState.selectedSquare && gameState.selectedSquare.r === r && gameState.selectedSquare.c === c) {
        cell.classList.add('selected');
      }

      // Highlight nước đi hợp lệ
      const moveOpt = gameState.validMoves.find(m => m.r === r && m.c === c);
      if (moveOpt) {
        cell.classList.add(moveOpt.isAttack ? 'valid-attack' : 'valid-move');
      }

      // Vẽ quân cờ nếu có
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

  // Cập nhật thông tin UI
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
    turnEl.innerHTML = `<strong>KẾT THÚC TRẬN ĐẤU</strong>`;
    msgEl.innerHTML = `<span style="color: #dc2626;">🏆 ${gameState.winReason}</span>`;
  } else {
    const turnText = gameState.turn === 'p1' ? 'Người chơi 1 (Đỏ)' : 'Người chơi 2 (Xanh)';
    turnEl.innerHTML = `Lượt chơi: <strong>${turnText}</strong>`;
    msgEl.textContent = gameState.selectedSquare ? 'Chọn ô đến để di chuyển hoặc ăn quân' : 'Chọn một quân cờ để đi';
  }
}

// Nút chơi lại
document.getElementById('btn-restart').addEventListener('click', () => {
  initBoardSetup();
  render();
});

// Khởi chạy khi load trang
initBoardSetup();
render();