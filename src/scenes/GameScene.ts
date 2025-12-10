import Phaser from 'phaser';
import { showGameButtons } from '../main'; 
export default class GameScene extends Phaser.Scene {

  private boy!: Phaser.GameObjects.Sprite;
  private hand!: Phaser.GameObjects.Sprite;

  private scoreContainer!: Phaser.GameObjects.Container;
  private barFill!: Phaser.GameObjects.Graphics;
  private iconO!: Phaser.GameObjects.Container;

  private score: number = 0;
  private maxScore: number = 10;
  private currentBarWidth: number = 0;
  
  // Kích thước chuẩn thiết kế (Cố định)
  // private readonly DESIGN_W = 1280;
  // private readonly DESIGN_H = 720;
  private readonly BAR_MAX_WIDTH = 600; 
  private readonly BAR_HEIGHT = 40;

  private balloonColors = ['red', 'blue', 'green', 'yellow', 'purple'];
  private items = ['grape', 'bee', 'flower', 'stonke', 'dog', 'letter_o', 'cow', 'rabbit', 'whistle'];

  constructor() {
    super('GameScene');
  }

  init() {
    this.score = 0;
    this.currentBarWidth = 0;
  }

  preload() { // nạp ảnh vào ram
    this.load.image('background', 'assets/images/bg.webp');
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
    // Luôn lấy kích thước 1280x720 từ config
    const width = this.scale.width; 
    const height = this.scale.height;

    // 1. NỀN
    // this.background = this.add.image(width / 2, height / 2, 'background');
    // this.background.setDisplaySize(width, height);

    // 2. BANNER & CHỮ (Cố định vị trí)

    this.add.image(width / 2, 60, 'banner').setScale(0.8);
    this.add.text(width / 2, 60, 'BÉ HÃY CHỌN QUẢ BÓNG CÓ HÌNH NHÉ!', {
    }).setOrigin(0.5);
    
    // 3. BÉ TRAI
    if (!this.anims.exists('run')) {
        this.anims.create({ key: 'run', frames: [{ key: 'boy1' }, { key: 'boy2' }], frameRate: 6, repeat: -1 });
    }
    // Tính toán vị trí bắt đầu của thanh điểm
    // Container ở giữa (width/2), thanh dài 600px nên bắt đầu từ -300
    this.boy = this.add.sprite(150, height - 150, 'boy1'); 
    this.boy.setScale(0.5).play('run');

    // 4. THANH ĐIỂM
    this.createScoreBarElements();
    this.scoreContainer.setPosition(width / 2, height - 50);

    // 5. TUTORIAL
    this.startTutorial(); 
    // Hiện nút chơi lại khi vào game
    showGameButtons();
  }

  createScoreBarElements() {
      this.scoreContainer = this.add.container(0, 0);
      const startX = -this.BAR_MAX_WIDTH / 2;
      
      const bgBar = this.add.graphics();
      bgBar.fillStyle(0xCCCCCC, 1);
      bgBar.fillRoundedRect(startX, -this.BAR_HEIGHT / 2, this.BAR_MAX_WIDTH, this.BAR_HEIGHT, 15);

      this.barFill = this.add.graphics();
      
      this.iconO = this.add.container(startX, 0);
      const circle = this.add.circle(0, 0, 22, 0xFFFFFF).setStrokeStyle(3, 0xFF4444);
      const text = this.add.text(0, 0, 'O', {
          fontSize: '28px', color: '#FF4444', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);
      
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
              this.barFill.fillRoundedRect(startX, -this.BAR_HEIGHT / 2, temp.w, this.BAR_HEIGHT, 15);
              // Di chuyển icon O
              this.iconO.x = startX + temp.w;
          },
          onComplete: () => {
              if (this.score >= this.maxScore) {
                  this.scene.stop('GameScene');
                  this.scene.start('EndGameScene');
              }
          }
      });
  }

  spawnBalloon() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Vùng sinh bóng: Cách mép 100px
    const randomX = Phaser.Math.Between(100, width - 100); 
    const container = this.add.container(randomX, height + 100);

    const color = Phaser.Utils.Array.GetRandom(this.balloonColors);
    const balloon = this.add.sprite(0, 0, `balloon_${color}`).setScale(0.55);
    container.add(balloon);

    const hasItem = Math.random() < 0.6;
    let itemName = '';
    if (hasItem) {
        itemName = Phaser.Utils.Array.GetRandom(this.items);
        const itemSprite = this.add.sprite(0, -30, `item_${itemName}`).setScale(0.6);
        container.add(itemSprite);
    }

    this.physics.world.enable(container);
    (container.body as Phaser.Physics.Arcade.Body).setVelocityY(Phaser.Math.Between(-150, -300));

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
        if (container.active && container.y < -150) container.destroy();
    });
  }

  startTutorial() {
      const width = this.scale.width;
      const height = this.scale.height;
    try { this.sound.play('instruction'); } catch { /* ignore sound error */ }

      const container = this.add.container(width / 2, height * 0.4);
      const balloon = this.add.sprite(0, 0, 'balloon_yellow').setScale(0.55);
      const item = this.add.sprite(0, -30, 'item_stonke').setScale(0.6);
      container.add([balloon, item]);

      this.hand = this.add.sprite(width / 2 + 50, height * 0.4 + 80, 'hand').setScale(0.8);
      this.hand.setDepth(200);

      this.tweens.add({
          targets: this.hand, x: width / 2 + 30, y: height * 0.4 + 50, duration: 800, yoyo: true, repeat: -1
      });

      balloon.setInteractive();
      balloon.on('pointerdown', () => {
          container.destroy();
          this.hand.destroy();
          try { this.sound.play('sound_stonke'); } catch { /* ignore sound error */ }
          this.time.addEvent({ delay: 1000, callback: this.spawnBalloon, callbackScope: this, loop: true });
      });
  }
}