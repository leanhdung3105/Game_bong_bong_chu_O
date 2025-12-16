import Phaser from 'phaser';
import { showGameButtons, hideGameButtons } from '../main';
import AudioManager from '../audio/AudioManager';
import { changeBackground } from './utils/backgroundManager';
import { playVoiceLocked, resetVoiceState, setGameSceneReference } from '../rotateOrientation';

// --- 1. DATA GỌN NHẸ ---
interface ItemData {
    id: string;   
    name: string;
}

const GAME_ITEMS: Record<string, ItemData> = {
    'grape':   { id: 'grape',   name: 'Quả nho' },
    'bee':     { id: 'bee',     name: 'Con ong' },
    'flower':  { id: 'flower',  name: 'Bông hoa'},
    'stonke':  { id: 'stonke',  name: 'Cục đá'  },
    'dog':     { id: 'dog',     name: 'Con chó' },
    'letter_o':{ id: 'letter_o',name: 'Chữ O'   },
    'cow':     { id: 'cow',     name: 'Con bò'  },
    'rabbit':  { id: 'rabbit',  name: 'Con thỏ' },
    'whistle': { id: 'whistle', name: 'Cái còi' },
    'empty':   { id: 'empty',   name: 'Bóng rỗng' }
};

interface GameState {
    score: number;
    maxScore: number;
    isPlaying: boolean;
    isPaused: boolean;
}

export default class GameScene extends Phaser.Scene {
    // --- PROPERTIES ---
    private boy!: Phaser.GameObjects.Sprite;
    private hand!: Phaser.GameObjects.Sprite;
    
    // Score Bar Variables
    private scoreBarMask!: Phaser.GameObjects.Graphics;
    private scoreBarFill!: Phaser.GameObjects.Sprite;
    private maxScoreWidth: number = 0;

    // UI Elements
    private popupContainer!: Phaser.GameObjects.Container; 
    
    private state: GameState = { score: 0, maxScore: 5, isPlaying: false, isPaused: false };
    private spawnTimer?: Phaser.Time.TimerEvent;
    private activeTweens: Phaser.Tweens.Tween[] = [];
    private balloonColors = ['red', 'blue', 'green', 'yellow', 'purple'];
    private isInstructionCompleted: boolean = false;

    constructor() { super('GameScene'); }

    private getW() { return this.scale.width; }
    private getH() { return this.scale.height; }
    private pctX(p: number) { return this.getW() * p; }
    private pctY(p: number) { return this.getH() * p; }

    init() {
        this.state = { score: 0, maxScore: 5, isPlaying: false, isPaused: false };
        this.activeTweens = [];
        this.isInstructionCompleted = false;
    }

    preload() {
        this.load.image('text_banner', 'assets/images/text_banner_game.png');
        this.load.image('bar_frame', 'assets/images/Thanh_diem.png');      
        this.load.image('bar_fill', 'assets/images/thanh_diem_full.png');
        this.load.image('boy1', 'assets/images/boy1.png');
        this.load.image('boy2', 'assets/images/boy2.png');
        this.load.image('banner', 'assets/images/banner.png');
        this.load.image('hand', 'assets/images/hand.png');
        this.load.image('board', 'assets/images/board.png'); 
        this.load.image('icon_balloon', 'assets/images/icon_ball.png');

        this.balloonColors.forEach(c => this.load.image(`balloon_${c}`, `assets/images/balloon_${c}.png`));

        Object.values(GAME_ITEMS).forEach(item => {
            if (item.id === 'empty') return; // Bỏ qua bóng rỗng
            this.load.image(`item_${item.id}`, `assets/images/${item.id}.png`); 
            this.load.image(`text_${item.id}`, `assets/images/text_${item.id}.png`);
        });

        AudioManager.loadAll();
    }

