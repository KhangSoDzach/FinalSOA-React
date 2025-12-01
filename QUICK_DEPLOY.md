# ✅ CÁC BƯỚC DEPLOY NHANH

## 🎯 CHUẨN BỊ SẴN SÀNG

File đã được tạo:
- ✅ `backend/render.yaml` - Config cho Render
- ✅ `backend/RENDER_DEPLOY.md` - Hướng dẫn chi tiết
- ✅ `vercel.json` - Đã xóa API config

## 🚀 CÁC BƯỚC THỰC HIỆN

### BƯỚC 1: Deploy Backend lên Render (10 phút)

1. Mở: https://render.com
2. Sign up with GitHub
3. **New** → **Web Service**
4. Connect repo: `FinalSOA-React`
5. Settings:
   - Name: `apartment-backend`
   - Region: **Singapore**
   - Branch: `main`
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance: **Free**

6. **Add Environment Variables**:
```
DATABASE_URL=postgresql://postgres:pQFDoHLfzgnheGsk@db.ftroakglntgkyyaunuln.supabase.co:6543/postgres
SECRET_KEY=Z6hrphTsxZDc5xlY70bRGiIcN4xjdJHLnGNXqNhLfhQ
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

7. Click **Create Web Service**
8. Đợi deploy xong (~5-10 phút)
9. **COPY URL**: `https://apartment-backend-xxx.onrender.com`

### BƯỚC 2: Update Frontend Vercel (2 phút)

1. Vào: https://vercel.com
2. Project → **Settings** → **Environment Variables**
3. Tìm `VITE_API_URL` (hoặc Add mới):
```
VITE_API_URL=https://apartment-backend-xxx.onrender.com/api/v1
```
4. **Save**
5. Tab **Deployments** → **Redeploy** deployment mới nhất

### BƯỚC 3: Xóa folder API (không cần nữa)

```bash
# Xóa folder api
Remove-Item -Recurse -Force api

# Commit
git add .
git commit -m "Remove API folder - Backend now on Render"
git push
```

### BƯỚC 4: Test (1 phút)

```powershell
# Test backend
Invoke-WebRequest -Uri "https://apartment-backend-xxx.onrender.com/api/v1/"

# Test frontend login
# Mở: https://your-app.vercel.app
# Login với: user001 / 123456
```

## ✅ DONE!

- ✅ Backend: Render.com (FREE)
- ✅ Frontend: Vercel (FREE)  
- ✅ Database: Supabase (FREE)
- ✅ Tổng chi phí: **$0**

---

## 📞 Support

Nếu gặp lỗi:
1. Check Render Logs
2. Check Vercel Runtime Logs
3. Verify Environment Variables đầy đủ

**Good luck! 🚀**
