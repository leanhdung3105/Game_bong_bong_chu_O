import Phaser from 'phaser';
import { hideGameButtons } from '../main'; 

export default class EndGameScene extends Phaser.Scene {
    private containerEl: HTMLElement | null = null;
    private confettiEvent?: Phaser.Time.TimerEvent;

    constructor() { super('EndGameScene'); }

    private clearDimBackground() {
        if (this.containerEl) {
            this.containerEl.classList.remove('dim-overlay');
        }
    }

    preload() {
        // ... Load assets ...
        this.load.image('banner_congrat', 'assets/images/popup_win.webp');
        this.load.image('btn_replay_inner', 'assets/images/btn_replay.webp'); 
        this.load.image('btn_exit_inner', 'assets/images/btn_exit.webp');
        this.load.audio('complete', 'assets/audio/complete.ogg');
        this.load.audio('fireworks', 'assets/audio/fireworks.ogg');
        this.load.audio('applause', 'assets/audio/applause.ogg');
        this.load.audio('sfx_click', 'assets/audio/click.ogg');
    }

    create() {
        hideGameButtons();
        const w = this.scale.width;
        const h = this.scale.height;

        // Nếu muốn EndGame cũng trong suốt để thấy nền CSS:
        // Không add image 'background'.

        (this.scene.get('GameScene') as any)?.stopAllVoices?.();
        this.sound.play('complete');
        this.containerEl = document.getElementById('game-container');
        if (this.containerEl) this.containerEl.classList.add('dim-overlay');

        this.time.delayedCall(2000, () => {
            this.sound.play('fireworks');
            this.sound.play('applause');
        });

        // Banner
        this.add.image(w / 2, h / 2 - h * 0.05, 'banner_congrat')
            .setOrigin(0.5).setDepth(100).setDisplaySize(w * 0.6, h * 0.7);

        // Nút trong EndGame
        const btnScale = Math.min(w, h) / 1920; 
        const spacing = 350 * btnScale;

        const replayBtn = this.add.image(w / 2 - spacing, h / 2 + h * 0.25, 'btn_replay_inner')
            .setOrigin(0.5).setScale(btnScale * 1.5).setDepth(101).setInteractive({ useHandCursor: true });
        
        replayBtn.on('pointerdown', () => {
            this.sound.stopAll();
            this.clearDimBackground();
            this.stopConfetti();
            this.scene.stop('EndGameScene');
            this.scene.start('GameScene');
        });

        const exitBtn = this.add.image(w / 2 + spacing, h / 2 + h * 0.25, 'btn_exit_inner')
            .setOrigin(0.5).setScale(btnScale * 1.5).setDepth(101).setInteractive({ useHandCursor: true });
        
        // ... (Giữ nguyên phần confetti và hover) ...
        [replayBtn, exitBtn].forEach((btn) => {
            btn.on('pointerover', () => btn.setScale(btnScale * 1.6));
            btn.on('pointerout', () => btn.setScale(btnScale * 1.5));
        });

        this.createConfettiEffect();
    }
    
    // ... (Giữ nguyên code Confetti) ...
    private createConfettiEffect(): void {
        const width = this.cameras.main.width;
        const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181, 0xaa96da];
        const shapes: Array<'circle' | 'rect'> = ['circle', 'rect'];
        this.confettiEvent = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.scene.isActive()) return;
                for (let i = 0; i < 3; i++) {
                    this.createConfettiPiece(Phaser.Math.Between(0, width), -20, Phaser.Utils.Array.GetRandom(colors), Phaser.Utils.Array.GetRandom(shapes));
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
            targets: confetti, y: this.cameras.main.height + 50, x: x + Phaser.Math.Between(-100, 100),
            rotation: confetti.rotation + Phaser.Math.Between(2, 4) * Math.PI, duration: Phaser.Math.Between(3000, 5000),
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