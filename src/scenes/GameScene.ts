import Phaser from 'phaser';
import { showGameButtons, hideGameButtons } from '../main'; 

export default class GameScene extends Phaser.Scene {
  // Container chính chứa nội dung game
  private gameContainer!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Image;

  private boy!: Phaser.GameObjects.Sprite;
  private hand!: Phaser.GameObjects.Sprite;
  private scoreContainer!: Phaser.GameObjects.Container;
  private barFill!: Phaser.GameObjects.Graphics;
  private iconO!: Phaser.GameObjects.Container;

  private score: number = 0;
  private maxScore: number = 2;
  private currentBarWidth: number = 0;
  
  // Kích thước chuẩn thiết kế
  private readonly DESIGN_W = 1920;
  private readonly DESIGN_H = 1080;
  
  private readonly BAR_MAX_WIDTH = 800; 
  private readonly BAR_HEIGHT = 50;

  private balloonColors = ['red', 'blue', 'green', 'yellow', 'purple'];
  private items = ['grape', 'bee', 'flower', 'stonke', 'dog', 'letter_o', 'cow', 'rabbit', 'whistle'];

  constructor() { super('GameScene'); }
  init() { this.score = 0; this.currentBarWidth = 0; }

  preload() {
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
    (window as any).gameScene = this;

    // 1. TẠO HÌNH NỀN (Nằm ngoài container để tràn viền)
    this.bg = this.add.image(0, 0, 'background').setOrigin(0.5);

    // 2. TẠO GAME CONTAINER (Chứa tất cả nội dung gameplay)
    this.gameContainer = this.add.container(0, 0);

    // --- THÊM CÁC VẬT THỂ VÀO CONTAINER ---
    // Lưu ý: Tọa độ ở đây tính theo chuẩn 1920x1080 (DESIGN_W x DESIGN_H)
    
    // Banner
    const banner = this.add.image(this.DESIGN_W / 2, this.DESIGN_H * 0.1, 'banner').setScale(1.2);
    const titleText = this.add.text(this.DESIGN_W / 2, this.DESIGN_H * 0.1, 'BÉ HÃY CHỌN QUẢ BÓNG CÓ HÌNH NHÉ!', {
        fontSize: '32px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    this.gameContainer.add([banner, titleText]);
    
    // Boy
    if (!this.anims.exists('run')) {
        this.anims.create({ key: 'run', frames: [{ key: 'boy1' }, { key: 'boy2' }], frameRate: 6, repeat: -1 });
    }
    this.boy = this.add.sprite(this.DESIGN_W * 0.15, this.DESIGN_H * 0.85, 'boy1').setScale(0.7).play('run');
    this.gameContainer.add(this.boy);

    // Thanh điểm
    this.createScoreBarElements(); // Hàm này sẽ add vào container
    this.scoreContainer.setPosition(this.DESIGN_W / 2, this.DESIGN_H * 0.9);

    // Tutorial
    this.startTutorial(); 
    
    // 3. GỌI HÀM RESIZE LẦN ĐẦU
    this.handleResize({ width: this.scale.width, height: this.scale.height });

    // 4. LẮNG NGHE SỰ KIỆN RESIZE
    this.scale.on('resize', this.handleResize, this);
    
    showGameButtons();
  }

  // --- LOGIC SCALE THÔNG MINH ---
  handleResize(gameSize: { width: number, height: number }) {
      const w = gameSize.width;
      const h = gameSize.height;

      // A. Xử lý Background (Cover - Tràn viền)
      this.bg.setPosition(w / 2, h / 2);
      const scaleX = w / this.bg.width;
      const scaleY = h / this.bg.height;
      const scale = Math.max(scaleX, scaleY); // Lấy số lớn hơn để luôn phủ kín
      this.bg.setScale(scale);

      // B. Xử lý Game Container (Fit - Nằm gọn ở giữa)
      // Tính tỉ lệ scale để nội dung 1920x1080 nằm gọn trong màn hình hiện tại
      const contentScale = Math.min(w / this.DESIGN_W, h / this.DESIGN_H);
      
      this.gameContainer.setScale(contentScale);
      
      // Căn giữa container
      // Công thức: (Màn hình - (Kích thước gốc * scale)) / 2
      this.gameContainer.x = (w - this.DESIGN_W * contentScale) / 2;
      this.gameContainer.y = (h - this.DESIGN_H * contentScale) / 2;
  }

  restartLevel() {
      this.sound.stopAll();
      this.scene.restart();
  }

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
      // QUAN TRỌNG: Add container con vào container chính
      this.gameContainer.add(this.scoreContainer);
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
    // Random trong khung chuẩn 1920
    const randomX = Phaser.Math.Between(200, this.DESIGN_W - 200); 
    // Spawn bên dưới màn hình chuẩn
    const container = this.add.container(randomX, this.DESIGN_H + 150);

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

    // Add bóng vào game container chính để nó cũng được scale theo
    this.gameContainer.add(container);

    // Physics cần enable thủ công vì container cha bị scale
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
        // Check theo tọa độ Y chuẩn
        if (container.active && container.y < -200) container.destroy();
    });
  }

  startTutorial() {
      try { this.sound.play('instruction'); } catch { /* ignore sound error */ }
      const container = this.add.container(this.DESIGN_W / 2, this.DESIGN_H * 0.4);
      const balloon = this.add.sprite(0, 0, 'balloon_yellow').setScale(0.8);
      const item = this.add.sprite(0, -40, 'item_stonke').setScale(0.9);
      container.add([balloon, item]);
      this.hand = this.add.sprite(this.DESIGN_W / 2 + 60, this.DESIGN_H * 0.4 + 100, 'hand').setScale(1);
      
      this.gameContainer.add(container);
      this.gameContainer.add(this.hand);

      this.tweens.add({ targets: this.hand, x: this.DESIGN_W / 2 + 30, y: this.DESIGN_H * 0.4 + 50, duration: 800, yoyo: true, repeat: -1 });
      balloon.setInteractive();
      balloon.on('pointerdown', () => {
          container.destroy();
          this.hand.destroy();
          try { this.sound.play('sound_stonke'); } catch { /* ignore sound error */ }
          this.time.addEvent({ delay: 1000, callback: this.spawnBalloon, callbackScope: this, loop: true });
      });
  }
}