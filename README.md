# HSK Personal Trainer V5.28 — GitHub Pages Edition

Bản này được tách từ V5.27 để upload lên GitHub Pages.

## Cấu trúc

```text
/
├── index.html
├── .nojekyll
├── css/
│   └── app.css
├── js/
│   ├── app-core.js
│   ├── learning-tools.js
│   ├── sentence-lab.js
│   ├── smart-vocab.js
│   ├── flashcards.js
│   ├── ui-enhancements.js
│   ├── radical-lab.js
│   └── character-radical-chain.js
└── data/
    ├── vocab-data.js
    ├── radicals-214.json
    └── character-radical-targets.json
```

## Upload lên GitHub

1. Tạo repository mới.
2. Upload **toàn bộ nội dung bên trong thư mục này**, giữ nguyên các folder `css`, `js`, `data`.
3. Vào **Settings → Pages**.
4. Source: **Deploy from a branch**.
5. Branch: **main**, folder: **/(root)**.
6. Save. GitHub sẽ tạo URL Pages sau khi deploy.

## Quan trọng

- Không đổi tên hoặc di chuyển riêng `css/`, `js/`, `data/` nếu không sửa đường dẫn trong `index.html`.
- Không mở `index.html` trong GitHub code preview để đánh giá giao diện; hãy mở URL GitHub Pages.
- Một nguồn ngoài vẫn được dùng: Hanzi Writer CDN và Character–Radical sync online. Nếu offline, phần seed/local cache vẫn hoạt động.
- Dữ liệu học/progress vẫn lưu bằng `localStorage` của trình duyệt như trước.

## Kích thước sau khi tách

- index.html: 62.9 KB
- app.css: 71.4 KB
