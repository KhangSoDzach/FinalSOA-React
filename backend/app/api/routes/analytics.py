from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func, and_, or_
from sqlalchemy.sql import extract
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from ...core.database import get_session
from ...core.security import get_current_user
from ...models.user import User
from ...models.bill import Bill, BillStatus
from ...models.apartment import Apartment, ApartmentStatus
from ...models.ticket import Ticket, TicketCategory, TicketStatus

router = APIRouter()


@router.get("/occupancy-rate")
def get_occupancy_rate(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy tỷ lệ lấp đầy (Occupancy Rate) của tòa nhà
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Tổng số căn hộ
    total_apartments = session.exec(select(func.count(Apartment.id))).one()
    
    # Số căn hộ đã có người ở
    occupied_apartments = session.exec(
        select(func.count(Apartment.id))
        .where(Apartment.status == ApartmentStatus.OCCUPIED)
    ).one()
    
    # Số căn hộ trống
    available_apartments = session.exec(
        select(func.count(Apartment.id))
        .where(Apartment.status == ApartmentStatus.AVAILABLE)
    ).one()
    
    # Số căn hộ đang bảo trì
    maintenance_apartments = session.exec(
        select(func.count(Apartment.id))
        .where(Apartment.status == ApartmentStatus.MAINTENANCE)
    ).one()
    
    occupancy_rate = (occupied_apartments / total_apartments * 100) if total_apartments > 0 else 0
    
    return {
        "total": total_apartments,
        "occupied": occupied_apartments,
        "available": available_apartments,
        "maintenance": maintenance_apartments,
        "occupancy_rate": round(occupancy_rate, 2)
    }


@router.get("/monthly-revenue")
def get_monthly_revenue(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    months: int = 12
):
    """
    Lấy doanh thu theo tháng trong X tháng gần đây
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Lấy dữ liệu doanh thu theo tháng
    revenue_data = []
    current_date = datetime.utcnow()
    
    for i in range(months - 1, -1, -1):
        # Tính tháng cần query
        target_date = current_date - timedelta(days=30 * i)
        month = target_date.month
        year = target_date.year
        
        # Tổng doanh thu đã thu (bills đã paid)
        paid_revenue = session.exec(
            select(func.coalesce(func.sum(Bill.amount), 0))
            .where(
                and_(
                    Bill.status == BillStatus.PAID,
                    extract('month', Bill.paid_at) == month,
                    extract('year', Bill.paid_at) == year
                )
            )
        ).one()
        
        # Tổng doanh thu dự kiến (tất cả bills của tháng đó)
        expected_revenue = session.exec(
            select(func.coalesce(func.sum(Bill.amount), 0))
            .where(
                and_(
                    extract('month', Bill.due_date) == month,
                    extract('year', Bill.due_date) == year
                )
            )
        ).one()
        
        month_name = target_date.strftime('%b %Y')
        
        revenue_data.append({
            "month": month_name,
            "year": year,
            "month_number": month,
            "paid": float(paid_revenue or 0),
            "expected": float(expected_revenue or 0)
        })
    
    return revenue_data


@router.get("/outstanding-bills")
def get_outstanding_bills(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thống kê công nợ chưa thu
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Tổng số tiền pending
    pending_amount = session.exec(
        select(func.coalesce(func.sum(Bill.amount), 0))
        .where(Bill.status == BillStatus.PENDING)
    ).one()
    
    # Tổng số tiền overdue
    overdue_amount = session.exec(
        select(func.coalesce(func.sum(Bill.amount), 0))
        .where(Bill.status == BillStatus.OVERDUE)
    ).one()
    
    # Số lượng bills pending
    pending_count = session.exec(
        select(func.count(Bill.id))
        .where(Bill.status == BillStatus.PENDING)
    ).one()
    
    # Số lượng bills overdue
    overdue_count = session.exec(
        select(func.count(Bill.id))
        .where(Bill.status == BillStatus.OVERDUE)
    ).one()
    
    total_outstanding = float(pending_amount or 0) + float(overdue_amount or 0)
    
    return {
        "total_outstanding": total_outstanding,
        "pending": {
            "amount": float(pending_amount or 0),
            "count": pending_count
        },
        "overdue": {
            "amount": float(overdue_amount or 0),
            "count": overdue_count
        }
    }


@router.get("/top-debtors")
def get_top_debtors(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = 5
):
    """
    Lấy top N căn hộ nợ tiền nhiều nhất
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Query để lấy tổng nợ theo user
    query = (
        select(
            User.id,
            User.full_name,
            User.apartment_number,
            User.phone,
            func.sum(Bill.amount).label('total_debt'),
            func.count(Bill.id).label('bill_count')
        )
        .join(Bill, Bill.user_id == User.id)
        .where(
            or_(
                Bill.status == BillStatus.PENDING,
                Bill.status == BillStatus.OVERDUE
            )
        )
        .group_by(User.id, User.full_name, User.apartment_number, User.phone)
        .order_by(func.sum(Bill.amount).desc())
        .limit(limit)
    )
    
    results = session.exec(query).all()
    
    top_debtors = []
    for result in results:
        top_debtors.append({
            "user_id": result[0],
            "name": result[1],
            "apartment_number": result[2],
            "phone": result[3],
            "total_debt": float(result[4] or 0),
            "bill_count": result[5]
        })
    
    return top_debtors


@router.get("/ticket-heatmap")
def get_ticket_heatmap(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thống kê tickets theo category (Complaint by Category)
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Query để đếm tickets theo category
    query = (
        select(
            Ticket.category,
            func.count(Ticket.id).label('count')
        )
        .group_by(Ticket.category)
        .order_by(func.count(Ticket.id).desc())
    )
    
    results = session.exec(query).all()
    
    # Thống kê theo status cho mỗi category
    category_data = []
    for category, count in results:
        # Đếm theo status
        open_count = session.exec(
            select(func.count(Ticket.id))
            .where(
                and_(
                    Ticket.category == category,
                    Ticket.status == TicketStatus.OPEN
                )
            )
        ).one()
        
        in_progress_count = session.exec(
            select(func.count(Ticket.id))
            .where(
                and_(
                    Ticket.category == category,
                    Ticket.status == TicketStatus.IN_PROGRESS
                )
            )
        ).one()
        
        resolved_count = session.exec(
            select(func.count(Ticket.id))
            .where(
                and_(
                    Ticket.category == category,
                    Ticket.status == TicketStatus.RESOLVED
                )
            )
        ).one()
        
        category_data.append({
            "category": category.value,
            "total": count,
            "open": open_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count
        })
    
    return category_data


@router.get("/dashboard-summary")
def get_dashboard_summary(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy tổng hợp tất cả dữ liệu cho dashboard (để giảm số lượng API calls)
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "occupancy_rate": get_occupancy_rate(session=session, current_user=current_user),
        "monthly_revenue": get_monthly_revenue(session=session, current_user=current_user, months=6),
        "outstanding_bills": get_outstanding_bills(session=session, current_user=current_user),
        "top_debtors": get_top_debtors(session=session, current_user=current_user, limit=5),
        "ticket_heatmap": get_ticket_heatmap(session=session, current_user=current_user)
    }
