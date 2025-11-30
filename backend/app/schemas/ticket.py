from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.ticket import TicketCategory, TicketPriority, TicketStatus

# --- CÁC MODELS CƠ BẢN CHO MỐI QUAN HỆ LỒNG NHAU (USER) ---

class UserBase(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True

# --- 1. TICKET REQUEST MODELS ---

class TicketBase(BaseModel):
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority = TicketPriority.NORMAL
    
class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    # Các trường User có thể cập nhật
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TicketCategory] = None
    priority: Optional[TicketPriority] = None
    
    # Các trường Admin có thể cập nhật
    status: Optional[TicketStatus] = None
    assigned_to: Optional[int] = None 
    assigned_name: Optional[str] = None
    assigned_role: Optional[str] = None
    resolution_notes: Optional[str] = None
    
class TicketAssign(BaseModel):
    assigned_name: str
    assigned_role: str
    status: Optional[TicketStatus] = None  # Cho phép thay đổi trạng thái khi assign 

class TicketResolve(BaseModel):
    resolution_notes: str

# --- 2. TICKET RESPONSE MODEL (Tổng hợp và Tối giản) ---

class TicketResponse(TicketBase):
    """
    Model Response chính, chỉ chứa thông tin cốt lõi và mối quan hệ người dùng.
    Attachments và Logs đã bị loại bỏ.
    """
    id: int
    user_id: int 
    
    # Mối quan hệ User lồng nhau
    user: Optional[UserBase] = None 
    assigned_user: Optional[UserBase] = None
    resolved_by_user: Optional[UserBase] = None
    
    status: TicketStatus
    assigned_to: Optional[int] = None
    assigned_name: Optional[str] = None
    assigned_role: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    resolution_notes: Optional[str] = None
    
    class Config:
        from_attributes = True

# TicketDetailResponse đã bị loại bỏ vì nó giống hệt TicketResponse

# --- 3. THỐNG KÊ ---

class TicketStats(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    # Chỉ giữ lại thời gian giải quyết trung bình (dựa trên created_at và resolved_at)
    average_resolution_time_hours: Optional[float] = None 
    # Loại bỏ satisfaction_rating
    satisfaction_rating: Optional[float] = None