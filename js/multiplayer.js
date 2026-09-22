/**
 * js/multiplayer.js
 * Đồng bộ trạng thái bàn cờ OTTv2 theo thời gian thực qua thư viện playhtml
 */
import { playhtml } from "https://unpkg.com/playhtml@latest";

let syncElementRef = null;

// Lấy phòng từ URL hoặc ô nhập
function getRoomId() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  if (roomFromUrl) {
    document.getElementById('room-id').value = roomFromUrl;
    return roomFromUrl;
  }
  return document.getElementById('room-id').value.trim() || 'ott-room-default';
}

// 1. Đăng ký phần tử đồng bộ tùy biến với playhtml
playhtml.custom('can-sync-game', {
  // Trạng thái mặc định nếu phòng mới hoàn toàn
  defaultData: {
    syncState: gameState
  },

  // Hàm này được playhtml tự động gọi mỗi khi có dữ liệu mới từ máy đối phương
  updateElement: (element, data) => {
    syncElementRef = element;
    if (data && data.syncState) {
      console.log("[Multiplayer] Nhận dữ liệu bàn cờ mới:", data.syncState);
      applyRemoteState(data.syncState);
    }
  }
});

// 2. Khởi tạo kết nối playhtml với phòng đã chọn
const currentRoom = getRoomId();
playhtml.init({
  room: currentRoom
});

// 3. Lắng nghe sự kiện đi quân từ game.js để đẩy lên playhtml
window.addEventListener('ott:state-changed', (e) => {
  const latestState = e.detail;
  const syncContainer = document.getElementById('board-sync-container');
  
  if (syncContainer && syncContainer.setData) {
    // Gọi setData() của playhtml để đồng bộ ngay tới các máy khác
    syncContainer.setData({
      syncState: latestState
    });
  }
});

// 4. Xử lý nút "Chơi ván mới" đồng bộ cho cả 2 người
document.getElementById('btn-restart').addEventListener('click', () => {
  initBoardSetup();
  render();
  const syncContainer = document.getElementById('board-sync-container');
  if (syncContainer && syncContainer.setData) {
    syncContainer.setData({
      syncState: gameState
    });
  }
});

// 5. Xử lý chuyển đổi vai trò (Đỏ / Xanh / Khán giả)
const roleSelect = document.getElementById('role-select');
roleSelect.addEventListener('change', (e) => {
  setPlayerRole(e.target.value);
});

// Gán vai trò ban đầu
setPlayerRole(roleSelect.value);

// 6. Xử lý nút "Vào phòng"
document.getElementById('btn-join-room').addEventListener('click', () => {
  const roomName = document.getElementById('room-id').value.trim();
  if (roomName) {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('room', roomName);
    window.location.href = currentUrl.toString();
  }
});