    create() {
        resetVoiceState(); // <--- GỌI HÀM RESET NGAY LẬP TỨC
        AudioManager.play('bgm-nen');
        (window as any).gameScene = this;
        setGameSceneReference(this);
        changeBackground('assets/images/bg_game.jpg');

        this.createBoy();
        this.createScoreBar(); // Gọi hàm tạo thanh điểm Mask
        this.createPopupUI(); 
        this.createBannerAndTutorial();
        
        showGameButtons();
    }

    // --- SETUP UI ---

    private createBoy() {
        if (!this.anims.exists('run')) {
            this.anims.create({ key: 'run', frames: [{ key: 'boy1' }, { key: 'boy2' }], frameRate: 4, repeat: -1 });
        }
        this.boy = this.add.sprite(this.pctX(0.5), this.pctY(0.95), 'boy1').setOrigin(0.5, 1);
    }


    private createScoreBar() {
        // --- 1. CẤU HÌNH VỊ TRÍ ---
        // Đặt ở góc dưới bên trái màn hình
        const barX = this.pctX(0.12); // Cách lề trái một chút để chừa chỗ cho icon
        const barY = this.pctY(0.9);  // Nằm ở dưới đáy (khoảng 90% chiều cao)

        // --- 2. VẼ THANH ĐIỂM (Nằm dưới) ---
        
        // A. Khung nền (Màu trắng/xám)
        const barFrame = this.add.image(barX, barY, 'bar_frame').setOrigin(0, 0.5);
        // setOrigin(0, 0.5): Điểm neo nằm ở cạnh trái, giữa chiều cao -> Giúp thanh dài ra sang phải dễ dàng

        // B. Thanh màu xanh (Đè lên khung)
        this.scoreBarFill = this.add.sprite(barX, barY, 'bar_fill').setOrigin(0, 0.5);

        // Lưu lại chiều rộng gốc để tính toán phần trăm
        this.maxScoreWidth = this.scoreBarFill.width;

        // C. Tạo MASK (Mặt nạ cắt thanh xanh)
        this.scoreBarMask = this.make.graphics({});
        this.scoreBarMask.fillStyle(0xffffff);
        this.scoreBarMask.beginPath();
        
        // Vẽ hình chữ nhật mask ban đầu (width = 0 vì chưa có điểm)
        // Lưu ý: Tọa độ Y phải trừ đi nửa chiều cao vì Origin của thanh bar là 0.5
        this.scoreBarMask.fillRect(barX, barY - this.scoreBarFill.height / 2, 0, this.scoreBarFill.height);
        
        // Áp dụng mask
        const mask = this.scoreBarMask.createGeometryMask();
        this.scoreBarFill.setMask(mask);

        // --- 3. VẼ ICON (Nằm trên cùng) ---
        // Vẽ icon sau cùng để nó đè lên đầu thanh bar -> Tạo cảm giác nổi khối 3D như hình mẫu
        const icon = this.add.image(barX - 10, barY, 'icon_balloon'); // Lùi lại 10px so với đầu thanh bar
        
        // Tự động chỉnh kích thước icon sao cho đẹp (bằng khoảng 1.5 lần chiều cao thanh bar)
        // Bạn có thể sửa số 1.5 thành số khác nếu muốn icon to/nhỏ hơn
        //const iconScale = (barFrame.height * 1.8) / icon.height; 
        //icon.setScale(0.5);
    }

    private createPopupUI() {
        this.popupContainer = this.add.container(this.getW() / 2, this.getH() / 2).setDepth(1000).setVisible(false);

        const bg = this.add.image(0, 0, 'board').setName('popup_board');
        const scale = (this.getW() * 0.4) / bg.width; 
        bg.setScale(scale);
        
        const icon = this.add.image(0, -50 * scale, 'item_grape').setName('popup_icon');
        const textImg = this.add.image(0, bg.displayHeight * 0.25, 'text_grape').setName('popup_text_img');

        this.popupContainer.add([bg, icon, textImg]);
    }

    // --- GAME LOGIC ---

