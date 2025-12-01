from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlmodel import Session, select
from datetime import timedelta, datetime
from app.core.database import get_session
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.email import generate_otp, send_reset_password_email
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserCreate, UserResponse
from app.core.config import settings
from app.api.dependencies import get_current_user

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, session: Session = Depends(get_session)):
    """Authenticate user and return access token"""
    # Allow login with username or email
    statement = select(User).where(
        (User.username == user_login.username) | (User.email == user_login.username)
    )
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

@router.post("/forgot-password")
async def forgot_password(
    email: str,
    session: Session = Depends(get_session)
):
    """Request password reset - Send OTP to email"""
    # Tìm user theo email
    user = session.exec(select(User).where(User.email == email)).first()
    
    # Không tiết lộ email có tồn tại hay không (security best practice)
    if not user:
        return {"message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP"}
    
    if not user.is_active:
        return {"message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP"}
    
    # Generate OTP (6 số, hết hạn sau 10 phút)
    otp = generate_otp(6)
    
    # Lưu OTP vào database
    user.reset_otp = otp
    user.reset_otp_created_at = datetime.utcnow()
    session.add(user)
    session.commit()
    
    # Gửi email
    try:
        await send_reset_password_email(user.email, user.full_name, otp)
    except Exception as e:
        print(f"Error sending reset password email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể gửi email. Vui lòng thử lại sau."
        )
    
    return {"message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP"}

@router.post("/verify-reset-otp")
async def verify_reset_otp(
    email: str,
    otp: str,
    session: Session = Depends(get_session)
):
    """Verify OTP for password reset"""
    user = session.exec(
        select(User).where(
            User.email == email,
            User.reset_otp == otp
        )
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không hợp lệ"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản không hoạt động"
        )
    
    # Kiểm tra OTP còn hạn không (10 phút)
    if not user.reset_otp_created_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không hợp lệ"
        )
    
    otp_age = datetime.utcnow() - user.reset_otp_created_at
    if otp_age.total_seconds() > 600:  # 10 minutes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới"
        )
    
    return {"message": "Mã OTP hợp lệ", "valid": True}

@router.post("/reset-password")
async def reset_password(
    email: str,
    otp: str,
    new_password: str,
    session: Session = Depends(get_session)
):
    """Reset password with OTP"""
    # Validate password length
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có ít nhất 6 ký tự"
        )
    
    # Find user with matching email and OTP
    user = session.exec(
        select(User).where(
            User.email == email,
            User.reset_otp == otp
        )
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không hợp lệ"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản không hoạt động"
        )
    
    # Check OTP expiration
    if not user.reset_otp_created_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không hợp lệ"
        )
    
    otp_age = datetime.utcnow() - user.reset_otp_created_at
    if otp_age.total_seconds() > 600:  # 10 minutes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới"
        )
    
    # Reset password
    user.hashed_password = get_password_hash(new_password)
    user.reset_otp = None
    user.reset_otp_created_at = None
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    
    return {"message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập"}
