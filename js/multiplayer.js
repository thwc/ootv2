/**
 * js/multiplayer.js - Bản tối ưu tốc độ phản hồi
 */
import { playhtml } from "https://esm.sh/playhtml@latest";

// Lấy mã phòng từ URL hoặc fallback về phòng mặc định
function getRoomId() {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room');
  if (room) {
    const inputEl = document.getElementById('room-id');
    if (inputEl) inputEl.value = room;
    return room;
  }
  return 'ott-phong-1';
}

const activeRoom = getRoomId();

// 1. Đăng ký thuộc tính can-sync-game
playhtml.custom('can-sync-game', {
  defaultData: {
    syncState: gameState
  },

  updateElement: (element, data) => {
    // Khi nhận được dữ liệu (kể cả lúc vừa vào phòng)
    const msgEl = document.getElementById('game-message');
    
    if (data && data.syncState) {
      applyRemoteState(data.syncState);
    }

    // Đổi ngay thông báo nếu đang bị kẹt chữ "Đang kết nối..."
    if (msgEl && msgEl.textContent.includes('Đang kết nối')) {
      msgEl.textContent = 'Đã kết nối phòng thành công!';
    }
  }
});

// 2. Khởi tạo kết nối với Room
try {
  playhtml.init({
    room: activeRoom
  });
  
  // Thông báo sẵn sàng
  setTimeout(() => {
    const msgEl = document.getElementById('game-message');
    if (msgEl && msgEl.textContent.includes('Đang kết nối')) {
      msgEl.textContent = 'Phòng đã sẵn sàng. Hãy chọn quân để đi!';
    }
  }, 1000);
} catch (err) {
  console.error("Lỗi kết nối playhtml:", err);
  document.getElementById('game-message').textContent = 'Lỗi kết nối server, vui lòng thử lại.';
}

// 3. Đẩy state khi có nước đi
window.addEventListener('ott:state-changed', (e) => {
  const syncContainer = document.getElementById('board-sync-container');
  if (syncContainer && typeof syncContainer.setData === 'function') {
    syncContainer.setData({
      syncState: e.detail
    });
  }
});

// 4. Đồng bộ nút Reset bàn cờ
document.getElementById('btn-restart').addEventListener('click', () => {
  initBoardSetup();
  render();
  const syncContainer = document.getElementById('board-sync-container');
  if (syncContainer && typeof syncContainer.setData === 'function') {
    syncContainer.setData({
      syncState: gameState
    });
  }
});

// 5. Điều khiển vai trò (Role Select)
const roleSelect = document.getElementById('role-select');
roleSelect.addEventListener('change', (e) => {
  setPlayerRole(e.target.value);
});
setPlayerRole(roleSelect.value);

// 6. Xử lý nút Chuyển phòng
document.getElementById('btn-join-room').addEventListener('click', () => {
  const roomInput = document.getElementById('room-id').value.trim();
  if (roomInput) {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('room', roomInput);
    window.location.href = nextUrl.toString();
  }
});