    private createBannerAndTutorial() {
        const banner = this.add.image(this.pctX(0.5), this.pctY(0.1), 'banner').setName('banner'); //
        banner.setScale((this.getW() * 0.6) / banner.width);

        const bannerText = this.add.image(this.pctX(0.5), this.pctY(0.1), 'text_banner').setName('banner_text');
        bannerText.setScale((this.getW() * 0.5) / bannerText.width);

        try { 
            // THAY THẾ: AudioManager.play('instruction');
            // BẰNG: 
            playVoiceLocked(null as any, 'instruction'); // <--- SỬ DỤNG LOGIC ƯU TIÊN VOICE
        } catch (e) { 
            console.warn('Error playing instruction voice:', e);
        }
        this.isInstructionCompleted = true;

        const tutorialBalloon = this.createBalloonContainer('balloon_blue', 'letter_o');
        tutorialBalloon.setPosition(this.pctX(0.5), this.pctY(0.4));
        
        this.hand = this.add.sprite(this.pctX(0.55), this.pctY(0.55), 'hand');
        this.hand.setDisplaySize(this.getW() * 0.08, this.getW() * 0.08);
        
        this.tweens.add({ targets: this.hand, x: this.pctX(0.52), y: this.pctY(0.45), duration: 800, yoyo: true, repeat: -1 });

        const hitArea = tutorialBalloon.getAt(0) as Phaser.GameObjects.Sprite;
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.once('pointerdown', () => {
            tutorialBalloon.destroy();
            AudioManager.stop('instruction');
            AudioManager.play('start');
            if (this.hand) this.hand.destroy();

            this.tweens.add({ 
                targets: [banner, bannerText], y: -100, alpha: 0, duration: 500,
                onComplete: () => { banner.destroy(); bannerText.destroy(); }
            });
            
            if (this.boy) this.boy.play('run');

            this.state.isPlaying = true;
            this.startGameLoop();
        });
    }

    startGameLoop() {
        this.spawnTimer = this.time.addEvent({
            delay: 2000, callback: this.spawnBalloon, callbackScope: this, loop: true
        });
    }

    // GameScene.ts

