#!/bin/bash

echo "=== Starting Apartment Management System ==="

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 -U postgres; then
    echo "PostgreSQL is not running. Please start PostgreSQL first."
    echo "Make sure you have a database named 'apartment_management' created."
    exit 1
fi

# Navigate to backend directory
echo "Starting backend server..."
cd backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run database initialization
echo "Initializing database..."
python scripts/seed_db.py

# Start backend server in background
echo "Starting FastAPI backend server on port 8000..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Navigate to frontend directory
cd ..
echo "Starting frontend development server..."

# Install Node.js dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Start frontend server
echo "Starting React frontend server on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== System Started Successfully ==="
echo "Backend API: http://localhost:8000"
echo "Frontend App: http://localhost:5173"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Default login credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "All servers stopped."
    exit 0
}

# Set trap to cleanup on exit
trap cleanup INT TERM

# Wait for user to stop
wait