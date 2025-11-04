from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserCreate
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update current user information"""
    update_data = user_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return current_user

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_create: UserCreate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Create new user (admin only)"""
    # Check if username already exists
    existing_username = session.exec(
        select(User).where(User.username == user_create.username)
    ).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = session.exec(
        select(User).where(User.email == user_create.email)
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create new user
    user_data = user_create.dict(exclude={"password"})
    user = User(
        **user_data,
        hashed_password=get_password_hash(user_create.password)
    )
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    building: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get list of users (admin only)"""
    statement = select(User)
    
    if building:
        statement = statement.where(User.building == building)
    if role:
        statement = statement.where(User.role == role)
    
    statement = statement.offset(skip).limit(limit)
    users = session.exec(statement).all()
    
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get user by ID (admin only)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Update user (admin only)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Delete user (admin only)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    session.delete(user)
    session.commit()
    
    return {"message": "User deleted successfully"}

@router.get("/stats/overview")
async def get_users_stats(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get users statistics (admin only)"""
    # Total users by role
    total_users = session.exec(select(func.count(User.id))).one()
    total_residents = session.exec(
        select(func.count(User.id)).where(User.role == "user")
    ).one()
    total_active = session.exec(
        select(func.count(User.id)).where(User.is_active == True)
    ).one()
    total_inactive = session.exec(
        select(func.count(User.id)).where(User.is_active == False)
    ).one()
    
    # Users by building
    buildings_query = select(
        User.building, 
        func.count(User.id).label('count')
    ).where(
        User.building.isnot(None),
        User.role == "user"
    ).group_by(User.building)
    
    buildings = session.exec(buildings_query).all()
    buildings_data = [{"building": b[0], "count": b[1]} for b in buildings]
    
    return {
        "total_users": total_users,
        "total_residents": total_residents,
        "total_active": total_active,
        "total_inactive": total_inactive,
        "buildings": buildings_data
    }