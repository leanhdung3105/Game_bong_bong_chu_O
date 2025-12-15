import { Howl, Howler } from 'howler';

// 1. Định nghĩa Interface cho cấu hình âm thanh
interface SoundConfig {
    src: string;
    loop?: boolean;
    volume?: number;
}

// 2. Đường dẫn gốc (Đảm bảo đường dẫn này đúng trong public folder của Vite)
const BASE_PATH = 'assets/audio/'; // Sử dụng '/' cho Vite public folder

const GAME_ITEM_IDS = [
    'grape', 
    'bee', 
    'flower', 
    'stonke', 
    'dog', 
    'letter_o', 
    'cow', 
    'rabbit', 
    'whistle'
];

// Tạo đối tượng chứa các âm thanh vật phẩm bằng vòng lặp/reduce
const ITEM_SOUNDS: Record<string, SoundConfig> = GAME_ITEM_IDS.reduce((acc, itemId) => {
    // Key sẽ là tên vật phẩm, ví dụ: 'grape'
    // File Path sẽ là: assets/audio/grape.mp3 (Đúng như bạn đã định nghĩa)
    acc[itemId] = { src: `${BASE_PATH}${itemId}.mp3`, volume: 0.7 }; 
    return acc;
}, {} as Record<string, SoundConfig>);

// 3. Ánh xạ ID âm thanh (key) và cấu hình chi tiết
const SOUND_MAP: Record<string, SoundConfig> = {
    // ---- SFX Chung ----
    'sfx-correct': { src: `${BASE_PATH}correct.mp3`, volume: 1.0 },
    'sfx-wrong': { src: `${BASE_PATH}wrong.mp3`, volume: 0.8 },
    'sfx-click': { src: `${BASE_PATH}click.mp3`, volume: 0.8 },
    'voice-rotate': { src: `${BASE_PATH}rotate.mp3`, volume: 0.8 },
    'instruction': { src: `${BASE_PATH}instruction.mp3`, volume: 1.0 },
    'complete': { src: `${BASE_PATH}complete.mp3`, volume: 1.0 },
    'fireworks': { src: `${BASE_PATH}fireworks.mp3`, volume: 1.0 },
    'applause': { src: `${BASE_PATH}applause.mp3`, volume: 1.0 },

    ...ITEM_SOUNDS // <--- ĐÃ THÊM DÒNG NÀY
};

class AudioManager {
    // Khai báo kiểu dữ liệu cho Map chứa các đối tượng Howl
    private sounds: Record<string, Howl> = {};
    private isLoaded: boolean = false;

    constructor() {
        // Cấu hình quan trọng cho iOS
        Howler.autoUnlock = true;
        Howler.volume(1.0);
    }

    /**
     * Tải tất cả âm thanh
     * @returns {Promise<void>}
     */
    loadAll(): Promise<void> {
        return new Promise((resolve) => {
            const keys = Object.keys(SOUND_MAP);
            let loadedCount = 0;
            const total = keys.length;

            if (total === 0) return resolve();

            keys.forEach((key) => {
                const config = SOUND_MAP[key];

                this.sounds[key] = new Howl({
                    src: [config.src],
                    loop: config.loop || false,
                    volume: config.volume || 1.0,
                    html5: true, // Cần thiết cho iOS

                    onload: () => {
                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            resolve();
                        }
                    },
                    onloaderror: (id: number, error: unknown) => {
                        // Chúng ta vẫn có thể chuyển nó sang string để ghi log nếu muốn
                        const errorMessage =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        console.error(
                            `[Howler Load Error] Key: ${key}, ID: ${id}, Msg: ${errorMessage}. Check file path: ${config.src}`
                        );

                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            resolve();
                        }
                    },
                });
            });
        });
    }

    /**
     * Phát một âm thanh
     * @param {string} id - ID âm thanh
     * @returns {number | undefined} - Sound ID của Howler
     */
    play(id: string): number | undefined {
        if (!this.isLoaded || !this.sounds[id]) {
            console.warn(
                `[AudioManager] Sound ID not found or not loaded: ${id}`
            );
            return;
        }
        return this.sounds[id].play();
    }

    /**
     * Dừng một âm thanh
     * @param {string} id - ID âm thanh
     */
    stop(id: string): void {
        if (!this.isLoaded || !this.sounds[id]) return;
        this.sounds[id].stop();
    }

    stopSound(id: string): void {
        if (this.sounds[id]) {
            this.sounds[id].stop();
        }
    }

    stopAll(): void {
        Howler.stop();
    }

    /**
     * Dừng TẤT CẢ các Prompt và Feedback để tránh chồng chéo giọng nói.
     */
    stopAllVoicePrompts(): void {
        // Cần liệt kê tất cả các ID giọng nói/prompt có thể chạy cùng lúc
        const voiceKeys = Object.keys(SOUND_MAP).filter(
            (key) =>
                key.startsWith('prompt_') || key.startsWith('correct_answer_')
        );

        voiceKeys.forEach((key) => {
            this.stopSound(key);
        });

        // Hoặc bạn có thể dùng: Howler.stop(); để dừng TẤT CẢ âm thanh (thận trọng khi dùng)
    }

    // Hàm tiện ích: Dùng để lấy ngẫu nhiên một trong 4 câu trả lời đúng
    playCorrectAnswer(): void {
        // Phaser.Math.Between(min, max) -> thay thế bằng hàm Math.random thuần túy hoặc import từ Phaser
        const randomIndex = Math.floor(Math.random() * 4) + 1;
        this.play(`correct_answer_${randomIndex}`);
    }

    // Hàm tiện ích: Dùng để phát lời nhắc (ví dụ: 'prompt_more_cat')
    playPrompt(type: 'less' | 'more', animal: string): void {
        const id = `prompt_${type}_${animal}`;
        this.play(id);
    }
}

// Xuất phiên bản duy nhất (Singleton)
export default new AudioManager();
