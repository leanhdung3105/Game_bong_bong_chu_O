import Phaser from 'phaser';
import { showGameButtons, hideGameButtons } from '../main'; 

export default class GameScene extends Phaser.Scene {

  // ... (Khai báo biến giữ nguyên) ...
  private boy!: Phaser.GameObjects.Sprite;
  private hand!: Phaser.GameObjects.Sprite;
  private scoreContainer!: Phaser.GameObjects.Container;
  private barFill!: Phaser.GameObjects.Graphics;
  private iconO!: Phaser.GameObjects.Container;
  // Xóa biến bg nếu không dùng trong Phaser nữa

  private score: number = 0;
  private maxScore: number = 10;
  private currentBarWidth: number = 0;
  private readonly BAR_MAX_WIDTH = 800; 
  private readonly BAR_HEIGHT = 50;
  private balloonColors = ['red', 'blue', 'green', 'yellow', 'purple'];
  private items = ['grape', 'bee', 'flower', 'stonke', 'dog', 'letter_o', 'cow', 'rabbit', 'whistle'];

  constructor() { super('GameScene'); }
  init() { this.score = 0; this.currentBarWidth = 0; }

  preload() {
    // Vẫn load background nếu muốn dùng cho EndGameScene hoặc trường hợp khác
    this.load.image('background', 'assets/images/bg.webp');
    // ... load assets khác ...
    this.load.image('boy1', 'assets/images/boy1.webp');
    this.load.image('boy2', 'assets/images/boy2.webp');
    this.load.image('banner', 'assets/images/banner.webp');
    this.load.image('hand', 'assets/images/hand.webp');
    this.load.image('bar_frame', 'assets/images/bar_frame.webp');
    this.load.image('popup_win', 'assets/images/popup_win.webp');
    this.load.image('btn_replay', 'assets/images/btn_replay.webp');
    this.load.image('btn_exit', 'assets/images/btn_exit.webp');
    this.load.audio('instruction', 'assets/audio/instruction.ogg');
    this.load.audio('wrong', 'assets/audio/wrong.ogg');
    this.load.audio('pop', 'assets/audio/tieng_no.ogg');
    this.balloonColors.forEach(c => this.load.image(`balloon_${c}`, `assets/images/balloon_${c}.webp`));
    this.items.forEach(i => { 
      this.load.image(`item_${i}`, `assets/images/${i}.webp`);
      this.load.audio(`sound_${i}`, `assets/audio/${i}.ogg`);
    });
  }

