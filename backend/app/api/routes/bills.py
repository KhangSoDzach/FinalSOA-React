from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func, or_, delete 
from typing import List, Optional
from datetime import datetime, timedelta, date
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_accountant
from app.models.user import User, UserRole, OccupierType
from app.models.bill import Bill, Payment, BillStatus, PaymentStatus, BillType
from app.models.apartment import Apartment
from app.models.notification import Notification, NotificationType, NotificationStatus
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
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Get all bills (accountant/manager only)"""
    
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
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Create a new bill (accountant/manager only)"""
    
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
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Create multiple bills at once (accountant/manager only)"""
    
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
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Update a bill (accountant/manager only)"""
    
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
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Delete a bill (accountant/manager only)"""
    
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
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Get bills statistics (accountant/manager only)"""
    
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
def mark_overdue_bills(
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Mark all pending bills past due date as overdue (accountant/manager only)"""
    
    # Find all pending bills past due date
    statement = select(Bill).where(
        Bill.status == BillStatus.PENDING,
        Bill.due_date < datetime.utcnow()
    )
    
    bills = session.exec(statement).all()
    
    # Update status to overdue
    updated_count = 0
    for bill in bills:
        bill.status = BillStatus.OVERDUE
        session.add(bill)
        updated_count += 1
    
    session.commit()
    
    return {
        "message": f"Đã đánh dấu {updated_count} hóa đơn quá hạn",
        "updated_count": updated_count
    }

@router.post("/send-reminder")
async def send_payment_reminders(
    bill_ids: Optional[List[int]] = None,
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Send payment reminders for pending/overdue bills (accountant/manager only)"""
    
    # Build query
    statement = select(Bill).where(
        or_(Bill.status == BillStatus.PENDING, Bill.status == BillStatus.OVERDUE)
    )
    
    if bill_ids:
        statement = statement.where(Bill.id.in_(bill_ids))
    
    bills = session.exec(statement).all()
    
    # Create notification for each bill
    notifications_sent = 0
    for bill in bills:
        # Get user info
        user = session.get(User, bill.user_id)
        if not user:
            continue
            
        # Create notification
        notification = Notification(
            title=f"Nhắc nhở thanh toán: {bill.title}",
            content=f"Kính gửi {user.full_name},\n\nĐây là thông báo nhắc nhở về hóa đơn #{bill.bill_number} sắp đến hạn thanh toán.\n\n"
                   f"Thông tin hóa đơn:\n"
                   f"- Tiêu đề: {bill.title}\n"
                   f"- Số tiền: {bill.amount:,.0f} ₫\n"
                   f"- Hạn thanh toán: {bill.due_date.strftime('%d/%m/%Y')}\n"
                   f"- Trạng thái: {'Quá hạn' if bill.status == BillStatus.OVERDUE else 'Chưa thanh toán'}\n\n"
                   f"Vui lòng thanh toán trước hạn để tránh phát sinh phí phạt.\n\nTrân trọng,\nBan quản lý",
            type=NotificationType.BILL_REMINDER,
            priority=3 if bill.status == BillStatus.OVERDUE else 2,
            target_user_id=bill.user_id,
            status=NotificationStatus.SENT,
            sent_at=datetime.utcnow(),
            created_by=current_user.id
        )
        session.add(notification)
        notifications_sent += 1
    
    session.commit()
    
    return {
        "message": f"Đã gửi {notifications_sent} thông báo nhắc nhở",
        "notifications_sent": notifications_sent
    }

@router.get("/export-report")
async def export_bills_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None,
    bill_type_filter: Optional[str] = None,
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """Export bills report as CSV (accountant/manager only)"""
    
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
    
    is_staff = current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]
    if not is_staff and bill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this bill's payments"
        )
    
    statement = select(Payment).where(Payment.bill_id == bill_id)
    payments = session.exec(statement).all()
    
    return payments




