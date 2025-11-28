from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func, or_, delete 
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_session
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole, OccupierType
from app.models.bill import Bill, Payment, BillStatus, PaymentStatus, BillType
from app.models.apartment import Apartment
from app.schemas.bill import BillResponse, PaymentResponse, PaymentRequest, OTPVerify, PaymentRequestResponse, BillCreate, BillUpdate
from decimal import Decimal
import secrets
import string
from app.core.email import generate_otp, send_otp_email_async
import io
import csv

router = APIRouter()

# --- Utility Functions ---

def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))

async def send_otp_email(email: str, otp: str, bill_id: int):
    await send_otp_email_async(email, otp, bill_id)

def generate_bill_number() -> str:
    """Generate a unique bill number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    random_suffix = "".join(secrets.choice(string.digits) for _ in range(4))
    return f"BILL-{timestamp}-{random_suffix}"

# --- API Endpoints ---

# ============================================
# ADMIN ENDPOINTS
# ============================================

@router.get("/", response_model=List[BillResponse])
async def get_all_bills(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = None,
    status: Optional[BillStatus] = None,
    building: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all bills (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can access all bills"
        )
    
    statement = select(Bill)
    
    if user_id:
        statement = statement.where(Bill.user_id == user_id)
    if status:
        statement = statement.where(Bill.status == status)
    if building:
        statement = statement.join(User).where(User.building == building)
    
    statement = statement.offset(skip).limit(limit)
    bills = session.exec(statement).all()
    
    return bills


@router.post("/", response_model=BillResponse)
async def create_bill(
    bill_data: BillCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new bill (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create bills"
        )
    
    # Check if user exists
    user = session.get(User, bill_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate bill number
    bill_number = generate_bill_number()
    
    # Create bill
    bill = Bill(
        bill_number=bill_number,
        user_id=bill_data.user_id,
        bill_type=bill_data.bill_type,
        title=bill_data.title,
        description=bill_data.description,
        amount=bill_data.amount,
        due_date=bill_data.due_date,
        status=BillStatus.PENDING
    )
    
    session.add(bill)
    session.commit()
    session.refresh(bill)
    
    return bill

@router.post("/batch-create", response_model=List[BillResponse])
async def batch_create_bills(
    bills_data: List[BillCreate],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create multiple bills at once (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create bills"
        )
    
    created_bills = []
    
    for bill_data in bills_data:
        # Check if user exists
        user = session.get(User, bill_data.user_id)
        if not user:
            continue  # Skip invalid users
        
        # Generate bill number
        bill_number = generate_bill_number()
        
        # Create bill
        bill = Bill(
            bill_number=bill_number,
            user_id=bill_data.user_id,
            bill_type=bill_data.bill_type,
            title=bill_data.title,
            description=bill_data.description,
            amount=bill_data.amount,
            due_date=bill_data.due_date,
            status=BillStatus.PENDING
        )
        
        session.add(bill)
        created_bills.append(bill)
    
    session.commit()
    
    # Refresh all created bills
    for bill in created_bills:
        session.refresh(bill)
    
    return created_bills

@router.put("/{bill_id}", response_model=BillResponse)
async def update_bill(
    bill_id: int,
    bill_data: BillUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a bill (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can update bills"
        )
    
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Update fields
    if bill_data.title is not None:
        bill.title = bill_data.title
    if bill_data.description is not None:
        bill.description = bill_data.description
    if bill_data.amount is not None:
        bill.amount = bill_data.amount
    if bill_data.due_date is not None:
        bill.due_date = bill_data.due_date
    if bill_data.status is not None:
        bill.status = bill_data.status
    
    session.add(bill)
    session.commit()
    session.refresh(bill)
    
    return bill

@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a bill (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete bills"
        )
    
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Delete related payments first
    delete_payments = delete(Payment).where(Payment.bill_id == bill_id)
    session.execute(delete_payments)
    
    session.delete(bill)
    session.commit()
    
    return {"message": "Bill deleted successfully"}

@router.get("/statistics")
async def get_bills_statistics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get bills statistics (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can access statistics"
        )
    
    statement = select(Bill)
    
    if start_date:
        statement = statement.where(Bill.due_date >= start_date)
    if end_date:
        statement = statement.where(Bill.due_date <= end_date)
    
    bills = session.exec(statement).all()
    
    # Calculate statistics
    total_bills = len(bills)
    bills_by_status = {
        "pending": len([b for b in bills if b.status == BillStatus.PENDING]),
        "paid": len([b for b in bills if b.status == BillStatus.PAID]),
        "overdue": len([b for b in bills if b.status == BillStatus.OVERDUE]),
        "cancelled": len([b for b in bills if b.status == BillStatus.CANCELLED])
    }
    
    bills_by_type = {}
    for bill_type in BillType:
        bills_by_type[bill_type.value] = len([b for b in bills if b.bill_type == bill_type])
    
    amounts = {
        "total_amount": sum(b.amount for b in bills),
        "paid_amount": sum(b.amount for b in bills if b.status == BillStatus.PAID),
        "pending_amount": sum(b.amount for b in bills if b.status == BillStatus.PENDING),
        "overdue_amount": sum(b.amount for b in bills if b.status == BillStatus.OVERDUE)
    }
    
    return {
        "total_bills": total_bills,
        "bills_by_status": bills_by_status,
        "bills_by_type": bills_by_type,
        "amounts": amounts
    }

@router.put("/mark-overdue")
async def mark_overdue_bills(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mark all pending bills past due date as overdue (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can mark bills as overdue"
        )
    
    # Find all pending bills past due date
    statement = select(Bill).where(
        Bill.status == BillStatus.PENDING,
        Bill.due_date < datetime.utcnow()
    )
    
    bills = session.exec(statement).all()
    
    # Update status to overdue
    for bill in bills:
        bill.status = BillStatus.OVERDUE
        session.add(bill)
    
    session.commit()
    
    return {
        "message": f"Marked {len(bills)} bills as overdue",
        "updated_count": len(bills)
    }

@router.post("/send-reminder")
async def send_payment_reminders(
    bill_ids: Optional[List[int]] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Send payment reminders for pending/overdue bills (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can send reminders"
        )
    
    # Build query
    statement = select(Bill).where(
        or_(Bill.status == BillStatus.PENDING, Bill.status == BillStatus.OVERDUE)
    )
    
    if bill_ids:
        statement = statement.where(Bill.id.in_(bill_ids))
    
    bills = session.exec(statement).all()
    
    # TODO: Implement notification sending logic
    # For now, just return count
    notifications_sent = len(bills)
    
    return {
        "message": f"Sent {notifications_sent} reminders",
        "notifications_sent": notifications_sent
    }

@router.get("/export-report")
async def export_bills_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None,
    bill_type_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Export bills report as CSV (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can export reports"
        )
    
    statement = select(Bill)
    
    if start_date:
        statement = statement.where(Bill.due_date >= datetime.fromisoformat(start_date))
    if end_date:
        statement = statement.where(Bill.due_date <= datetime.fromisoformat(end_date))
    if status_filter:
        statement = statement.where(Bill.status == status_filter)
    if bill_type_filter:
        statement = statement.where(Bill.bill_type == bill_type_filter)
    
    bills = session.exec(statement).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Bill Number', 'User ID', 'Type', 'Title', 'Amount', 
        'Due Date', 'Status', 'Paid At'
    ])
    
    # Write data
    for bill in bills:
        writer.writerow([
            bill.bill_number,
            bill.user_id,
            bill.bill_type.value,
            bill.title,
            float(bill.amount),
            bill.due_date.isoformat(),
            bill.status.value,
            bill.paid_at.isoformat() if bill.paid_at else ''
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=bills_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        }
    )

@router.get("/{bill_id}/payments", response_model=List[PaymentResponse])
async def get_bill_payments(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all payments for a bill"""
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Check permission
    if current_user.role != UserRole.ADMIN and bill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this bill's payments"
        )
    
    statement = select(Payment).where(Payment.bill_id == bill_id)
    payments = session.exec(statement).all()
    
    return payments

