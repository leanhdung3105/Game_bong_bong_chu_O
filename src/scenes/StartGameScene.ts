import Phaser from 'phaser';
import { changeBackground } from './utils/backgroundManager';
import { showGameButtons, hideGameButtons } from '../main';

// Giả sử bạn có file main.ts hoặc tương tự để quản lý âm thanh chung
// import { StopAllSounds } from '../main';

export default class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {

        // Background nền (bầu trời, bóng bay)
        this.load.image('bg_thumb', 'assets/images/bg_thumb.png');

        // Banner tiêu đề (dòng chữ "BÉ CHỌN BÓNG NÀO?")
        this.load.image('banner_start', 'assets/images/bannner_start.png');

        // Hình cậu bé và đám mây
        this.load.image('boy_menu', 'assets/images/boy_menu.png');

        // Nút bắt đầu (Lưu ý tên file có dấu cách như bạn cung cấp)
        this.load.image('button_start', 'assets/images/button start.png');

        // Tải lại âm thanh click từ EndGameScene để dùng lại
        this.load.audio('sfx_click', 'assets/audio/click.mp3');
    }

    create() {

        changeBackground('assets/images/bg_start.png');

        const w = this.scale.width;
        const h = this.scale.height;

        // --- Tính toán tỷ lệ scale chung ---
        // Sử dụng một tỷ lệ cơ sở dựa trên chiều nhỏ nhất của màn hình để đảm bảo
        // các element không bị quá to hoặc quá nhỏ trên các thiết bị khác nhau.
        // Số 1000 là số tham chiếu, bạn có thể điều chỉnh nếu thấy asset bị to/nhỏ.
        const baseScale = Math.min(w, h) / 1000;

        // --- 2. Hình Cậu bé & Đám mây (Trung tâm) ---
        // Đặt ở giữa màn hình
        const boyImage = this.add.image(w / 2, h / 2, 'boy_menu')
            .setOrigin(0.5) 
            .setScale(baseScale * 0.7) // Điều chỉnh số nhân 1.2 để to nhỏ tùy ý
            .setDepth(10)
            .setInteractive({ useHandCursor: true }); 

        // --- 3. Banner Tiêu đề (Phía trên) ---
        // Đặt vị trí Y dựa trên vị trí của cậu bé, dịch lên trên một khoảng
        // 1. Khởi tạo
        const targetY = h / 2 - h * 0.35;
        const banner = this.add.image(w / 2, -300, 'banner_start') // Ở ngoài màn hình trên cao
            .setOrigin(0.5)
            .setScale(baseScale * 0.7)
            .setDepth(20);

        // --- 4. Nút Bắt đầu (Phía dưới) ---
        // Đặt vị trí Y dịch xuống dưới tâm một khoảng
        const startBtn = this.add.image(w / 2, h / 2 + h * 0.4, 'button_start')
            .setOrigin(0.5)
            .setScale(baseScale * 0.6)
            .setDepth(30)
            .setInteractive({ useHandCursor: true });

        // --- TƯƠNG TÁC & HIỆU ỨNG ---

        // TẠO ANIMATION
        // 1. Luôn luôn bay nhè nhẹ
        this.tweens.add({
            targets: boyImage,
            y: boyImage.y - 15,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. Chạy chuỗi hiệu ứng
        this.tweens.add({
            targets: banner,
            y: targetY, // Rơi xuống
            duration: 1500, 
            ease: 'Bounce.easeOut', // Nảy nảy
            onComplete: () => {
                // Rơi xong thì bắt đầu lắc lư mãi mãi
                this.tweens.add({
                    targets: banner,
                    angle: { from: -1, to: 1 }, 
                    duration: 2000, 
                    yoyo: true,
                    repeat: -1, 
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Hiệu ứng "thở" nhẹ cho nút Start để gây chú ý
        this.tweens.add({
            targets: startBtn,
            scale: { value: startBtn.scale * 1.05 }, // Phóng to nhẹ 5%
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Xử lý sự kiện click nút Start
        startBtn.on('pointerdown', () => {
            // Phát âm thanh click
            this.sound.play('sfx_click');

            // Nếu bạn có hàm global để dừng nhạc nền, hãy gọi ở đây (như trong code mẫu của bạn)
            // if (StopAllSounds) StopAllSounds();

            // Chuyển sang màn hình chơi game
            this.scene.start('GameScene');
        });

        // Hiệu ứng hover chuột (tùy chọn)
        startBtn.on('pointerover', () => {
             // Làm sáng nút lên một chút khi di chuột vào
             startBtn.setTint(0xFFFFFF); // Màu gốc
        });

        startBtn.on('pointerout', () => {
             // Trả về màu hơi tối hơn chút khi chuột rời đi (nếu muốn)
             // Hoặc chỉ cần clearTint nếu bạn không muốn hiệu ứng này.
             startBtn.setTint(0xDDDDDD);
        });
        // Đặt tint mặc định hơi tối một chút để khi hover nó sáng lên
        startBtn.setTint(0xDDDDDD);
        hideGameButtons();
    }
}