    spawnBalloon() {
        if (!this.state.isPlaying || this.state.isPaused) return;

        // --- 1. CHUẨN BỊ DATA CỦA 3 BÓNG (2 đúng, 1 rỗng) ---
        const allItemKeys = Object.keys(GAME_ITEMS).filter(key => key !== 'empty');
        const correctItems = Phaser.Utils.Array.Shuffle(allItemKeys).slice(0, 3); 
        let spawnIDs = [...correctItems, 'empty'];
        spawnIDs = Phaser.Utils.Array.Shuffle(spawnIDs);

        // --- 2. CẤU HÌNH 4 VỊ TRÍ X CỐ ĐỊNH (SLOTS) ---
        const slotPositions = [
            this.pctX(0.15), // Slot 1: 15%
            this.pctX(0.40), // Slot 2: 40%
            this.pctX(0.65), // Slot 3: 65%
            this.pctX(0.85)  // Slot 4: 85%
        ];
        const shuffledSlots = Phaser.Utils.Array.Shuffle(slotPositions);

        // --- 2. XỬ LÝ 3 LẦN TẠO BÓNG ---
        spawnIDs.forEach((itemID, index) => {
            const color = Phaser.Utils.Array.GetRandom(this.balloonColors);
            const container = this.createBalloonContainer(`balloon_${color}`, itemID, true); // Khởi tạo với scale=0
            container.setData('itemID', itemID);

            // Lấy kích thước ban đầu để tính toán vị trí bay
            const ballSprite = container.getAt(0) as Phaser.GameObjects.Sprite;
            const baseBallHeight = ballSprite.height * (this.getH() * 0.18 / ballSprite.height); // Chiều cao sau scale

            // --- CẤU HÌNH VỊ TRÍ START/END ---
            // Lấy vị trí X từ Slot cố định đã trộn
            const base_X = shuffledSlots[index];
            const startX = base_X + Phaser.Math.Between(-20, 20);
            const startY = this.getH() + baseBallHeight/2; // Vị trí xuất hiện đột ngột (cách đáy 100px)
            container.setPosition(startX, startY);

            const endY = baseBallHeight / 2 + baseBallHeight * 0.05; // Vị trí biến mất đột ngột (cách đỉnh 100px)
            const flyDuration = Phaser.Math.Between(4000, 6000); 
            const swingRange = 30; 
            const swingToX = base_X + Phaser.Math.Between(-swingRange, swingRange);

            // --- 3. TWEEN XUẤT HIỆN ĐẸP MẮT (POP IN) ---
            const appearTween = this.tweens.add({
                targets: container, 
                scale: 1, // Phóng to lên kích thước thật
                duration: 200,
                ease: 'Back.Out', // Hiệu ứng nảy rất đẹp
                onComplete: (tween, targets) => {
                    const targetContainer = targets[0];
                    
                    // A. TWEEN BAY LÊN (Trục Y)
                    const flyTween = this.tweens.add({
                        targets: targetContainer, 
                        y: endY, 
                        duration: flyDuration, 
                        ease: 'Linear',
                        onComplete: (ft) => { 
                            // DỌN DẸP SẠCH SẼ KHI KẾT THÚC
                            const relatedTweens = this.activeTweens.filter(t => t.targets === targetContainer);
                            relatedTweens.forEach(t => t.stop()); 
                            
                            this.activeTweens = this.activeTweens.filter(t => t.targets !== targetContainer);
                            targetContainer.destroy(); 
                        }
                    });
                    this.activeTweens.push(flyTween);

                    // B. TWEEN LẮC LƯ (Trục X)
                    const swingTween = this.tweens.add({
                        targets: targetContainer,
                        x: swingToX, 
                        duration: 1200, 
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    this.activeTweens.push(swingTween);

                    // Xóa appearTween đã xong khỏi mảng quản lý
                    this.activeTweens = this.activeTweens.filter(t => t !== appearTween);
                }
            });
            this.activeTweens.push(appearTween);

            // Gắn sự kiện click
            (container.getAt(0) as Phaser.GameObjects.Sprite).on('pointerdown', () => this.handleBalloonClick(container, itemID));
        });
    }

    // GameScene.ts

    createBalloonContainer(balloonKey: string, itemID: string, startHidden: boolean = false) {
        // [ĐÃ SỬA]: Chỉ đặt scale = 0 nếu startHidden = true (Mặc định là false)
        const container = this.add.container(0, 0);

        if (startHidden) {
            container.setScale(0);
        }
        
        const baseSize = this.getH() * 0.18; 

        const balloon = this.add.sprite(0, 0, balloonKey);
        balloon.setScale(0.45).setInteractive({ useHandCursor: true });
        container.add(balloon);

        // [ĐÃ SỬA]: CHỈ THÊM HÌNH NẾU KHÔNG PHẢI LÀ BÓNG RỖNG
        if (itemID !== 'empty') {
            const item = this.add.sprite(0, -baseSize * 0.1, `item_${itemID}`);
            item.setScale(0.3);
            container.add(item);
        }
        
        return container;
    }

    handleBalloonClick(container: Phaser.GameObjects.Container, itemID: string) {
        if (this.state.isPaused) return;

        if (itemID === 'empty') {
                // Chơi tiếng Wrong
                try { AudioManager.play('sfx-wrong') } catch {} // Hoặc dùng playVoiceLocked nếu đã cấu hình

                // Hiệu ứng lắc lư mạnh và biến mất (giữ nguyên game, không pause)
                this.tweens.add({
                    targets: container,
                    x: container.x + Phaser.Math.Between(-30, 30),
                    y: container.y + Phaser.Math.Between(-30, 30),
                    duration: 100,
                    yoyo: true,
                    repeat: 3, // Lắc 3 lần
                    onComplete: () => {
                        container.destroy();
                    }
                });
                
                // Dừng việc xử lý Popup và Tăng điểm
                return; 
            }

        this.state.isPaused = true;
        this.activeTweens.forEach(t => t.pause());
        if (this.boy) this.boy.stop();
        if (this.spawnTimer) this.spawnTimer.paused = true;
        
        try { AudioManager.play(itemID); } catch {}

        const data = GAME_ITEMS[itemID];
        
        if (data) {
            const bg = this.popupContainer.getByName('popup_board') as Phaser.GameObjects.Image;
            const icon = this.popupContainer.getByName('popup_icon') as Phaser.GameObjects.Image;
            const textImg = this.popupContainer.getByName('popup_text_img') as Phaser.GameObjects.Image;

            if (bg && icon && textImg) {
                icon.setTexture(`item_${data.id}`);
                icon.setScale((bg.displayHeight * 0.4) / icon.height);
                icon.y = -bg.displayHeight * 0.15;
    
                textImg.setTexture(`text_${data.id}`);
                //textImg.setScale(1); 
                const maxTextWidth = bg.displayWidth * 0.6;
                if (textImg.width > maxTextWidth) textImg.setScale(maxTextWidth / textImg.width);
                textImg.y = bg.displayHeight * 0.2; 
            }
        }

        this.popupContainer.setVisible(true).setScale(0);
        this.tweens.add({ targets: this.popupContainer, scale: 1, duration: 300, ease: 'Back.out' });

        // [SỬA LỖI] Gọi hàm tăng điểm và kiểm tra thắng thua
        this.increaseScore();
        
        container.destroy();

        // Tự động đóng sau 2 giây
        this.time.delayedCall(2000, () => {
            this.hidePopup();
        });
    }

    hidePopup() {
        this.tweens.add({
            targets: this.popupContainer, scale: 0, duration: 200,
            onComplete: () => {
                this.popupContainer.setVisible(false);
                
                // Chỉ resume game nếu chưa thắng
                if (this.state.isPlaying) {
                    this.state.isPaused = false;
                    this.activeTweens.forEach(t => t.resume());
                    if (this.spawnTimer) this.spawnTimer.paused = false;
                    this.boy.play('run');
                }
            }
        });
    }

    increaseScore() {
        if (this.state.score < this.state.maxScore) {
            this.state.score++;
            
            // [QUAN TRỌNG] Truyền tham số current và total vào
            this.updateScoreBar(this.state.score, this.state.maxScore);
            
            // [QUAN TRỌNG] Kiểm tra điều kiện thắng
            if (this.state.score >= this.state.maxScore) {
                this.winGame();
            }
        }
    }

    public updateScoreBar(current: number, total: number) {
        let percent = current / total;
        if (percent > 1) percent = 1;

        const visibleWidth = this.maxScoreWidth * percent;

        this.scoreBarMask.clear(); 
        this.scoreBarMask.fillStyle(0xffffff); 
        this.scoreBarMask.beginPath();
        
        const x = this.scoreBarFill.x; 
        const y = this.scoreBarFill.y - this.scoreBarFill.height / 2; 
        
        this.scoreBarMask.fillRect(x, y, visibleWidth, this.scoreBarFill.height);
    }

    winGame() {
        console.log("WIN GAME!");
        this.state.isPlaying = false; // Dừng trạng thái chơi
        if (this.boy) this.boy.stop(); // Dừng nhân vật
        if (this.spawnTimer) this.spawnTimer.remove(); // Dừng sinh bóng

        // Sau 1s thì chuyển Scene
        this.time.delayedCall(1000, () => {
            hideGameButtons();
            // Đảm bảo bạn có Scene 'EndGameScene'
            this.scene.start('EndGameScene'); 
        });
    }
}