@router.get("/my-bills", response_model=List[BillResponse])
async def get_my_bills(
    status: Optional[BillStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get bills for the current user"""
    statement = select(Bill).where(Bill.user_id == current_user.id)
    if status:
        statement = statement.where(Bill.status == status)
    
    statement = statement.order_by(Bill.due_date.desc())
    
    bills = session.exec(statement).all()
    
    return bills

@router.post("/request-pay", response_model=PaymentRequestResponse)
async def request_payment(
    request_data: PaymentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Request payment for a bill (generate and send OTP)"""
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
    otp_expiry_dt = datetime.utcnow() + timedelta(minutes=5) 

    payment = Payment(
        bill_id=bill.id,
        user_id=current_user.id,
        amount=bill.amount,
        status=PaymentStatus.PENDING,
        message="Chờ xác minh OTP",
        payment_date=datetime.utcnow(),
        otp=otp_code,
    )
    session.add(payment)
    session.commit()
    session.refresh(payment)

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

@router.post("/verify-otp", response_model=PaymentResponse)
async def verify_otp_and_pay(
    verify_data: OTPVerify,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Verify OTP and complete payment for a bill"""
    payment_statement = select(Payment).where(
        Payment.id == verify_data.payment_id,
        Payment.user_id == current_user.id
    )
    payment = session.exec(payment_statement).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Giao dịch thanh toán không tồn tại")

    if payment.status != PaymentStatus.PENDING:
        if payment.status == PaymentStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Giao dịch đã hoàn tất trước đó")
        if payment.status == PaymentStatus.OTP_EXPIRED:
             raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn. Vui lòng gửi lại yêu cầu.")
        raise HTTPException(status_code=400, detail=f"Trạng thái giao dịch không hợp lệ: {payment.status}")

    
    if payment.otp != verify_data.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không hợp lệ")

    bill = session.get(Bill, payment.bill_id)
    
    user_statement = select(User).where(User.id == current_user.id)
    user_to_update = session.exec(user_statement).first()
    
    if not user_to_update or user_to_update.balance < payment.amount:
        payment.status = PaymentStatus.FAILED
        session.add(payment)
        session.commit()
        raise HTTPException(status_code=400, detail="Lỗi: Số dư không đủ hoặc tài khoản người dùng không hợp lệ.")

    user_to_update.balance -= payment.amount
    bill.status = BillStatus.PAID
    bill.paid_at = datetime.utcnow()
    
    payment.status = PaymentStatus.COMPLETED
    payment.message = "Thanh toán thành công "
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
    """Resend OTP for payment request"""
    bill = session.get(Bill, request_data.bill_id)
    
    if not bill or bill.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Hóa đơn không tồn tại")
    if not current_user.email:
        raise HTTPException(status_code=400, detail="Tài khoản không có email để gửi OTP")

    payment_statement = select(Payment).where(
        Payment.bill_id == bill.id,
        Payment.user_id == current_user.id
    ).order_by(Payment.payment_date.desc()).limit(1)
    
    payment = session.exec(payment_statement).first()

    if payment and payment.status == PaymentStatus.PENDING:
        payment.status = PaymentStatus.OTP_EXPIRED
        session.add(payment)
        session.commit()

    return await request_payment(request_data, session, current_user)

@router.post("/generate-monthly-fees", response_model=dict)
async def generate_monthly_fees(
    month: Optional[int] = None,
    year: Optional[int] = None,
    include_parking: bool = True,
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """
    Generate monthly apartment fees for all residents with Pro-rata support
    (DEPRECATED: Use /admin/generate-monthly instead)
    """
    from app.services.bill_service import generate_monthly_bills_for_all
    
    # Use current month and year if not provided
    now = datetime.utcnow()
    target_month = month or now.month
    target_year = year or now.year
    
    # Calculate billing date (last day of the month)
    import calendar
    _, num_days = calendar.monthrange(target_year, target_month)
    billing_month = date(target_year, target_month, num_days)
    
    # Use the new Pro-rata service
    stats = generate_monthly_bills_for_all(
        session=session,
        billing_month=billing_month,
        include_parking=include_parking
    )
    
    return stats


# ============================================
# PRO-RATA BILL GENERATION ENDPOINTS
# ============================================

@router.post("/admin/generate-monthly", response_model=dict)
async def generate_monthly_bills_automatic(
    month: Optional[int] = None,
    year: Optional[int] = None,
    include_parking: bool = True,
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """
    Tự động tạo tất cả hóa đơn cho tháng (Management Fee + Parking Fee)
    Áp dụng Pro-rata cho căn hộ chuyển vào giữa tháng
    """
    from app.services.bill_service import generate_monthly_bills_for_all
    from datetime import date
    import calendar
    
    # Xác định tháng cần tạo bill
    now = date.today()
    target_month = month or now.month
    target_year = year or now.year
    
    # Lấy ngày cuối tháng làm billing_month
    _, num_days = calendar.monthrange(target_year, target_month)
    billing_month = date(target_year, target_month, num_days)
    
    # Gọi service layer
    stats = generate_monthly_bills_for_all(
        session=session,
        billing_month=billing_month,
        include_parking=include_parking
    )
    
    return {
        "success": True,
        "message": f"Đã tạo hóa đơn tháng {target_month}/{target_year}",
        "statistics": stats
    }


@router.post("/admin/generate-for-apartment/{apartment_id}", response_model=List[BillResponse])
async def generate_bills_for_single_apartment(
    apartment_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_accountant),
    session: Session = Depends(get_session)
):
    """
    Tạo hóa đơn cho 1 căn hộ cụ thể (Management Fee + Parking Fee)
    """
    from app.services.bill_service import generate_bills_for_apartment
    from datetime import date
    import calendar
    
    # Xác định tháng
    now = date.today()
    target_month = month or now.month
    target_year = year or now.year
    
    _, num_days = calendar.monthrange(target_year, target_month)
    billing_month = date(target_year, target_month, num_days)
    
    # Gọi service
    try:
        bills = generate_bills_for_apartment(
            session=session,
            apartment_id=apartment_id,
            billing_month=billing_month
        )
        
        return bills
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
