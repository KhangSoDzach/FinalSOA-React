from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func, or_, delete 
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_session
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.bill import Bill, Payment, BillStatus, PaymentStatus
from app.schemas.bill import BillResponse, PaymentResponse, PaymentRequest, OTPVerify, PaymentRequestResponse
from decimal import Decimal
import secrets
import string
from app.core.email import generate_otp, send_otp_email_async 

router = APIRouter()

# --- Utility Functions ---

def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))

async def send_otp_email(email: str, otp: str, bill_id: int):
    await send_otp_email_async(email, otp, bill_id)

# --- API Endpoints ---

@router.get("/my-bills", response_model=List[BillResponse])
async def get_my_bills(
    status: Optional[BillStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(Bill).where(Bill.user_id == current_user.id)
    if status:
        statement = statement.where(Bill.status == status)
    
    # ĐÃ SỬA: Loại bỏ order_by(Bill.created_at.desc()) vì trường này đã bị xóa khỏi Bill model
    # statement = statement.order_by(Bill.created_at.desc())
    
    bills = session.exec(statement).all()
    
    results = []
    for bill in bills:
        bill_data = bill.model_dump()
        bill_data['user_id'] = str(bill.user_id) 
        results.append(bill_data)
        
    return results

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
