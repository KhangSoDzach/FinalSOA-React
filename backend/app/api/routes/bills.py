from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
import io
import csv
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.bill import Bill, Payment, BillStatus, PaymentStatus, BillType
from app.models.notification import Notification, NotificationType, NotificationStatus
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
    limit: int = Query(100, ge=1, le=10000),
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

# IMPORTANT: Specific routes must come BEFORE parameterized routes like /{bill_id}
# to avoid FastAPI matching them as bill_id parameter

@router.get("/statistics", status_code=status.HTTP_200_OK)
async def get_bill_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get bill statistics (admin only)"""
    
    # Parse and set default date range if not provided
    if end_date:
        try:
            end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except:
            end_date_dt = datetime.utcnow()
    else:
        end_date_dt = datetime.utcnow()
    
    if start_date:
        try:
            start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except:
            start_date_dt = end_date_dt - timedelta(days=30)
    else:
        start_date_dt = end_date_dt - timedelta(days=30)
    
    # Total bills
    total_bills_stmt = select(func.count(Bill.id)).where(
        and_(Bill.created_at >= start_date_dt, Bill.created_at <= end_date_dt)
    )
    total_bills = session.exec(total_bills_stmt).first() or 0
    
    # Bills by status
    pending_stmt = select(func.count(Bill.id)).where(Bill.status == BillStatus.PENDING)
    pending_count = session.exec(pending_stmt).first() or 0
    
    paid_stmt = select(func.count(Bill.id)).where(Bill.status == BillStatus.PAID)
    paid_count = session.exec(paid_stmt).first() or 0
    
    overdue_stmt = select(func.count(Bill.id)).where(Bill.status == BillStatus.OVERDUE)
    overdue_count = session.exec(overdue_stmt).first() or 0
    
    cancelled_stmt = select(func.count(Bill.id)).where(Bill.status == BillStatus.CANCELLED)
    cancelled_count = session.exec(cancelled_stmt).first() or 0
    
    # Total amounts
    total_amount_stmt = select(func.sum(Bill.amount)).where(
        and_(Bill.created_at >= start_date_dt, Bill.created_at <= end_date_dt)
    )
    total_amount = session.exec(total_amount_stmt).first() or 0
    
    paid_amount_stmt = select(func.sum(Bill.amount)).where(
        and_(
            Bill.status == BillStatus.PAID,
            Bill.created_at >= start_date_dt,
            Bill.created_at <= end_date_dt
        )
    )
    paid_amount = session.exec(paid_amount_stmt).first() or 0
    
    pending_amount_stmt = select(func.sum(Bill.amount)).where(
        and_(
            Bill.status == BillStatus.PENDING,
            Bill.created_at >= start_date_dt,
            Bill.created_at <= end_date_dt
        )
    )
    pending_amount = session.exec(pending_amount_stmt).first() or 0
    
    # Bills by type
    bills_by_type = {}
    for bill_type in BillType:
        type_stmt = select(func.count(Bill.id), func.sum(Bill.amount)).where(
            and_(
                Bill.bill_type == bill_type,
                Bill.created_at >= start_date_dt,
                Bill.created_at <= end_date_dt
            )
        )
        result = session.exec(type_stmt).first()
        bills_by_type[bill_type.value] = {
            "count": result[0] or 0,
            "total_amount": float(result[1] or 0)
        }
    
    return {
        "date_range": {
            "start_date": start_date_dt.isoformat(),
            "end_date": end_date_dt.isoformat()
        },
        "total_bills": total_bills,
        "bills_by_status": {
            "pending": pending_count,
            "paid": paid_count,
            "overdue": overdue_count,
            "cancelled": cancelled_count
        },
        "amounts": {
            "total_amount": float(total_amount),
            "paid_amount": float(paid_amount),
            "pending_amount": float(pending_amount),
            "collection_rate": float(paid_amount / total_amount * 100) if total_amount > 0 else 0
        },
        "bills_by_type": bills_by_type
    }

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

@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bill(
    bill_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Delete bill (admin only)"""
    bill = session.get(Bill, bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Delete associated payments first
    statement = select(Payment).where(Payment.bill_id == bill_id)
    payments = session.exec(statement).all()
    for payment in payments:
        session.delete(payment)
    
    session.delete(bill)
    session.commit()
    
    return None

@router.post("/send-reminder", status_code=status.HTTP_200_OK)
async def send_payment_reminder(
    bill_ids: Optional[List[int]] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Send payment reminder notifications (admin only)
    
    If bill_ids is provided, send reminders for specific bills.
    If not provided, send reminders for all overdue and pending bills.
    """
    if bill_ids:
        statement = select(Bill).where(
            and_(
                Bill.id.in_(bill_ids),
                or_(Bill.status == BillStatus.PENDING, Bill.status == BillStatus.OVERDUE)
            )
        )
    else:
        statement = select(Bill).where(
            or_(Bill.status == BillStatus.PENDING, Bill.status == BillStatus.OVERDUE)
        )
    
    bills = session.exec(statement).all()
    
    notifications_sent = 0
    for bill in bills:
        # Create notification for bill owner
        notification = Notification(
            title="Payment Reminder",
            content=f"Reminder: Bill {bill.bill_number} - {bill.title} is {'overdue' if bill.status == BillStatus.OVERDUE else 'due soon'}. Amount: {bill.amount} VND. Due date: {bill.due_date.strftime('%Y-%m-%d')}",
            type=NotificationType.BILL_REMINDER,
            priority=3 if bill.status == BillStatus.OVERDUE else 2,
            target_audience=f"user_{bill.user_id}",
            status=NotificationStatus.SENT,
            sent_at=datetime.utcnow(),
            created_by=current_user.id
        )
        session.add(notification)
        notifications_sent += 1
    
    session.commit()
    
    return {
        "message": f"Payment reminders sent successfully",
        "notifications_sent": notifications_sent,
        "bills_count": len(bills)
    }

@router.get("/export-report", status_code=status.HTTP_200_OK)
async def export_bill_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[BillStatus] = None,
    bill_type_filter: Optional[BillType] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Export bill report as CSV (admin only)"""
    
    # Parse and set default date range if not provided
    if end_date:
        try:
            end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except:
            end_date_dt = datetime.utcnow()
    else:
        end_date_dt = datetime.utcnow()
    
    if start_date:
        try:
            start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except:
            start_date_dt = end_date_dt - timedelta(days=30)
    else:
        start_date_dt = end_date_dt - timedelta(days=30)
    
    # Build query
    statement = select(Bill, User).join(User).where(
        and_(Bill.created_at >= start_date_dt, Bill.created_at <= end_date_dt)
    )
    
    if status_filter:
        statement = statement.where(Bill.status == status_filter)
    
    if bill_type_filter:
        statement = statement.where(Bill.bill_type == bill_type_filter)
    
    statement = statement.order_by(Bill.created_at.desc())
    results = session.exec(statement).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Bill Number', 'Bill Type', 'Title', 'Description',
        'Amount (VND)', 'Due Date', 'Status', 'Created Date',
        'Paid Date', 'User ID', 'Username', 'Full Name',
        'Apartment', 'Building', 'Email', 'Phone'
    ])
    
    # Write data
    for bill, user in results:
        writer.writerow([
            bill.bill_number,
            bill.bill_type.value,
            bill.title,
            bill.description or '',
            float(bill.amount),
            bill.due_date.strftime('%Y-%m-%d'),
            bill.status.value,
            bill.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            bill.paid_at.strftime('%Y-%m-%d %H:%M:%S') if bill.paid_at else '',
            user.id,
            user.username,
            user.full_name,
            user.apartment_number or '',
            user.building or '',
            user.email,
            user.phone or ''
        ])
    
    # Prepare response
    output.seek(0)
    filename = f"bill_report_{start_date_dt.strftime('%Y%m%d')}_{end_date_dt.strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/batch-create", response_model=List[BillResponse])
