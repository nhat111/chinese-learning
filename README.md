# ZhongVui · Học tiếng Trung cho người mới bắt đầu

App web (PWA) học tiếng Trung cho người Việt bắt đầu từ con số 0, dùng được cho cả **trẻ em** và **người lớn**.
Không có tài khoản, không backend: nội dung là các tệp JSON, tiến độ lưu trong `localStorage`.

## Tính năng

- **Phát âm & Pinyin**: 4 thanh điệu, thanh mẫu, vận mẫu, biến điệu; mỗi âm có ví dụ và mẹo so với tiếng Việt; trò "nghe chọn thanh".
- **Từ vựng theo chủ đề** (165 từ, 13 chủ đề): thẻ từ có hình, pinyin, âm Hán Việt, ôn lặp lại ngắt quãng (SM-2).
- **Viết chữ Hán** (50 chữ): xem thứ tự nét và tập viết bằng ngón tay (Hanzi Writer), có nguồn gốc chữ tượng hình.
- **Câu giao tiếp** (53 câu): nghe mẫu, nói để máy chấm (Web Speech API, zh-CN) hoặc ghi âm và tự so sánh.
- **Trò chơi**: nghe chọn hình, đoán nghĩa, đoán thanh điệu, ghép cặp; mỗi câu đúng được một ngôi sao.
- **Bài học hôm nay** 5/10/15 phút, chuỗi ngày học, trang tiến độ, sao lưu / khôi phục tiến độ.
- **Chế độ Bé học**: chữ và hình to hơn, câu hỏi bằng hình, nội dung cấp 1-2, ẩn Hán Việt, đọc chậm hơn.
- Giọng đọc tự nhiên (MP3 tạo sẵn bằng Edge TTS), dự phòng bằng giọng của máy; chạy offline sau lần mở đầu.

## Lệnh

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # lint + test + build (lệnh build của Vercel)
npm run tts      # tạo MP3 cho nội dung mới (pip install edge-tts; ffmpeg)
```

## Thêm nội dung

Thêm mục vào `public/data/*.json` rồi chạy `npm test` (kiểm tra định dạng, id trùng, chủ đề hợp lệ) và `npm run tts`.
Không cần sửa code. Không bao giờ đổi `id` đã phát hành: tiến độ được lưu theo id.

## Triển khai

Vercel: import repo, framework Vite, không cần biến môi trường. `vercel.json` đã cấu hình build, rewrite SPA và cache.
