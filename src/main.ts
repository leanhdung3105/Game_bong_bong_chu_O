import Phaser from 'phaser';
import './style.css';
import GameScene from './scenes/GameScene';
import EndgameScene from './scenes/EndgameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 1080,
  parent: 'game-container',
  backgroundColor: '#ffffff',
  scene: [GameScene, EndgameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    // SỬA: Tắt autoCenter để CSS Flexbox bên ngoài tự lo
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

new Phaser.Game(config);

function resizeGame() {
    const gameDiv = document.getElementById('game-container');
    if (!gameDiv) return;

    // SỬA: Dùng document.documentElement.clientWidth để lấy kích thước chuẩn hơn, trừ thanh cuộn
    const windowWidth = document.documentElement.clientWidth;
    const windowHeight = document.documentElement.clientHeight;

    if (windowHeight > windowWidth) {
        // Màn hình dọc (Mobile)
        gameDiv.style.width = `${windowHeight}px`;
        gameDiv.style.height = `${windowWidth}px`;
        gameDiv.style.transform = 'translate(-50%, -50%) rotate(90deg)';
    } else {
        // Màn hình ngang (PC/Tablet)
        gameDiv.style.width = `${windowWidth}px`;
        gameDiv.style.height = `${windowHeight}px`;
        gameDiv.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    }
}
export function showGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (reset) reset.style.display = 'block';
}

export function hideGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (reset) reset.style.display = 'none';
}

window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);
// Orientation change đôi khi cần delay để trình duyệt cập nhật xong width/height
window.addEventListener('orientationchange', () => {
    setTimeout(resizeGame, 300);
});

resizeGame();