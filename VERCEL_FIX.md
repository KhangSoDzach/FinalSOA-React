# 🔧 Khắc phục lỗi trang trắng trên Vercel

## ❌ Vấn đề hiện tại
- Deploy lên Vercel nhưng trang web hiển thị trắng
- Warning: "Due to `builds` existing in your configuration file..."

## ✅ Đã sửa xong

### 1. File `vercel.json` đã được cập nhật
- ✅ Xóa cấu hình `builds` cũ (deprecated)
- ✅ Dùng cấu hình mới với `buildCommand`, `outputDirectory`
- ✅ Thêm rewrites để handle React Router

### 2. File `vite.config.ts` đã được cập nhật
- ✅ Thêm `base: '/'`
- ✅ Thêm `build.outDir: 'dist'`
- ✅ Thêm `chunkSizeWarningLimit: 1000` để tắt warning
- ✅ Split code thành chunks để tối ưu

### 3. File `.env.example` đã được tạo
- ✅ Mẫu cấu hình environment variables

## 🚀 Các bước tiếp theo

### Bước 1: Commit và push code mới
```bash
git add .
git commit -m "Fix Vercel deployment - update vercel.json and vite.config"
git push
```

### Bước 2: Cấu hình Environment Variables trên Vercel
1. Vào Vercel Dashboard: https://vercel.com
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Thêm biến sau (QUAN TRỌNG):

```
VITE_API_URL=https://your-backend-api.com/api/v1
```

**Lưu ý**: 
- Thay `your-backend-api.com` bằng URL backend thật của bạn
- Nếu backend chưa deploy, có thể tạm thời dùng: `http://localhost:8000/api/v1` (sẽ báo lỗi CORS khi production)

### Bước 3: Redeploy
Sau khi push code, Vercel sẽ tự động deploy lại.

Hoặc redeploy thủ công:
1. Vào Vercel Dashboard
2. Vào tab **Deployments**
3. Click vào deployment mới nhất
4. Click **⋯** (3 chấm) → **Redeploy**

### Bước 4: Kiểm tra

#### Kiểm tra build thành công:
1. Vào Vercel Dashboard → Deployments
2. Đợi status chuyển sang ✅ **Ready**
3. Click vào deployment để xem logs
4. Không có lỗi trong Build Logs

#### Kiểm tra website:
1. Mở URL: `https://your-project.vercel.app`
2. Trang login phải hiển thị đúng
3. Mở DevTools (F12) → Console → Không có lỗi

## 🐛 Nếu vẫn bị lỗi

### Kiểm tra Console Errors
1. Mở website
2. Nhấn F12 → Console tab
3. Xem có lỗi gì không

**Lỗi thường gặp:**

#### "Failed to load module" hoặc "404 Not Found"
→ Build không đúng, check lại `vite.config.ts`

#### "CORS policy" errors
→ Backend chưa cấu hình CORS cho frontend URL

#### "Failed to fetch" hoặc "Network Error"
→ `VITE_API_URL` chưa được set trong Vercel Environment Variables

### Kiểm tra Build Logs
1. Vào Vercel Dashboard
2. Click deployment mới nhất
3. Xem tab **Build Logs**
4. Tìm dòng:
```
✓ built in 30s
✓ Deployment complete
```

Nếu thấy lỗi, screenshot và gửi cho tôi.

## 📊 Checklist

- [ ] Code đã được push lên GitHub
- [ ] `vercel.json` đã cập nhật (không còn `builds`)
- [ ] `vite.config.ts` đã có `base: '/'` và `build` config
- [ ] Environment Variable `VITE_API_URL` đã set trên Vercel
- [ ] Deployment thành công (status ✅ Ready)
- [ ] Website mở được và hiển thị login page
- [ ] Console không có lỗi đỏ

## 💡 Giải thích lỗi ban đầu

**Warning: "Due to builds existing..."**
- Vercel v2 config với `builds` đã deprecated
- Framework như Vite/Next.js nên dùng config mới: `buildCommand`, `outputDirectory`
- Config cũ gây conflict với Vercel Project Settings

**Warning: "Adjust chunk size limit..."**
- File JavaScript quá lớn (>500kb)
- Đã fix bằng cách split code và tăng limit lên 1000kb

## 🎯 Kết quả mong đợi

Sau khi làm xong:
- ✅ Website hiển thị login page
- ✅ Không còn warnings trong build
- ✅ Console không có lỗi
- ✅ Có thể navigate giữa các trang

## 📞 Cần trợ giúp?

Nếu vẫn gặp vấn đề, gửi cho tôi:
1. URL Vercel project
2. Screenshot console errors (F12)
3. Screenshot Build Logs từ Vercel

---

**Chúc bạn deploy thành công! 🚀**
