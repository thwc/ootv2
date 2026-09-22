/**
 * js/multiplayer.js - Chuẩn hóa API playhtml
 */
import { playhtml } from "https://esm.sh/playhtml@latest";

// Lấy mã phòng từ URL hoặc mặc định
function getRoomId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('room') || 'ottv2-room-1';
}

const currentRoom = getRoomId();
const roomInput = document.getElementById('room-id');
if (roomInput) roomInput.value = currentRoom;

let syncHandler = null;

// 1. Đăng ký custom tag TRƯỚC KHI init
playhtml.custom('can-sync-game', {
  defaultData: {
    syncState: null
  },
  updateElement: (element, data) => {
    // Lưu lại handler để chủ động gọi setData khi máy này đi nước cờ
    syncHandler = element;

    if (data && data.syncState && typeof window.applyRemoteState === 'function') {
      console.log("[Multiplayer] Nhận state mới:", data.syncState);
      window.applyRemoteState(data.syncState);
    }

    const msgEl = document.getElementById('game-message');
    if (msgEl && msgEl.textContent.includes('Đang kết nối')) {
      msgEl.textContent = 'Kết nối thành công! Sẵn sàng chơi.';
    }
  }
});

// 2. Khởi tạo playhtml
playhtml.init({
  room: currentRoom
});

// 3. Hàm gửi dữ liệu lên server playhtml
function broadcastState(state) {
  const el = syncHandler || document.getElementById('board-sync-container');
  if (el && typeof el.setData === 'function') {
    el.setData({ syncState: state });
    console.log("[Multiplayer] Đã gửi state lên phòng:", currentRoom);
  } else {
    console.warn("[Multiplayer] Chưa sẵn sàng setData, thử lại sau 100ms...");
    setTimeout(() => {
      if (el && typeof el.setData === 'function') {
        el.setData({ syncState: state });
      }
    }, 100);
  }
}

// 4. Lắng nghe nước đi từ game.js
window.addEventListener('ott:state-changed', (e) => {
  broadcastState(e.detail);
});

// 5. Nút chơi ván mới
document.getElementById('btn-restart').addEventListener('click', () => {
  if (typeof window.initBoardSetup === 'function' && typeof window.render === 'function') {
    window.initBoardSetup();
    window.render();
    broadcastState(window.gameState);
  }
});

// 6. Xử lý phân vai
const roleSelect = document.getElementById('role-select');
if (roleSelect) {
  roleSelect.addEventListener('change', (e) => {
    if (typeof window.setPlayerRole === 'function') {
      window.setPlayerRole(e.target.value);
    }
  });
  if (typeof window.setPlayerRole === 'function') {
    window.setPlayerRole(roleSelect.value);
  }
}

// 7. Xử lý đổi phòng
document.getElementById('btn-join-room').addEventListener('click', () => {
  const newRoom = document.getElementById('room-id').value.trim();
  if (newRoom) {
    const url = new URL(window.location.href);
    url.searchParams.set('room', newRoom);
    window.location.href = url.toString();
  }
});