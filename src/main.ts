import Phaser from 'phaser';
import './style.css';
import GameScene from './scenes/GameScene';
import EndGameScene from './scenes/EndgameScene';

declare global {
    interface Window {
        gameScene: any;
        showGameButtonsWrapper: any;
        hideGameButtonsWrapper: any;
    }
}

// --- 1. CẤU HÌNH GAME (Theo cấu trúc mẫu: FIT, 1280x720) ---
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    scene: [GameScene, EndGameScene],
    backgroundColor: 'transparent',
    scale: {
        mode: Phaser.Scale.FIT,       // Dùng FIT để co giãn giữ tỉ lệ
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    render: {
        pixelArt: false,
        antialias: true,
        transparent: true,
    },
};

const game = new Phaser.Game(config);

// --- 2. XỬ LÝ LOGIC UI & XOAY MÀN HÌNH (Giữ nguyên logic cũ của bạn) ---
function handleOrientationAndScale() {
    const rotateMsg = document.getElementById('rotate-msg');
    const resetBtn = document.getElementById('btn-reset');
    
    // Nếu không có rotateMsg thì không làm gì (tránh lỗi)
    if (!rotateMsg) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Logic kiểm tra xoay màn hình
    if (h > w) {
        // --- MÀN DỌC: Hiện thông báo, Pause Game ---
        rotateMsg.style.display = 'flex';
        
        // Pause tất cả scene đang chạy
        game.scene.scenes.forEach(s => { 
            if (s.scene.isActive()) s.scene.pause(); 
        });
        
        // Ẩn nút reset khi đang hiện thông báo xoay
        if (resetBtn) resetBtn.style.display = 'none';
        
    } else {
        // --- MÀN NGANG: Ẩn thông báo, Resume Game ---
        rotateMsg.style.display = 'none';
        
        // Resume các scene đang bị pause
        game.scene.scenes.forEach(s => { 
            if (s.scene.isPaused()) s.scene.resume(); 
        });
        
        // Logic Scale nút Reset (Giữ nguyên công thức cũ: h * 0.12)
        if (resetBtn) {
            const btnHeight = h * 0.12; 
            const finalSize = Math.min(Math.max(btnHeight, 60), 140);
            
            resetBtn.style.width = `${finalSize}px`;
            resetBtn.style.height = 'auto';
            
            // Chỉ hiện nút nếu trạng thái là 'visible'
            if (resetBtn.dataset.visible === 'true') {
                resetBtn.style.display = 'block';
            }
        }
    }
}

// --- 3. CÁC HÀM HELPER (Export ra để Scene gọi) ---
export function showGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (reset) {
        reset.dataset.visible = 'true'; // Đánh dấu là được phép hiện
        // Chỉ thực sự hiện nếu đang ở màn ngang
        if (window.innerWidth > window.innerHeight) {
            reset.style.display = 'block';
        }
    }
}

export function hideGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (reset) {
        reset.dataset.visible = 'false';
        reset.style.display = 'none';
    }
}

// Gán vào window để HTML hoặc các script khác có thể gọi nếu cần
window.showGameButtonsWrapper = showGameButtons;
window.hideGameButtonsWrapper = hideGameButtons;

// --- 4. SỰ KIỆN (Events) ---
// Gọi hàm xử lý ngay khi load và khi resize/xoay
window.addEventListener('load', handleOrientationAndScale);
window.addEventListener('resize', handleOrientationAndScale);
window.addEventListener('orientationchange', () => setTimeout(handleOrientationAndScale, 300));

// Logic click nút Reset
const btnReset = document.getElementById('btn-reset');
if (btnReset) {
    btnReset.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Gọi vào hàm restartLevel trong GameScene
        if (window.gameScene && typeof window.gameScene.restartLevel === 'function') {
            window.gameScene.restartLevel();
        }
    });
}