# 🚀 Deploy Backend lên Render.com

## Bước 1: Tạo tài khoản Render

1. Truy cập: https://render.com
2. Click **Get Started** hoặc **Sign Up**
3. Chọn **Sign up with GitHub** (để connect repo)
4. Authorize Render trên GitHub

## Bước 2: Tạo Web Service mới

1. Từ Render Dashboard, click **New +** → **Web Service**
2. Click **Connect a repository**
3. Tìm và chọn repository: `FinalSOA-React`
4. Click **Connect**

## Bước 3: Cấu hình Web Service

### Basic Settings:
- **Name**: `apartment-backend` (hoặc tên khác)
- **Region**: Singapore (gần Việt Nam nhất)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`

### Build & Deploy Settings:
- **Build Command**: 
  ```
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### Instance Settings:
- **Instance Type**: `Free` (0$)

## Bước 4: Thêm Environment Variables

Scroll xuống phần **Environment Variables**, click **Add Environment Variable** và thêm:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:pQFDoHLfzgnheGsk@db.ftroakglntgkyyaunuln.supabase.co:6543/postgres

# JWT Security
SECRET_KEY=Z6hrphTsxZDc5xlY70bRGiIcN4xjdJHLnGNXqNhLfhQ
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Apartment Management System
```

## Bước 5: Deploy

1. Click **Create Web Service**
2. Đợi ~5-10 phút cho Render build và deploy
3. Theo dõi logs trong tab **Logs**
4. Khi thấy "Application startup complete" → Deploy thành công! ✅

## Bước 6: Lấy Backend URL

1. Sau khi deploy xong, copy URL ở đầu trang
2. Format: `https://apartment-backend-xxx.onrender.com`
3. **LƯU LẠI URL NÀY** để cấu hình frontend

## Bước 7: Test Backend

```bash
# Test health endpoint
curl https://apartment-backend-xxx.onrender.com/api/v1/

# Response phải là:
# {"message": "Apartment Management API is running"}

# Test login
curl -X POST https://apartment-backend-xxx.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user001","password":"123456"}'

# Response phải có access_token
```

## Bước 8: Cập nhật Frontend Vercel

1. Vào **Vercel Dashboard**
2. Chọn project frontend
3. **Settings** → **Environment Variables**
4. Tìm `VITE_API_URL` và update:
   ```
   VITE_API_URL=https://apartment-backend-xxx.onrender.com/api/v1
   ```
5. Click **Save**
6. Vào tab **Deployments**
7. Click **Redeploy** deployment mới nhất

## Bước 9: Update CORS trong Backend

Sau khi có URL Vercel chính xác, cập nhật CORS:

```python
# backend/app/main.py

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://your-actual-vercel-url.vercel.app"  # Thay bằng URL thật
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit và push để Render tự động redeploy.

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Free Tier Limitations
- **Sleep after 15 minutes** không hoạt động
- Request đầu tiên sau khi sleep sẽ chậm (~30s)
- Phù hợp cho demo, không phù hợp production

### 2. Wake up backend
Tạo cron job miễn phí để ping backend mỗi 10 phút:
- Dùng **UptimeRobot.com** (free)
- Hoặc **cron-job.org**
- Ping: `https://apartment-backend-xxx.onrender.com/api/v1/`

### 3. Database Connection
- Dùng **Connection Pooling** URL (port 6543)
- Đừng dùng Direct Connection (port 5432)

## 🐛 Troubleshooting

### Lỗi: "Build failed"
**Nguyên nhân**: Thiếu dependencies hoặc Python version sai

**Fix**:
- Verify `requirements.txt` đầy đủ
- Render dùng Python 3.11 mặc định

### Lỗi: "Application failed to start"
**Nguyên nhân**: Start command sai hoặc port không đúng

**Fix**:
- Verify start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Dùng biến `$PORT` (Render tự động set)

### Lỗi: "Database connection timeout"
**Nguyên nhân**: DATABASE_URL không đúng

**Fix**:
- Verify connection string có port 6543 (pooling)
- Test từ local: `psql DATABASE_URL`

### Lỗi: "CORS error" từ frontend
**Nguyên nhân**: Frontend URL chưa được thêm vào CORS

**Fix**:
- Update `allow_origins` trong main.py
- Thêm URL Vercel chính xác

## 📊 Monitoring

### Render Dashboard:
- **Metrics**: CPU, Memory usage
- **Logs**: Real-time application logs
- **Events**: Deploy history

### Health Check:
```bash
# Check backend status
curl https://apartment-backend-xxx.onrender.com/api/v1/
```

## 🔄 Auto-Deploy

Render tự động deploy khi:
- Push code lên branch `main`
- Có thay đổi trong folder `backend/`

Disable auto-deploy:
- Settings → Build & Deploy → Auto-Deploy: **OFF**

## 💰 Chi phí

| Service | Plan | Cost |
|---------|------|------|
| Render Web Service | Free | **$0** |
| Bandwidth | 100GB/month | **$0** |
| Build Minutes | 500 min/month | **$0** |

**Tổng: FREE** ✅

## ✅ Checklist Deploy

- [ ] Tạo Render account
- [ ] Connect GitHub repo
- [ ] Configure Web Service (root: backend)
- [ ] Add Environment Variables (DATABASE_URL, SECRET_KEY...)
- [ ] Deploy thành công
- [ ] Test API endpoints
- [ ] Copy Backend URL
- [ ] Update VITE_API_URL trên Vercel
- [ ] Update CORS trong backend
- [ ] Redeploy Vercel
- [ ] Test login từ frontend

---

**🎉 Hoàn thành! Backend đã live trên Render!**
