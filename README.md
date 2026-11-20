# GraduationInvitation

Thư mời tốt nghiệp tương tác của Nguyễn Hoàng Vũ. Kéo hoặc vuốt để xoay phong bì. Bấm hoặc chạm vào phong bì để mở, kể cả khi cảnh 3D đang tải. Có thể mở bằng bàn phím khi phong bì đang được chọn. Thêm tên người nhận nếu muốn cá nhân hóa thiệp và PNG. Chọn **Xong** hoặc nhấn Enter để lưu tên trên trình duyệt, hoặc nhấn Escape để hủy lần sửa. Nút **Lưu thiệp** xuất PNG của trang thư mời. Trong sơ đồ khuôn viên, dùng **Tập trung vào A5**, **Toàn cảnh** hoặc các nút thu phóng để điều hướng. Nút tải sơ đồ lưu PNG toàn cảnh có đánh dấu tòa A5. Nếu trình duyệt không thể tải trực tiếp, liên kết **Mở ảnh để lưu** xuất hiện cạnh nút tải.

## Chạy trên máy

```sh
npm install
npm run dev
```

Mở địa chỉ `http://localhost:5173/` hoặc địa chỉ Vite in ra. Để xem trên điện thoại cùng mạng, chạy `npm run dev -- --host 0.0.0.0` và truy cập URL **Network** của Vite.

```sh
npm run lint
npm run build
```

## Tạo lại model web

```sh
python3 scripts/prepare_envelope.py
```

Script sử dụng thư viện chuẩn Python. Bản dẫn xuất `public/assets/models/envelope-prototype.glb` được dựng từ hai GLB gốc trong cùng thư mục. Mặt cắt sát đường gấp tách nắp và giữ nguyên hình học lòng bao. Model web giữ lại thiệp và dấu sáp, tinh chỉnh độ dày dấu, thêm ký tự V, rồi thay các texture in sẵn bằng hai texture nhỏ. Script ghi bản dẫn xuất ở đường dẫn riêng.

## Ghi công tài nguyên 3D

- Rodrigo E. Maranzana, [Blank Greeting Card with Envelope](https://sketchfab.com/3d-models/free-blank-greeting-card-with-envelope-e254e330d9d0439da7367587ddb4d085). Nguồn thân, nắp và phôi thiệp. Đã tách nắp, thêm bản lề, đặt lại phôi thiệp và thay vật liệu giấy.
- WaajaaH, [Letter & Envelope Assets](https://sketchfab.com/3d-models/letter-envelope-assets-bb05f9a28e2b455da934a0b2ea2fc444). Nguồn hình học dấu sáp. Đã đổi tỷ lệ, đổi vật liệu và thêm chữ V.

Cả hai GLB gốc ghi [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) trong metadata. Listing của Rodrigo gắn nhãn NoAI. Script xử lý hình học và texture theo thuật toán xác định, không gọi mô hình tạo sinh. Bản web lưu nguồn và mô tả chỉnh sửa trong metadata GLB.

## Font chữ

Lora và Be Vietnam Pro được tự lưu trữ để trang và PNG sử dụng cùng font. Giấy phép SIL Open Font License 1.1 nằm trong `public/assets/fonts/`.
