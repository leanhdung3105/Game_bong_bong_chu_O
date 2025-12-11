import Phaser from 'phaser';
import { showGameButtons, hideGameButtons } from '../main';

// Định nghĩa Interface nếu muốn mở rộng Level sau này
interface GameState {
    score: number;
    maxScore: number;
    isPlaying: boolean;
}

export default class GameScene extends Phaser.Scene {
    // --- PROPERTIES ---
    private bg!: Phaser.GameObjects.Image;
    private boy!: Phaser.GameObjects.Sprite;
    private hand!: Phaser.GameObjects.Sprite;
    
    // UI Elements
    private scoreContainer!: Phaser.GameObjects.Container;
    private barFill!: Phaser.GameObjects.Graphics;
    private iconO!: Phaser.GameObjects.Container;
    
    // Logic Variables
    private state: GameState = { score: 0, maxScore: 2, isPlaying: false };
    private currentBarWidth: number = 0;
    private spawnTimer?: Phaser.Time.TimerEvent;

    // Config Assets
    private balloonColors = ['red', 'blue', 'green', 'yellow', 'purple'];
    private items = ['grape', 'bee', 'flower', 'stonke', 'dog', 'letter_o', 'cow', 'rabbit', 'whistle'];

    constructor() {
        super('GameScene');
    }

    // --- 1. HELPER METHODS (Responsive) ---
    // Thay thế cho logic handleResize phức tạp cũ
    private getW() { return this.scale.width; }
    private getH() { return this.scale.height; }
    private pctX(p: number) { return this.getW() * p; }
    private pctY(p: number) { return this.getH() * p; }

    // --- 2. LIFECYCLE: INIT & PRELOAD ---
    init() {
        this.state = { score: 0, maxScore: 10, isPlaying: false };
        this.currentBarWidth = 0;
    }

    preload() {
        // Load Assets (Giữ nguyên từ code cũ)
        this.load.image('background', 'assets/images/bg.webp');
        this.load.image('boy1', 'assets/images/boy1.webp');
        this.load.image('boy2', 'assets/images/boy2.webp');
        this.load.image('banner', 'assets/images/banner.webp');
        this.load.image('hand', 'assets/images/hand.webp');
        this.load.image('popup_win', 'assets/images/popup_win.webp');
        
        // Audio
        this.load.audio('instruction', 'assets/audio/instruction.ogg');
        this.load.audio('wrong', 'assets/audio/wrong.ogg');
        this.load.audio('pop', 'assets/audio/tieng_no.ogg');

        // Loop load items & balloons
        this.balloonColors.forEach(c => this.load.image(`balloon_${c}`, `assets/images/balloon_${c}.webp`));
        this.items.forEach(i => {
            this.load.image(`item_${i}`, `assets/images/${i}.webp`);
            this.load.audio(`sound_${i}`, `assets/audio/${i}.ogg`);
        });
    }

    // --- 3. CREATE UI & SCENE ---
    create() {
        (window as any).gameScene = this;
        
        this.createBackground();
        this.createBanner();
        this.createBoy();
        this.createScoreBar();

        // Bắt đầu Tutorial
        this.startTutorial();

        showGameButtons();
    }

    // Tách nhỏ các hàm create để code gọn hơn
    private createBackground() {
        const w = this.getW();
        const h = this.getH();
        this.bg = this.add.image(w / 2, h / 2, 'background').setOrigin(0.5);
        
        // Logic Cover (Tràn viền)
        const scale = Math.max(w / this.bg.width, h / this.bg.height);
        this.bg.setScale(scale);
    }

