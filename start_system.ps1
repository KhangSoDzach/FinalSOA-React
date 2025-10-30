# Apartment Management System Startup Script for Windows

Write-Host "=== Starting Apartment Management System ===" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $pgResult = & pg_isready -h localhost -p 5432 -U postgres 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL connection failed"
    }
    Write-Host "PostgreSQL is running!" -ForegroundColor Green
} catch {
    Write-Host "PostgreSQL is not running. Please start PostgreSQL first." -ForegroundColor Red
    Write-Host "Make sure you have a database named 'apartment_management' created." -ForegroundColor Red
    Write-Host "You can create it with: createdb -U postgres apartment_management" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
Write-Host "Starting backend server..." -ForegroundColor Yellow
Set-Location backend

# Check if virtual environment exists, create if not
if (!(Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Run database initialization
Write-Host "Initializing database..." -ForegroundColor Yellow
python scripts\seed_db.py

# Start backend server in background
Write-Host "Starting FastAPI backend server on port 8000..." -ForegroundColor Yellow
$backend = Start-Process python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Navigate to frontend directory
Set-Location ..
Write-Host "Starting frontend development server..." -ForegroundColor Yellow

# Install Node.js dependencies if node_modules doesn't exist
if (!(Test-Path "node_modules")) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
}

# Start frontend server
Write-Host "Starting React frontend server on port 5173..." -ForegroundColor Yellow
$frontend = Start-Process npm -ArgumentList "run", "dev" -PassThru -WindowStyle Normal

Write-Host ""
Write-Host "=== System Started Successfully ===" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default login credentials:" -ForegroundColor Yellow
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow

# Function to cleanup on exit
function Cleanup {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    try {
        if ($backend -and !$backend.HasExited) {
            $backend.Kill()
        }
        if ($frontend -and !$frontend.HasExited) {
            $frontend.Kill()
        }
    } catch {
        # Ignore errors when killing processes
    }
    Write-Host "All servers stopped." -ForegroundColor Green
    exit 0
}

# Set trap to cleanup on Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
        if ($backend.HasExited -or $frontend.HasExited) {
            Write-Host "One of the servers has stopped unexpectedly." -ForegroundColor Red
            break
        }
    }
} finally {
    Cleanup
}