# ============================================
# USER ENDPOINTS
# ============================================


@router.get("/my-bills", response_model=List[BillResponse])
async def get_my_bills(
    status: Optional[BillStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(Bill).where(Bill.user_id == current_user.id)
    if status:
        statement = statement.where(Bill.status == status)
    
    # Sắp xếp theo due_date giảm dần (bill mới nhất trước)
    statement = statement.order_by(Bill.due_date.desc())
    
    bills = session.exec(statement).all()
    
    # SỬA LỖI 422: Loại bỏ logic ép kiểu lỗi
    return bills

@router.post("/request-pay", response_model=PaymentRequestResponse)
async def request_payment(
    request_data: PaymentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    bill = session.get(Bill, request_data.bill_id)
    
    if not bill:
        raise HTTPException(status_code=404, detail="Hóa đơn không tồn tại")
    if bill.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập hóa đơn này")
    if bill.status != BillStatus.PENDING:
        raise HTTPException(status_code=400, detail="Hóa đơn không thể thanh toán")
    if current_user.balance < bill.amount:
        raise HTTPException(status_code=400, detail="Số dư không đủ để thanh toán")
    if not current_user.email:
        raise HTTPException(status_code=400, detail="Tài khoản không có email để gửi OTP")

    # XÓA: Xóa các giao dịch cũ đang ở trạng thái PENDING hoặc OTP_EXPIRED
    delete_statement = delete(Payment).where(
        Payment.bill_id == bill.id,
        or_(
            Payment.status == PaymentStatus.PENDING, 
            Payment.status == PaymentStatus.OTP_EXPIRED
        )
    )
    session.execute(delete_statement)
    session.commit()

    otp_code = generate_otp()
    # Dùng biến cục bộ này để gửi cho frontend, không lưu vào DB
    otp_expiry_dt = datetime.utcnow() + timedelta(minutes=5) 

    payment = Payment(
        bill_id=bill.id,
        user_id=current_user.id,
        amount=bill.amount,
        status=PaymentStatus.PENDING,
        message="Chờ xác minh OTP",
        payment_date=datetime.utcnow(),
        otp=otp_code,
        # ĐÃ XÓA: otp_expires_at
    )
    session.add(payment)
    session.commit()
    session.refresh(payment)

    # THỰC HIỆN GỬI EMAIL THỰC TẾ
    try:
        await send_otp_email(current_user.email, otp_code, bill.id)
    except HTTPException as e:
        session.delete(payment)
        session.commit() 
        raise e

    return PaymentRequestResponse(
        payment_id=payment.id,
        message="OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.",
        bill_amount=bill.amount,
        otp_valid_until=otp_expiry_dt,
    )

# @router.get("/{bill_id}", response_model=BillResponse)
# async def get_bill_by_id(
#     bill_id: int,
#     current_user: User = Depends(get_current_user),
#     session: Session = Depends(get_session)
# ):
#     """Get bill by ID"""
#     bill = session.get(Bill, bill_id)
#     if not bill:
#         raise HTTPException(status_code=404, detail="Bill not found")
    
#     # Check permission: admin or owner
#     if current_user.role != UserRole.ADMIN and bill.user_id != current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized to access this bill"
#         )
    
#     return bill
@router.post("/verify-otp", response_model=PaymentResponse)
async def verify_otp_and_pay(
    verify_data: OTPVerify,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    
    # 1. Tìm bản ghi Payment và khóa nó
    payment_statement = select(Payment).where(
        Payment.id == verify_data.payment_id,
        Payment.user_id == current_user.id
    )
    payment = session.exec(payment_statement).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Giao dịch thanh toán không tồn tại")

    # 2. Kiểm tra trạng thái giao dịch
    if payment.status != PaymentStatus.PENDING:
        if payment.status == PaymentStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Giao dịch đã hoàn tất trước đó")
        if payment.status == PaymentStatus.OTP_EXPIRED:
             raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn. Vui lòng gửi lại yêu cầu.")
        raise HTTPException(status_code=400, detail=f"Trạng thái giao dịch không hợp lệ: {payment.status}")

    # 3. KIỂM TRA OTP HẾT HẠN - Logic này đã được chuyển sang frontend
    
    # 4. Kiểm tra mã OTP
    if payment.otp != verify_data.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không hợp lệ")

    # 5. Xác minh hóa đơn và user balance
    bill = session.get(Bill, payment.bill_id)
    
    user_statement = select(User).where(User.id == current_user.id)
    user_to_update = session.exec(user_statement).first()
    
    if not user_to_update or user_to_update.balance < payment.amount:
        payment.status = PaymentStatus.FAILED
        session.add(payment)
        session.commit()
        raise HTTPException(status_code=400, detail="Lỗi: Số dư không đủ hoặc tài khoản người dùng không hợp lệ.")

    # 6. Thực hiện giao dịch: Trừ số dư và cập nhật Bill
    user_to_update.balance -= payment.amount
    bill.status = BillStatus.PAID
    bill.paid_at = datetime.utcnow()
    
    # 7. Cập nhật Payment
    payment.status = PaymentStatus.COMPLETED
    payment.message = "Thanh toán thành công qua OTP"
    payment.otp = None 
    payment.payment_date = datetime.utcnow()

    session.add(user_to_update)
    session.add(bill)
    session.add(payment)
    session.commit() 

    payment_response_data = payment.model_dump()
    payment_response_data['user_id'] = str(payment.user_id) 
    return payment

@router.post("/resend-otp", response_model=PaymentRequestResponse)
async def resend_otp(
    request_data: PaymentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    bill = session.get(Bill, request_data.bill_id)
    
    if not bill or bill.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Hóa đơn không tồn tại")
    if not current_user.email:
        raise HTTPException(status_code=400, detail="Tài khoản không có email để gửi OTP")

    # Tìm giao dịch OTP gần nhất
    payment_statement = select(Payment).where(
        Payment.bill_id == bill.id,
        Payment.user_id == current_user.id
    ).order_by(Payment.payment_date.desc()).limit(1)
    
    payment = session.exec(payment_statement).first()

    if payment and payment.status == PaymentStatus.PENDING:
        # ĐẶT TRẠNG THÁI CŨ LÀ OTP_EXPIRED
        payment.status = PaymentStatus.OTP_EXPIRED
        session.add(payment)
        session.commit()

    return await request_payment(request_data, session, current_user)

@router.post("/generate-monthly-fees", response_model=List[BillResponse])
async def generate_monthly_fees(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Generate monthly apartment fees for all renters (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can generate monthly fees"
        )
    
    # Use current month and year if not provided
    now = datetime.utcnow()
    target_month = month or now.month
    target_year = year or now.year
    
    # Calculate due date (end of the month)
    if target_month == 12:
        next_month = 1
        next_year = target_year + 1
    else:
        next_month = target_month + 1
        next_year = target_year
    
    due_date = datetime(next_year, next_month, 1) - timedelta(days=1)
    due_date = due_date.replace(hour=23, minute=59, second=59)
    
    # Get all apartments with residents
    statement = select(Apartment).where(Apartment.resident_id.isnot(None))
    apartments = session.exec(statement).all()
    
    created_bills = []
    
    for apartment in apartments:
        # Get resident information
        resident = session.get(User, apartment.resident_id)
        if not resident:
            continue
        
        # Only create bills for renters
        if resident.occupier != OccupierType.RENTER:
            continue
        
        # Check if fee is set for this apartment
        if apartment.monthly_fee <= 0:
            continue
        
        # Check if bill already exists for this month
        existing_bill = session.exec(
            select(Bill).where(
                Bill.user_id == resident.id,
                Bill.bill_type == BillType.MANAGEMENT_FEE,
                func.extract('month', Bill.due_date) == target_month,
                func.extract('year', Bill.due_date) == target_year
            )
        ).first()
        
        if existing_bill:
            continue  # Skip if already created
        
        # Generate bill number
        bill_number = generate_bill_number()
        
        # Create bill
        bill = Bill(
            bill_number=bill_number,
            user_id=resident.id,
            bill_type=BillType.MANAGEMENT_FEE,
            title=f"Phí quản lý tháng {target_month}/{target_year} - Căn hộ {apartment.apartment_number}",
            description=f"Phí quản lý hàng tháng cho căn hộ {apartment.apartment_number}, tòa {apartment.building}. Loại cư dân: {resident.occupier.value}",
            amount=Decimal(str(apartment.monthly_fee)),
            due_date=due_date,
            status=BillStatus.PENDING
        )
        
        session.add(bill)
        created_bills.append(bill)
    
    session.commit()
    
    # Refresh all created bills
    for bill in created_bills:
        session.refresh(bill)
    
    return created_bills
