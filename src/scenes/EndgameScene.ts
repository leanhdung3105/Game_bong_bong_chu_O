import Phaser from 'phaser';
import { hideGameButtons } from '../main'; 

export default class EndGameScene extends Phaser.Scene {
    private bg!: Phaser.GameObjects.Image;
    private contentContainer!: Phaser.GameObjects.Container;
    private containerEl: HTMLElement | null = null;
    private confettiEvent?: Phaser.Time.TimerEvent;
    
    // Kích thước chuẩn thiết kế
    private readonly DESIGN_W = 1920;
    private readonly DESIGN_H = 1080;

    constructor() { super('EndGameScene'); }

    private clearDimBackground() {
        if (this.containerEl) this.containerEl.classList.remove('dim-overlay');
    }

    preload() {
        this.load.image('background', 'assets/images/bg.webp');
        this.load.image('banner_congrat', 'assets/images/popup_win.webp');
        this.load.image('btn_replay_inner', 'assets/images/btn_replay.webp'); 
        this.load.image('btn_exit_inner', 'assets/images/btn_exit.webp');
        this.load.audio('complete', 'assets/audio/complete.ogg');
        this.load.audio('fireworks', 'assets/audio/fireworks.ogg');
        this.load.audio('applause', 'assets/audio/applause.ogg');
        this.load.audio('sfx_click', 'assets/audio/click.ogg');
    }

    create() {
        
        // 1. BG TRÀN VIỀN
        this.bg = this.add.image(0, 0, 'background').setOrigin(0.5);
        
        // 2. CONTAINER NỘI DUNG (Sẽ được scale fit màn hình)
        this.contentContainer = this.add.container(0, 0);

        (this.scene.get('GameScene') as any)?.stopAllVoices?.();
        this.sound.play('complete');
        this.containerEl = document.getElementById('game-container');
        if (this.containerEl) this.containerEl.classList.add('dim-overlay');

        this.time.delayedCall(2000, () => {
            this.sound.play('fireworks');
            this.sound.play('applause');
        });
        const w = this.DESIGN_W;
        const h = this.DESIGN_H;

        // Banner (Khung xanh)
        const banner = this.add.image(w/2, h/2 - h * 0.12, 'banner_congrat')
            .setOrigin(0.5)
            .setDepth(100)
            .setDisplaySize(w * 0.9, h * 0.9); 
            
        this.contentContainer.add(banner);
        
        // 2. Độ cao của nút (Tính từ tâm màn hình xuống dưới)
        const btnScale = Math.min(w, h) / 1280;
        const spacing = 250 * btnScale;
        
        // 3. Nút Replay (Bên trái)
        const replayBtn = this.add.image(w / 2 - spacing, h / 2 + h * 0.2, 'btn_replay_inner')
            .setOrigin(0.5)
            .setScale(btnScale)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });
        
        replayBtn.on('pointerdown', () => {
            this.sound.stopAll();
            this.clearDimBackground();
            this.stopConfetti();
            this.scene.stop('EndGameScene');
            this.scene.start('GameScene');
        });

        // 4. Nút Exit (Bên phải)
        const exitBtn = this.add.image(w / 2 + spacing, h / 2 + h * 0.2, 'btn_exit_inner')
            .setOrigin(0.5)
            .setScale(btnScale)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });

        exitBtn.on('pointerdown', () => {
            this.sound.play('sfx_click');
            this.clearDimBackground();
            this.stopConfetti();
        });

        // Hover effect (nếu cần trên desktop)
        [replayBtn, exitBtn].forEach((btn) => {
            btn.on('pointerover', () => btn.setScale(btnScale * 1.1));
            btn.on('pointerout', () => btn.setScale(btnScale));
        });
        
        this.contentContainer.add([replayBtn, exitBtn]);
        hideGameButtons();
        this.createConfettiEffect();
        
        // 3. KÍCH HOẠT RESIZE
        this.handleResize({ width: this.scale.width, height: this.scale.height });
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize: { width: number, height: number }) {
        const w = gameSize.width;
        const h = gameSize.height;

        // BG Cover (Luôn full màn hình)
        this.bg.setPosition(w / 2, h / 2);
        this.bg.setScale(Math.max(w / this.bg.width, h / this.bg.height));

        // Content Fit (Luôn nằm gọn ở giữa, giữ tỉ lệ chuẩn)
        const scale = Math.min(w / this.DESIGN_W, h / this.DESIGN_H);
        this.contentContainer.setScale(scale);
        this.contentContainer.x = (w - this.DESIGN_W * scale) / 2;
        this.contentContainer.y = (h - this.DESIGN_H * scale) / 2;
    }
    
    // ... (Giữ nguyên phần Confetti code bên dưới) ...
    private createConfettiEffect(): void {
        const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181, 0xaa96da];
        const shapes: Array<'circle' | 'rect'> = ['circle', 'rect'];
        this.confettiEvent = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.scene.isActive()) return;
                // Lấy chiều rộng thực tế màn hình để pháo giấy rơi khắp nơi
                const currentW = this.scale.width; 
                for (let i = 0; i < 3; i++) {
                    this.createConfettiPiece(Phaser.Math.Between(0, currentW), -20, Phaser.Utils.Array.GetRandom(colors), Phaser.Utils.Array.GetRandom(shapes));
                }
            },
            loop: true,
        });
    }

    private createConfettiPiece(x: number, y: number, color: number, shape: 'circle' | 'rect'): void {
        let confetti: any;
        if (shape === 'circle') confetti = this.add.circle(x, y, Phaser.Math.Between(4, 8), color, 1);
        else confetti = this.add.rectangle(x, y, Phaser.Math.Between(6, 12), Phaser.Math.Between(10, 20), color, 1);
        
        confetti.setDepth(999);
        confetti.setRotation((Phaser.Math.Between(0, 360) * Math.PI) / 180);
        
        this.tweens.add({
            targets: confetti, 
            y: this.scale.height + 50, 
            x: x + Phaser.Math.Between(-100, 100),
            rotation: confetti.rotation + Phaser.Math.Between(2, 4) * Math.PI, 
            duration: Phaser.Math.Between(3000, 5000),
            onComplete: () => confetti.destroy(),
        });
    }

    private stopConfetti(): void {
        if (this.confettiEvent) {
            this.confettiEvent.remove(false);
            this.confettiEvent = undefined;
        }
    }
}