async def batch_create_bills(
    bills_data: List[BillCreate],
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Create multiple bills at once (admin only)"""
    created_bills = []
    
    for bill_create in bills_data:
        # Generate unique bill number
        bill_number = f"BILL-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        
        bill = Bill(
            bill_number=bill_number,
            **bill_create.dict()
        )
        
        session.add(bill)
        created_bills.append(bill)
    
    session.commit()
    
    for bill in created_bills:
        session.refresh(bill)
    
    return created_bills

@router.put("/mark-overdue", status_code=status.HTTP_200_OK)
async def mark_overdue_bills(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Mark bills as overdue if past due date (admin only)"""
    
    # Find all pending bills that are past due date
    statement = select(Bill).where(
        and_(
            Bill.status == BillStatus.PENDING,
            Bill.due_date < datetime.utcnow()
        )
    )
    
    bills = session.exec(statement).all()
    updated_count = 0
    
    for bill in bills:
        bill.status = BillStatus.OVERDUE
        bill.updated_at = datetime.utcnow()
        session.add(bill)
        updated_count += 1
        
        # Send overdue notification
        notification = Notification(
            title="Bill Overdue",
            content=f"Your bill {bill.bill_number} - {bill.title} is now overdue. Amount: {bill.amount} VND. Please make payment as soon as possible.",
            type=NotificationType.BILL_REMINDER,
            priority=4,  # Urgent
            target_audience=f"user_{bill.user_id}",
            status=NotificationStatus.SENT,
            sent_at=datetime.utcnow(),
            created_by=current_user.id
        )
        session.add(notification)
    
    session.commit()
    
    return {
        "message": "Overdue bills marked successfully",
        "updated_count": updated_count
    }