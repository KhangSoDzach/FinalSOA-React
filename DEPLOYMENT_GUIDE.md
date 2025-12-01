# 🚀 HƯỚNG DẪN DEPLOY LÊN VERCEL + SUPABASE

## 📋 BƯỚC 1: Setup Supabase Database

### 1.1. Tạo Supabase Project
1. Truy cập: https://supabase.com
2. Click **New Project**
3. Điền thông tin:
   - **Name**: apartment-management
   - **Database Password**: [Tạo password mạnh, LƯU LẠI]
   - **Region**: Southeast Asia (Singapore) - gần Việt Nam nhất
4. Click **Create new project** → Đợi ~2 phút

### 1.2. Lấy Database Connection String
1. Vào project → **Settings** → **Database**
2. Kéo xuống phần **Connection string**
3. Chọn tab **URI**
4. Copy connection string, format:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   postgresql://postgres:pQFDoHLfzgnheGsk@db.ftroakglntgkyyaunuln.supabase.co:6543/postgres
5. **LƯU Ý**: Dùng **Connection pooling** (port 6543) cho Vercel serverless

### 1.3. Chạy Database Migration
**Option A: Dùng SQL Editor trên Supabase**
1. Vào **SQL Editor** → **New query**
2. Copy toàn bộ schema từ file `backend/scripts/seed_db.py`
3. Hoặc export schema từ local database:
   ```bash
   pg_dump -h localhost -U postgres -d apartment_management --schema-only > schema.sql
   ```
4. Paste vào SQL Editor → Click **Run**

**Option B: Từ local machine**
```bash
# Set Supabase URL
$env:DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Run migrations
cd backend
python scripts/reset_db.py
python scripts/seed_db.py
```

---

## 📋 BƯỚC 2: Setup Gmail SMTP (Cho OTP emails)

### 2.1. Bật 2-Step Verification
1. Vào: https://myaccount.google.com/security
2. Tìm **2-Step Verification** → Bật nó lên
3. Làm theo hướng dẫn xác thực

### 2.2. Tạo App Password
1. Vào: https://myaccount.google.com/apppasswords
2. Chọn:
   - **Select app**: Mail
   - **Select device**: Other (Custom name)
   - Nhập: "Vercel Apartment App"
3. Click **Generate**
4. Copy 16-ký-tự password (dạng: xxxx xxxx xxxx xxxx)
5. **LƯU LẠI** - Không hiển thị lại được

---

## 📋 BƯỚC 3: Push Code lên GitHub

### 3.1. Tạo GitHub Repository (Nếu chưa có)
```bash
# Trên GitHub.com: New Repository → apartment-management
# Copy URL: https://github.com/YOUR_USERNAME/apartment-management.git
```

### 3.2. Push Code
```bash
# Nếu chưa có git
git init
git add .
git commit -m "Prepare for Vercel deployment"

# Link to GitHub
git remote add origin https://github.com/YOUR_USERNAME/apartment-management.git
git branch -M main
git push -u origin main
```

### 3.3. Verify
- Vào GitHub repo
- Kiểm tra có đầy đủ files:
  - ✅ `vercel.json`
  - ✅ `.env.production`
  - ✅ `backend/requirements.txt` (có mangum)
  - ✅ `src/`, `backend/`

---

## 📋 BƯỚC 4: Deploy lên Vercel

### 4.1. Import Project
1. Vào: https://vercel.com
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Authorize GitHub nếu cần
5. Chọn repository: `apartment-management`
6. Click **Import**

### 4.2. Configure Project
- **Framework Preset**: Vite
- **Root Directory**: `./` (để mặc định)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4.3. Thêm Environment Variables
Click **Environment Variables**, thêm:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# JWT Security
SECRET_KEY=Z6hrphTsxZDc5xlY70bRGiIcN4xjdJHLnGNXqNhLfhQ
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Apartment Management System

# Frontend
VITE_API_URL=/api/v1

# Vercel flag
    =1
```

**⚠️ LƯU Ý:**
- `SECRET_KEY`: Generate bằng: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- `SMTP_PASSWORD`: Dùng 16-ký-tự App Password từ Gmail
- `DATABASE_URL`: Dùng Connection Pooling URL (port 6543)

### 4.4. Deploy!
1. Click **Deploy**
2. Đợi ~2-5 phút
3. Xem logs để check lỗi
4. Khi xong sẽ có URL: `https://apartment-management-xxx.vercel.app`

---

## 📋 BƯỚC 5: Test Deployment

### 5.1. Test Backend API
```bash
curl https://your-app.vercel.app/api/v1/
# Response: {"message": "Apartment Management API is running"}
```

