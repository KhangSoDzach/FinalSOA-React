from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlmodel import Session, select
from datetime import timedelta
from app.core.database import get_session
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserCreate, UserResponse
from app.core.config import settings
from app.api.dependencies import get_current_user

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, session: Session = Depends(get_session)):
    """Authenticate user and return access token"""
    statement = select(User).where(User.username == user_login.username)
    user = session.exec(statement).first()
    
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
async def register(user_create: UserCreate, session: Session = Depends(get_session)):
    """Register new user"""
    # Check if username already exists
    statement = select(User).where(User.username == user_create.username)
    if session.exec(statement).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    statement = select(User).where(User.email == user_create.email)
    if session.exec(statement).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_create.password)
    user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_password,
        full_name=user_create.full_name,
        phone=user_create.phone,
        role=user_create.role,
        apartment_number=user_create.apartment_number,
        building=user_create.building
    )
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user