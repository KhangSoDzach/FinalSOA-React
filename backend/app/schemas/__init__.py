from .user import UserCreate, UserUpdate, UserResponse, UserLogin, Token,PasswordChange
from .bill import (
    BillCreate, BillUpdate, BillResponse, 
    PaymentCreate, PaymentUpdate, PaymentResponse,
    PaymentRequest, OTPVerify, PaymentRequestResponse
)
from .cashflow import CashFlowCreate, CashFlowUpdate, CashFlowResponse, BankStatementCreate, BankStatementResponse, ReconcileRequest
from .notification import NotificationCreate, NotificationUpdate, NotificationResponse, NotificationResponseCreate, NotificationStats
from .ticket import TicketCreate, TicketUpdate, TicketResponse, TicketAssign, TicketResolve, TicketStats
from .service import ServiceCreate, ServiceUpdate, ServiceResponse, ServiceBookingCreate, ServiceBookingUpdate, ServiceBookingResponse, BookingConfirm, BookingFeedback
from .apartment import ApartmentCreate, ApartmentUpdate, ApartmentResponse, ApartmentWithResident, ApartmentRegisterUser
from .vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleWithUserResponse, VehicleApproval, VehicleStats

__all__ = [
    # User schemas
    "UserCreate", "UserUpdate", "UserResponse", "UserLogin", "Token","PasswordChange",
    
    # Bill schemas (Đã xóa PaymentConfirm và thêm các schemas OTP)
    "BillCreate", "BillUpdate", "BillResponse", "PaymentCreate", "PaymentUpdate", 
    "PaymentResponse", "PaymentRequest", "OTPVerify", "PaymentRequestResponse",
    
    # Cashflow schemas
    "CashFlowCreate", "CashFlowUpdate", "CashFlowResponse", "BankStatementCreate", "BankStatementResponse", "ReconcileRequest",
    
    # Notification schemas
    "NotificationCreate", "NotificationUpdate", "NotificationResponse", "NotificationResponseCreate", "NotificationStats",
    
    # Ticket schemas
    "TicketCreate", "TicketUpdate", "TicketResponse", "TicketAssign", "TicketResolve", "TicketStats",
    
    # Service schemas
    "ServiceCreate", "ServiceUpdate", "ServiceResponse", "ServiceBookingCreate", "ServiceBookingUpdate", "ServiceBookingResponse", "BookingConfirm", "BookingFeedback",
    
    # Apartment schemas
    "ApartmentCreate", "ApartmentUpdate", "ApartmentResponse", "ApartmentWithResident", "ApartmentRegisterUser",
    
    # Vehicle schemas
    "VehicleCreate", "VehicleUpdate", "VehicleResponse", "VehicleWithUserResponse", "VehicleApproval", "VehicleStats"
]