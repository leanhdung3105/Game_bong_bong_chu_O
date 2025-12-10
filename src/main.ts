import Phaser from 'phaser';
import './style.css';
import GameScene from './scenes/GameScene';
import EndGameScene from './scenes/EndgameScene';

declare global {
    interface Window {
        gameScene: any;
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    
    // Màu nền trong suốt
    backgroundColor: 'transparent',
    transparent: true,
    
    // Width/Height ban đầu (sẽ bị override bởi RESIZE, nhưng cần khai báo)
    width: '100%',
    height: '100%',
    
    scene: [GameScene, EndGameScene],
    
    scale: {
        // --- SỬA QUAN TRỌNG ĐỂ HẾT LETTERBOX ---
        // 1. Dùng RESIZE: Canvas sẽ luôn to bằng màn hình thiết bị
        mode: Phaser.Scale.RESIZE,
        
        // 2. Tắt autoCenter: Vì đã tràn màn hình rồi thì không cần căn giữa nữa
        autoCenter: Phaser.Scale.NO_CENTER,
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

// --- Logic Responsive (Giữ nguyên) ---
function handleResize() {
    const rotateMsg = document.getElementById('rotate-msg');
    const resetBtn = document.getElementById('btn-reset');
    if (!rotateMsg) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (h > w) {
        // Màn dọc
        rotateMsg.style.display = 'flex';
        game.scene.scenes.forEach(s => { if (s.scene.isActive()) s.scene.pause(); });
        if (resetBtn) resetBtn.style.display = 'none';
    } else {
        // Màn ngang
        rotateMsg.style.display = 'none';
        game.scene.scenes.forEach(s => { if (s.scene.isPaused()) s.scene.resume(); });
        
        // Scale nút
        if (resetBtn) {
            const btnHeight = h * 0.12; 
            const finalSize = Math.min(Math.max(btnHeight, 60), 140);
            resetBtn.style.width = `${finalSize}px`;
            resetBtn.style.height = 'auto';
            if (resetBtn.dataset.visible === 'true') resetBtn.style.display = 'block';
        }
    }
}

export function showGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (reset) {
        reset.dataset.visible = 'true';
        if (window.innerWidth > window.innerHeight) reset.style.display = 'block';
    }
}

export function hideGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (reset) {
        reset.dataset.visible = 'false';
        reset.style.display = 'none';
    }
}

(window as any).showGameButtonsWrapper = showGameButtons;
(window as any).hideGameButtonsWrapper = hideGameButtons;

window.addEventListener('load', handleResize);
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => setTimeout(handleResize, 300));

const btnReset = document.getElementById('btn-reset');
if (btnReset) {
    btnReset.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.gameScene && typeof window.gameScene.restartLevel === 'function') {
            window.gameScene.restartLevel();
        }
    });
}