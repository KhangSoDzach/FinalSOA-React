from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime
import uuid
import os
from app.core.database import get_session
from app.api.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.cashflow import CashFlow, BankStatement, CashFlowType
from app.schemas.cashflow import (
    CashFlowCreate, CashFlowUpdate, CashFlowResponse,
    BankStatementCreate, BankStatementResponse, ReconcileRequest
)
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[CashFlowResponse])
async def get_cash_flows(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    type: Optional[CashFlowType] = None,
    account_type: Optional[str] = None,
    reconciled: Optional[bool] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get cash flow records (admin only)"""
    statement = select(CashFlow)
    
    if type:
        statement = statement.where(CashFlow.type == type)
    if account_type:
        statement = statement.where(CashFlow.account_type == account_type)
    if reconciled is not None:
        statement = statement.where(CashFlow.reconciled == reconciled)
    
    statement = statement.offset(skip).limit(limit).order_by(CashFlow.date.desc())
    cash_flows = session.exec(statement).all()
    
    return cash_flows

@router.post("/", response_model=CashFlowResponse)
async def create_cash_flow(
    cash_flow_create: CashFlowCreate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Create new cash flow record (admin only)"""
    # Generate unique transaction number
    transaction_number = f"CF-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    cash_flow = CashFlow(
        transaction_number=transaction_number,
        created_by=current_user.id,
        **cash_flow_create.dict()
    )
    
    session.add(cash_flow)
    session.commit()
    session.refresh(cash_flow)
    
    return cash_flow

@router.get("/{cash_flow_id}", response_model=CashFlowResponse)
async def get_cash_flow(
    cash_flow_id: int,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get cash flow by ID (admin only)"""
    cash_flow = session.get(CashFlow, cash_flow_id)
    if not cash_flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cash flow record not found"
        )
    return cash_flow

@router.put("/{cash_flow_id}", response_model=CashFlowResponse)
async def update_cash_flow(
    cash_flow_id: int,
    cash_flow_update: CashFlowUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Update cash flow record (admin only)"""
    cash_flow = session.get(CashFlow, cash_flow_id)
    if not cash_flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cash flow record not found"
        )
    
    update_data = cash_flow_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cash_flow, field, value)
    
    cash_flow.updated_at = datetime.utcnow()
    session.add(cash_flow)
    session.commit()
    session.refresh(cash_flow)
    
    return cash_flow

@router.post("/{cash_flow_id}/upload-evidence")
async def upload_evidence(
    cash_flow_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Upload evidence for cash flow record (admin only)"""
    cash_flow = session.get(CashFlow, cash_flow_id)
    if not cash_flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cash flow record not found"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"cashflow_{cash_flow_id}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    cash_flow.evidence_url = file_path
    session.add(cash_flow)
    session.commit()
    
    return {"message": "Evidence uploaded successfully", "file_path": file_path}

@router.post("/reconcile")
async def reconcile_cash_flows(
    reconcile_request: ReconcileRequest,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Reconcile cash flow records (admin only)"""
    cash_flows = session.exec(
        select(CashFlow).where(CashFlow.id.in_(reconcile_request.cash_flow_ids))
    ).all()
    
    if len(cash_flows) != len(reconcile_request.cash_flow_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Some cash flow records not found"
        )
    
    for cash_flow in cash_flows:
        cash_flow.reconciled = True
        cash_flow.reconciled_at = datetime.utcnow()
        cash_flow.reconciled_by = current_user.id
        session.add(cash_flow)
    
    session.commit()
    
    return {"message": f"Reconciled {len(cash_flows)} cash flow records"}

@router.get("/my-receipts", response_model=List[CashFlowResponse])
async def get_my_receipts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's payment receipts"""
    # This would typically be linked to payments made by the user
    # For now, we'll return empty list - this would need to be implemented
    # based on the relationship between payments and cash flow records
    return []

# Bank Statement endpoints
@router.post("/bank-statements", response_model=BankStatementResponse)
async def upload_bank_statement(
    bank_statement: BankStatementCreate,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Upload bank statement (admin only)"""
    # Create upload directory if it doesn't exist
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"bank_statement_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    statement = BankStatement(
        statement_file_url=file_path,
        uploaded_by=current_user.id,
        **bank_statement.dict()
    )
    
    session.add(statement)
    session.commit()
    session.refresh(statement)
    
    return statement

@router.get("/bank-statements", response_model=List[BankStatementResponse])
async def get_bank_statements(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    bank_account: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """Get bank statements (admin only)"""
    statement = select(BankStatement)
    
    if bank_account:
        statement = statement.where(BankStatement.bank_account == bank_account)
    
    statement = statement.offset(skip).limit(limit).order_by(BankStatement.statement_date.desc())
    statements = session.exec(statement).all()
    
    return statements