### 5.2. Test Frontend
1. Mở: `https://your-app.vercel.app`
2. Click **Login**
3. Test với account đã seed:
   - Username: `admin` / Password: `admin123`
   - Username: `user1` / Password: `password123`

### 5.3. Test Features
- ✅ Dashboard loads
- ✅ Bills page shows data
- ✅ Create ticket
- ✅ Upload vehicle image
- ✅ Send OTP email (payment)
- ✅ Forgot password flow

---

## 🔧 BƯỚC 6: Troubleshooting

### Lỗi thường gặp:

#### 0. **Trang web trắng sau khi deploy (Blank White Page)**
```
- Trang chỉ hiển thị màu trắng
- Console không có lỗi hoặc có lỗi "Failed to fetch"
```
**Nguyên nhân**: 
- `vercel.json` dùng cấu hình `builds` cũ (deprecated)
- Missing base path trong Vite config
- API URL không được cấu hình đúng

**Fix**: 
1. Xóa file `vercel.json` cũ và tạo mới:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

2. Update `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
})
```

3. Trong Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.com/api/v1
```

4. Redeploy:
- Vào Vercel Dashboard
- Click "Redeploy" trên deployment mới nhất
- Hoặc push code mới lên GitHub

#### 1. **500 Internal Server Error**
```bash
# Check Vercel logs:
# Dashboard → Your Project → Deployments → Latest → Logs
```
**Nguyên nhân**: Thiếu environment variables hoặc sai DATABASE_URL

**Fix**: 
- Verify tất cả env vars trong Vercel Settings
- Test connect Supabase: `psql DATABASE_URL`

#### 2. **CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix**: Đã add `https://*.vercel.app` vào CORS trong main.py

#### 3. **Import Errors**
```
ModuleNotFoundError: No module named 'mangum'
```
**Fix**: Verify `backend/requirements.txt` có:
```
mangum==0.17.0
```

#### 4. **Database Connection Timeout**
**Fix**: Dùng Connection Pooling URL (port 6543) thay vì Direct Connection (port 5432)

#### 5. **Email không gửi được**
**Fix**:
- Verify Gmail App Password đúng (16 ký tự, không có spaces)
- Check SMTP_HOST=smtp.gmail.com, SMTP_PORT=587
- Check Gmail account có bật 2FA

---

## 📊 Monitoring & Logs

### Vercel Dashboard
- **Deployments**: Xem history, rollback nếu cần
- **Analytics**: Traffic, performance
- **Logs**: Real-time logs, errors

### Supabase Dashboard
- **Table Editor**: Xem/edit data trực tiếp
- **SQL Editor**: Run queries
- **Database**: Connection pooling stats
- **Logs**: Query logs, slow queries

---

## 🔄 Update Code sau khi Deploy

```bash
# 1. Sửa code local
# 2. Test local: npm run dev
# 3. Commit & push
git add .
git commit -m "Update feature X"
git push

# 4. Vercel tự động deploy lại (auto-deploy)
# 5. Check deployment status trên Vercel Dashboard
```

---

## 💰 Chi phí (FREE TIER)

| Service | Plan | Limits | Cost |
|---------|------|--------|------|
| **Vercel** | Hobby | 100GB bandwidth, Unlimited projects | **FREE** |
| **Supabase** | Free | 500MB DB, 2GB bandwidth, 50K users | **FREE** |
| **Gmail SMTP** | Personal | 500 emails/day | **FREE** |

**Tổng chi phí: 0 VNĐ** ✅

---

## 🎯 Checklist Deploy

### Pre-deployment:
- [x] `vercel.json` created
- [x] `backend/app/main.py` có Mangum handler
- [x] `backend/requirements.txt` có mangum==0.17.0
- [x] `src/services/api.ts` dùng env variable
- [x] `.env.production` created
- [x] `.vercelignore` created

### Supabase:
- [ ] Project created
- [ ] Database URL copied (port 6543)
- [ ] Schema migrated
- [ ] Seed data imported

### Gmail:
- [ ] 2FA enabled
- [ ] App password generated
- [ ] Tested sending email

### GitHub:
- [ ] Code pushed
- [ ] All files present
- [ ] No secrets in code

### Vercel:
- [ ] Project imported
- [ ] Environment variables set
- [ ] Deployed successfully
- [ ] URL working

### Testing:
- [ ] API responds
- [ ] Frontend loads
- [ ] Login works
- [ ] Database queries work
- [ ] Email sends
- [ ] File uploads work

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

## 🎉 Hoàn thành!

Ứng dụng của bạn đã LIVE trên Internet! 🚀

**URL**: `https://your-app.vercel.app`

Share link này với giáo viên/bạn bè để demo!
