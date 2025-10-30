from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime
import uuid
import os
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.bill import Bill, Payment, BillStatus, PaymentStatus
from app.schemas.bill import (
    BillCreate, BillUpdate, BillResponse,
    PaymentCreate, PaymentUpdate, PaymentResponse, PaymentConfirm
)
from app.core.config import settings

router = APIRouter()

@router.get("/my-bills", response_model=List[BillResponse])
async def get_my_bills(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[BillStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's bills"""
    statement = select(Bill).where(Bill.user_id == current_user.id)
    
    if status:
        statement = statement.where(Bill.status == status)
    
    statement = statement.offset(skip).limit(limit).order_by(Bill.created_at.desc())
    bills = session.exec(statement).all()
    
    return bills

@router.get("/", response_model=List[BillResponse])
async def get_bills(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    user_id: Optional[int] = None,
    status: Optional[BillStatus] = None,
    building: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get all bills (admin only)"""
    statement = select(Bill)
    
    if user_id:
        statement = statement.where(Bill.user_id == user_id)
    if status:
        statement = statement.where(Bill.status == status)
    if building:
        statement = statement.join(User).where(User.building == building)
    
    statement = statement.offset(skip).limit(limit).order_by(Bill.created_at.desc())
    bills = session.exec(statement).all()
    
    return bills

@router.post("/", response_model=BillResponse)
async def create_bill(
    bill_create: BillCreate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Create new bill (admin only)"""
    # Generate unique bill number
    bill_number = f"BILL-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    bill = Bill(
        bill_number=bill_number,
        **bill_create.dict()
    )
    
    session.add(bill)
    session.commit()
    session.refresh(bill)
    
    return bill

@router.get("/{bill_id}", response_model=BillResponse)
async def get_bill(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get bill by ID"""
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Users can only view their own bills, admins can view any bill
    if current_user.role.value == "user" and bill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return bill

@router.put("/{bill_id}", response_model=BillResponse)
async def update_bill(
    bill_id: int,
    bill_update: BillUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Update bill (admin only)"""
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    update_data = bill_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bill, field, value)
    
    bill.updated_at = datetime.utcnow()
    session.add(bill)
    session.commit()
    session.refresh(bill)
    
    return bill

@router.post("/{bill_id}/payments", response_model=PaymentResponse)
async def create_payment(
    bill_id: int,
    payment_create: PaymentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create payment for bill"""
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Users can only pay their own bills
    if current_user.role.value == "user" and bill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Generate unique payment number
    payment_number = f"PAY-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    payment = Payment(
        payment_number=payment_number,
        user_id=current_user.id,
        bill_id=bill_id,
        **payment_create.dict()
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    return payment

@router.post("/{bill_id}/upload-evidence")
async def upload_payment_evidence(
    bill_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload payment evidence for bill"""
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Users can only upload evidence for their own bills
    if current_user.role.value == "user" and bill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"evidence_{bill_id}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Find the latest payment for this bill and user
    statement = select(Payment).where(
        Payment.bill_id == bill_id,
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc())
    payment = session.exec(statement).first()
    
    if payment:
        payment.evidence_url = file_path
        session.add(payment)
        session.commit()
    
    return {"message": "Evidence uploaded successfully", "file_path": file_path}

@router.put("/payments/{payment_id}/confirm", response_model=PaymentResponse)
async def confirm_payment(
    payment_id: int,
    payment_confirm: PaymentConfirm,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Confirm payment (admin only)"""
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    payment.status = payment_confirm.status
    payment.confirmed_by = current_user.id
    payment.confirmed_at = datetime.utcnow()
    
    if payment_confirm.notes:
        payment.notes = payment_confirm.notes
    
    # Update bill status if payment is completed
    if payment_confirm.status == PaymentStatus.COMPLETED:
        bill = session.get(Bill, payment.bill_id)
        if bill:
            bill.status = BillStatus.PAID
            bill.paid_at = datetime.utcnow()
            session.add(bill)
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    return payment

@router.get("/{bill_id}/payments", response_model=List[PaymentResponse])
async def get_bill_payments(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get payments for a bill"""
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Users can only view payments for their own bills
    if current_user.role.value == "user" and bill.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    statement = select(Payment).where(Payment.bill_id == bill_id)
    payments = session.exec(statement).all()
    
    return payments