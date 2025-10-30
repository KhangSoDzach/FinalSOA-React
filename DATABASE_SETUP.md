# Database Setup Instructions

## Prerequisites

1. **PostgreSQL Installation**
   - Download and install PostgreSQL from: https://www.postgresql.org/download/
   - During installation, remember the password you set for the `postgres` user
   - Make sure PostgreSQL service is running

2. **Create Database**
   ```bash
   # Method 1: Using psql command line
   psql -U postgres
   CREATE DATABASE apartment_management;
   \q

   # Method 2: Using createdb command
   createdb -U postgres apartment_management
   ```

3. **Verify Database Connection**
   ```bash
   # Test connection
   psql -U postgres -d apartment_management -c "SELECT version();"
   ```

## Configuration

1. **Update Backend Configuration**
   - Open `backend/app/core/config.py`
   - Update the database URL if needed:
     ```python
     database_url: str = "postgresql://postgres:YOUR_PASSWORD@localhost/apartment_management"
     ```
   - Replace `YOUR_PASSWORD` with your PostgreSQL password

2. **Environment Variables (Optional)**
   - Create a `.env` file in the `backend` directory:
     ```
     DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost/apartment_management
     SECRET_KEY=your-secret-key-here
     ACCESS_TOKEN_EXPIRE_MINUTES=30
     ```

## Running the System

### Option 1: Automatic Startup (Recommended)

**For Windows:**
```powershell
.\start_system.ps1
```

**For Linux/Mac:**
```bash
chmod +x start_system.sh
./start_system.sh
```

### Option 2: Manual Startup

**Start Backend:**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python scripts/seed_db.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Start Frontend:**
```bash
# In a new terminal, from project root
npm install
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Default Login Credentials

The system comes with pre-configured users:

1. **Administrator**
   - Username: `admin`
   - Password: `admin123`
   - Role: Full system access

2. **Manager**
   - Username: `manager`
   - Password: `manager123`
   - Role: Management functions

3. **Regular User**
   - Username: `user001`
   - Password: `user123`
   - Role: Tenant access

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check username/password in config
   - Verify database exists

2. **Port Already in Use**
   - Backend (8000): Kill any existing Python/FastAPI processes
   - Frontend (5173): Kill any existing Node.js/Vite processes

3. **Permission Issues (Windows)**
   - Run PowerShell as Administrator
   - Execute: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

4. **Module Not Found Errors**
   - Ensure virtual environment is activated
   - Re-run `pip install -r requirements.txt`

### Reset Database

If you need to reset the database:

```bash
cd backend
python scripts/reset_db.py
python scripts/seed_db.py
```

### Check Database Status

```bash
cd backend
python scripts/test_db.py
```

## System Architecture

```
Frontend (React + Chakra UI) → Backend (FastAPI) → Database (PostgreSQL)
     Port 5173                    Port 8000           Port 5432
```

The system uses:
- **Authentication**: JWT tokens with bcrypt password hashing
- **API**: RESTful endpoints with automatic documentation
- **Database**: PostgreSQL with SQLModel ORM
- **Frontend**: React with TypeScript and Chakra UI