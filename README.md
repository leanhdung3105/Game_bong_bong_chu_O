# BÉ HỌC CHỮ O CÙNG BÓNG BAY (LEARN LETTER 'O' WITH BALLOONS)

**Phiên bản:** 1.0
**Dựa trên GDD phiên bản:** 1.0 (24/05/2024)

Một trò chơi giáo dục tương tác vui nhộn dành cho trẻ mầm non (4-5 tuổi), giúp trẻ nhận biết mặt chữ "O" và âm "o" thông qua việc chạm vào các quả bóng bay chứa hình ảnh hoặc chữ cái tương ứng trong một khung cảnh tươi sáng.

## Mục lục

1.  [Giới thiệu](https://www.google.com/search?q=%23gi%E1%BB%9Bi-thi%E1%BB%87u)
2.  [Yêu cầu hệ thống](https://www.google.com/search?q=%23y%C3%AAu-c%E1%BA%A7u-h%E1%BB%87-th%E1%BB%91ng)
3.  [Cài đặt và Chạy (Môi trường phát triển)](https://www.google.com/search?q=%23c%C3%A0i-%C4%91%E1%BA%B7t-v%C3%A0-ch%E1%BA%A1y-m%C3%B4i-tr%C6%B0%E1%BB%9Dng-ph%C3%A1t-tri%E1%BB%83n)
4.  [Cấu trúc dự án](https://www.google.com/search?q=%23c%E1%BA%A5u-tr%C3%BAc-d%E1%BB%B1-%C3%A1n)
5.  [Xây dựng (Build)](https://www.google.com/search?q=%23x%C3%A2y-d%E1%BB%B1ng-build)
6.  [Triển khai (Deploy)](https://www.google.com/search?q=%23tri%E1%BB%83n-khai-deploy)
7.  [Tài nguyên (Assets)](https://www.google.com/search?q=%23t%C3%A0i-nguy%C3%AAn-assets)

-----

## 1\. Giới thiệu

Trò chơi được thiết kế với phong cách nghệ thuật vẽ tay, màu nước tươi sáng, phù hợp với trẻ nhỏ. Cơ chế chính là quan sát các quả bóng bay lên và chạm vào bóng chứa "Vật thể đúng" (chữ O, con cò, cái ô, ô tô) để nhận phản hồi tích cực, trong khi tránh các bóng chứa vật thể gây nhiễu (chữ A, B).

## 2\. Yêu cầu hệ thống

Để phát triển và chạy dự án này, bạn cần cài đặt:

  * [Node.js](https://nodejs.org/) (Phiên bản LTS được khuyến nghị).
  * Trình quản lý gói (npm - đi kèm Node.js, hoặc yarn, pnpm).
  * Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge) để chạy và kiểm thử.

## 3\. Cài đặt và Chạy (Môi trường phát triển)

Làm theo các bước sau để thiết lập dự án trên máy cục bộ của bạn:

1.  **Clone kho chứa (Repository):**

    ```bash
    git clone <đường-dẫn-đến-repo-của-bạn>
    cd <tên-thư-mục-dự-án>
    ```

2.  **Cài đặt các gói phụ thuộc (Dependencies):**

    ```bash
    npm install
    # Hoặc nếu dùng yarn: yarn install
    ```

3.  **Chạy server phát triển (Development Server):**

    ```bash
    npm run dev
    # Hoặc: yarn dev
    ```

    Sau khi chạy lệnh, terminal sẽ hiển thị địa chỉ local (ví dụ: `http://localhost:5173`). Mở địa chỉ này trên trình duyệt để xem và chơi thử game. Server này hỗ trợ tính năng "hot-reload", tự động cập nhật khi bạn thay đổi code.

## 4\. Cấu trúc dự án

(Cấu trúc này là ví dụ phổ biến cho một dự án game web sử dụng công cụ như Vite, bạn có thể điều chỉnh tùy theo thực tế dự án của mình)

```
/
├── public/              # Chứa các file tĩnh (sẽ được copy nguyên vẹn khi build)
│   ├── assets/
│   │   ├── images/      # Hình ảnh (Background, Nhân vật, Bóng, Vật thể...)
│   │   └── audio/       # Âm thanh (Nhạc nền, SFX, Giọng đọc)
│   └── vite.svg         # Favicon
├── src/                 # Mã nguồn chính của game
│   ├── main.ts          # Điểm khởi đầu của ứng dụng
│   ├── style.css        # CSS chính
│   ├── game/            # Chứa logic game
│   │   ├── GameScene.ts # Scene chính xử lý gameplay
│   │   └── ...
│   └── ...
├── index.html           # File HTML chính
├── package.json         # Khai báo các dependency và script
├── tsconfig.json        # Cấu hình TypeScript
└── vite.config.ts       # Cấu hình Vite
```

## 5\. Xây dựng (Build)

Để tạo ra phiên bản game sẵn sàng cho việc triển khai (production-ready), hãy chạy lệnh sau. Lệnh này sẽ tối ưu hóa code và tài nguyên, sau đó xuất ra thư mục `dist` (hoặc `build` tùy cấu hình).

```bash
npm run build
# Hoặc: yarn build
```

Sau khi quá trình build hoàn tất, thư mục `dist/` sẽ chứa tất cả các file cần thiết để chạy game trên một web server.

## 6\. Triển khai (Deploy)

Bạn có thể triển khai nội dung thư mục `dist/` lên bất kỳ dịch vụ static web hosting nào. Dưới đây là ví dụ với GitHub Pages bằng gói `gh-pages`:

1.  **Cài đặt `gh-pages` làm dev dependency (nếu chưa có):**

    ```bash
    npm install gh-pages --save-dev
    ```

2.  **Thêm script deploy vào `package.json`:**
    Trong phần `"scripts"`, thêm dòng sau:

    ```json
    "deploy": "gh-pages -d dist"
    ```

3.  **Cấu hình `base` trong `vite.config.ts` (nếu cần):**
    Nếu bạn deploy lên đường dẫn con (ví dụ: `https://username.github.io/repo-name/`), bạn cần đặt `base` là tên repository.

    ```ts
    // vite.config.ts
    export default defineConfig({
      base: '/<tên-repo-của-bạn>/',
    })
    ```

4.  **Chạy lệnh deploy:**
    Lệnh này sẽ tự động chạy `npm run build` trước, sau đó đẩy thư mục `dist` lên nhánh `gh-pages` trên GitHub của bạn.

    ```bash
    npm run deploy
    ```

## 7\. Tài nguyên (Assets)

Danh sách các tài nguyên chính được sử dụng trong game:

  * **Hình ảnh:**
      * Nền: Cảnh đồng cỏ, bầu trời.
      * Nhân vật: Em bé (trang trí).
      * Bóng bay: Nhiều màu sắc, hơi trong suốt.
      * Vật thể Đúng: Chữ O, Con Cò, Cái Ô, Ô tô (phong cách dễ thương).
      * Vật thể Sai (Nhiễu): Chữ A, Chữ B.
      * VFX: Hiệu ứng bóng nổ, pháo giấy.
  * **Âm thanh:**
      * Nhạc nền vui tươi.
      * SFX: Tiếng nổ "Pop", tiếng báo sai vui nhộn.
      * Giọng đọc: "Chữ O", "Con Cò", "Cái Ô", "Ô tô".