  create() {
    (window as any).gameScene = this;
    const width = this.scale.width; 
    const height = this.scale.height;

    // --- XÓA PHẦN TẠO BACKGROUND Ở ĐÂY ĐỂ DÙNG NỀN CSS TRÀN VIỀN ---
    // (Background ở style.css sẽ luôn cover toàn màn hình)

    // 2. BANNER
    this.add.image(width / 2, height * 0.1, 'banner').setScale(1.2);
    this.add.text(width / 2, height * 0.1, 'BÉ HÃY CHỌN QUẢ BÓNG CÓ HÌNH NHÉ!', {
        fontSize: '32px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    
    // 3. BÉ TRAI
    if (!this.anims.exists('run')) {
        this.anims.create({ key: 'run', frames: [{ key: 'boy1' }, { key: 'boy2' }], frameRate: 6, repeat: -1 });
    }
    this.boy = this.add.sprite(width * 0.15, height * 0.85, 'boy1'); 
    this.boy.setScale(0.7).play('run');

    // 4. THANH ĐIỂM
    this.createScoreBarElements();
    this.scoreContainer.setPosition(width / 2, height * 0.9);

    // 5. TUTORIAL
    this.startTutorial(); 
    
    showGameButtons();
  }

  restartLevel() {
      this.sound.stopAll();
      this.scene.restart();
  }

  // ... (Giữ nguyên các hàm khác: createScoreBarElements, increaseScore, spawnBalloon, startTutorial) ...
  createScoreBarElements() {
      this.scoreContainer = this.add.container(0, 0);
      const startX = -this.BAR_MAX_WIDTH / 2;
      const bgBar = this.add.graphics();
      bgBar.fillStyle(0xCCCCCC, 1);
      bgBar.fillRoundedRect(startX, -this.BAR_HEIGHT / 2, this.BAR_MAX_WIDTH, this.BAR_HEIGHT, 25);
      this.barFill = this.add.graphics();
      this.iconO = this.add.container(startX, 0);
      const circle = this.add.circle(0, 0, 30, 0xFFFFFF).setStrokeStyle(3, 0xFF4444);
      const text = this.add.text(0, 0, 'O', { fontSize: '32px', color: '#FF4444', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
      this.iconO.add([circle, text]);
      this.scoreContainer.add([bgBar, this.barFill, this.iconO]);
      this.scoreContainer.setDepth(100);
  }

  increaseScore() {
      if (this.score < this.maxScore) this.score++;
      const ratio = this.score / this.maxScore;
      const newWidth = this.BAR_MAX_WIDTH * ratio;
      const startX = -this.BAR_MAX_WIDTH / 2;
      const temp = { w: this.currentBarWidth || 0 };
      this.currentBarWidth = newWidth;
      this.tweens.add({
          targets: temp, w: newWidth, duration: 300,
          onUpdate: () => {
              this.barFill.clear();
              this.barFill.fillStyle(0x4CAF50, 1);
              this.barFill.fillRoundedRect(startX, -this.BAR_HEIGHT / 2, temp.w, this.BAR_HEIGHT, 25);
              this.iconO.x = startX + temp.w;
          },
          onComplete: () => {
              if (this.score >= this.maxScore) {
                  hideGameButtons();
                  this.scene.stop('GameScene');
                  this.scene.start('EndGameScene');
              }
          }
      });
  }

  spawnBalloon() {
    const width = this.scale.width;
    const height = this.scale.height;
    const randomX = Phaser.Math.Between(200, width - 200); 
    const container = this.add.container(randomX, height + 150);
    const color = Phaser.Utils.Array.GetRandom(this.balloonColors);
    const balloon = this.add.sprite(0, 0, `balloon_${color}`).setScale(0.8);
    container.add(balloon);
    const hasItem = Math.random() < 0.6;
    let itemName = '';
    if (hasItem) {
        itemName = Phaser.Utils.Array.GetRandom(this.items);
        const itemSprite = this.add.sprite(0, -40, `item_${itemName}`).setScale(0.9);
        container.add(itemSprite);
    }
    this.physics.world.enable(container);
    (container.body as Phaser.Physics.Arcade.Body).setVelocityY(Phaser.Math.Between(-200, -400));
    balloon.setInteractive();
    balloon.on('pointerdown', () => {
        container.destroy();
        if (hasItem) {
            this.increaseScore();
            try { this.sound.play(`sound_${itemName}`); } catch { /* ignore sound error */ }
        } else {
            try { this.sound.play('wrong'); } catch { /* ignore sound error */ }
        }
    });
    this.events.on('update', () => {
        if (container.active && container.y < -200) container.destroy();
    });
  }

  startTutorial() {
      const width = this.scale.width;
      const height = this.scale.height;
      try { this.sound.play('instruction'); } catch { /* ignore sound error */ }
      const container = this.add.container(width / 2, height * 0.4);
      const balloon = this.add.sprite(0, 0, 'balloon_yellow').setScale(0.8);
      const item = this.add.sprite(0, -40, 'item_stonke').setScale(0.9);
      container.add([balloon, item]);
      this.hand = this.add.sprite(width / 2 + 60, height * 0.4 + 100, 'hand').setScale(1);
      this.hand.setDepth(200);
      this.tweens.add({ targets: this.hand, x: width / 2 + 30, y: height * 0.4 + 50, duration: 800, yoyo: true, repeat: -1 });
      balloon.setInteractive();
      balloon.on('pointerdown', () => {
          container.destroy();
          this.hand.destroy();
          try { this.sound.play('sound_stonke'); } catch { /* ignore sound error */ }
          this.time.addEvent({ delay: 1000, callback: this.spawnBalloon, callbackScope: this, loop: true });
      });
  }
}