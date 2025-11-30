from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.security import verify_token
from app.models.user import User, UserRole

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Deprecated: Use get_current_manager instead. Manager has full admin access."""
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager role required"
        )
    return current_user

def get_current_manager(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify manager role (Quản lý) - Full system access"""
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager role required"
        )
    return current_user

def get_current_accountant(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify accountant role (Kế toán) - Manager can also access"""
    if current_user.role not in [UserRole.MANAGER, UserRole.ACCOUNTANT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accountant role required"
        )
    return current_user

def get_current_receptionist(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify receptionist role (Lễ tân) - Manager can also access"""
    if current_user.role not in [UserRole.MANAGER, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionist role required"
        )
    return current_user

def get_current_staff(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify any staff role (Manager, Accountant, or Receptionist)"""
    if current_user.role not in [UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff role required"
        )
    return current_user