    private createBanner() {
        // Đặt banner ở 10% chiều cao màn hình
        const banner = this.add.image(this.pctX(0.5), this.pctY(0.1), 'banner');
        // Scale banner theo chiều rộng màn hình (ví dụ 60% chiều rộng)
        const scaleFactor = (this.getW() * 0.6) / banner.width;
        banner.setScale(scaleFactor);

        this.add.text(this.pctX(0.5), this.pctY(0.1), 'BÉ HÃY CHỌN QUẢ BÓNG CÓ HÌNH NHÉ!', {
            fontSize: `${Math.round(this.getH() * 0.04)}px`, // Font size responsive
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    private createBoy() {
        // Tạo animation nếu chưa có
        if (!this.anims.exists('run')) {
            this.anims.create({
                key: 'run',
                frames: [{ key: 'boy1' }, { key: 'boy2' }],
                frameRate: 6,
                repeat: -1
            });
        }
        
       // 2. Tạo Sprite
        // pctX(0.2): Vị trí ngang (20% màn hình từ trái sang)
        // pctY(0.9): Vị trí dọc (Chân chạm đất ở 80% màn hình)
        this.boy = this.add.sprite(this.pctX(0.2), this.pctY(0.9), 'boy1');
        
        // --- BƯỚC QUAN TRỌNG: GHIM CHÂN ---
        this.boy.setOrigin(0.5, 1); 

        // --- BƯỚC SỬA LỖI GIÃN HÌNH ---
        
        // A. Tính chiều cao mong muốn (35% chiều cao màn hình)
        const targetHeight = this.getH() * 0.35; 

        // B. Tính ra tỉ lệ Scale chuẩn
        // (Chỉ quan tâm chiều cao, không quan tâm chiều rộng màn hình)
        const scale = targetHeight / this.boy.height;

        // C. Áp dụng tỉ lệ này cho CẢ HAI CHIỀU
        // (Đây là mấu chốt: scaleX và scaleY phải GIỐNG HỆT NHAU)
        this.boy.setScale(scale, scale); 

        // --- LƯU Ý CỰC KỲ QUAN TRỌNG ---
        // Tuyệt đối KHÔNG được dùng dòng lệnh dưới đây nữa (hãy xóa nó đi nếu còn):
        // this.boy.setDisplaySize(...); 
        
        // 3. Chạy animation
        this.boy.play('run');
    }

    private createScoreBar() {
        const w = this.getW();
        const barWidth = w * 0.5; // Thanh bar dài 50% màn hình
        const barHeight = this.getH() * 0.06;

        this.scoreContainer = this.add.container(this.pctX(0.5), this.pctY(0.9));

        // Nền bar
        const bgBar = this.add.graphics();
        bgBar.fillStyle(0xCCCCCC, 1);
        bgBar.fillRoundedRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, barHeight / 2);

        this.barFill = this.add.graphics();
        
        // Icon tròn
        this.iconO = this.add.container(-barWidth / 2, 0);
        const circleSize = barHeight * 0.8;
        const circle = this.add.circle(0, 0, circleSize, 0xFFFFFF).setStrokeStyle(3, 0xFF4444);
        const text = this.add.text(0, 0, 'O', { 
            fontSize: `${Math.round(circleSize)}px`, 
            color: '#FF4444', 
            fontFamily: 'Arial', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        this.iconO.add([circle, text]);
        this.scoreContainer.add([bgBar, this.barFill, this.iconO]);

        // Lưu thông số để dùng khi update điểm
        this.scoreContainer.setData('maxWidth', barWidth);
        this.scoreContainer.setData('height', barHeight);
    }

    // --- 4. GAMEPLAY LOGIC ---

    startTutorial() {
        try { this.sound.play('instruction'); } catch {}

        // Tạo bóng tutorial ở giữa màn hình
        const balloonContainer = this.createBalloonContainer('balloon_yellow', 'item_stonke');
        balloonContainer.setPosition(this.pctX(0.5), this.pctY(0.4));
        
        // Tay chỉ dẫn
        this.hand = this.add.sprite(this.pctX(0.55), this.pctY(0.55), 'hand');
        this.hand.setDisplaySize(this.getW() * 0.08, this.getW() * 0.08); // Scale tay tương đối

        // Animation tay
        this.tweens.add({
            targets: this.hand,
            x: this.pctX(0.52),
            y: this.pctY(0.45),
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Click event cho tutorial
        const hitArea = balloonContainer.getAt(0) as Phaser.GameObjects.Sprite; // Lấy cái bóng
        hitArea.once('pointerdown', () => {
            balloonContainer.destroy();
            this.hand.destroy();
            try { this.sound.play('sound_stonke'); } catch {}
            
            // Bắt đầu game chính thức
            this.state.isPlaying = true;
            this.startGameLoop();
        });
    }

    startGameLoop() {
        // Spawn bóng mỗi giây
        this.spawnTimer = this.time.addEvent({
            delay: 1000,
            callback: this.spawnBalloon,
            callbackScope: this,
            loop: true
        });
    }

    spawnBalloon() {
        if (!this.state.isPlaying) return;

        // Random màu và item
        const color = Phaser.Utils.Array.GetRandom(this.balloonColors);
        const hasItem = Math.random() < 0.6;
        let itemName = null;
        if (hasItem) itemName = Phaser.Utils.Array.GetRandom(this.items);

        const container = this.createBalloonContainer(`balloon_${color}`, hasItem ? `item_${itemName}` : null);
        
        // Vị trí xuất phát: Random X (trừ lề 10%), Y ở dưới đáy màn hình
        const startX = Phaser.Math.Between(this.getW() * 0.1, this.getW() * 0.9);
        const startY = this.getH() + 200;
        
        container.setPosition(startX, startY);

        // Hiệu ứng bay lên bằng Tween (thay vì Physics để mượt hơn trên mọi màn hình)
        this.tweens.add({
            targets: container,
            y: -200, // Bay quá đầu màn hình
            duration: Phaser.Math.Between(4000, 6000), // Tốc độ ngẫu nhiên
            ease: 'Sine.easeInOut',
            onComplete: () => {
                container.destroy();
            }
        });

        // Xử lý click
        const balloonSprite = container.getAt(0) as Phaser.GameObjects.Sprite;
        balloonSprite.on('pointerdown', () => {
            if (hasItem) {
                this.handleCorrect(container, itemName as string);
            } else {
                this.handleWrong(container);
            }
        });
    }

    createBalloonContainer(balloonKey: string, itemKey: string | null) {
        const container = this.add.container(0, 0);
        const baseSize = this.getH() * 0.2; // Chiều cao mong muốn (20% màn hình)

        // --- SỬA PHẦN BÓNG ---
        const balloon = this.add.sprite(0, 0, balloonKey);
        
        // Cách 1: Tính scale dựa trên chiều cao, chiều rộng sẽ tự đi theo
        const scale = baseSize / balloon.height;
        balloon.setScale(scale); 
        
        // (Hoặc Cách 2 nếu bạn vẫn muốn dùng setDisplaySize: 
        // balloon.setDisplaySize(baseSize * (balloon.width / balloon.height), baseSize); 
        // nhưng cách setScale gọn hơn)

        balloon.setInteractive();
        container.add(balloon);

        // --- SỬA PHẦN ITEM (Để item cũng không bị méo) ---
        if (itemKey) {
            const item = this.add.sprite(0, -baseSize * 0.1, itemKey);
            
            // Item chỉ nên to bằng 50% quả bóng
            const targetItemHeight = baseSize * 0.5;
            const itemScale = targetItemHeight / item.height;
            item.setScale(itemScale);

            container.add(item);
        }

        return container;
    }

    handleWrong(container: Phaser.GameObjects.Container) {
        try { this.sound.play('wrong'); } catch {}
        
        // Hiệu ứng rung lắc báo sai
        this.tweens.add({
            targets: container,
            x: '+=10',
            duration: 50,
            yoyo: true,
            repeat: 3
        });
    }

    handleCorrect(container: Phaser.GameObjects.Container, itemName: string) {
        // Tắt tương tác để tránh click đúp
        container.each((child: any) => { if(child.disableInteractive) child.disableInteractive(); });

        try { this.sound.play(`sound_${itemName}`); } catch {}
        
        // Hiệu ứng nổ/biến mất
        this.tweens.add({
            targets: container,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            duration: 200,
            onComplete: () => container.destroy()
        });

        this.increaseScore();
    }

    increaseScore() {
        if (this.state.score < this.state.maxScore) {
            this.state.score++;
            this.updateScoreBar();
        }
    }

    updateScoreBar() {
        const maxWidth = this.scoreContainer.getData('maxWidth');
        const height = this.scoreContainer.getData('height');
        
        const ratio = this.state.score / this.state.maxScore;
        const newWidth = maxWidth * ratio;
        const startX = -maxWidth / 2;
        
        // Tween thanh điểm chạy mượt
        this.tweens.add({
            targets: { val: this.currentBarWidth },
            val: newWidth,
            duration: 300,
            onUpdate: (_tween: any, target: any) => {
                this.barFill.clear();
                this.barFill.fillStyle(0x4CAF50, 1);
                this.barFill.fillRoundedRect(startX, -height / 2, target.val, height, height / 2);
                this.iconO.x = startX + target.val;
            },
            onComplete: () => {
                this.currentBarWidth = newWidth;
                if (this.state.score >= this.state.maxScore) {
                    this.winGame();
                }
            }
        });
    }

    winGame() {
        this.state.isPlaying = false;
        if (this.spawnTimer) this.spawnTimer.remove();
        
        hideGameButtons();
        // Delay chút rồi chuyển scene
        this.time.delayedCall(500, () => {
             this.scene.start('EndGameScene'); // Hoặc EndScene tùy config router của bạn
        });
    }

    restartLevel() {
        this.sound.stopAll();
        this.scene.restart();
    }
}