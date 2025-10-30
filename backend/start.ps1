# Khởi chạy backend API
Write-Host "Khởi chạy Apartment Management Backend API..." -ForegroundColor Green

# Kiểm tra Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python không được tìm thấy. Vui lòng cài đặt Python 3.11+" -ForegroundColor Red
    exit 1
}

# Chuyển đến thư mục backend
Set-Location backend

# Kiểm tra virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Tạo virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Kích hoạt virtual environment
Write-Host "Kích hoạt virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Cài đặt dependencies
Write-Host "Cài đặt dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Kiểm tra file .env
if (-not (Test-Path ".env")) {
    Write-Host "Tạo file .env từ template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Vui lòng chỉnh sửa file .env với thông tin database của bạn" -ForegroundColor Yellow
}

# Khởi chạy server
Write-Host "Khởi chạy FastAPI server..." -ForegroundColor Green
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Nhấn Ctrl+C để dừng server" -ForegroundColor Yellow

python run.py